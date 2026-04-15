import NetInfo, { type NetInfoState } from '@react-native-community/netinfo'
import type { INetworkMonitor } from '@mya/shared'
import type { Unsubscribe } from '@mya/shared'

// 防抖延迟：离线→在线时延迟 1 秒再通知（防网络抖动）
const ONLINE_DEBOUNCE_MS = 1000

// ─── 移动端网络监听器（基于 NetInfo） ───

export class RNNetworkMonitor implements INetworkMonitor {
  private online = true
  private unsubscribeNetInfo: (() => void) | null = null
  private listeners: Set<(online: boolean) => void> = new Set()
  private debounceTimer: ReturnType<typeof setTimeout> | null = null

  // 当前网络是否可用
  isOnline(): boolean {
    return this.online
  }

  // 订阅网络状态变化
  subscribe(callback: (online: boolean) => void): Unsubscribe {
    // 首次订阅时启动 NetInfo 监听
    if (this.listeners.size === 0) {
      this.startListening()
    }

    this.listeners.add(callback)

    return () => {
      this.listeners.delete(callback)
      // 所有订阅者取消后停止 NetInfo 监听
      if (this.listeners.size === 0) {
        this.stopListening()
      }
    }
  }

  // 清理资源
  dispose(): void {
    this.stopListening()
    this.listeners.clear()
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }

  // ─── 内部方法 ───

  private startListening(): void {
    // 先获取一次当前状态
    NetInfo.fetch().then((state: NetInfoState) => {
      this.online = state.isConnected ?? false
    })

    // 订阅状态变化
    this.unsubscribeNetInfo = NetInfo.addEventListener((state: NetInfoState) => {
      const isNowOnline = state.isConnected ?? false

      if (isNowOnline === this.online) return // 状态未变化

      if (isNowOnline) {
        // 离线→在线：延迟 1 秒再通知（防抖/防网络抖动）
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer)
        }
        this.debounceTimer = setTimeout(() => {
          this.online = true
          this.notifyListeners(true)
          this.debounceTimer = null
        }, ONLINE_DEBOUNCE_MS)
      } else {
        // 在线→离线：立即通知
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer)
          this.debounceTimer = null
        }
        this.online = false
        this.notifyListeners(false)
      }
    })
  }

  private stopListening(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo()
      this.unsubscribeNetInfo = null
    }
  }

  private notifyListeners(online: boolean): void {
    for (const listener of this.listeners) {
      try {
        listener(online)
      } catch (err) {
        console.error('[RNNetworkMonitor] 监听器回调出错：', err)
      }
    }
  }
}
