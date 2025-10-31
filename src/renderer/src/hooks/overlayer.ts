import { Overlayer } from '@renderer/schemas/Overlayer'
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore'
import { create } from 'zustand'
import { db, useAuth } from './firebase'
import { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

type OverlayerStore = {
  overlayers: Record<string, Overlayer>
  userID: string | null
  load: boolean
  output: Overlayer | null
  setLocalOutput: (output: Overlayer | null) => void
  setOutput: (output: Overlayer | null, replace?: boolean) => Promise<void>
  setLocalOverlayers: (overlayers: Record<string, Overlayer>) => void
  setOverlayers: (overlayers: Record<string, Overlayer>) => Promise<void>
  updateOverlayer: (overlayer: Overlayer) => Promise<Overlayer>
  deleteOverlayer: (id: string) => Promise<void>
  addOverlayer: () => Promise<Overlayer>
  setUserID: (userID: string) => void
}

export const useOverlayer = create<OverlayerStore>((set, get) => ({
  overlayers: {},
  userID: null,
  load: false,
  output: null,
  setLocalOutput: (output) => set({ output }),
  setOutput: async (output, replace = false) => {
    const userID = get().userID
    if (!userID) throw new Error('User ID is required')
    if (output) {
      if (replace) {
        await setDoc(doc(db, 'overlayers_outputs', userID), output)
      } else {
        const newOutput = get().output?.id === output.id ? null : output
        if (newOutput) {
          await setDoc(doc(db, 'overlayers_outputs', userID), newOutput)
        } else {
          await deleteDoc(doc(db, 'overlayers_outputs', userID))
        }
      }
    } else {
      await deleteDoc(doc(db, 'overlayers_outputs', userID))
    }
  },
  setLocalOverlayers: (overlayers) => set({ overlayers, load: true }),
  setOverlayers: async (newOverlayers) => {
    const userID = get().userID
    if (!userID) throw new Error('User ID is required')

    const overlayers = get().overlayers
    await setDoc(doc(db, 'overlayers', userID), {
      ...overlayers,
      ...newOverlayers
    })
  },
  updateOverlayer: async (overlayer: Overlayer) => {
    const userID = get().userID
    if (!userID) throw new Error('User ID is required')

    const overlayers = get().overlayers
    overlayers[overlayer.id] = overlayer
    await setDoc(doc(db, 'overlayers', userID), overlayers)
    return overlayer
  },
  deleteOverlayer: async (id: string) => {
    const userID = get().userID
    if (!userID) throw new Error('User ID is required')

    const overlayers = get().overlayers
    delete overlayers[id]
    await setDoc(doc(db, 'overlayers', userID), overlayers)
  },
  addOverlayer: async () => {
    const userID = get().userID
    if (!userID) throw new Error('User ID is required')

    const overlayers = get().overlayers
    const newOverlayer = { id: uuidv4(), name: '', title: null, text: '' }
    await setDoc(doc(db, 'overlayers', userID), {
      ...overlayers,
      ...{ [newOverlayer.id]: newOverlayer }
    })
    return newOverlayer
  },
  setUserID: (userID) => set({ userID })
}))

export function useOverlayerInit() {
  const user = useAuth((state) => state.user)
  const setLocalOverlayers = useOverlayer((state) => state.setLocalOverlayers)
  const setOverlayers = useOverlayer((state) => state.setOverlayers)
  const setUserID = useOverlayer((state) => state.setUserID)
  const setLocalOutput = useOverlayer((state) => state.setLocalOutput)
  const setOutput = useOverlayer((state) => state.setOutput)
  const load = useOverlayer((state) => state.load)

  useEffect(() => {
    if (!user) return
    setUserID(user.uid)
    const unsubControls = onSnapshot(doc(db, 'overlayers', user.uid), (doc) => {
      const overlayers = doc.data() as Record<string, Overlayer> | undefined
      if (overlayers) {
        setLocalOverlayers(overlayers)
      } else {
        setOverlayers({})
      }
    })
    const unsubOutput = onSnapshot(doc(db, 'overlayers_outputs', user.uid), (doc) => {
      const output = doc.data() as Overlayer | undefined
      if (output) {
        setLocalOutput(output)
      } else {
        setLocalOutput(null)
      }
    })
    return () => {
      unsubControls()
      unsubOutput()
    }
  }, [user, setLocalOverlayers, setOverlayers, setUserID, setLocalOutput, setOutput])

  return load
}
