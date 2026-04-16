import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

// 预设提醒选项（分钟数）
const REMIND_OPTIONS: { label: string; value: number }[] = [
  { label: '无提醒', value: -1 },
  { label: '事件时', value: 0 },
  { label: '5 分钟前', value: 5 },
  { label: '15 分钟前', value: 15 },
  { label: '30 分钟前', value: 30 },
  { label: '1 小时前', value: 60 },
  { label: '1 天前', value: 1440 },
]

interface RemindPickerProps {
  // 选中的分钟数列表
  value: number[]
  onChange: (value: number[]) => void
}

export function RemindPicker({ value, onChange }: RemindPickerProps) {
  function handleToggle(minutes: number) {
    // 选择「无提醒」清除其他
    if (minutes === -1) {
      onChange([])
      return
    }

    // 选择其他选项时移除「无提醒」
    const isSelected = value.includes(minutes)
    if (isSelected) {
      onChange(value.filter((v) => v !== minutes))
    } else {
      onChange([...value, minutes])
    }
  }

  const isNone = value.length === 0

  return (
    <div className="flex flex-wrap gap-2">
      {REMIND_OPTIONS.map((option) => {
        const selected = option.value === -1 ? isNone : value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleToggle(option.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
              selected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input hover:bg-accent',
            )}
          >
            {selected && <Check className="h-3 w-3" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
