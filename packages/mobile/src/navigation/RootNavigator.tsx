import React from 'react'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { useAuthStore } from '@mya/shared'
import { useTheme } from '../theme'
import { AuthStack } from './AuthStack'
import { MainTab } from './MainTab'

export function RootNavigator() {
  const theme = useTheme()
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)

  // 认证状态加载中，显示加载指示器
  if (loading) {
    return (
      <View
        style={[
          styles.loading,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    )
  }

  // 根据认证状态切换导航栈
  return user ? <MainTab /> : <AuthStack />
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
