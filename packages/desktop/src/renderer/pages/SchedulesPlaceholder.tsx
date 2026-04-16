import React from 'react'
import { Calendar } from 'lucide-react'

export function SchedulesPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <Calendar className="h-16 w-16 opacity-30" />
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">日程</h2>
        <p className="mt-1 text-sm">功能开发中...</p>
      </div>
    </div>
  )
}
