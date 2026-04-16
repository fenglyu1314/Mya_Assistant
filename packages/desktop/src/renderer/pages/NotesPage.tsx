import React, { useState, useEffect } from 'react'
import { Plus, Loader2, StickyNote } from 'lucide-react'
import { useNotesStore } from '@mya/shared'
import type { NoteType } from '@mya/shared'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { NoteCard } from '../components/notes/NoteCard'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { cn } from '../lib/utils'

// 筛选 Tab 配置
const FILTER_TABS: { value: NoteType | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'idea', label: '灵感' },
  { value: 'memo', label: '备忘' },
  { value: 'log', label: '日志' },
]

export function NotesPage() {
  const {
    loading,
    filter,
    fetchNotes,
    createNote,
    togglePin,
    deleteNote,
    setFilter,
    filteredNotes,
    subscribeRealtime,
  } = useNotesStore()

  // 内联创建区状态
  const [content, setContent] = useState('')
  const [noteType, setNoteType] = useState<NoteType>('memo')
  const [creating, setCreating] = useState(false)

  // 删除确认状态
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // 页面挂载：拉取数据 + 订阅实时
  useEffect(() => {
    fetchNotes()
    const unsubscribe = subscribeRealtime()
    return () => { unsubscribe() }
  }, [fetchNotes, subscribeRealtime])

  // 创建快速记录
  async function handleCreate() {
    if (!content.trim()) return
    setCreating(true)
    try {
      await createNote(content.trim(), noteType)
      setContent('')
    } catch (err) {
      console.error('创建快速记录失败:', err)
    } finally {
      setCreating(false)
    }
  }

  // 键盘快捷键：Ctrl/Cmd + Enter 提交
  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleCreate()
    }
  }

  const notes = filteredNotes()

  return (
    <div className="flex h-full flex-col">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">快速记录</h1>
      </div>

      {/* 内联创建区 */}
      <div className="mb-6 rounded-lg border bg-card p-4">
        <Textarea
          placeholder="记录一个想法..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          className="mb-3 resize-none"
          disabled={creating}
        />
        <div className="flex items-center gap-3">
          <Select value={noteType} onValueChange={(v) => setNoteType(v as NoteType)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="idea">灵感</SelectItem>
              <SelectItem value="memo">备忘</SelectItem>
              <SelectItem value="log">日志</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleCreate}
            disabled={!content.trim() || creating}
            size="sm"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            记录
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            Ctrl + Enter 提交
          </span>
        </div>
      </div>

      {/* 分类筛选 Tab */}
      <div className="mb-4 flex gap-1 rounded-lg border bg-muted/50 p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              filter === tab.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 快速记录列表 */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <StickyNote className="mb-3 h-12 w-12" />
          <p className="text-lg font-medium">暂无记录</p>
          <p className="text-sm">在上方输入框中记录你的想法吧</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onTogglePin={togglePin}
              onDelete={(id) => setDeleteId(id)}
            />
          ))}
        </div>
      )}

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="删除记录"
        description="确定要删除这条快速记录吗？此操作不可撤销。"
        confirmText="删除"
        onConfirm={() => {
          if (deleteId) deleteNote(deleteId)
        }}
      />
    </div>
  )
}
