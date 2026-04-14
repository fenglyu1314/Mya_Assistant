import { getSupabaseClient } from '../sync/supabase-client'
import type { AuthResult, AuthUser } from './types'
import { toAuthUser } from './types'
import type { Session, User } from '@supabase/supabase-js'

// 认证服务 — 封装 Supabase Auth API
// 所有方法返回 AuthResult，不抛出异常
export const AuthService = {
  // 邮箱注册
  async signUp(email: string, password: string): Promise<AuthResult> {
    const client = getSupabaseClient()
    const { data, error } = await client.auth.signUp({ email, password })

    if (error) {
      return { user: null, error: { message: error.message } }
    }

    return { user: toAuthUser(data.user), error: null }
  },

  // 邮箱登录
  async signIn(email: string, password: string): Promise<AuthResult> {
    const client = getSupabaseClient()
    const { data, error } = await client.auth.signInWithPassword({ email, password })

    if (error) {
      return { user: null, error: { message: error.message } }
    }

    return { user: toAuthUser(data.user), error: null }
  },

  // 登出
  async signOut(): Promise<void> {
    const client = getSupabaseClient()
    const { error } = await client.auth.signOut()
    if (error) {
      throw new Error(`登出失败：${error.message}`)
    }
  },

  // 获取当前会话
  async getSession(): Promise<Session | null> {
    const client = getSupabaseClient()
    const { data, error } = await client.auth.getSession()
    if (error) {
      throw new Error(`获取会话失败：${error.message}`)
    }
    return data.session
  },

  // 监听认证状态变化
  onAuthStateChange(
    callback: (event: string, session: Session | null) => void
  ): () => void {
    const client = getSupabaseClient()
    const { data } = client.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
    return () => data.subscription.unsubscribe()
  },
}
