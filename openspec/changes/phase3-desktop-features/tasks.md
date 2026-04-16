## 1. UI 组件基础设施

- [ ] 1.1 创建 shadcn/ui 补充组件：`dialog`（Dialog / DialogContent / DialogHeader / DialogTitle / DialogFooter）、`textarea`、`badge`、`switch`、`separator`、`dropdown-menu`、`select`、`scroll-area`。遵循已有 `button`/`card`/`input`/`label` 的 CVA 风格，放在 `packages/desktop/src/renderer/components/ui/` 下。验收：所有组件导出可用，TypeScript 编译通过。

- [ ] 1.2 安装 `react-day-picker` v9 和 `date-fns` 依赖，创建 shadcn/ui 风格的 `Calendar` 组件（基于 react-day-picker + Tailwind 样式）。验收：Calendar 组件可渲染月历视图，支持日期选择和日期标记（modifiers）。

- [ ] 1.3 创建通用 `ConfirmDialog` 组件（标题 + 描述 + 取消/确认按钮），用于删除确认、登出确认等场景。验收：可通过 props 控制标题、描述、确认按钮文案和回调。

## 2. 快速记录页面

- [ ] 2.1 创建 `NoteCard` 组件，展示单条快速记录：内容文本（多行截断）、分类 Badge（灵感=紫色、备忘=蓝色、日志=绿色）、置顶标记、创建时间（相对时间）、悬停显示操作按钮（置顶/删除）。验收：根据不同 NoteType 和 pinned 状态正确渲染样式。

- [ ] 2.2 创建 `NotesPage` 页面组件：顶部内联创建区（多行输入框 + 分类 Select + 提交按钮）、分类筛选 Tab 栏（全部/灵感/备忘/日志）、NoteCard 卡片列表。页面挂载时调用 `useNotesStore.fetchNotes()` 和 `subscribeRealtime()`，卸载时取消订阅。验收：加载后展示快速记录列表，内联创建后新记录出现在列表中，分类筛选正确过滤。

- [ ] 2.3 实现置顶/删除操作：置顶按钮调用 `togglePin()`，删除按钮弹出 ConfirmDialog 后调用 `deleteNote()`。验收：置顶后记录重新排序，删除后记录从列表消失。

- [ ] 2.4 更新 `router.tsx`，将 `NotesPlaceholder` 替换为 `NotesPage`。验收：导航到 `/notes` 显示真实快速记录页面。

## 3. 待办事项页面

- [ ] 3.1 创建 `TodoItem` 组件：Checkbox + 标题（完成时删除线）+ 优先级颜色圆点 + 截止日期标签（过期红色）+ 子任务计数 + 展开/折叠按钮 + 悬停操作按钮（编辑/删除）。验收：根据 todo 数据正确渲染各状态样式。

- [ ] 3.2 创建 `TodoFormDialog` 组件：Dialog 弹窗包含标题输入框（必填校验）、备注 Textarea、截止日期选择器（react-day-picker 弹窗）、优先级按钮组（低/中/高）、父任务 Select（从 store 获取未完成顶级待办列表）。支持创建和编辑模式。验收：创建模式表单为空，编辑模式预填数据；标题为空时禁止提交；创建/编辑成功后 Dialog 关闭。

- [ ] 3.3 创建 `TodosPage` 页面组件：标题栏 + 「新建待办」按钮 + 「进行中」列表区域（`todoTree()` 渲染，子任务缩进展示）+ 「已完成」折叠区域（`completedTodos()` 渲染）。页面挂载时调用 `fetchTodos()` + `subscribeRealtime()`。验收：列表正确分区展示，快速完成操作可用，子任务可展开折叠。

- [ ] 3.4 实现待办删除操作：点击删除弹出 ConfirmDialog，确认后调用 `deleteTodo()`。验收：删除后待办（含子任务）从列表消失。

- [ ] 3.5 更新 `router.tsx`，将 `TodosPlaceholder` 替换为 `TodosPage`。验收：导航到 `/todos` 显示真实待办页面。

## 4. 日程管理页面

- [ ] 4.1 创建 `ScheduleItem` 组件：左侧颜色条 + 时间显示（全天显示「全天」Badge，定时显示 HH:mm - HH:mm）+ 标题（取消的加删除线）+ 描述预览 + 悬停操作按钮（编辑/取消或恢复/删除）。验收：根据日程数据正确渲染各状态样式。

- [ ] 4.2 创建颜色选择器 `ColorPicker` 组件：8 种预设颜色色块横向排列，选中显示勾选标记，支持取消选择。验收：点击色块触发 onChange，选中状态正确。

- [ ] 4.3 创建提醒选择器 `RemindPicker` 组件：预设选项列表（无/事件时/5 分钟/15 分钟/30 分钟/1 小时/1 天），支持多选，选择「无提醒」清除其他选择。验收：多选和互斥逻辑正确。

- [ ] 4.4 创建 `ScheduleFormDialog` 组件：Dialog 弹窗包含标题输入框（必填校验）、描述 Textarea、全天 Switch、日期选择器、时间选择器（非全天时显示）、ColorPicker、RemindPicker。支持创建和编辑模式，时间校验（结束 >= 开始）。验收：创建/编辑流程完整，全天切换隐藏时间选择器，校验提示正确。

- [ ] 4.5 创建 `SchedulesPage` 页面组件：左侧月历（Calendar 组件 + 日程日期标记）+ 右侧（选中日期标题 + 「新建日程」按钮 + ScheduleItem 列表，全天事件优先排序）。切换月份时调用 `fetchSchedules()`。页面挂载时调用 `fetchSchedules(当月)` + `subscribeRealtime()`。验收：月历与日程列表联动，日期标记正确，空日期显示提示。

- [ ] 4.6 实现日程操作：取消（`cancelSchedule()`）、恢复（`restoreSchedule()`）、删除（`deleteSchedule()` + ConfirmDialog）。验收：各操作正确更新日程状态。

- [ ] 4.7 更新 `router.tsx`，将 `SchedulesPlaceholder` 替换为 `SchedulesPage`。验收：导航到 `/schedules` 显示真实日程页面。

## 5. 设置页面

- [ ] 5.1 创建 `SettingsPage` 页面组件：页面标题「设置」+ 用户信息卡片（显示邮箱）+ 登出按钮（点击弹出 ConfirmDialog，确认后调用 `signOut()` 并跳转登录页）。验收：显示当前用户邮箱，登出后跳转到 `/login`。

- [ ] 5.2 更新 `router.tsx`，将 `SettingsPlaceholder` 替换为 `SettingsPage`。验收：导航到 `/settings` 显示真实设置页面。

## 6. 集成验证

- [ ] 6.1 全量 TypeScript 类型检查：运行 `pnpm typecheck` 确保无类型错误。验收：`tsc --noEmit` 退出码为 0。

- [ ] 6.2 桌面端 dev 启动验证：运行 `pnpm desktop:dev`，手动验证登录后四个功能页面均可正常访问和使用。验收：快速记录创建/筛选/置顶/删除、待办创建/编辑/完成/删除/子任务展开、日程创建/编辑/取消/恢复/删除/月历联动、设置登出 — 均无崩溃和控制台报错。

- [ ] 6.3 清理遗留占位组件：删除 `NotesPlaceholder.tsx`、`TodosPlaceholder.tsx`、`SchedulesPlaceholder.tsx`、`SettingsPlaceholder.tsx` 四个文件。验收：项目中无未使用的占位组件文件。
