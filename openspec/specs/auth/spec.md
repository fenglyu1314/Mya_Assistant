## ADDED Requirements

### Requirement: AuthService 认证封装
共享层 SHALL 导出 `AuthService` 对象，封装 Supabase Auth API，提供以下方法：
- `signUp(email: string, password: string): Promise<AuthResult>` — 邮箱注册
- `signIn(email: string, password: string): Promise<AuthResult>` — 邮箱登录
- `signOut(): Promise<void>` — 登出
- `getSession(): Promise<Session | null>` — 获取当前会话
- `onAuthStateChange(callback: (event, session) => void): Unsubscribe` — 监听认证状态变化

`AuthResult` SHALL 包含 `user`（用户信息）和 `error`（错误信息或 null）。

#### Scenario: 邮箱注册成功
- **WHEN** 调用 `AuthService.signUp('test@example.com', 'password123')`，邮箱未被注册
- **THEN** 返回 `{ user: { id, email }, error: null }`，用户被创建到 Supabase Auth

#### Scenario: 邮箱注册失败 — 重复邮箱
- **WHEN** 调用 `AuthService.signUp('existing@example.com', 'password123')`，邮箱已被注册
- **THEN** 返回 `{ user: null, error: { message: '...' } }`，不抛出异常

#### Scenario: 邮箱登录成功
- **WHEN** 调用 `AuthService.signIn('test@example.com', 'password123')`，凭证正确
- **THEN** 返回 `{ user: { id, email }, error: null }`，Supabase 客户端自动携带 JWT

#### Scenario: 邮箱登录失败 — 密码错误
- **WHEN** 调用 `AuthService.signIn('test@example.com', 'wrongpassword')`
- **THEN** 返回 `{ user: null, error: { message: '...' } }`，不抛出异常

#### Scenario: 登出
- **WHEN** 调用 `AuthService.signOut()`
- **THEN** 本地会话被清除，后续 Supabase 请求不再携带 JWT

#### Scenario: 监听认证状态变化
- **WHEN** 调用 `AuthService.onAuthStateChange(callback)` 后用户登录
- **THEN** `callback` 被触发，收到 `SIGNED_IN` 事件和新的 session

### Requirement: useAuthStore 认证状态管理
共享层 SHALL 导出 `useAuthStore`（Zustand store），管理认证状态，包含：
- `user: User | null` — 当前登录用户
- `session: Session | null` — 当前会话
- `loading: boolean` — 认证状态加载中
- `initialize(): Promise<void>` — 初始化认证状态（检查已有会话 + 监听变化）
- `signUp(email, password): Promise<AuthResult>` — 注册并更新 store
- `signIn(email, password): Promise<AuthResult>` — 登录并更新 store
- `signOut(): Promise<void>` — 登出并清空 store

#### Scenario: 应用启动时恢复会话
- **WHEN** 应用启动调用 `useAuthStore.getState().initialize()`，用户之前已登录
- **THEN** store 的 `user` 和 `session` 被恢复，`loading` 从 `true` 变为 `false`

#### Scenario: 应用启动时无会话
- **WHEN** 应用启动调用 `initialize()`，用户未登录
- **THEN** `user` 为 `null`，`session` 为 `null`，`loading` 为 `false`

#### Scenario: 登录后 store 更新
- **WHEN** 调用 `useAuthStore.getState().signIn(email, password)` 成功
- **THEN** store 的 `user` 和 `session` 被更新为登录用户信息

#### Scenario: 登出后 store 清空
- **WHEN** 调用 `useAuthStore.getState().signOut()`
- **THEN** store 的 `user` 和 `session` 变为 `null`
