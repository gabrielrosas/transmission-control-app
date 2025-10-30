import { useMutation, useQuery } from '@tanstack/react-query'
import { type CameraPTZConfig } from '../../schemas/CameraPTZ'
import { createContext, useContext, useMemo, useState } from 'react'
import { useOBS } from '../obs'

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
  const { data, isLoading } = useQuery({
    queryKey: ['ptz', config.id],
    queryFn: () => window.ptz.init(config)
  })

  const presets = useMemo(() => {
    return data?.slice(0, config.presetLimit || 100) || []
  }, [config, data])

  return { control: { config, presets, inProgress, setInProgress }, isLoading, presets, inProgress }
}

export function useGotoPTZ(preset: PTZPreset) {
  const { config, setInProgress } = useContext(PTZContext)
  const changeProgramScene = useOBS((state) => state.changeProgramScene)
  const changePreviewScene = useOBS((state) => state.changePreviewScene)
  const { mutate: gotoPreset, isPending: isGotoPending } = useMutation({
    mutationFn: async (changeScene: boolean) => {
      if (config) {
        setInProgress(true)
        if (!changeScene && config.sceneId) {
          await changePreviewScene(config.sceneId)
          await window.ptz.goto({ id: config.id, preset: preset.id })
        } else if (changeScene && config.axSceneId && config.sceneId) {
          await changeProgramScene(config.axSceneId)
          await window.ptz.goto({ id: config.id, preset: preset.id })
          await new Promise((resolve) => setTimeout(resolve, config.transitionTime || 500))
          await changeProgramScene(config.sceneId)
        } else {
          await window.ptz.goto({ id: config.id, preset: preset.id })
        }
        setInProgress(false)
      }
    }
  })

  return { gotoPreset, isLoading: isGotoPending }
}
