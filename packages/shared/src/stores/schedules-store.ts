import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { SupabaseAdapter } from '../sync/supabase-adapter'
import { getSupabaseClient } from '../sync/supabase-client'
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from '../models/schedule'
import type { Unsubscribe, RealtimePayload } from '../sync/types'
import type { ILocalDB, IPendingQueue } from '../offline/types'
import { useAuthStore } from './auth-store'

// 日程状态
interface SchedulesState {
  schedules: Schedule[]
  loading: boolean
  selectedDate: string
}

// 日程操作
interface SchedulesActions {
  fetchSchedules: (month: string) => Promise<void>
  createSchedule: (data: CreateScheduleInput) => Promise<void>
  updateSchedule: (id: string, data: UpdateScheduleInput) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  cancelSchedule: (id: string) => Promise<void>
  restoreSchedule: (id: string) => Promise<void>
  setSelectedDate: (date: string) => void
  subscribeRealtime: () => Unsubscribe
  schedulesForDate: (date: string) => Schedule[]
  markedDates: () => Record<string, { marked: true; dotColor: string }>
  // 离线支持
  initializeFromLocal: () => void
  setOfflineModules: (localDB: ILocalDB, pendingQueue: IPendingQueue) => void
}

// 离线模块引用
let _localDB: ILocalDB | null = null
let _pendingQueue: IPendingQueue | null = null

// 获取 schedules 表的 SupabaseAdapter
function getSchedulesAdapter(): SupabaseAdapter<Schedule> {
  return new SupabaseAdapter<Schedule>(getSupabaseClient(), 'schedules')
}

// 获取今天日期字符串（YYYY-MM-DD）
function getTodayString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 从日期时间字符串中提取日期部分（YYYY-MM-DD）
function extractDate(isoString: string): string {
  return isoString.slice(0, 10)
}

// 按 start_time 升序排序
function sortSchedules(schedules: Schedule[]): Schedule[] {
  return [...schedules].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  )
}

// 日程 Store
export const useSchedulesStore = create<SchedulesState & SchedulesActions>()((set, get) => ({
  // 初始状态
  schedules: [],
  loading: false,
  selectedDate: getTodayString(),

  // 注入离线模块
  setOfflineModules: (localDB: ILocalDB, pendingQueue: IPendingQueue) => {
    _localDB = localDB
    _pendingQueue = pendingQueue
  },

  // 从 SQLite 初始化 Store 数据
  initializeFromLocal: () => {
    if (!_localDB) return
    const schedules = _localDB.getAll<Schedule>('schedules', true)
    set({ schedules: sortSchedules(schedules), loading: false })
  },

  // 拉取指定月份的日程（离线优先）
  fetchSchedules: async (month: string) => {
    set({ loading: true })
    try {
      if (_localDB) {
        // 离线优先：从 SQLite 读取全部日程，在内存中按月份筛选
        const allSchedules = _localDB.getAll<Schedule>('schedules', true)
        const startOfMonth = `${month}-01`
        const [yearStr, monthStr] = month.split('-')
        const year = parseInt(yearStr, 10)
        const mon = parseInt(monthStr, 10)
        const nextMonth = mon === 12 ? 1 : mon + 1
        const nextYear = mon === 12 ? year + 1 : year
        const startOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

        const filtered = allSchedules.filter((s) => {
          const date = extractDate(s.start_time)
          return date >= startOfMonth && date < startOfNextMonth
        })

        set({ schedules: sortSchedules(filtered), loading: false })
      } else {
        const adapter = getSchedulesAdapter()
        const startOfMonth = `${month}-01T00:00:00Z`
        const [yearStr, monthStr] = month.split('-')
        const year = parseInt(yearStr, 10)
        const mon = parseInt(monthStr, 10)
        const nextMonth = mon === 12 ? 1 : mon + 1
        const nextYear = mon === 12 ? year + 1 : year
        const startOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00Z`

        const data = await adapter.getAll([
          { column: 'start_time', operator: 'gte', value: startOfMonth },
          { column: 'start_time', operator: 'lt', value: startOfNextMonth },
        ])

        set({ schedules: sortSchedules(data), loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  // 创建日程（离线优先）
  createSchedule: async (data: CreateScheduleInput) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) {
      throw new Error('未登录，无法创建日程')
    }

    if (_localDB && _pendingQueue) {
      const now = new Date().toISOString()
      const newSchedule: Schedule = {
        id: uuidv4(),
        user_id: userId,
        title: data.title,
        description: data.description ?? null,
        start_time: data.start_time,
        end_time: data.end_time,
        all_day: data.all_day ?? false,
        remind_at: data.remind_at ?? [],
        repeat_rule: null,
        status: 'active',
        color: data.color ?? null,
        tags: data.tags ?? [],
        _deleted: false,
        _version: 1,
        created_at: now,
        updated_at: now,
      }

      _localDB.upsert('schedules', newSchedule)
      _pendingQueue.enqueue({
        table_name: 'schedules',
        operation: 'create',
        record_id: newSchedule.id,
        payload: JSON.stringify({
          title: newSchedule.title,
          description: newSchedule.description,
          start_time: newSchedule.start_time,
          end_time: newSchedule.end_time,
          all_day: newSchedule.all_day,
          remind_at: newSchedule.remind_at,
          repeat_rule: null,
          status: 'active',
          color: newSchedule.color,
          tags: newSchedule.tags,
          _deleted: false,
          user_id: userId,
        }),
        base_version: 1,
        created_at: now,
      })

      set((state) => ({
        schedules: sortSchedules([...state.schedules, newSchedule]),
      }))
    } else {
      const adapter = getSchedulesAdapter()
      const newSchedule = await adapter.create({
        title: data.title,
        description: data.description ?? null,
        start_time: data.start_time,
        end_time: data.end_time,
        all_day: data.all_day ?? false,
        remind_at: data.remind_at ?? [],
        repeat_rule: null,
        status: 'active',
        color: data.color ?? null,
        tags: data.tags ?? [],
        _deleted: false,
        user_id: userId,
      })

      set((state) => ({
        schedules: sortSchedules([...state.schedules, newSchedule]),
      }))
    }
  },

  // 部分更新日程字段（离线优先）
  updateSchedule: async (id: string, data: UpdateScheduleInput) => {
    if (_localDB && _pendingQueue) {
      const schedule = _localDB.getById<Schedule>('schedules', id)
      if (!schedule) return

      const now = new Date().toISOString()
      const updated: Schedule = { ...schedule, ...data, updated_at: now }
      _localDB.upsert('schedules', updated)
      _pendingQueue.enqueue({
        table_name: 'schedules',
        operation: 'update',
        record_id: id,
        payload: JSON.stringify(data),
        base_version: schedule._version,
        created_at: now,
      })

      set((state) => ({
        schedules: sortSchedules(
          state.schedules.map((s) => (s.id === id ? updated : s))
        ),
      }))
    } else {
      const adapter = getSchedulesAdapter()
      const updated = await adapter.update(id, data)
      set((state) => ({
        schedules: sortSchedules(
          state.schedules.map((s) => (s.id === id ? updated : s))
        ),
      }))
    }
  },

  // 软删除日程（离线优先）
  deleteSchedule: async (id: string) => {
    if (_localDB && _pendingQueue) {
      const schedule = _localDB.getById<Schedule>('schedules', id)
      _localDB.markDeleted('schedules', id)
      _pendingQueue.enqueue({
        table_name: 'schedules',
        operation: 'delete',
        record_id: id,
        payload: '{}',
        base_version: schedule?._version ?? 1,
        created_at: new Date().toISOString(),
      })
      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
      }))
    } else {
      const adapter = getSchedulesAdapter()
      await adapter.remove(id)
      set((state) => ({
        schedules: state.schedules.filter((s) => s.id !== id),
      }))
    }
  },

  // 取消日程（离线优先）
  cancelSchedule: async (id: string) => {
    if (_localDB && _pendingQueue) {
      const schedule = _localDB.getById<Schedule>('schedules', id)
      if (!schedule) return

      const now = new Date().toISOString()
      const updated: Schedule = { ...schedule, status: 'cancelled', updated_at: now }
      _localDB.upsert('schedules', updated)
      _pendingQueue.enqueue({
        table_name: 'schedules',
        operation: 'update',
        record_id: id,
        payload: JSON.stringify({ status: 'cancelled' }),
        base_version: schedule._version,
        created_at: now,
      })
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
      }))
    } else {
      const adapter = getSchedulesAdapter()
      const updated = await adapter.update(id, { status: 'cancelled' })
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
      }))
    }
  },

  // 恢复日程（离线优先）
  restoreSchedule: async (id: string) => {
    if (_localDB && _pendingQueue) {
      const schedule = _localDB.getById<Schedule>('schedules', id)
      if (!schedule) return

      const now = new Date().toISOString()
      const updated: Schedule = { ...schedule, status: 'active', updated_at: now }
      _localDB.upsert('schedules', updated)
      _pendingQueue.enqueue({
        table_name: 'schedules',
        operation: 'update',
        record_id: id,
        payload: JSON.stringify({ status: 'active' }),
        base_version: schedule._version,
        created_at: now,
      })
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
      }))
    } else {
      const adapter = getSchedulesAdapter()
      const updated = await adapter.update(id, { status: 'active' })
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
      }))
    }
  },

  // 设置选中日期
  setSelectedDate: (date: string) => {
    set({ selectedDate: date })
  },

  // 订阅 schedules 表的 Realtime 事件（接收远端事件后同时更新 SQLite）
  subscribeRealtime: () => {
    const adapter = getSchedulesAdapter()
    return adapter.subscribe((payload: RealtimePayload<Schedule>) => {
      set((state) => {
        let newSchedules = [...state.schedules]

        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new && !payload.new._deleted) {
              _localDB?.upsert('schedules', payload.new)
              if (!newSchedules.find((s) => s.id === payload.new!.id)) {
                newSchedules.push(payload.new)
              }
            }
            break
          case 'UPDATE':
            if (payload.new) {
              _localDB?.upsert('schedules', payload.new)
              if (payload.new._deleted) {
                newSchedules = newSchedules.filter((s) => s.id !== payload.new!.id)
              } else {
                const idx = newSchedules.findIndex((s) => s.id === payload.new!.id)
                if (idx >= 0) {
                  newSchedules[idx] = payload.new
                } else {
                  newSchedules.push(payload.new)
                }
              }
            }
            break
          case 'DELETE':
            if (payload.old?.id) {
              newSchedules = newSchedules.filter((s) => s.id !== payload.old!.id)
            }
            break
        }

        return { schedules: sortSchedules(newSchedules) }
      })
    })
  },

  // 计算属性：返回指定日期的日程列表（全天事件优先 + start_time 升序）
  schedulesForDate: (date: string) => {
    const { schedules } = get()
    const daySchedules = schedules.filter((s) => extractDate(s.start_time) === date)

    return daySchedules.sort((a, b) => {
      if (a.all_day && !b.all_day) return -1
      if (!a.all_day && b.all_day) return 1
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })
  },

  // 计算属性：返回有日程日期的标记对象，供月历组件使用
  markedDates: () => {
    const { schedules } = get()
    const marks: Record<string, { marked: true; dotColor: string }> = {}

    for (const schedule of schedules) {
      const date = extractDate(schedule.start_time)
      if (!marks[date]) {
        marks[date] = {
          marked: true,
          dotColor: schedule.color ?? '#4A90D9',
        }
      }
    }

    return marks
  },
}))
