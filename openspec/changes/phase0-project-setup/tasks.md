## 1. Monorepo 基础结构搭建

- [x] 1.1 创建根 `package.json`（private: true）和 `pnpm-workspace.yaml`（声明 packages/*）。验收：`pnpm install` 无报错
- [x] 1.2 创建根 `tsconfig.base.json`（strict 模式、ESNext target、路径别名）。验收：`tsc --noEmit` 可在根目录运行
- [x] 1.3 创建 `packages/shared/package.json`（包名 `@mya/shared`）和 `packages/shared/tsconfig.json`（extends 根配置）。验收：shared 包结构完整，TypeScript 配置继承正确
- [x] 1.4 创建 `packages/desktop/package.json`（包名 `@mya/desktop`，Phase 0 仅占位）和 `packages/desktop/tsconfig.json`。验收：desktop 包存在且 pnpm 识别为工作区包
- [x] 1.5 创建 `.env.example`（含 SUPABASE_URL、SUPABASE_ANON_KEY 占位符）、更新 `.gitignore`（忽略 .env.local、node_modules、构建产物）。验收：`.env.example` 存在，`.env.local` 被忽略
- [x] 1.6 验证 monorepo 整体可用：`pnpm install` 成功，三个包被正确识别，`@mya/shared` 可被其他包引用。验收：`pnpm ls --depth 0 -r` 显示三个工作区包

## 2. 共享层数据模型

- [x] 2.1 在 `packages/shared/src/models/` 下创建 `base.ts`，定义 `BaseModel` 接口（id、user_id、_deleted、_version、created_at、updated_at）。验收：导出类型，TypeScript 编译无错误
- [x] 2.2 创建 `schedule.ts`，定义 `Schedule` 类型（扩展 BaseModel，含 title、description、start_time、end_time、all_day、remind_at、repeat_rule、status、color、tags）。验收：类型完整，`status` 字段为联合类型 'active' | 'cancelled'
- [x] 2.3 创建 `todo.ts`，定义 `Todo` 类型（扩展 BaseModel，含 title、note、due_date、priority、done、done_at、schedule_id、parent_id、sort_order、tags）。验收：`priority` 字段为 0 | 1 | 2 联合类型
- [x] 2.4 创建 `note.ts`，定义 `Note` 类型（扩展 BaseModel，含 content、type、images、pinned、tags）。验收：`type` 字段为 'idea' | 'memo' | 'log' 联合类型
- [x] 2.5 创建 `packages/shared/src/models/index.ts` 统一导出所有模型。验收：`import { Schedule, Todo, Note, BaseModel } from '@mya/shared'` 可正常工作

## 3. SyncAdapter 抽象层

- [x] 3.1 在 `packages/shared/src/sync/` 下创建 `types.ts`，定义 `Filter`、`RealtimePayload`、`Unsubscribe` 类型。验收：TypeScript 编译通过
- [x] 3.2 创建 `sync-adapter.ts`，定义 `SyncAdapter<T>` 泛型接口（getAll、getById、create、update、remove、subscribe 六个方法）。验收：接口定义完整，泛型约束正确
- [x] 3.3 创建 `supabase-client.ts`，实现 `createSupabaseClient(url, anonKey)` 工厂函数，缺少参数时抛出明确错误。验收：传入有效参数返回 Supabase 客户端实例，缺少参数抛出 Error
- [x] 3.4 创建 `supabase-adapter.ts`，实现 `SupabaseAdapter` 类的 CRUD 方法（getAll、getById、create、update、remove 含软删除逻辑）。验收：所有方法实现完整，remove 方法设置 `_deleted: true` 而非物理删除
- [x] 3.5 实现 `SupabaseAdapter` 的 `subscribe` 方法（基于 Supabase Realtime Postgres Changes），返回取消订阅函数。验收：subscribe 返回 Unsubscribe 函数
- [x] 3.6 创建 `packages/shared/src/sync/index.ts` 和 `packages/shared/src/index.ts` 统一导出。验收：从 `@mya/shared` 可导出所有模型和同步层类型

## 4. Supabase 后端配置

- [ ] 4.1 注册 Supabase 官方云账号，创建项目（Region 选 Southeast Asia 或延迟最低的区域）。验收：Supabase Dashboard 可访问，获得 Project URL 和 anon key
- [ ] 4.2 在 Supabase SQL Editor 中创建 `schedules` 表（含所有字段、类型、默认值、外键约束）。验收：表结构与 spec 一致
- [ ] 4.3 创建 `todos` 表（含自引用 parent_id 外键、schedule_id 外键）。验收：表结构与 spec 一致，外键约束有效
- [ ] 4.4 创建 `notes` 表。验收：表结构与 spec 一致
- [ ] 4.5 为三张表创建 `updated_at` 自动更新触发器（moddatetime 或自定义 trigger function）。验收：更新记录后 updated_at 自动刷新
- [ ] 4.6 为三张表开启 RLS 并配置策略（SELECT / INSERT / UPDATE / DELETE 均需 `auth.uid() = user_id`）。验收：未认证请求被拒绝，已认证用户仅能访问自己的数据
- [ ] 4.7 为三张表启用 Realtime（Supabase Dashboard → Database → Replication）。验收：Realtime 配置页显示三张表已启用

## 5. 移动端初始化与接入验证

- [ ] 5.1 安装 Android Studio Panda 3，配置 Android SDK（API 34+）和模拟器（Pixel 7, Android 14）。验收：`adb devices` 可列出模拟器或真机
- [ ] 5.2 在 `packages/mobile/` 下使用 `npx @react-native-community/cli init` 初始化 React Native 项目。验收：`npx react-native run-android` 可在模拟器上运行默认模板
- [ ] 5.3 配置 `metro.config.js`，添加 `watchFolders` 指向 `packages/shared`，解决 monorepo 路径解析。验收：移动端可 `import { Schedule } from '@mya/shared'` 无报错
- [ ] 5.4 安装 `@supabase/supabase-js` 依赖，在移动端配置 `.env.local` 并通过共享层初始化 Supabase 客户端。验收：客户端初始化成功，可连接到 Supabase
- [ ] 5.5 编写验证页面：通过 SupabaseAdapter 对 notes 表执行 create → getAll → update → remove（软删除），确认 CRUD 端到端打通。验收：四个操作均成功，数据在 Supabase Dashboard 可见
- [ ] 5.6 验证 Realtime 订阅：打开两个移动端实例（或移动端 + Supabase Dashboard SQL），一端写入数据，另一端 subscribe 回调被触发。验收：实时推送延迟 < 2 秒，回调收到正确的变更数据
