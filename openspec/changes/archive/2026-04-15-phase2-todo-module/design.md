## Context

Phase 0 和 Phase 1 已完成以下基础设施：

- **数据模型**：`Todo` 接口已在共享层定义（含 `parent_id` 子任务、`sort_order` 排序、`priority` 优先级、`done`/`done_at` 完成状态）
- **数据库**：Supabase `todos` 表已建好，含 RLS 策略、`updated_at` 触发器、Realtime 启用
- **同步引擎**：`SyncAdapter<T>` 接口 + `SupabaseAdapter` 实现，支持 CRUD + Realtime 订阅
- **状态管理模式**：`useNotesStore` 已建立了 Zustand store 的标准模式（fetch / create / delete / subscribe / filter）
- **移动端骨架**：导航框架（MainTab + AuthStack）、主题系统、基础组件（Button / Card / TextInput / EmptyState）已就绪，待办 Tab 使用 PlaceholderScreen 占位

本次需要在此基础上实现完整的待办事项功能模块。

## Goals / Non-Goals

**Goals:**
- 实现共享层 `useTodosStore`，完整管理待办的状态和操作
- 实现移动端待办列表页面，支持按完成状态分组、优先级标识、子任务折叠
- 实现移动端待办创建/编辑页面，支持标题、备注、截止日期、优先级、父任务选择
- 支持一级子任务（`parent_id` 关联），列表中子任务折叠显示在父任务下方
- 支持拖拽排序（通过 `sort_order` 字段持久化排序结果）
- 通过 Realtime 订阅实现多端实时同步
- 复用共享层已有的 `SyncAdapter` 和 `SupabaseAdapter` 模式

**Non-Goals:**
- 不实现离线支持（离线同步引擎是 Phase 2 的另一个独立 Change）
- 不实现日程模块（Phase 2 另一个 Change）
- 不实现标签管理功能（Phase 4）
- 不实现递归子任务（仅支持一级嵌套，即子任务不能再有子任务）
- 不实现桌面端 UI（Phase 3）

## Decisions

### D1：Store 模式复用 useNotesStore 的结构

**决定**：`useTodosStore` 采用与 `useNotesStore` 相同的 Zustand store 模式 — 同一文件内定义 State 接口 + Actions 接口，使用 `SupabaseAdapter<Todo>` 作为数据层。

**理由**：
- 团队已验证此模式可行（Phase 1 快速记录模块运行良好）
- 保持代码风格统一，降低认知负担
- 后续桌面端复用共享层时可直接使用相同 store

**替代方案**：引入独立的 Repository 层。开销更大，当前模块复杂度不需要。

### D2：子任务采用平铺存储 + 客户端组装树

**决定**：`todos` 表中子任务和父任务平铺存储（通过 `parent_id` 关联），客户端 store 在 fetch 后组装成树形结构供 UI 使用。

**理由**：
- 数据库层面保持平铺简化查询和同步（Supabase 的 Realtime 对嵌套查询支持有限）
- 树形组装逻辑放在 store 的计算属性中，UI 层直接使用
- 平铺存储便于后续实现拖拽排序（只需更新 `sort_order` 字段）

**替代方案**：数据库使用嵌套 JSON 字段存储子任务。违背已有的 `todos` 表设计，且与 SyncAdapter 模式不兼容。

### D3：拖拽排序使用 react-native-gesture-handler + sort_order 字段

**决定**：使用 `react-native-gesture-handler`（移动端已安装 `react-native-screens` 依赖链中常附带）配合自定义拖拽逻辑，拖拽完成后批量更新 `sort_order` 字段。

**理由**：
- `sort_order` 整数字段已在 `todos` 表中预定义
- 拖拽结束时，只需对受影响的 todo 更新 `sort_order`，然后同步到后端
- 不引入重型拖拽库（如 `react-native-draggable-flatlist`），保持依赖轻量

**替代方案**：使用 `react-native-draggable-flatlist`。功能更丰富但增加额外依赖，且对 React Native 0.85 的兼容性需验证。作为备选，如果自定义拖拽实现过于复杂，可退回此方案。

### D4：日期选择器使用 @react-native-community/datetimepicker

**决定**：截止日期选择使用 `@react-native-community/datetimepicker`，这是 React Native 生态中最成熟的原生日期选择组件。

**理由**：
- 提供原生 Android / iOS 日期选择体验
- 社区维护活跃，与 React Native 0.85 兼容性好
- 后续日程模块的时间选择也可复用

### D5：列表按完成状态分组 — 未完成在上，已完成折叠在下

**决定**：待办列表分为两个区域：「进行中」（`done: false`）在上方，「已完成」（`done: true`）折叠在下方。已完成区域默认折叠，点击可展开。

**理由**：
- 符合主流待办应用的交互习惯（Todoist、TickTick 等）
- 已完成的任务不干扰当前工作焦点
- 折叠/展开可保留查看历史完成情况的能力

## Risks / Trade-offs

- **[拖拽排序复杂度]** → 自定义拖拽实现可能较复杂。如遇阻，退回使用 `react-native-draggable-flatlist` 作为备选方案。
- **[子任务层级限制]** → 仅支持一级子任务。如果用户在使用中需要更深层级，需要后续 Change 扩展。当前选择优先降低实现复杂度。
- **[批量更新 sort_order 的性能]** → 拖拽排序后需要批量更新多条记录的 `sort_order`。待办数量通常不大（< 200），逐条更新可接受。如果性能出现问题，可改用 Supabase RPC 批量更新。
- **[Realtime 与本地操作竞争]** → 用户操作后立即更新本地状态，Realtime 事件可能短暂导致重复更新。采用与 `useNotesStore` 相同的 ID 去重策略。
