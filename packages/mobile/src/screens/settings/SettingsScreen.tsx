import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuthStore } from '@mya/shared'
import { useTheme } from '../../theme'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'

export function SettingsScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      // 错误处理：即使登出失败也清空本地状态
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.sm,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.text, fontSize: theme.fontSize.xl },
          ]}
        >
          设置
        </Text>
      </View>

      <View style={{ padding: theme.spacing.md }}>
        {/* 用户信息卡片 */}
        <Card style={{ marginBottom: theme.spacing.md }}>
          <View style={styles.userInfo}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.lg + 4,
                },
              ]}
            >
              <Text style={styles.avatarText}>
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: theme.fontSize.md,
                  fontWeight: '600',
                }}
              >
                {user?.email ?? '未登录'}
              </Text>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSize.sm,
                  marginTop: 2,
                }}
              >
                Mya Assistant 用户
              </Text>
            </View>
          </View>
        </Card>

        {/* 登出按钮 */}
        <Button
          title="退出登录"
          onPress={handleSignOut}
          variant="secondary"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  headerTitle: {
    fontWeight: '700',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
})
