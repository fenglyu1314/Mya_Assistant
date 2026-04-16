// 声明 electronAPI 类型，供 renderer 进程使用
interface ElectronAPI {
  platform: string
  version: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
