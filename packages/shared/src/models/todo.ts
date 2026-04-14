import type { BaseModel } from './base'

// 待办优先级：0=低 1=中 2=高
export type TodoPriority = 0 | 1 | 2

// 待办事项数据模型
export interface Todo extends BaseModel {
  title: string
  note: string | null
  due_date: string | null
  priority: TodoPriority
  done: boolean
  done_at: string | null
  schedule_id: string | null
  parent_id: string | null
  sort_order: number
  tags: string[]
}
