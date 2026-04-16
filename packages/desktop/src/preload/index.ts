import { contextBridge } from 'electron'

// 通过 contextBridge 向 renderer 暴露有限的 API
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.env.npm_package_version ?? '0.0.1',
})
