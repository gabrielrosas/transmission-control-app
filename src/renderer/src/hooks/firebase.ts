import { create } from 'zustand'

import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import {
  GoogleAuthProvider,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  type User
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)

type AuthState = {
  user: User | null
  isLoad: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  load: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoad: false,
  load: async () => {
    const auth = getAuth()
    await new Promise((resolve) => setTimeout(resolve, 1000))
    if (auth.currentUser) {
      set({ user: auth.currentUser, isLoad: true })
    } else {
      set({ user: null, isLoad: true })
    }
  },
  signUp: async (email: string, password: string) => {
    const auth = getAuth()
    const result = await createUserWithEmailAndPassword(auth, email, password)
    set({ user: result.user, isLoad: true })
  },
  signIn: async (email: string, password: string) => {
    const auth = getAuth()
    if (auth.currentUser) {
      set({ user: auth.currentUser, isLoad: true })
    } else {
      const result = await signInWithEmailAndPassword(auth, email, password)
      set({ user: result.user, isLoad: true })
    }
  },
  signOut: async () => {
    const auth = getAuth()
    await signOut(auth)
    set({ user: null, isLoad: true })
  }
}))
