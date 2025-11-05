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

type PTZPresetBase = {
  $: { token: number }
  name: string
  PTZPosition: {
    panTilt: {
      $: {
        x: number
        y: number
      }
    }
    zoom: {
      $: { x: number }
    }
  }
}

export type PTZPosition = {
  x: number
  y: number
  zoom: number
}

export type PTZPreset = {
  id: string
  name: string
  position: PTZPosition
}

interface CamBase {
  getPresets: () => Promise<PTZPreset[]>
  getPosition: () => Promise<PTZPosition>
  goto: (preset: string) => Promise<PTZPosition>
  isConnected: boolean
  connect: () => Promise<void>
}

const isDev = process.env.PTZ_CAM_DEV === 'true'
console.log('isDev', isDev)

export class Cam implements CamBase {
  private cam: OnvifCam
  private config: CameraPTZConfig
  isConnected: boolean = false
  presets: PTZPreset[] | undefined = undefined

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
        sendMessage('ptz:logs', { configId: this.config.id, logs: { presets: this.presets } })
        return this.presets
      }
      const presets: Record<string, PTZPresetBase> = await this.cam.getPresets()
      this.presets = Object.entries(presets).map(([id, preset]) => ({
        id,
        name: preset.name,
        position: {
          x: preset.PTZPosition.panTilt.$.x,
          y: preset.PTZPosition.panTilt.$.y,
          zoom: preset.PTZPosition.zoom.$.x
        }
      }))

      sendMessage('ptz:logs', { configId: this.config.id, logs: { presets: this.presets } })

      return this.presets
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async getPosition() {
    const status = await this.cam.getStatus()
    const position: PTZPosition = {
      x: status.position.x,
      y: status.position.y,
      zoom: status.position.zoom
    }
    return position
  }

  async goto(preset: string) {
    try {
      await this.cam.gotoPreset({ preset })
      const position = await this.getPosition()
      return position
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}

class CamMock implements CamBase {
  private config: CameraPTZConfig
  isConnected: boolean = true
  presets: PTZPreset[] = []
  currentPosition: PTZPosition = { x: 0, y: 0, zoom: 0 }

  constructor(config: CameraPTZConfig) {
    this.config = config
  }
  async getPresets() {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    this.presets = Array.from({ length: 30 }, (_, i) => ({
      id: (i + 1).toString(),
      name: `Preset ${i + 1}`,
      position: {
        x: i,
        y: i,
        zoom: i
      }
    }))
    this.currentPosition = this.presets[0].position
    return this.presets
  }
  async goto(preset: string) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    this.currentPosition = this.presets.find((p) => p.id === preset)?.position || {
      x: 0,
      y: 0,
      zoom: 0
    }
    return this.currentPosition
  }

  async getPosition() {
    return this.currentPosition
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
      setInterval(() => {
        this.currentPosition =
          this.presets[Math.floor(Math.random() * this.presets.length)].position
      }, 60000)
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
  ipcMain.handle('ptz:getPosition', async (_, id: string) => {
    return CamStore.getCam(id).getPosition()
  })
}
