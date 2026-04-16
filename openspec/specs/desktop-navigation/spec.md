### Requirement: 侧边栏导航组件
桌面端 SHALL 提供 Sidebar 组件，作为主页面的全局导航，包含导航项列表和用户信息区。

#### Scenario: 侧边栏展示
- **WHEN** 用户已登录进入主页面
- **THEN** 左侧显示固定侧边栏（宽度 240px），包含应用名称、导航项列表（快速记录、待办、日程）和底部设置/登出区域

#### Scenario: 导航项高亮
- **WHEN** 用户当前在「待办」页面
- **THEN** 侧边栏中「待办」导航项高亮显示，其他项为普通状态

#### Scenario: 导航切换
- **WHEN** 用户点击侧边栏中的「日程」导航项
- **THEN** 右侧内容区切换到日程页面的路由，「日程」导航项变为高亮状态

#### Scenario: 用户信息展示
- **WHEN** 用户已登录
- **THEN** 侧边栏底部显示当前用户的邮箱信息

#### Scenario: 登出操作
- **WHEN** 用户点击侧边栏底部的登出按钮
- **THEN** 触发登出流程，跳转到登录页面

### Requirement: 主布局框架
桌面端 SHALL 提供 MainLayout 组件，实现侧边栏 + 内容区的经典桌面布局。

#### Scenario: 布局结构
- **WHEN** 查看主页面布局
- **THEN** 页面分为左侧固定侧边栏（240px）和右侧弹性内容区，内容区占满剩余宽度

#### Scenario: 内容区路由
- **WHEN** 用户通过侧边栏切换导航
- **THEN** 仅右侧内容区的内容切换，侧边栏保持不变

#### Scenario: 最小宽度约束
- **WHEN** 窗口宽度缩小到 800px（最小宽度）
- **THEN** 侧边栏和内容区仍正常显示，不出现布局错乱

### Requirement: 路由系统
桌面端 SHALL 使用 `react-router-dom` 的 `createMemoryRouter` 建立路由系统，定义认证和主页面的路由结构。

#### Scenario: 路由定义
- **WHEN** 查看桌面端路由配置
- **THEN** 包含认证路由（`/login`、`/register`）和主页面路由（`/notes`、`/todos`、`/schedules`、`/settings`），默认路由为 `/notes`

#### Scenario: 使用内存路由
- **WHEN** 桌面端应用启动
- **THEN** 路由使用 `createMemoryRouter`（非 `createBrowserRouter`），不依赖浏览器 URL 栏

### Requirement: 占位页面
桌面端 SHALL 为每个主功能提供占位页面（PlaceholderPage），在功能页面未实现前展示模块名称和提示信息。

#### Scenario: 占位页面展示
- **WHEN** 用户导航到「快速记录」Tab（功能页面尚未实现）
- **THEN** 内容区显示占位页面，包含模块名称「快速记录」和提示文字「功能开发中...」

#### Scenario: 各模块占位
- **WHEN** 分别导航到快速记录、待办、日程、设置
- **THEN** 每个路由均显示对应名称的占位页面
