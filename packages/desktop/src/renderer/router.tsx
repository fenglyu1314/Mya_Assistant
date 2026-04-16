import { createMemoryRouter, Navigate } from 'react-router-dom'
import { App, AuthGuard, GuestGuard } from './App'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { MainLayout } from './components/layout/MainLayout'
import { NotesPlaceholder } from './pages/NotesPlaceholder'
import { TodosPlaceholder } from './pages/TodosPlaceholder'
import { SchedulesPlaceholder } from './pages/SchedulesPlaceholder'
import { SettingsPlaceholder } from './pages/SettingsPlaceholder'

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
              { path: 'notes', element: <NotesPlaceholder /> },
              { path: 'todos', element: <TodosPlaceholder /> },
              { path: 'schedules', element: <SchedulesPlaceholder /> },
              { path: 'settings', element: <SettingsPlaceholder /> },
            ],
          },
        ],
      },
      // 默认重定向到快速记录
      { index: true, element: <Navigate to="/notes" replace /> },
    ],
  },
])
