// 移动端 Supabase 客户端初始化
// Phase 0 暂时直接传入凭证，Phase 1 切换为 react-native-config 读取 .env
import { createSupabaseClient } from '@mya/shared'

// 从根目录 .env.local 读取（React Native 不支持 process.env，
// 这里通过 Metro transformer 或直接引用。Phase 0 使用硬编码方式）
const SUPABASE_URL = 'https://swvmtzvnnzxktypomqta.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_nCTIQyYTn4zbR9OOiGz66g_ZVlTae9u'

export const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY)
