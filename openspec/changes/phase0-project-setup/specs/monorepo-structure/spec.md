## ADDED Requirements

### Requirement: monorepo 根配置
项目根目录 SHALL 包含 `pnpm-workspace.yaml`，声明 `packages/*` 为工作区包。根 `package.json` SHALL 声明 `private: true` 并定义项目级脚本。

#### Scenario: pnpm install 正常运行
- **WHEN** 在项目根目录执行 `pnpm install`
- **THEN** 所有工作区包的依赖被正确安装，无报错

#### Scenario: 包间依赖解析
- **WHEN** `packages/mobile` 的 `package.json` 声明依赖 `@mya/shared`
- **THEN** pnpm 正确解析到 `packages/shared`，无需发布到 npm

### Requirement: 三包结构
项目 SHALL 包含三个工作区包：`packages/shared`（包名 `@mya/shared`）、`packages/mobile`（包名 `@mya/mobile`）、`packages/desktop`（包名 `@mya/desktop`）。

#### Scenario: shared 包存在且可引用
- **WHEN** 查看 `packages/shared/package.json`
- **THEN** 包名为 `@mya/shared`，含 `main` 或 `exports` 入口指向 TypeScript 源码

#### Scenario: desktop 包占位
- **WHEN** 查看 `packages/desktop/package.json`
- **THEN** 包名为 `@mya/desktop`，包含最小化结构（Phase 0 仅占位，不含实际代码）

### Requirement: TypeScript 统一配置
根目录 SHALL 提供 `tsconfig.base.json`，开启 `strict` 模式。各包 SHALL 通过 `extends` 继承基础配置。

#### Scenario: 严格模式生效
- **WHEN** 在任意包中编写违反严格模式的代码（如隐式 any）
- **THEN** TypeScript 编译器报错

#### Scenario: 包级配置继承
- **WHEN** 查看 `packages/shared/tsconfig.json`
- **THEN** 包含 `"extends": "../../tsconfig.base.json"`

### Requirement: 环境变量管理
项目根目录 SHALL 包含 `.env.example` 模板文件，列出 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`。`.env.local` SHALL 被 `.gitignore` 忽略。

#### Scenario: 环境变量模板存在
- **WHEN** 克隆项目后查看根目录
- **THEN** 存在 `.env.example` 文件，包含所有必需的环境变量占位符

#### Scenario: 实际凭证不入库
- **WHEN** 创建 `.env.local` 并填入 Supabase 凭证
- **THEN** `git status` 不显示该文件（已被 `.gitignore` 忽略）
