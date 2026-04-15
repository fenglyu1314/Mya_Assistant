# Spec: 离线支持引擎（Offline Sync Engine）

## 概述

为 Mya Assistant 提供离线优先的数据同步基础设施。用户操作先写入本地 SQLite，再异步同步到 Supabase 后端。断网期间操作正常排队，恢复网络后自动推送并拉取最新数据，利用字段级合并策略解决冲突。

## 数据模型

### pending_operations 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER (PK, 自增) | 操作 ID |
| table_name | TEXT | 目标表名：'notes' / 'todos' / 'schedules' |
| operation | TEXT | 操作类型：'create' / 'update' / 'delete' |
| record_id | TEXT | 目标记录 ID |
| payload | TEXT | JSON 序列化的变更字段 |
| base_version | INTEGER | 操作时记录的 _version |
| created_at | TEXT | ISO 8601 时间戳 |

### sync_meta 表

| 字段 | 类型 | 说明 |
|------|------|------|
| key | TEXT (PK) | 元数据键名 |
| value | TEXT | 元数据值 |

**预设 key**：
- `schema_version` — 当前 schema 版本号
- `notes_last_synced_at` — notes 表最后同步时间
- `todos_last_synced_at` — todos 表最后同步时间
- `schedules_last_synced_at` — schedules 表最后同步时间

## 核心接口

### LocalDB

```typescript
// SQLite 执行器接口（由平台端注入）
interface SQLiteExecutor {
  execute(sql: string, params?: unknown[]): { rows: Record<string, unknown>[] }
  executeAsync(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>
}

// 本地数据库抽象
interface LocalDB {
  initialize(): Promise<void>
  getAll<T>(table: SyncableTable, excludeDeleted?: boolean): T[]
  getById<T>(table: SyncableTable, id: string): T | null
  upsert<T extends BaseModel>(table: SyncableTable, record: T): void
  upsertBatch<T extends BaseModel>(table: SyncableTable, records: T[]): void
  markDeleted(table: SyncableTable, id: string): void
  enqueuePending(op: Omit<PendingOperation, 'id'>): void
  dequeuePending(id: number): void
  getAllPending(): PendingOperation[]
  getPendingCount(): number
  getLastSyncedAt(table: SyncableTable): string | null
  setLastSyncedAt(table: SyncableTable, timestamp: string): void
}
```

### PendingQueue

```typescript
interface PendingQueue {
  enqueue(op: Omit<PendingOperation, 'id'>): void
  dequeue(id: number): void
  peek(limit?: number): PendingOperation[]
  getCount(): number
  optimize(): void  // 执行队列合并优化
}
```

### SyncManager

```typescript
interface SyncManager {
  push(): Promise<void>
  pull(table: SyncableTable): Promise<void>
  pullAll(): Promise<void>
  flush(): Promise<void>      // push + pullAll
  initialSync(): Promise<void> // 首次全量拉取
  fieldMerge<T extends BaseModel>(
    local: T,
    remote: T,
    pendingPayload: Partial<T>
  ): T
}
```

### NetworkMonitor

```typescript
interface NetworkMonitor {
  isOnline(): boolean
  subscribe(callback: (online: boolean) => void): Unsubscribe
  dispose(): void
}
```

### OfflineEngine

```typescript
interface OfflineEngineConfig {
  networkMonitor: NetworkMonitor
  sqliteExecutor: SQLiteExecutor
}

interface OfflineEngine {
  initialize(config: OfflineEngineConfig): Promise<void>
  sync(): Promise<void>
  getSyncStatus(): SyncStatus
  dispose(): void
  getLocalDB(): LocalDB
  getPendingQueue(): PendingQueue
}
```

## 同步协议

### Push 流程

1. 从 pending_operations 按 `created_at ASC` 取操作
2. 对每条操作：
   - `create`: 调用 `SupabaseAdapter.create(payload)`，成功后用返回的完整记录（含服务端生成的字段）更新本地 SQLite
   - `update`: 调用 `SupabaseAdapter.update(id, payload)`，比较返回的 `_version`
     - 无冲突（`_version = base_version + 1`）→ 更新本地
     - 有冲突（`_version > base_version + 1`）→ 触发 fieldMerge
   - `delete`: 调用 `SupabaseAdapter.remove(id)`
3. 成功后 `dequeuePending(id)`
4. 网络错误 → 保留在队列中，等待重试

### Pull 流程

1. 读取 `{table}_last_synced_at`
2. 调用 `SupabaseAdapter.fetchUpdatedSince(since)`
3. 对每条远端记录：
   - 本地不存在 → `upsert`
   - 本地存在 + 无 pending 操作 → `upsert`（远端覆盖）
   - 本地存在 + 有 pending 操作 → `fieldMerge`
4. 更新 `{table}_last_synced_at = max(records.updated_at)`

### 字段级冲突合并

```
输入: local（本地记录）, remote（远端记录）, pendingPayload（本地变更字段集合）

对 pendingPayload 中的每个字段 key:
  remoteChanged = remote[key] !== local[key]（不考虑 pending 变更）
  if remoteChanged:
    result[key] = remote[key]     // 远端优先
  else:
    result[key] = pendingPayload[key]  // 保留本地变更

对不在 pendingPayload 中的字段:
  result[key] = remote[key]       // 取远端最新值

输出: 合并后的完整记录
```

## 队列合并规则

| 已有操作 | 新操作 | 结果 |
|---------|--------|------|
| create | update | 合并 update 字段到 create 的 payload |
| create | delete | 两条都移除 |
| update | update | 合并字段（新值覆盖旧值） |
| update | delete | 移除 update，保留 delete |

## 约束

- 本地 SQLite 数据库文件名：`mya_assistant.db`
- 首次启动（无本地数据）必须完成 initialSync 后才标记为就绪
- 离线创建的记录使用 `uuid v4` 生成 ID（与 Supabase 默认的 uuid 兼容）
- `_version` 字段由 Supabase 数据库触发器自动递增，本地不修改
- pending_operations 最大队列深度无硬限制，但超过 1000 条时在日志中警告
- 所有 SQLite 操作使用同步 API（op-sqlite 支持），避免异步竞态
