import React from 'react'
import { Pin, Trash2 } from 'lucide-react'
import type { Note, NoteType } from '@mya/shared'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { cn } from '../../lib/utils'

// 分类配置
const NOTE_TYPE_CONFIG: Record<NoteType, { label: string; className: string }> = {
  idea: { label: '灵感', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  memo: { label: '备忘', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  log: { label: '日志', className: 'bg-green-100 text-green-700 border-green-200' },
}

// 相对时间格式化
function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days < 7) return `${days} 天前`

  return new Date(dateStr).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}

interface NoteCardProps {
  note: Note
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
}

export function NoteCard({ note, onTogglePin, onDelete }: NoteCardProps) {
  const typeConfig = NOTE_TYPE_CONFIG[note.type]

  return (
    <Card
      className={cn(
        'group relative p-4 transition-shadow hover:shadow-md',
        note.pinned && 'border-primary/30 bg-primary/5',
      )}
    >
      {/* 顶部：分类 Badge + 置顶标记 + 时间 */}
      <div className="mb-2 flex items-center gap-2">
        <Badge variant="outline" className={typeConfig.className}>
          {typeConfig.label}
        </Badge>
        {note.pinned && (
          <Pin className="h-3 w-3 fill-primary text-primary" />
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {formatRelativeTime(note.created_at)}
        </span>
      </div>

      {/* 内容 */}
      <p className="line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed">
        {note.content}
      </p>

      {/* 悬停操作按钮 */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onTogglePin(note.id)}
          title={note.pinned ? '取消置顶' : '置顶'}
        >
          <Pin className={cn('h-3.5 w-3.5', note.pinned && 'fill-primary text-primary')} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(note.id)}
          title="删除"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
