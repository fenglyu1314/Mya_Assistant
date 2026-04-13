# 个人助手 App 技术方案文档

> 版本：v1.2  
> 日期：2026-04-13  
> 状态：已确认  
> 更新：v1.2 后端方案由 CloudBase 改为 Supabase（首选），调整架构图、同步方案、数据模型、开发路线图  
> 历史：v1.1 补充电纸书端策略、改进同步冲突方案、完善数据模型、增加 monorepo 架构说明、补充风险评估

---

## 一、项目概述

### 产品定位

一款面向个人使用的多端助手 App，帮助用户管理日常事务、记录灵感想法。

### 核心功能模块

| 模块 | 功能描述 |
|------|---------|
| **日程管理** | 日历视图、提醒、重复事件 |
| **待办事项** | 任务列表、优先级、完成状态、截止日期 |
| **快速记录** | 低摩擦输入灵感/想法/杂事（类似 Flomo 的 Inbox 模式） |
| **多端同步** | 数据实时同步，支持离线使用 |

### 支持平台（优先级排序）

1. Android（首期主端）
2. Windows PC（首期）
3. 电纸书 / 墨水屏阅读器（首期适配，见 2.5 节）
4. iOS（后续扩展）
5. macOS（后续扩展）

---

## 二、技术选型

### 2.1 整体架构

```
┌─────────────────────────────────────────────┐
│              客户端层                         │
│  React Native (Android / iOS)               │
│  React Native (电纸书 E-Ink 适配主题)        │
│  Electron (Windows / macOS PC)              │
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│         shared（共享业务逻辑层）               │
│  数据模型 / SyncAdapter 抽象层 / 状态管理     │
└─────────────────────┬───────────────────────┘
                      │ WebSocket 实时同步
┌─────────────────────▼───────────────────────┐
│             Supabase（BaaS）                 │
│  ┌───────────┐ ┌──────────┐ ┌───────────┐  │
│  │ PostgreSQL │ │  Auth    │ │  Storage  │  │
│  │ (关系型DB) │ │ (用户认证)│ │ (文件存储) │  │
│  └───────────┘ └──────────┘ └───────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │  Realtime（WebSocket 实时推送）         │  │
│  └────────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

### 2.2 移动端：React Native

**选型原因：**

- TypeScript / JavaScript 语言，AI 辅助编程效果最佳（Copilot/Claude 训练数据最丰富）
- Android + iOS 共用一套代码，后续扩苹果平台几乎零额外成本
- 组件化开发思路类似游戏引擎节点/预制体系统，上手有熟悉感
- 生态极为丰富，遇到问题社区资源充足

**核心技术栈：**

| 用途 | 技术 |
|------|------|
| 框架 | React Native 0.74+ |
| 语言 | TypeScript |
| 状态管理 | Zustand（轻量，新手友好）+ persist 中间件对接本地 SQLite |
| 本地存储 | AsyncStorage + SQLite（离线缓存）|
| 导航 | React Navigation |
| UI 组件库 | React Native Paper 或 NativeBase |

---

### 2.3 PC 端：Electron

**选型原因：**

- 基于 Web 技术（HTML/CSS/JS），UI 定制灵活，效果出色
- 可复用 React Native 端的业务逻辑代码和 Supabase SDK
- 生态成熟，VS Code、Notion 桌面端均使用 Electron

**核心技术栈：**

| 用途 | 技术 |
|------|------|
| 框架 | Electron 30+ |
| 前端框架 | React + TypeScript |
| UI 框架 | Tailwind CSS + shadcn/ui |
| 本地数据 | better-sqlite3（离线缓存）|

---

### 2.4 后端服务：Supabase（首选方案）

**选型原因：**

- **开源无锁定**：代码完全开源，数据存储在标准 PostgreSQL 中，随时可导出迁移
- **真正的实时推送**：基于 WebSocket 的 Realtime 服务，延迟极低
- **React Native SDK 成熟**：官方 `@supabase/supabase-js` 对 RN 支持完善，社区大量实践
- **PostgreSQL 关系型数据库**：支持 JOIN、复杂查询、索引，数据模型表达力强
- **功能完整**：数据库 + 实时同步 + 用户认证（Auth）+ 文件存储（Storage）+ Row Level Security
- **免费额度充足**：个人使用绰绰有余

**核心功能使用：**

| Supabase 功能 | 用途 |
|--------------|------|
| PostgreSQL 数据库 | 存储日程、待办、笔记数据（关系型，支持 JOIN） |
| Realtime（WebSocket） | 多端数据实时同步，延迟极低 |
| Storage | 笔记附件、图片等文件 |
| Auth | 用户登录（邮箱/手机号/OAuth） |
| Row Level Security (RLS) | 数据行级权限控制，确保用户只能访问自己的数据 |

**免费额度（Supabase 官方云）：**
- 数据库：500MB
- 文件存储：1GB
- 实时连接：200 并发
- Auth 用户数：50,000
- 项目数：2 个

**部署策略（渐进式）：**

| 阶段 | 部署方式 | 运维量 | 月费 | 说明 |
|------|---------|-------|------|------|
| 初期（Phase 0~3） | Supabase 官方云 | 零运维 | 免费 | 先忍受海外延迟（~200-500ms），快速验证产品 |
| 如延迟不可接受 | 阿里云托管 Supabase | 极低 | ¥100~200 | 国内机房，低延迟，同一套 SDK |
| 如需完全自主 | Docker 自建 | 中等 | ¥40~60 | 完全可控，数据在自己手里 |

> 三种部署方式使用**同一套 Supabase SDK**，切换时客户端只需改服务端地址，零代码改动。

**抽象层设计（SyncAdapter）：**

在 `shared` 包中定义 `SyncAdapter` 抽象接口，隔离后端具体实现：

```typescript
interface SyncAdapter {
  connect(): Promise<void>
  push(changes: ChangeSet): Promise<void>
  subscribe(table: string, callback: (payload: any) => void): void
  getAll(table: string, filters?: Filter[]): Promise<Record[]>
}
```

当前实现 `SupabaseAdapter`；未来如需接入微信小程序生态，可新增 `CloudBaseAdapter`，客户端代码无需修改。

**备选方案（未来扩展时考虑）：**

| 方案 | 适用场景 |
|------|---------|
| 腾讯云 CloudBase | 未来开发微信小程序版时，利用其微信生态深度集成 |
| 自建后端（Fastify + PostgreSQL） | 如需完全定制 API 逻辑（当前阶段不推荐，开发量大） |

---

### 2.5 电纸书 / 墨水屏阅读器端

**目标设备**：运行 Android 开放系统的电纸书（如文石 BOOX、掌阅 iReader 等）

**适配策略**：复用 React Native 移动端代码，通过 E-Ink 适配主题实现墨水屏优化

| 适配项 | 措施 |
|--------|------|
| 去除动画 | 禁用所有过渡动画，墨水屏刷新慢，动画会造成残影 |
| 高对比度 | 纯黑白配色，加粗文字，增大字号 |
| 减少局部刷新 | 尽量整页刷新，避免频繁局部更新导致残影 |
| 简化布局 | 单列布局为主，减少视觉层级 |
| 大触摸区域 | 按钮和可点击区域加大，电纸书触控不如手机灵敏 |

**不适配的设备**：Kindle 等封闭系统设备，无法安装第三方 App，暂不支持。

---

### 2.6 项目结构：Monorepo

采用 monorepo 组织多端代码，最大化业务逻辑复用：

```
Mya_Assistant/
├── packages/
│   ├── shared/          # 🔑 核心：共享业务逻辑
│   │   ├── models/      # 数据模型类型定义
│   │   ├── sync/        # SyncAdapter 抽象层 + Supabase 实现
│   │   ├── store/       # Zustand stores
│   │   └── utils/       # 工具函数
│   ├── mobile/          # React Native（Android / iOS / 电纸书）
│   └── desktop/         # Electron（Windows / macOS）
├── Reference/           # 技术方案文档
├── openspec/            # OpenSpec 工作流
├── package.json         # monorepo 根配置
└── pnpm-workspace.yaml  # pnpm workspace 配置
```

**核心原则**：
- `shared` 包包含所有平台无关的业务逻辑（数据模型、同步引擎、状态管理）
- `mobile` 和 `desktop` 仅负责 UI 渲染层
- 新增端（如电纸书适配版）只需新增 UI 主题，无需重写业务逻辑
- 单元测试集中在 `shared` 包，覆盖率容易保障

---

## 三、数据模型设计

### 数据库表（PostgreSQL）

#### users（用户，Supabase Auth 自动管理）
```
id            UUID     用户唯一ID（Supabase Auth 自动生成）
email         String   邮箱
display_name  String   显示名称
created_at    Timestamp  注册时间
```

#### schedules（日程）
```
id            UUID     主键（自动生成）
user_id       UUID     所属用户（外键 → auth.users.id）
title         String   标题
description   Text     描述（可选）
start_time    Timestamp  开始时间
end_time      Timestamp  结束时间
all_day       Boolean  是否全天
remind_at     Timestamp[]  提醒时间列表
repeat_rule   String   重复规则（RRULE 格式，可选）
status        String   状态："active" | "cancelled"（软删除用）
color         String   日程颜色标识（可选）
tags          String[] 标签
_deleted      Boolean  软删除标记（多端同步必需，默认 false）
_version      Integer  版本号（冲突检测用，每次修改 +1）
created_at    Timestamp  创建时间（自动）
updated_at    Timestamp  更新时间（自动）
```

#### todos（待办事项）
```
id            UUID     主键（自动生成）
user_id       UUID     所属用户（外键 → auth.users.id）
title         String   标题
note          Text     备注（可选）
due_date      Timestamp  截止日期（可选）
priority      Integer  优先级（0低/1中/2高）
done          Boolean  是否完成
done_at       Timestamp  完成时间
schedule_id   UUID     关联日程ID（外键 → schedules.id，可选）
parent_id     UUID     父任务ID（外键 → todos.id，支持子任务，可选）
sort_order    Integer  自定义排序序号（拖拽排序用）
tags          String[] 标签
_deleted      Boolean  软删除标记（多端同步必需，默认 false）
_version      Integer  版本号（冲突检测用，每次修改 +1）
created_at    Timestamp  创建时间（自动）
updated_at    Timestamp  更新时间（自动）
```

#### notes（快速记录）
```
id            UUID     主键（自动生成）
user_id       UUID     所属用户（外键 → auth.users.id）
content       Text     内容（纯文本或 Markdown）
type          String   分类："idea" | "memo" | "log"
images        String[] 附件图片 URL 列表
pinned        Boolean  是否置顶（默认 false）
tags          String[] 标签
_deleted      Boolean  软删除标记（多端同步必需，默认 false）
_version      Integer  版本号（冲突检测用，每次修改 +1）
created_at    Timestamp  创建时间（自动）
updated_at    Timestamp  更新时间（自动）
```

> **PostgreSQL 优势**：`schedule_id`、`parent_id` 等外键约束由数据库保证完整性；支持 JOIN 查询（如"查找所有本周日程及其关联待办"）；支持索引加速查询。

---

## 四、多端同步方案

### 在线同步（实时）

使用 Supabase Realtime 服务，基于 WebSocket 实现数据变更的实时推送：

```
手机端修改待办
    │
    ▼
写入 Supabase（PostgreSQL）
    │
    ▼ WebSocket 实时推送（延迟极低）
PC 端收到变更 → UI 自动刷新
```

**Supabase Realtime 支持三种模式：**
- **Postgres Changes**：监听数据库表的 INSERT / UPDATE / DELETE 事件
- **Broadcast**：任意消息广播（可用于在线状态、即时通知）
- **Presence**：在线用户状态同步（可用于显示"哪些设备在线"）

### 离线支持

- 本地维护 SQLite 缓存（mobile）/ better-sqlite3（PC）
- 网络恢复后自动合并同步
- 使用 `_version` 字段检测冲突

### 冲突处理策略：字段级合并

简单的"最后写入胜出"（Last Write Wins）会导致数据丢失。采用**字段级合并**策略：

```
场景：手机修改了待办标题，同时 PC 修改了同一条待办的优先级

手机端：{ title: "新标题", _changed_fields: ["title"] }
PC 端：{ priority: 2, _changed_fields: ["priority"] }

合并结果：title 取手机端的值，priority 取 PC 端的值（不冲突，各自合并）
```

**合并规则：**
1. 不同字段被修改 → 各取最新值，自动合并
2. 同一字段被修改 → 以 `updated_at` 更晚的为准（降级为 Last Write Wins）
3. 每条记录包含 `_version` 字段，每次修改 +1，用于检测是否发生冲突
4. 每条记录包含 `_deleted` 字段，支持软删除（删除操作也能正确同步）

---

## 五、开发路线图

### Phase 0：项目搭建 + Supabase 接入（预计 1 周）
- [ ] 初始化 Git 仓库，关联 GitHub 远程仓库
- [ ] 搭建 monorepo 项目结构（pnpm workspace）
- [ ] 注册 Supabase 官方云账号，创建项目
- [ ] 创建数据库表结构（schedules / todos / notes），配置 RLS 安全规则
- [ ] 在 React Native 中接入 Supabase SDK，验证基本 CRUD + 实时订阅
- [ ] 搭建 `shared` 包基础结构（数据模型类型定义 + SyncAdapter 接口）

### Phase 1：基础骨架（预计 2-3 周）
- [ ] 搭建 React Native 项目结构
- [ ] 接入 Supabase Auth（邮箱/手机号登录）
- [ ] **快速记录模块**（最简单，先建立成就感）
  - 输入框 + 提交
  - 列表展示
  - 云端同步

### Phase 2：核心功能（预计 3-4 周）
- [ ] 待办事项模块
  - 增删改查
  - 优先级、截止日期
  - 完成状态
  - 子任务支持
  - 拖拽排序
- [ ] 日程管理模块
  - 日历视图
  - 添加/编辑日程
  - 本地提醒通知

### Phase 3：PC 端 + 电纸书适配（预计 2-3 周）
- [ ] 搭建 Electron 项目
- [ ] 复用 shared 同步逻辑
- [ ] PC 端 UI 适配（更宽屏幕布局）
- [ ] 电纸书 E-Ink 适配主题（去动画、高对比度、大触摸区域）

### Phase 4：完善与扩展
- [ ] iOS 打包发布（需 Apple 开发者账号 $99/年 + Mac 设备）
- [ ] 标签系统完善
- [ ] 搜索功能
- [ ] 数据导出（Markdown / CSV）
- [ ] Widget 小组件（Android）
- [ ] 个人便捷工具模块（后续规划）

---

## 六、开发环境要求

### 必须安装
- Node.js 20 LTS
- Android Studio（含 Android SDK）
- VS Code（推荐编辑器）
- Git

### Android 真机调试
- 开启开发者模式 + USB 调试
- 或使用 Android 模拟器（建议 Pixel 7，Android 14）

### PC 端开发（Electron）
- Windows 10/11 即可，无需额外环境

### iOS / macOS 打包（后期）
- 必须有 Mac 设备
- 或使用 CI 服务（推荐 Codemagic，有免费额度）

---

## 七、注意事项与踩坑预警

### ⚠️ Supabase 官方云海外延迟
- 初期使用 Supabase 官方云，国内访问 REST API 延迟约 200~500ms
- 个人效率工具对延迟不敏感，初期可接受
- 如体验不佳，可切换到阿里云托管 Supabase 或 Docker 自建（同一套 SDK，零改动）

### ⚠️ Supabase RLS（Row Level Security）必须配置
- 数据库表必须开启 **Row Level Security**，确保用户只能读写自己的数据
- 未配置 RLS 的表默认**拒绝所有访问**（与其他 BaaS 不同，Supabase 默认是安全的）
- 每张表都需要添加策略，示例：`auth.uid() = user_id`

### ⚠️ Android 发布签名
- 发布到应用市场需要 **keystore 签名文件**
- **keystore 文件一旦丢失，无法再更新已发布的 App**
- 务必备份到多个安全位置（云盘、本地硬盘）

### ⚠️ iOS 后续扩展成本
- Apple 开发者账号：$99/年（约 ¥720）
- 必须有 Mac 才能编译打包（无 Mac 可用 Codemagic CI）
- React Native 同一套代码基本可直接跑 iOS，适配工作量较小

### ⚠️ React Native 版本升级
- 大版本升级（如 0.73 → 0.74）可能有 breaking changes
- 建议锁定版本，不要盲目升级，等社区稳定后再跟进

---

## 八、参考资源

| 资源 | 地址 |
|------|------|
| React Native 官方文档 | https://reactnative.dev |
| Electron 官方文档 | https://www.electronjs.org |
| Supabase 官方文档 | https://supabase.com/docs |
| Supabase JS SDK | https://supabase.com/docs/reference/javascript |
| Supabase RN 集成指南 | https://supabase.com/docs/guides/getting-started/tutorials/with-react-native |
| 阿里云托管 Supabase | https://help.aliyun.com/zh/rds/apsaradb-rds-for-postgresql/supabase/ |
| React Navigation | https://reactnavigation.org |
| Zustand 状态管理 | https://zustand-demo.pmnd.rs |
| pnpm Workspace（monorepo） | https://pnpm.io/workspaces |

---

*文档由 AI 辅助整理，基于技术选型讨论生成。v1.2 更新于 2026-04-13。*
