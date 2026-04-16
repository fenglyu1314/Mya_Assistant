import React from 'react'
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  Calendar,
} from 'lucide-react'
import type { Todo, TodoTreeNode } from '@mya/shared'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

// 优先级配置
const PRIORITY_CONFIG: Record<number, { color: string; label: string }> = {
  0: { color: '', label: '低' },
  1: { color: 'bg-orange-500', label: '中' },
  2: { color: 'bg-red-500', label: '高' },
}

// 格式化截止日期
function formatDueDate(dueDate: string): { text: string; overdue: boolean } {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000)
  const overdue = diffDays < 0

  let text: string
  if (diffDays === 0) text = '今天'
  else if (diffDays === 1) text = '明天'
  else if (diffDays === -1) text = '昨天'
  else if (diffDays > 0) text = `${diffDays}天后`
  else text = `已过${Math.abs(diffDays)}天`

  return { text, overdue }
}

interface TodoItemProps {
  node: TodoTreeNode
  expanded: boolean
  onToggleExpand: (id: string) => void
  onToggleDone: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  depth?: number
}

export function TodoItem({
  node,
  expanded,
  onToggleExpand,
  onToggleDone,
  onEdit,
  onDelete,
  depth = 0,
}: TodoItemProps) {
  const { todo, children } = node
  const priorityConfig = PRIORITY_CONFIG[todo.priority]
  const hasChildren = children.length > 0
  const completedChildren = children.filter((c) => c.done).length

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-accent/50',
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0"
            onClick={() => onToggleExpand(todo.id)}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </Button>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        {/* Checkbox */}
        <button
          onClick={() => onToggleDone(todo.id)}
          className={cn(
            'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
            todo.done
              ? 'border-primary bg-primary'
              : 'border-muted-foreground/40 hover:border-primary',
          )}
        >
          {todo.done && (
            <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* 优先级圆点 */}
        {priorityConfig.color && (
          <span className={cn('h-2 w-2 shrink-0 rounded-full', priorityConfig.color)} />
        )}

        {/* 标题 */}
        <span
          className={cn(
            'flex-1 truncate text-sm',
            todo.done && 'text-muted-foreground line-through',
          )}
        >
          {todo.title}
        </span>

        {/* 子任务计数 */}
        {hasChildren && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {completedChildren}/{children.length}
          </span>
        )}

        {/* 截止日期 */}
        {todo.due_date && !todo.done && (
          <span
            className={cn(
              'flex shrink-0 items-center gap-1 text-xs',
              formatDueDate(todo.due_date).overdue
                ? 'text-destructive'
                : 'text-muted-foreground',
            )}
          >
            <Calendar className="h-3 w-3" />
            {formatDueDate(todo.due_date).text}
          </span>
        )}

        {/* 悬停操作按钮 */}
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onEdit(todo)}
            title="编辑"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={() => onDelete(todo.id)}
            title="删除"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* 子任务 */}
      {hasChildren && expanded && (
        <div>
          {children.map((child) => (
            <TodoItem
              key={child.id}
              node={{ todo: child, children: [] }}
              expanded={false}
              onToggleExpand={onToggleExpand}
              onToggleDone={onToggleDone}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
