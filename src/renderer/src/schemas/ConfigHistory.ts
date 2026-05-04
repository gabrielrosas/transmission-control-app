import z from 'zod'
import { Timestamp } from 'firebase/firestore'
import { OBSConfigSchema, type OBSConfig } from './OBSConfig'
import { CameraPTZConfigSchema, type CameraPTZConfig } from './CameraPTZ'

export const ConfigSnapshotSchema = z.object({
  obsConfig: OBSConfigSchema.nullable(),
  cameraPTZConfig: z.record(z.string(), CameraPTZConfigSchema)
})

export type ConfigSnapshot = {
  obsConfig: OBSConfig | null
  cameraPTZConfig: Record<string, CameraPTZConfig>
}

export type ConfigHistoryVersion = {
  id: string
  createdAt: Timestamp | null
  config: ConfigSnapshot
  restoredFromId?: string
  restoredFromCreatedAt?: Timestamp | null
}
