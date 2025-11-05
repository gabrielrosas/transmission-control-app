import { ElectronAPI } from '@electron-toolkit/preload'

type CameraPTZConfig = {
  id: string
  name: string
  user: string
  ip: string
  port: string
  password: string
}

type PTZPosition = {
  x: number
  y: number
  zoom: number
}

type PTZPreset = {
  id: string
  name: string
  position: PTZPosition
}

declare global {
  interface Window {
    electron: ElectronAPI
    ptz: {
      init: (config: CameraPTZConfig) => void
      getPresets: (id: string) => Promise<PTZPreset[]>
      goto: ({ id, preset }: { id: string; preset: string }) => Promise<void>
      getPosition: (id: string) => Promise<PTZPosition>
      onConnected: (callback: (id: string) => void) => () => void
      onLogs: (callback: (event: { configId: string; logs: unknown }) => void) => () => void
    }
    clipboard: {
      writeText: (text: string) => Promise<void>
    }
    imageCache: {
      save: ({
        base64,
        folder,
        filename
      }: {
        base64: string
        folder: string
        filename: string
      }) => Promise<void>
      clear: ({ folder, filename }: { folder: string; filename: string }) => Promise<boolean>
      get: ({
        folder,
        filename
      }: {
        folder: string
        filename: string
      }) => Promise<string | undefined>
      clearFolder: ({ folder }: { folder: string }) => Promise<boolean>
    }
  }
}
