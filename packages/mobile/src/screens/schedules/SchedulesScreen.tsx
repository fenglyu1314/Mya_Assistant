import React, { useEffect, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSchedulesStore } from '@mya/shared'
import type { Schedule } from '@mya/shared'
import { useTheme } from '../../theme'
import { ScheduleCard } from '../../components/ScheduleCard'
import { EmptyState } from '../../components/EmptyState'

interface SchedulesScreenProps {
  navigation: any
}

// 获取当前月份字符串（YYYY-MM）
function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function SchedulesScreen({ navigation }: SchedulesScreenProps) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const schedules = useSchedulesStore((s) => s.schedules)
  const loading = useSchedulesStore((s) => s.loading)
  const selectedDate = useSchedulesStore((s) => s.selectedDate)
  const fetchSchedules = useSchedulesStore((s) => s.fetchSchedules)
  const setSelectedDate = useSchedulesStore((s) => s.setSelectedDate)
  const schedulesForDate = useSchedulesStore((s) => s.schedulesForDate)
  const markedDates = useSchedulesStore((s) => s.markedDates)
  const cancelSchedule = useSchedulesStore((s) => s.cancelSchedule)
  const restoreSchedule = useSchedulesStore((s) => s.restoreSchedule)
  const deleteSchedule = useSchedulesStore((s) => s.deleteSchedule)
  const subscribeRealtime = useSchedulesStore((s) => s.subscribeRealtime)

  // 初始加载当月数据 + 订阅实时变更
  useEffect(() => {
    fetchSchedules(getCurrentMonth())
    const unsubscribe = subscribeRealtime()
    return () => {
      unsubscribe()
    }
  }, [fetchSchedules, subscribeRealtime])

  // 当日日程列表
  const daySchedules = useMemo(
    () => schedulesForDate(selectedDate),
    [schedulesForDate, selectedDate, schedules]
  )

  // 标记日期对象 + 选中日期合并
  const calendarMarkedDates = useMemo(() => {
    const marks = markedDates()
    return {
      ...marks,
      [selectedDate]: {
        ...(marks[selectedDate] || {}),
        selected: true,
        selectedColor: theme.colors.primary,
      },
    }
  }, [markedDates, selectedDate, schedules, theme.colors.primary])

  // 点击日历日期
  const handleDayPress = useCallback(
    (day: { dateString: string }) => {
      setSelectedDate(day.dateString)
    },
    [setSelectedDate]
  )

  // 月份切换时加载数据
  const handleMonthChange = useCallback(
    (month: { year: number; month: number }) => {
      const monthStr = `${month.year}-${String(month.month).padStart(2, '0')}`
      fetchSchedules(monthStr)
    },
    [fetchSchedules]
  )

  // 点击日程卡片 → 进入编辑
  const handleSchedulePress = useCallback(
    (schedule: Schedule) => {
      navigation.navigate('ScheduleForm', { scheduleId: schedule.id })
    },
    [navigation]
  )

  // 长按日程卡片 → 操作菜单
  const handleScheduleLongPress = useCallback(
    (schedule: Schedule) => {
      const isCancelled = schedule.status === 'cancelled'
      const options = [
        {
          text: isCancelled ? '恢复日程' : '取消日程',
          onPress: () => {
            if (isCancelled) {
              restoreSchedule(schedule.id)
            } else {
              cancelSchedule(schedule.id)
            }
          },
        },
        {
          text: '删除',
          style: 'destructive' as const,
          onPress: () => {
            Alert.alert('确认删除', `确定要删除「${schedule.title}」吗？`, [
              { text: '取消', style: 'cancel' },
              {
                text: '删除',
                style: 'destructive',
                onPress: () => deleteSchedule(schedule.id),
              },
            ])
          },
        },
        { text: '取消', style: 'cancel' as const },
      ]

      Alert.alert('日程操作', schedule.title, options)
    },
    [cancelSchedule, restoreSchedule, deleteSchedule]
  )

  // 点击 FAB → 创建日程
  const handleCreate = useCallback(() => {
    navigation.navigate('ScheduleForm', { selectedDate })
  }, [navigation, selectedDate])

  // 渲染日程卡片
  const renderScheduleItem = useCallback(
    ({ item }: { item: Schedule }) => (
      <ScheduleCard
        schedule={item}
        onPress={handleSchedulePress}
        onLongPress={handleScheduleLongPress}
      />
    ),
    [handleSchedulePress, handleScheduleLongPress]
  )

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
          style={[
            styles.headerTitle,
            { color: theme.colors.text, fontSize: theme.fontSize.xl },
          ]}
        >
          日程
        </Text>
      </View>

      {/* 月历视图 */}
      <Calendar
        current={selectedDate}
        markedDates={calendarMarkedDates}
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.textSecondary,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: '#FFFFFF',
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.text,
          textDisabledColor: theme.colors.textSecondary,
          dotColor: theme.colors.primary,
          selectedDotColor: '#FFFFFF',
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.text,
          textDayFontSize: 14,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 12,
        }}
      />

      {/* 日程列表 */}
      <View style={[styles.listContainer, { paddingHorizontal: theme.spacing.md }]}>
        {/* 日期标签 */}
        <Text
          style={[
            styles.dateLabel,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.fontSize.sm,
              marginBottom: theme.spacing.sm,
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          {selectedDate}
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : daySchedules.length === 0 ? (
          <EmptyState
            icon="📅"
            title="今天没有日程"
            description="点击右下角的按钮创建新日程"
          />
        ) : (
          <FlatList
            data={daySchedules}
            keyExtractor={(item) => item.id}
            renderItem={renderScheduleItem}
            contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB 创建按钮 */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: insets.bottom + 16,
          },
        ]}
        onPress={handleCreate}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  dateLabel: {
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 30,
  },
})
