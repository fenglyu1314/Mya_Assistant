## 1. 共享层类型与辅助定义

- [x] 1.1 在 `packages/shared/src/models/todo.ts` 中新增 `CreateTodoInput`、`UpdateTodoInput`、`TodoTreeNode` 类型导出。验收：TypeScript 编译通过，三个类型可从 `@mya/shared` 导入
- [x] 1.2 在 `packages/shared/src/models/index.ts` 和 `packages/shared/src/index.ts` 中补充新类型的导出。验收：`import { CreateTodoInput, UpdateTodoInput, TodoTreeNode } from '@mya/shared'` 正常工作

## 2. 共享层 useTodosStore

- [x] 2.1 创建 `packages/shared/src/stores/todos-store.ts`，实现 `TodosState` 和 `TodosActions` 接口定义（状态：`todos`、`loading`、`expandedParents`、`showCompleted`）。验收：接口定义完整，TypeScript 编译通过
- [x] 2.2 实现 `fetchTodos()`：通过 `SupabaseAdapter<Todo>` 拉取所有未删除待办，按 `sort_order` 升序排列，管理 `loading` 状态。验收：调用后 `todos` 数组正确填充，`loading` 正确切换
- [x] 2.3 实现 `createTodo(data)`：创建待办，`sort_order` 自动设为当前最大值 +1，支持 `parent_id` 指定父任务。验收：创建后本地列表包含新记录，后端数据正确
- [x] 2.4 实现 `updateTodo(id, data)`：部分更新待办字段。验收：更新后本地列表对应记录反映最新值
- [x] 2.5 实现 `deleteTodo(id)`：软删除待办，如果是父任务则同时软删除所有子任务。验收：父任务及其子任务均从本地列表移除
- [x] 2.6 实现 `toggleDone(id)`：切换完成状态，完成时设置 `done_at` 为当前时间，取消完成时清除 `done_at`。验收：`done` 和 `done_at` 字段正确切换
- [x] 2.7 实现 `reorder(todoId, newSortOrder)`：更新指定待办的 `sort_order`。验收：本地列表按新排序重排
- [x] 2.8 实现 `toggleExpandParent(parentId)` 和 `setShowCompleted(show)`：管理 UI 展开/折叠状态。验收：状态切换正确
- [x] 2.9 实现 `todoTree()` 计算属性：将平铺待办组装为 `TodoTreeNode[]`（仅未完成的顶级待办 + 嵌套子任务）。验收：返回正确的树形结构，子任务按 `sort_order` 排序
- [x] 2.10 实现 `completedTodos()` 计算属性：返回已完成的顶级待办列表。验收：仅返回 `done: true` 的记录
- [x] 2.11 实现 `subscribeRealtime()`：订阅 todos 表的 Realtime 事件，处理 INSERT/UPDATE/DELETE，含 ID 去重。验收：其他端操作后本地列表自动更新
- [x] 2.12 在 `packages/shared/src/stores/index.ts` 和 `packages/shared/src/index.ts` 中导出 `useTodosStore`。验收：`import { useTodosStore } from '@mya/shared'` 正常工作

## 3. 移动端依赖安装

- [x] 3.1 安装 `@react-native-community/datetimepicker` 到 `packages/mobile`。验收：`pnpm install` 成功，Android 构建正常

## 4. 移动端基础组件

- [x] 4.1 创建 `packages/mobile/src/components/PriorityPicker.tsx`：三档优先级选择器（低=灰色/中=橙色/高=红色），接收 `value` 和 `onChange` props，选中项高亮。验收：三个选项渲染正确，点击触发 `onChange`
- [x] 4.2 创建 `packages/mobile/src/components/DatePicker.tsx`：日期选择组件，点击弹出原生日期选择器，支持清除按钮，接收 `value`（`string | null`）和 `onChange`。验收：选择日期后返回 ISO 字符串，清除后返回 `null`
- [x] 4.3 创建 `packages/mobile/src/components/TodoCard.tsx`：待办卡片组件，显示勾选框、标题（完成时删除线）、优先级颜色指示条、截止日期标签（过期红色）、子任务计数。支持点击（编辑）和长按（删除确认）。验收：各状态样式正确，交互触发正确回调
- [x] 4.4 在 `packages/mobile/src/components/index.ts` 中导出新组件。验收：`import { PriorityPicker, DatePicker, TodoCard } from '../components'` 正常工作

## 5. 移动端页面

- [x] 5.1 创建 `packages/mobile/src/screens/todos/TodosListScreen.tsx`：待办列表页，包含「进行中」区域（TodoCard 列表 + 子任务折叠/展开）、「已完成」折叠区域、FAB 创建按钮、加载态、空状态。验收：列表正确分组展示，子任务可折叠/展开，已完成区域可折叠/展开
- [x] 5.2 创建 `packages/mobile/src/screens/todos/TodoFormScreen.tsx`：待办表单页，支持创建和编辑模式，包含标题输入、备注输入、DatePicker、PriorityPicker、父任务选择下拉。验收：创建模式空表单，编辑模式填充已有数据，标题为空时校验拦截，保存成功后返回列表

## 6. 导航集成

- [x] 6.1 在 `packages/mobile/src/navigation/types.ts` 中新增 `TodosListScreen` 和 `TodoFormScreen` 的路由参数类型定义。验收：TypeScript 类型正确
- [x] 6.2 修改 `packages/mobile/src/navigation/MainTab.tsx`，将待办 Tab 的 `PlaceholderScreen` 替换为 `TodosListScreen`。验收：点击待办 Tab 显示待办列表页
- [x] 6.3 将 `TodoFormScreen` 注册到导航栈（作为 Modal 或 Stack Screen），支持从 TodosListScreen 导航传参（创建模式无参数，编辑模式传 `todoId`）。验收：FAB 点击进入创建页，卡片点击进入编辑页，保存后正确返回

## 7. 验收与收尾

- [x] 7.1 TypeScript 全量类型检查通过（`pnpm run typecheck`）。验收：无类型错误
- [x] 7.2 移动端 Android 构建并在模拟器运行待办完整流程：创建 → 查看列表 → 编辑 → 完成/取消完成 → 创建子任务 → 删除。验收：所有操作正常，数据与后端同步
- [x] 7.3 更新 roadmap `Phase 2` 状态为 `active`。验收：`openspec/specs/roadmap/spec.md` 中 Phase 2 状态字段为 `active`
