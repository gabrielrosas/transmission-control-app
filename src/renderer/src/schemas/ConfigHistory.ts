import z from 'zod'
import { Timestamp } from 'firebase/firestore'
import { OBSConfigSchema, type OBSConfig } from './OBSConfig'
import { CameraPTZConfigSchema, type CameraPTZConfig } from './CameraPTZ'

export const ConfigSnapshotSchema = z.object({
  obsConfig: OBSConfigSchema.nullable(),
  cameraPTZConfig: z.record(z.string(), CameraPTZConfigSchema),
  presetsAlias: z.record(z.string(), z.string()).optional().default({}),
  presetsHidden: z.record(z.string(), z.array(z.string())).optional().default({})
})

export type ConfigSnapshot = {
  obsConfig: OBSConfig | null
  cameraPTZConfig: Record<string, CameraPTZConfig>
  presetsAlias: Record<string, string>
  presetsHidden: Record<string, string[]>
}

export type ConfigHistoryVersion = {
  id: string
  createdAt: Timestamp | null
  config: ConfigSnapshot
  restoredFromId?: string
  restoredFromCreatedAt?: Timestamp | null
}
