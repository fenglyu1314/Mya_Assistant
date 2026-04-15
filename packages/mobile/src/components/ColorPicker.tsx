import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useTheme } from '../theme'

export interface ColorPickerProps {
  value: string | null
  onChange: (color: string | null) => void
}

// 8 种预设颜色
const PRESET_COLORS = [
  '#4A90D9', // 蓝色
  '#E74C3C', // 红色
  '#2ECC71', // 绿色
  '#F39C12', // 橙色
  '#9B59B6', // 紫色
  '#1ABC9C', // 青色
  '#E91E63', // 粉色
  '#607D8B', // 灰蓝色
]

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const theme = useTheme()

  const handlePress = (color: string) => {
    // 再次点击已选中的颜色则取消选择
    if (value === color) {
      onChange(null)
    } else {
      onChange(color)
    }
  }

  return (
    <View style={styles.container}>
      {PRESET_COLORS.map((color) => {
        const isSelected = value === color
        return (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorBlock,
              {
                backgroundColor: color,
                borderRadius: theme.borderRadius.sm,
                borderColor: isSelected ? theme.colors.text : 'transparent',
                borderWidth: isSelected ? 2 : 0,
              },
            ]}
            onPress={() => handlePress(color)}
            activeOpacity={0.7}
          >
            {isSelected && (
              <Text style={styles.checkMark}>✓</Text>
            )}
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
    gap: 10,
  },
  colorBlock: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
})
