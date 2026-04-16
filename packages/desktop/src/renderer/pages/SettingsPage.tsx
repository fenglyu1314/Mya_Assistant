import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Mail } from 'lucide-react'
import { useAuthStore } from '@mya/shared'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Separator } from '../components/ui/separator'
import { ConfirmDialog } from '../components/common/ConfirmDialog'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch (err) {
      console.error('登出失败:', err)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">设置</h1>
      </div>

      <div className="max-w-lg space-y-6">
        {/* 用户信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">账户信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.email ?? '未知邮箱'}</p>
                <p className="text-xs text-muted-foreground">登录邮箱</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* 登出按钮 */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={() => setLogoutOpen(true)}
          disabled={loggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {loggingOut ? '登出中...' : '退出登录'}
        </Button>
      </div>

      {/* 登出确认 */}
      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="确定要登出吗？"
        description="登出后需要重新登录才能使用。"
        confirmText="确定"
        variant="destructive"
        onConfirm={handleLogout}
      />
    </div>
  )
}
