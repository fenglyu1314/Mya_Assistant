## MODIFIED Requirements

### Requirement: 三包结构
项目 SHALL 包含三个工作区包：`packages/shared`（包名 `@mya/shared`）、`packages/mobile`（包名 `@mya/mobile`）、`packages/desktop`（包名 `@mya/desktop`）。桌面端包 SHALL 为完整的 Electron 应用项目，包含 main 进程、preload 脚本和 renderer 进程（React 应用）。

#### Scenario: shared 包存在且可引用
- **WHEN** 查看 `packages/shared/package.json`
- **THEN** 包名为 `@mya/shared`，含 `main` 或 `exports` 入口指向 TypeScript 源码

#### Scenario: desktop 包为完整 Electron 项目
- **WHEN** 查看 `packages/desktop/package.json`
- **THEN** 包名为 `@mya/desktop`，包含 `electron`、`electron-vite` 等依赖，以及 `dev`、`build` 脚本

#### Scenario: desktop 包开发模式可运行
- **WHEN** 在 `packages/desktop` 目录执行 `pnpm dev`
- **THEN** Electron 窗口正常打开，renderer 进程加载 React 应用

#### Scenario: 根目录桌面端脚本
- **WHEN** 查看项目根目录 `package.json` 的 `scripts`
- **THEN** 包含 `desktop:dev`（启动桌面端开发模式）和 `desktop:build`（桌面端生产构建）命令
