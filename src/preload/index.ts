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
  goto: (values: { id: string; preset: string }) => ipcRenderer.invoke('ptz:goto', values),
  onConnected: (callback: (id: string) => void) => {
    const listener = (_event, payload) => callback(payload)
    ipcRenderer.on('ptz:connected', listener)
    return () => ipcRenderer.off('ptz:connected', listener)
  }
}

const clipboard = {
  writeText: (text: string) => ipcRenderer.invoke('clipboard:writeText', text)
}

const imageCache = {
  save: (props: { base64: string; folder: string; filename: string }) =>
    ipcRenderer.invoke('imageCache:save', props),
  clear: (props: { folder: string; filename: string }) =>
    ipcRenderer.invoke('imageCache:clear', props),
  get: (props: { folder: string; filename: string }) => ipcRenderer.invoke('imageCache:get', props),
  clearFolder: (props: { folder: string }) => ipcRenderer.invoke('imageCache:clearFolder', props)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('ptz', ptz)
    contextBridge.exposeInMainWorld('clipboard', clipboard)
    contextBridge.exposeInMainWorld('imageCache', imageCache)
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
  // @ts-ignore (define in dts)
  window.imageCache = imageCache
}
