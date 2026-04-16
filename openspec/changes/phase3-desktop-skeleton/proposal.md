## Why

Phase 2 已完成移动端全部核心功能（快速记录、待办、日程）和离线同步引擎。共享层（`@mya/shared`）封装了所有平台无关的业务逻辑。Phase 3 的首要任务是搭建 Electron 桌面端项目骨架，验证共享层的跨端复用能力，为后续桌面端功能页面和电纸书端适配打下基础。

**Phase**: 3（桌面端 + 电纸书端适配）

## What Changes

- **新建 Electron 桌面端项目**：在 `packages/desktop` 中搭建完整的 Electron + React + TypeScript 项目，替换现有占位结构
- **引入桌面端 UI 框架**：Tailwind CSS + shadcn/ui 组件库，建立桌面端设计系统
- **集成共享层**：桌面端通过 `@mya/shared` 复用 Auth、SyncAdapter、Zustand stores、数据模型等全部业务逻辑
- **实现桌面端认证流程**：登录/注册页面，复用 `useAuthStore`，桌面端独立 UI
- **建立桌面端导航框架**：侧边栏导航（快速记录、待办、日程、设置），宽屏三栏/双栏布局骨架
- **桌面端窗口管理**：窗口尺寸约束、标题栏、托盘图标基础功能

## Capabilities

### New Capabilities
- `desktop-skeleton`: 桌面端 Electron 项目结构、构建配置、窗口管理、进程通信（main/renderer）
- `desktop-auth-ui`: 桌面端认证 UI（登录/注册页面），复用共享层 AuthService，桌面端风格的表单和布局
- `desktop-navigation`: 桌面端导航框架（侧边栏 + 内容区布局、路由系统、宽屏布局骨架）

### Modified Capabilities
- `monorepo-structure`: 桌面端从占位包升级为完整 Electron 项目，新增构建脚本和开发命令

## Impact

- **代码**：`packages/desktop` 从空壳变为完整 Electron 项目，新增 main 进程和 renderer 进程代码
- **依赖**：新增 `electron`、`electron-builder`、`react`、`react-dom`、`react-router-dom`、`tailwindcss`、`@radix-ui/*`（shadcn/ui 底层）、`vite`（renderer 构建）
- **构建**：根 `package.json` 新增桌面端开发和构建脚本
- **共享层**：不需要修改，仅验证从桌面端引用的可行性（可能需要微调 exports 配置）
