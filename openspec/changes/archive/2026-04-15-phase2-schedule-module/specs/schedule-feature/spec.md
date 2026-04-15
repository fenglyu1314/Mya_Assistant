## ADDED Requirements

### Requirement: useSchedulesStore 日程状态管理
共享层 SHALL 导出 `useSchedulesStore`（Zustand store），管理日程的数据和 UI 状态，包含：

**状态**：
- `schedules: Schedule[]` — 当前已加载的日程列表
- `loading: boolean` — 数据加载中
- `selectedDate: string` — 当前选中的日期（ISO date 格式，如 `'2026-04-15'`）

**操作**：
- `fetchSchedules(month: string): Promise<void>` — 从后端拉取指定月份的日程（按月查询，参数格式 `'2026-04'`），按 `start_time` 升序排列
- `createSchedule(data: CreateScheduleInput): Promise<void>` — 创建日程
- `updateSchedule(id: string, data: UpdateScheduleInput): Promise<void>` — 更新日程
- `deleteSchedule(id: string): Promise<void>` — 软删除日程
- `cancelSchedule(id: string): Promise<void>` — 将日程状态设为 `'cancelled'`
- `restoreSchedule(id: string): Promise<void>` — 将日程状态恢复为 `'active'`
- `setSelectedDate(date: string): void` — 设置选中日期
- `subscribeRealtime(): Unsubscribe` — 订阅实时变更，自动更新本地列表
- `schedulesForDate(date: string): Schedule[]` — 计算属性，返回指定日期的日程列表（全天事件优先，然后按 `start_time` 升序）
- `markedDates(): Record<string, { marked: true, dotColor: string }>` — 计算属性，返回有日程的日期标记对象（用于月历组件的 `markedDates` prop）

#### Scenario: 按月拉取日程
- **WHEN** 调用 `fetchSchedules('2026-04')`
- **THEN** `loading` 变为 `true`，从后端拉取当前用户在 2026 年 4 月内（`start_time` 在该月范围内）的所有未删除日程，按 `start_time` 升序排列，完成后 `loading` 变为 `false`

#### Scenario: 创建日程
- **WHEN** 调用 `createSchedule({ title: '团队周会', start_time: '2026-04-16T09:00:00Z', end_time: '2026-04-16T10:00:00Z' })`
- **THEN** 后端创建记录成功（`status` 默认 `'active'`，`all_day` 默认 `false`），本地列表同步更新

#### Scenario: 创建全天事件
- **WHEN** 调用 `createSchedule({ title: '清明节', start_time: '2026-04-05T00:00:00Z', end_time: '2026-04-05T23:59:59Z', all_day: true })`
- **THEN** 后端创建记录成功，`all_day` 为 `true`，本地列表更新

#### Scenario: 软删除日程
- **WHEN** 调用 `deleteSchedule(id)`
- **THEN** 后端将该日程的 `_deleted` 设为 `true`，本地列表移除该记录

#### Scenario: 取消日程
- **WHEN** 调用 `cancelSchedule(id)` 且该日程 `status` 为 `'active'`
- **THEN** 后端更新 `status` 为 `'cancelled'`，本地列表更新

#### Scenario: 恢复日程
- **WHEN** 调用 `restoreSchedule(id)` 且该日程 `status` 为 `'cancelled'`
- **THEN** 后端更新 `status` 为 `'active'`，本地列表更新

#### Scenario: 按日期筛选日程
- **WHEN** 调用 `schedulesForDate('2026-04-15')`，本地列表包含 3 条日程（1 条全天、2 条有具体时间）
- **THEN** 返回 3 条日程，全天事件排在前面，其余按 `start_time` 升序

#### Scenario: 标记日期
- **WHEN** 调用 `markedDates()`，本地列表包含 4 月 10 日和 4 月 15 日各有日程
- **THEN** 返回 `{ '2026-04-10': { marked: true, dotColor: '...' }, '2026-04-15': { marked: true, dotColor: '...' } }`

#### Scenario: 实时同步 — 其他端创建日程
- **WHEN** 已调用 `subscribeRealtime()` 且另一端创建了一条日程
- **THEN** 本地 `schedules` 列表自动更新，新日程出现在列表中

#### Scenario: 实时同步 — 其他端取消日程
- **WHEN** 已调用 `subscribeRealtime()` 且另一端将一条日程标记为取消
- **THEN** 本地该日程的 `status` 自动更新为 `'cancelled'`

### Requirement: CreateScheduleInput 和 UpdateScheduleInput 类型
共享层 SHALL 导出 `CreateScheduleInput` 和 `UpdateScheduleInput` 类型：

- `CreateScheduleInput`: `{ title: string, start_time: string, end_time: string, description?: string, all_day?: boolean, remind_at?: string[], color?: string, tags?: string[] }`
- `UpdateScheduleInput`: `Partial<Pick<Schedule, 'title' | 'description' | 'start_time' | 'end_time' | 'all_day' | 'remind_at' | 'repeat_rule' | 'status' | 'color' | 'tags'>>`

#### Scenario: CreateScheduleInput 仅需 title + 时间
- **WHEN** 创建 `CreateScheduleInput` 仅提供 `{ title: '会议', start_time: '...', end_time: '...' }`
- **THEN** TypeScript 编译通过，其余字段均为可选

#### Scenario: UpdateScheduleInput 支持部分更新
- **WHEN** 创建 `UpdateScheduleInput` 为 `{ color: '#FF5733' }`
- **THEN** TypeScript 编译通过，仅更新颜色字段

### Requirement: 日程主页面（SchedulesScreen）
移动端 SHALL 提供 SchedulesScreen，以月历 + 日程列表的复合视图展示日程，包含：
- 顶部月历视图（`react-native-calendars` 的 `Calendar` 组件），显示当前月份
- 有日程的日期下方显示标记点（dot）
- 点击日期切换选中状态，下方列表更新为对应日期的日程
- 当前日期高亮显示
- 月历下方为选中日期的日程列表，以 ScheduleCard 形式展示
- 底部悬浮创建按钮（FAB），点击进入创建日程页面
- 加载状态显示加载指示器
- 选中日期无日程时显示 EmptyState 组件
- 切换月份时自动加载该月的日程数据

#### Scenario: 页面初始加载
- **WHEN** 用户进入 SchedulesScreen
- **THEN** 月历显示当前月份，自动选中今天日期，加载当月日程数据后展示今日的日程列表

#### Scenario: 点击日期
- **WHEN** 用户点击月历上的 4 月 20 日
- **THEN** 4 月 20 日高亮选中，下方列表更新为该日的日程

#### Scenario: 切换月份
- **WHEN** 用户在月历上翻到 5 月
- **THEN** 自动调用 `fetchSchedules('2026-05')` 加载 5 月数据，月历上标记有日程的日期

#### Scenario: 空日期
- **WHEN** 选中的日期没有任何日程
- **THEN** 日程列表区域显示 EmptyState 组件，提示「今天没有日程」

#### Scenario: 日程列表排序
- **WHEN** 选中日期有 1 条全天事件和 2 条有时间的事件
- **THEN** 全天事件排在列表最上方，其余按开始时间升序排列

### Requirement: 日程卡片组件（ScheduleCard）
移动端 SHALL 提供 ScheduleCard 组件，展示单条日程的信息：
- 左侧颜色指示条（使用日程的 `color` 字段，无颜色时使用主题默认色）
- 时间显示区域（全天事件显示「全天」标签，有时间的事件显示 `HH:mm - HH:mm` 格式）
- 标题文本（取消的日程加删除线 + 灰色）
- 描述预览（如有，单行截断）
- 提醒图标（如有 `remind_at` 数据，显示铃铛图标）
- 点击卡片进入编辑页面
- 长按触发操作菜单（取消/恢复、删除）

#### Scenario: 普通日程展示
- **WHEN** 渲染一条 9:00-10:00 的日程，颜色为蓝色
- **THEN** 左侧显示蓝色指示条，时间区域显示 `09:00 - 10:00`，标题正常显示

#### Scenario: 全天事件展示
- **WHEN** 渲染一条 `all_day: true` 的日程
- **THEN** 时间区域显示「全天」标签而非具体时间

#### Scenario: 已取消日程展示
- **WHEN** 渲染一条 `status: 'cancelled'` 的日程
- **THEN** 标题加删除线并变灰，视觉上明显区别于活跃日程

#### Scenario: 有提醒的日程
- **WHEN** 渲染一条 `remind_at` 包含提醒时间的日程
- **THEN** 显示铃铛图标，表示该日程设置了提醒

#### Scenario: 长按操作菜单
- **WHEN** 用户长按 ScheduleCard
- **THEN** 显示操作菜单，包含「取消日程」/「恢复日程」（根据当前状态）和「删除」选项

### Requirement: 日程表单页面（ScheduleFormScreen）
移动端 SHALL 提供 ScheduleFormScreen，用于创建和编辑日程，包含：
- 标题输入框（必填，不得为空）
- 描述输入框（多行文本，可选）
- 全天事件开关（Toggle）
- 开始日期时间选择（非全天事件时显示日期+时间，全天事件时仅显示日期）
- 结束日期时间选择（同上）
- 提醒选择器（预设选项：无、事件时、提前 5 分钟、15 分钟、30 分钟、1 小时、1 天，支持多选）
- 颜色选择器（8 种预设颜色）
- 保存按钮（创建模式显示「创建」，编辑模式显示「保存」）
- 编辑模式下，加载已有数据填充表单

#### Scenario: 创建模式
- **WHEN** 从日程主页点击 FAB 进入 ScheduleFormScreen
- **THEN** 表单为空，标题为「新建日程」，开始时间默认为选中日期的下一个整点，结束时间默认为开始时间后 1 小时，按钮显示「创建」

#### Scenario: 编辑模式
- **WHEN** 从 ScheduleCard 点击进入 ScheduleFormScreen 并传入 scheduleId
- **THEN** 表单加载该日程的数据填充所有字段，标题为「编辑日程」，按钮显示「保存」

#### Scenario: 标题为空校验
- **WHEN** 用户未输入标题直接点击创建/保存
- **THEN** 显示「标题不能为空」提示，不发起请求

#### Scenario: 时间校验
- **WHEN** 用户选择的结束时间早于开始时间
- **THEN** 显示「结束时间不能早于开始时间」提示，不发起请求

#### Scenario: 全天事件切换
- **WHEN** 用户开启全天事件开关
- **THEN** 时间选择器隐藏，仅显示日期选择器

#### Scenario: 创建成功
- **WHEN** 用户填写标题、选择时间后点击创建
- **THEN** 日程被创建到后端，自动返回日程主页面，新日程出现在列表中

#### Scenario: 选择提醒
- **WHEN** 用户点击「提前 15 分钟」和「提前 1 小时」两个提醒选项
- **THEN** `remind_at` 数组包含两个时间值（开始时间减 15 分钟、减 1 小时的 ISO 字符串）

#### Scenario: 选择颜色
- **WHEN** 用户点击红色色块
- **THEN** `color` 字段设为对应的 hex 值，色块显示选中状态

### Requirement: 时间选择器组件（TimePicker）
移动端 SHALL 提供 TimePicker 组件，用于选择时间：
- 点击触发原生时间选择器（`@react-native-community/datetimepicker`，`mode="time"`）
- 显示已选时间的格式化文本（如 `09:30`）
- 接收 `value`（`string`）和 `onChange` props

#### Scenario: 显示当前时间
- **WHEN** 渲染 TimePicker 且 `value` 为 `'2026-04-15T09:30:00Z'`
- **THEN** 显示 `09:30`

#### Scenario: 选择时间
- **WHEN** 用户通过原生时间选择器选定 14:00
- **THEN** `onChange` 被调用，参数为更新了小时和分钟的 ISO 字符串

### Requirement: 颜色选择器组件（ColorPicker）
移动端 SHALL 提供 ColorPicker 组件，用于选择日程颜色：
- 展示 8 种预设颜色色块（横向排列）
- 选中的色块显示勾选标记
- 支持"无颜色"选项（使用主题默认色）
- 接收 `value`（`string | null`）和 `onChange` props

#### Scenario: 无颜色选中
- **WHEN** 渲染 ColorPicker 且 `value` 为 `null`
- **THEN** 无任何色块显示勾选标记

#### Scenario: 选择颜色
- **WHEN** 用户点击蓝色色块
- **THEN** `onChange` 被调用，参数为蓝色 hex 值，该色块显示勾选标记

#### Scenario: 取消颜色
- **WHEN** 用户点击已选中的色块
- **THEN** `onChange` 被调用，参数为 `null`，色块取消勾选

### Requirement: 提醒选择器组件（RemindPicker）
移动端 SHALL 提供 RemindPicker 组件，用于配置日程提醒时间：
- 展示预设选项列表：「无提醒」、「事件时」、「提前 5 分钟」、「提前 15 分钟」、「提前 30 分钟」、「提前 1 小时」、「提前 1 天」
- 支持多选（除「无提醒」外，可同时选择多个提醒时间）
- 选择「无提醒」时清除其他所有选择
- 接收 `value`（`number[]`，表示提前的分钟数，0 = 事件时）和 `onChange` props

#### Scenario: 无提醒状态
- **WHEN** 渲染 RemindPicker 且 `value` 为空数组
- **THEN** 「无提醒」选项高亮

#### Scenario: 选择单个提醒
- **WHEN** 用户点击「提前 15 分钟」
- **THEN** `onChange` 被调用，参数为 `[15]`

#### Scenario: 选择多个提醒
- **WHEN** 用户先选择「提前 15 分钟」再选择「提前 1 小时」
- **THEN** `onChange` 被调用，参数为 `[15, 60]`

#### Scenario: 选择无提醒清除其他
- **WHEN** 用户已选择「提前 15 分钟」和「提前 1 小时」，然后选择「无提醒」
- **THEN** `onChange` 被调用，参数为 `[]`

### Requirement: 日程导航集成
移动端 SHALL 将 MainTab 中的日程 Tab 从 PlaceholderScreen 替换为 SchedulesScreen，并注册 ScheduleFormScreen 到导航栈。

#### Scenario: Tab 导航到日程
- **WHEN** 用户点击底部 Tab 栏的「日程」Tab
- **THEN** 显示 SchedulesScreen，展示月历和日程列表

#### Scenario: 导航到创建页面
- **WHEN** 用户在 SchedulesScreen 点击 FAB 按钮
- **THEN** 导航到 ScheduleFormScreen（创建模式，携带当前选中日期）

#### Scenario: 导航到编辑页面
- **WHEN** 用户在 SchedulesScreen 点击某条日程卡片
- **THEN** 导航到 ScheduleFormScreen（编辑模式，传入 scheduleId）
