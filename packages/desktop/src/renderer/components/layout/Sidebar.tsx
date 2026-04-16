import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@mya/shared'
import { Button } from '../ui/button'
import { StickyNote, CheckSquare, Calendar, Settings, LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'

// 导航项配置
const navItems = [
  { path: '/notes', label: '快速记录', icon: StickyNote },
  { path: '/todos', label: '待办', icon: CheckSquare },
  { path: '/schedules', label: '日程', icon: Calendar },
]

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-background">
      {/* 应用名称区域 */}
      <div className="flex h-14 items-center px-4">
        <h1 className="text-lg font-bold">Mya Assistant</h1>
      </div>

      {/* 导航列表 */}
      <nav className="flex-1 space-y-1 px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}

        {/* 分隔线 */}
        <div className="my-2 border-t" />

        {/* 设置 */}
        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            location.pathname === '/settings'
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
          )}
        >
          <Settings className="h-4 w-4" />
          设置
        </button>
      </nav>

      {/* 底部用户信息和登出 */}
      <div className="border-t px-3 py-3">
        <p className="mb-2 truncate text-xs text-muted-foreground" title={user?.email ?? ''}>
          {user?.email ?? '未登录'}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          登出
        </Button>
      </div>
    </aside>
  )
}
