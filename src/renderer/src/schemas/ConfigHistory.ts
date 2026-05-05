import z from 'zod'
import { Timestamp } from 'firebase/firestore'
import { OBSConfigSchema, type OBSConfig } from './OBSConfig'
import { CameraPTZConfigSchema, type CameraPTZConfig } from './CameraPTZ'
import { OverlayerControlSchema, type OverlayerControl } from './OverlayerControl'

export const ConfigSnapshotSchema = z.object({
  obsConfig: OBSConfigSchema.nullable(),
  cameraPTZConfig: z.record(z.string(), CameraPTZConfigSchema),
  presetsAlias: z.record(z.string(), z.string()).optional().default({}),
  presetsHidden: z.record(z.string(), z.array(z.string())).optional().default({}),
  overlayerControls: z.record(z.string(), OverlayerControlSchema).optional().default({})
})

export type ConfigSnapshot = {
  obsConfig: OBSConfig | null
  cameraPTZConfig: Record<string, CameraPTZConfig>
  presetsAlias: Record<string, string>
  presetsHidden: Record<string, string[]>
  overlayerControls: Record<string, OverlayerControl>
}

export type ConfigHistoryVersion = {
  id: string
  createdAt: Timestamp | null
  config: ConfigSnapshot
  restoredFromId?: string
  restoredFromCreatedAt?: Timestamp | null
}
