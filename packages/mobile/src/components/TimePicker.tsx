import React, { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme } from '../theme'

export interface TimePickerProps {
  value: string
  onChange: (isoString: string) => void
}

// 格式化时间显示 HH:mm
function formatTime(isoString: string): string {
  const d = new Date(isoString)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const theme = useTheme()
  const [showPicker, setShowPicker] = useState(false)

  const dateValue = new Date(value)

  const handleChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false)
    }
    if (selectedDate) {
      // 保留原日期，仅更新小时和分钟
      const original = new Date(value)
      original.setHours(selectedDate.getHours())
      original.setMinutes(selectedDate.getMinutes())
      original.setSeconds(0)
      original.setMilliseconds(0)
      onChange(original.toISOString())
    }
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
        <Text style={styles.icon}>🕐</Text>
        <Text
          style={[
            styles.text,
            { color: theme.colors.text },
          ]}
        >
          {formatTime(value)}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="time"
          is24Hour={true}
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
})
