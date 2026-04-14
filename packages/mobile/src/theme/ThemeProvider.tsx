import React, { createContext, useContext } from 'react'
import { defaultTheme } from './tokens'
import type { Theme } from './tokens'

// 主题 Context
const ThemeContext = createContext<Theme>(defaultTheme)

// 主题 Provider — 包裹在应用最外层
interface ThemeProviderProps {
  theme?: Theme
  children: React.ReactNode
}

export function ThemeProvider({ theme = defaultTheme, children }: ThemeProviderProps) {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}

// 获取当前主题的 Hook
export function useTheme(): Theme {
  return useContext(ThemeContext)
}
