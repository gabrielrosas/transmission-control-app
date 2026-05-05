import {
  collection,
  deleteField,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  setDoc,
  startAfter,
  Timestamp,
  updateDoc
} from 'firebase/firestore'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { db } from './firebase'
import { useConfig } from './config'
import type { ConfigHistoryVersion, ConfigSnapshot } from '@renderer/schemas/ConfigHistory'

const PAGE_SIZE = 50

type Page = {
  versions: ConfigHistoryVersion[]
  lastDoc: QueryDocumentSnapshot | null
}

async function fetchPage(userID: string, cursor: QueryDocumentSnapshot | null): Promise<Page> {
  const baseRef = collection(db, 'configs_history', userID, 'versions')
  const q = cursor
    ? query(baseRef, orderBy('createdAt', 'desc'), startAfter(cursor), limit(PAGE_SIZE))
    : query(baseRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
  const snap = await getDocs(q)
  const versions: ConfigHistoryVersion[] = snap.docs.map((d) => {
    const data = d.data()
    const rawConfig = (data.config ?? {}) as Partial<ConfigSnapshot>
    return {
      id: d.id,
      createdAt: (data.createdAt as Timestamp | null) ?? null,
      config: {
        obsConfig: rawConfig.obsConfig ?? null,
        cameraPTZConfig: rawConfig.cameraPTZConfig ?? {},
        presetsAlias: rawConfig.presetsAlias ?? {},
        presetsHidden: rawConfig.presetsHidden ?? {}
      },
      restoredFromId: data.restoredFromId as string | undefined,
      restoredFromCreatedAt: (data.restoredFromCreatedAt as Timestamp | null) ?? undefined
    }
  })
  return {
    versions,
    lastDoc: snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length - 1] : null
  }
}

export function useConfigHistory() {
  const userID = useConfig((state) => state.userID)
  const result = useInfiniteQuery({
    queryKey: ['configHistory', userID],
    enabled: !!userID,
    initialPageParam: null as QueryDocumentSnapshot | null,
    queryFn: ({ pageParam }) => fetchPage(userID!, pageParam),
    getNextPageParam: (lastPage) => lastPage.lastDoc
  })

  const versions = result.data?.pages.flatMap((p) => p.versions) ?? []

  return {
    versions,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    hasMore: !!result.hasNextPage,
    isFetchingMore: result.isFetchingNextPage,
    loadMore: () => result.fetchNextPage(),
    refetch: result.refetch
  }
}

export function useRestoreVersion() {
  const setConfig = useConfig((state) => state.setConfig)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (version: ConfigHistoryVersion) => {
      await toast.promise(
        setConfig(version.config, {
          restoredFromId: version.id,
          restoredFromCreatedAt: version.createdAt
        }),
        {
          loading: 'Restaurando versão...',
          success: 'Versão restaurada com sucesso!',
          error: 'Erro ao restaurar versão'
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configHistory'] })
    }
  })
}

export function useImportConfig() {
  const setConfig = useConfig((state) => state.setConfig)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (config: ConfigSnapshot) => {
      await toast.promise(setConfig(config), {
        loading: 'Importando configuração...',
        success: 'Configuração importada com sucesso!',
        error: 'Erro ao importar configuração'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configHistory'] })
    }
  })
}

export function useCreateVersionNow() {
  const setConfig = useConfig((state) => state.setConfig)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await toast.promise(setConfig({}), {
        loading: 'Criando versão...',
        success: 'Versão criada com sucesso!',
        error: 'Erro ao criar versão'
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configHistory'] })
    }
  })
}

export function useConfigVersionNames(): Record<string, string> {
  const userID = useConfig((state) => state.userID)
  const [names, setNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!userID) {
      setNames({})
      return
    }
    const unsub = onSnapshot(doc(db, 'configs_history_names', userID), (snap) => {
      setNames((snap.data() as Record<string, string> | undefined) || {})
    })
    return () => unsub()
  }, [userID])

  return names
}

export function useSetVersionName() {
  const userID = useConfig((state) => state.userID)
  return useMutation({
    mutationFn: async ({ versionId, name }: { versionId: string; name: string | null }) => {
      if (!userID) throw new Error('Not authenticated')
      const ref = doc(db, 'configs_history_names', userID)
      const trimmed = name?.trim()
      if (trimmed) {
        await setDoc(ref, { [versionId]: trimmed }, { merge: true })
      } else {
        await updateDoc(ref, { [versionId]: deleteField() }).catch(() => {
          // doc didn't exist; field is already absent
        })
      }
    }
  })
}
