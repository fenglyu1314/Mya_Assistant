import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@mya/shared'

// 根组件：初始化认证状态
export function App() {
  const { loading, initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">正在加载...</p>
        </div>
      </div>
    )
  }

  return <Outlet />
}

// 认证路由守卫：未登录跳转登录页
export function AuthGuard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  if (!user) return null
  return <Outlet />
}

// 访客路由守卫：已登录跳转主页面
export function GuestGuard() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/notes', { replace: true })
    }
  }, [user, navigate])

  if (user) return null
  return <Outlet />
}
