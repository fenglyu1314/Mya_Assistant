# Tasks: phase2-offline-sync

> 所有任务按依赖顺序排列。每个任务标注预计涉及的文件和验收条件。

---

## Task 1：离线模块类型定义

**状态**: `pending`

**描述**：定义离线模块所需的所有 TypeScript 类型和接口。

**涉及文件**：
- 新增 `packages/shared/src/offline/types.ts`

**内容**：
- `PendingOperation` 接口（table_name, operation, record_id, payload, base_version, created_at）
- `OperationType` 类型（'create' | 'update' | 'delete'）
- `SyncStatus` 接口（isOnline, pendingCount, lastSyncedAt, isSyncing）
- `NetworkMonitor` 抽象接口（isOnline, subscribe, dispose）
- `LocalDBAdapter` 接口（initialize, getAll, getById, upsert, markDeleted 等）
- `SyncableTable` 类型（'notes' | 'todos' | 'schedules'）
- `ConflictResult` 接口（合并结果）

**验收条件**：
- 类型文件通过 `tsc --noEmit` 检查
- 覆盖设计文档中提到的所有接口

---

## Task 2：LocalDB — SQLite 抽象层

**状态**: `pending`
**依赖**: Task 1

**描述**：实现平台无关的本地数据库抽象层，包括 schema 初始化、通用 CRUD、操作队列管理和同步元数据管理。

**涉及文件**：
- 新增 `packages/shared/src/offline/local-db.ts`

**内容**：
- `LocalDB` 类，接收 SQLite 执行器接口（由平台端注入）
- `initialize()`: 创建表 + schema 迁移（使用 sync_meta 表中的 schema_version 控制）
- notes / todos / schedules 三张本地镜像表的 DDL
- pending_operations 表和 sync_meta 表的 DDL
- `getAll<T>(table, filters?)`: 从本地查询（自动 JSON.parse 数组字段）
- `getById<T>(table, id)`: 按 ID 查询
- `upsert<T>(table, record)`: INSERT OR REPLACE（自动 JSON.stringify 数组字段）
- `markDeleted(table, id)`: 设置 _deleted = 1
- `enqueuePending(op)` / `dequeuePending(id)` / `getAllPending()` / `getPendingCount()`
- `getLastSyncedAt(table)` / `setLastSyncedAt(table, timestamp)`
- SQLite 类型映射：boolean↔INTEGER(0/1)，string[]↔TEXT(JSON)

**验收条件**：
- 类型检查通过
- 初始化后三张镜像表 + pending_operations + sync_meta 表正确创建
- CRUD 操作正确处理 JSON 字段的序列化/反序列化
- schema 迁移机制可工作（版本号递增）

---

## Task 3：PendingQueue — 操作队列

**状态**: `pending`
**依赖**: Task 2

**描述**：实现操作队列的入队、出队和合并优化逻辑。

**涉及文件**：
- 新增 `packages/shared/src/offline/pending-queue.ts`

**内容**：
- `PendingQueue` 类，接收 `LocalDB` 实例
- `enqueue(op)`: 写入 pending_operations + 触发合并优化
- `dequeue(id)`: 删除已完成的操作
- `peek(limit?)`: 按 created_at 排序取出待推送的操作
- `getCount()`: 返回队列长度
- 合并优化逻辑：
  - 同一 record_id 连续 update → 字段合并
  - create + update → 合并到 create payload
  - create + delete → 两条都移除
  - update + delete → 移除 update，保留 delete

**验收条件**：
- 类型检查通过
- 合并逻辑按设计文档的四种规则正确工作

---

## Task 4：SupabaseAdapter 扩展

**状态**: `pending`
**依赖**: Task 1

**描述**：为 SupabaseAdapter 新增增量拉取方法。

**涉及文件**：
- 修改 `packages/shared/src/sync/supabase-adapter.ts`
- 修改 `packages/shared/src/sync/sync-adapter.ts`（可选，接口级扩展）

**内容**：
- 新增 `fetchUpdatedSince(since: string): Promise<T[]>` 方法
  - 查询 `updated_at > since` 的记录
  - **包括** `_deleted: true` 的记录（以同步删除操作）
  - 不应用默认的 `_deleted = false` 过滤
- 在 `SyncAdapter` 接口中新增此方法（可选实现，不强制）

**验收条件**：
- 类型检查通过
- `fetchUpdatedSince` 返回指定时间后的所有变更记录（包含已删除记录）

---

## Task 5：SyncManager — 推送/拉取/冲突合并

**状态**: `pending`
**依赖**: Task 2, Task 3, Task 4

**描述**：实现核心同步协调器，包括 push、pull 和字段级冲突合并。

**涉及文件**：
- 新增 `packages/shared/src/offline/sync-manager.ts`

**内容**：
- `SyncManager` 类，接收 LocalDB + PendingQueue + SupabaseAdapter 映射
- `push()`: 从队列取出 pending 操作，逐条推送到后端
  - create → adapter.create(payload)
  - update → adapter.update(id, payload)，检测 _version 冲突
  - delete → adapter.remove(id)
  - 成功后 dequeue + 更新本地 _version
  - 失败处理：网络错误 → 保留队列等待重试；冲突 → 触发 merge
- `pull(table)`: 增量拉取远端变更
  - 读取 lastSyncedAt → fetchUpdatedSince → upsert 本地
  - 有 pending 操作的记录触发冲突检测
  - 更新 lastSyncedAt
- `fieldMerge(local, remote, pendingPayload)`: 字段级合并
  - 遍历 pendingPayload 的 key
  - 本地独有变更 → 保留；双方都变 → 远端优先
  - 返回合并后的完整记录
- `flush()`: push 全部 + pull 全部（网络恢复时调用）
- `initialSync()`: 首次全量拉取（三张表都拉取完整数据）
- 重试策略：指数退避（1s→2s→4s→8s→最大30s），超过 10 次标记 failed

**验收条件**：
- 类型检查通过
- push 操作正确调用对应的 SupabaseAdapter 方法
- pull 操作正确执行增量查询和本地更新
- 冲突合并逻辑：不同字段取本地值，相同字段取远端值

---

## Task 6：NetworkMonitor 接口 + 移动端实现

**状态**: `pending`
**依赖**: Task 1

**描述**：定义网络监听抽象接口，并为移动端提供基于 NetInfo 的实现。

**涉及文件**：
- 新增 `packages/shared/src/offline/network-monitor.ts`（抽象导出，types.ts 中已有接口）
- 新增 `packages/mobile/src/offline/rn-network-monitor.ts`
- 修改 `packages/mobile/package.json`（添加 `@react-native-community/netinfo` 依赖）

**内容**：
- 共享层：从 types.ts 重新导出 `NetworkMonitor` 接口
- 移动端 `RNNetworkMonitor` 类：
  - `isOnline()`: 返回当前连接状态
  - `subscribe(callback)`: 监听 NetInfo 状态变化
    - 离线→在线时延迟 1 秒再回调（防抖/防网络抖动）
  - `dispose()`: 取消订阅

**验收条件**：
- 类型检查通过
- RNNetworkMonitor 正确封装 NetInfo API
- 包含 1 秒防抖逻辑

---

## Task 7：OfflineEngine 统一入口

**状态**: `pending`
**依赖**: Task 2, Task 3, Task 5, Task 6

**描述**：组装所有离线模块，提供统一初始化和 API。

**涉及文件**：
- 新增 `packages/shared/src/offline/index.ts`
- 修改 `packages/shared/src/index.ts`（导出离线模块）

**内容**：
- `OfflineEngine` 类：
  - `initialize(config)`: 创建 LocalDB → 初始化 schema → 创建 PendingQueue → 创建 SyncManager → 启动 NetworkMonitor → 执行 initialSync
  - `sync()`: 手动触发 flush
  - `getSyncStatus()`: 返回在线状态 + pending 数量 + 最后同步时间 + 是否正在同步
  - `dispose()`: 清理 NetworkMonitor + 停止同步
- 导出所有公开类型和类
- 移动端初始化入口 `packages/mobile/src/offline/index.ts`：
  - 注入 op-sqlite 实例和 RNNetworkMonitor
  - 调用 OfflineEngine.initialize()

**验收条件**：
- 类型检查通过
- OfflineEngine 可正确初始化所有子模块
- getSyncStatus() 返回准确状态

---

## Task 8：安装依赖 + op-sqlite 集成

**状态**: `pending`
**依赖**: Task 6

**描述**：安装必要的 npm 包并完成 op-sqlite 在移动端的集成配置。

**涉及文件**：
- 修改 `packages/mobile/package.json`
- 修改 `packages/shared/package.json`
- 修改 `packages/mobile/src/offline/index.ts`（op-sqlite 初始化）

**内容**：
- `packages/mobile`: 安装 `@op-engineering/op-sqlite`、`@react-native-community/netinfo`
- `packages/shared`: 安装 `uuid`（+ `@types/uuid`）
- op-sqlite 初始化：创建/打开数据库文件 `mya_assistant.db`
- 将 op-sqlite 执行器封装为 `LocalDBAdapter` 接口的实现并注入 LocalDB

**验收条件**：
- `pnpm install` 正常运行
- op-sqlite 在 Android 上可正常创建和操作数据库
- LocalDB 接收到 op-sqlite 执行器后可执行 SQL

---

## Task 9：Store 层改造 — notes-store

**状态**: `pending`
**依赖**: Task 7, Task 8

**描述**：改造 notes-store，使读写操作走本地 SQLite。

**涉及文件**：
- 修改 `packages/shared/src/stores/notes-store.ts`

**内容**：
- `fetchNotes`: 改为从 LocalDB.getAll('notes') 读取
- `createNote`: 改为 LocalDB.upsert + PendingQueue.enqueue，立即更新 Store
- `deleteNote`: 改为 LocalDB.markDeleted + enqueue
- `togglePin`: 改为 LocalDB.upsert + enqueue
- `subscribeRealtime`: 保留，但接收到远端事件后同时更新 SQLite
- 新增 `initializeFromLocal()`: 冷启动时从 SQLite 加载数据到 Store

**验收条件**：
- 断网时创建/删除/置顶快速记录不报错
- 恢复网络后 pending 操作自动同步到后端
- 从本地加载数据后 UI 立即显示

---

## Task 10：Store 层改造 — todos-store

**状态**: `pending`
**依赖**: Task 7, Task 8

**描述**：改造 todos-store，使读写操作走本地 SQLite。

**涉及文件**：
- 修改 `packages/shared/src/stores/todos-store.ts`

**内容**：
- `fetchTodos`: 改为从 LocalDB.getAll('todos') 读取
- `createTodo`: 改为 LocalDB.upsert + enqueue（离线时用 uuid 生成 ID）
- `updateTodo` / `toggleDone` / `reorder`: 改为 LocalDB.upsert + enqueue
- `deleteTodo`: 改为 LocalDB.markDeleted + enqueue（含子任务级联）
- `subscribeRealtime`: 接收远端事件后同时更新 SQLite
- 新增 `initializeFromLocal()`

**验收条件**：
- 断网时可创建/编辑/删除/排序/完成待办
- 子任务级联删除在离线状态下正常工作
- 恢复网络后数据正确同步

---

## Task 11：Store 层改造 — schedules-store

**状态**: `pending`
**依赖**: Task 7, Task 8

**描述**：改造 schedules-store，使读写操作走本地 SQLite。

**涉及文件**：
- 修改 `packages/shared/src/stores/schedules-store.ts`

**内容**：
- `fetchSchedules`: 改为从 LocalDB 按月份范围查询
- `createSchedule`: 改为 LocalDB.upsert + enqueue
- `updateSchedule` / `cancelSchedule` / `restoreSchedule`: 改为 LocalDB.upsert + enqueue
- `deleteSchedule`: 改为 LocalDB.markDeleted + enqueue
- `subscribeRealtime`: 接收远端事件后同时更新 SQLite
- 新增 `initializeFromLocal()`

**验收条件**：
- 断网时可创建/编辑/取消/删除日程
- 月份范围查询正确（SQLite WHERE 条件）
- 恢复网络后数据正确同步

---

## Task 12：移动端初始化集成

**状态**: `pending`
**依赖**: Task 9, Task 10, Task 11

**描述**：将离线引擎集成到移动端应用启动流程中。

**涉及文件**：
- 修改 `packages/mobile/App.tsx`
- 修改或新增 `packages/mobile/src/offline/index.ts`

**内容**：
- 在 App 启动（认证成功后）初始化 OfflineEngine：
  1. 创建 op-sqlite 数据库实例
  2. 创建 RNNetworkMonitor
  3. 调用 OfflineEngine.initialize()
  4. 各 Store 调用 initializeFromLocal() 从 SQLite 加载数据
- 用户登出时调用 OfflineEngine.dispose() 清理资源
- 在 UI 层可选展示同步状态指示器（如 pending 数量 badge）

**验收条件**：
- App 启动后，认证成功 → 离线引擎初始化 → Store 从 SQLite 加载 → UI 渲染
- 登出后离线引擎正确清理
- 冷启动时 UI 先显示本地缓存数据，后台静默同步远端增量

---

## 任务依赖图

```
Task 1 (类型定义)
├── Task 2 (LocalDB)
│   ├── Task 3 (PendingQueue)
│   │   └── Task 5 (SyncManager) ← Task 4
│   │       └── Task 7 (OfflineEngine) ← Task 6
│   │           ├── Task 9  (notes-store 改造) ← Task 8
│   │           ├── Task 10 (todos-store 改造) ← Task 8
│   │           └── Task 11 (schedules-store 改造) ← Task 8
│   │               └── Task 12 (移动端集成)
├── Task 4 (SupabaseAdapter 扩展)
└── Task 6 (NetworkMonitor)
    └── Task 8 (安装依赖)
```
