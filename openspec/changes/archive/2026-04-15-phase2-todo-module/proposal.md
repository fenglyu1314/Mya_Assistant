## Why

Phase 1 已完成快速记录模块，用户可以记录灵感和备忘。但作为个人助手 App 的核心功能，**待办事项管理**尚未实现。待办是日常事务管理中使用频率最高的功能，缺少它意味着用户仍然需要依赖其他工具来管理任务。Phase 2 路线图将待办事项列为首要交付物，现在是实现它的时机。

**Phase**: 2

## What Changes

- 新增待办事项 Zustand Store（`useTodosStore`），管理待办的状态与操作（CRUD、完成/取消完成、子任务展开、拖拽排序、Realtime 订阅）
- 新增移动端待办列表页面（`TodosListScreen`），支持按完成状态分组展示、优先级颜色标识、子任务折叠/展开
- 新增移动端待办创建/编辑页面（`TodoFormScreen`），支持标题、备注、截止日期、优先级选择、父任务关联
- 新增待办卡片组件（`TodoCard`），展示待办详情与操作入口（完成、删除、编辑）
- 新增日期选择器组件（`DatePicker`），用于截止日期选取
- 新增优先级选择器组件（`PriorityPicker`），可视化选择低/中/高优先级
- 将移动端导航中的待办占位页替换为实际功能页面
- 共享层数据模型（`Todo`、`TodoPriority`）和数据库表（`todos`）已在 Phase 0 就绪，本次无需修改

## Capabilities

### New Capabilities
- `todo-feature`: 待办事项完整功能模块 — 包含共享层状态管理（useTodosStore）和移动端 UI（列表页、表单页、卡片组件），覆盖 CRUD、子任务、优先级、截止日期、拖拽排序、完成状态管理、Realtime 同步

### Modified Capabilities
<!-- 无需修改已有 spec 的 requirement。Todo 数据模型和 Supabase 表结构在 Phase 0 已定义完整，本次只增加 store + UI 层。 -->

## Impact

- **共享层**（`packages/shared`）：新增 `stores/todos-store.ts`，在 `index.ts` 中新增导出
- **移动端**（`packages/mobile`）：新增 `screens/todos/` 目录（TodosListScreen、TodoFormScreen）、新增 `components/TodoCard.tsx`、`components/DatePicker.tsx`、`components/PriorityPicker.tsx`，修改 `navigation/MainTab.tsx` 替换占位页
- **依赖**：可能新增 `react-native-gesture-handler`（拖拽排序）、`@react-native-community/datetimepicker`（日期选择）
- **后端**：无变更（todos 表和 RLS 已在 Phase 0 建好）
