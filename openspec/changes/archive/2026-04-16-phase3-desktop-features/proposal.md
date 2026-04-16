## Why

Phase: 3

桌面端骨架（Electron + 认证 + 导航 + Sidebar）已在 `phase3-desktop-skeleton` 中搭建完成，但四个功能页面（快速记录、待办、日程、设置）目前均为占位符。桌面端需要实现与移动端一致的核心功能，复用共享层的 Store 和数据模型，仅在渲染层做桌面端适配（宽屏布局、shadcn/ui 组件）。这是 Phase 3 「多端覆盖」的关键一步，也是验证共享层跨端复用能力的直接体现。

## What Changes

- 替换 `NotesPlaceholder` 为完整的快速记录页面：列表展示（分类筛选、置顶排序）、创建输入、删除/置顶操作、实时同步
- 替换 `TodosPlaceholder` 为完整的待办事项页面：列表展示（进行中/已完成分区、子任务展开）、创建/编辑表单（标题、备注、截止日期、优先级、父任务选择）、完成/删除操作、实时同步
- 替换 `SchedulesPlaceholder` 为完整的日程管理页面：月历视图 + 日程列表复合布局、创建/编辑表单（标题、描述、全天/定时、颜色、提醒）、取消/恢复/删除操作、实时同步
- 替换 `SettingsPlaceholder` 为设置页面：用户信息展示、登出功能
- 桌面端所有功能页面复用 `@mya/shared` 导出的 `useNotesStore`、`useTodosStore`、`useSchedulesStore`，不引入新的状态管理或后端逻辑
- 按需补充桌面端 UI 组件（dialog、dropdown-menu、badge、calendar 等 shadcn/ui 组件）

## Capabilities

### New Capabilities
- `desktop-notes-page`: 桌面端快速记录页面，包含列表展示、内联创建、分类筛选、置顶/删除操作
- `desktop-todos-page`: 桌面端待办事项页面，包含列表展示、表单弹窗（创建/编辑）、子任务展开、完成/删除操作
- `desktop-schedules-page`: 桌面端日程管理页面，包含月历视图、日程列表、表单弹窗（创建/编辑）、取消/恢复/删除操作
- `desktop-settings-page`: 桌面端设置页面，包含用户信息展示和登出

### Modified Capabilities
（无 — 本次不修改共享层或移动端的任何 spec 级别行为）

## Impact

- **受影响代码**：`packages/desktop/src/renderer/` 下的页面和组件，完全不涉及 `packages/shared` 和 `packages/mobile`
- **新增依赖**：可能需要引入 `react-day-picker`（桌面端月历组件）或类似日历库；其余 UI 组件通过 shadcn/ui CLI 添加
- **路由**：复用现有路由结构（`router.tsx` 中四个路由的组件引用从 Placeholder 替换为真实页面）
- **风险**：共享层 Store 在 Electron 渲染进程中初始化方式需确认（Supabase client 的 URL/Key 通过 `.env.local` + electron-vite 环境变量注入，已在 skeleton 中验证通过）
