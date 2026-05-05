import { useEffect } from 'react'
import { Layers, Loader2, Play, RefreshCcw, Square } from 'lucide-react'
import { Content } from '@renderer/components/containers'
import { GroupButton } from '@renderer/components/GroupButton'
import { Subtitle } from '@renderer/components/titles'
import { Button } from '@renderer/components/Button'
import { cn } from '@renderer/libs/cn'
import { OverlayerControl, OverlayerItem } from '@renderer/schemas/OverlayerControl'
import {
  useOverlayItems,
  usePlayingItems,
  usePlayItem,
  useStopItem
} from '@renderer/hooks/overlayerControls'

type OverlayerCardProps = {
  control: OverlayerControl
  selected: boolean
  changeColapsed: () => void
}

export function OverlayerCard({ control, selected, changeColapsed }: OverlayerCardProps) {
  const { data, isLoading, isFetching, error, refetch } = useOverlayItems(control)
  const items = data?.items
  const visibility = data?.visibility
  const overlayNames = data?.overlayNames
  const activeSlots = data?.activeSlots
  const playingItem = usePlayingItems((s) => s.playing[control.id]) ?? undefined
  const setPlaying = usePlayingItems((s) => s.setPlaying)
  const { mutate: stop, isPending: isStopping } = useStopItem()

  // Algo está no ar? Verdadeiro se o estado local sabe que dispomos algo
  // (Play recente) OU se o servidor confirma um overlay visível. Cobre os dois
  // sentidos: detecção externa (vinda do GetOverlays) e ações locais que ainda
  // não refletiram no fetch.
  const someoneVisible = visibility ? Object.values(visibility).some((v) => v) : false
  const isOnAir = !!playingItem || someoneVisible

  // Sincroniza estado local com o que a API diz estar no ar. Roda APENAS
  // quando os dados do servidor mudam (refetch). Lemos o playingItem via
  // getState() pra evitar reagir a mudanças locais de Play/Stop com dados
  // stale do fetch anterior.
  useEffect(() => {
    if (!visibility || !activeSlots) return

    const visibleOverlayIds = Object.entries(visibility)
      .filter(([, v]) => v)
      .map(([id]) => id)

    const current = usePlayingItems.getState().playing[control.id] ?? undefined

    if (visibleOverlayIds.length === 0) {
      if (current) setPlaying(control.id, null)
      return
    }

    const overlayId = visibleOverlayIds[0]
    const detected = activeSlots[overlayId]

    if (detected) {
      if (!current || current.id !== detected.id) {
        setPlaying(control.id, detected)
      }
      return
    }

    if (current && current.overlayId === overlayId) return
    setPlaying(control.id, {
      id: `${overlayId}__unknown`,
      name: overlayNames?.[overlayId] || 'Algo no ar',
      overlayId,
      slotName: '',
      slotPayload: {}
    })
  }, [visibility, activeSlots, overlayNames, control.id, setPlaying])

  return (
    <Content.Container
      className={cn({ 'grow min-h-0': selected })}
      colapsed={!selected}
      changeColapsed={changeColapsed}
    >
      <Content.Header size="small">
        <Subtitle
          className="text-left"
          icon={Layers}
          tag={
            !selected && isOnAir && playingItem ? (
              <span className="text-xs opacity-70 truncate max-w-[140px]">{playingItem.name}</span>
            ) : undefined
          }
          action={
            isOnAir && playingItem ? (
              <Button
                variant="error"
                size="small"
                icon={isStopping ? Loader2 : Square}
                iconClassName={isStopping ? 'animate-spin' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  stop({ control })
                }}
                disabled={isStopping}
              >
                Stop
              </Button>
            ) : undefined
          }
        >
          {control.name}
        </Subtitle>
      </Content.Header>
      <Content.Content className="p-0 grow min-h-0">
        <ItemsList
          control={control}
          items={items}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onReload={() => refetch()}
        />
      </Content.Content>
    </Content.Container>
  )
}

type ItemsListProps = {
  control: OverlayerControl
  items: OverlayerItem[] | undefined
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  onReload: () => void
}

function ItemsList({ control, items, isLoading, isFetching, error, onReload }: ItemsListProps) {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <Loader2 className="size-4 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center w-full gap-3">
        <p className="text-error text-sm text-center w-full p-3 bg-error/10 rounded-md">
          Erro ao carregar items: {error.message}
        </p>
        <Button icon={RefreshCcw} variant="defaultOutline" onClick={onReload} full>
          Tentar de novo
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-2 h-full w-full overflow-auto no-scrollbar">
      {!items || items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6 px-4">
          Nenhum item encontrado nesse overlay. Cadastre os items diretamente no overlays.uno.
        </p>
      ) : (
        items.map((item) => <ItemRow key={item.id} control={control} item={item} />)
      )}
      <Button
        icon={RefreshCcw}
        iconClassName={isFetching ? 'animate-spin' : ''}
        variant="defaultOutline"
        onClick={onReload}
        isLoading={isFetching}
        full
      >
        Atualizar lista
      </Button>
    </div>
  )
}

function ItemRow({ control, item }: { control: OverlayerControl; item: OverlayerItem }) {
  const playing = usePlayingItems((s) => s.playing[control.id])
  const isPlaying = playing?.id === item.id
  const { mutate: play, isPending: isPlayingMutation } = usePlayItem()
  const { mutate: stop, isPending: isStopping } = useStopItem()

  const handleClick = () => {
    if (isPlaying) {
      stop({ control })
    } else {
      play({ control, item })
    }
  }

  return (
    <GroupButton.Container className="w-full">
      <GroupButton.Button
        className="grow"
        variant={isPlaying ? 'successOutline' : 'defaultOutline'}
        onClick={handleClick}
        isLoading={isPlayingMutation || isStopping}
      >
        <span className="grow text-left truncate">{item.name}</span>
      </GroupButton.Button>
      <GroupButton.Button
        variant={isPlaying ? 'success' : 'defaultOutline'}
        onClick={handleClick}
        disabled={isPlayingMutation || isStopping}
      >
        {isPlaying ? <Square className="size-4" /> : <Play className="size-4" />}
      </GroupButton.Button>
    </GroupButton.Container>
  )
}
