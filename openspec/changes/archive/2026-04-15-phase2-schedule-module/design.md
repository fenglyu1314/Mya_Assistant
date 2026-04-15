## Context

Phase 0 和 Phase 1 已完成以下基础设施：

- **数据模型**：`Schedule` 接口已在共享层定义（含 `start_time`/`end_time` 时间、`all_day` 全天标记、`remind_at` 提醒数组、`repeat_rule` 重复规则、`status` 状态、`color` 颜色标识）
- **数据库**：Supabase `schedules` 表已建好，含 RLS 策略、`updated_at` 触发器、Realtime 启用
- **同步引擎**：`SyncAdapter<T>` 接口 + `SupabaseAdapter` 实现，支持 CRUD + Realtime 订阅 + Filter 过滤
- **状态管理模式**：`useNotesStore` 和 `useTodosStore` 已建立了 Zustand store 的标准模式
- **移动端骨架**：导航框架（MainTab + AuthStack）、主题系统、基础组件已就绪，日程 Tab 使用 PlaceholderScreen 占位
- **已有组件可复用**：`DatePicker`（日期选择）、`Card`（卡片容器）、`Button`、`TextInput`、`EmptyState`

本次需要在此基础上实现完整的日程管理功能模块。

## Goals / Non-Goals

**Goals:**
- 实现共享层 `useSchedulesStore`，完整管理日程的状态和操作
- 实现移动端日程主页面，以月历视图 + 当日日程列表的复合布局展示
- 实现移动端日程创建/编辑页面，支持标题、描述、起止时间、全天事件、提醒、颜色
- 支持日程取消/恢复状态切换（`status: 'active' | 'cancelled'`）
- 通过 Realtime 订阅实现多端实时同步
- 复用共享层已有的 `SyncAdapter` 和 `SupabaseAdapter` 模式

**Non-Goals:**
- 不实现重复事件的 RRULE 解析和展开（`repeat_rule` 字段保留，本次仅支持单次事件。重复事件逻辑复杂度高，推迟到后续 Change）
- 不实现本地推送通知（`remind_at` 字段支持选择和存储，但实际推送通知需要 `notifee` 或 `react-native-push-notification`，属于独立 Change）
- 不实现离线支持（Phase 2 的另一个独立 Change）
- 不实现桌面端 UI（Phase 3）
- 不实现日程与待办的关联功能（`todos.schedule_id` 字段已预留，但本次不做关联 UI）
- 不实现跨日/多日事件的特殊日历展示（简化为起止时间模式）

## Decisions

### D1：Store 模式复用 useTodosStore 的结构

**决定**：`useSchedulesStore` 采用与 `useTodosStore` / `useNotesStore` 相同的 Zustand store 模式 — 同一文件内定义 State + Actions 接口，使用 `SupabaseAdapter<Schedule>` 作为数据层。

**理由**：
- 已有两个 store 验证了此模式的可行性和一致性
- 保持代码风格统一，降低认知负担
- 后续桌面端复用共享层时可直接使用相同 store

**替代方案**：引入独立的 Repository 层。开销更大，当前模块复杂度不需要。

### D2：月历视图使用 react-native-calendars

**决定**：使用 `react-native-calendars` 库的 `Calendar` 组件作为月历视图。

**理由**：
- 社区最成熟的 React Native 日历组件，维护活跃
- 支持日期标记（markedDates）、主题定制、月份切换
- 支持标记多种样式（dot、multi-dot、period）用于标识有日程的日期
- 性能良好，支持按需渲染

**替代方案**：
- 自行实现日历网格。开发成本高，且容易出现边界 bug（闰年、跨月等）。
- `react-native-big-calendar`：功能过重（周视图、日视图），个人助手不需要。

### D3：日程主页面采用月历 + 日程列表复合布局

**决定**：日程主页面上半部分为月历组件（可折叠为周视图），下半部分为选中日期的日程列表。点击日历日期切换下方列表。

**理由**：
- 符合主流日历应用的交互模式（Google Calendar、iOS Calendar）
- 月历提供全局视觉概览（哪些日期有日程），列表提供详细信息
- 折叠功能可以在查看日程详情时释放更多屏幕空间

**替代方案**：纯列表模式（类似待办列表）。缺乏日历直觉，不适合时间维度的事务管理。

### D4：提醒时间采用预设选项

**决定**：提醒时间使用预设选项列表（事件时、提前 5 分钟、15 分钟、30 分钟、1 小时、1 天），而非自由输入。选择后将计算出的绝对时间存入 `remind_at` 数组。

**理由**：
- 降低 UI 复杂度，预设选项覆盖了绝大多数提醒需求
- 减少用户输入错误的可能
- `remind_at` 是 `timestamptz[]` 类型，支持多个提醒时间

**替代方案**：自定义时间输入。灵活但交互复杂，个人使用场景下预设选项已足够。

### D5：颜色标识使用预设调色板

**决定**：提供 8 种预设颜色供用户选择，不支持自定义颜色。颜色值存储为 hex 字符串到 `color` 字段。

**理由**：
- 有限的颜色选择保证视觉一致性
- 简化 UI 实现，无需颜色选择器的完整实现
- 8 种颜色足以区分不同类别的日程

**替代方案**：完整的颜色选择器。实现复杂度高，对个人助手来说过度设计。

### D6：时间选择器复用 @react-native-community/datetimepicker

**决定**：起止时间的选择复用待办模块已安装的 `@react-native-community/datetimepicker`，设置 `mode="time"` 用于时间选择、`mode="date"` 用于日期选择。

**理由**：
- 待办模块已安装并验证了此库
- 提供原生日期/时间选择体验
- 无需引入额外依赖

### D7：日程排序策略 — 按开始时间升序

**决定**：日程列表按 `start_time` 升序排列。同一天的日程中，全天事件排在前面。

**理由**：
- 时间顺序是日程最自然的排列方式
- 全天事件置顶是日历应用的常见模式

## Risks / Trade-offs

- **[react-native-calendars 兼容性]** → `react-native-calendars` 需要与当前 React Native 版本兼容验证。如遇问题，可退回使用简化的自定义日历网格。
- **[重复事件推迟]** → `repeat_rule` 字段存在但本次不解析，用户无法创建重复事件。这是有意的范围控制，重复事件逻辑（RRULE 解析、虚拟事件实例生成）复杂度高，单独作为后续 Change。
- **[通知推迟]** → `remind_at` 字段存储了提醒时间但不触发实际通知。后续需独立 Change 集成 `notifee` 实现本地推送。用户需理解当前"提醒"仅为数据存储。
- **[跨日事件简化处理]** → 起止时间跨越多天的事件仅在开始日期的列表中显示。后续可优化为在每个跨越的日期上都标记显示。
- **[月历性能]** → `react-native-calendars` 需要传入 `markedDates` 对象来标记有日程的日期。当月数据加载应控制在合理范围，避免一次加载过多月份的数据。采用按月按需加载策略。
