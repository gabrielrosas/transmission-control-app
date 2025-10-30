import { Cam as OnvifCam } from 'onvif/promises'

export type CameraPTZConfig = {
  id: string
  name: string
  user: string
  ip: string
  port: string
  password: string
  sceneId?: string | null | undefined
}

interface CamBase {
  getPresets: () => Promise<{ id: string; name: string }[]>
  goto: (preset: string) => Promise<void>
  isConnected: boolean
  connect: () => Promise<void>
}

const isDev = false

export class Cam implements CamBase {
  private cam: OnvifCam
  private config: CameraPTZConfig
  isConnected: boolean = false

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
      await this.cam.connect()
      this.isConnected = true
    } catch (error) {
      console.error(error)
      this.isConnected = false
      throw error
    }
  }

  async getPresets() {
    try {
      const presets: Record<string, { name: string; ['$']: { token: number } }> =
        await this.cam.getPresets()

      return Object.entries(presets).map(([id, preset]) => ({
        id,
        name: preset.name
      }))
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
  isConnected: boolean = true
  constructor() {
    this.isConnected = false
  }
  async getPresets() {
    console.log('getPresets mock start')
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const presets = Array.from({ length: 30 }, (_, i) => ({
      id: (i + 1).toString(),
      name: `Preset ${i + 1}`
    }))
    console.log('getPresets mock done')
    return presets
  }
  async goto(preset: string) {
    console.log('goto mock start', preset)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    console.log('goto mock done', preset)
  }
  async connect() {
    this.isConnected = true
  }
}

export class CamStore {
  static cams: Record<string, CamBase> = {}

  static async init(config: CameraPTZConfig) {
    try {
      if (CamStore.cams[config.id]) {
        if (!CamStore.cams[config.id].isConnected) {
          await CamStore.cams[config.id].connect()
        }
        return CamStore.cams[config.id].getPresets()
      }
      const cam = isDev ? new CamMock() : new Cam(config)
      CamStore.cams[config.id] = cam
      await cam.connect()
      return cam.getPresets()
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  static get(id: string) {
    if (!CamStore.cams[id] || !CamStore.cams[id].isConnected) {
      throw new Error(`Camera ${id} not found`)
    }
    return CamStore.cams[id]
  }
}
