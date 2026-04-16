import React from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2, X, RotateCcw } from 'lucide-react'
import type { Schedule } from '@mya/shared'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface ScheduleItemProps {
  schedule: Schedule
  onEdit: (schedule: Schedule) => void
  onCancel: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}

export function ScheduleItem({
  schedule,
  onEdit,
  onCancel,
  onRestore,
  onDelete,
}: ScheduleItemProps) {
  const isCancelled = schedule.status === 'cancelled'

  // 格式化时间
  function renderTime() {
    if (schedule.all_day) {
      return <Badge variant="secondary" className="text-xs">全天</Badge>
    }
    const start = format(new Date(schedule.start_time), 'HH:mm')
    const end = format(new Date(schedule.end_time), 'HH:mm')
    return <span className="text-sm text-muted-foreground">{start} - {end}</span>
  }

  return (
    <div className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50">
      {/* 左侧颜色条 */}
      <div
        className="mt-1 h-10 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: schedule.color ?? '#4A90D9' }}
      />

      {/* 内容区 */}
      <div className="min-w-0 flex-1">
        {/* 时间 */}
        <div className="mb-1">
          {renderTime()}
        </div>

        {/* 标题 */}
        <p className={cn(
          'text-sm font-medium',
          isCancelled && 'text-muted-foreground line-through',
        )}>
          {schedule.title}
        </p>

        {/* 描述预览 */}
        {schedule.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {schedule.description}
          </p>
        )}
      </div>

      {/* 悬停操作按钮 */}
      <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(schedule)}
          title="编辑"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {isCancelled ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onRestore(schedule.id)}
            title="恢复日程"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onCancel(schedule.id)}
            title="取消日程"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(schedule.id)}
          title="删除"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
