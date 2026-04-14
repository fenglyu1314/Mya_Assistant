import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 声明 process 类型以兼容非 Node 环境（移动端不使用 process.env）
declare const process: { env: Record<string, string | undefined> } | undefined

// Supabase 客户端单例（惰性初始化）
let client: SupabaseClient | null = null

// 创建 Supabase 客户端
// 缺少参数时抛出明确错误
export function createSupabaseClient(url?: string, anonKey?: string): SupabaseClient {
  if (client) return client

  const supabaseUrl = url || (typeof process !== 'undefined' ? process?.env?.SUPABASE_URL : undefined)
  const supabaseAnonKey = anonKey || (typeof process !== 'undefined' ? process?.env?.SUPABASE_ANON_KEY : undefined)

  if (!supabaseUrl) {
    throw new Error(
      '缺少 SUPABASE_URL：请通过参数传入或在 .env.local 中配置 SUPABASE_URL'
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      '缺少 SUPABASE_ANON_KEY：请通过参数传入或在 .env.local 中配置 SUPABASE_ANON_KEY'
    )
  }

  client = createClient(supabaseUrl, supabaseAnonKey)
  return client
}

// 获取已创建的客户端（未初始化时抛出错误）
export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    throw new Error('Supabase 客户端未初始化，请先调用 createSupabaseClient()')
  }
  return client
}

// 重置客户端（用于测试）
export function resetSupabaseClient(): void {
  client = null
}
