// Mya Assistant 移动端入口
// ⚠️ 必须在所有其他导入之前：为 uuid 等库提供 crypto.getRandomValues polyfill
import 'react-native-get-random-values'

import React, { useEffect, useRef } from 'react'
import { StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { useAuthStore, useNotesStore, useTodosStore, useSchedulesStore } from '@mya/shared'
import { ThemeProvider, useTheme } from './src/theme'
import { RootNavigator } from './src/navigation'
import { initOfflineEngine, disposeOfflineEngine } from './src/offline'

// 确保 Supabase 客户端初始化（副作用导入）
import './src/supabase'

function AppContent() {
  const theme = useTheme()
  const initialize = useAuthStore((s) => s.initialize)
  const user = useAuthStore((s) => s.user)

  // 追踪离线引擎是否已初始化
  const offlineInitialized = useRef(false)

  // 应用启动时初始化认证状态
  useEffect(() => {
    initialize()
  }, [initialize])

  // 用户认证成功后初始化离线引擎
  useEffect(() => {
    if (!user) {
      // 用户登出 → 清理离线引擎
      if (offlineInitialized.current) {
        disposeOfflineEngine()
        offlineInitialized.current = false
      }
      return
    }

    // 已初始化过 → 跳过
    if (offlineInitialized.current) return

    let cancelled = false

    const init = async () => {
      try {
        const engine = await initOfflineEngine()

        // effect 已被清理（组件卸载或 user 变化），不再继续
        if (cancelled) return

        const localDB = engine.getLocalDB()
        const pendingQueue = engine.getPendingQueue()

        // 注入离线模块到各 Store
        useNotesStore.getState().setOfflineModules(localDB, pendingQueue)
        useTodosStore.getState().setOfflineModules(localDB, pendingQueue)
        useSchedulesStore.getState().setOfflineModules(localDB, pendingQueue)

        // 从 SQLite 加载数据到 Store
        useNotesStore.getState().initializeFromLocal()
        useTodosStore.getState().initializeFromLocal()
        useSchedulesStore.getState().initializeFromLocal()

        offlineInitialized.current = true
        console.log('[App] 离线引擎初始化完成，Store 已从 SQLite 加载数据')
      } catch (err) {
        if (!cancelled) {
          console.error('[App] 离线引擎初始化失败：', err)
        }
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.error,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <RootNavigator />
    </NavigationContainer>
  )
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  )
}

export default App
