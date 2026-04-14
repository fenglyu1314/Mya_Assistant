// Mya Assistant 移动端入口
import React, { useEffect } from 'react'
import { StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { useAuthStore } from '@mya/shared'
import { ThemeProvider, useTheme } from './src/theme'
import { RootNavigator } from './src/navigation'

// 确保 Supabase 客户端初始化（副作用导入）
import './src/supabase'

function AppContent() {
  const theme = useTheme()
  const initialize = useAuthStore((s) => s.initialize)

  // 应用启动时初始化认证状态
  useEffect(() => {
    initialize()
  }, [initialize])

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
