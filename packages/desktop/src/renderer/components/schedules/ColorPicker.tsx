import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

// 8 种预设颜色
const PRESET_COLORS = [
  '#4A90D9', // 蓝色
  '#E74C3C', // 红色
  '#2ECC71', // 绿色
  '#F39C12', // 橙色
  '#9B59B6', // 紫色
  '#1ABC9C', // 青色
  '#E91E63', // 粉色
  '#607D8B', // 灰蓝
]

interface ColorPickerProps {
  value: string | null
  onChange: (color: string | null) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex gap-2">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full transition-transform hover:scale-110',
            value === color && 'ring-2 ring-offset-2 ring-primary',
          )}
          style={{ backgroundColor: color }}
          onClick={() => onChange(value === color ? null : color)}
          title={color}
        >
          {value === color && <Check className="h-3.5 w-3.5 text-white" />}
        </button>
      ))}
    </div>
  )
}
