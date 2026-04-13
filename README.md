# Mya Assistant

> 一款面向个人使用的多端助手 App，帮助管理日常事务、记录灵感想法。

## ✨ 核心功能

| 模块 | 功能描述 |
|------|---------|
| 📅 **日程管理** | 日历视图、提醒、重复事件 |
| ✅ **待办事项** | 任务列表、优先级、完成状态、截止日期 |
| 💡 **快速记录** | 低摩擦输入灵感/想法/杂事（类似 Flomo 的 Inbox 模式） |
| 🔄 **多端同步** | 数据实时同步，支持离线使用 |

## 📱 支持平台

- **Android**（首期主端）
- **Windows PC**（首期）
- **电纸书 / 墨水屏阅读器**（首期适配）
- iOS / macOS（远期规划）

## 🏗️ 技术架构

```
┌──────────────────────────────────────────┐
│              客户端层                      │
│  React Native (Android / iOS / 电纸书)   │
│  Electron (Windows / macOS)              │
└─────────────────┬────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│       shared（共享业务逻辑层）              │
│  数据模型 / SyncAdapter / 状态管理        │
└─────────────────┬────────────────────────┘
                  │ WebSocket 实时同步
┌─────────────────▼────────────────────────┐
│           Supabase（BaaS）               │
│  PostgreSQL · Auth · Storage · Realtime  │
└──────────────────────────────────────────┘
```

## 🛠️ 技术栈

| 层面 | 技术选型 |
|------|---------|
| 移动端 | React Native (TypeScript) |
| 桌面端 | Electron + React |
| 共享层 | TypeScript（数据模型、同步引擎、状态管理） |
| 后端服务 | Supabase（PostgreSQL + Auth + Realtime + Storage） |
| 状态管理 | Zustand |
| 导航 | React Navigation |
| 包管理 | pnpm Workspace (Monorepo) |

## 📁 项目结构

```
Mya_Assistant/
├── packages/
│   ├── shared/          # 共享业务逻辑
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

## 🚀 快速开始

> ⚠️ 项目处于初始化阶段，以下步骤将随开发进度逐步完善。

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- [Android Studio](https://developer.android.com/studio)（移动端开发）

### 安装依赖

```bash
pnpm install
```

### 环境配置

复制环境变量模板并填入 Supabase 凭证：

```bash
cp .env.example .env.local
```

```env
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
```

## 📋 开发路线图

- [x] **Phase 0**：项目搭建 + Supabase 接入
- [ ] **Phase 1**：基础骨架（RN 项目结构 + Auth + 快速记录模块）
- [ ] **Phase 2**：核心功能（日程管理 + 待办事项 + 多端同步）
- [ ] **Phase 3**：桌面端 + 电纸书适配
- [ ] **Phase 4**：打磨优化（离线模式增强、性能优化、UI 完善）

## 📄 License

Private - 仅限个人使用

---

*详细技术方案见 [Reference/个人助手App技术方案.md](Reference/个人助手App技术方案.md)*
