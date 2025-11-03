import { create } from 'zustand'

import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  type User,
  onAuthStateChanged
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { useEffect } from 'react'

const firebaseConfig = {
  apiKey: 'AIzaSyDMDX5jsWausTKqrqQYWubdKFcNr6apg-c',
  authDomain: 'transmissao-f65a0.firebaseapp.com',
  projectId: 'transmissao-f65a0',
  storageBucket: 'transmissao-f65a0.firebasestorage.app',
  messagingSenderId: '993593537871',
  appId: '1:993593537871:web:90a58859a0aa8c47a1813a',
  measurementId: 'G-ND1RB8NRH1'
}

export const app = initializeApp(firebaseConfig)
export const analytics = getAnalytics(app)
export const db = getFirestore(app)
const auth = getAuth()

type AuthState = {
  user: User | null
  isLoad: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  setAuth: (user: User | null) => void
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoad: false,
  setAuth: (user: User | null) => set({ user: user, isLoad: true }),
  signUp: async (email: string, password: string) => {
    const auth = getAuth()
    await createUserWithEmailAndPassword(auth, email, password)
  },
  signIn: async (email: string, password: string) => {
    const user = get().user
    if (!user) {
      await signInWithEmailAndPassword(auth, email, password)
    }
  },
  signOut: async () => {
    await signOut(auth)
  }
}))

export function useAuthInit() {
  const isLoad = useAuth((state) => state.isLoad)
  const user = useAuth((state) => state.user)
  const setAuth = useAuth((state) => state.setAuth)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuth(user)
      } else {
        setAuth(null)
      }
    })
    return () => unsub()
  }, [])

  return { isLoad, isSignedIn: user !== null }
}
