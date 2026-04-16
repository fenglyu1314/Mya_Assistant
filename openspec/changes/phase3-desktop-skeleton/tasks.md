## 1. Electron 项目初始化

- [ ] 1.1 初始化 `packages/desktop` 的 Electron + electron-vite 项目结构。创建 `src/main/index.ts`、`src/preload/index.ts`、`src/renderer/` 目录、`electron-vite.config.ts`。**验收**: 目录结构完整，`electron-vite.config.ts` 正确配置 main/preload/renderer 三个入口。
- [ ] 1.2 更新 `packages/desktop/package.json`，添加所有依赖（`electron`、`electron-vite`、`react`、`react-dom`、`react-router-dom`、`typescript`、`@mya/shared` 等）和脚本（`dev`、`build`、`typecheck`）。**验收**: `pnpm install` 正常完成，无依赖冲突。
- [ ] 1.3 创建 `packages/desktop/tsconfig.json`（分 main/renderer 两套配置）和 `packages/desktop/tsconfig.node.json`。**验收**: `pnpm typecheck` 无报错。
- [ ] 1.4 更新项目根 `package.json`，添加 `desktop:dev` 和 `desktop:build` 脚本。**验收**: 从根目录执行 `pnpm desktop:dev` 可启动桌面端。

## 2. 主进程与预加载脚本

- [ ] 2.1 实现 `src/main/index.ts` 主进程：创建 BrowserWindow（1200×800 默认尺寸，800×600 最小尺寸，居中显示），配置 `contextIsolation: true`、`nodeIntegration: false`、`preload` 路径。**验收**: 执行 `pnpm dev` 后 Electron 窗口正常打开。
- [ ] 2.2 实现 `src/preload/index.ts` 预加载脚本：通过 `contextBridge.exposeInMainWorld('electronAPI', { platform, version })` 暴露平台信息和版本号。**验收**: renderer 进程中 `window.electronAPI.platform` 返回正确值。
- [ ] 2.3 创建 `src/preload/index.d.ts` 类型声明文件，声明 `Window.electronAPI` 类型。**验收**: renderer 进程中访问 `window.electronAPI` 时 TypeScript 提供正确的类型提示。

## 3. Renderer 进程基础设施

- [ ] 3.1 创建 `src/renderer/index.html` 入口 HTML 和 `src/renderer/main.tsx` React 入口文件。**验收**: Electron 窗口中渲染出 React 应用。
- [ ] 3.2 配置 Tailwind CSS 4：安装 `tailwindcss`、`@tailwindcss/vite`，创建 `src/renderer/styles/globals.css`。**验收**: Tailwind 工具类在组件中生效。
- [ ] 3.3 初始化 shadcn/ui：创建 `components.json` 配置，安装 shadcn/ui CLI，添加基础组件（Button、Input、Card、Label）。**验收**: 可在 React 组件中导入并使用 shadcn/ui 组件。
- [ ] 3.4 配置环境变量：确保 `import.meta.env.VITE_SUPABASE_URL` 和 `import.meta.env.VITE_SUPABASE_ANON_KEY` 从根目录 `.env.local` 正确读取。添加环境变量缺失时的错误提示。**验收**: renderer 中可正常读取 Supabase 配置。

## 4. 共享层集成与 Supabase 初始化

- [ ] 4.1 在 renderer 进程中初始化 Supabase 客户端：创建 `src/renderer/lib/supabase.ts`，调用共享层 `createSupabaseClient` 传入环境变量。**验收**: Supabase 客户端创建成功，无运行时错误。
- [ ] 4.2 创建 `src/renderer/App.tsx` 根组件，包含 Supabase 初始化和 `useAuthStore.initialize()` 调用。添加全局 loading 状态（认证初始化中显示加载指示器）。**验收**: 应用启动后正确恢复/检测认证状态。
- [ ] 4.3 验证共享层导入：确保 `Schedule`、`Todo`、`Note` 类型和 `useNotesStore`、`useTodosStore`、`useSchedulesStore` 均可从 `@mya/shared` 正确导入并使用。**验收**: TypeScript 编译通过，运行时无 import 错误。

## 5. 路由系统

- [ ] 5.1 创建路由配置 `src/renderer/router.tsx`：使用 `createMemoryRouter` 定义认证路由（`/login`、`/register`）和主页面路由（`/notes`、`/todos`、`/schedules`、`/settings`），默认重定向到 `/notes`。**验收**: 路由定义完整，TypeScript 无报错。
- [ ] 5.2 实现认证路由守卫组件 `AuthGuard` 和 `GuestGuard`：已登录用户访问认证页面自动跳转主页面，未登录用户访问主页面自动跳转登录页。**验收**: 认证状态切换时路由自动正确跳转。

## 6. 桌面端认证页面

- [ ] 6.1 实现 `LoginPage` 组件：邮箱/密码输入框（shadcn/ui Input）、登录按钮（shadcn/ui Button）、表单校验（邮箱格式、密码≥6位）、错误提示、注册链接、加载状态。居中卡片布局（约 400px 宽）。**验收**: 登录流程端到端可用，表单校验和错误提示正常工作。
- [ ] 6.2 实现 `RegisterPage` 组件：邮箱/密码/确认密码输入框、注册按钮、表单校验（密码一致性）、错误提示、登录链接。与 LoginPage 风格一致。**验收**: 注册流程端到端可用，注册成功后自动登录跳转。

## 7. 主布局与侧边栏

- [ ] 7.1 实现 `MainLayout` 组件：左侧固定 Sidebar（240px）+ 右侧弹性内容区（`<Outlet />`）。**验收**: 布局结构正确，侧边栏固定不随滚动，内容区占满剩余空间。
- [ ] 7.2 实现 `Sidebar` 组件：应用名称区域、导航项列表（快速记录/待办/日程，含图标）、底部用户邮箱显示和登出按钮。当前路由对应的导航项高亮。**验收**: 导航切换正常，高亮状态正确，登出功能可用。
- [ ] 7.3 创建 4 个占位页面（`NotesPlaceholder`、`TodosPlaceholder`、`SchedulesPlaceholder`、`SettingsPlaceholder`），每个显示模块名称和「功能开发中...」提示。**验收**: 每个路由均能正确显示对应的占位页面。

## 8. 收尾与验证

- [ ] 8.1 更新 Roadmap：将 Phase 3 状态从 `planning` 更新为 `active`，添加 Change 拆分表格（`phase3-desktop-skeleton`、`phase3-desktop-features`、`phase3-eink-theme`）。**验收**: roadmap/spec.md 更新完成，拆分表格正确。
- [ ] 8.2 端到端验证：启动桌面端 → 登录 → 侧边栏导航切换 → 各占位页面展示 → 登出。确认共享层 Auth 和 Supabase 通信正常。**验收**: 全流程无报错，认证状态管理正确。
