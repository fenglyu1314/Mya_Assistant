import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSchedulesStore } from '@mya/shared'
import type { Schedule } from '@mya/shared'
import { useTheme } from '../../theme'
import { Button } from '../../components/Button'
import { TextInput } from '../../components/TextInput'
import { DatePicker } from '../../components/DatePicker'
import { TimePicker } from '../../components/TimePicker'
import { RemindPicker } from '../../components/RemindPicker'
import { ColorPicker } from '../../components/ColorPicker'

interface ScheduleFormScreenProps {
  navigation: any
  route: {
    params?: {
      scheduleId?: string
      selectedDate?: string
    }
  }
}

// 获取下一个整点的时间（基于指定日期）
function getNextWholeHour(dateStr?: string): Date {
  const now = new Date()
  const base = dateStr ? new Date(`${dateStr}T${String(now.getHours()).padStart(2, '0')}:00:00`) : now
  const result = new Date(base)
  result.setHours(result.getHours() + 1)
  result.setMinutes(0)
  result.setSeconds(0)
  result.setMilliseconds(0)
  return result
}

// 将提醒分钟数转为 remind_at 时间数组
function minutesToRemindAt(minutes: number[], startTime: string): string[] {
  const start = new Date(startTime).getTime()
  return minutes.map((m) => new Date(start - m * 60 * 1000).toISOString())
}

// 从 remind_at 时间数组解析回分钟数
function remindAtToMinutes(remindAt: string[], startTime: string): number[] {
  const start = new Date(startTime).getTime()
  return remindAt.map((t) => {
    const diff = start - new Date(t).getTime()
    return Math.round(diff / (60 * 1000))
  })
}

export function ScheduleFormScreen({ navigation, route }: ScheduleFormScreenProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const scheduleId = route.params?.scheduleId
  const selectedDate = route.params?.selectedDate

  const schedules = useSchedulesStore((s) => s.schedules)
  const createSchedule = useSchedulesStore((s) => s.createSchedule)
  const updateSchedule = useSchedulesStore((s) => s.updateSchedule)

  const isEdit = !!scheduleId
  const existingSchedule: Schedule | undefined = isEdit
    ? schedules.find((s) => s.id === scheduleId)
    : undefined

  // 默认开始时间（下一个整点）
  const defaultStart = getNextWholeHour(selectedDate)
  const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000)

  // 表单状态
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [startDate, setStartDate] = useState<string>(defaultStart.toISOString())
  const [endDate, setEndDate] = useState<string>(defaultEnd.toISOString())
  const [remindMinutes, setRemindMinutes] = useState<number[]>([])
  const [color, setColor] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 编辑模式下填充已有数据
  useEffect(() => {
    if (existingSchedule) {
      setTitle(existingSchedule.title)
      setDescription(existingSchedule.description ?? '')
      setAllDay(existingSchedule.all_day)
      setStartDate(existingSchedule.start_time)
      setEndDate(existingSchedule.end_time)
      setColor(existingSchedule.color)
      if (existingSchedule.remind_at && existingSchedule.remind_at.length > 0) {
        setRemindMinutes(remindAtToMinutes(existingSchedule.remind_at, existingSchedule.start_time))
      }
    }
  }, [existingSchedule])

  // 更新开始日期部分（保留时间）
  const handleStartDateChange = useCallback((dateIso: string | null) => {
    if (!dateIso) return
    const newDate = new Date(dateIso)
    const current = new Date(startDate)
    current.setFullYear(newDate.getFullYear())
    current.setMonth(newDate.getMonth())
    current.setDate(newDate.getDate())
    setStartDate(current.toISOString())
  }, [startDate])

  // 更新结束日期部分（保留时间）
  const handleEndDateChange = useCallback((dateIso: string | null) => {
    if (!dateIso) return
    const newDate = new Date(dateIso)
    const current = new Date(endDate)
    current.setFullYear(newDate.getFullYear())
    current.setMonth(newDate.getMonth())
    current.setDate(newDate.getDate())
    setEndDate(current.toISOString())
  }, [endDate])

  // 保存
  const handleSave = useCallback(async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      Alert.alert('提示', '标题不能为空')
      return
    }

    // 时间校验
    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      Alert.alert('提示', '结束时间不能早于开始时间')
      return
    }

    setSaving(true)
    try {
      const remindAt = remindMinutes.length > 0
        ? minutesToRemindAt(remindMinutes, startDate)
        : []

      if (isEdit && scheduleId) {
        await updateSchedule(scheduleId, {
          title: trimmedTitle,
          description: description.trim() || null,
          all_day: allDay,
          start_time: startDate,
          end_time: endDate,
          remind_at: remindAt,
          color,
        })
      } else {
        await createSchedule({
          title: trimmedTitle,
          description: description.trim() || undefined,
          all_day: allDay,
          start_time: startDate,
          end_time: endDate,
          remind_at: remindAt,
          color: color ?? undefined,
        })
      }
      navigation.goBack()
    } catch (err) {
      console.error('[ScheduleForm] 保存失败:', err)
      Alert.alert('错误', `${isEdit ? '保存' : '创建'}失败: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setSaving(false)
    }
  }, [
    title, description, allDay, startDate, endDate,
    remindMinutes, color, isEdit, scheduleId,
    createSchedule, updateSchedule, navigation,
  ])

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 标题栏 */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[styles.backBtn, { color: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          ← 返回
        </Text>
        <Text style={[styles.headerTitle, { color: theme.colors.text, fontSize: theme.fontSize.lg }]}>
          {isEdit ? '编辑日程' : '新建日程'}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        style={styles.form}
        contentContainerStyle={{
          padding: theme.spacing.md,
          gap: theme.spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* 标题 */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            标题 <Text style={{ color: theme.colors.error }}>*</Text>
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="输入日程标题"
          />
        </View>

        {/* 描述 */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>描述</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="添加描述（可选）"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 全天事件 */}
        <View style={[styles.field, styles.switchRow]}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>全天事件</Text>
          <Switch
            value={allDay}
            onValueChange={setAllDay}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          />
        </View>

        {/* 开始日期 */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>开始日期</Text>
          <DatePicker value={startDate} onChange={handleStartDateChange} />
        </View>

        {/* 开始时间（非全天事件时显示） */}
        {!allDay && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>开始时间</Text>
            <TimePicker value={startDate} onChange={setStartDate} />
          </View>
        )}

        {/* 结束日期 */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>结束日期</Text>
          <DatePicker value={endDate} onChange={handleEndDateChange} />
        </View>

        {/* 结束时间（非全天事件时显示） */}
        {!allDay && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>结束时间</Text>
            <TimePicker value={endDate} onChange={setEndDate} />
          </View>
        )}

        {/* 提醒 */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>提醒</Text>
          <RemindPicker value={remindMinutes} onChange={setRemindMinutes} />
        </View>

        {/* 颜色 */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>颜色标识</Text>
          <ColorPicker value={color} onChange={setColor} />
        </View>

        {/* 保存按钮 */}
        <Button
          title={saving ? '保存中...' : (isEdit ? '保存' : '创建')}
          onPress={handleSave}
          disabled={saving}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    fontSize: 16,
    fontWeight: '500',
    width: 50,
  },
  headerTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  field: {
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
