import { type OBSConfig } from '../schemas/OBSConfig'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect } from 'react'
import { db, useAuth } from './firebase'
import { create } from 'zustand'
import { CameraPTZConfig } from '@renderer/schemas/CameraPTZ'

interface Config {
  obsConfig: OBSConfig | null
  cameraPTZConfig: Record<string, CameraPTZConfig>
}
const initialConfig: Config = {
  obsConfig: null,
  cameraPTZConfig: {}
}

type ConfigContextType = {
  config: Config
  userID: string | null
  load: boolean
  setConfig: (config: Partial<Config>) => Promise<void>
  setContextConfig: (config: Config) => void
  setUserID: (userID: string) => void
}

export const useConfig = create<ConfigContextType>((set, get) => ({
  config: initialConfig,
  userID: null,
  load: false,
  setContextConfig: (config) => set({ config, load: true }),
  setConfig: async (newConfig) => {
    const userID = get().userID
    const config = get().config
    if (!userID) return
    await setDoc(doc(db, 'configs', userID), {
      ...config,
      ...newConfig
    } as Config)
  },
  setUserID: (userID) => set({ userID })
}))

export function useConfigInit() {
  const user = useAuth((state) => state.user)
  const setConfig = useConfig((state) => state.setConfig)
  const setContextConfig = useConfig((state) => state.setContextConfig)
  const setUserID = useConfig((state) => state.setUserID)
  const load = useConfig((state) => state.load)

  useEffect(() => {
    if (!user) return
    setUserID(user.uid)
    const unsub = onSnapshot(
      doc(db, 'configs', user.uid),
      (doc) => {
        const config = doc.data() as Config | undefined
        if (config) {
          setContextConfig(config)
        } else {
          setConfig(initialConfig)
        }
      },
      () => {
        setConfig(initialConfig)
      }
    )
    return () => unsub()
  }, [user, setConfig, setContextConfig, setUserID])

  return load
}
