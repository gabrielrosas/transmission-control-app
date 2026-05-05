import { Subtitle } from './titles'
import { Tag } from './Tag'
import { OBSIcon } from './icons/obs'
import { Webcam, Plus, Minus, Pencil, ArrowRight, EyeOff, Layers } from 'lucide-react'
import type { ConfigSnapshot } from '@renderer/schemas/ConfigHistory'
import type { OBSConfig } from '@renderer/schemas/OBSConfig'
import type { CameraPTZConfig } from '@renderer/schemas/CameraPTZ'
import type { OverlayerControl } from '@renderer/schemas/OverlayerControl'

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

type AliasDiff =
  | { key: string; kind: 'edited'; cameraName: string; presetId: string; from: string; to: string }
  | { key: string; kind: 'added'; cameraName: string; presetId: string; to: string }
  | { key: string; kind: 'removed'; cameraName: string; presetId: string; from: string }

function findCameraForAliasKey(
  key: string,
  cameras: Record<string, CameraPTZConfig>
): { camera: CameraPTZConfig; presetId: string } | null {
  for (const [cameraId, camera] of Object.entries(cameras)) {
    if (key.startsWith(cameraId + '-')) {
      return { camera, presetId: key.slice(cameraId.length + 1) }
    }
  }
  return null
}

function diffPresetsAlias(
  current: Record<string, string>,
  target: Record<string, string>,
  cameras: Record<string, CameraPTZConfig>
): AliasDiff[] {
  const allKeys = Array.from(new Set([...Object.keys(current), ...Object.keys(target)]))
  const result: AliasDiff[] = []
  for (const key of allKeys) {
    const a = current[key]
    const b = target[key]
    if (a === b) continue
    const found = findCameraForAliasKey(key, cameras)
    const cameraName = found?.camera.name || 'Câmera removida'
    const presetId = found?.presetId || key
    if (a !== undefined && b !== undefined) {
      result.push({ key, kind: 'edited', cameraName, presetId, from: a, to: b })
    } else if (b !== undefined) {
      result.push({ key, kind: 'added', cameraName, presetId, to: b })
    } else if (a !== undefined) {
      result.push({ key, kind: 'removed', cameraName, presetId, from: a })
    }
  }
  return result
}

type HiddenDiff = {
  cameraId: string
  cameraName: string
  added: string[]
  removed: string[]
}

function diffPresetsHidden(
  current: Record<string, string[]>,
  target: Record<string, string[]>,
  cameras: Record<string, CameraPTZConfig>
): HiddenDiff[] {
  const cameraIds = Array.from(new Set([...Object.keys(current), ...Object.keys(target)]))
  const result: HiddenDiff[] = []
  for (const cameraId of cameraIds) {
    const a = new Set(current[cameraId] ?? [])
    const b = new Set(target[cameraId] ?? [])
    const added = [...b].filter((x) => !a.has(x))
    const removed = [...a].filter((x) => !b.has(x))
    if (added.length === 0 && removed.length === 0) continue
    const camera = cameras[cameraId]
    result.push({
      cameraId,
      cameraName: camera?.name || 'Câmera removida',
      added,
      removed
    })
  }
  return result
}

const OVERLAYER_FIELD_LABELS: Record<'name' | 'url', string> = {
  name: 'Nome',
  url: 'URL'
}

type OverlayerEntry =
  | { id: string; kind: 'added'; control: OverlayerControl }
  | { id: string; kind: 'removed'; control: OverlayerControl }
  | {
      id: string
      kind: 'edited'
      control: OverlayerControl
      fields: FieldDiff[]
    }

function diffOverlayerControls(
  current: Record<string, OverlayerControl>,
  target: Record<string, OverlayerControl>
): OverlayerEntry[] {
  const ids = Array.from(new Set([...Object.keys(current), ...Object.keys(target)]))
  const result: OverlayerEntry[] = []
  for (const id of ids) {
    const a = current[id]
    const b = target[id]
    if (a && !b) result.push({ id, kind: 'removed', control: a })
    else if (!a && b) result.push({ id, kind: 'added', control: b })
    else if (a && b) {
      const fields: FieldDiff[] = []
      if (a.name !== b.name) {
        fields.push({
          key: 'name',
          label: OVERLAYER_FIELD_LABELS.name,
          from: a.name || '—',
          to: b.name || '—'
        })
      }
      if (a.url !== b.url) {
        fields.push({
          key: 'url',
          label: OVERLAYER_FIELD_LABELS.url,
          from: a.url || '—',
          to: b.url || '—'
        })
      }
      if (fields.length > 0) {
        result.push({ id, kind: 'edited', control: b, fields })
      }
    }
  }
  return result
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

  const allCameras = { ...target.cameraPTZConfig, ...current.cameraPTZConfig }
  const aliasDiff = diffPresetsAlias(
    current.presetsAlias || {},
    target.presetsAlias || {},
    allCameras
  )
  const hiddenDiff = diffPresetsHidden(
    current.presetsHidden || {},
    target.presetsHidden || {},
    allCameras
  )
  const overlayerDiff = diffOverlayerControls(
    current.overlayerControls || {},
    target.overlayerControls || {}
  )

  if (
    obsDiff.length === 0 &&
    cameraEntries.length === 0 &&
    aliasDiff.length === 0 &&
    hiddenDiff.length === 0 &&
    overlayerDiff.length === 0
  ) {
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

      {aliasDiff.length > 0 && (
        <div className="flex flex-col gap-1">
          <Subtitle icon={Pencil}>Aliases de presets</Subtitle>
          <div className="flex flex-col gap-1 border border-border rounded p-2">
            {aliasDiff.map((d) => (
              <div key={d.key} className="flex flex-row items-center gap-2 text-xs py-1">
                <div className="text-muted-foreground shrink-0">
                  {d.cameraName} · preset {d.presetId}
                </div>
                <div className="grow" />
                <div className="line-through opacity-60 truncate max-w-[120px]">
                  {d.kind === 'added' ? '—' : d.from}
                </div>
                <ArrowRight className="size-3 opacity-50 shrink-0" />
                <div className="truncate max-w-[120px]">{d.kind === 'removed' ? '—' : d.to}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hiddenDiff.length > 0 && (
        <div className="flex flex-col gap-1">
          <Subtitle icon={EyeOff}>Presets ocultos</Subtitle>
          <div className="flex flex-col gap-2 border border-border rounded p-2">
            {hiddenDiff.map((d) => (
              <div key={d.cameraId} className="text-xs flex flex-col gap-0.5">
                <div className="font-medium">{d.cameraName}</div>
                {d.added.length > 0 && (
                  <div className="opacity-70">Ocultar: {d.added.join(', ')}</div>
                )}
                {d.removed.length > 0 && (
                  <div className="opacity-70">Mostrar: {d.removed.join(', ')}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {overlayerDiff.length > 0 && (
        <div className="flex flex-col gap-1">
          <Subtitle icon={Layers}>Controles de overlayer</Subtitle>
          <div className="flex flex-col gap-2">
            {overlayerDiff.map((entry) => (
              <div key={entry.id} className="border border-border rounded p-2">
                <div className="flex flex-row items-center gap-2 mb-1">
                  <div className="text-sm font-medium grow">{entry.control.name || 'Sem nome'}</div>
                  {entry.kind === 'added' && (
                    <Tag label="Adicionado" icon={Plus} variant="success" />
                  )}
                  {entry.kind === 'removed' && (
                    <Tag label="Removido" icon={Minus} variant="error" />
                  )}
                  {entry.kind === 'edited' && <Tag label="Editado" icon={Pencil} />}
                </div>
                {entry.kind === 'edited' &&
                  entry.fields.map((d) => (
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
