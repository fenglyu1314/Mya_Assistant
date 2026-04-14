## Why

Phase: 1

Phase 0 完成了基础设施搭建（monorepo 结构、数据模型、SyncAdapter、后端接入验证），但移动端仍停留在开发验证页面阶段，没有任何面向用户的功能。Phase 1 的目标是建立端到端开发闭环：完成用户认证 + 移动端项目骨架 + 第一个完整的业务功能模块（快速记录），让应用从「技术验证」进化到「可用产品」。

## What Changes

- **新增 Supabase Auth 集成**：在共享层封装认证模块（邮箱注册/登录/登出/会话监听），移动端实现登录/注册页面，所有数据操作绑定当前用户身份
- **新增移动端项目骨架**：搭建 React Navigation 导航框架、主题系统（配色/字体/间距 token）、基础 UI 组件库（Button、Input、Card、EmptyState 等）
- **新增快速记录模块完整功能**：创建、查看列表、删除、置顶、按分类筛选、云端实时同步
- **新增 Zustand 状态管理**：在共享层引入 Zustand store，管理认证状态和快速记录数据
- **移除 Phase 0 验证页面**：清理 `CrudVerifyScreen` 和 `RealtimeVerifyScreen`，替换为正式业务页面
- **修复环境变量管理**：移动端从硬编码凭证切换为 `react-native-config` 读取 `.env` 文件

## 非目标

- 不涉及待办事项和日程模块（属于 Phase 2）
- 不涉及离线缓存 / 本地 SQLite（属于 Phase 2）
- 不涉及桌面端和电纸书端（属于 Phase 3）
- 不涉及图片上传（快速记录的 `images` 字段暂不实现 UI，保留数据模型兼容）

## Capabilities

### New Capabilities

- `auth`: Supabase Auth 集成 — 共享层认证模块（邮箱注册/登录/登出/会话管理）+ 移动端登录注册页面
- `mobile-skeleton`: 移动端项目骨架 — React Navigation 导航框架、主题系统、基础 UI 组件库
- `notes-feature`: 快速记录业务模块 — Zustand store + 快速记录页面（列表、创建、删除、置顶、分类筛选）

### Modified Capabilities

（无现有 spec 需要修改，Phase 1 均为新增能力）

## Impact

- **共享层（`packages/shared`）**：新增 `auth/` 模块（认证封装）和 `stores/` 模块（Zustand store）；新增依赖 `zustand`
- **移动端（`packages/mobile`）**：大幅重构 — 新增导航框架、主题系统、UI 组件、业务页面；新增依赖 `@react-navigation/*`、`react-native-config`、`zustand`；移除 Phase 0 验证代码
- **环境变量**：移动端 `.env` 文件需配置 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
- **后端（Supabase）**：需启用 Auth 服务（邮箱登录），RLS 策略已就绪（`auth.uid() = user_id`）
