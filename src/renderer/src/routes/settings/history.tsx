import { ChangeEvent, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Download,
  History,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Trash,
  Upload
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from 'zod'
import toast from 'react-hot-toast'
import { Content } from '@renderer/components/containers'
import { Title } from '@renderer/components/titles'
import { Button } from '@renderer/components/Button'
import { GroupButton } from '@renderer/components/GroupButton'
import { Dialog } from '@renderer/components/Dialog'
import { Tag } from '@renderer/components/Tag'
import { FormControl, TextField } from '@renderer/components/form'
import { ConfigDiff } from '@renderer/components/ConfigDiff'
import { useConfig } from '@renderer/hooks/config'
import {
  useConfigHistory,
  useConfigVersionNames,
  useImportConfig,
  useRestoreVersion,
  useSetVersionName
} from '@renderer/hooks/configHistory'
import type { ConfigHistoryVersion, ConfigSnapshot } from '@renderer/schemas/ConfigHistory'
import { downloadConfigFile, parseConfigFile } from '@renderer/libs/configFile'
import type { Timestamp } from 'firebase/firestore'

function formatTimestamp(ts: Timestamp | null): string {
  if (!ts) return '—'
  const date = ts.toDate()
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatShortTimestamp(ts: Timestamp | null): string {
  if (!ts) return '—'
  const date = ts.toDate()
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function filenameTimestamp(ts: Timestamp | null): string {
  const date = ts ? ts.toDate() : new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}`
}

export function HistoryPage() {
  const { versions, isLoading, hasMore, isFetchingMore, loadMore } = useConfigHistory()
  const names = useConfigVersionNames()
  const [selected, setSelected] = useState<ConfigHistoryVersion | null>(null)
  const [importTarget, setImportTarget] = useState<ConfigSnapshot | null>(null)
  const [renameTarget, setRenameTarget] = useState<ConfigHistoryVersion | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const config = parseConfigFile(text)
      setImportTarget(config)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao ler arquivo')
    }
  }

  const handleDownload = (version: ConfigHistoryVersion) => {
    downloadConfigFile(
      version.config,
      `transmission-config-${filenameTimestamp(version.createdAt)}.json`
    )
  }

  return (
    <Content.Container className="h-full">
      <Content.Header>
        <Title icon={History}>Histórico</Title>
      </Content.Header>
      <Content.Content className="grow min-h-0 overflow-auto no-scrollbar flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          onChange={handleFile}
          className="hidden"
        />
        <Button
          icon={Upload}
          variant="defaultOutline"
          onClick={() => fileInputRef.current?.click()}
          full
        >
          Importar configuração
        </Button>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}

        {!isLoading && versions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">
            Nenhuma versão no histórico ainda. Altere uma configuração para começar.
          </p>
        )}

        {versions.map((version, index) => (
          <VersionRow
            key={version.id}
            version={version}
            name={names[version.id]}
            isCurrent={index === 0}
            onRestore={() => setSelected(version)}
            onDownload={() => handleDownload(version)}
            onRename={() => setRenameTarget(version)}
          />
        ))}

        {hasMore && (
          <Button
            icon={ChevronDown}
            variant="defaultOutline"
            onClick={() => loadMore()}
            isLoading={isFetchingMore}
            full
          >
            Carregar mais
          </Button>
        )}

        <RestoreDialog version={selected} onClose={() => setSelected(null)} />
        <ImportDialog target={importTarget} onClose={() => setImportTarget(null)} />
        <RenameVersionDialog
          version={renameTarget}
          currentName={renameTarget ? names[renameTarget.id] : undefined}
          onClose={() => setRenameTarget(null)}
        />
      </Content.Content>
    </Content.Container>
  )
}

function VersionRow({
  version,
  name,
  isCurrent,
  onRestore,
  onDownload,
  onRename
}: {
  version: ConfigHistoryVersion
  name: string | undefined
  isCurrent: boolean
  onRestore: () => void
  onDownload: () => void
  onRename: () => void
}) {
  const content = (
    <div className="flex flex-col items-start leading-tight grow min-w-0">
      <div className="flex flex-row items-center gap-2 w-full">
        <span className="truncate">{name ? name : formatTimestamp(version.createdAt)}</span>
        <div className="grow" />
        {isCurrent && <Tag label="Atual" icon={Check} variant="success" />}
      </div>
      {name && <span className="text-[10px] opacity-60">{formatTimestamp(version.createdAt)}</span>}
      {version.restoredFromCreatedAt && (
        <span className="text-[10px] opacity-60">
          Origem: {formatShortTimestamp(version.restoredFromCreatedAt)}
        </span>
      )}
    </div>
  )

  if (isCurrent) {
    return (
      <GroupButton.Container className="w-full min-h-12">
        <div className="grow flex items-center bg-secondary border border-secondary p-2 text-sm rounded-l min-w-0">
          {content}
        </div>
        <GroupButton.Button onClick={onDownload}>
          <Download className="size-4" />
        </GroupButton.Button>
        <GroupButton.Button onClick={onRename}>
          <Pencil className="size-4" />
        </GroupButton.Button>
      </GroupButton.Container>
    )
  }

  return (
    <GroupButton.Container className="w-full min-h-12">
      <GroupButton.Button className="grow justify-start min-w-0" onClick={onRestore}>
        {content}
      </GroupButton.Button>
      <GroupButton.Button onClick={onDownload}>
        <Download className="size-4" />
      </GroupButton.Button>
      <GroupButton.Button onClick={onRename}>
        <Pencil className="size-4" />
      </GroupButton.Button>
      <GroupButton.Button onClick={onRestore} variant="primaryOutline">
        <RotateCcw className="size-4" />
      </GroupButton.Button>
    </GroupButton.Container>
  )
}

function RestoreDialog({
  version,
  onClose
}: {
  version: ConfigHistoryVersion | null
  onClose: () => void
}) {
  const current = useConfig((state) => state.config)
  const { mutate: restore, isPending } = useRestoreVersion()

  const handleConfirm = () => {
    if (!version) return
    restore(version, {
      onSuccess: () => onClose()
    })
  }

  return (
    <Dialog
      open={!!version}
      title={version ? `Restaurar versão de ${formatTimestamp(version.createdAt)}` : ''}
      setOpen={(open) => !open && onClose()}
    >
      {version && (
        <div className="flex flex-col gap-4">
          <ConfigDiff current={current} target={version.config} />
          <div className="h-px w-full bg-border" />
          <div className="flex flex-row gap-2">
            <Button className="grow" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              className="grow"
              variant="primary"
              icon={RotateCcw}
              onClick={handleConfirm}
              isLoading={isPending}
            >
              Restaurar
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}

function ImportDialog({ target, onClose }: { target: ConfigSnapshot | null; onClose: () => void }) {
  const current = useConfig((state) => state.config)
  const { mutate: importConfig, isPending } = useImportConfig()

  const handleConfirm = () => {
    if (!target) return
    importConfig(target, {
      onSuccess: () => onClose()
    })
  }

  return (
    <Dialog open={!!target} title="Importar configuração" setOpen={(open) => !open && onClose()}>
      {target && (
        <div className="flex flex-col gap-4">
          <ConfigDiff current={current} target={target} />
          <div className="h-px w-full bg-border" />
          <div className="flex flex-row gap-2">
            <Button className="grow" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              className="grow"
              variant="primary"
              icon={Upload}
              onClick={handleConfirm}
              isLoading={isPending}
            >
              Criar versão
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}

function RenameVersionDialog({
  version,
  currentName,
  onClose
}: {
  version: ConfigHistoryVersion | null
  currentName: string | undefined
  onClose: () => void
}) {
  return (
    <Dialog open={!!version} title="Nomear versão" setOpen={(open) => !open && onClose()}>
      {version && (
        <RenameVersionForm version={version} currentName={currentName} onClose={onClose} />
      )}
    </Dialog>
  )
}

function RenameVersionForm({
  version,
  currentName,
  onClose
}: {
  version: ConfigHistoryVersion
  currentName: string | undefined
  onClose: () => void
}) {
  const { mutate, isPending } = useSetVersionName()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(z.object({ name: z.string().min(1, 'Nome é obrigatório') })),
    defaultValues: { name: currentName || '' }
  })

  const onSubmit = (data: { name: string }) => {
    mutate({ versionId: version.id, name: data.name }, { onSuccess: onClose })
  }

  const onClear = () => {
    mutate({ versionId: version.id, name: null }, { onSuccess: onClose })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <p className="text-xs opacity-60 mb-2">{formatTimestamp(version.createdAt)}</p>
      <FormControl label="Nome da versão" error={errors.name?.message}>
        <TextField
          {...register('name')}
          type="text"
          placeholder="Ex: Pré-culto domingo"
          disabled={isPending}
        />
      </FormControl>
      <div className="h-px w-full bg-border my-4" />
      <Button icon={Save} type="submit" variant="primary" isLoading={isPending}>
        Salvar nome
      </Button>
      {currentName && (
        <Button icon={Trash} type="button" variant="error" onClick={onClear} disabled={isPending}>
          Apagar nome
        </Button>
      )}
    </form>
  )
}
