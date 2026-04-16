import { Settings } from 'lucide-react'

export function SettingsPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
      <Settings className="h-16 w-16 opacity-30" />
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">设置</h2>
        <p className="mt-1 text-sm">功能开发中...</p>
      </div>
    </div>
  )
}
