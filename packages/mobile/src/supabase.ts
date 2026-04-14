// 移动端 Supabase 客户端初始化
// 通过 react-native-config 从 .env 文件读取凭证
import Config from 'react-native-config'
import { createSupabaseClient } from '@mya/shared'

const SUPABASE_URL = Config.SUPABASE_URL
const SUPABASE_ANON_KEY = Config.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '缺少 Supabase 配置：请在 packages/mobile/.env 中设置 SUPABASE_URL 和 SUPABASE_ANON_KEY'
  )
}

export const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
