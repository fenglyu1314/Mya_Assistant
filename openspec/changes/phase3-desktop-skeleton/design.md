## Context

Mya Assistant 已完成移动端全部核心功能（Phase 0~2），共享层 `@mya/shared` 封装了数据模型、Auth、SyncAdapter、Zustand stores、离线同步引擎等全部平台无关逻辑。`packages/desktop` 目前仅为空占位包。

Phase 3 需要搭建 Electron 桌面端项目，复用共享层，建立独立的 UI 层。本 Change 聚焦于项目骨架搭建，不涉及具体功能页面实现（快速记录/待办/日程页面将在后续 Change 中完成）。

## Goals / Non-Goals

**Goals:**
- 建立可运行的 Electron + React + TypeScript 桌面端项目
- 引入 Tailwind CSS + shadcn/ui 作为 UI 框架
- 验证共享层 `@mya/shared` 在 Electron renderer 进程中的可用性
- 实现桌面端认证流程（登录/注册），作为共享层复用的首个验证
- 建立桌面端导航框架（侧边栏 + 内容区宽屏布局骨架）
- 实现基础窗口管理（尺寸约束、标题栏）

**Non-Goals:**
- 功能页面实现（快速记录/待办/日程 UI），留给 `phase3-desktop-features`
- 电纸书端 E-Ink 主题适配，留给 `phase3-eink-theme`
- 离线同步引擎在桌面端的集成（需要 SQLite 方案，留给功能 Change）
- 自动更新机制
- 应用打包和分发（installer 构建）
- 托盘图标和系统通知

## Decisions

### D1: 构建工具选择 — Vite + electron-vite

**选择**: 使用 `electron-vite` 作为构建工具。

**理由**: `electron-vite` 是专为 Electron 设计的 Vite 构建方案，一套配置统一管理 main/preload/renderer 三个入口，支持 HMR 热更新，开发体验优于 webpack。相比手动配置 Vite + Electron，`electron-vite` 减少了大量模板代码。

**备选方案**:
- `electron-forge + webpack`: 配置复杂，构建速度慢
- `vite + electron-builder` 手动集成: 需要自行处理 main 进程构建、路径问题，工程量大

### D2: 进程架构 — main + preload + renderer

**选择**: 标准 Electron 三进程架构。

- **main 进程**: 窗口管理、系统集成、应用生命周期
- **preload 脚本**: 安全桥接，通过 `contextBridge` 暴露有限 API
- **renderer 进程**: React 应用（UI + 共享层调用）

**理由**: 遵循 Electron 安全最佳实践（`contextIsolation: true`、`nodeIntegration: false`）。共享层仅在 renderer 进程中运行，通过浏览器环境的 Supabase JS SDK 与后端通信，无需 Node.js API。

### D3: UI 框架选择 — Tailwind CSS + shadcn/ui

**选择**: Tailwind CSS 4 + shadcn/ui 组件库。

**理由**:
- Tailwind CSS 提供原子化 CSS，与桌面端宽屏布局配合良好
- shadcn/ui 提供高质量的可复制组件（非 npm 包依赖），可深度定制
- shadcn/ui 底层基于 Radix UI，无障碍支持完善
- 与 Vite 构建链天然兼容

**备选方案**:
- `Ant Design`: 体积大，样式定制灵活性差
- `Material UI`: React Native 已用自建组件，桌面端不需要 Material 风格
- `Chakra UI`: 运行时 CSS-in-JS 性能开销

### D4: 路由方案 — React Router v7

**选择**: 使用 `react-router-dom` v7 作为客户端路由。

**理由**: Electron renderer 本质是 SPA，React Router 是 React 生态最成熟的路由方案。使用内存路由（`createMemoryRouter`）而非浏览器路由，避免 Electron 中的 file:// 协议问题。

### D5: 环境变量传递 — .env + import.meta.env

**选择**: renderer 进程通过 Vite 的 `import.meta.env` 读取环境变量（`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`），与项目根目录的 `.env.local` 统一管理。

**理由**: 复用现有 `.env.local` 基础设施，Vite 原生支持 `VITE_` 前缀的环境变量注入到 renderer 进程。共享层的 `createSupabaseClient` 在 renderer 中调用时传入这些值。

### D6: 共享层接入方式 — 直接 TypeScript 源码引用

**选择**: 桌面端通过 pnpm workspace 直接引用 `@mya/shared` 的 TypeScript 源码（`main: "src/index.ts"`），由 Vite 在构建时编译。

**理由**: 与移动端一致的方式，无需额外编译步骤。Vite 天然支持 TypeScript，resolve 到 workspace 包的源码后直接编译。

### D7: 桌面端布局 — 侧边栏 + 内容区

**选择**: 固定侧边栏（可折叠）+ 右侧内容区的经典桌面布局。

布局结构：
```
┌─────────────────────────────────────────┐
│  侧边栏 (240px)  │    内容区            │
│  ┌─────────────┐  │                     │
│  │ Logo/用户   │  │    <Route 内容>     │
│  │ 快速记录    │  │                     │
│  │ 待办        │  │                     │
│  │ 日程        │  │                     │
│  │ ───────     │  │                     │
│  │ 设置        │  │                     │
│  └─────────────┘  │                     │
└─────────────────────────────────────────┘
```

**理由**: 桌面端常见布局模式，充分利用宽屏空间。侧边栏提供全局导航，内容区根据路由切换。后续功能 Change 可在内容区内实现具体页面。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 共享层在 Electron renderer 中可能存在兼容性问题（如某些 API 差异） | 骨架搭建后立即验证 Auth 流程，尽早发现问题 |
| electron-vite 版本更新可能引入 breaking change | 锁定具体版本，使用 pnpm 精确依赖管理 |
| shadcn/ui 组件需要逐个手动添加，初始工作量较大 | 骨架阶段仅添加基础组件（Button、Input、Card），功能 Change 按需补充 |
| Tailwind CSS 4 较新，部分 shadcn/ui 组件可能需要适配 | 使用 shadcn/ui 官方推荐的 Tailwind CSS 版本，确保兼容性 |
