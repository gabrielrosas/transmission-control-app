import { useState } from 'react'
import { Check, ChevronDown, History, Loader2, RotateCcw } from 'lucide-react'
import { Content } from '@renderer/components/containers'
import { Title } from '@renderer/components/titles'
import { Button } from '@renderer/components/Button'
import { GroupButton } from '@renderer/components/GroupButton'
import { Dialog } from '@renderer/components/Dialog'
import { Tag } from '@renderer/components/Tag'
import { ConfigDiff } from '@renderer/components/ConfigDiff'
import { useConfig } from '@renderer/hooks/config'
import { useConfigHistory, useRestoreVersion } from '@renderer/hooks/configHistory'
import type { ConfigHistoryVersion } from '@renderer/schemas/ConfigHistory'
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

export function HistoryPage() {
  const { versions, isLoading, hasMore, isFetchingMore, loadMore } = useConfigHistory()
  const [selected, setSelected] = useState<ConfigHistoryVersion | null>(null)

  return (
    <Content.Container className="h-full">
      <Content.Header>
        <Title icon={History}>Histórico</Title>
      </Content.Header>
      <Content.Content className="grow min-h-0 overflow-auto no-scrollbar flex flex-col gap-2">
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
            isCurrent={index === 0}
            onRestore={() => setSelected(version)}
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
      </Content.Content>
    </Content.Container>
  )
}

function VersionRow({
  version,
  isCurrent,
  onRestore
}: {
  version: ConfigHistoryVersion
  isCurrent: boolean
  onRestore: () => void
}) {
  const content = (
    <div className="flex flex-col items-start leading-tight grow">
      <div className="flex flex-row items-center gap-2 w-full">
        <span>{formatTimestamp(version.createdAt)}</span>
        <div className="grow" />
        {isCurrent && <Tag label="Atual" icon={Check} variant="success" />}
      </div>
      {version.restoredFromCreatedAt && (
        <span className="text-[10px] opacity-60">
          Origem: {formatShortTimestamp(version.restoredFromCreatedAt)}
        </span>
      )}
    </div>
  )

  if (isCurrent) {
    return (
      <div className="w-full min-h-12 flex items-center bg-secondary border border-secondary rounded p-2 text-sm">
        {content}
      </div>
    )
  }

  return (
    <GroupButton.Container className="w-full min-h-12">
      <GroupButton.Button className="grow justify-start" onClick={onRestore}>
        {content}
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
