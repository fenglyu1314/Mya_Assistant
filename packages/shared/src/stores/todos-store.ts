import { create } from 'zustand'
import { SupabaseAdapter } from '../sync/supabase-adapter'
import { getSupabaseClient } from '../sync/supabase-client'
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoTreeNode } from '../models/todo'
import type { Unsubscribe, RealtimePayload } from '../sync/types'
import { useAuthStore } from './auth-store'

// 待办状态
interface TodosState {
  todos: Todo[]
  loading: boolean
  expandedParents: Set<string>
  showCompleted: boolean
}

// 待办操作
interface TodosActions {
  fetchTodos: () => Promise<void>
  createTodo: (data: CreateTodoInput) => Promise<void>
  updateTodo: (id: string, data: UpdateTodoInput) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  toggleDone: (id: string) => Promise<void>
  reorder: (todoId: string, newSortOrder: number) => Promise<void>
  toggleExpandParent: (parentId: string) => void
  setShowCompleted: (show: boolean) => void
  subscribeRealtime: () => Unsubscribe
  todoTree: () => TodoTreeNode[]
  completedTodos: () => TodoTreeNode[]
}

// 获取 todos 表的 SupabaseAdapter
function getTodosAdapter(): SupabaseAdapter<Todo> {
  return new SupabaseAdapter<Todo>(getSupabaseClient(), 'todos')
}

// 待办事项 Store
export const useTodosStore = create<TodosState & TodosActions>()((set, get) => ({
  // 初始状态
  todos: [],
  loading: false,
  expandedParents: new Set<string>(),
  showCompleted: false,

  // 拉取所有未删除待办，按 sort_order 升序
  fetchTodos: async () => {
    set({ loading: true })
    try {
      const adapter = getTodosAdapter()
      const data = await adapter.getAll()
      // 按 sort_order 升序排列
      const sorted = [...data].sort((a, b) => a.sort_order - b.sort_order)

      // 自动展开所有有子任务的父节点
      const parentIds = new Set<string>()
      for (const todo of sorted) {
        if (todo.parent_id) {
          parentIds.add(todo.parent_id)
        }
      }

      set({ todos: sorted, loading: false, expandedParents: parentIds })
    } catch {
      set({ loading: false })
    }
  },

  // 创建待办，sort_order 自动设为当前最大值 +1
  createTodo: async (data: CreateTodoInput) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) {
      throw new Error('未登录，无法创建待办')
    }

    const { todos } = get()
    const maxSortOrder = todos.length > 0
      ? Math.max(...todos.map((t) => t.sort_order))
      : 0

    const adapter = getTodosAdapter()
    const newTodo = await adapter.create({
      title: data.title,
      note: data.note ?? null,
      due_date: data.due_date ?? null,
      priority: data.priority ?? 0,
      done: false,
      done_at: null,
      schedule_id: null,
      parent_id: data.parent_id ?? null,
      sort_order: maxSortOrder + 1,
      tags: data.tags ?? [],
      _deleted: false,
      user_id: userId,
    })

    set((state) => {
      const newTodos = [...state.todos, newTodo].sort((a, b) => a.sort_order - b.sort_order)

      // 如果创建的是子任务，自动展开父节点以便用户立即看到
      if (newTodo.parent_id) {
        const newExpanded = new Set(state.expandedParents)
        newExpanded.add(newTodo.parent_id)
        return { todos: newTodos, expandedParents: newExpanded }
      }

      return { todos: newTodos }
    })
  },

  // 部分更新待办字段
  updateTodo: async (id: string, data: UpdateTodoInput) => {
    const adapter = getTodosAdapter()
    const updated = await adapter.update(id, data)
    set((state) => ({
      todos: state.todos
        .map((t) => (t.id === id ? updated : t))
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
  },

  // 软删除待办（父任务同时软删除子任务）
  deleteTodo: async (id: string) => {
    const { todos } = get()
    const adapter = getTodosAdapter()

    // 软删除目标待办
    await adapter.remove(id)

    // 查找并软删除所有子任务
    const children = todos.filter((t) => t.parent_id === id)
    for (const child of children) {
      await adapter.remove(child.id)
    }

    // 从本地列表移除目标及其子任务
    set((state) => ({
      todos: state.todos.filter((t) => t.id !== id && t.parent_id !== id),
    }))
  },

  // 切换完成状态
  toggleDone: async (id: string) => {
    const { todos } = get()
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    const adapter = getTodosAdapter()
    const newDone = !todo.done
    const updated = await adapter.update(id, {
      done: newDone,
      done_at: newDone ? new Date().toISOString() : null,
    })

    set((state) => ({
      todos: state.todos.map((t) => (t.id === id ? updated : t)),
    }))
  },

  // 更新排序
  reorder: async (todoId: string, newSortOrder: number) => {
    const adapter = getTodosAdapter()
    const updated = await adapter.update(todoId, { sort_order: newSortOrder })
    set((state) => ({
      todos: state.todos
        .map((t) => (t.id === todoId ? updated : t))
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
  },

  // 切换子任务展开/折叠
  toggleExpandParent: (parentId: string) => {
    set((state) => {
      const newSet = new Set(state.expandedParents)
      if (newSet.has(parentId)) {
        newSet.delete(parentId)
      } else {
        newSet.add(parentId)
      }
      return { expandedParents: newSet }
    })
  },

  // 切换已完成区域显示
  setShowCompleted: (show: boolean) => {
    set({ showCompleted: show })
  },

  // 订阅 todos 表的 Realtime 事件
  subscribeRealtime: () => {
    const adapter = getTodosAdapter()
    return adapter.subscribe((payload: RealtimePayload<Todo>) => {
      set((state) => {
        let newTodos = [...state.todos]

        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new && !payload.new._deleted) {
              // 避免重复添加（ID 去重）
              if (!newTodos.find((t) => t.id === payload.new!.id)) {
                newTodos.push(payload.new)
              }
            }
            break
          case 'UPDATE':
            if (payload.new) {
              if (payload.new._deleted) {
                // 软删除 → 从列表移除
                newTodos = newTodos.filter((t) => t.id !== payload.new!.id)
              } else {
                // 更新已有记录，若不存在则添加
                const idx = newTodos.findIndex((t) => t.id === payload.new!.id)
                if (idx >= 0) {
                  newTodos[idx] = payload.new
                } else {
                  newTodos.push(payload.new)
                }
              }
            }
            break
          case 'DELETE':
            if (payload.old?.id) {
              newTodos = newTodos.filter((t) => t.id !== payload.old!.id)
            }
            break
        }

        return { todos: newTodos.sort((a, b) => a.sort_order - b.sort_order) }
      })
    })
  },

  // 计算属性：将平铺待办组装为树形结构（仅未完成的顶级待办 + 子任务）
  todoTree: () => {
    const { todos } = get()
    // 筛选未完成的顶级待办（无 parent_id），按 sort_order 排序
    const topLevel = todos
      .filter((t) => !t.done && !t.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order)

    return topLevel.map((parent) => ({
      todo: parent,
      children: todos
        .filter((t) => t.parent_id === parent.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
  },

  // 计算属性：返回已完成的顶级待办树形列表（含子任务）
  completedTodos: () => {
    const { todos } = get()
    const topLevel = todos
      .filter((t) => t.done && !t.parent_id)
      .sort((a, b) => {
        // 按完成时间降序
        const aTime = a.done_at ? new Date(a.done_at).getTime() : 0
        const bTime = b.done_at ? new Date(b.done_at).getTime() : 0
        return bTime - aTime
      })

    return topLevel.map((parent) => ({
      todo: parent,
      children: todos
        .filter((t) => t.parent_id === parent.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
  },
}))
