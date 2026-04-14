// 设计 Token 定义
// 所有 UI 组件通过 useTheme() 获取这些值，禁止硬编码

export interface Theme {
  colors: {
    primary: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    error: string
    success: string
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  fontSize: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  borderRadius: {
    sm: number
    md: number
    lg: number
  }
}

// 默认主题
export const defaultTheme: Theme = {
  colors: {
    primary: '#4A90D9',
    background: '#1A1A2E',
    surface: '#16213E',
    text: '#FFFFFF',
    textSecondary: '#8892A4',
    border: '#2A2A4A',
    error: '#E74C3C',
    success: '#2ECC71',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
  },
}
