## Why

Phase 2 的待办事项模块已完成并归档，用户可以管理任务清单。但作为个人助手 App 的另一大核心功能，**日程管理**尚未实现。日程是时间维度的事务管理——用户需要在日历上安排约会、会议、提醒等有明确时间点的事件。缺少日程模块意味着用户仍需依赖外部日历应用来管理时间安排，无法在同一个 App 内统一管理所有事务。Phase 2 路线图将日程管理列为核心交付物之一，现在是实现它的时机。

**Phase**: 2

## What Changes

- 新增共享层日程输入类型（`CreateScheduleInput`、`UpdateScheduleInput`），补充日程模块所需的辅助类型定义
- 新增日程 Zustand Store（`useSchedulesStore`），管理日程的状态与操作（CRUD、日期范围查询、取消/恢复、Realtime 订阅）
- 新增移动端日程主页面（`SchedulesScreen`），以月历 + 日程列表的复合视图展示日程
- 新增移动端日程创建/编辑页面（`ScheduleFormScreen`），支持标题、描述、起止时间、全天事件、提醒设置、颜色选择
- 新增日程卡片组件（`ScheduleCard`），展示单条日程的时间、标题、颜色标识
- 新增时间选择器组件（`TimePicker`），用于起止时间选取
- 新增颜色选择器组件（`ColorPicker`），用于日程颜色标识选取
- 新增提醒选择器组件（`RemindPicker`），用于配置提醒时间
- 将移动端导航中的日程占位页（`PlaceholderScreen`）替换为实际功能页面
- 共享层数据模型（`Schedule`、`ScheduleStatus`）和数据库表（`schedules`）已在 Phase 0 就绪，本次无需修改

## Capabilities

### New Capabilities
- `schedule-feature`: 日程管理完整功能模块 — 包含共享层状态管理（useSchedulesStore）和移动端 UI（月历视图、日程列表、表单页、日程卡片），覆盖 CRUD、日期范围查询、全天事件、起止时间、提醒设置、颜色标识、取消/恢复状态管理、Realtime 同步

### Modified Capabilities
<!-- 无需修改已有 spec 的 requirement。Schedule 数据模型和 Supabase 表结构在 Phase 0 已定义完整，本次只增加 store + UI 层。 -->

## Impact

- **共享层**（`packages/shared`）：新增 `models/schedule.ts` 中的 `CreateScheduleInput`、`UpdateScheduleInput` 类型，新增 `stores/schedules-store.ts`，在 `models/index.ts`、`stores/index.ts`、`index.ts` 中补充导出
- **移动端**（`packages/mobile`）：新增 `screens/schedules/` 目录（SchedulesScreen、ScheduleFormScreen）、新增 `components/ScheduleCard.tsx`、`components/TimePicker.tsx`、`components/ColorPicker.tsx`、`components/RemindPicker.tsx`，修改 `navigation/MainTab.tsx` 替换占位页，修改 `navigation/types.ts` 新增日程导航类型
- **依赖**：新增 `react-native-calendars`（月历视图组件）到移动端；复用已有的 `@react-native-community/datetimepicker`（时间选择）
- **后端**：无变更（schedules 表和 RLS 已在 Phase 0 建好）
