import z from 'zod'
import { ConfigSnapshotSchema, type ConfigSnapshot } from '@renderer/schemas/ConfigHistory'

export const EXPORT_FORMAT_VERSION = 1

const ExportedFileSchema = z.object({
  version: z.literal(EXPORT_FORMAT_VERSION),
  exportedAt: z.string(),
  config: ConfigSnapshotSchema
})

export function downloadConfigFile(config: ConfigSnapshot, filename: string): void {
  const payload = {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    config
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function parseConfigFile(text: string): ConfigSnapshot {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error('Arquivo inválido: não é um JSON válido')
  }
  if (typeof raw === 'object' && raw !== null && 'version' in raw) {
    const v = (raw as { version: unknown }).version
    if (typeof v === 'number' && v !== EXPORT_FORMAT_VERSION) {
      throw new Error(`Arquivo de versão ${v} não suportado (esperado ${EXPORT_FORMAT_VERSION})`)
    }
  }
  const parsed = ExportedFileSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error('Arquivo inválido: estrutura não corresponde ao esperado')
  }
  return parsed.data.config
}
