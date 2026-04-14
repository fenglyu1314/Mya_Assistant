## Context

Phase 0 已完成：pnpm monorepo 结构就绪，共享层包含完整的数据模型（BaseModel/Schedule/Todo/Note）、SyncAdapter 抽象接口和 SupabaseAdapter 实现、Supabase 客户端工厂函数。移动端目前仅有两个开发验证页面（CrudVerifyScreen / RealtimeVerifyScreen），使用硬编码凭证和临时 DEV_USER_ID。

Phase 1 需要在此基础上构建第一个面向用户的可用版本：用户认证 → 移动端骨架 → 快速记录功能。

## Goals / Non-Goals

**Goals:**

- 用户可通过邮箱注册/登录，获得真实的 `user_id`
- 移动端建立可扩展的导航框架和统一的设计语言
- 快速记录模块端到端可用（创建 → 查看 → 删除 → 置顶 → 筛选 → 实时同步）
- 清理 Phase 0 临时代码，切换到正式的环境变量管理

**Non-Goals:**

- 待办事项和日程模块（Phase 2）
- 离线缓存 / 本地 SQLite（Phase 2）
- 桌面端和电纸书端适配（Phase 3）
- 图片上传 UI（保留数据模型，不实现上传交互）
- 第三方登录（微信/Google 等，未来按需添加）

## Decisions

### D1: 认证方案 — Supabase Auth 邮箱登录

**选择**：使用 Supabase Auth 内置邮箱/密码认证。

**理由**：
- Supabase Auth 与现有 RLS 策略无缝配合（`auth.uid() = user_id`），无需额外的认证中间件
- 提供开箱即用的会话管理（JWT + refresh token），React Native 侧通过 `@supabase/supabase-js` 的 `onAuthStateChange` 监听即可
- Phase 1 仅需邮箱登录，后续可按需扩展 OAuth 提供者

**替代方案**：
- 自建 Auth 服务：过度工程化，Phase 1 不需要
- Firebase Auth：引入额外后端依赖，与 Supabase 生态不一致

### D2: 认证状态管理 — Zustand + 共享层封装

**选择**：在共享层创建 `AuthService` 封装认证 API，配合 `useAuthStore`（Zustand）管理认证状态。

**理由**：
- 认证逻辑（signUp/signIn/signOut/onAuthStateChange）属于平台无关逻辑，应放在共享层
- Zustand 轻量（<1KB），API 简洁，与 React 和 React Native 兼容
- Store 可在未来桌面端复用

**替代方案**：
- React Context：适合小范围状态，但跨模块共享时 re-render 问题多
- Redux：过重，项目规模不需要

### D3: 导航框架 — React Navigation v7

**选择**：使用 React Navigation（Stack + Bottom Tabs）。

**理由**：
- React Native 社区标准导航库，生态成熟
- 支持 Stack（Auth 流程）+ Bottom Tabs（主页面）混合导航
- TypeScript 类型支持良好

**替代方案**：
- Expo Router：需要 Expo managed workflow，当前项目为 bare RN
- react-native-navigation (Wix)：原生导航性能好但配置复杂，Phase 1 不需要

### D4: 导航结构

**选择**：Auth Stack（未登录）和 Main Tab（已登录）两层导航。

```
RootNavigator
├── AuthStack（未登录时显示）
│   ├── LoginScreen
│   └── RegisterScreen
└── MainTab（已登录时显示）
    ├── NotesTab → NotesListScreen
    ├── TodosTab → PlaceholderScreen（Phase 2）
    ├── ScheduleTab → PlaceholderScreen（Phase 2）
    └── SettingsTab → SettingsScreen
```

**理由**：
- Auth 和 Main 分离，登录状态切换清晰
- Bottom Tabs 预留四个 tab，Phase 2 的待办/日程可直接填入
- 设置页面放在最后一个 tab，用于登出和未来配置

### D5: 主题系统 — Design Token + ThemeProvider

**选择**：定义 design token 对象（颜色、字体、间距、圆角），通过 React Context 提供给全局。

**理由**：
- 统一设计语言，避免硬编码样式值
- Phase 3 电纸书端需要切换 E-Ink 主题，token 体系便于扩展
- 不引入额外 UI 框架，保持轻量

**Token 结构**：
```typescript
interface Theme {
  colors: { primary, background, surface, text, textSecondary, border, error, success }
  spacing: { xs, sm, md, lg, xl }
  fontSize: { xs, sm, md, lg, xl }
  borderRadius: { sm, md, lg }
}
```

### D6: 快速记录状态管理 — Zustand Store + SupabaseAdapter

**选择**：创建 `useNotesStore`（Zustand），内部使用 `SupabaseAdapter<Note>` 进行数据操作。

**理由**：
- Store 负责本地缓存和 UI 状态（列表数据、加载状态、筛选条件）
- Adapter 负责与后端通信（CRUD + Realtime 订阅）
- 关注点分离：Phase 2 引入离线缓存时，只需在 Store 层加入 SQLite，Adapter 层不变

**数据流**：
```
UI Component → useNotesStore.action() → SupabaseAdapter.method() → Supabase
                                          ↑
                         Realtime subscription → store.updateFromRealtime()
```

### D7: 环境变量 — react-native-config

**选择**：使用 `react-native-config` 管理移动端环境变量。

**理由**：
- React Native 无法使用 `process.env`，需要原生桥接方案
- `react-native-config` 是社区标准方案，支持 `.env` / `.env.production` 分环境
- 与共享层的 `createSupabaseClient` 配合，传入从 Config 读取的值

**替代方案**：
- `react-native-dotenv`：babel 插件方案，构建时注入，灵活性不如 react-native-config
- Expo Constants：需要 Expo 环境

## Risks / Trade-offs

- **[邮箱验证流程]** → Supabase 默认开启邮箱确认，开发阶段可在 Dashboard 关闭。文档中注明生产环境需要重新开启。
- **[react-native-config 原生链接]** → 需要修改 Android 和 iOS 的原生配置文件。Phase 1 先覆盖 Android，iOS 配置在 Phase 4 打包时处理。
- **[Realtime 连接管理]** → 快速记录页面进入时订阅、离开时取消。如果用户频繁切换 tab，可能产生较多连接/断开。Mitigation：在 store 层管理订阅生命周期，仅首次进入时订阅，应用退到后台时取消。
- **[Zustand 持久化]** → Phase 1 不做本地持久化（无 SQLite），每次打开 App 从 Supabase 拉取。网络差时体验不佳，Phase 2 解决。

## Open Questions

- Supabase 项目是否已在 Dashboard 启用 Auth 模块？（需确认）
- 是否需要邮箱验证码确认？（建议开发阶段关闭，正式发布前开启）
