### Requirement: SyncAdapter 抽象接口
共享层 SHALL 导出 `SyncAdapter<T>` 泛型接口，定义以下方法：
- `getAll(table: string, filters?: Filter[]): Promise<T[]>` — 查询所有记录
- `getById(table: string, id: string): Promise<T | null>` — 按 ID 查询单条记录
- `create(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T>` — 创建记录
- `update(table: string, id: string, data: Partial<T>): Promise<T>` — 更新记录
- `remove(table: string, id: string): Promise<void>` — 软删除记录（设置 `_deleted: true`）
- `subscribe(table: string, callback: (payload: RealtimePayload<T>) => void): Unsubscribe` — 订阅表变更

#### Scenario: 接口可被实现
- **WHEN** 创建一个类 `class MyAdapter implements SyncAdapter<BaseModel>`
- **THEN** TypeScript 要求实现所有六个方法，缺少任何一个均报错

#### Scenario: 泛型约束
- **WHEN** 使用 `SyncAdapter<Schedule>` 类型
- **THEN** `getAll` 返回 `Promise<Schedule[]>`，`create` 接受 Schedule 字段

### Requirement: SupabaseAdapter 实现
共享层 SHALL 提供 `SupabaseAdapter` 类，实现 `SyncAdapter` 接口，底层使用 `@supabase/supabase-js` SDK。

#### Scenario: CRUD 操作
- **WHEN** 通过 SupabaseAdapter 调用 `create('notes', { content: 'test', type: 'memo', ... })`
- **THEN** 数据被写入 Supabase 的 notes 表，返回包含自动生成 `id` 和时间戳的完整记录

#### Scenario: 软删除
- **WHEN** 通过 SupabaseAdapter 调用 `remove('notes', '<id>')`
- **THEN** 该记录的 `_deleted` 字段被设为 `true`，记录仍存在于数据库中

#### Scenario: Realtime 订阅
- **WHEN** 通过 SupabaseAdapter 调用 `subscribe('notes', callback)`
- **THEN** 当 notes 表发生 INSERT / UPDATE / DELETE 时，callback 被触发并收到变更数据

#### Scenario: 取消订阅
- **WHEN** 调用 `subscribe` 返回的 `Unsubscribe` 函数
- **THEN** 后续表变更不再触发 callback

### Requirement: Supabase 客户端初始化
共享层 SHALL 提供 `createSupabaseClient(url: string, anonKey: string)` 工厂函数，返回已配置的 Supabase 客户端实例。URL 和 Key SHALL 从环境变量读取，禁止硬编码。

#### Scenario: 客户端创建成功
- **WHEN** 使用有效的 SUPABASE_URL 和 SUPABASE_ANON_KEY 调用工厂函数
- **THEN** 返回可用的 Supabase 客户端，能正常发起请求

#### Scenario: 缺少环境变量
- **WHEN** 未提供 URL 或 Key
- **THEN** 抛出明确的错误信息，提示缺少配置

### Requirement: Filter 类型
共享层 SHALL 导出 `Filter` 类型，支持基础查询条件（字段名、操作符、值），用于 `getAll` 方法的筛选参数。

#### Scenario: 按字段筛选
- **WHEN** 调用 `getAll('todos', [{ field: 'done', operator: 'eq', value: false }])`
- **THEN** 仅返回 `done` 为 `false` 的记录
