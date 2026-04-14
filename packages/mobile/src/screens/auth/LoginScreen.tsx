import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '@mya/shared'
import { useTheme } from '../../theme'
import { Button } from '../../components/Button'
import { TextInput } from '../../components/TextInput'
import type { AuthStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>

// 邮箱格式验证
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginScreen({ navigation }: Props) {
  const theme = useTheme()
  const signIn = useAuthStore((s) => s.signIn)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  // 表单校验
  const validate = (): boolean => {
    let valid = true
    setEmailError('')
    setPasswordError('')
    setServerError('')

    if (!email.trim()) {
      setEmailError('请输入邮箱地址')
      valid = false
    } else if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError('邮箱格式不正确')
      valid = false
    }

    if (!password) {
      setPasswordError('请输入密码')
      valid = false
    } else if (password.length < 6) {
      setPasswordError('密码至少需要 6 位')
      valid = false
    }

    return valid
  }

  // 登录处理
  const handleLogin = async () => {
    if (!validate()) return

    setLoading(true)
    setServerError('')

    try {
      const result = await signIn(email.trim(), password)
      if (result.error) {
        setServerError(result.error.message)
      }
      // 登录成功后 RootNavigator 会自动切换到 MainTab
    } catch {
      setServerError('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.text, fontSize: theme.fontSize.xl },
            ]}
          >
            欢迎回来
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
            ]}
          >
            登录 Mya Assistant
          </Text>
        </View>

        <View style={[styles.form, { gap: theme.spacing.md }]}>
          <TextInput
            label="邮箱"
            placeholder="请输入邮箱地址"
            value={email}
            onChangeText={setEmail}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            label="密码"
            placeholder="请输入密码"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry
          />

          {serverError ? (
            <Text
              style={[
                styles.serverError,
                { color: theme.colors.error, fontSize: theme.fontSize.sm },
              ]}
            >
              {serverError}
            </Text>
          ) : null}

          <Button
            title="登录"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: theme.spacing.sm }}
          />
        </View>

        <TouchableOpacity
          style={[styles.link, { marginTop: theme.spacing.lg }]}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>
            没有账号？
          </Text>
          <Text style={{ color: theme.colors.primary, fontSize: theme.fontSize.sm }}>
            {' 立即注册'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {},
  form: {},
  serverError: {
    textAlign: 'center',
  },
  link: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
})
