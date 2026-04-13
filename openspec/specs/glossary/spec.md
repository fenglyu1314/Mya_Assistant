# 术语表（Glossary）

> 项目中所有文档、代码注释、PR 描述、对话交流应统一使用以下术语。

| 标准术语 | 含义 | ❌ 避免使用 |
|---------|------|-----------|
| **移动端** | React Native 应用（Android / iOS / 电纸书） | "手机App"、"客户端" |
| **桌面端** | Electron 应用（Windows / macOS） | "PC端"、"电脑版" |
| **电纸书端** | 运行 E-Ink 适配主题的 React Native 应用 | "Kindle"、"墨水屏App" |
| **后端** | Supabase 服务（PostgreSQL + Auth + Realtime + Storage） | "服务器"、"云端"、"CloudBase" |
| **共享层** | `packages/shared` 包，包含平台无关的业务逻辑 | "公共模块"、"基础库" |
| **SyncAdapter** | 同步抽象层接口，隔离后端具体实现 | "同步器"、"同步服务" |
| **Realtime** | Supabase 的 WebSocket 实时推送服务 | "实时监听"、"长轮询" |
| **RLS** | Row Level Security，Supabase 数据库行级权限控制 | "安全规则"、"权限配置" |
| **软删除** | 通过 `_deleted` 标记删除，数据保留在数据库中 | "假删除"、"逻辑删除" |
| **字段级合并** | 冲突处理策略：不同字段各取最新值，同一字段以 `updated_at` 为准 | "冲突解决"、"合并策略" |

## 功能模块术语

| 标准术语 | 含义 |
|---------|------|
| **日程** | schedules 表，日历事件（含提醒、重复规则） |
| **待办** | todos 表，任务项（含优先级、子任务、排序） |
| **快速记录** | notes 表，低摩擦输入的灵感/想法/备忘 |

## 技术术语

| 标准术语 | 含义 |
|---------|------|
| **monorepo** | pnpm workspace 管理的多包仓库结构 |
| **Auth** | Supabase 用户认证服务 |
| **Storage** | Supabase 文件/图片存储服务 |
| **Zustand** | 轻量状态管理库，用于客户端状态 |
