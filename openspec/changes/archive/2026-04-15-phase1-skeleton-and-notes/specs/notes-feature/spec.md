## ADDED Requirements

### Requirement: useNotesStore 快速记录状态管理
共享层 SHALL 导出 `useNotesStore`（Zustand store），管理快速记录的数据和 UI 状态，包含：

**状态**：
- `notes: Note[]` — 快速记录列表
- `loading: boolean` — 数据加载中
- `filter: NoteType | 'all'` — 当前分类筛选条件

**操作**：
- `fetchNotes(): Promise<void>` — 从后端拉取所有快速记录（按 `pinned` 降序 + `created_at` 降序排列）
- `createNote(content: string, type: NoteType): Promise<void>` — 创建快速记录
- `deleteNote(id: string): Promise<void>` — 软删除快速记录
- `togglePin(id: string): Promise<void>` — 切换置顶状态
- `setFilter(filter: NoteType | 'all'): void` — 设置分类筛选
- `subscribeRealtime(): Unsubscribe` — 订阅实时变更，自动更新本地列表
- `filteredNotes(): Note[]` — 根据当前 filter 返回过滤后的列表（计算属性）

#### Scenario: 拉取快速记录列表
- **WHEN** 调用 `fetchNotes()`
- **THEN** `loading` 变为 `true`，从后端拉取当前用户所有未删除的快速记录，按置顶优先 + 创建时间降序排列，完成后 `loading` 变为 `false`

#### Scenario: 创建快速记录
- **WHEN** 调用 `createNote('买牛奶', 'memo')`
- **THEN** 后端创建记录成功，本地列表同步更新（新记录出现在列表中）

#### Scenario: 软删除快速记录
- **WHEN** 调用 `deleteNote(id)`
- **THEN** 后端将该记录 `_deleted` 设为 `true`，本地列表移除该记录

#### Scenario: 切换置顶
- **WHEN** 调用 `togglePin(id)` 且当前记录 `pinned` 为 `false`
- **THEN** 后端更新 `pinned` 为 `true`，本地列表重新排序（置顶记录排在最前）

#### Scenario: 分类筛选
- **WHEN** 调用 `setFilter('idea')`
- **THEN** `filteredNotes()` 仅返回 `type` 为 `'idea'` 的记录

#### Scenario: 筛选全部
- **WHEN** 调用 `setFilter('all')`
- **THEN** `filteredNotes()` 返回所有记录（不过滤 type）

#### Scenario: 实时同步 — 其他端插入
- **WHEN** 已调用 `subscribeRealtime()` 且另一端创建了一条快速记录
- **THEN** 本地 `notes` 列表自动更新，新记录出现在列表中

#### Scenario: 实时同步 — 其他端删除
- **WHEN** 已调用 `subscribeRealtime()` 且另一端软删除了一条记录
- **THEN** 本地 `notes` 列表自动移除该记录

### Requirement: 快速记录列表页面
移动端 SHALL 提供 NotesListScreen，展示快速记录列表，包含：
- 顶部分类筛选栏（全部 / 灵感 / 备忘 / 日志）
- 快速记录卡片列表（显示内容、分类标签、置顶标记、创建时间）
- 置顶记录排在最前，视觉上与普通记录有区分（如置顶图标或背景色）
- 空状态提示（EmptyState 组件）
- 底部悬浮创建按钮（FAB）

#### Scenario: 列表加载
- **WHEN** 用户进入 NotesListScreen
- **THEN** 显示加载指示器，数据加载完成后展示快速记录列表

#### Scenario: 空列表
- **WHEN** 用户没有任何快速记录
- **THEN** 显示 EmptyState 组件，提示用户创建第一条记录

#### Scenario: 分类筛选
- **WHEN** 用户点击筛选栏的"灵感"
- **THEN** 列表仅显示 `type` 为 `'idea'` 的记录

#### Scenario: 置顶记录排序
- **WHEN** 列表中有置顶和非置顶记录
- **THEN** 置顶记录始终排在列表最前，置顶记录内部按创建时间降序

### Requirement: 快速记录创建
移动端 SHALL 提供创建快速记录的交互，包含：
- 内容输入框（多行文本）
- 分类选择（灵感 / 备忘 / 日志，默认为备忘）
- 创建按钮（loading 状态）
- 内容不得为空的校验

#### Scenario: 创建成功
- **WHEN** 用户输入内容、选择分类并点击创建
- **THEN** 记录被创建到后端，自动返回列表页，新记录出现在列表中

#### Scenario: 内容为空校验
- **WHEN** 用户未输入内容直接点击创建
- **THEN** 显示"内容不能为空"提示，不发起请求

### Requirement: 快速记录操作 — 删除和置顶
移动端 SHALL 在快速记录卡片上提供以下操作：
- 左滑或长按显示删除按钮
- 点击置顶按钮切换置顶状态

#### Scenario: 删除确认
- **WHEN** 用户对一条记录触发删除操作
- **THEN** 显示确认对话框，确认后执行软删除，记录从列表消失

#### Scenario: 切换置顶
- **WHEN** 用户点击非置顶记录的置顶按钮
- **THEN** 记录被置顶，列表重新排序，该记录移到顶部

#### Scenario: 取消置顶
- **WHEN** 用户点击已置顶记录的置顶按钮
- **THEN** 记录取消置顶，列表重新排序，该记录回到正常位置
