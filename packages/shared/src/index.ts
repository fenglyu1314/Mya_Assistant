// Mya Assistant 共享层
// 包含平台无关的数据模型、同步引擎、认证和状态管理

// 数据模型
export type {
  BaseModel,
  Schedule,
  ScheduleStatus,
  CreateScheduleInput,
  UpdateScheduleInput,
  Todo,
  TodoPriority,
  CreateTodoInput,
  UpdateTodoInput,
  TodoTreeNode,
  Note,
  NoteType,
} from './models'

// 同步层
export type {
  SyncAdapter,
  Filter,
  RealtimePayload,
  RealtimeEvent,
  Unsubscribe,
} from './sync'

export {
  SupabaseAdapter,
  createSupabaseClient,
  getSupabaseClient,
  resetSupabaseClient,
} from './sync'

// 认证模块
export { AuthService } from './auth'
export type { AuthResult, AuthUser, AuthError } from './auth'
export { toAuthUser } from './auth'

// 状态管理
export { useAuthStore, useNotesStore, useTodosStore, useSchedulesStore } from './stores'
