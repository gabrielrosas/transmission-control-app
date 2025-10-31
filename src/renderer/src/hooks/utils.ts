import { useCallback, useRef } from 'react'
import { create } from 'zustand'

type Resolve<T> = (value: T) => void
type Reject = (error: Error) => void

export function usePromise<T>() {
  const resolveRef = useRef<Resolve<T> | null>(null)
  const rejectRef = useRef<Reject | null>(null)

  return {
    startPromise: useCallback(() => {
      return new Promise<T>((resolve, reject) => {
        resolveRef.current = resolve
        rejectRef.current = reject
      })
    }, []),
    resolve: useCallback((value: T) => {
      if (resolveRef.current) {
        resolveRef.current(value)
      } else {
        throw new Error('Promise not started')
      }
    }, []),
    reject: useCallback((error: Error) => {
      if (rejectRef.current) {
        rejectRef.current(error)
      } else {
        throw new Error('Promise not started')
      }
    }, [])
  }
}

type ConfirmProps = {
  title?: string
  description?: string
  labelConfirm?: string
  labelCancel?: string
}
type ConfirmStoreState = ConfirmProps & {
  props: ConfirmProps & {
    open: boolean
    onSubmit: (confirmed: boolean) => void
    setOpen: (confirmed: boolean) => void
  }
  setProps: (props: ConfirmProps) => void
  resolve: (confirmed: boolean) => void
  reject: (error: Error) => void
  confirm: () => Promise<boolean>
}

export const useConfirmStore = create<ConfirmStoreState>((set, get) => ({
  props: {
    open: false,
    title: undefined,
    description: undefined,
    labelConfirm: undefined,
    labelCancel: undefined,
    onSubmit: () => {},
    setOpen: () => {}
  },
  setProps: (newProps: ConfirmProps) => {
    const props = {
      ...newProps,
      open: false,
      onSubmit: (result) => {
        set({ props: { ...get().props, open: false } })
        get().resolve(result)
      },
      setOpen: (open: boolean) => {
        set({ props: { ...get().props, open } })
        if (!open) {
          get().resolve(false)
        }
      }
    }
    set({ props })
  },
  resolve: () => {},
  reject: () => {},
  confirm: () => {
    set({ props: { ...get().props, open: true } })
    return new Promise<boolean>((resolve, reject) => {
      set({ resolve, reject })
    })
  }
}))

export function useConfirm() {
  const { setProps, confirm } = useConfirmStore()

  return useCallback(
    (props: ConfirmProps) => {
      setProps(props)
      return confirm()
    },
    [setProps, confirm]
  )
}
