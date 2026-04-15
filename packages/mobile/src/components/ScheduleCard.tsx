import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { Schedule } from '@mya/shared'
import { useTheme } from '../theme'

export interface ScheduleCardProps {
  schedule: Schedule
  onPress: (schedule: Schedule) => void
  onLongPress: (schedule: Schedule) => void
}

// 格式化时间 HH:mm
function formatTime(isoString: string): string {
  const d = new Date(isoString)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function ScheduleCard({ schedule, onPress, onLongPress }: ScheduleCardProps) {
  const theme = useTheme()
  const isCancelled = schedule.status === 'cancelled'
  const hasRemind = schedule.remind_at && schedule.remind_at.length > 0
  const barColor = schedule.color ?? theme.colors.primary

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          borderColor: theme.colors.border,
        },
      ]}
      onPress={() => onPress(schedule)}
      onLongPress={() => onLongPress(schedule)}
      activeOpacity={0.7}
    >
      {/* 左侧颜色指示条 */}
      <View
        style={[
          styles.colorBar,
          {
            backgroundColor: barColor,
            borderTopLeftRadius: theme.borderRadius.md,
            borderBottomLeftRadius: theme.borderRadius.md,
          },
        ]}
      />

      <View style={styles.content}>
        {/* 时间行 */}
        <Text
          style={[
            styles.time,
            {
              color: isCancelled ? theme.colors.textSecondary : theme.colors.primary,
            },
          ]}
        >
          {schedule.all_day
            ? '全天'
            : `${formatTime(schedule.start_time)} - ${formatTime(schedule.end_time)}`}
        </Text>

        {/* 标题行 */}
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              {
                color: isCancelled ? theme.colors.textSecondary : theme.colors.text,
                textDecorationLine: isCancelled ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {schedule.title}
          </Text>
          {hasRemind && (
            <Text style={styles.remindIcon}>🔔</Text>
          )}
        </View>

        {/* 描述预览 */}
        {schedule.description ? (
          <Text
            style={[styles.description, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {schedule.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  remindIcon: {
    fontSize: 14,
  },
  description: {
    fontSize: 13,
  },
})
