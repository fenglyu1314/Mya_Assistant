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
// 初始化锁：防止并发调用时返回未完成初始化的引擎
let initPromise: Promise<OfflineEngine> | null = null

// 将 op-sqlite 实例封装为 SQLiteExecutor 接口
// op-sqlite v15：executeSync 是同步方法，execute 是异步方法
// rows 返回 Array<Record<string, Scalar>>（普通数组，无 .item() 方法）
function createSQLiteExecutor(): SQLiteExecutor {
  const db = open({ name: DB_NAME })

  return {
    execute(sql: string, params?: unknown[]) {
      try {
        const result = db.executeSync(sql, params as any[])
        const rows: Record<string, unknown>[] = result.rows
          ? (result.rows as Record<string, unknown>[])
          : []
        return { rows }
      } catch (err) {
        console.error('[SQLiteExecutor] executeSync 失败:', sql, params, err)
        throw err
      }
    },
    async executeAsync(sql: string, params?: unknown[]) {
      try {
        const result = await db.execute(sql, params as any[])
        const rows: Record<string, unknown>[] = result.rows
          ? (result.rows as Record<string, unknown>[])
          : []
        return { rows }
      } catch (err) {
        console.error('[SQLiteExecutor] executeAsync 失败:', sql, params, err)
        throw err
      }
    },
  }
}

// 初始化离线引擎
export async function initOfflineEngine(): Promise<OfflineEngine> {
  // 已初始化完成 → 直接返回
  if (engine) return engine
  // 正在初始化中 → 等待同一个 Promise
  if (initPromise) return initPromise

  initPromise = doInit()

  try {
    return await initPromise
  } finally {
    initPromise = null
  }
}

// 实际初始化逻辑（仅被 initOfflineEngine 调用一次）
async function doInit(): Promise<OfflineEngine> {
  // 1. 创建 op-sqlite 执行器
  const sqliteExecutor = createSQLiteExecutor()

  // 2. 创建 RNNetworkMonitor
  networkMonitor = new RNNetworkMonitor()

  // 3. 创建 OfflineEngine 实例
  const eng = new OfflineEngine()

  // 4. 设置 SupabaseAdapter 映射
  const client = getSupabaseClient()
  const tables: SyncableTable[] = ['notes', 'todos', 'schedules']
  const adapters = {} as Record<SyncableTable, SupabaseAdapter<BaseModel>>

  for (const table of tables) {
    adapters[table] = new SupabaseAdapter<BaseModel>(client, table)
  }
  eng.setAdapters(adapters)

  // 5. 初始化引擎（如果失败，清理全局状态避免后续调用跳过初始化）
  try {
    await eng.initialize({
      networkMonitor,
      sqliteExecutor,
    })
  } catch (err) {
    networkMonitor = null
    throw err
  }

  // 初始化成功后才赋值全局单例
  engine = eng
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
