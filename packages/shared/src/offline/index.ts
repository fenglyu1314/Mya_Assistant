// 离线支持引擎 — 统一入口
// 组装 LocalDB + PendingQueue + SyncManager + NetworkMonitor

import type { SyncAdapter } from '../sync/sync-adapter'
import type { BaseModel } from '../models/base'
import type {
  IOfflineEngine,
  ILocalDB,
  IPendingQueue,
  ISyncManager,
  INetworkMonitor,
  OfflineEngineConfig,
  SyncStatus,
  SyncableTable,
} from './types'
import type { Unsubscribe } from '../sync/types'
import { LocalDB } from './local-db'
import { PendingQueue } from './pending-queue'
import { SyncManager } from './sync-manager'

// 所有可同步的表
const SYNCABLE_TABLES: SyncableTable[] = ['notes', 'todos', 'schedules']

// ─── OfflineEngine 实现 ───

export class OfflineEngine implements IOfflineEngine {
  private db: LocalDB | null = null
  private queue: PendingQueue | null = null
  private syncManager: SyncManager | null = null
  private networkMonitor: INetworkMonitor | null = null
  private networkUnsubscribe: Unsubscribe | null = null
  private isSyncing = false
  private initialized = false

  // 适配器映射，由外部在初始化前设置
  private adapters: Record<SyncableTable, SyncAdapter<any>> | null = null

  // 设置 SupabaseAdapter 映射（在 initialize 前调用）
  setAdapters(adapters: Record<SyncableTable, SyncAdapter<BaseModel>>): void {
    this.adapters = adapters
  }

  // 初始化离线引擎
  async initialize(config: OfflineEngineConfig): Promise<void> {
    if (this.initialized) {
      console.warn('[OfflineEngine] 已经初始化过，跳过')
      return
    }

    if (!this.adapters) {
      throw new Error('[OfflineEngine] 请先调用 setAdapters() 设置适配器映射')
    }

    // 1. 创建 LocalDB 并初始化 schema
    this.db = new LocalDB(config.sqliteExecutor)
    await this.db.initialize()

    // 2. 创建 PendingQueue
    this.queue = new PendingQueue(this.db)

    // 3. 创建 SyncManager
    this.syncManager = new SyncManager(this.db, this.queue, this.adapters)

    // 4. 启动 NetworkMonitor
    this.networkMonitor = config.networkMonitor
    this.networkUnsubscribe = this.networkMonitor.subscribe((online) => {
      if (online) {
        // 网络恢复 → 自动同步
        console.log('[OfflineEngine] 网络恢复，触发自动同步')
        this.sync().catch(err => {
          console.error('[OfflineEngine] 自动同步失败：', err)
        })
      }
    })

    // 5. 执行首次全量拉取（如果本地无数据）
    const hasLocalData = SYNCABLE_TABLES.some(
      table => this.db!.getLastSyncedAt(table) !== null
    )

    if (!hasLocalData && this.networkMonitor.isOnline()) {
      console.log('[OfflineEngine] 首次启动，执行全量拉取')
      await this.syncManager.initialSync()
    } else if (this.networkMonitor.isOnline()) {
      // 非首次启动，后台增量同步
      this.sync().catch(err => {
        console.error('[OfflineEngine] 启动增量同步失败：', err)
      })
    }

    this.initialized = true
    console.log('[OfflineEngine] 初始化完成')
  }

  // 手动触发同步
  async sync(): Promise<void> {
    if (!this.syncManager) {
      console.warn('[OfflineEngine] 未初始化，无法同步')
      return
    }

    if (this.isSyncing) return

    this.isSyncing = true
    try {
      await this.syncManager.flush()
    } finally {
      this.isSyncing = false
    }
  }

  // 获取同步状态
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.networkMonitor?.isOnline() ?? false,
      pendingCount: this.queue?.getCount() ?? 0,
      lastSyncedAt: this.getLatestSyncedAt(),
      isSyncing: this.isSyncing,
    }
  }

  // 关闭引擎（清理资源）
  dispose(): void {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe()
      this.networkUnsubscribe = null
    }
    if (this.networkMonitor) {
      this.networkMonitor.dispose()
      this.networkMonitor = null
    }
    this.db = null
    this.queue = null
    this.syncManager = null
    this.initialized = false
    console.log('[OfflineEngine] 已清理资源')
  }

  // 获取 LocalDB 实例
  getLocalDB(): ILocalDB {
    if (!this.db) {
      throw new Error('[OfflineEngine] 未初始化')
    }
    return this.db
  }

  // 获取 PendingQueue 实例
  getPendingQueue(): IPendingQueue {
    if (!this.queue) {
      throw new Error('[OfflineEngine] 未初始化')
    }
    return this.queue
  }

  // ─── 内部方法 ───

  // 获取所有表中最新的 lastSyncedAt
  private getLatestSyncedAt(): string | null {
    if (!this.db) return null

    let latest: string | null = null
    for (const table of SYNCABLE_TABLES) {
      const syncedAt = this.db.getLastSyncedAt(table)
      if (syncedAt && (!latest || syncedAt > latest)) {
        latest = syncedAt
      }
    }
    return latest
  }
}

// ─── 导出所有公开类型和类 ───

// 类型
export type {
  SyncableTable,
  OperationType,
  PendingOperation,
  SyncStatus,
  ConflictResult,
  SQLiteExecutor,
  ILocalDB,
  IPendingQueue,
  ISyncManager,
  INetworkMonitor,
  IOfflineEngine,
  OfflineEngineConfig,
} from './types'

// 类
export { LocalDB } from './local-db'
export { PendingQueue } from './pending-queue'
export { SyncManager } from './sync-manager'
