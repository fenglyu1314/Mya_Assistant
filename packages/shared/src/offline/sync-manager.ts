import type { BaseModel } from '../models/base'
import type { SyncAdapter } from '../sync/sync-adapter'
import type {
  ILocalDB,
  IPendingQueue,
  ISyncManager,
  SyncableTable,
  ConflictResult,
  PendingOperation,
} from './types'

// 所有可同步的表
const SYNCABLE_TABLES: SyncableTable[] = ['notes', 'todos', 'schedules']

// 重试配置
const MAX_RETRIES = 10
const MAX_BACKOFF_MS = 30_000 // 30 秒

// 计算指数退避延时
function backoffDelay(retryCount: number): number {
  const delay = Math.min(1000 * Math.pow(2, retryCount), MAX_BACKOFF_MS)
  return delay
}

// 延迟工具函数
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── SyncManager 实现 ───

export class SyncManager implements ISyncManager {
  private isSyncing = false

  constructor(
    private readonly localDB: ILocalDB,
    private readonly pendingQueue: IPendingQueue,
    // 每张表对应一个 SupabaseAdapter 实例
    private readonly adapters: Record<SyncableTable, SyncAdapter<any>>
  ) {}

  // 推送本地 pending 操作到后端
  async push(): Promise<void> {
    const pending = this.pendingQueue.peek()
    if (pending.length === 0) return

    for (const op of pending) {
      try {
        await this.pushOne(op)
        this.pendingQueue.dequeue(op.id)
      } catch (err) {
        // 网络错误 → 保留在队列中，等待重试
        if (this.isNetworkError(err)) {
          console.warn(`[SyncManager] 网络错误，操作保留在队列中：${op.table_name}/${op.record_id}`)
          break // 网络不通，停止推送
        }
        // 其他错误 → 记录日志，跳过该条继续
        console.error(`[SyncManager] 推送失败：${op.table_name}/${op.record_id}`, err)
      }
    }
  }

  // 拉取指定表的远端增量变更
  async pull(table: SyncableTable): Promise<void> {
    const adapter = this.adapters[table]
    const since = this.localDB.getLastSyncedAt(table)

    let records: BaseModel[]

    if (since && adapter.fetchUpdatedSince) {
      // 增量拉取
      records = await adapter.fetchUpdatedSince(since)
    } else {
      // 首次拉取（全量）
      records = await adapter.getAll()
    }

    if (records.length === 0) return

    // 处理每条远端记录
    let maxUpdatedAt = since ?? ''

    for (const remote of records) {
      const local = this.localDB.getById<BaseModel>(table, remote.id)
      const pendingOps = this.localDB.getPendingForRecord(table, remote.id)

      if (!local || pendingOps.length === 0) {
        // 本地不存在 或 无 pending 操作 → 直接写入（远端覆盖）
        this.localDB.upsert(table, remote)
      } else {
        // 本地存在 + 有 pending 操作 → 字段级合并
        // 合并所有 pending 操作的 payload
        const mergedPayload: Record<string, unknown> = {}
        for (const op of pendingOps) {
          if (op.operation === 'update') {
            const payload = JSON.parse(op.payload) as Record<string, unknown>
            Object.assign(mergedPayload, payload)
          }
        }

        if (Object.keys(mergedPayload).length > 0) {
          const { merged } = this.fieldMerge(
            local,
            remote,
            mergedPayload as Partial<BaseModel>
          )
          this.localDB.upsert(table, merged)
        } else {
          // pending 操作是 create 或 delete，直接用远端
          this.localDB.upsert(table, remote)
        }
      }

      // 更新水位线
      if (remote.updated_at > maxUpdatedAt) {
        maxUpdatedAt = remote.updated_at
      }
    }

    // 更新 last_synced_at
    if (maxUpdatedAt) {
      this.localDB.setLastSyncedAt(table, maxUpdatedAt)
    }
  }

  // 拉取所有表的远端增量变更
  async pullAll(): Promise<void> {
    for (const table of SYNCABLE_TABLES) {
      await this.pull(table)
    }
  }

  // 完整同步：push + pullAll
  async flush(): Promise<void> {
    if (this.isSyncing) return
    this.isSyncing = true

    try {
      await this.push()
      await this.pullAll()
    } finally {
      this.isSyncing = false
    }
  }

  // 首次全量拉取（三张表都拉取完整数据）
  async initialSync(): Promise<void> {
    for (const table of SYNCABLE_TABLES) {
      const adapter = this.adapters[table]
      // 全量拉取（不传 since，使用 getAll）
      const records = await adapter.getAll()
      this.localDB.upsertBatch(table, records)

      // 设置初始水位线
      if (records.length > 0) {
        const maxUpdatedAt = records.reduce(
          (max, r) => r.updated_at > max ? r.updated_at : max,
          ''
        )
        this.localDB.setLastSyncedAt(table, maxUpdatedAt)
      }
    }
  }

  // 字段级冲突合并
  fieldMerge<T extends BaseModel>(
    local: T,
    remote: T,
    pendingPayload: Partial<T>
  ): ConflictResult<T> {
    const merged = { ...remote } as Record<string, unknown>
    let hadConflict = false

    // 遍历 pendingPayload 中的每个变更字段
    for (const key of Object.keys(pendingPayload)) {
      const localOriginalValue = (local as Record<string, unknown>)[key]
      const remoteValue = (remote as Record<string, unknown>)[key]
      const pendingValue = (pendingPayload as Record<string, unknown>)[key]

      // 判断远端是否也修改了该字段
      const remoteChanged = JSON.stringify(remoteValue) !== JSON.stringify(localOriginalValue)

      if (remoteChanged) {
        // 双方都修改了同一字段 → 远端优先
        merged[key] = remoteValue
        hadConflict = true
      } else {
        // 仅本地修改了该字段 → 保留本地变更
        merged[key] = pendingValue
      }
    }

    // 不在 pendingPayload 中的字段：取远端最新值（已由展开运算符处理）

    return {
      merged: merged as T,
      hadConflict,
    }
  }

  // ─── 内部方法 ───

  // 推送单条操作
  private async pushOne(op: PendingOperation): Promise<void> {
    const adapter = this.adapters[op.table_name]
    const payload = JSON.parse(op.payload) as Record<string, unknown>

    let retryCount = 0

    while (retryCount <= MAX_RETRIES) {
      try {
        switch (op.operation) {
          case 'create': {
            const created = await adapter.create(payload)
            // 用后端返回的完整记录更新本地（含 id、timestamps 等）
            this.localDB.upsert(op.table_name, created)
            return
          }

          case 'update': {
            const updated = await adapter.update(op.record_id, payload)
            // 检测版本冲突
            if (updated._version > op.base_version + 1) {
              // 有冲突 → 拉取远端最新 + 字段级合并
              await this.resolveConflict(op, updated)
            } else {
              // 无冲突 → 直接更新本地
              this.localDB.upsert(op.table_name, updated)
            }
            return
          }

          case 'delete': {
            await adapter.remove(op.record_id)
            return
          }
        }
      } catch (err) {
        if (this.isNetworkError(err) && retryCount < MAX_RETRIES) {
          retryCount++
          const delay = backoffDelay(retryCount)
          console.warn(`[SyncManager] 重试 ${retryCount}/${MAX_RETRIES}，${delay}ms 后重试`)
          await sleep(delay)
          continue
        }

        if (retryCount >= MAX_RETRIES) {
          console.error(`[SyncManager] 操作 ${op.id} 超过最大重试次数 ${MAX_RETRIES}，标记为 failed`)
        }

        throw err
      }
    }
  }

  // 解决版本冲突：拉取远端最新记录，执行字段级合并后重新推送
  private async resolveConflict(op: PendingOperation, remoteRecord: BaseModel): Promise<void> {
    const local = this.localDB.getById<BaseModel>(op.table_name, op.record_id)
    if (!local) {
      // 本地记录不存在，直接用远端
      this.localDB.upsert(op.table_name, remoteRecord)
      return
    }

    const pendingPayload = JSON.parse(op.payload) as Partial<BaseModel>
    const { merged } = this.fieldMerge(local, remoteRecord, pendingPayload)

    // 合并后更新本地
    this.localDB.upsert(op.table_name, merged)

    // 重新推送合并后的变更
    const adapter = this.adapters[op.table_name]
    const reUpdated = await adapter.update(op.record_id, merged)
    this.localDB.upsert(op.table_name, reUpdated)
  }

  // 判断是否为网络错误
  private isNetworkError(err: unknown): boolean {
    if (err instanceof TypeError && (err.message.includes('fetch') || err.message.includes('network'))) {
      return true
    }
    if (err instanceof Error && (
      err.message.includes('NetworkError') ||
      err.message.includes('Failed to fetch') ||
      err.message.includes('Network request failed')
    )) {
      return true
    }
    return false
  }
}
