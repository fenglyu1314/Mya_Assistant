## Context

项目 Mya Assistant 当前只有文档资产（技术方案 v1.2、roadmap、openspec 配置），尚无任何代码。需要从零搭建项目基础设施，建立 monorepo 代码结构、后端数据库、共享层抽象，并通过移动端接入验证技术可行性。

当前环境：
- Node.js v24.14.1、pnpm 10.33.0 已就绪
- Android Studio Panda 3 已下载待安装
- Supabase 账号待注册

## Goals / Non-Goals

**Goals:**
- 搭建可正常运行的 pnpm monorepo，三个包（`shared` / `mobile` / `desktop`）间依赖正确解析
- 在 Supabase 官方云创建项目，完成 `schedules`、`todos`、`notes` 表结构及 RLS 策略
- 在共享层实现 TypeScript 数据模型类型定义与 SyncAdapter 抽象接口
- 实现 SupabaseAdapter，验证 CRUD + Realtime 订阅端到端打通
- 在移动端（React Native）接入共享层并通过 SyncAdapter 操作后端数据

**Non-Goals:**
- 不做用户认证（Auth 属于 Phase 1）
- 不做 UI 设计或页面搭建（Phase 1 范围）
- 不搭建 Electron 桌面端项目（Phase 3 范围，此阶段仅创建 `desktop` 包占位）
- 不实现离线缓存 / SQLite（Phase 2 范围）
- 不配置 CI/CD 流水线

## Decisions

### D1: pnpm workspace 组织方式

**决策**：使用 `pnpm-workspace.yaml` 定义三个包 `packages/shared`、`packages/mobile`、`packages/desktop`，根目录放项目级配置。

**替代方案**：
- Turborepo / Nx：引入额外构建编排工具，对个人项目来说过重
- Yarn Workspaces：pnpm 更节省磁盘空间，且已安装

**理由**：pnpm workspace 原生支持 monorepo，零额外依赖，对项目规模而言足够。

### D2: TypeScript 配置策略

**决策**：根目录 `tsconfig.base.json` 定义共享编译选项（strict 模式、路径别名），各包通过 `extends` 继承并添加自身配置。

**理由**：避免重复配置，统一严格模式标准。shared 包编译为 ESM，mobile 和 desktop 根据各自框架需求覆盖。

### D3: 共享层构建方式

**决策**：Phase 0 阶段 shared 包使用 TypeScript 源码直接引用（通过 tsconfig paths），不预编译。

**替代方案**：
- 用 tsup/unbuild 预编译为 JS：增加构建步骤，Phase 0 不需要
- 仅类型引用：需要实际运行代码验证 SyncAdapter

**理由**：React Native Metro 和 Electron 都支持 TypeScript 源码引用，Phase 0 优先简单可用。如后续遇到兼容问题再切换到预编译。

### D4: Supabase 环境变量管理

**决策**：根目录 `.env.example` 提供模板，`.env.local` 存放实际凭证（已 gitignore）。各包通过共享层统一读取环境变量初始化 Supabase 客户端。

**理由**：避免凭证硬编码，符合项目规范。统一入口避免多处初始化。

### D5: SyncAdapter 接口设计

**决策**：定义泛型 `SyncAdapter` 接口，方法包括 `getAll`、`getById`、`create`、`update`、`remove`（软删除）、`subscribe`。SupabaseAdapter 作为首个实现。

**替代方案**：
- 直接使用 Supabase SDK：耦合后端实现，后续切换成本高
- 更复杂的 Repository 模式：Phase 0 不需要，保持简单

**理由**：技术方案已定义 SyncAdapter 抽象层，此处落地实现。接口保持最小化，后续按需扩展。

### D6: 移动端初始化方式

**决策**：使用 `npx @react-native-community/cli init` 在 `packages/mobile` 下初始化 React Native 项目，然后调整配置接入 monorepo。

**理由**：官方 CLI 生成的模板最稳定，手动搭建容易遗漏 native 配置。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| React Native 在 monorepo 中 Metro 解析问题 | 移动端无法正确引用 shared 包 | 配置 `metro.config.js` 的 `watchFolders` 和 `nodeModulesPaths` |
| Supabase 官方云海外延迟（200-500ms） | 开发体验不佳 | Phase 0 仅验证功能可行性，延迟可接受；后续可切换国内部署 |
| Node.js v24 非 LTS 版本 | 可能遇到工具链兼容问题 | 目前 pnpm 和 RN CLI 均已验证支持；如遇问题降级到 v22 LTS |
| Phase 0 未含 Auth，验证 CRUD 时表需临时放宽 RLS | 安全风险 | 仅在开发环境放宽，验证完成后 Phase 1 接入 Auth 前收紧 |

## Open Questions

- React Native 版本选择：使用最新稳定版（0.76+）还是锁定 0.74？需要在初始化时确认社区兼容情况
- Supabase 项目 Region 选择：Southeast Asia（新加坡）还是其他？需要测试国内访问延迟
