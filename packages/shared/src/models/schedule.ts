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

// 创建日程输入类型
export interface CreateScheduleInput {
  title: string
  start_time: string
  end_time: string
  description?: string
  all_day?: boolean
  remind_at?: string[]
  color?: string
  tags?: string[]
}

// 更新日程输入类型
export type UpdateScheduleInput = Partial<
  Pick<
    Schedule,
    | 'title'
    | 'description'
    | 'start_time'
    | 'end_time'
    | 'all_day'
    | 'remind_at'
    | 'repeat_rule'
    | 'status'
    | 'color'
    | 'tags'
  >
>
