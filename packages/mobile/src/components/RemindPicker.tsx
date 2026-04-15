import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

export interface RemindPickerProps {
  value: number[]
  onChange: (minutes: number[]) => void
}

// 预设提醒选项：label + 提前分钟数（-1 代表「无提醒」）
const REMIND_OPTIONS: { label: string; minutes: number }[] = [
  { label: '无提醒', minutes: -1 },
  { label: '事件时', minutes: 0 },
  { label: '提前 5 分钟', minutes: 5 },
  { label: '提前 15 分钟', minutes: 15 },
  { label: '提前 30 分钟', minutes: 30 },
  { label: '提前 1 小时', minutes: 60 },
  { label: '提前 1 天', minutes: 1440 },
]

export function RemindPicker({ value, onChange }: RemindPickerProps) {
  const theme = useTheme()

  const handlePress = (minutes: number) => {
    if (minutes === -1) {
      // 选择「无提醒」清除所有选择
      onChange([])
      return
    }

    const isSelected = value.includes(minutes)
    if (isSelected) {
      // 取消选择
      onChange(value.filter((m) => m !== minutes))
    } else {
      // 添加选择
      onChange([...value, minutes])
    }
  }

  const isNoneSelected = value.length === 0

  return (
    <View style={styles.container}>
      {REMIND_OPTIONS.map((option) => {
        const isSelected = option.minutes === -1
          ? isNoneSelected
          : value.includes(option.minutes)

        return (
          <TouchableOpacity
            key={option.minutes}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.borderRadius.md,
              },
            ]}
            onPress={() => handlePress(option.minutes)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected ? '#FFFFFF' : theme.colors.textSecondary,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
})
