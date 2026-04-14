import { create } from 'zustand'
import { AuthService } from '../auth/auth-service'
import { toAuthUser } from '../auth/types'
import type { AuthResult, AuthUser } from '../auth/types'
import type { Session } from '@supabase/supabase-js'

// 认证状态
interface AuthState {
  user: AuthUser | null
  session: Session | null
  loading: boolean
}

// 认证操作
interface AuthActions {
  initialize: () => Promise<void>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

// 认证 Store — 管理全局认证状态
export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  // 初始状态
  user: null,
  session: null,
  loading: true,

  // 初始化：检查已有会话 + 监听认证状态变化
  initialize: async () => {
    try {
      const session = await AuthService.getSession()
      set({
        user: session ? toAuthUser(session.user) : null,
        session,
        loading: false,
      })

      // 监听认证状态变化（登录/登出/token 刷新）
      AuthService.onAuthStateChange((_event, session) => {
        set({
          user: session ? toAuthUser(session.user) : null,
          session,
        })
      })
    } catch {
      set({ user: null, session: null, loading: false })
    }
  },

  // 注册并更新 store
  signUp: async (email: string, password: string): Promise<AuthResult> => {
    const result = await AuthService.signUp(email, password)
    if (result.user && !result.error) {
      // 注册后 Supabase 可能自动登录，等待 onAuthStateChange 更新
      // 如果未自动登录，则手动更新
      const session = await AuthService.getSession()
      if (session) {
        set({ user: result.user, session })
      }
    }
    return result
  },

  // 登录并更新 store
  signIn: async (email: string, password: string): Promise<AuthResult> => {
    const result = await AuthService.signIn(email, password)
    if (result.user && !result.error) {
      const session = await AuthService.getSession()
      set({ user: result.user, session })
    }
    return result
  },

  // 登出并清空 store
  signOut: async () => {
    await AuthService.signOut()
    set({ user: null, session: null })
  },
}))
