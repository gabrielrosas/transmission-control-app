import { Cam as OnvifCam } from 'onvif/promises'
import { BrowserWindow, IpcMain } from 'electron'

function sendMessage(message: string, payload: unknown) {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send(message, payload)
  })
}

export type CameraPTZConfig = {
  id: string
  name: string
  user: string
  ip: string
  port: string
  password: string
}

interface CamBase {
  getPresets: () => Promise<{ id: string; name: string }[]>
  goto: (preset: string) => Promise<void>
  isConnected: boolean
  connect: () => Promise<void>
}

const isDev = process.env.PTZ_CAM_DEV === 'true'
console.log('isDev', isDev)

export class Cam implements CamBase {
  private cam: OnvifCam
  private config: CameraPTZConfig
  isConnected: boolean = false
  presets: { id: string; name: string }[] | undefined = undefined

  constructor(config: CameraPTZConfig) {
    this.config = config
    this.cam = new OnvifCam({
      username: this.config.user,
      password: this.config.password,
      hostname: this.config.ip,
      port: parseInt(this.config.port)
    })
  }

  async connect() {
    try {
      if (!this.isConnected) {
        await this.cam.connect()
        this.isConnected = true
        this.cam.on('event', (event) => {
          sendMessage('ptz:events', { configId: this.config.id, event: JSON.stringify(event) })
        })
      }
      if (this.isConnected) {
        sendMessage('ptz:connected', this.config.id)
      }
    } catch (error) {
      console.error(error)
      this.isConnected = false
      throw error
    }
  }

  async getPresets() {
    try {
      if (this.presets !== undefined) {
        return this.presets
      }
      const presets: Record<string, { name: string }> = await this.cam.getPresets()

      this.presets = Object.entries(presets).map(([id, preset]) => ({
        id,
        name: preset.name
      }))
      return this.presets
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async goto(preset: string) {
    try {
      await this.cam.gotoPreset({ preset })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

class CamMock implements CamBase {
  private config: CameraPTZConfig
  isConnected: boolean = true

  constructor(config: CameraPTZConfig) {
    this.config = config
  }
  async getPresets() {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const presets = Array.from({ length: 30 }, (_, i) => ({
      id: (i + 1).toString(),
      name: `Preset ${i + 1}`
    }))
    return presets
  }
  async goto(preset: string) {
    sendMessage('ptz:events', {
      configId: this.config.id,
      event: 'Goto preset ' + preset + ' started'
    })
    await new Promise((resolve) => setTimeout(resolve, 2000))
    sendMessage('ptz:events', {
      configId: this.config.id,
      event: 'Goto preset ' + preset + ' done'
    })
  }
  async connect() {
    if (!this.isConnected) {
      if (this.config.ip === '1.1.1.1') {
        const error = new Error('Error connecting to camera')
        console.error(error)
        throw error
      }
      this.isConnected = true
    }
    if (this.isConnected) {
      sendMessage('ptz:connected', this.config.id)
    }
  }
}

export class CamStore {
  static cams: Record<string, CamBase> = {}

  static async initCam(config: CameraPTZConfig) {
    try {
      console.log('initCam start', config.id)
      if (CamStore.cams[config.id]) {
        console.log('initCam already initialized', config.id)
        await CamStore.cams[config.id].connect()
        return
      } else {
        console.log('initializing cam', config.id)
        CamStore.cams[config.id] = isDev ? new CamMock(config) : new Cam(config)
        await CamStore.cams[config.id].connect()
      }
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  static getCam(id: string) {
    if (!CamStore.cams[id] || !CamStore.cams[id].isConnected) {
      throw new Error(`Camera ${id} not found`)
    }
    return CamStore.cams[id]
  }
}

export function loadIPCCameraPTZ(ipcMain: IpcMain) {
  ipcMain.handle('ptz:init', (_, config: CameraPTZConfig) => {
    CamStore.initCam(config)
  })

  ipcMain.handle('ptz:getPresets', async (_, id: string) => {
    return CamStore.getCam(id).getPresets()
  })

  ipcMain.handle('ptz:goto', async (_, { id, preset }: { id: string; preset: string }) => {
    return CamStore.getCam(id).goto(preset)
  })
}
