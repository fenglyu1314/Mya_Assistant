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
