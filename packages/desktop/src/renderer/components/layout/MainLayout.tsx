import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function MainLayout() {
  return (
    <div className="flex h-screen w-screen">
      {/* 左侧固定侧边栏 */}
      <Sidebar />
      {/* 右侧弹性内容区 */}
      <main className="flex-1 overflow-auto bg-muted/30 p-6">
        <Outlet />
      </main>
    </div>
  )
}
