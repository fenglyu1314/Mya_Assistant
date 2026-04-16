import React from 'react'
import { createMemoryRouter, Navigate } from 'react-router-dom'
import { App, AuthGuard, GuestGuard } from './App'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { MainLayout } from './components/layout/MainLayout'
import { NotesPage } from './pages/NotesPage'
import { TodosPage } from './pages/TodosPage'
import { SchedulesPage } from './pages/SchedulesPage'
import { SettingsPage } from './pages/SettingsPage'

export const router = createMemoryRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // 访客路由（未登录才能访问）
      {
        element: <GuestGuard />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      // 认证路由（需要登录才能访问）
      {
        element: <AuthGuard />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { path: 'notes', element: <NotesPage /> },
              { path: 'todos', element: <TodosPage /> },
              { path: 'schedules', element: <SchedulesPage /> },
              { path: 'settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
      // 默认重定向到快速记录
      { index: true, element: <Navigate to="/notes" replace /> },
    ],
  },
])
