import type { BaseModel } from '../models/base'
import type { Filter, RealtimePayload, Unsubscribe } from './types'

// 同步适配器抽象接口
// 隔离后端具体实现，客户端代码仅依赖此接口
export interface SyncAdapter<T extends BaseModel> {
  // 获取所有记录（支持过滤）
  getAll(filters?: Filter[]): Promise<T[]>

  // 根据 ID 获取单条记录
  getById(id: string): Promise<T | null>

  // 创建记录
  create(data: Omit<T, 'id' | 'created_at' | 'updated_at' | '_version'>): Promise<T>

  // 更新记录
  update(id: string, data: Partial<Omit<T, 'id' | 'user_id' | 'created_at'>>): Promise<T>

  // 软删除记录（设置 _deleted: true）
  remove(id: string): Promise<void>

  // 订阅实时变更（onStatus 可选，用于监听连接状态）
  subscribe(
    callback: (payload: RealtimePayload<T>) => void,
    onStatus?: (status: string, err?: Error) => void
  ): Unsubscribe

  // 增量拉取：获取指定时间之后更新的所有记录（包含已删除记录）
  // 可选实现，离线同步模块使用
  fetchUpdatedSince?(since: string): Promise<T[]>
}
