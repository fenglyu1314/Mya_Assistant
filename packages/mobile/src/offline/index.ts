// 移动端离线引擎初始化入口
// 注入 op-sqlite 实例和 RNNetworkMonitor，调用 OfflineEngine.initialize()

import { open } from '@op-engineering/op-sqlite'
import {
  OfflineEngine,
  SupabaseAdapter,
  getSupabaseClient,
} from '@mya/shared'
import type { SQLiteExecutor, SyncableTable } from '@mya/shared'
import type { BaseModel } from '@mya/shared'
import { RNNetworkMonitor } from './rn-network-monitor'

// 数据库文件名
const DB_NAME = 'mya_assistant.db'

// 全局单例
let engine: OfflineEngine | null = null
let networkMonitor: RNNetworkMonitor | null = null

// 将 op-sqlite 实例封装为 SQLiteExecutor 接口
function createSQLiteExecutor(): SQLiteExecutor {
  const db = open({ name: DB_NAME })

  return {
    execute(sql: string, params?: unknown[]) {
      const result = db.execute(sql, params as any[])
      // op-sqlite 返回 { rows: { _array: [...] } }，需要转换
      const rows: Record<string, unknown>[] = []
      if (result.rows) {
        for (let i = 0; i < result.rows.length; i++) {
          rows.push(result.rows.item(i) as Record<string, unknown>)
        }
      }
      return { rows }
    },
    async executeAsync(sql: string, params?: unknown[]) {
      const result = await db.executeAsync(sql, params as any[])
      const rows: Record<string, unknown>[] = []
      if (result.rows) {
        for (let i = 0; i < result.rows.length; i++) {
          rows.push(result.rows.item(i) as Record<string, unknown>)
        }
      }
      return { rows }
    },
  }
}

// 初始化离线引擎
export async function initOfflineEngine(): Promise<OfflineEngine> {
  if (engine) return engine

  // 1. 创建 op-sqlite 执行器
  const sqliteExecutor = createSQLiteExecutor()

  // 2. 创建 RNNetworkMonitor
  networkMonitor = new RNNetworkMonitor()

  // 3. 创建 OfflineEngine 实例
  engine = new OfflineEngine()

  // 4. 设置 SupabaseAdapter 映射
  const client = getSupabaseClient()
  const tables: SyncableTable[] = ['notes', 'todos', 'schedules']
  const adapters = {} as Record<SyncableTable, SupabaseAdapter<BaseModel>>

  for (const table of tables) {
    adapters[table] = new SupabaseAdapter<BaseModel>(client, table)
  }
  engine.setAdapters(adapters)

  // 5. 初始化引擎
  await engine.initialize({
    networkMonitor,
    sqliteExecutor,
  })

  return engine
}

// 获取已初始化的引擎实例
export function getOfflineEngine(): OfflineEngine | null {
  return engine
}

// 销毁离线引擎（用户登出时调用）
export function disposeOfflineEngine(): void {
  if (engine) {
    engine.dispose()
    engine = null
  }
  if (networkMonitor) {
    networkMonitor.dispose()
    networkMonitor = null
  }
}
