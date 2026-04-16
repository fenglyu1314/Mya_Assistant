## ADDED Requirements

### Requirement: 桌面端登录页面
桌面端 SHALL 提供 LoginPage 组件，包含邮箱和密码输入框、登录按钮、跳转注册链接，复用共享层 `useAuthStore` 进行认证。

#### Scenario: 登录页面展示
- **WHEN** 用户未登录时访问桌面端
- **THEN** 显示登录页面，包含邮箱输入框、密码输入框、登录按钮、注册链接

#### Scenario: 表单校验 — 邮箱格式
- **WHEN** 用户输入无效邮箱格式并点击登录
- **THEN** 邮箱输入框下方显示格式错误提示，不发起登录请求

#### Scenario: 表单校验 — 密码长度
- **WHEN** 用户输入少于 6 位密码并点击登录
- **THEN** 密码输入框下方显示长度不足提示，不发起登录请求

#### Scenario: 登录成功
- **WHEN** 用户输入正确的邮箱和密码并点击登录
- **THEN** 按钮显示加载状态，调用 `useAuthStore.signIn()` 成功后自动跳转到主页面

#### Scenario: 登录失败
- **WHEN** 用户输入错误密码并点击登录
- **THEN** 显示后端返回的错误信息（如「邮箱或密码错误」）

### Requirement: 桌面端注册页面
桌面端 SHALL 提供 RegisterPage 组件，包含邮箱、密码、确认密码输入框和注册按钮，复用共享层 `useAuthStore` 进行注册。

#### Scenario: 注册页面展示
- **WHEN** 用户从登录页点击注册链接
- **THEN** 显示注册页面，包含邮箱、密码、确认密码输入框和注册按钮

#### Scenario: 两次密码不一致
- **WHEN** 用户输入的密码和确认密码不一致并点击注册
- **THEN** 确认密码输入框下方显示「密码不一致」提示

#### Scenario: 注册成功
- **WHEN** 用户填写有效信息并点击注册
- **THEN** 调用 `useAuthStore.signUp()` 成功后自动登录并跳转到主页面

### Requirement: 桌面端认证路由守卫
桌面端 SHALL 根据 `useAuthStore.user` 状态自动切换认证页面和主页面。

#### Scenario: 未登录时重定向
- **WHEN** 用户未登录（`useAuthStore.user` 为 `null`）时访问任意主页面路由
- **THEN** 自动重定向到登录页面

#### Scenario: 已登录时重定向
- **WHEN** 用户已登录时访问登录/注册页面
- **THEN** 自动重定向到主页面

#### Scenario: 登出后跳转
- **WHEN** 用户在主页面点击登出
- **THEN** 调用 `useAuthStore.signOut()` 后自动跳转到登录页面

### Requirement: 桌面端认证 UI 风格
桌面端认证页面 SHALL 采用居中卡片布局，使用 shadcn/ui 组件（Input、Button、Card），配合 Tailwind CSS 样式。

#### Scenario: 登录卡片布局
- **WHEN** 查看登录页面布局
- **THEN** 登录表单居中显示在页面中央，以卡片形式呈现，宽度适中（约 400px），上方显示应用名称/Logo

#### Scenario: 响应式适配
- **WHEN** 调整桌面端窗口宽度
- **THEN** 登录卡片始终保持居中，不会溢出或变形
