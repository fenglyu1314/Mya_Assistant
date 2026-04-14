// 查询过滤条件
export interface Filter {
  column: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like'
  value: unknown
}

// Realtime 变更事件类型
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

// Realtime 推送载荷
export interface RealtimePayload<T> {
  eventType: RealtimeEvent
  new: T | null
  old: Partial<T> | null
}

// 取消订阅函数
export type Unsubscribe = () => void
