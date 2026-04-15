import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import type { TodoPriority } from '@mya/shared'
import { useTheme } from '../theme'

export interface PriorityPickerProps {
  value: TodoPriority
  onChange: (priority: TodoPriority) => void
}

// 优先级配置
const PRIORITIES: { value: TodoPriority; label: string; color: string }[] = [
  { value: 0, label: '低', color: '#8892A4' },
  { value: 1, label: '中', color: '#F39C12' },
  { value: 2, label: '高', color: '#E74C3C' },
]

export function PriorityPicker({ value, onChange }: PriorityPickerProps) {
  const theme = useTheme()

  return (
    <View style={styles.container}>
      {PRIORITIES.map((p) => {
        const isSelected = value === p.value
        return (
          <TouchableOpacity
            key={p.value}
            style={[
              styles.option,
              {
                borderColor: isSelected ? p.color : theme.colors.border,
                backgroundColor: isSelected ? `${p.color}20` : 'transparent',
                borderRadius: theme.borderRadius.md,
              },
            ]}
            onPress={() => onChange(p.value)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: p.color },
              ]}
            />
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? p.color : theme.colors.textSecondary,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
            >
              {p.label}
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
    gap: 12,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 14,
  },
})
