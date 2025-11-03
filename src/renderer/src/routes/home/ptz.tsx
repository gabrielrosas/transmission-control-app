import { memo } from 'react'
import { Content } from '@renderer/components/containers'
import { ContextMenu } from '@renderer/components/ContextMenu'
import { GroupButton } from '@renderer/components/GroupButton'
import { StatusTag } from '@renderer/components/Tag'
import { Subtitle } from '@renderer/components/titles'
import { Tooltip } from '@renderer/components/Tooltip'

import {
  PTZControl,
  PTZPreset,
  useInitPTZ,
  useGotoPreset,
  PTZPresetControl,
  usePresetData,
  useImagePreset
} from '@renderer/hooks/ptz'
import { cn } from '@renderer/libs/cn'
import { CameraPTZConfig } from '@renderer/schemas/CameraPTZ'
import { Loader2, Webcam, Eye, Play, RefreshCcw, Image, EyeOff, ImageOff } from 'lucide-react'

type PtzCardProps = {
  camera: CameraPTZConfig
  selected: boolean
  changeColapsed: () => void
}
export function PtzCard({ camera, selected, changeColapsed }: PtzCardProps) {
  const { presets, isLoading, control, isRefetching, error, refetch } = useInitPTZ(camera)
  return (
    <Content.Container
      className={cn({ 'grow min-h-0': selected })}
      colapsed={!selected}
      changeColapsed={changeColapsed}
    >
      <Content.Header size="small">
        <Subtitle
          className="text-left"
          icon={Webcam}
          tag={<StatusTag isConnected={!isLoading && !error} isLoading={isLoading} />}
          action={
            !isLoading ? (
              <div
                className="cursor-pointer opacity-50 hover:opacity-100"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  refetch()
                }}
              >
                <RefreshCcw
                  className={cn('size-4 cursor-pointer', isRefetching ? 'animate-spin' : '')}
                />
              </div>
            ) : undefined
          }
        >
          {camera.name}
        </Subtitle>
      </Content.Header>
      <PTZControl control={control}>
        <Content.Content className="p-0 grow min-h-0">
          <PtzCardContent isLoading={isLoading} error={error} presets={presets} camera={camera} />
        </Content.Content>
      </PTZControl>
    </Content.Container>
  )
}

type ContentProps = {
  isLoading: boolean
  error: Error | null
  presets: PTZPreset[]
  camera: CameraPTZConfig
}
const PtzCardContent = memo(({ isLoading, error, presets, camera }: ContentProps) => {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="size-4 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center justify-center w-full h-full gap-4">
        <ul className="w-full border border-border rounded-md p-2 text-sm opacity-50">
          <li className="text-center">IP: {camera.ip}</li>
          <li className="text-center">Porta: {camera.port}</li>
          <li className="text-center">Usuário: {camera.user}</li>
          <li className="text-center">Senha: {camera.password}</li>
        </ul>
        <p className="text-error text-sm text-center w-full p-4 bg-error/10 rounded-md">
          Erro ao conectar à câmera: {error.message}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-2 h-full w-full overflow-auto no-scrollbar">
      {presets.map((preset) => (
        <Preset key={preset.id} preset={preset} />
      ))}
    </div>
  )
})
PtzCardContent.displayName = 'PtzCardContent'

function Preset({ preset }: { preset: PTZPreset }) {
  return (
    <PTZPresetControl preset={preset}>
      <PresetTooltip>
        <GroupButton.Container>
          <PresetPreviewButton />
          <PresetProgramButton />
        </GroupButton.Container>
      </PresetTooltip>
    </PTZPresetControl>
  )
}

function PresetPreviewButton() {
  const { name, inProgress } = usePresetData()
  const { gotoPreset, isLoading } = useGotoPreset()
  return (
    <PresetMenu>
      <GroupButton.Button
        icon={Eye}
        onClick={() => gotoPreset(false)}
        variant={isLoading ? 'successOutline' : 'defaultOutline'}
        disabled={inProgress}
        isLoading={isLoading}
        className="grow gap-2"
      >
        <div className="grow max-w-[100px] h-[40px] text-left overflow-hidden text-ellipsis flex items-center">
          {name.length > 20 ? name.slice(0, 20) + '...' : name}
        </div>
      </GroupButton.Button>
    </PresetMenu>
  )
}

function PresetProgramButton() {
  const { inProgress } = usePresetData()
  const { gotoPreset, isLoading } = useGotoPreset()
  return (
    <GroupButton.Button
      onClick={() => gotoPreset(true)}
      variant={'errorOutline'}
      disabled={inProgress}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
    </GroupButton.Button>
  )
}

function PresetMenu({ children }: { children: React.ReactNode }) {
  const { loadImage, clearImage, image } = useImagePreset()
  return (
    <ContextMenu.Container trigger={children}>
      {!image ? (
        <ContextMenu.Item icon={Image} onClick={loadImage}>
          Carregar imagem
        </ContextMenu.Item>
      ) : (
        <>
          <ContextMenu.Item icon={Image} onClick={loadImage}>
            Atualizar imagem
          </ContextMenu.Item>
          <ContextMenu.Item icon={ImageOff} onClick={clearImage}>
            Apagar imagem
          </ContextMenu.Item>
        </>
      )}
      <ContextMenu.Separator />
      <ContextMenu.Item icon={EyeOff} disabled>
        Ocultar
      </ContextMenu.Item>
    </ContextMenu.Container>
  )
}

function PresetTooltip({ children }: { children: React.ReactNode }) {
  const presetData = usePresetData()
  if (!presetData.image) {
    return children
  }
  return (
    <Tooltip delay={800} skipDelay={0} trigger={<div>{children}</div>}>
      <div className="w-[300px] h-[170px] flex items-center justify-center">
        <img
          src={presetData.image}
          alt={presetData.name}
          className="w-full h-full object-contain rounded-md"
        />
      </div>
    </Tooltip>
  )
}
