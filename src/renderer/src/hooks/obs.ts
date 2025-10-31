import OBSWebSocket from 'obs-websocket-js'
import { useEffect } from 'react'
import { useConfig } from './config'
import { type OBSConfig } from '../schemas/OBSConfig'

import { create } from 'zustand'

export type OBSScene = {
  name: string
  id: string
  order?: number
}

export type OBSState = {
  config: OBSConfig | null
  isLoading: boolean
  isConnected: boolean
  scenes: OBSScene[]
  programScene: OBSScene | null
  previewScene: OBSScene | null
}
export type OBSActions = {
  setState: (data: Partial<OBSState>) => void
  changeProgramScene: (sceneId: string) => Promise<void>
  changePreviewScene: (sceneId: string) => Promise<void>
  reloadScenes: () => Promise<void>
  getImage: (sceneId: string) => Promise<string>
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class OBSConnectionStore {
  static connection: OBSWebSocket | null = null
  static config: OBSConfig | null = null

  static get() {
    if (OBSConnectionStore.connection) {
      return OBSConnectionStore.connection
    }
    throw new Error('Not connected to OBS')
  }

  static async init(
    config: OBSConfig,
    setState: (state: Partial<OBSState>) => void,
    force: boolean = false
  ) {
    if ((OBSConnectionStore.config != null && OBSConnectionStore.config != config) || force) {
      await OBSConnectionStore.disconnect(setState)
    }

    if (OBSConnectionStore.config === null) {
      setState({
        isLoading: true,
        isConnected: false
      })

      OBSConnectionStore.config = config
      OBSConnectionStore.connection = new OBSWebSocket()

      OBSConnectionStore.connection
        .on('ConnectionOpened', () => {
          console.log('Connected to OBS')
          delay(2000).then(() => {
            OBSConnectionStore.connection!.call('GetSceneList').then((scenes) => {
              setState({
                isLoading: false,
                isConnected: true,
                scenes: scenes.scenes.map((scene) => ({
                  order: scene.sceneIndex as number,
                  name: scene.sceneName as string,
                  id: scene.sceneUuid as string
                })),
                programScene: {
                  name: scenes.currentProgramSceneName as string,
                  id: scenes.currentProgramSceneUuid as string
                },
                previewScene: {
                  name: scenes.currentPreviewSceneName as string,
                  id: scenes.currentPreviewSceneUuid as string
                }
              })
            })
          })
        })
        .on('ConnectionClosed', () => {
          console.log('Disconnected from OBS')
          setState({
            isConnected: false,
            isLoading: false,
            scenes: [],
            programScene: null,
            previewScene: null
          })
        })
        .on('CurrentProgramSceneChanged', (data) => {
          setState({
            programScene: {
              name: data.sceneName as string,
              id: data.sceneUuid as string
            }
          })
        })
        .on('CurrentPreviewSceneChanged', (data) => {
          setState({
            previewScene: {
              name: data.sceneName as string,
              id: data.sceneUuid as string
            }
          })
        })
        .on('SceneListChanged', (data) => {
          setState({
            scenes: data.scenes.map((scene) => ({
              order: scene.sceneIndex as number,
              name: scene.sceneName as string,
              id: scene.sceneUuid as string
            }))
          })
        })

      await OBSConnectionStore.connection.connect(
        `ws://${config.ip}:${config.port}`,
        config.password
      )
    }
  }

  static async disconnect(setState: (state: Partial<OBSState>) => void) {
    if (OBSConnectionStore.connection && OBSConnectionStore.config) {
      await OBSConnectionStore.connection.disconnect()
      OBSConnectionStore.connection = null
      OBSConnectionStore.config = null
      setState({
        isLoading: false,
        isConnected: false
      })
    }
  }
}

export const useOBS = create<OBSState & OBSActions>((set, get) => ({
  config: null,
  isLoading: false,
  isConnected: false,
  scenes: [],
  programScene: null,
  previewScene: null,
  setState: (data) => set({ ...data }),
  changeProgramScene: async (sceneId: string) => {
    if (get().isConnected) {
      await OBSConnectionStore.get().call('SetCurrentProgramScene', {
        sceneUuid: sceneId
      })
    }
  },
  changePreviewScene: async (sceneId: string) => {
    if (get().isConnected) {
      await OBSConnectionStore.get().call('SetCurrentPreviewScene', {
        sceneUuid: sceneId
      })
    }
  },
  reloadScenes: async () => {
    const config = get().config
    if (!get().isConnected && config) {
      await OBSConnectionStore.init(config, set, true)
    } else {
      await OBSConnectionStore.get()
        .call('GetSceneList')
        .then((scenes) => {
          set({
            scenes: scenes.scenes.map((scene) => ({
              order: scene.sceneIndex as number,
              name: scene.sceneName as string,
              id: scene.sceneUuid as string
            }))
          })
        })
    }
  },
  getImage: async (sceneId: string) => {
    if (get().isConnected) {
      const response = await OBSConnectionStore.get().call('GetSourceScreenshot', {
        sourceUuid: sceneId,
        imageFormat: 'png'
      })
      return response.imageData
    }
    throw new Error('Not connected to OBS')
  }
}))

export function useOBSInit() {
  const obsConfig = useConfig((state) => state.config.obsConfig)

  const setState = useOBS((state) => state.setState)

  useEffect(() => {
    setState({ config: obsConfig })
    if (obsConfig) {
      OBSConnectionStore.init(obsConfig, setState)
    } else {
      OBSConnectionStore.disconnect(setState)
    }
  }, [obsConfig, setState])
}
