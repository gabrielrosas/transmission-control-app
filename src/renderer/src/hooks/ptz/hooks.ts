import { useMutation, useQuery } from '@tanstack/react-query'
import { type CameraPTZConfig } from '../../schemas/CameraPTZ'
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { useOBS } from '../obs'
import { useLocalStorage } from 'usehooks-ts'
import toast from 'react-hot-toast'

export type PTZPreset = {
  id: string
  name: string
  position: PTZPosition
}

export type PTZPosition = {
  x: number
  y: number
  zoom: number
}

export type PTZContextType = {
  config: CameraPTZConfig | null
  presets: PTZPreset[]
  inProgress: boolean
  setInProgress: (inProgress: boolean) => void
  setPresetsHidden: Dispatch<SetStateAction<string[]>>
  position: PTZPosition | undefined
  setPosition: (position: PTZPosition) => void
}

export const PTZContext = createContext<PTZContextType>({
  config: null,
  presets: [],
  inProgress: false,
  setInProgress: () => {},
  setPresetsHidden: () => {},
  position: undefined,
  setPosition: () => {}
})

export type PTZPresetContextType = {
  preset: PTZPreset | null
  gotoPreset: (onlyPreview: boolean) => Promise<void>
  loadImage: () => Promise<void>
  clearImage: () => Promise<void>
  image: string | undefined
  inProgress: boolean
  tooltipEnabled: boolean
  setTooltipEnabled: (tooltipEnabled: boolean) => void
  selectedPreset: undefined | 'program' | 'preview'
}

export const PTZPresetContext = createContext<PTZPresetContextType>({
  preset: null,
  gotoPreset: () => Promise.resolve(),
  loadImage: () => Promise.resolve(),
  clearImage: () => Promise.resolve(),
  image: undefined,
  inProgress: false,
  tooltipEnabled: false,
  setTooltipEnabled: () => {},
  selectedPreset: undefined
})

function comparePosition(position1: PTZPosition, position2: PTZPosition) {
  return (
    position1.x === position2.x && position1.y === position2.y && position1.zoom === position2.zoom
  )
}

export function useInitPTZ(config: CameraPTZConfig) {
  const [connected, setConnected] = useState<boolean>(false)
  const [position, setPosition] = useState<PTZPosition | undefined>(undefined)
  const [presetsHidden, setPresetsHidden] = useLocalStorage<string[]>(
    `ptz-${config.id}-presets-hidden`,
    []
  )

  useEffect(() => {
    window.ptz.init(config)
    const unsubEvents = window.ptz.onLogs((event) => {
      if (event.configId === config.id) {
        console.log(`[PTZ] ${config.id}`, event.logs)
      }
    })
    const unsub = window.ptz.onConnected((id) => {
      if (id === config.id) {
        setConnected(true)
      }
    })
    return () => {
      unsub()
      unsubEvents()
    }
  }, [])

  useEffect(() => {
    if (connected && config && config.positionRefreshTime) {
      const timer = setInterval(() => {
        window.ptz.getPosition(config.id).then((position) => {
          console.log('position refresh', position)
          setPosition(position)
        })
      }, config.transitionTime || 5000)
      return () => clearInterval(timer)
    }
    return () => {}
  }, [config, connected])

  const [inProgress, setInProgress] = useState<boolean>(false)
  const { data, isFetching, isRefetching, error, refetch } = useQuery({
    queryKey: ['ptz', config.id],
    enabled: connected,
    refetchOnWindowFocus: false,
    retry: 3,
    queryFn: () => window.ptz.getPresets(config.id)
  })

  const allPresets = useMemo(() => {
    return data?.slice(0, config.presetLimit || 100) || []
  }, [config, data])

  const presets = useMemo(() => {
    return allPresets.filter((preset) => !presetsHidden.includes(preset.id))
  }, [allPresets, presetsHidden])

  const control = useMemo<PTZContextType>(
    () => ({
      config,
      presets,
      inProgress,
      setInProgress,
      setPresetsHidden,
      position,
      setPosition
    }),
    [config, presets, inProgress, setInProgress, setPresetsHidden, position, setPosition]
  )

  return {
    control,
    isLoading: isFetching || !connected,
    isRefetching,
    presets,
    allPresets,
    inProgress,
    error,
    refetch
  }
}

export function useClearHiddenPresets(config: CameraPTZConfig) {
  const [hiddenPresets, setHiddenPresets] = useLocalStorage<string[]>(
    `ptz-${config.id}-presets-hidden`,
    []
  )
  const clearHiddenPresets = useCallback(() => {
    setHiddenPresets([])
  }, [setHiddenPresets])

  return {
    hiddenPresets,
    clearHiddenPresets
  }
}

export function useInitPTZPreset(preset: PTZPreset): PTZPresetContextType {
  const { config, inProgress, setInProgress, setPosition, position } = useContext(PTZContext)
  const changeProgramScene = useOBS((state) => state.changeProgramScene)
  const changePreviewScene = useOBS((state) => state.changePreviewScene)
  const programScene = useOBS((state) => state.programScene)
  const previewScene = useOBS((state) => state.previewScene)
  const getImage = useOBS((state) => state.getImage)
  const isConnected = useOBS((state) => state.isConnected)
  const [image, setImage] = useState<string | undefined>(undefined)
  const [tooltipEnabled, setTooltipEnabled] = useState<boolean>(true)

  const selectedPreset = useMemo(() => {
    if (position && config && config.positionRefreshTime) {
      if (comparePosition(preset.position, position)) {
        if (previewScene?.id === config.sceneId) {
          return 'preview'
        }
        if (programScene?.id === config.sceneId) {
          return 'program'
        }
      }
    }
    return undefined
  }, [preset, position, previewScene, programScene, config])

  useEffect(() => {
    window.imageCache
      .get({ folder: `ptz-${config?.id}`, filename: `preset_${preset.id}.png` })
      .then((image) => {
        setImage(image)
      })
      .catch(() => {
        setImage(undefined)
      })
  }, [config, preset])

  const gotoPresetBase = useCallback(
    async (sendToProgram: boolean) => {
      if (config) {
        if (config.sceneId) {
          if (programScene?.id === config.sceneId && config.axSceneId) {
            await changeProgramScene(config.axSceneId)
          }
          await changePreviewScene(config.sceneId)
        }
        const currentPosition = await window.ptz.getPosition(config.id)
        if (!comparePosition(currentPosition, preset.position)) {
          const position = await window.ptz.goto({ id: config.id, preset: preset.id })
          setPosition(position)
          if (sendToProgram && config.sceneId) {
            await new Promise((resolve) => setTimeout(resolve, config.transitionTime || 500))
            await changeProgramScene(config.sceneId)
          }
        } else {
          setPosition(currentPosition)
          if (sendToProgram && config.sceneId) {
            await changeProgramScene(config.sceneId)
          }
        }
      } else {
        throw new Error('Config not found')
      }
    },
    [config, preset, changeProgramScene, changePreviewScene, programScene, setPosition]
  )

  const loadImage = useCallback(async () => {
    const loader = async () => {
      if (config && config.sceneId && isConnected) {
        setInProgress(true)
        await gotoPresetBase(false)
        await new Promise((resolve) => setTimeout(resolve, config.transitionTime || 500))
        const image = await getImage(config.sceneId)
        await window.imageCache.save({
          folder: `ptz-${config.id}`,
          filename: `preset_${preset.id}.png`,
          base64: image
        })
        setImage(image)
        setInProgress(false)
      } else {
        throw new Error('Config not found or not connected')
      }
    }

    await toast.promise(loader, {
      loading: `Carregando imagem de ${preset.name}...`,
      success: 'Imagem carregada com sucesso!',
      error: 'Erro ao carregar imagem'
    })
  }, [config, preset, gotoPresetBase, getImage, isConnected, setInProgress])

  const clearImage = useCallback(async () => {
    toast.promise(
      window.imageCache
        .clear({ folder: `ptz-${config?.id}`, filename: `preset_${preset.id}.png` })
        .then(() => {
          setImage(undefined)
        }),
      {
        loading: `Removendo imagem de ${preset.name}...`,
        success: `Imagem de ${preset.name} removida com sucesso!`,
        error: `Erro ao remover imagem de ${preset.name}`
      }
    )
  }, [preset, config])

  const gotoPreset = useCallback(
    async (onlyPreview: boolean) => {
      await toast.promise(
        async () => {
          setInProgress(true)
          await gotoPresetBase(onlyPreview)
          setInProgress(false)
        },
        {
          loading: `Indo para ${preset.name}...`,
          error: `Erro ao ir para ${preset.name}`
        }
      )
    },
    [gotoPresetBase, preset, setInProgress]
  )

  return {
    inProgress,
    preset,
    gotoPreset,
    loadImage,
    clearImage,
    image,
    tooltipEnabled,
    setTooltipEnabled,
    selectedPreset
  }
}

export function useSelectedPreset() {
  const { selectedPreset } = useContext(PTZPresetContext)
  return selectedPreset
}

export function useGotoPreset() {
  const { gotoPreset: gotoPresetBase } = useContext(PTZPresetContext)

  const { mutate: gotoPreset, isPending: isGotoPending } = useMutation({
    mutationFn: gotoPresetBase
  })

  return { gotoPreset, isLoading: isGotoPending }
}

export function useImagePreset() {
  const { loadImage, image, clearImage } = useContext(PTZPresetContext)
  return {
    loadImage,
    image,
    clearImage
  }
}

export function useHidePreset() {
  const { preset } = useContext(PTZPresetContext)
  const { setPresetsHidden } = useContext(PTZContext)
  return useCallback(() => {
    setPresetsHidden((prev) => [...prev, preset!.id])
  }, [setPresetsHidden, preset])
}

export function usePresetData() {
  const { preset, image, inProgress } = useContext(PTZPresetContext)
  return {
    id: preset!.id,
    name: preset!.name,
    image,
    inProgress
  }
}

export function useTooltipPreset() {
  const { tooltipEnabled, setTooltipEnabled } = useContext(PTZPresetContext)
  return {
    tooltipEnabled,
    setTooltipEnabled
  }
}

export function useClearImages(propsConfig?: CameraPTZConfig) {
  return useCallback(
    async (config?: CameraPTZConfig) => {
      const configToUse = config || propsConfig
      if (configToUse) {
        await window.imageCache.clearFolder({ folder: `ptz-${configToUse.id}` })
      }
    },
    [propsConfig]
  )
}
