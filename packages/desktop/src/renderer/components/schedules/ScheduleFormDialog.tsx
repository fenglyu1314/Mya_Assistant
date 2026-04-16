import React, { useState, useEffect } from 'react'
import { format, addHours, startOfHour } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useSchedulesStore } from '@mya/shared'
import type { Schedule } from '@mya/shared'
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
import { Switch } from '../ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Calendar } from '../ui/calendar'
import { ColorPicker } from './ColorPicker'
import { RemindPicker } from './RemindPicker'
import { cn } from '../../lib/utils'

// 将提醒分钟数转换为相对于事件开始时间的 ISO 字符串
function remindMinutesToIso(startTime: string, minutes: number[]): string[] {
  return minutes.map((m) => {
    const start = new Date(startTime)
    start.setMinutes(start.getMinutes() - m)
    return start.toISOString()
  })
}

// 从 remind_at ISO 字符串数组中提取提醒分钟数
function isoToRemindMinutes(startTime: string, remindAt: string[]): number[] {
  const start = new Date(startTime).getTime()
  return remindAt.map((iso) => {
    const remind = new Date(iso).getTime()
    return Math.round((start - remind) / 60000)
  })
}

interface ScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editSchedule?: Schedule | null
  defaultDate?: string // YYYY-MM-DD
}

export function ScheduleFormDialog({
  open,
  onOpenChange,
  editSchedule,
  defaultDate,
}: ScheduleFormDialogProps) {
  const { createSchedule, updateSchedule } = useSchedulesStore()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [date, setDate] = useState<Date>(new Date())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [color, setColor] = useState<string | null>('#4A90D9')
  const [remindMinutes, setRemindMinutes] = useState<number[]>([])
  const [titleError, setTitleError] = useState('')
  const [timeError, setTimeError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const isEdit = !!editSchedule

  // 初始化表单
  useEffect(() => {
    if (open) {
      if (editSchedule) {
        setTitle(editSchedule.title)
        setDescription(editSchedule.description ?? '')
        setAllDay(editSchedule.all_day)
        setDate(new Date(editSchedule.start_time))
        setStartTime(format(new Date(editSchedule.start_time), 'HH:mm'))
        setEndTime(format(new Date(editSchedule.end_time), 'HH:mm'))
        setColor(editSchedule.color)
        setRemindMinutes(
          isoToRemindMinutes(editSchedule.start_time, editSchedule.remind_at),
        )
      } else {
        setTitle('')
        setDescription('')
        setAllDay(false)
        // 默认开始时间：下一个整点
        const nextHour = addHours(startOfHour(new Date()), 1)
        if (defaultDate) {
          setDate(new Date(defaultDate))
        } else {
          setDate(nextHour)
        }
        setStartTime(format(nextHour, 'HH:mm'))
        setEndTime(format(addHours(nextHour, 1), 'HH:mm'))
        setColor('#4A90D9')
        setRemindMinutes([])
      }
      setTitleError('')
      setTimeError('')
    }
  }, [open, editSchedule, defaultDate])

  async function handleSubmit() {
    // 校验
    if (!title.trim()) {
      setTitleError('标题不能为空')
      return
    }
    if (!allDay && endTime <= startTime) {
      setTimeError('结束时间不能早于开始时间')
      return
    }

    setSubmitting(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const startIso = allDay
        ? `${dateStr}T00:00:00`
        : `${dateStr}T${startTime}:00`
      const endIso = allDay
        ? `${dateStr}T23:59:59`
        : `${dateStr}T${endTime}:00`
      const remindAt = remindMinutesToIso(startIso, remindMinutes)

      if (isEdit && editSchedule) {
        await updateSchedule(editSchedule.id, {
          title: title.trim(),
          description: description.trim() || null,
          all_day: allDay,
          start_time: startIso,
          end_time: endIso,
          color,
          remind_at: remindAt,
        })
      } else {
        await createSchedule({
          title: title.trim(),
          description: description.trim() || undefined,
          all_day: allDay,
          start_time: startIso,
          end_time: endIso,
          color: color ?? undefined,
          remind_at: remindAt,
        })
      }
      onOpenChange(false)
    } catch (err) {
      console.error('操作日程失败:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑日程' : '新建日程'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="schedule-title">标题</Label>
            <Input
              id="schedule-title"
              placeholder="输入日程标题"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (titleError) setTitleError('')
              }}
            />
            {titleError && <p className="text-xs text-destructive">{titleError}</p>}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="schedule-desc">描述</Label>
            <Textarea
              id="schedule-desc"
              placeholder="添加描述（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* 全天事件开关 */}
          <div className="flex items-center justify-between">
            <Label>全天事件</Label>
            <Switch checked={allDay} onCheckedChange={setAllDay} />
          </div>

          {/* 日期 */}
          <div className="space-y-2">
            <Label>日期</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, 'yyyy-MM-dd')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) setDate(d)
                    setCalendarOpen(false)
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 时间选择器（非全天） */}
          {!allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始时间</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value)
                    if (timeError) setTimeError('')
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>结束时间</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value)
                    if (timeError) setTimeError('')
                  }}
                />
              </div>
              {timeError && (
                <p className="col-span-2 text-xs text-destructive">{timeError}</p>
              )}
            </div>
          )}

          {/* 颜色选择器 */}
          <div className="space-y-2">
            <Label>颜色</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {/* 提醒选择器 */}
          <div className="space-y-2">
            <Label>提醒</Label>
            <RemindPicker value={remindMinutes} onChange={setRemindMinutes} />
          </div>
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
