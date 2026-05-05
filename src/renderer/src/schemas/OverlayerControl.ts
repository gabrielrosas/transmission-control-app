import z from 'zod'

const CONTROL_URL_REGEX = /^https:\/\/app\.overlays\.uno\/control\/([A-Za-z0-9_-]+)$/

export const OverlayerControlSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Nome é obrigatório'),
  url: z
    .string()
    .min(1, 'URL é obrigatória')
    .regex(CONTROL_URL_REGEX, 'URL inválida (esperado https://app.overlays.uno/control/...)')
})

export type OverlayerControl = z.infer<typeof OverlayerControlSchema>

/**
 * A slot inside an overlays.uno overlay, discovered at runtime via GetOverlays.
 * Not persisted — the source of truth is the user's overlays.uno config.
 *
 * In overlays.uno terminology: each "overlay" (e.g. "Lower") contains multiple
 * "slots" (e.g. "Celebrante", "Padre Clayto...") that are alternative content
 * presets. Playing a slot means making it the active one in its overlay.
 */
export type OverlayerItem = {
  id: string // synthesized: `${overlayId}__${slotId}` — used as React key
  name: string // slot name shown to the user
  overlayId: string // parent overlay's id, needed for ShowOverlay/HideOverlay
  slotName: string // slot name passed to TakeOverlaySlotName
  slotPayload: Record<string, unknown> // raw slot payload — used internally to match GetOverlayContent → active slot
}

export function parseOverlayUnoControlUrl(url: string): { appId: string } | null {
  const match = url.match(CONTROL_URL_REGEX)
  if (!match) return null
  return { appId: match[1] }
}

export function apiUrlFromAppId(appId: string): string {
  return `https://app.overlays.uno/apiv2/controlapps/${appId}/api`
}

export function apiUrlFromControlUrl(url: string): string | null {
  const parsed = parseOverlayUnoControlUrl(url)
  return parsed ? apiUrlFromAppId(parsed.appId) : null
}
