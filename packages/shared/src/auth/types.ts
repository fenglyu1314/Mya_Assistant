import type { User, Session } from '@supabase/supabase-js'

// 认证结果类型
export interface AuthResult {
  user: AuthUser | null
  error: AuthError | null
}

// 认证用户信息
export interface AuthUser {
  id: string
  email: string
}

// 认证错误信息
export interface AuthError {
  message: string
}

// 从 Supabase User 转换为 AuthUser
export function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null
  return {
    id: user.id,
    email: user.email ?? '',
  }
}

// 重导出 Supabase 类型供 store 使用
export type { User, Session }
