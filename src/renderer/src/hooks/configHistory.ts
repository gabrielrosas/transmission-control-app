import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  Timestamp
} from 'firebase/firestore'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    return {
      id: d.id,
      createdAt: (data.createdAt as Timestamp | null) ?? null,
      config: data.config as ConfigSnapshot,
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
