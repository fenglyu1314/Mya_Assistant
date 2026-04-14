import type { BaseModel } from './base'

// 日程状态
export type ScheduleStatus = 'active' | 'cancelled'

// 日程数据模型
export interface Schedule extends BaseModel {
  title: string
  description: string | null
  start_time: string
  end_time: string
  all_day: boolean
  remind_at: string[]
  repeat_rule: string | null
  status: ScheduleStatus
  color: string | null
  tags: string[]
}
