## ADDED Requirements

### Requirement: React Navigation 导航框架
移动端 SHALL 使用 React Navigation 构建导航结构，包含两层：
- `AuthStack`（未登录时显示）：LoginScreen、RegisterScreen
- `MainTab`（已登录时显示）：NotesTab、TodosTab、ScheduleTab、SettingsTab

RootNavigator SHALL 根据 `useAuthStore` 的 `user` 状态自动切换 AuthStack / MainTab。

#### Scenario: 未登录时显示登录页
- **WHEN** 应用启动且 `useAuthStore.user` 为 `null`
- **THEN** 显示 AuthStack 的 LoginScreen

#### Scenario: 已登录时显示主页面
- **WHEN** 应用启动且 `useAuthStore.user` 不为 `null`
- **THEN** 显示 MainTab，默认选中 NotesTab

#### Scenario: 登录成功后自动跳转
- **WHEN** 用户在 LoginScreen 登录成功，`useAuthStore.user` 变为非 null
- **THEN** 自动切换到 MainTab，无需手动导航

#### Scenario: 登出后自动跳转
- **WHEN** 用户在 SettingsScreen 点击登出，`useAuthStore.user` 变为 null
- **THEN** 自动切换到 AuthStack 的 LoginScreen

### Requirement: 主题系统
移动端 SHALL 提供 `ThemeProvider` 和 `useTheme` hook，通过 React Context 分发设计 token。

Theme 对象 SHALL 包含：
- `colors`：primary、background、surface、text、textSecondary、border、error、success
- `spacing`：xs(4)、sm(8)、md(16)、lg(24)、xl(32)
- `fontSize`：xs(12)、sm(14)、md(16)、lg(20)、xl(24)
- `borderRadius`：sm(4)、md(8)、lg(16)

#### Scenario: 组件获取主题
- **WHEN** 在 ThemeProvider 内部的组件调用 `useTheme()`
- **THEN** 返回完整的 Theme 对象，包含 colors、spacing、fontSize、borderRadius

#### Scenario: 主题值一致性
- **WHEN** 不同组件调用 `useTheme()`
- **THEN** 获取到相同的 Theme 引用，确保设计一致

### Requirement: 基础 UI 组件
移动端 SHALL 提供以下可复用的基础 UI 组件：
- `Button`：支持 variant（primary/secondary/ghost）、loading 状态、disabled 状态
- `TextInput`：支持 label、placeholder、error 信息、secureTextEntry（密码）
- `Card`：带圆角和阴影的容器组件
- `EmptyState`：空状态占位组件，支持 icon、title、description

所有组件 SHALL 使用 `useTheme()` 获取样式 token，不得硬编码颜色/间距值。

#### Scenario: Button 的 loading 状态
- **WHEN** Button 的 `loading` prop 为 `true`
- **THEN** 显示加载指示器，按钮不可点击

#### Scenario: TextInput 显示错误
- **WHEN** TextInput 的 `error` prop 传入错误信息
- **THEN** 输入框边框变为 error 颜色，下方显示错误文本

#### Scenario: EmptyState 展示
- **WHEN** 列表为空时渲染 EmptyState
- **THEN** 显示 icon、title 和 description 的居中布局

### Requirement: 登录页面
移动端 SHALL 提供 LoginScreen，包含：
- 邮箱输入框（TextInput，键盘类型 email-address）
- 密码输入框（TextInput，secureTextEntry）
- 登录按钮（Button，loading 状态）
- 跳转注册链接
- 表单校验：邮箱格式、密码最少 6 位
- 错误提示：显示后端返回的错误信息

#### Scenario: 表单校验 — 邮箱格式错误
- **WHEN** 用户输入无效邮箱格式并点击登录
- **THEN** 邮箱输入框显示格式错误提示，不发起请求

#### Scenario: 表单校验 — 密码过短
- **WHEN** 用户输入少于 6 位密码并点击登录
- **THEN** 密码输入框显示长度不足提示，不发起请求

#### Scenario: 登录成功
- **WHEN** 用户输入正确的邮箱和密码并点击登录
- **THEN** 按钮显示 loading 状态，登录成功后自动跳转到主页面

#### Scenario: 登录失败
- **WHEN** 用户输入错误的密码并点击登录
- **THEN** 显示后端返回的错误信息（如"密码错误"）

### Requirement: 注册页面
移动端 SHALL 提供 RegisterScreen，包含：
- 邮箱输入框
- 密码输入框
- 确认密码输入框
- 注册按钮（loading 状态）
- 跳转登录链接
- 表单校验：邮箱格式、密码最少 6 位、两次密码一致

#### Scenario: 两次密码不一致
- **WHEN** 用户输入的密码和确认密码不一致并点击注册
- **THEN** 确认密码输入框显示"密码不一致"提示

#### Scenario: 注册成功
- **WHEN** 用户填写有效信息并点击注册
- **THEN** 注册成功后自动登录并跳转到主页面
