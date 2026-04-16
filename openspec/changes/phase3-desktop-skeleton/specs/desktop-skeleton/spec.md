## ADDED Requirements

### Requirement: Electron 项目结构
桌面端 SHALL 采用 `electron-vite` 构建，目录结构包含 `src/main`（主进程）、`src/preload`（预加载脚本）、`src/renderer`（React 应用）三个入口。

#### Scenario: 项目目录结构
- **WHEN** 查看 `packages/desktop/` 目录结构
- **THEN** 包含 `src/main/index.ts`（主进程入口）、`src/preload/index.ts`（预加载脚本）、`src/renderer/`（React 应用目录）、`electron-vite.config.ts`（构建配置）

#### Scenario: 开发模式启动
- **WHEN** 在 `packages/desktop` 目录执行 `pnpm dev`
- **THEN** electron-vite 启动开发服务器，打开 Electron 窗口，renderer 进程支持 HMR 热更新

#### Scenario: 生产构建
- **WHEN** 在 `packages/desktop` 目录执行 `pnpm build`
- **THEN** electron-vite 编译 main/preload/renderer 三个入口，输出到 `out/` 目录

### Requirement: 主进程窗口管理
主进程 SHALL 创建 `BrowserWindow`，配置安全选项和窗口属性。

#### Scenario: 窗口创建
- **WHEN** 应用启动
- **THEN** 创建主窗口，默认尺寸 1200×800，最小尺寸 800×600，居中显示

#### Scenario: 安全配置
- **WHEN** 查看 `BrowserWindow` 的 `webPreferences` 配置
- **THEN** `contextIsolation` 为 `true`、`nodeIntegration` 为 `false`、`preload` 指向预加载脚本

#### Scenario: 窗口关闭行为
- **WHEN** 用户点击窗口关闭按钮
- **THEN** 应用退出（Windows 默认行为，不最小化到托盘）

### Requirement: 预加载脚本
预加载脚本 SHALL 通过 `contextBridge` 向 renderer 进程暴露有限的系统 API。

#### Scenario: 暴露平台信息
- **WHEN** renderer 进程访问 `window.electronAPI.platform`
- **THEN** 返回当前操作系统标识（`'win32'` 或 `'darwin'`）

#### Scenario: 暴露应用版本
- **WHEN** renderer 进程访问 `window.electronAPI.version`
- **THEN** 返回应用版本号（来自 `package.json` 的 `version` 字段）

### Requirement: 环境变量配置
桌面端 SHALL 通过 Vite 的 `import.meta.env` 访问 Supabase 配置，环境变量从项目根目录的 `.env.local` 读取。

#### Scenario: Supabase 环境变量可用
- **WHEN** renderer 进程中访问 `import.meta.env.VITE_SUPABASE_URL` 和 `import.meta.env.VITE_SUPABASE_ANON_KEY`
- **THEN** 返回 `.env.local` 中配置的对应值

#### Scenario: 缺少环境变量
- **WHEN** `.env.local` 中未配置 `VITE_SUPABASE_URL` 或 `VITE_SUPABASE_ANON_KEY`
- **THEN** 应用启动时在控制台输出明确的错误提示

### Requirement: 共享层集成
桌面端 renderer 进程 SHALL 通过 `@mya/shared` 包引用共享层的全部导出（数据模型、Auth、SyncAdapter、Zustand stores）。

#### Scenario: 导入共享层类型
- **WHEN** 在 renderer 进程中 `import { Schedule, Todo, Note } from '@mya/shared'`
- **THEN** TypeScript 正确解析类型，无编译错误

#### Scenario: 导入共享层 stores
- **WHEN** 在 renderer 进程中 `import { useAuthStore, useNotesStore, useTodosStore, useSchedulesStore } from '@mya/shared'`
- **THEN** 所有 Zustand stores 可正常使用，状态管理功能正常

#### Scenario: Supabase 客户端初始化
- **WHEN** renderer 进程启动并调用 `createSupabaseClient(url, anonKey)`
- **THEN** Supabase 客户端成功创建，可执行 CRUD 和 Realtime 订阅

### Requirement: package.json 配置
桌面端 `package.json` SHALL 包含完整的依赖声明和脚本定义。

#### Scenario: 开发脚本
- **WHEN** 查看 `packages/desktop/package.json` 的 `scripts`
- **THEN** 包含 `dev`（开发模式）、`build`（生产构建）、`typecheck`（类型检查）

#### Scenario: 核心依赖
- **WHEN** 查看 `packages/desktop/package.json` 的 `dependencies`
- **THEN** 包含 `@mya/shared`（共享层）、`react`、`react-dom`、`react-router-dom`
