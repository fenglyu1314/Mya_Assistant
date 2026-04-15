import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { SupabaseAdapter } from '../sync/supabase-adapter'
import { getSupabaseClient } from '../sync/supabase-client'
import type { Note, NoteType, UpdateNoteInput } from '../models/note'
import type { Unsubscribe, RealtimePayload } from '../sync/types'
import type { ILocalDB, IPendingQueue } from '../offline/types'
import { useAuthStore } from './auth-store'

// 快速记录状态
interface NotesState {
  notes: Note[]
  loading: boolean
  filter: NoteType | 'all'
}

// 快速记录操作
interface NotesActions {
  fetchNotes: () => Promise<void>
  createNote: (content: string, type: NoteType) => Promise<void>
  updateNote: (id: string, data: UpdateNoteInput) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  setFilter: (filter: NoteType | 'all') => void
  subscribeRealtime: () => Unsubscribe
  filteredNotes: () => Note[]
  // 离线支持：从 SQLite 初始化 Store 数据
  initializeFromLocal: () => void
  // 离线支持：注入离线引擎模块
  setOfflineModules: (localDB: ILocalDB, pendingQueue: IPendingQueue) => void
}

// 离线模块引用（注入式，避免循环依赖）
let _localDB: ILocalDB | null = null
let _pendingQueue: IPendingQueue | null = null

// 排序辅助：置顶优先 + 创建时间降序
function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    // 置顶优先
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    // 创建时间降序
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

// 获取 notes 表的 SupabaseAdapter
function getNotesAdapter(): SupabaseAdapter<Note> {
  return new SupabaseAdapter<Note>(getSupabaseClient(), 'notes')
}

// 快速记录 Store
export const useNotesStore = create<NotesState & NotesActions>()((set, get) => ({
  // 初始状态
  notes: [],
  loading: false,
  filter: 'all',

  // 注入离线模块
  setOfflineModules: (localDB: ILocalDB, pendingQueue: IPendingQueue) => {
    _localDB = localDB
    _pendingQueue = pendingQueue
  },

  // 从 SQLite 初始化 Store 数据（冷启动时使用）
  initializeFromLocal: () => {
    if (!_localDB) return
    const notes = _localDB.getAll<Note>('notes', true)
    set({ notes: sortNotes(notes), loading: false })
  },

  // 拉取所有快速记录（离线优先：从 SQLite 读取）
  fetchNotes: async () => {
    set({ loading: true })
    try {
      if (_localDB) {
        // 离线优先：从本地 SQLite 读取
        const data = _localDB.getAll<Note>('notes', true)
        set({ notes: sortNotes(data), loading: false })
      } else {
        // 降级：直接从后端读取（离线引擎未初始化时）
        const adapter = getNotesAdapter()
        const data = await adapter.getAll()
        set({ notes: sortNotes(data), loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  // 创建快速记录（离线优先：写 SQLite + 入队）
  createNote: async (content: string, type: NoteType) => {
    const userId = useAuthStore.getState().user?.id
    if (!userId) {
      throw new Error('未登录，无法创建记录')
    }

    if (_localDB && _pendingQueue) {
      // 离线优先：写入 SQLite + 入队 pending
      const now = new Date().toISOString()
      const newNote: Note = {
        id: uuidv4(),
        user_id: userId,
        content,
        type,
        images: [],
        pinned: false,
        tags: [],
        _deleted: false,
        _version: 1,
        created_at: now,
        updated_at: now,
      }

      console.log('[NotesStore] createNote 离线路径 - 开始写入 SQLite')
      _localDB.upsert('notes', newNote)
      console.log('[NotesStore] createNote - SQLite upsert 完成，开始入队')
      _pendingQueue.enqueue({
        table_name: 'notes',
        operation: 'create',
        record_id: newNote.id,
        payload: JSON.stringify({
          content,
          type,
          images: [],
          pinned: false,
          tags: [],
          _deleted: false,
          user_id: userId,
        }),
        base_version: 1,
        created_at: now,
      })
      console.log('[NotesStore] createNote - 入队完成，更新 Zustand state')

      set((state) => ({
        notes: sortNotes([...state.notes, newNote]),
      }))
      console.log('[NotesStore] createNote - 离线路径完成')
    } else {
      console.log('[NotesStore] createNote - 走降级路径（_localDB 或 _pendingQueue 为 null）')
      // 降级：直接写后端
      const adapter = getNotesAdapter()
      const newNote = await adapter.create({
        content,
        type,
        images: [],
        pinned: false,
        tags: [],
        _deleted: false,
        user_id: userId,
      })
      set((state) => ({
        notes: sortNotes([...state.notes, newNote]),
      }))
    }
  },

  // 更新快速记录（离线优先）
  updateNote: async (id: string, data: UpdateNoteInput) => {
    if (_localDB && _pendingQueue) {
      const note = _localDB.getById<Note>('notes', id)
      if (!note) {
        console.warn('[NotesStore] updateNote - 本地未找到记录 id:', id)
        return
      }

      const now = new Date().toISOString()
      const updated: Note = {
        ...note,
        ...data,
        updated_at: now,
        _version: note._version + 1,
      }

      _localDB.upsert('notes', updated)
      _pendingQueue.enqueue({
        table_name: 'notes',
        operation: 'update',
        record_id: id,
        payload: JSON.stringify(data),
        base_version: note._version,
        created_at: now,
      })

      set((state) => ({
        notes: sortNotes(
          state.notes.map((n) => (n.id === id ? updated : n))
        ),
      }))
    } else {
      // 降级：直接更新后端
      const adapter = getNotesAdapter()
      const updated = await adapter.update(id, data)
      set((state) => ({
        notes: sortNotes(
          state.notes.map((n) => (n.id === id ? updated : n))
        ),
      }))
    }
  },

  // 软删除快速记录（离线优先）
  deleteNote: async (id: string) => {
    if (_localDB && _pendingQueue) {
      const note = _localDB.getById<Note>('notes', id)
      _localDB.markDeleted('notes', id)
      _pendingQueue.enqueue({
        table_name: 'notes',
        operation: 'delete',
        record_id: id,
        payload: '{}',
        base_version: note?._version ?? 1,
        created_at: new Date().toISOString(),
      })
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }))
    } else {
      const adapter = getNotesAdapter()
      await adapter.remove(id)
      set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
      }))
    }
  },

  // 切换置顶状态（离线优先）
  togglePin: async (id: string) => {
    const { notes } = get()
    const note = notes.find((n) => n.id === id)
    if (!note) return

    const newPinned = !note.pinned

    if (_localDB && _pendingQueue) {
      const now = new Date().toISOString()
      const updated: Note = { ...note, pinned: newPinned, updated_at: now }
      _localDB.upsert('notes', updated)
      _pendingQueue.enqueue({
        table_name: 'notes',
        operation: 'update',
        record_id: id,
        payload: JSON.stringify({ pinned: newPinned }),
        base_version: note._version,
        created_at: now,
      })
      set((state) => ({
        notes: sortNotes(
          state.notes.map((n) => (n.id === id ? updated : n))
        ),
      }))
    } else {
      const adapter = getNotesAdapter()
      const updated = await adapter.update(id, { pinned: newPinned })
      set((state) => ({
        notes: sortNotes(
          state.notes.map((n) => (n.id === id ? updated : n))
        ),
      }))
    }
  },

  // 设置分类筛选
  setFilter: (filter: NoteType | 'all') => {
    set({ filter })
  },

  // 订阅实时变更（接收远端事件后同时更新 SQLite）
  subscribeRealtime: () => {
    const adapter = getNotesAdapter()
    return adapter.subscribe((payload: RealtimePayload<Note>) => {
      set((state) => {
        let newNotes = [...state.notes]

        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new && !payload.new._deleted) {
              // 同步更新 SQLite
              _localDB?.upsert('notes', payload.new)
              // 避免重复添加
              if (!newNotes.find((n) => n.id === payload.new!.id)) {
                newNotes.push(payload.new)
              }
            }
            break
          case 'UPDATE':
            if (payload.new) {
              // 同步更新 SQLite
              _localDB?.upsert('notes', payload.new)
              if (payload.new._deleted) {
                // 软删除 → 从列表移除
                newNotes = newNotes.filter((n) => n.id !== payload.new!.id)
              } else {
                // 更新已有记录
                newNotes = newNotes.map((n) =>
                  n.id === payload.new!.id ? payload.new! : n
                )
              }
            }
            break
          case 'DELETE':
            if (payload.old?.id) {
              newNotes = newNotes.filter((n) => n.id !== payload.old!.id)
            }
            break
        }

        return { notes: sortNotes(newNotes) }
      })
    })
  },

  // 根据当前 filter 返回过滤后的列表
  filteredNotes: () => {
    const { notes, filter } = get()
    if (filter === 'all') return notes
    return notes.filter((n) => n.type === filter)
  },
}))
