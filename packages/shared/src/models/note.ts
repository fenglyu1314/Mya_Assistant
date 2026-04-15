import type { BaseModel } from './base'

// 快速记录分类
export type NoteType = 'idea' | 'memo' | 'log'

// 快速记录数据模型
export interface Note extends BaseModel {
  content: string
  type: NoteType
  images: string[]
  pinned: boolean
  tags: string[]
}

// 更新快速记录输入类型（所有字段可选）
export type UpdateNoteInput = Partial<Pick<Note,
  'content' | 'type' | 'images' | 'pinned' | 'tags'
>>
