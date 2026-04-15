import type {
  SQLiteExecutor,
  ILocalDB,
  SyncableTable,
  PendingOperation,
} from './types'
import type { BaseModel } from '../models/base'

// 当前 schema 版本
const CURRENT_SCHEMA_VERSION = 1

// JSON 字段映射：表名 → 需要 JSON 序列化/反序列化的字段列表
const JSON_FIELDS: Record<SyncableTable, string[]> = {
  notes: ['images', 'tags'],
  todos: ['tags'],
  schedules: ['remind_at', 'tags'],
}

// Boolean 字段映射：表名 → 需要 boolean↔integer 转换的字段列表
const BOOLEAN_FIELDS: Record<SyncableTable, string[]> = {
  notes: ['pinned', '_deleted'],
  todos: ['done', '_deleted'],
  schedules: ['all_day', '_deleted'],
}

// 建表 DDL
const CREATE_TABLES_SQL = [
  // 快速记录镜像表
  `CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    images TEXT NOT NULL DEFAULT '[]',
    pinned INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    _deleted INTEGER NOT NULL DEFAULT 0,
    _version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  // 待办事项镜像表
  `CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    note TEXT,
    due_date TEXT,
    priority INTEGER NOT NULL DEFAULT 0,
    done INTEGER NOT NULL DEFAULT 0,
    done_at TEXT,
    schedule_id TEXT,
    parent_id TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    _deleted INTEGER NOT NULL DEFAULT 0,
    _version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  // 日程镜像表
  `CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    all_day INTEGER NOT NULL DEFAULT 0,
    remind_at TEXT NOT NULL DEFAULT '[]',
    repeat_rule TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    color TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    _deleted INTEGER NOT NULL DEFAULT 0,
    _version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  // 操作队列表
  `CREATE TABLE IF NOT EXISTS pending_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id TEXT NOT NULL,
    payload TEXT NOT NULL DEFAULT '{}',
    base_version INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )`,
  // 同步元数据表
  `CREATE TABLE IF NOT EXISTS sync_meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
]

// 将数据库行转换为应用模型（JSON.parse + boolean 转换）
function rowToModel<T>(table: SyncableTable, row: Record<string, unknown>): T {
  const result = { ...row }

  // JSON 字段反序列化
  for (const field of JSON_FIELDS[table]) {
    if (typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field] as string)
      } catch {
        result[field] = []
      }
    }
  }

  // boolean 字段转换：INTEGER(0/1) → boolean
  for (const field of BOOLEAN_FIELDS[table]) {
    result[field] = result[field] === 1 || result[field] === true
  }

  return result as T
}

// 将应用模型转换为数据库行（JSON.stringify + boolean 转换）
function modelToRow(table: SyncableTable, record: Record<string, unknown>): Record<string, unknown> {
  const result = { ...record }

  // JSON 字段序列化
  for (const field of JSON_FIELDS[table]) {
    if (Array.isArray(result[field])) {
      result[field] = JSON.stringify(result[field])
    }
  }

  // boolean 字段转换：boolean → INTEGER(0/1)
  for (const field of BOOLEAN_FIELDS[table]) {
    if (typeof result[field] === 'boolean') {
      result[field] = result[field] ? 1 : 0
    }
  }

  return result
}

// ─── LocalDB 实现 ───

export class LocalDB implements ILocalDB {
  constructor(private readonly executor: SQLiteExecutor) {}

  // 初始化数据库：创建表 + 执行 schema 迁移
  async initialize(): Promise<void> {
    // 创建所有表
    for (const sql of CREATE_TABLES_SQL) {
      await this.executor.executeAsync(sql)
    }

    // 检查并执行 schema 迁移
    const versionResult = this.executor.execute(
      'SELECT value FROM sync_meta WHERE key = ?',
      ['schema_version']
    )

    const currentVersion = versionResult.rows.length > 0
      ? parseInt(versionResult.rows[0].value as string, 10)
      : 0

    if (currentVersion < CURRENT_SCHEMA_VERSION) {
      // 执行增量迁移（当前版本 1，无需迁移）
      // 未来新版本在此添加迁移逻辑：
      // if (currentVersion < 2) { ... }

      // 更新 schema 版本号
      this.executor.execute(
        'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
        ['schema_version', String(CURRENT_SCHEMA_VERSION)]
      )
    }
  }

  // ─── 通用查询 ───

  getAll<T>(table: SyncableTable, excludeDeleted = true): T[] {
    const sql = excludeDeleted
      ? `SELECT * FROM ${table} WHERE _deleted = 0`
      : `SELECT * FROM ${table}`

    const result = this.executor.execute(sql)
    return result.rows.map(row => rowToModel<T>(table, row))
  }

  getById<T>(table: SyncableTable, id: string): T | null {
    const result = this.executor.execute(
      `SELECT * FROM ${table} WHERE id = ?`,
      [id]
    )

    if (result.rows.length === 0) return null
    return rowToModel<T>(table, result.rows[0])
  }

  // ─── 写入 ───

  upsert<T extends BaseModel>(table: SyncableTable, record: T): void {
    const row = modelToRow(table, record as unknown as Record<string, unknown>)
    const keys = Object.keys(row)
    const placeholders = keys.map(() => '?').join(', ')
    const values = keys.map(k => row[k] ?? null)

    this.executor.execute(
      `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    )
  }

  upsertBatch<T extends BaseModel>(table: SyncableTable, records: T[]): void {
    for (const record of records) {
      this.upsert(table, record)
    }
  }

  markDeleted(table: SyncableTable, id: string): void {
    const now = new Date().toISOString()
    this.executor.execute(
      `UPDATE ${table} SET _deleted = 1, updated_at = ? WHERE id = ?`,
      [now, id]
    )
  }

  // ─── 操作队列 ───

  enqueuePending(op: Omit<PendingOperation, 'id'>): void {
    this.executor.execute(
      `INSERT INTO pending_operations (table_name, operation, record_id, payload, base_version, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [op.table_name, op.operation, op.record_id, op.payload, op.base_version, op.created_at]
    )
  }

  dequeuePending(id: number): void {
    this.executor.execute(
      'DELETE FROM pending_operations WHERE id = ?',
      [id]
    )
  }

  getAllPending(): PendingOperation[] {
    const result = this.executor.execute(
      'SELECT * FROM pending_operations ORDER BY created_at ASC'
    )
    return result.rows as unknown as PendingOperation[]
  }

  getPendingCount(): number {
    const result = this.executor.execute(
      'SELECT COUNT(*) as count FROM pending_operations'
    )
    return (result.rows[0]?.count as number) ?? 0
  }

  getPendingForRecord(table: SyncableTable, recordId: string): PendingOperation[] {
    const result = this.executor.execute(
      'SELECT * FROM pending_operations WHERE table_name = ? AND record_id = ? ORDER BY created_at ASC',
      [table, recordId]
    )
    return result.rows as unknown as PendingOperation[]
  }

  // ─── 同步元数据 ───

  getLastSyncedAt(table: SyncableTable): string | null {
    const result = this.executor.execute(
      'SELECT value FROM sync_meta WHERE key = ?',
      [`${table}_last_synced_at`]
    )
    return result.rows.length > 0 ? (result.rows[0].value as string) : null
  }

  setLastSyncedAt(table: SyncableTable, timestamp: string): void {
    this.executor.execute(
      'INSERT OR REPLACE INTO sync_meta (key, value) VALUES (?, ?)',
      [`${table}_last_synced_at`, timestamp]
    )
  }
}
