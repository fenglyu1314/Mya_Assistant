## ADDED Requirements

### Requirement: 桌面端日程管理页面（SchedulesPage）
桌面端 SHALL 提供 SchedulesPage，替换 SchedulesPlaceholder，使用 `useSchedulesStore` 展示完整的日程管理功能，包含：

- 双栏布局：左侧月历面板 + 右侧日程列表面板
- 左侧月历使用 `react-day-picker` 渲染，有日程的日期显示标记点
- 点击月历日期更新选中状态，右侧列表联动显示该日的日程
- 右侧顶部显示选中日期 + 「新建日程」按钮
- 右侧日程列表以 ScheduleItem 形式展示，全天事件排在前面
- 选中日期无日程时显示空状态提示
- 切换月份时自动加载该月日程数据
- 创建/编辑通过 Dialog 弹窗完成
- 页面挂载时调用 `fetchSchedules(当月)` 和 `subscribeRealtime()`，卸载时取消订阅

#### Scenario: 页面初始加载
- **WHEN** 用户导航到日程页面
- **THEN** 月历显示当前月份，自动选中今天，加载当月日程数据后右侧展示今日的日程列表

#### Scenario: 点击日期
- **WHEN** 用户点击月历上的某个日期
- **THEN** 该日期高亮选中，右侧列表更新为该日的日程

#### Scenario: 切换月份
- **WHEN** 用户在月历上翻到下一月
- **THEN** 自动加载下一月的日程数据，月历上标记有日程的日期

#### Scenario: 空日期
- **WHEN** 选中的日期没有任何日程
- **THEN** 右侧列表区域显示空状态提示

#### Scenario: 日程列表排序
- **WHEN** 选中日期有 1 条全天事件和 2 条有时间的事件
- **THEN** 全天事件排在列表最上方，其余按开始时间升序排列

#### Scenario: 新建日程
- **WHEN** 用户点击「新建日程」按钮
- **THEN** 弹出 ScheduleFormDialog（创建模式），开始日期默认为当前选中日期

#### Scenario: 编辑日程
- **WHEN** 用户点击某条日程的编辑按钮
- **THEN** 弹出 ScheduleFormDialog（编辑模式），表单预填已有数据

#### Scenario: 实时同步
- **WHEN** 另一端创建、修改或删除了日程
- **THEN** 桌面端月历标记和日程列表自动更新

### Requirement: 桌面端日程列表项组件（ScheduleItem）
桌面端 SHALL 提供 ScheduleItem 组件，展示单条日程的信息：
- 左侧颜色指示条（使用日程的 `color` 字段）
- 时间显示区域（全天事件显示「全天」Badge，有时间的显示 `HH:mm - HH:mm`）
- 标题文本（已取消的日程加删除线 + 灰色）
- 描述预览（如有，单行截断）
- 悬停显示操作按钮（编辑、取消/恢复、删除）

#### Scenario: 普通日程展示
- **WHEN** 渲染一条 9:00-10:00 的日程，颜色为蓝色
- **THEN** 左侧显示蓝色指示条，时间区域显示 `09:00 - 10:00`

#### Scenario: 全天事件展示
- **WHEN** 渲染一条 `all_day: true` 的日程
- **THEN** 时间区域显示「全天」Badge

#### Scenario: 已取消日程展示
- **WHEN** 渲染一条 `status: 'cancelled'` 的日程
- **THEN** 标题加删除线并变灰

#### Scenario: 取消日程操作
- **WHEN** 用户对活跃日程点击「取消日程」按钮
- **THEN** 日程状态更新为 `'cancelled'`

#### Scenario: 恢复日程操作
- **WHEN** 用户对已取消日程点击「恢复日程」按钮
- **THEN** 日程状态恢复为 `'active'`

#### Scenario: 删除操作
- **WHEN** 用户点击删除按钮
- **THEN** 显示确认对话框，确认后执行软删除

### Requirement: 桌面端日程表单弹窗（ScheduleFormDialog）
桌面端 SHALL 提供 ScheduleFormDialog 组件，以 Dialog 弹窗形式创建和编辑日程：
- 标题输入框（必填）
- 描述输入框（多行文本，可选）
- 全天事件开关（Switch 组件）
- 日期选择器（日历弹窗）
- 时间选择器（非全天时显示，使用 `<input type="time">` 原生控件）
- 颜色选择器（8 种预设颜色色块）
- 提醒选择器（预设选项：无提醒、事件时、提前 5/15/30/60 分钟、提前 1 天，支持多选）
- 保存按钮（创建模式显示「创建」，编辑模式显示「保存」）

#### Scenario: 创建模式
- **WHEN** 以创建模式打开 ScheduleFormDialog
- **THEN** 表单为空，标题为「新建日程」，开始日期默认为选中日期下一个整点，结束时间为开始后 1 小时，按钮显示「创建」

#### Scenario: 编辑模式
- **WHEN** 以编辑模式打开 ScheduleFormDialog 并传入 scheduleId
- **THEN** 表单加载该日程数据，标题为「编辑日程」，按钮显示「保存」

#### Scenario: 全天事件切换
- **WHEN** 用户开启全天事件开关
- **THEN** 时间选择器隐藏，仅保留日期选择

#### Scenario: 标题为空校验
- **WHEN** 用户未输入标题直接点击保存
- **THEN** 显示「标题不能为空」提示，不发起请求

#### Scenario: 时间校验
- **WHEN** 用户选择的结束时间早于开始时间
- **THEN** 显示「结束时间不能早于开始时间」提示，不发起请求

#### Scenario: 创建成功
- **WHEN** 用户填写标题、选择时间后点击创建
- **THEN** 日程被创建到后端，Dialog 关闭，列表和月历标记更新

#### Scenario: 选择颜色
- **WHEN** 用户点击红色色块
- **THEN** `color` 字段设为对应 hex 值，色块显示选中状态

#### Scenario: 选择多个提醒
- **WHEN** 用户选择「提前 15 分钟」和「提前 1 小时」
- **THEN** `remind_at` 包含两个对应时间值
