// Mya Assistant 移动端入口
import React, { useEffect, useCallback } from 'react'
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

  // 初始化离线引擎（认证成功后）
  const initOffline = useCallback(async () => {
    if (!user) return

    try {
      const engine = await initOfflineEngine()
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

      console.log('[App] 离线引擎初始化完成，Store 已从 SQLite 加载数据')
    } catch (err) {
      console.error('[App] 离线引擎初始化失败：', err)
    }
  }, [user])

  // 应用启动时初始化认证状态
  useEffect(() => {
    initialize()
  }, [initialize])

  // 用户认证成功后初始化离线引擎
  useEffect(() => {
    if (user) {
      initOffline()
    } else {
      // 用户登出 → 清理离线引擎
      disposeOfflineEngine()
    }
  }, [user, initOffline])

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
