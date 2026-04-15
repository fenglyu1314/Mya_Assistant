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

// 创建待办输入类型（仅 title 必填）
export interface CreateTodoInput {
  title: string
  note?: string
  due_date?: string
  priority?: TodoPriority
  parent_id?: string
  tags?: string[]
}

// 更新待办输入类型（所有字段可选）
export type UpdateTodoInput = Partial<Pick<Todo,
  'title' | 'note' | 'due_date' | 'priority' | 'done' | 'done_at' | 'sort_order' | 'tags'
>>

// 树形节点类型，用于 todoTree() 返回值
export interface TodoTreeNode {
  todo: Todo
  children: Todo[]
}
