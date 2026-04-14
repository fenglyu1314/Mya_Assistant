import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useAuthStore } from '@mya/shared'
import { useTheme } from '../../theme'
import { Button } from '../../components/Button'
import { TextInput } from '../../components/TextInput'
import type { AuthStackParamList } from '../../navigation/types'

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>

// 邮箱格式验证
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterScreen({ navigation }: Props) {
  const theme = useTheme()
  const signUp = useAuthStore((s) => s.signUp)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  // 表单校验
  const validate = (): boolean => {
    let valid = true
    setEmailError('')
    setPasswordError('')
    setConfirmError('')
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

    if (!confirmPassword) {
      setConfirmError('请确认密码')
      valid = false
    } else if (password !== confirmPassword) {
      setConfirmError('密码不一致')
      valid = false
    }

    return valid
  }

  // 注册处理
  const handleRegister = async () => {
    if (!validate()) return

    setLoading(true)
    setServerError('')

    try {
      const result = await signUp(email.trim(), password)
      if (result.error) {
        setServerError(result.error.message)
        return
      }

      // Supabase 开启邮箱确认时，注册成功但没有自动登录
      // 检查 store 中是否已有 user（自动登录的情况）
      const currentUser = useAuthStore.getState().user
      if (!currentUser) {
        // 未自动登录 → 提示用户确认邮箱
        Alert.alert(
          '注册成功',
          '已向您的邮箱发送确认链接，请查收邮件完成验证后再登录。',
          [{ text: '好的', onPress: () => navigation.navigate('Login') }]
        )
      }
      // 如果已自动登录，RootNavigator 会自动切换到 MainTab
    } catch {
      setServerError('注册失败，请稍后重试')
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
            创建账号
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
            ]}
          >
            注册 Mya Assistant
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
            placeholder="请输入密码（至少 6 位）"
            value={password}
            onChangeText={setPassword}
            error={passwordError}
            secureTextEntry
          />

          <TextInput
            label="确认密码"
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={confirmError}
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
            title="注册"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: theme.spacing.sm }}
          />
        </View>

        <TouchableOpacity
          style={[styles.link, { marginTop: theme.spacing.lg }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>
            已有账号？
          </Text>
          <Text style={{ color: theme.colors.primary, fontSize: theme.fontSize.sm }}>
            {' 立即登录'}
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
