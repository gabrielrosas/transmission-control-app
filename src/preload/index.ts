import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

type CameraPTZConfig = {
  id: string
  name: string
  user: string
  ip: string
  port: string
  password: string
  sceneId?: string | null | undefined
}

const ptz = {
  init: (config: CameraPTZConfig) => ipcRenderer.invoke('ptz:init', config),
  getPresets: (id: string) => ipcRenderer.invoke('ptz:getPresets', id),
  goto: (values: { id: string; preset: string }) => ipcRenderer.invoke('ptz:goto', values)
}

const clipboard = {
  writeText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('ptz', ptz)
    contextBridge.exposeInMainWorld('clipboard', clipboard)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.ptz = ptz
  // @ts-ignore (define in dts)
  window.clipboard = clipboard
}
