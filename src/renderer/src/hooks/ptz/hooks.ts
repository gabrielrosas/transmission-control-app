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

type LSPTZImages = {
  [configId: string]: {
    [presetId: string]: string
  }
}

export type PTZPreset = {
  id: string
  name: string
}

export type PTZContextType = {
  config: CameraPTZConfig | null
  presets: PTZPreset[]
  inProgress: boolean
  setInProgress: (inProgress: boolean) => void
  setPresetsHidden: Dispatch<SetStateAction<string[]>>
}

export const PTZContext = createContext<PTZContextType>({
  config: null,
  presets: [],
  inProgress: false,
  setInProgress: () => {},
  setPresetsHidden: () => {}
})

export type PTZPresetContextType = {
  preset: PTZPreset | null
  gotoPreset: (onlyPreview: boolean) => Promise<void>
  loadImage: () => Promise<void>
  clearImage: () => Promise<void>
  image: string | undefined
  inProgress: boolean
}

export const PTZPresetContext = createContext<PTZPresetContextType>({
  preset: null,
  gotoPreset: () => Promise.resolve(),
  loadImage: () => Promise.resolve(),
  clearImage: () => Promise.resolve(),
  image: undefined,
  inProgress: false
})

export function useInitPTZ(config: CameraPTZConfig) {
  const [connected, setConnected] = useState<boolean>(false)
  const [presetsHidden, setPresetsHidden] = useLocalStorage<string[]>(
    `ptz-${config.id}-presets-hidden`,
    []
  )

  useEffect(() => {
    window.ptz.init(config)
    const unsub = window.ptz.onConnected((id) => {
      if (id === config.id) {
        setConnected(true)
      }
    })
    return () => unsub()
  }, [])

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
    () => ({ config, presets, inProgress, setInProgress, setPresetsHidden }),
    [config, presets, inProgress, setInProgress, setPresetsHidden]
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
  const { config, inProgress, setInProgress } = useContext(PTZContext)
  const changeProgramScene = useOBS((state) => state.changeProgramScene)
  const changePreviewScene = useOBS((state) => state.changePreviewScene)
  const programScene = useOBS((state) => state.programScene)
  const getImage = useOBS((state) => state.getImage)
  const isConnected = useOBS((state) => state.isConnected)
  const [images, setImages] = useLocalStorage<LSPTZImages>('ptz-images', {})

  const gotoPresetBase = useCallback(
    async (sendToProgram: boolean) => {
      if (config) {
        if (config.sceneId) {
          if (programScene?.id === config.sceneId && config.axSceneId) {
            await changeProgramScene(config.axSceneId)
          }
          await changePreviewScene(config.sceneId)
        }
        await window.ptz.goto({ id: config.id, preset: preset.id })
        if (sendToProgram && config.sceneId) {
          await new Promise((resolve) => setTimeout(resolve, config.transitionTime || 500))
          await changeProgramScene(config.sceneId)
        }
      } else {
        throw new Error('Config not found')
      }
    },
    [config, preset, changeProgramScene, changePreviewScene, programScene]
  )

  const loadImage = useCallback(async () => {
    const loader = async () => {
      if (config && config.sceneId && isConnected) {
        setInProgress(true)
        await gotoPresetBase(false)
        await new Promise((resolve) => setTimeout(resolve, config.transitionTime || 500))
        const image = await getImage(config.sceneId)
        setImages((prev) => ({
          ...prev,
          [config.id]: {
            ...(prev[config.id] || {}),
            [preset.id]: image
          }
        }))
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
  }, [config, preset, gotoPresetBase, getImage, setImages, isConnected, setInProgress])

  const clearImage = useCallback(async () => {
    if (config) {
      setImages((prev) => {
        const prevConfig = prev[config.id] || {}
        delete prevConfig[preset.id]
        return {
          ...prev,
          [config.id]: prevConfig
        }
      })
      toast.success(`Imagem de ${preset.name} removida com sucesso!`)
    } else {
      throw new Error('Config not found')
    }
  }, [config, preset, setImages])

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

  const image = useMemo(() => {
    if (config && config.sceneId) {
      return images[config.id]?.[preset.id] || undefined
    }
    return undefined
  }, [images, preset, config])

  return {
    inProgress,
    preset,
    gotoPreset,
    loadImage,
    clearImage,
    image
  }
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

export function useClearImages(propsConfig?: CameraPTZConfig) {
  const [, setImages] = useLocalStorage<LSPTZImages>('ptz-images', {})
  return useCallback(
    (config?: CameraPTZConfig) => {
      const configToUse = config || propsConfig
      if (configToUse) {
        setImages((prev) => ({
          ...prev,
          [configToUse.id]: {}
        }))
      }
    },
    [propsConfig, setImages]
  )
}
