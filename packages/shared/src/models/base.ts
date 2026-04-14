// 所有数据模型的基础接口
// 包含同步所需的通用字段
export interface BaseModel {
  id: string
  user_id: string
  _deleted: boolean
  _version: number
  created_at: string
  updated_at: string
}
