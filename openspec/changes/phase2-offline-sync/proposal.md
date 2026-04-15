# Proposal: phase2-offline-sync

> **Phase**: Phase 2 — 核心功能 + 离线同步
> **Roadmap 交付物**: 离线支持引擎

## 背景

当前 Mya Assistant 的三个 Store（notes / todos / schedules）均直接依赖 `SupabaseAdapter` 进行远程 CRUD，每次操作都需要网络连接。在无网络或网络不稳定的场景下（如地铁、飞机、信号弱区域），用户无法进行任何数据操作，体验极差。

Phase 2 Roadmap 明确要求：「断网状态下可正常操作，联网后自动同步且字段级合并无数据丢失」。

## 目标

建立**离线优先**的数据同步基础设施：用户操作始终先写入本地 SQLite，再异步同步到后端。断网期间操作正常排队，恢复网络后自动推送并拉取最新数据，利用字段级合并策略解决冲突。

## 范围

### 包含

1. **本地 SQLite 缓存层**
   - 在移动端引入 SQLite（使用 `op-sqlite`，React Native 高性能 SQLite 库）
   - 为 notes / todos / schedules 三张表建立本地镜像表
   - 所有读操作优先从本地 SQLite 取数据
   - 启动时执行初始全量拉取（pull），后续增量同步

2. **操作队列（Pending Operations Queue）**
   - 用户的 create / update / delete 操作先写入本地 SQLite，同时入队 pending_operations 表
   - 每条 pending operation 记录：表名、操作类型、记录 ID、变更字段 payload、时间戳
   - 有网时立即按 FIFO 顺序推送；无网时持久化等待

3. **网络状态感知 + 自动同步**
   - 监听网络连接状态变化（`@react-native-community/netinfo`）
   - 网络恢复时自动触发 flush：批量推送队列中的 pending operations
   - 推送完成后执行增量拉取（基于 `updated_at` 水位线）

4. **字段级冲突合并**
   - 利用 `BaseModel._version` 字段做乐观锁检测
   - 推送时携带 `_version`，后端 _version 不匹配说明有远端更新
   - 冲突时：拉取最新远端记录，对比本地变更的字段与远端变更的字段
   - 不同字段 → 自动合并；相同字段 → 远端优先（last-write-wins）
   - 合并后重新推送

5. **Store 层改造**
   - 改造三个 Store，使读写操作走本地 SQLite 而非直接走 SupabaseAdapter
   - Store 初始化时从 SQLite 加载数据，UI 响应更快
   - Realtime 订阅保留，用于实时接收远端推送并更新本地 SQLite + Store

### 不包含

- Web 端 / 桌面端离线支持（Phase 3 再考虑对应平台的持久化方案）
- 文件/图片附件的离线缓存（后续 Phase 4 可能涉及）
- 端到端加密
- 离线登录/注册（需要网络完成 Auth）

## 成功标准

1. 断网状态下可正常创建/编辑/删除 notes、todos、schedules
2. 联网后 pending 操作在 5 秒内自动同步到后端
3. 两端同时修改同一记录的**不同字段**时，自动合并结果正确
4. 两端同时修改同一记录的**相同字段**时，不丢数据、不崩溃（远端优先）
5. 首次启动（冷启动）先展示本地缓存数据，再静默同步远端增量
6. SQLite 初始化和迁移无报错，schema 版本可升级
