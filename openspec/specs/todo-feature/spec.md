# 待办事项功能 (Todo Feature)

### Requirement: useTodosStore 待办事项状态管理
共享层 SHALL 导出 `useTodosStore`（Zustand store），管理待办事项的数据和 UI 状态，包含：

**状态**：
- `todos: Todo[]` — 待办列表（平铺，含子任务）
- `loading: boolean` — 数据加载中
- `expandedParents: Set<string>` — 展开子任务的父任务 ID 集合
- `showCompleted: boolean` — 是否展示已完成区域

**操作**：
- `fetchTodos(): Promise<void>` — 从后端拉取所有待办（按 `sort_order` 升序排列）
- `createTodo(data: CreateTodoInput): Promise<void>` — 创建待办
- `updateTodo(id: string, data: UpdateTodoInput): Promise<void>` — 更新待办（标题、备注、截止日期、优先级等）
- `deleteTodo(id: string): Promise<void>` — 软删除待办（同时软删除其子任务）
- `toggleDone(id: string): Promise<void>` — 切换完成状态（完成时记录 `done_at`，取消完成时清除）
- `reorder(todoId: string, newSortOrder: number): Promise<void>` — 更新排序
- `toggleExpandParent(parentId: string): void` — 切换子任务折叠/展开
- `setShowCompleted(show: boolean): void` — 切换已完成区域显示
- `subscribeRealtime(): Unsubscribe` — 订阅实时变更，自动更新本地列表
- `todoTree(): TodoTreeNode[]` — 计算属性，返回树形结构（父任务 + 嵌套子任务）
- `completedTodos(): Todo[]` — 计算属性，返回已完成的顶级待办列表

#### Scenario: 拉取待办列表
- **WHEN** 调用 `fetchTodos()`
- **THEN** `loading` 变为 `true`，从后端拉取当前用户所有未删除的待办，按 `sort_order` 升序排列，完成后 `loading` 变为 `false`

#### Scenario: 创建待办
- **WHEN** 调用 `createTodo({ title: '买菜', priority: 1 })`
- **THEN** 后端创建记录成功（`done` 默认 `false`，`sort_order` 自动设为当前最大值 + 1），本地列表同步更新

#### Scenario: 创建子任务
- **WHEN** 调用 `createTodo({ title: '买西红柿', parent_id: '<父任务ID>' })`
- **THEN** 后端创建记录成功，`parent_id` 指向父任务，本地树形结构自动更新

#### Scenario: 软删除待办
- **WHEN** 调用 `deleteTodo(id)` 且该待办有 2 个子任务
- **THEN** 后端将该待办及其 2 个子任务的 `_deleted` 均设为 `true`，本地列表移除这 3 条记录

#### Scenario: 切换完成状态 — 完成
- **WHEN** 调用 `toggleDone(id)` 且当前 `done` 为 `false`
- **THEN** 后端更新 `done` 为 `true`、`done_at` 为当前时间，本地列表更新

#### Scenario: 切换完成状态 — 取消完成
- **WHEN** 调用 `toggleDone(id)` 且当前 `done` 为 `true`
- **THEN** 后端更新 `done` 为 `false`、`done_at` 为 `null`，本地列表更新

#### Scenario: 拖拽排序
- **WHEN** 调用 `reorder('<todoId>', 5)`
- **THEN** 后端更新该待办的 `sort_order` 为 `5`，本地列表按新排序重排

#### Scenario: 树形结构计算
- **WHEN** 待办列表包含父任务 A 和子任务 A1、A2（`parent_id` 指向 A）
- **THEN** `todoTree()` 返回 `[{ todo: A, children: [A1, A2] }]`，子任务按 `sort_order` 排序

#### Scenario: 实时同步 — 其他端创建待办
- **WHEN** 已调用 `subscribeRealtime()` 且另一端创建了一条待办
- **THEN** 本地 `todos` 列表自动更新，新待办出现在列表中

#### Scenario: 实时同步 — 其他端完成待办
- **WHEN** 已调用 `subscribeRealtime()` 且另一端将一条待办标记为完成
- **THEN** 本地该待办的 `done` 和 `done_at` 自动更新

### Requirement: CreateTodoInput 和 UpdateTodoInput 类型
共享层 SHALL 导出 `CreateTodoInput` 和 `UpdateTodoInput` 类型：

- `CreateTodoInput`: `{ title: string, note?: string, due_date?: string, priority?: TodoPriority, parent_id?: string, tags?: string[] }`
- `UpdateTodoInput`: `Partial<Pick<Todo, 'title' | 'note' | 'due_date' | 'priority' | 'done' | 'done_at' | 'sort_order' | 'tags'>>`

#### Scenario: CreateTodoInput 仅需 title
- **WHEN** 创建 `CreateTodoInput` 仅提供 `{ title: '测试' }`
- **THEN** TypeScript 编译通过，其余字段均为可选

#### Scenario: UpdateTodoInput 支持部分更新
- **WHEN** 创建 `UpdateTodoInput` 为 `{ priority: 2 }`
- **THEN** TypeScript 编译通过，仅更新优先级字段

### Requirement: TodoTreeNode 类型
共享层 SHALL 导出 `TodoTreeNode` 类型：`{ todo: Todo, children: Todo[] }`，用于 `todoTree()` 的返回值。

#### Scenario: TodoTreeNode 结构正确
- **WHEN** 使用 `TodoTreeNode` 类型
- **THEN** 包含 `todo`（父任务）和 `children`（子任务数组）两个字段

### Requirement: 待办列表页面（TodosListScreen）
移动端 SHALL 提供 TodosListScreen，展示待办事项列表，包含：
- 顶部标题栏显示「待办」
- 「进行中」区域：展示未完成的顶级待办，每个待办以 TodoCard 形式显示
- 父任务可点击展开/折叠子任务列表
- 「已完成」区域：默认折叠，点击标题可展开，展示已完成的待办（灰色/删除线样式）
- 底部悬浮创建按钮（FAB），点击进入创建待办页面
- 加载状态显示加载指示器
- 空状态显示 EmptyState 组件

#### Scenario: 列表加载
- **WHEN** 用户进入 TodosListScreen
- **THEN** 显示加载指示器，数据加载完成后展示待办列表

#### Scenario: 空列表
- **WHEN** 用户没有任何待办
- **THEN** 显示 EmptyState 组件，提示用户创建第一条待办

#### Scenario: 进行中区域展示
- **WHEN** 用户有 3 条未完成的顶级待办
- **THEN** 「进行中」区域按 `sort_order` 顺序展示 3 张 TodoCard

#### Scenario: 子任务展开
- **WHEN** 用户点击有 2 个子任务的父任务的展开按钮
- **THEN** 子任务列表展开显示在父任务下方，缩进展示

#### Scenario: 子任务折叠
- **WHEN** 用户点击已展开子任务的父任务的折叠按钮
- **THEN** 子任务列表收起，仅显示父任务卡片（附带子任务计数标识）

#### Scenario: 已完成区域展开
- **WHEN** 用户点击「已完成」标题栏
- **THEN** 已完成的待办列表展开显示，待办以灰色/删除线样式呈现

#### Scenario: 快速完成
- **WHEN** 用户点击 TodoCard 上的完成勾选框
- **THEN** 该待办标记为已完成，从「进行中」区域移到「已完成」区域

### Requirement: 待办卡片组件（TodoCard）
移动端 SHALL 提供 TodoCard 组件，展示单条待办的信息：
- 左侧完成勾选框（圆形，未完成空心，已完成打勾填充）
- 标题文本（已完成时加删除线 + 灰色）
- 优先级颜色指示条（左边框：高=红色、中=橙色、低=灰色/无）
- 截止日期标签（如有，过期显示红色）
- 子任务计数标识（如有子任务，显示「2/5」格式，表示已完成/总数）
- 点击卡片进入编辑页面
- 长按触发删除确认

#### Scenario: 普通待办展示
- **WHEN** 渲染一条优先级为「高」、截止日期为明天的待办
- **THEN** 左边框显示红色，截止日期标签显示正常颜色

#### Scenario: 过期待办展示
- **WHEN** 渲染一条截止日期已过的未完成待办
- **THEN** 截止日期标签显示红色，提醒用户已逾期

#### Scenario: 含子任务的待办展示
- **WHEN** 渲染一条有 5 个子任务（2 个已完成）的待办
- **THEN** 显示子任务计数「2/5」

#### Scenario: 已完成待办样式
- **WHEN** 渲染一条已完成的待办
- **THEN** 勾选框填充打勾，标题加删除线并变灰

#### Scenario: 删除确认
- **WHEN** 用户长按 TodoCard
- **THEN** 显示确认对话框，确认后执行软删除

### Requirement: 待办表单页面（TodoFormScreen）
移动端 SHALL 提供 TodoFormScreen，用于创建和编辑待办，包含：
- 标题输入框（必填，不得为空）
- 备注输入框（多行文本，可选）
- 截止日期选择器（点击弹出原生日期选择，可清除）
- 优先级选择器（低/中/高 三档，默认低）
- 父任务选择（可选，下拉选择现有未完成的顶级待办）
- 保存按钮（创建模式显示「创建」，编辑模式显示「保存」）
- 编辑模式下，加载已有数据填充表单

#### Scenario: 创建模式
- **WHEN** 从待办列表页点击 FAB 进入 TodoFormScreen
- **THEN** 表单为空，标题为「新建待办」，按钮显示「创建」

#### Scenario: 编辑模式
- **WHEN** 从 TodoCard 点击进入 TodoFormScreen 并传入 todoId
- **THEN** 表单加载该待办的数据（标题、备注、截止日期、优先级），标题为「编辑待办」，按钮显示「保存」

#### Scenario: 标题为空校验
- **WHEN** 用户未输入标题直接点击创建/保存
- **THEN** 显示「标题不能为空」提示，不发起请求

#### Scenario: 创建成功
- **WHEN** 用户输入标题、选择优先级并点击创建
- **THEN** 待办被创建到后端，自动返回列表页，新待办出现在列表中

#### Scenario: 编辑保存成功
- **WHEN** 用户修改标题和优先级后点击保存
- **THEN** 待办被更新到后端，自动返回列表页，列表反映最新数据

#### Scenario: 选择截止日期
- **WHEN** 用户点击截止日期输入区域
- **THEN** 弹出原生日期选择器，选择后日期显示在输入区域

#### Scenario: 清除截止日期
- **WHEN** 用户点击已选截止日期旁的清除按钮
- **THEN** 截止日期被清除，恢复为「无截止日期」状态

### Requirement: 优先级选择器组件（PriorityPicker）
移动端 SHALL 提供 PriorityPicker 组件，支持选择待办优先级：
- 三个选项：低（0）、中（1）、高（2）
- 每个选项使用对应颜色标识（低=灰色、中=橙色、高=红色）
- 选中项高亮显示
- 接收 `value` 和 `onChange` props

#### Scenario: 默认选中低优先级
- **WHEN** 渲染 PriorityPicker 且 `value` 为 `0`
- **THEN** 「低」选项高亮显示

#### Scenario: 切换优先级
- **WHEN** 用户点击「高」选项
- **THEN** `onChange` 被调用，参数为 `2`

### Requirement: 日期选择器组件（DatePicker）
移动端 SHALL 提供 DatePicker 组件，用于选择日期：
- 点击触发原生日期选择器（`@react-native-community/datetimepicker`）
- 显示已选日期的格式化文本（如 `2026-04-20`）
- 支持清除按钮（设值为 `null`）
- 接收 `value`（`string | null`）和 `onChange` props

#### Scenario: 无日期状态
- **WHEN** 渲染 DatePicker 且 `value` 为 `null`
- **THEN** 显示占位文本「选择日期」

#### Scenario: 选择日期
- **WHEN** 用户通过原生日期选择器选定 2026-04-20
- **THEN** `onChange` 被调用，参数为 `'2026-04-20T00:00:00.000Z'` 格式的 ISO 字符串

#### Scenario: 清除日期
- **WHEN** 用户点击清除按钮
- **THEN** `onChange` 被调用，参数为 `null`

### Requirement: 待办导航集成
移动端 SHALL 将 MainTab 中的待办 Tab 从 PlaceholderScreen 替换为 TodosListScreen，并注册 TodoFormScreen 到导航栈。

#### Scenario: Tab 导航到待办
- **WHEN** 用户点击底部 Tab 栏的「待办」Tab
- **THEN** 显示 TodosListScreen，展示待办列表

#### Scenario: 导航到创建页面
- **WHEN** 用户在 TodosListScreen 点击 FAB 按钮
- **THEN** 导航到 TodoFormScreen（创建模式）

#### Scenario: 导航到编辑页面
- **WHEN** 用户在 TodosListScreen 点击某条待办卡片
- **THEN** 导航到 TodoFormScreen（编辑模式，传入 todoId）
