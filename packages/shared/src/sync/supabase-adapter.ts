import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import type { BaseModel } from '../models/base'
import type { SyncAdapter } from './sync-adapter'
import type { Filter, RealtimePayload, Unsubscribe } from './types'

// Supabase 适配器 — SyncAdapter 的具体实现
export class SupabaseAdapter<T extends BaseModel> implements SyncAdapter<T> {
  private channel: RealtimeChannel | null = null

  constructor(
    private readonly client: SupabaseClient,
    private readonly table: string
  ) {}

  // 获取所有记录（默认排除已软删除的记录）
  async getAll(filters?: Filter[]): Promise<T[]> {
    let query = this.client
      .from(this.table)
      .select('*')
      .eq('_deleted', false)

    if (filters) {
      for (const filter of filters) {
        query = query.filter(filter.column, filter.operator, filter.value)
      }
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`获取 ${this.table} 数据失败：${error.message}`)
    }

    return (data ?? []) as T[]
  }

  // 根据 ID 获取单条记录
  async getById(id: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // 未找到记录
        return null
      }
      throw new Error(`获取 ${this.table}/${id} 失败：${error.message}`)
    }

    return data as T
  }

  // 创建记录
  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at' | '_version'>): Promise<T> {
    const { data: created, error } = await this.client
      .from(this.table)
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`创建 ${this.table} 记录失败：${error.message}`)
    }

    return created as T
  }

  // 更新记录
  async update(id: string, data: Partial<Omit<T, 'id' | 'user_id' | 'created_at'>>): Promise<T> {
    const { data: updated, error } = await this.client
      .from(this.table)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`更新 ${this.table}/${id} 失败：${error.message}`)
    }

    return updated as T
  }

  // 软删除记录（设置 _deleted: true，数据保留在数据库中）
  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.table)
      .update({ _deleted: true })
      .eq('id', id)

    if (error) {
      throw new Error(`删除 ${this.table}/${id} 失败：${error.message}`)
    }
  }

  // 订阅实时变更（基于 Supabase Realtime Postgres Changes）
  // onStatus 回调可选，用于监听频道连接状态
  subscribe(
    callback: (payload: RealtimePayload<T>) => void,
    onStatus?: (status: string, err?: Error) => void
  ): Unsubscribe {
    const channelName = `${this.table}-changes-${Date.now()}`

    this.channel = this.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.table,
        },
        (payload) => {
          callback({
            eventType: payload.eventType as RealtimePayload<T>['eventType'],
            new: (payload.new as T) ?? null,
            old: (payload.old as Partial<T>) ?? null,
          })
        }
      )
      .subscribe((status: string, err?: Error) => {
        // 通知调用者连接状态：SUBSCRIBED / TIMED_OUT / CLOSED / CHANNEL_ERROR
        onStatus?.(status, err)
      })

    // 返回取消订阅函数
    return () => {
      if (this.channel) {
        this.client.removeChannel(this.channel)
        this.channel = null
      }
    }
  }
}
