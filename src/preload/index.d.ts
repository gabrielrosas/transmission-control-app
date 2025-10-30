import { ElectronAPI } from '@electron-toolkit/preload'

type CameraPTZConfig = {
  id: string
  name: string
  user: string
  ip: string
  port: string
  password: string
}
declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
    ptz: {
      init: (config: CameraPTZConfig) => Promise<{ id: string; name: string }[]>
      getPresets: (id: string) => Promise<{ id: string; name: string }[]>
      goto: ({ id, preset }: { id: string; preset: string }) => Promise<void>
    }
  }
}
