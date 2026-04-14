Phase: 0

## Why

项目当前只有文档（技术方案、roadmap、openspec 配置），还没有任何代码骨架。需要搭建 pnpm monorepo 基础结构、创建 Supabase 后端项目（数据库表 + RLS 策略）、实现共享层核心抽象（数据模型 + SyncAdapter），并通过移动端 SDK 接入验证整条技术链路的可行性。这是所有后续开发的基石。

## What Changes

- 初始化 pnpm monorepo 项目结构，创建 `packages/shared`、`packages/mobile`、`packages/desktop` 三个包
- 配置 TypeScript 严格模式、ESLint、项目级 tsconfig
- 创建 Supabase 云项目，建立 `schedules`、`todos`、`notes` 三张表，配置 RLS 策略
- 在共享层实现数据模型类型定义（Schedule、Todo、Note）
- 在共享层实现 SyncAdapter 抽象接口 + SupabaseAdapter 具体实现
- 初始化 React Native 移动端项目，接入 Supabase SDK
- 验证移动端通过 SyncAdapter 完成 CRUD + Realtime 订阅

## Capabilities

### New Capabilities
- `monorepo-structure`: pnpm workspace 多包项目结构，包间依赖解析与共享层复用机制
- `data-models`: 共享层数据模型类型定义（Schedule、Todo、Note），含同步字段（`_version`、`_deleted`、`updated_at`）
- `sync-adapter`: SyncAdapter 抽象接口 + SupabaseAdapter 实现，覆盖 CRUD 与 Realtime 订阅
- `supabase-schema`: Supabase 数据库表结构（schedules / todos / notes）与 RLS 策略定义

### Modified Capabilities
（无，这是全新项目的首次搭建）

## Impact

- **代码结构**：从零创建整个 `packages/` 目录及三个子包
- **依赖**：引入 `@supabase/supabase-js`、`react-native`、`typescript`、`zustand` 等核心依赖
- **后端**：需要在 Supabase 官方云创建项目并配置数据库
- **环境**：需要 Node.js 20+、pnpm 8+、Android Studio（移动端验证阶段）
- **配置文件**：新增 `pnpm-workspace.yaml`、根 `package.json`、`.env.example`、各包 `tsconfig.json`
