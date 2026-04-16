import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useTodosStore } from '@mya/shared'
import type { Todo, TodoPriority } from '@mya/shared'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar } from '../ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { cn } from '../../lib/utils'

// 优先级选项
const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 0, label: '低', color: 'border-muted-foreground/30' },
  { value: 1, label: '中', color: 'border-orange-500 bg-orange-50 text-orange-700' },
  { value: 2, label: '高', color: 'border-red-500 bg-red-50 text-red-700' },
]

interface TodoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editTodo?: Todo | null
}

export function TodoFormDialog({ open, onOpenChange, editTodo }: TodoFormDialogProps) {
  const { createTodo, updateTodo, todos } = useTodosStore()

  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<TodoPriority>(0)
  const [parentId, setParentId] = useState<string>('')
  const [titleError, setTitleError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const isEdit = !!editTodo

  // 可选父任务：未完成的顶级待办（排除自身和自身子任务）
  const availableParents = todos.filter(
    (t) => !t.done && !t.parent_id && t.id !== editTodo?.id,
  )

  // 初始化/重置表单
  useEffect(() => {
    if (open) {
      if (editTodo) {
        setTitle(editTodo.title)
        setNote(editTodo.note ?? '')
        setDueDate(editTodo.due_date ? new Date(editTodo.due_date) : undefined)
        setPriority(editTodo.priority)
        setParentId(editTodo.parent_id ?? '')
      } else {
        setTitle('')
        setNote('')
        setDueDate(undefined)
        setPriority(0)
        setParentId('')
      }
      setTitleError('')
    }
  }, [open, editTodo])

  async function handleSubmit() {
    if (!title.trim()) {
      setTitleError('标题不能为空')
      return
    }

    setSubmitting(true)
    try {
      const dueDateStr = dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined

      if (isEdit && editTodo) {
        await updateTodo(editTodo.id, {
          title: title.trim(),
          note: note.trim() || null,
          due_date: dueDateStr ?? null,
          priority,
        })
      } else {
        await createTodo({
          title: title.trim(),
          note: note.trim() || undefined,
          due_date: dueDateStr,
          priority,
          parent_id: parentId || undefined,
        })
      }
      onOpenChange(false)
    } catch (err) {
      console.error('操作待办失败:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑待办' : '新建待办'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="todo-title">标题</Label>
            <Input
              id="todo-title"
              placeholder="输入待办标题"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (titleError) setTitleError('')
              }}
            />
            {titleError && <p className="text-xs text-destructive">{titleError}</p>}
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="todo-note">备注</Label>
            <Textarea
              id="todo-note"
              placeholder="添加备注（可选）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* 截止日期 */}
          <div className="space-y-2">
            <Label>截止日期</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'yyyy-MM-dd') : '选择截止日期（可选）'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date)
                    setCalendarOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
            {dueDate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground"
                onClick={() => setDueDate(undefined)}
              >
                清除日期
              </Button>
            )}
          </div>

          {/* 优先级 */}
          <div className="space-y-2">
            <Label>优先级</Label>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'rounded-md border px-4 py-1.5 text-sm font-medium transition-colors',
                    priority === p.value ? p.color : 'border-input hover:bg-accent',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 父任务 */}
          {!isEdit && (
            <div className="space-y-2">
              <Label>父任务</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger>
                  <SelectValue placeholder="无（顶级待办）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">无（顶级待办）</SelectItem>
                  {availableParents.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '保存中...' : isEdit ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
