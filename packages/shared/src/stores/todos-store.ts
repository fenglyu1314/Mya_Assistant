import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { SupabaseAdapter } from '../sync/supabase-adapter'
import { getSupabaseClient } from '../sync/supabase-client'
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoTreeNode } from '../models/todo'
import type { Unsubscribe, RealtimePayload } from '../sync/types'
import type { ILocalDB, IPendingQueue } from '../offline/types'
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
  // 离线支持
  initializeFromLocal: () => void
  setOfflineModules: (localDB: ILocalDB, pendingQueue: IPendingQueue) => void
}

// 离线模块引用
let _localDB: ILocalDB | null = null
let _pendingQueue: IPendingQueue | null = null

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

  // 注入离线模块
  setOfflineModules: (localDB: ILocalDB, pendingQueue: IPendingQueue) => {
    _localDB = localDB
    _pendingQueue = pendingQueue
  },

  // 从 SQLite 初始化 Store 数据
  initializeFromLocal: () => {
    if (!_localDB) return
    const todos = _localDB.getAll<Todo>('todos', true)
    const sorted = [...todos].sort((a, b) => a.sort_order - b.sort_order)

    // 自动展开所有有子任务的父节点
    const parentIds = new Set<string>()
    for (const todo of sorted) {
      if (todo.parent_id) {
        parentIds.add(todo.parent_id)
      }
    }

    set({ todos: sorted, loading: false, expandedParents: parentIds })
  },

  // 拉取所有未删除待办（离线优先）
  fetchTodos: async () => {
    set({ loading: true })
    try {
      if (_localDB) {
        const data = _localDB.getAll<Todo>('todos', true)
        const sorted = [...data].sort((a, b) => a.sort_order - b.sort_order)

        const parentIds = new Set<string>()
        for (const todo of sorted) {
          if (todo.parent_id) {
            parentIds.add(todo.parent_id)
          }
        }

        set({ todos: sorted, loading: false, expandedParents: parentIds })
      } else {
        const adapter = getTodosAdapter()
        const data = await adapter.getAll()
        const sorted = [...data].sort((a, b) => a.sort_order - b.sort_order)

        const parentIds = new Set<string>()
        for (const todo of sorted) {
          if (todo.parent_id) {
            parentIds.add(todo.parent_id)
          }
        }

        set({ todos: sorted, loading: false, expandedParents: parentIds })
      }
    } catch {
      set({ loading: false })
    }
  },

  // 创建待办（离线优先）
  createTodo: async (data: CreateTodoInput) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) {
      throw new Error('未登录，无法创建待办')
    }

    const { todos } = get()
    const maxSortOrder = todos.length > 0
      ? Math.max(...todos.map((t) => t.sort_order))
      : 0

    if (_localDB && _pendingQueue) {
      const now = new Date().toISOString()
      const newTodo: Todo = {
        id: uuidv4(),
        user_id: userId,
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
        _version: 1,
        created_at: now,
        updated_at: now,
      }

      _localDB.upsert('todos', newTodo)
      _pendingQueue.enqueue({
        table_name: 'todos',
        operation: 'create',
        record_id: newTodo.id,
        payload: JSON.stringify({
          title: newTodo.title,
          note: newTodo.note,
          due_date: newTodo.due_date,
          priority: newTodo.priority,
          done: false,
          done_at: null,
          schedule_id: null,
          parent_id: newTodo.parent_id,
          sort_order: newTodo.sort_order,
          tags: newTodo.tags,
          _deleted: false,
          user_id: userId,
        }),
        base_version: 1,
        created_at: now,
      })

      set((state) => {
        const newTodos = [...state.todos, newTodo].sort((a, b) => a.sort_order - b.sort_order)
        if (newTodo.parent_id) {
          const newExpanded = new Set(state.expandedParents)
          newExpanded.add(newTodo.parent_id)
          return { todos: newTodos, expandedParents: newExpanded }
        }
        return { todos: newTodos }
      })
    } else {
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
        if (newTodo.parent_id) {
          const newExpanded = new Set(state.expandedParents)
          newExpanded.add(newTodo.parent_id)
          return { todos: newTodos, expandedParents: newExpanded }
        }
        return { todos: newTodos }
      })
    }
  },

  // 部分更新待办字段（离线优先）
  updateTodo: async (id: string, data: UpdateTodoInput) => {
    if (_localDB && _pendingQueue) {
      const todo = _localDB.getById<Todo>('todos', id)
      if (!todo) return

      const now = new Date().toISOString()
      const updated: Todo = { ...todo, ...data, updated_at: now }
      _localDB.upsert('todos', updated)
      _pendingQueue.enqueue({
        table_name: 'todos',
        operation: 'update',
        record_id: id,
        payload: JSON.stringify(data),
        base_version: todo._version,
        created_at: now,
      })

      set((state) => ({
        todos: state.todos
          .map((t) => (t.id === id ? updated : t))
          .sort((a, b) => a.sort_order - b.sort_order),
      }))
    } else {
      const adapter = getTodosAdapter()
      const updated = await adapter.update(id, data)
      set((state) => ({
        todos: state.todos
          .map((t) => (t.id === id ? updated : t))
          .sort((a, b) => a.sort_order - b.sort_order),
      }))
    }
  },

  // 软删除待办（离线优先，含子任务级联）
  deleteTodo: async (id: string) => {
    const { todos } = get()

    if (_localDB && _pendingQueue) {
      const todo = _localDB.getById<Todo>('todos', id)
      const now = new Date().toISOString()

      // 软删除目标待办
      _localDB.markDeleted('todos', id)
      _pendingQueue.enqueue({
        table_name: 'todos',
        operation: 'delete',
        record_id: id,
        payload: '{}',
        base_version: todo?._version ?? 1,
        created_at: now,
      })

      // 级联软删除子任务
      const children = todos.filter((t) => t.parent_id === id)
      for (const child of children) {
        _localDB.markDeleted('todos', child.id)
        _pendingQueue.enqueue({
          table_name: 'todos',
          operation: 'delete',
          record_id: child.id,
          payload: '{}',
          base_version: child._version,
          created_at: now,
        })
      }

      set((state) => ({
        todos: state.todos.filter((t) => t.id !== id && t.parent_id !== id),
      }))
    } else {
      const adapter = getTodosAdapter()
      await adapter.remove(id)

      const children = todos.filter((t) => t.parent_id === id)
      for (const child of children) {
        await adapter.remove(child.id)
      }

      set((state) => ({
        todos: state.todos.filter((t) => t.id !== id && t.parent_id !== id),
      }))
    }
  },

  // 切换完成状态（离线优先）
  toggleDone: async (id: string) => {
    const { todos } = get()
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    const newDone = !todo.done
    const doneAt = newDone ? new Date().toISOString() : null

    if (_localDB && _pendingQueue) {
      const now = new Date().toISOString()
      const updated: Todo = { ...todo, done: newDone, done_at: doneAt, updated_at: now }
      _localDB.upsert('todos', updated)
      _pendingQueue.enqueue({
        table_name: 'todos',
        operation: 'update',
        record_id: id,
        payload: JSON.stringify({ done: newDone, done_at: doneAt }),
        base_version: todo._version,
        created_at: now,
      })

      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? updated : t)),
      }))
    } else {
      const adapter = getTodosAdapter()
      const updated = await adapter.update(id, { done: newDone, done_at: doneAt })
      set((state) => ({
        todos: state.todos.map((t) => (t.id === id ? updated : t)),
      }))
    }
  },

  // 更新排序（离线优先）
  reorder: async (todoId: string, newSortOrder: number) => {
    if (_localDB && _pendingQueue) {
      const todo = _localDB.getById<Todo>('todos', todoId)
      if (!todo) return

      const now = new Date().toISOString()
      const updated: Todo = { ...todo, sort_order: newSortOrder, updated_at: now }
      _localDB.upsert('todos', updated)
      _pendingQueue.enqueue({
        table_name: 'todos',
        operation: 'update',
        record_id: todoId,
        payload: JSON.stringify({ sort_order: newSortOrder }),
        base_version: todo._version,
        created_at: now,
      })

      set((state) => ({
        todos: state.todos
          .map((t) => (t.id === todoId ? updated : t))
          .sort((a, b) => a.sort_order - b.sort_order),
      }))
    } else {
      const adapter = getTodosAdapter()
      const updated = await adapter.update(todoId, { sort_order: newSortOrder })
      set((state) => ({
        todos: state.todos
          .map((t) => (t.id === todoId ? updated : t))
          .sort((a, b) => a.sort_order - b.sort_order),
      }))
    }
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

  // 订阅 todos 表的 Realtime 事件（接收远端事件后同时更新 SQLite）
  subscribeRealtime: () => {
    const adapter = getTodosAdapter()
    return adapter.subscribe((payload: RealtimePayload<Todo>) => {
      set((state) => {
        let newTodos = [...state.todos]

        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new && !payload.new._deleted) {
              _localDB?.upsert('todos', payload.new)
              if (!newTodos.find((t) => t.id === payload.new!.id)) {
                newTodos.push(payload.new)
              }
            }
            break
          case 'UPDATE':
            if (payload.new) {
              _localDB?.upsert('todos', payload.new)
              if (payload.new._deleted) {
                newTodos = newTodos.filter((t) => t.id !== payload.new!.id)
              } else {
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
