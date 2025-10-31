import { useMutation, useQuery } from '@tanstack/react-query'
import { type CameraPTZConfig } from '../../schemas/CameraPTZ'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useOBS } from '../obs'
import { useLocalStorage } from 'usehooks-ts'

export type PTZPreset = {
  id: string
  name: string
}

export type PTZContextType = {
  config: CameraPTZConfig | null
  presets: PTZPreset[]
  inProgress: boolean
  setInProgress: (inProgress: boolean) => void
}

export const PTZContext = createContext<PTZContextType>({
  config: null,
  presets: [],
  inProgress: false,
  setInProgress: () => {}
})

export function useInitPTZ(config: CameraPTZConfig) {
  const [inProgress, setInProgress] = useState<boolean>(false)
  const { data, isFetching, isRefetching, error, refetch } = useQuery({
    queryKey: ['ptz', config.id],
    retry: 3,
    queryFn: () => window.ptz.init(config)
  })

  const presets = useMemo(() => {
    return data?.slice(0, config.presetLimit || 100) || []
  }, [config, data])

  return {
    control: { config, presets, inProgress, setInProgress },
    isLoading: isFetching,
    isRefetching,
    presets,
    inProgress,
    error,
    refetch
  }
}

export function useGotoPTZ(preset: PTZPreset, onlyPreview: boolean = false) {
  const { config, setInProgress } = useContext(PTZContext)
  const changeProgramScene = useOBS((state) => state.changeProgramScene)
  const changePreviewScene = useOBS((state) => state.changePreviewScene)
  const programScene = useOBS((state) => state.programScene)
  const loadImage = useLoadImage(preset)
  const { mutate: gotoPreset, isPending: isGotoPending } = useMutation({
    mutationFn: async () => {
      if (config) {
        setInProgress(true)
        if (config.sceneId) {
          if (programScene?.id === config.sceneId && config.axSceneId) {
            await changeProgramScene(config.axSceneId)
          }
          await changePreviewScene(config.sceneId)
          await window.ptz.goto({ id: config.id, preset: preset.id })
          await loadImage()
          if (!onlyPreview) {
            await changeProgramScene(config.sceneId)
          }
        } else {
          await window.ptz.goto({ id: config.id, preset: preset.id })
        }
        setInProgress(false)
      }
    }
  })

  return { gotoPreset, isLoading: isGotoPending }
}

export function useGotoPTZPreview(preset: PTZPreset) {
  return useGotoPTZ(preset, true)
}

type LSPTZImages = {
  [configId: string]: {
    [presetId: string]: string
  }
}

export function useLoadImage(preset: PTZPreset) {
  const { config } = useContext(PTZContext)
  const [images, setImages] = useLocalStorage<LSPTZImages>('ptz-images', {})

  const getImage = useOBS((state) => state.getImage)
  const isConnected = useOBS((state) => state.isConnected)

  return useCallback(async () => {
    if (config && config.sceneId) {
      if (images[config.id]?.[preset.id]) {
        return
      }
      await new Promise((resolve) => setTimeout(resolve, config.transitionTime || 500))
      if (isConnected) {
        const image = await getImage(config.sceneId)
        setImages((prev) => ({
          ...prev,
          [config.id]: {
            ...(prev[config.id] || {}),
            [preset.id]: image
          }
        }))
      }
    }
  }, [config, preset, getImage, setImages, isConnected, images])
}

export function useClearImages(config: CameraPTZConfig) {
  const [, setImages] = useLocalStorage<LSPTZImages>('ptz-images', {})
  return useCallback(() => {
    if (config) {
      setImages((prev) => ({
        ...prev,
        [config.id]: {}
      }))
    }
  }, [config, setImages])
}

export function useGetImage(preset: PTZPreset) {
  const { config } = useContext(PTZContext)
  const [images] = useLocalStorage<LSPTZImages>('ptz-images', {})

  return useMemo(() => {
    if (config && config.sceneId) {
      return images[config.id]?.[preset.id] || undefined
    }
    return undefined
  }, [images, preset, config])
}
