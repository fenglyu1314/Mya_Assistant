import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Plus, Loader2, CalendarDays } from 'lucide-react'
import { useSchedulesStore } from '@mya/shared'
import type { Schedule } from '@mya/shared'
import { Button } from '../components/ui/button'
import { Calendar } from '../components/ui/calendar'
import { ScheduleItem } from '../components/schedules/ScheduleItem'
import { ScheduleFormDialog } from '../components/schedules/ScheduleFormDialog'
import { ConfirmDialog } from '../components/common/ConfirmDialog'

export function SchedulesPage() {
  const {
    loading,
    selectedDate,
    fetchSchedules,
    cancelSchedule,
    restoreSchedule,
    deleteSchedule,
    setSelectedDate,
    subscribeRealtime,
    schedulesForDate,
    markedDates,
  } = useSchedulesStore()

  const [formOpen, setFormOpen] = useState(false)
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 当前月份字符串
  const monthStr = format(currentMonth, 'yyyy-MM')

  // 页面挂载：拉取当月数据 + 订阅实时
  useEffect(() => {
    fetchSchedules(monthStr)
    const unsubscribe = subscribeRealtime()
    return () => { unsubscribe() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 月份切换时重新拉取
  const handleMonthChange = useCallback(
    (month: Date) => {
      setCurrentMonth(month)
      fetchSchedules(format(month, 'yyyy-MM'))
    },
    [fetchSchedules],
  )

  // 日期选择
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        setSelectedDate(format(date, 'yyyy-MM-dd'))
      }
    },
    [setSelectedDate],
  )

  // 当天日程
  const daySchedules = schedulesForDate(selectedDate)
  const marks = markedDates()

  // 月历上标记有日程的日期
  const markedDateObjects = Object.keys(marks).map((d) => new Date(d))

  function handleEdit(schedule: Schedule) {
    setEditSchedule(schedule)
    setFormOpen(true)
  }

  function handleCreate() {
    setEditSchedule(null)
    setFormOpen(true)
  }

  return (
    <div className="flex h-full flex-col">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">日程</h1>
      </div>

      {/* 双栏布局 */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* 左侧月历 */}
        <div className="shrink-0">
          <Calendar
            mode="single"
            selected={new Date(selectedDate)}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={handleMonthChange}
            locale={zhCN}
            modifiers={{ hasEvent: markedDateObjects }}
            modifiersClassNames={{
              hasEvent: 'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary',
            }}
            className="rounded-lg border"
          />
        </div>

        {/* 右侧日程列表 */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* 日期标题 + 新建按钮 */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {format(new Date(selectedDate), 'M月d日 EEEE', { locale: zhCN })}
            </h2>
            <Button onClick={handleCreate} size="sm">
              <Plus className="h-4 w-4" />
              新建日程
            </Button>
          </div>

          {/* 日程列表 */}
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : daySchedules.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <CalendarDays className="mb-3 h-12 w-12" />
              <p className="text-lg font-medium">暂无日程</p>
              <p className="text-sm">点击「新建日程」添加日程</p>
            </div>
          ) : (
            <div className="flex-1 space-y-1 overflow-y-auto">
              {daySchedules.map((schedule) => (
                <ScheduleItem
                  key={schedule.id}
                  schedule={schedule}
                  onEdit={handleEdit}
                  onCancel={cancelSchedule}
                  onRestore={restoreSchedule}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 日程表单弹窗 */}
      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editSchedule={editSchedule}
        defaultDate={selectedDate}
      />

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="删除日程"
        description="确定要删除这条日程吗？此操作不可撤销。"
        confirmText="删除"
        onConfirm={() => {
          if (deleteId) deleteSchedule(deleteId)
        }}
      />
    </div>
  )
}
