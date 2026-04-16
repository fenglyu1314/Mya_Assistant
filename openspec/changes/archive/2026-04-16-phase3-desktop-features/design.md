## Context

桌面端（`@mya/desktop`）已在 `phase3-desktop-skeleton` 中完成基础搭建：

- **框架**：Electron 35 + electron-vite + React 19 + react-router-dom
- **UI 系统**：Tailwind CSS 4 + shadcn/ui（已有 button、card、input、label 组件）+ Lucide Icons
- **布局**：`MainLayout`（左侧 Sidebar 240px + 右侧弹性内容区）
- **认证**：`useAuthStore` 集成、登录/注册页面、AuthGuard/GuestGuard 路由守卫
- **路由**：`/notes`、`/todos`、`/schedules`、`/settings` 四个路由已注册，指向占位组件
- **Supabase**：渲染进程通过 `lib/supabase.ts` 初始化客户端，环境变量从 `.env.local` 注入

共享层（`@mya/shared`）已导出完整的 Store：`useNotesStore`、`useTodosStore`、`useSchedulesStore`，均支持 CRUD + Realtime 订阅。移动端已验证所有功能正常。

本次需要将四个占位页面替换为真实功能页面，**仅涉及桌面端渲染层**，不修改共享层和移动端。

## Goals / Non-Goals

**Goals:**
- 桌面端实现与移动端功能对等的快速记录、待办、日程三大模块
- 充分发挥宽屏优势（列表 + 表单双栏、内联编辑、更丰富的信息密度）
- 复用共享层 Store，桌面端代码仅负责 UI 渲染
- 设置页面提供用户信息和登出

**Non-Goals:**
- 不实现离线同步（桌面端暂不集成 SQLite 本地缓存，依赖在线同步）
- 不实现拖拽排序（待办排序能力暂缓，降低首版复杂度）
- 不实现本地通知/提醒推送（Electron notification API 留到 Phase 4）
- 不实现电纸书 E-Ink 主题（属于 `phase3-eink-theme`）
- 不修改共享层 Store 或数据模型

## Decisions

### D1: 桌面端页面交互模式 — 弹窗表单 vs 页面级路由

**选择**：对话框（Dialog）弹窗表单

**理由**：
- 桌面端屏幕宽度充足，创建/编辑操作适合在当前页面上覆盖弹窗，保持列表上下文不丢失
- 移动端因屏幕限制必须用全屏页面导航，桌面端则不需要
- 避免为每个模块增加独立的 create/edit 路由，保持路由结构简洁

**备选方案**：
- 页面级路由（`/todos/create`、`/todos/:id/edit`）→ 过于 mobile-like，丢失列表上下文
- 右侧面板（Split View）→ 实现复杂度高，首版不采用

### D2: 月历组件选型

**选择**：`react-day-picker` v9

**理由**：
- 纯 React 组件，零依赖，与 Tailwind CSS + shadcn/ui 样式体系完美兼容
- shadcn/ui 官方推荐的日历组件方案
- 轻量（~10KB gzip），不引入 date-fns 以外的重量级依赖
- 支持单日选择、日期标记（modifiers）、月份切换等所需功能

**备选方案**：
- `react-big-calendar` → 过重，面向复杂日程管理（甘特图级别），超出需求
- 自实现月历 → 开发成本高，不必要

### D3: UI 组件补充策略

**选择**：通过 shadcn/ui 的组件模式手动创建所需组件文件

**理由**：
- shadcn/ui 是 copy-paste 式组件库，组件代码存放在项目内
- 需要补充：`dialog`、`dropdown-menu`、`badge`、`textarea`、`select`、`switch`、`separator`、`scroll-area`
- 保持与已有 `button`、`card`、`input`、`label` 风格一致

### D4: 快速记录页面布局

**选择**：顶部内联创建区 + 分类筛选 Tab + 卡片列表

**理由**：
- 快速记录强调「低摩擦」，桌面端应进一步降低操作步骤
- 内联创建区（输入框 + 分类选择 + 提交按钮）省去打开弹窗的步骤
- 卡片网格布局利用宽屏空间（移动端为单列，桌面端可多列）

### D5: 待办页面布局

**选择**：左侧列表面板 + 右侧 Dialog 弹窗编辑

**理由**：
- 列表区分「进行中」和「已完成」两个分区，与移动端一致
- 子任务支持展开/折叠
- 创建和编辑通过 Dialog 弹窗完成，列表上下文保持可见

### D6: 日程页面布局

**选择**：左侧月历 + 右侧日程列表的双栏布局

**理由**：
- 充分利用宽屏，月历和日程列表同时可见
- 点击月历日期联动右侧列表筛选
- 创建和编辑通过 Dialog 弹窗完成

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| react-day-picker 与 Tailwind CSS 4 样式兼容性 | 月历组件样式可能需要自定义调整 | shadcn/ui 已有 Calendar 组件模板，直接复用其样式方案 |
| 共享层 Store 在 Electron 渲染进程中的 Realtime 订阅稳定性 | WebSocket 连接可能在窗口最小化/休眠后断开 | 首版不做特殊处理，与移动端行为一致；后续可监听 Electron 窗口事件做重连 |
| 无离线支持 | 断网时桌面端无法操作 | 这是明确的 Non-Goal，用户预期桌面端始终在线使用；离线能力留到后续迭代 |
| shadcn/ui 组件手动维护 | 组件数量增多后维护成本上升 | 遵循 shadcn/ui 标准实现，保持组件间一致的 API 风格 |
