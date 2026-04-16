import { createSupabaseClient } from '@mya/shared'

// 初始化 Supabase 客户端，从 Vite 环境变量中读取配置
export function initializeSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url) {
    console.error(
      '[Mya Desktop] 缺少 VITE_SUPABASE_URL 环境变量。' +
      '请在项目根目录 .env.local 中配置 VITE_SUPABASE_URL。'
    )
    return
  }

  if (!anonKey) {
    console.error(
      '[Mya Desktop] 缺少 VITE_SUPABASE_ANON_KEY 环境变量。' +
      '请在项目根目录 .env.local 中配置 VITE_SUPABASE_ANON_KEY。'
    )
    return
  }

  createSupabaseClient(url, anonKey)
}
