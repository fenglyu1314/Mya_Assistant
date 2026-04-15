import type { ILocalDB, IPendingQueue, PendingOperation } from './types'

// 队列深度警告阈值
const QUEUE_WARN_THRESHOLD = 1000

// ─── PendingQueue 实现 ───

export class PendingQueue implements IPendingQueue {
  constructor(private readonly localDB: ILocalDB) {}

  // 入队：写入 pending_operations + 触发合并优化
  enqueue(op: Omit<PendingOperation, 'id'>): void {
    // 先尝试合并优化
    const merged = this.tryMerge(op)
    if (merged) return // 已合并到现有操作中，无需插入新记录

    // 无法合并，插入新操作
    this.localDB.enqueuePending(op)

    // 检查队列深度
    const count = this.getCount()
    if (count > QUEUE_WARN_THRESHOLD) {
      console.warn(`[PendingQueue] 队列深度超过 ${QUEUE_WARN_THRESHOLD}，当前 ${count} 条`)
    }
  }

  // 出队：删除已完成的操作
  dequeue(id: number): void {
    this.localDB.dequeuePending(id)
  }

  // 按 created_at 排序取出待推送的操作
  peek(limit?: number): PendingOperation[] {
    const all = this.localDB.getAllPending()
    return limit ? all.slice(0, limit) : all
  }

  // 返回队列长度
  getCount(): number {
    return this.localDB.getPendingCount()
  }

  // 执行队列合并优化（对所有记录进行一次全量合并扫描）
  optimize(): void {
    const pending = this.localDB.getAllPending()

    // 按 record_id 分组
    const groups = new Map<string, PendingOperation[]>()
    for (const op of pending) {
      const key = `${op.table_name}:${op.record_id}`
      const list = groups.get(key) ?? []
      list.push(op)
      groups.set(key, list)
    }

    // 对每组执行合并规则
    for (const [, ops] of groups) {
      if (ops.length < 2) continue
      this.optimizeGroup(ops)
    }
  }

  // ─── 内部方法 ───

  // 尝试将新操作合并到同一 record_id 的现有操作中
  // 返回 true 表示已合并，无需插入新记录
  private tryMerge(newOp: Omit<PendingOperation, 'id'>): boolean {
    const existing = this.localDB.getPendingForRecord(
      newOp.table_name,
      newOp.record_id
    )
    if (existing.length === 0) return false

    const lastOp = existing[existing.length - 1]

    // 规则 1：create + update → 合并 update 字段到 create 的 payload
    if (lastOp.operation === 'create' && newOp.operation === 'update') {
      const createPayload = JSON.parse(lastOp.payload) as Record<string, unknown>
      const updatePayload = JSON.parse(newOp.payload) as Record<string, unknown>
      const merged = { ...createPayload, ...updatePayload }
      // 删除旧的，插入合并后的
      this.localDB.dequeuePending(lastOp.id)
      this.localDB.enqueuePending({
        ...lastOp,
        payload: JSON.stringify(merged),
        created_at: lastOp.created_at, // 保持原始时间
      })
      return true
    }

    // 规则 2：create + delete → 两条都移除
    if (lastOp.operation === 'create' && newOp.operation === 'delete') {
      // 删除所有该 record 的操作
      for (const op of existing) {
        this.localDB.dequeuePending(op.id)
      }
      return true
    }

    // 规则 3：update + update → 合并字段（新值覆盖旧值）
    if (lastOp.operation === 'update' && newOp.operation === 'update') {
      const oldPayload = JSON.parse(lastOp.payload) as Record<string, unknown>
      const newPayload = JSON.parse(newOp.payload) as Record<string, unknown>
      const merged = { ...oldPayload, ...newPayload }
      // 删除旧的，插入合并后的
      this.localDB.dequeuePending(lastOp.id)
      this.localDB.enqueuePending({
        ...lastOp,
        payload: JSON.stringify(merged),
        base_version: newOp.base_version, // 使用最新的 base_version
        created_at: lastOp.created_at,
      })
      return true
    }

    // 规则 4：update + delete → 移除 update，保留 delete
    if (lastOp.operation === 'update' && newOp.operation === 'delete') {
      this.localDB.dequeuePending(lastOp.id)
      // 不返回 true，让新的 delete 操作正常入队
      return false
    }

    return false
  }

  // 对同一 record_id 的一组操作执行全量合并优化
  private optimizeGroup(ops: PendingOperation[]): void {
    if (ops.length < 2) return

    // 从头到尾扫描，逐步合并
    let i = 0
    while (i < ops.length - 1) {
      const current = ops[i]
      const next = ops[i + 1]

      let merged = false

      // create + update → 合并
      if (current.operation === 'create' && next.operation === 'update') {
        const createPayload = JSON.parse(current.payload) as Record<string, unknown>
        const updatePayload = JSON.parse(next.payload) as Record<string, unknown>
        this.localDB.dequeuePending(current.id)
        this.localDB.dequeuePending(next.id)
        this.localDB.enqueuePending({
          ...current,
          payload: JSON.stringify({ ...createPayload, ...updatePayload }),
        })
        merged = true
      }

      // create + delete → 两条都移除
      if (current.operation === 'create' && next.operation === 'delete') {
        this.localDB.dequeuePending(current.id)
        this.localDB.dequeuePending(next.id)
        merged = true
      }

      // update + update → 合并
      if (current.operation === 'update' && next.operation === 'update') {
        const oldPayload = JSON.parse(current.payload) as Record<string, unknown>
        const newPayload = JSON.parse(next.payload) as Record<string, unknown>
        this.localDB.dequeuePending(current.id)
        this.localDB.dequeuePending(next.id)
        this.localDB.enqueuePending({
          ...current,
          payload: JSON.stringify({ ...oldPayload, ...newPayload }),
          base_version: next.base_version,
        })
        merged = true
      }

      // update + delete → 移除 update
      if (current.operation === 'update' && next.operation === 'delete') {
        this.localDB.dequeuePending(current.id)
        merged = true
      }

      if (merged) {
        // 合并后重新获取该记录的 pending 操作，重新开始扫描
        const remaining = this.localDB.getPendingForRecord(
          ops[0].table_name,
          ops[0].record_id
        )
        ops.length = 0
        ops.push(...remaining)
        i = 0
      } else {
        i++
      }
    }
  }
}
