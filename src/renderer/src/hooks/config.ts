import { type OBSConfig } from '../schemas/OBSConfig'
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore'
import { useEffect } from 'react'
import { db, useAuth } from './firebase'
import { create } from 'zustand'
import { CameraPTZConfig } from '@renderer/schemas/CameraPTZ'
import { OverlayerControl } from '@renderer/schemas/OverlayerControl'

interface Config {
  obsConfig: OBSConfig | null
  cameraPTZConfig: Record<string, CameraPTZConfig>
  presetsAlias: Record<string, string>
  presetsHidden: Record<string, string[]>
  overlayerControls: Record<string, OverlayerControl>
}
const initialConfig: Config = {
  obsConfig: null,
  cameraPTZConfig: {},
  presetsAlias: {},
  presetsHidden: {},
  overlayerControls: {}
}

type SetConfigOptions = {
  restoredFromId?: string
  restoredFromCreatedAt?: Timestamp | null
}

type ConfigContextType = {
  config: Config
  userID: string | null
  load: boolean
  setConfig: (config: Partial<Config>, opts?: SetConfigOptions) => Promise<void>
  setContextConfig: (config: Config) => void
  setUserID: (userID: string) => void
}

async function seedConfig(userID: string, config: Config) {
  await setDoc(doc(db, 'configs', userID), config)
}

export const useConfig = create<ConfigContextType>((set, get) => ({
  config: initialConfig,
  userID: null,
  load: false,
  setContextConfig: (config) => set({ config, load: true }),
  setConfig: async (newConfig, opts) => {
    const userID = get().userID
    const config = get().config
    if (!userID) return
    const merged: Config = { ...config, ...newConfig }
    const batch = writeBatch(db)
    batch.set(doc(db, 'configs', userID), merged)
    const historyRef = doc(collection(db, 'configs_history', userID, 'versions'))
    const historyData: Record<string, unknown> = {
      createdAt: serverTimestamp(),
      config: merged
    }
    if (opts?.restoredFromId) {
      historyData.restoredFromId = opts.restoredFromId
      if (opts.restoredFromCreatedAt) {
        historyData.restoredFromCreatedAt = opts.restoredFromCreatedAt
      }
    }
    batch.set(historyRef, historyData)
    await batch.commit()
  },
  setUserID: (userID) => set({ userID })
}))

export function useConfigInit() {
  const user = useAuth((state) => state.user)
  const setContextConfig = useConfig((state) => state.setContextConfig)
  const setUserID = useConfig((state) => state.setUserID)
  const load = useConfig((state) => state.load)

  useEffect(() => {
    if (!user) return
    setUserID(user.uid)
    const unsub = onSnapshot(
      doc(db, 'configs', user.uid),
      (doc) => {
        const config = doc.data() as Partial<Config> | undefined
        if (config) {
          setContextConfig({ ...initialConfig, ...config })
        } else {
          seedConfig(user.uid, initialConfig)
        }
      },
      () => {
        seedConfig(user.uid, initialConfig)
      }
    )
    return () => unsub()
  }, [user, setContextConfig, setUserID])

  return load
}
