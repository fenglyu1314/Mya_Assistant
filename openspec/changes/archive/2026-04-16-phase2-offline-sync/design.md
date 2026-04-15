# Design: phase2-offline-sync

## 架构总览

```
┌─────────────────────────────────────────────────┐
│                  UI / Screens                    │
└─────────────────┬───────────────────────────────┘
                  │ 读/写
┌─────────────────▼───────────────────────────────┐
│          Zustand Stores（改造后）                 │
│  读 → SQLite（同步响应）                         │
│  写 → SQLite + enqueue pending operation        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│            OfflineEngine（新增核心）              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────┐│
│  │ LocalDB      │  │ SyncManager  │  │ Network ││
│  │ (SQLite)     │  │ (冲突合并)    │  │ Monitor ││
│  └──────┬──────┘  └──────┬───────┘  └────┬────┘│
│         │                │               │      │
└─────────┼────────────────┼───────────────┼──────┘
          │                │               │
┌─────────▼────────────────▼───────────────▼──────┐
│              SupabaseAdapter（现有）              │
│          Supabase Realtime（现有）                │
└─────────────────────────────────────────────────┘
```

## 模块设计

### 1. LocalDB — 本地 SQLite 管理

**位置**: `packages/shared/src/offline/local-db.ts`

**职责**：管理本地 SQLite 数据库的初始化、迁移和 CRUD。

**技术选型**：`op-sqlite`
- React Native 高性能同步 SQLite 驱动
- 支持 TypedArray、批量操作
- 同步 API，无需 bridge 异步开销

**数据库 Schema**：

```sql
-- 本地镜像表，结构与 Supabase 表一致
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  images TEXT NOT NULL DEFAULT '[]',   -- JSON array
  pinned INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',     -- JSON array
  _deleted INTEGER NOT NULL DEFAULT 0,
  _version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  due_date TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  done INTEGER NOT NULL DEFAULT 0,
  done_at TEXT,
  schedule_id TEXT,
  parent_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',
  _deleted INTEGER NOT NULL DEFAULT 0,
  _version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  all_day INTEGER NOT NULL DEFAULT 0,
  remind_at TEXT NOT NULL DEFAULT '[]',
  repeat_rule TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  color TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  _deleted INTEGER NOT NULL DEFAULT 0,
  _version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 操作队列
CREATE TABLE IF NOT EXISTS pending_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,          -- 'notes' | 'todos' | 'schedules'
  operation TEXT NOT NULL,           -- 'create' | 'update' | 'delete'
  record_id TEXT NOT NULL,           -- 目标记录 ID
  payload TEXT NOT NULL DEFAULT '{}', -- JSON：变更的字段 payload
  base_version INTEGER NOT NULL,      -- 操作时记录的 _version
  created_at TEXT NOT NULL
);

-- 同步元数据
CREATE TABLE IF NOT EXISTS sync_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- 存储 last_synced_at（每张表的最新 updated_at 水位线）
```

**核心接口**：

```typescript
interface LocalDB {
  // 初始化数据库并运行迁移
  initialize(): Promise<void>

  // 通用 CRUD
  getAll<T>(table: string, filters?: LocalFilter[]): T[]
  getById<T>(table: string, id: string): T | null
  upsert<T>(table: string, record: T): void
  markDeleted(table: string, id: string): void

  // 操作队列
  enqueuePending(op: PendingOperation): void
  dequeuePending(id: number): void
  getAllPending(): PendingOperation[]
  getPendingCount(): number

  // 同步元数据
  getLastSyncedAt(table: string): string | null
  setLastSyncedAt(table: string, timestamp: string): void
}
```

**SQLite 类型映射约定**：
- `boolean` → `INTEGER`（0/1）
- `string[]` / JSON 字段 → `TEXT`（JSON.stringify / JSON.parse）
- `null` → SQL `NULL`

**Schema 迁移**：使用 `sync_meta` 表存储 `schema_version`，启动时检查版本号并执行增量 migration。初始版本为 `1`。

---

### 2. PendingQueue — 操作队列管理

**位置**: `packages/shared/src/offline/pending-queue.ts`

**职责**：管理离线操作的入队、出队、合并和重试。

**入队规则**：
- `create`：记录完整 payload
- `update`：仅记录变更的字段（diff），不是全量
- `delete`：payload 为空

**队列合并优化**：
- 对同一 record_id 的连续 `update` 操作合并为一条（字段取并集，值取最新）
- `create` 后跟 `update` → 合并到 `create` 的 payload 中
- `create` 后跟 `delete` → 两条都删除（取消创建）
- `update` 后跟 `delete` → 删除 `update`，保留 `delete`

**重试策略**：
- 单条操作推送失败后标记 retry_count++
- 指数退避：1s → 2s → 4s → 8s → 最大 30s
- 超过 10 次重试的操作标记为 `failed`，等待用户干预或下次全量同步

---

### 3. SyncManager — 同步协调器

**位置**: `packages/shared/src/offline/sync-manager.ts`

**职责**：协调推送（push）和拉取（pull），处理冲突合并。

**同步流程**：

#### Push（推送本地变更）

```
1. 从 pending_operations 取出最早的一批操作（按 created_at 排序）
2. 逐条执行：
   a. create → SupabaseAdapter.create(payload)
   b. update → SupabaseAdapter.update(id, payload)
      - 检查返回的 _version 是否 = base_version + 1
      - 如果后端 _version > base_version + 1 → 触发冲突解决
   c. delete → SupabaseAdapter.remove(id)
3. 成功后从队列中移除（dequeuePending）
4. 更新本地记录的 _version
```

#### Pull（拉取远端变更）

```
1. 读取 sync_meta 中该表的 last_synced_at
2. 通过 SupabaseAdapter 查询 updated_at > last_synced_at 的记录
3. 对每条远端记录：
   a. 如果本地不存在 → 插入 SQLite
   b. 如果本地存在且无 pending 操作 → 直接覆盖
   c. 如果本地存在且有 pending 操作 → 触发冲突合并
4. 更新 last_synced_at 为本批次最大的 updated_at
5. 通知 Store 刷新
```

#### 冲突合并（Field-level Merge）

```
输入：localRecord（本地版本）、remoteRecord（远端版本）、pendingPayload（本地变更字段集）

1. 遍历 pendingPayload 中每个变更字段：
   a. 如果该字段在 remoteRecord 中未变（与 localRecord 相同） → 保留本地值
   b. 如果该字段在 remoteRecord 中也变了（与 localRecord 不同） → 远端优先
2. 合并结果 = remoteRecord + 本地独有变更字段
3. 写入本地 SQLite + 推送到后端
4. 清除已解决的 pending operation
```

**SupabaseAdapter 扩展**：
- 新增 `fetchUpdatedSince(since: string): Promise<T[]>` 方法
  - 查询 `updated_at > since` 的记录（包括 `_deleted: true` 的记录，以同步删除操作）

---

### 4. NetworkMonitor — 网络状态监听

**位置**: `packages/shared/src/offline/network-monitor.ts`

**职责**：监听网络状态变化，触发同步动作。

**实现**：
- 抽象接口 `NetworkMonitor`，平台端提供具体实现
- 移动端实现基于 `@react-native-community/netinfo`
- 状态变化回调通知 SyncManager

```typescript
interface NetworkMonitor {
  // 当前网络是否可用
  isOnline(): boolean

  // 订阅网络状态变化，返回取消订阅函数
  subscribe(callback: (online: boolean) => void): Unsubscribe

  // 清理资源
  dispose(): void
}
```

**触发逻辑**：
- 离线 → 在线：延迟 1 秒后触发 SyncManager.flush()（避免网络抖动）
- 在线 → 离线：标记状态，后续操作只写本地

---

### 5. Store 层改造

**改造范围**：`notes-store.ts`、`todos-store.ts`、`schedules-store.ts`

**改造策略**：

```
改造前（现有）：
  fetch → SupabaseAdapter.getAll() → set(data)
  create → SupabaseAdapter.create() → set(append)
  update → SupabaseAdapter.update() → set(merge)
  delete → SupabaseAdapter.remove() → set(filter)

改造后（离线优先）：
  fetch → LocalDB.getAll() → set(data)            // 本地优先
  create → LocalDB.upsert() + enqueue → set(append) // 写本地 + 入队
  update → LocalDB.upsert() + enqueue → set(merge)
  delete → LocalDB.markDeleted() + enqueue → set(filter)

  initialize → LocalDB 加载 → 触发 pull            // 冷启动
  subscribeRealtime → 远端事件 → 更新 SQLite + Store  // 实时同步
```

**关键原则**：
- **UI 响应不阻塞**：所有 Store 操作同步写入 SQLite，立即更新 UI 状态
- **网络操作异步**：推送/拉取在后台队列中进行
- **Realtime 保留**：在线时继续接收 Realtime 推送，直接更新本地 SQLite 和 Store

---

### 6. OfflineEngine — 统一入口

**位置**: `packages/shared/src/offline/index.ts`

**职责**：组装和暴露 LocalDB + SyncManager + NetworkMonitor 的统一初始化 API。

```typescript
interface OfflineEngine {
  // 初始化离线引擎（创建 DB、启动网络监听、执行初始 pull）
  initialize(config: { networkMonitor: NetworkMonitor }): Promise<void>

  // 手动触发同步
  sync(): Promise<void>

  // 获取同步状态
  getSyncStatus(): SyncStatus

  // 关闭引擎（清理资源）
  dispose(): void
}

interface SyncStatus {
  isOnline: boolean
  pendingCount: number
  lastSyncedAt: string | null
  isSyncing: boolean
}
```

---

## 文件结构

```
packages/shared/src/offline/
├── index.ts              # OfflineEngine 统一入口 + 导出
├── local-db.ts           # LocalDB SQLite 管理
├── pending-queue.ts      # 操作队列管理
├── sync-manager.ts       # 推送/拉取/冲突合并
├── network-monitor.ts    # 网络状态抽象接口
└── types.ts              # 离线模块类型定义

packages/mobile/src/offline/
├── index.ts              # 移动端离线引擎初始化
└── rn-network-monitor.ts # React Native NetworkMonitor 实现
```

## 依赖新增

| 包 | 安装位置 | 用途 |
|---|---|---|
| `@op-engineering/op-sqlite` | `packages/mobile` | React Native SQLite 驱动 |
| `@react-native-community/netinfo` | `packages/mobile` | 网络状态监听 |
| `uuid` | `packages/shared` | 离线创建记录时生成 ID |

## 边界约束

- 离线引擎代码放在 `packages/shared/src/offline/`，保持平台无关
- 平台相关实现（如 NetworkMonitor、SQLite 驱动初始化）放在对应端的包中
- `LocalDB` 的 SQLite 实际实例由移动端注入（依赖倒置），共享层不直接引用 `op-sqlite`
- 不改变现有 `SyncAdapter` 接口（仅扩展 `SupabaseAdapter` 添加 `fetchUpdatedSince`）
