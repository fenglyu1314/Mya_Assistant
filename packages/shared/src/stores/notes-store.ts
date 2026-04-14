import { create } from 'zustand'
import { SupabaseAdapter } from '../sync/supabase-adapter'
import { getSupabaseClient } from '../sync/supabase-client'
import type { Note, NoteType } from '../models/note'
import type { Unsubscribe, RealtimePayload } from '../sync/types'

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
  deleteNote: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
  setFilter: (filter: NoteType | 'all') => void
  subscribeRealtime: () => Unsubscribe
  filteredNotes: () => Note[]
}

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

  // 拉取所有快速记录
  fetchNotes: async () => {
    set({ loading: true })
    try {
      const adapter = getNotesAdapter()
      const data = await adapter.getAll()
      set({ notes: sortNotes(data), loading: false })
    } catch {
      set({ loading: false })
    }
  },

  // 创建快速记录
  createNote: async (content: string, type: NoteType) => {
    const adapter = getNotesAdapter()
    const newNote = await adapter.create({
      content,
      type,
      images: [],
      pinned: false,
      tags: [],
      _deleted: false,
      user_id: '', // RLS 会自动填充
    })
    set((state) => ({
      notes: sortNotes([...state.notes, newNote]),
    }))
  },

  // 软删除快速记录
  deleteNote: async (id: string) => {
    const adapter = getNotesAdapter()
    await adapter.remove(id)
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }))
  },

  // 切换置顶状态
  togglePin: async (id: string) => {
    const { notes } = get()
    const note = notes.find((n) => n.id === id)
    if (!note) return

    const adapter = getNotesAdapter()
    const updated = await adapter.update(id, { pinned: !note.pinned })
    set((state) => ({
      notes: sortNotes(
        state.notes.map((n) => (n.id === id ? updated : n))
      ),
    }))
  },

  // 设置分类筛选
  setFilter: (filter: NoteType | 'all') => {
    set({ filter })
  },

  // 订阅实时变更
  subscribeRealtime: () => {
    const adapter = getNotesAdapter()
    return adapter.subscribe((payload: RealtimePayload<Note>) => {
      set((state) => {
        let newNotes = [...state.notes]

        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new && !payload.new._deleted) {
              // 避免重复添加
              if (!newNotes.find((n) => n.id === payload.new!.id)) {
                newNotes.push(payload.new)
              }
            }
            break
          case 'UPDATE':
            if (payload.new) {
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
