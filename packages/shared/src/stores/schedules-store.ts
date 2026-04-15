import { create } from 'zustand'
import { SupabaseAdapter } from '../sync/supabase-adapter'
import { getSupabaseClient } from '../sync/supabase-client'
import type { Schedule, CreateScheduleInput, UpdateScheduleInput } from '../models/schedule'
import type { Unsubscribe, RealtimePayload } from '../sync/types'
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
}

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

// 日程 Store
export const useSchedulesStore = create<SchedulesState & SchedulesActions>()((set, get) => ({
  // 初始状态
  schedules: [],
  loading: false,
  selectedDate: getTodayString(),

  // 拉取指定月份的日程（参数格式：'2026-04'）
  fetchSchedules: async (month: string) => {
    set({ loading: true })
    try {
      const adapter = getSchedulesAdapter()
      // 计算月份范围：月初到下月初
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

      // 按 start_time 升序排列
      const sorted = [...data].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )

      set({ schedules: sorted, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  // 创建日程
  createSchedule: async (data: CreateScheduleInput) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) {
      throw new Error('未登录，无法创建日程')
    }

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

    set((state) => {
      const newSchedules = [...state.schedules, newSchedule].sort(
        (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      )
      return { schedules: newSchedules }
    })
  },

  // 部分更新日程字段
  updateSchedule: async (id: string, data: UpdateScheduleInput) => {
    const adapter = getSchedulesAdapter()
    const updated = await adapter.update(id, data)
    set((state) => ({
      schedules: state.schedules
        .map((s) => (s.id === id ? updated : s))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    }))
  },

  // 软删除日程
  deleteSchedule: async (id: string) => {
    const adapter = getSchedulesAdapter()
    await adapter.remove(id)
    set((state) => ({
      schedules: state.schedules.filter((s) => s.id !== id),
    }))
  },

  // 取消日程
  cancelSchedule: async (id: string) => {
    const adapter = getSchedulesAdapter()
    const updated = await adapter.update(id, { status: 'cancelled' })
    set((state) => ({
      schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
    }))
  },

  // 恢复日程
  restoreSchedule: async (id: string) => {
    const adapter = getSchedulesAdapter()
    const updated = await adapter.update(id, { status: 'active' })
    set((state) => ({
      schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
    }))
  },

  // 设置选中日期
  setSelectedDate: (date: string) => {
    set({ selectedDate: date })
  },

  // 订阅 schedules 表的 Realtime 事件
  subscribeRealtime: () => {
    const adapter = getSchedulesAdapter()
    return adapter.subscribe((payload: RealtimePayload<Schedule>) => {
      set((state) => {
        let newSchedules = [...state.schedules]

        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new && !payload.new._deleted) {
              // 避免重复添加（ID 去重）
              if (!newSchedules.find((s) => s.id === payload.new!.id)) {
                newSchedules.push(payload.new)
              }
            }
            break
          case 'UPDATE':
            if (payload.new) {
              if (payload.new._deleted) {
                // 软删除 → 从列表移除
                newSchedules = newSchedules.filter((s) => s.id !== payload.new!.id)
              } else {
                // 更新已有记录，若不存在则添加
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

        return {
          schedules: newSchedules.sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          ),
        }
      })
    })
  },

  // 计算属性：返回指定日期的日程列表（全天事件优先 + start_time 升序）
  schedulesForDate: (date: string) => {
    const { schedules } = get()
    const daySchedules = schedules.filter((s) => extractDate(s.start_time) === date)

    // 全天事件优先，然后按 start_time 升序
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
