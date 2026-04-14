## 1. 环境配置与依赖安装

- [x] 1.1 移动端安装 `react-native-config`，配置 Android 原生链接（`android/app/build.gradle` 引入插件），创建 `packages/mobile/.env.example`（含 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 占位）。验收：`Config.SUPABASE_URL` 在 RN 代码中可读取。
- [x] 1.2 共享层和移动端安装 `zustand` 依赖。验收：`pnpm install` 无报错，`import { create } from 'zustand'` 类型正确解析。
- [x] 1.3 移动端安装 React Navigation 依赖（`@react-navigation/native`、`@react-navigation/native-stack`、`@react-navigation/bottom-tabs`、`react-native-screens`、`react-native-safe-area-context`）。验收：`pnpm install` 无报错，依赖解析正常。
- [x] 1.4 重构移动端 Supabase 客户端初始化：从硬编码凭证切换为 `react-native-config` 读取 `.env`，移除 `packages/mobile/src/supabase.ts` 中的硬编码值。验收：`supabaseClient` 从环境变量初始化，无硬编码敏感信息。

## 2. 共享层 — 认证模块

- [x] 2.1 创建 `packages/shared/src/auth/auth-service.ts`，导出 `AuthService` 对象，封装 `signUp`、`signIn`、`signOut`、`getSession`、`onAuthStateChange` 五个方法。验收：TypeScript 类型正确，所有方法签名符合 auth spec。
- [x] 2.2 创建 `packages/shared/src/auth/types.ts`，导出 `AuthResult`、`AuthUser` 类型定义。验收：`AuthResult` 包含 `user` 和 `error` 字段。
- [x] 2.3 创建 `packages/shared/src/auth/index.ts` 汇总导出，并在 `packages/shared/src/index.ts` 中添加 auth 模块的导出。验收：`import { AuthService } from '@mya/shared'` 可用。
- [x] 2.4 创建 `packages/shared/src/stores/auth-store.ts`，导出 `useAuthStore`（Zustand），实现 `user`、`session`、`loading` 状态和 `initialize`、`signUp`、`signIn`、`signOut` 操作。验收：store 状态变更符合 auth spec 中的所有 scenario。
- [x] 2.5 创建 `packages/shared/src/stores/index.ts` 汇总导出，并在 `packages/shared/src/index.ts` 中添加 stores 模块的导出。验收：`import { useAuthStore } from '@mya/shared'` 可用。

## 3. 移动端 — 主题系统

- [x] 3.1 创建 `packages/mobile/src/theme/tokens.ts`，定义默认主题 token 对象（colors、spacing、fontSize、borderRadius）和 `Theme` 类型。验收：Theme 类型包含所有 spec 定义的字段。
- [x] 3.2 创建 `packages/mobile/src/theme/ThemeProvider.tsx`，实现 `ThemeProvider` 组件和 `useTheme` hook。验收：子组件通过 `useTheme()` 获取完整 Theme 对象。
- [x] 3.3 创建 `packages/mobile/src/theme/index.ts` 汇总导出。验收：`import { ThemeProvider, useTheme } from '../theme'` 可用。

## 4. 移动端 — 基础 UI 组件

- [x] 4.1 创建 `packages/mobile/src/components/Button.tsx`，支持 `variant`（primary/secondary/ghost）、`loading`、`disabled` props，使用 `useTheme()` 获取样式。验收：三种 variant 样式不同，loading 时显示 ActivityIndicator。
- [x] 4.2 创建 `packages/mobile/src/components/TextInput.tsx`，支持 `label`、`placeholder`、`error`、`secureTextEntry` props。验收：传入 error 时边框变红、下方显示错误文本。
- [x] 4.3 创建 `packages/mobile/src/components/Card.tsx`，带圆角和阴影的容器组件。验收：子元素正确渲染在卡片容器内。
- [x] 4.4 创建 `packages/mobile/src/components/EmptyState.tsx`，支持 `icon`、`title`、`description` props，居中布局。验收：三个 prop 均正确展示。
- [x] 4.5 创建 `packages/mobile/src/components/index.ts` 汇总导出。验收：`import { Button, TextInput, Card, EmptyState } from '../components'` 可用。

## 5. 移动端 — 导航框架

- [x] 5.1 创建 `packages/mobile/src/navigation/types.ts`，定义导航参数类型（AuthStackParamList、MainTabParamList）。验收：TypeScript 导航参数类型完备。
- [x] 5.2 创建 `packages/mobile/src/navigation/AuthStack.tsx`，包含 LoginScreen 和 RegisterScreen 路由。验收：两个页面可正常切换。
- [x] 5.3 创建 `packages/mobile/src/navigation/MainTab.tsx`，包含 Notes、Todos（占位）、Schedule（占位）、Settings 四个 tab 路由。验收：四个 tab 可切换，图标和标签正确显示。
- [x] 5.4 创建 `packages/mobile/src/navigation/RootNavigator.tsx`，根据 `useAuthStore.user` 自动切换 AuthStack / MainTab。验收：未登录显示 AuthStack，已登录显示 MainTab。
- [x] 5.5 更新 `App.tsx` 入口，接入 `NavigationContainer` + `ThemeProvider` + `RootNavigator`，并在启动时调用 `useAuthStore.initialize()`。验收：App 正常启动，根据登录状态显示对应页面。

## 6. 移动端 — 认证页面

- [x] 6.1 创建 `packages/mobile/src/screens/auth/LoginScreen.tsx`，包含邮箱/密码输入、登录按钮、跳转注册链接、表单校验（邮箱格式 + 密码最少 6 位）、错误提示。验收：校验失败时显示错误，登录成功后自动跳转主页面。
- [x] 6.2 创建 `packages/mobile/src/screens/auth/RegisterScreen.tsx`，包含邮箱/密码/确认密码输入、注册按钮、跳转登录链接、表单校验（两次密码一致性）。验收：注册成功后自动登录并跳转主页面。

## 7. 共享层 — 快速记录 Store

- [x] 7.1 创建 `packages/shared/src/stores/notes-store.ts`，导出 `useNotesStore`（Zustand），实现 `notes`、`loading`、`filter` 状态和 `fetchNotes`、`createNote`、`deleteNote`、`togglePin`、`setFilter`、`subscribeRealtime`、`filteredNotes` 操作。验收：所有操作符合 notes-feature spec 中的 scenario。
- [x] 7.2 在 `packages/shared/src/stores/index.ts` 中添加 `useNotesStore` 导出。验收：`import { useNotesStore } from '@mya/shared'` 可用。

## 8. 移动端 — 快速记录页面

- [x] 8.1 创建 `packages/mobile/src/screens/notes/NotesListScreen.tsx`，包含分类筛选栏（全部/灵感/备忘/日志）、快速记录卡片列表、置顶标记、空状态提示、FAB 创建按钮。验收：列表正确加载，筛选切换即时生效，置顶记录排在最前。
- [x] 8.2 创建 `packages/mobile/src/screens/notes/CreateNoteScreen.tsx`（或 Modal），包含内容输入、分类选择、创建按钮、空内容校验。验收：创建成功后返回列表，新记录出现。
- [x] 8.3 在 NotesListScreen 中实现左滑删除（或长按弹出菜单），包含删除确认对话框。验收：确认删除后记录从列表消失。
- [x] 8.4 在 NotesListScreen 中实现置顶切换功能。验收：点击置顶按钮后记录移到顶部，再次点击取消置顶。
- [x] 8.5 在 NotesListScreen 进入时调用 `subscribeRealtime()`，离开时取消订阅。验收：另一端创建/删除记录时，列表实时更新。

## 9. 清理与收尾

- [x] 9.1 移除 Phase 0 验证代码：删除 `CrudVerifyScreen.tsx`、`RealtimeVerifyScreen.tsx`，清理 App.tsx 中的旧引用。验收：项目中无 Phase 0 验证代码残留。
- [x] 9.2 创建 `packages/mobile/src/screens/settings/SettingsScreen.tsx`，包含用户邮箱显示和登出按钮。验收：点击登出后跳转到登录页面。
- [x] 9.3 创建 Phase 2 的 Todos 和 Schedule 占位页面（`PlaceholderScreen`），显示"即将推出"文案。验收：对应 tab 页显示占位内容。
- [x] 9.4 全局 TypeScript 类型检查通过（`pnpm typecheck`），无编译错误。验收：`pnpm typecheck` 返回 exit code 0。
