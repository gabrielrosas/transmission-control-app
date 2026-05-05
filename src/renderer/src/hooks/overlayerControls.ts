import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { create } from 'zustand'
import {
  apiUrlFromControlUrl,
  type OverlayerControl,
  type OverlayerItem
} from '@renderer/schemas/OverlayerControl'

type PlayingItemsState = {
  playing: Record<string, OverlayerItem | null>
  setPlaying: (controlId: string, item: OverlayerItem | null) => void
}

export const usePlayingItems = create<PlayingItemsState>((set) => ({
  playing: {},
  setPlaying: (controlId, item) =>
    set((state) => ({ playing: { ...state.playing, [controlId]: item } }))
}))

async function takeSlot(apiUrl: string, overlayId: string, slotName: string): Promise<void> {
  await window.overlays.put({
    apiUrl,
    payload: { command: 'TakeOverlaySlotName', id: overlayId, value: slotName }
  })
}

async function showOverlay(apiUrl: string, overlayId: string): Promise<void> {
  await window.overlays.put({
    apiUrl,
    payload: { command: 'ShowOverlay', id: overlayId }
  })
}

async function hideOverlay(apiUrl: string, overlayId: string): Promise<void> {
  await window.overlays.put({
    apiUrl,
    payload: { command: 'HideOverlay', id: overlayId }
  })
}

export type OverlaysData = {
  items: OverlayerItem[]
  /** overlayId → visible (true if currently on-air according to the API) */
  visibility: Record<string, boolean>
  /** overlayId → overlay display name */
  overlayNames: Record<string, string>
  /** overlayId → active slot (resolved via GetOverlayContent), null if not detectable */
  activeSlots: Record<string, OverlayerItem | null>
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return false
  if (typeof a !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const arrA = a as unknown[]
    const arrB = b as unknown[]
    if (arrA.length !== arrB.length) return false
    return arrA.every((v, i) => deepEqual(v, arrB[i]))
  }
  const aKeys = Object.keys(a as Record<string, unknown>)
  const bKeys = Object.keys(b as Record<string, unknown>)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((k) =>
    deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
  )
}

function unwrapApiPayload(raw: unknown): unknown {
  if (typeof raw === 'object' && raw !== null && 'payload' in raw) {
    return (raw as { payload: unknown }).payload
  }
  return raw
}

/**
 * The GetOverlays response is wrapped in { status, result, payload: [...] },
 * where each payload entry is an overlay with a `slots[]` array. We flatten
 * slots into individual items, each tagged with its parent overlay id, and
 * also expose per-overlay visibility so the renderer can sync local play
 * state with what's actually on-air.
 */
type ParsedOverlays = Omit<OverlaysData, 'activeSlots'>

function parseOverlaysResponse(raw: unknown): ParsedOverlays {
  const root = unwrapApiPayload(raw)

  if (!Array.isArray(root)) {
    throw new Error(
      `Não consegui interpretar a resposta da overlays.uno. JSON: ${JSON.stringify(raw).slice(0, 400)}`
    )
  }

  const items: OverlayerItem[] = []
  const visibility: Record<string, boolean> = {}
  const overlayNames: Record<string, string> = {}
  for (const overlay of root) {
    if (typeof overlay !== 'object' || overlay === null) continue
    const overlayId = (overlay as { id?: unknown }).id
    if (typeof overlayId !== 'string') continue
    const visible = (overlay as { visible?: unknown }).visible
    visibility[overlayId] = visible === true
    const overlayName = (overlay as { name?: unknown }).name
    if (typeof overlayName === 'string') {
      overlayNames[overlayId] = overlayName
    }
    const slots = (overlay as { slots?: unknown }).slots
    if (!Array.isArray(slots)) continue
    for (const slot of slots) {
      if (typeof slot !== 'object' || slot === null) continue
      const slotId = (slot as { id?: unknown }).id
      const slotName = (slot as { name?: unknown }).name
      if (typeof slotId !== 'string' || typeof slotName !== 'string') continue
      const slotPayloadRaw = (slot as { payload?: unknown }).payload
      const slotPayload =
        typeof slotPayloadRaw === 'object' && slotPayloadRaw !== null
          ? (slotPayloadRaw as Record<string, unknown>)
          : {}
      items.push({
        id: `${overlayId}__${slotId}`,
        name: slotName,
        overlayId,
        slotName,
        slotPayload
      })
    }
  }
  return { items, visibility, overlayNames }
}

async function fetchActiveSlot(
  apiUrl: string,
  overlayId: string,
  candidates: OverlayerItem[]
): Promise<OverlayerItem | null> {
  try {
    const raw = await window.overlays.put({
      apiUrl,
      payload: { command: 'GetOverlayContent', id: overlayId }
    })
    const content = unwrapApiPayload(raw)
    const match = candidates.find((item) => deepEqual(item.slotPayload, content))
    return match ?? null
  } catch {
    return null
  }
}

async function fetchOverlays(apiUrl: string): Promise<OverlaysData> {
  const raw = await window.overlays.put({ apiUrl, payload: { command: 'GetOverlays' } })
  const parsed = parseOverlaysResponse(raw)

  // Pra cada overlay visível, descobre qual slot está ativa via GetOverlayContent.
  const visibleIds = Object.entries(parsed.visibility)
    .filter(([, v]) => v)
    .map(([id]) => id)

  const activeSlots: Record<string, OverlayerItem | null> = {}
  await Promise.all(
    visibleIds.map(async (overlayId) => {
      const candidates = parsed.items.filter((i) => i.overlayId === overlayId)
      activeSlots[overlayId] = await fetchActiveSlot(apiUrl, overlayId, candidates)
    })
  )

  return { ...parsed, activeSlots }
}

export function useOverlayItems(control: OverlayerControl) {
  const apiUrl = apiUrlFromControlUrl(control.url)
  return useQuery({
    queryKey: ['overlayer-items', control.id, apiUrl],
    enabled: !!apiUrl,
    queryFn: () => fetchOverlays(apiUrl!),
    staleTime: 30_000,
    retry: 1
  })
}

export function usePlayItem() {
  const setPlaying = usePlayingItems((s) => s.setPlaying)
  const playing = usePlayingItems((s) => s.playing)

  return useMutation({
    mutationFn: async ({ control, item }: { control: OverlayerControl; item: OverlayerItem }) => {
      const apiUrl = apiUrlFromControlUrl(control.url)
      if (!apiUrl) throw new Error('URL do controle inválida')

      const current = playing[control.id]
      if (current && current.overlayId !== item.overlayId) {
        // best-effort hide do overlay anterior antes de mudar pra outro
        await hideOverlay(apiUrl, current.overlayId).catch(() => {})
      }

      await toast.promise(
        (async () => {
          await takeSlot(apiUrl, item.overlayId, item.slotName)
          await showOverlay(apiUrl, item.overlayId)
        })(),
        {
          loading: `Exibindo ${item.name}...`,
          success: `${item.name} no ar`,
          error: `Erro ao exibir ${item.name}`
        }
      )
      setPlaying(control.id, item)
    }
  })
}

export function useStopItem() {
  const setPlaying = usePlayingItems((s) => s.setPlaying)
  const playing = usePlayingItems((s) => s.playing)

  return useMutation({
    mutationFn: async ({ control }: { control: OverlayerControl }) => {
      const apiUrl = apiUrlFromControlUrl(control.url)
      if (!apiUrl) throw new Error('URL do controle inválida')

      const current = playing[control.id]
      if (!current) return

      await toast.promise(hideOverlay(apiUrl, current.overlayId), {
        loading: `Ocultando ${current.name}...`,
        success: `${current.name} oculto`,
        error: 'Erro ao ocultar'
      })
      setPlaying(control.id, null)
    }
  })
}
