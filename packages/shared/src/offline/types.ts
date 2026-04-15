import type { BaseModel } from '../models/base'
import type { Unsubscribe } from '../sync/types'

// ─── 基础类型 ───

// 可同步的表名
export type SyncableTable = 'notes' | 'todos' | 'schedules'

// 操作类型
export type OperationType = 'create' | 'update' | 'delete'

// ─── 操作队列 ───

// 待推送的离线操作
export interface PendingOperation {
  id: number
  table_name: SyncableTable
  operation: OperationType
  record_id: string
  payload: string           // JSON 序列化的变更字段
  base_version: number      // 操作时记录的 _version
  created_at: string        // ISO 8601 时间戳
}

// ─── 同步状态 ───

export interface SyncStatus {
  isOnline: boolean
  pendingCount: number
  lastSyncedAt: string | null
  isSyncing: boolean
}

// ─── 冲突合并结果 ───

export interface ConflictResult<T extends BaseModel> {
  merged: T                 // 合并后的完整记录
  hadConflict: boolean      // 是否存在字段冲突（双方都修改了同一字段）
}

// ─── SQLite 执行器接口（由平台端注入） ───

export interface SQLiteExecutor {
  // 同步执行 SQL（op-sqlite 支持同步 API）
  execute(sql: string, params?: unknown[]): { rows: Record<string, unknown>[] }
  // 异步执行 SQL（用于初始化等场景）
  executeAsync(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>
}

// ─── LocalDB 接口 ───

export interface ILocalDB {
  // 初始化数据库（创建表 + schema 迁移）
  initialize(): Promise<void>

  // 通用查询
  getAll<T>(table: SyncableTable, excludeDeleted?: boolean): T[]
  getById<T>(table: SyncableTable, id: string): T | null

  // 写入
  upsert<T extends BaseModel>(table: SyncableTable, record: T): void
  upsertBatch<T extends BaseModel>(table: SyncableTable, records: T[]): void
  markDeleted(table: SyncableTable, id: string): void

  // 操作队列
  enqueuePending(op: Omit<PendingOperation, 'id'>): void
  dequeuePending(id: number): void
  getAllPending(): PendingOperation[]
  getPendingCount(): number
  getPendingForRecord(table: SyncableTable, recordId: string): PendingOperation[]

  // 同步元数据
  getLastSyncedAt(table: SyncableTable): string | null
  setLastSyncedAt(table: SyncableTable, timestamp: string): void
}

// ─── PendingQueue 接口 ───

export interface IPendingQueue {
  // 入队（自动触发合并优化）
  enqueue(op: Omit<PendingOperation, 'id'>): void
  // 出队（删除已完成的操作）
  dequeue(id: number): void
  // 按 created_at 排序取出待推送的操作
  peek(limit?: number): PendingOperation[]
  // 返回队列长度
  getCount(): number
  // 执行队列合并优化
  optimize(): void
}

// ─── SyncManager 接口 ───

export interface ISyncManager {
  // 推送本地 pending 操作到后端
  push(): Promise<void>
  // 拉取指定表的远端增量变更
  pull(table: SyncableTable): Promise<void>
  // 拉取所有表的远端增量变更
  pullAll(): Promise<void>
  // 完整同步：push + pullAll
  flush(): Promise<void>
  // 首次全量拉取
  initialSync(): Promise<void>
  // 字段级冲突合并
  fieldMerge<T extends BaseModel>(
    local: T,
    remote: T,
    pendingPayload: Partial<T>
  ): ConflictResult<T>
}

// ─── NetworkMonitor 接口 ───

export interface INetworkMonitor {
  // 当前网络是否可用
  isOnline(): boolean
  // 订阅网络状态变化，返回取消订阅函数
  subscribe(callback: (online: boolean) => void): Unsubscribe
  // 清理资源
  dispose(): void
}

// ─── OfflineEngine 接口 ───

export interface OfflineEngineConfig {
  networkMonitor: INetworkMonitor
  sqliteExecutor: SQLiteExecutor
}

export interface IOfflineEngine {
  // 初始化离线引擎（创建 DB、启动网络监听、执行初始 pull）
  initialize(config: OfflineEngineConfig): Promise<void>
  // 手动触发同步
  sync(): Promise<void>
  // 获取同步状态
  getSyncStatus(): SyncStatus
  // 关闭引擎（清理资源）
  dispose(): void
  // 获取子模块实例
  getLocalDB(): ILocalDB
  getPendingQueue(): IPendingQueue
}
