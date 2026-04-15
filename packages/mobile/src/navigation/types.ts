// 导航参数类型定义

// 认证栈（未登录时显示）
export type AuthStackParamList = {
  Login: undefined
  Register: undefined
}

// 主 Tab 导航（已登录时显示）
export type MainTabParamList = {
  Notes: undefined
  Todos: undefined
  Schedule: undefined
  Settings: undefined
}

// 快速记录相关的嵌套导航
export type NotesStackParamList = {
  NotesList: undefined
  CreateNote: { noteId?: string } | undefined
}

// 待办相关的嵌套导航
export type TodosStackParamList = {
  TodosList: undefined
  TodoForm: { todoId?: string } | undefined
}

// 日程相关的嵌套导航
export type ScheduleStackParamList = {
  SchedulesList: undefined
  ScheduleForm: { scheduleId?: string; selectedDate?: string } | undefined
}
