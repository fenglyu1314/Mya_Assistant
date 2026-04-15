import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme } from '../theme'

export interface DatePickerProps {
  value: string | null
  onChange: (date: string | null) => void
  placeholder?: string
}

export function DatePicker({ value, onChange, placeholder = '选择日期' }: DatePickerProps) {
  const theme = useTheme()
  const [showPicker, setShowPicker] = useState(false)

  // 将 ISO 字符串转为 Date 对象
  const dateValue = value ? new Date(value) : new Date()

  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false)
    }
    if (selectedDate) {
      onChange(selectedDate.toISOString())
    }
  }

  const handleClear = () => {
    onChange(null)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.inputArea,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.borderRadius.md,
          },
        ]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>📅</Text>
        <Text
          style={[
            styles.text,
            {
              color: value ? theme.colors.text : theme.colors.textSecondary,
            },
          ]}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        {value && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.clearBtn, { color: theme.colors.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {},
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    flex: 1,
    fontSize: 14,
  },
  clearBtn: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
})
