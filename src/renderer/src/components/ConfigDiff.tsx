import { Subtitle } from './titles'
import { Tag } from './Tag'
import { OBSIcon } from './icons/obs'
import { Webcam, Plus, Minus, Pencil, ArrowRight } from 'lucide-react'
import type { ConfigSnapshot } from '@renderer/schemas/ConfigHistory'
import type { OBSConfig } from '@renderer/schemas/OBSConfig'
import type { CameraPTZConfig } from '@renderer/schemas/CameraPTZ'

type Props = {
  current: ConfigSnapshot
  target: ConfigSnapshot
}

const PASSWORD_MASK = '••••'

const OBS_FIELD_LABELS: Record<keyof OBSConfig, string> = {
  ip: 'IP',
  port: 'Porta',
  password: 'Senha',
  ignoreSceneList: 'Cenas ignoradas'
}

const CAMERA_FIELD_LABELS: Record<keyof CameraPTZConfig, string> = {
  id: 'ID',
  name: 'Nome',
  user: 'Usuário',
  ip: 'IP',
  port: 'Porta',
  password: 'Senha',
  sceneId: 'Cena OBS',
  axSceneId: 'Cena auxiliar',
  transitionTime: 'Transição (ms)',
  presetLimit: 'Limite de presets',
  positionRefreshTime: 'Atualizar posição'
}

function isPasswordField(key: string) {
  return key === 'password'
}

function formatValue(key: string, value: unknown): string {
  if (isPasswordField(key)) {
    return value ? PASSWORD_MASK : '—'
  }
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.length === 0 ? '—' : `${value.length} item(s)`
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  return String(value)
}

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => v === b[i])
  }
  return a === b
}

type FieldDiff = { key: string; label: string; from: string; to: string }

function diffOBS(current: OBSConfig | null, target: OBSConfig | null): FieldDiff[] {
  if (!current && !target) return []
  const a = current || ({} as Partial<OBSConfig>)
  const b = target || ({} as Partial<OBSConfig>)
  const keys = Object.keys(OBS_FIELD_LABELS) as (keyof OBSConfig)[]
  return keys
    .filter((k) => !shallowEqual(a[k], b[k]))
    .map((k) => ({
      key: k,
      label: OBS_FIELD_LABELS[k],
      from: formatValue(k, a[k]),
      to: formatValue(k, b[k])
    }))
}

function diffCamera(
  current: CameraPTZConfig | undefined,
  target: CameraPTZConfig | undefined
): FieldDiff[] {
  const a = current || ({} as Partial<CameraPTZConfig>)
  const b = target || ({} as Partial<CameraPTZConfig>)
  const keys = Object.keys(CAMERA_FIELD_LABELS).filter(
    (k) => k !== 'id'
  ) as (keyof CameraPTZConfig)[]
  return keys
    .filter((k) => !shallowEqual(a[k], b[k]))
    .map((k) => ({
      key: k,
      label: CAMERA_FIELD_LABELS[k],
      from: formatValue(k, a[k]),
      to: formatValue(k, b[k])
    }))
}

function FieldRow({ label, from, to }: { label: string; from: string; to: string }) {
  return (
    <div className="flex flex-row items-center gap-2 text-xs py-1">
      <div className="w-[110px] text-muted-foreground">{label}</div>
      <div className="flex-1 text-right line-through opacity-60">{from}</div>
      <ArrowRight className="size-3 opacity-50" />
      <div className="flex-1">{to}</div>
    </div>
  )
}

export function ConfigDiff({ current, target }: Props) {
  const obsDiff = diffOBS(current.obsConfig, target.obsConfig)

  const cameraIds = Array.from(
    new Set([
      ...Object.keys(current.cameraPTZConfig || {}),
      ...Object.keys(target.cameraPTZConfig || {})
    ])
  )

  type CameraEntry =
    | { id: string; kind: 'added'; camera: CameraPTZConfig }
    | { id: string; kind: 'removed'; camera: CameraPTZConfig }
    | { id: string; kind: 'edited'; camera: CameraPTZConfig; diff: FieldDiff[] }

  const cameraEntries: CameraEntry[] = cameraIds.flatMap<CameraEntry>((id) => {
    const a = current.cameraPTZConfig?.[id]
    const b = target.cameraPTZConfig?.[id]
    if (a && !b) return [{ id, kind: 'removed', camera: a }]
    if (!a && b) return [{ id, kind: 'added', camera: b }]
    if (a && b) {
      const fields = diffCamera(a, b)
      if (fields.length === 0) return []
      return [{ id, kind: 'edited', camera: b, diff: fields }]
    }
    return []
  })

  if (obsDiff.length === 0 && cameraEntries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Nenhuma diferença — esta versão é igual à configuração atual.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {obsDiff.length > 0 && (
        <div className="flex flex-col gap-1">
          <Subtitle icon={OBSIcon}>OBS</Subtitle>
          <div className="border border-border rounded p-2">
            {obsDiff.map((d) => (
              <FieldRow key={d.key} label={d.label} from={d.from} to={d.to} />
            ))}
          </div>
        </div>
      )}

      {cameraEntries.length > 0 && (
        <div className="flex flex-col gap-1">
          <Subtitle icon={Webcam}>Câmeras</Subtitle>
          <div className="flex flex-col gap-2">
            {cameraEntries.map((entry) => (
              <div key={entry.id} className="border border-border rounded p-2">
                <div className="flex flex-row items-center gap-2 mb-1">
                  <div className="text-sm font-medium grow">{entry.camera.name || 'Sem nome'}</div>
                  {entry.kind === 'added' && (
                    <Tag label="Adicionada" icon={Plus} variant="success" />
                  )}
                  {entry.kind === 'removed' && (
                    <Tag label="Removida" icon={Minus} variant="error" />
                  )}
                  {entry.kind === 'edited' && <Tag label="Editada" icon={Pencil} />}
                </div>
                {entry.kind === 'edited' &&
                  entry.diff.map((d) => (
                    <FieldRow key={d.key} label={d.label} from={d.from} to={d.to} />
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
