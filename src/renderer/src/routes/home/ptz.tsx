import { Content } from '@renderer/components/containers'
import { GroupButton } from '@renderer/components/GroupButton'
import { Subtitle } from '@renderer/components/titles'
import { useConfig } from '@renderer/hooks/config'
import { PTZControl, PTZPreset, useInitPTZ, useGotoPTZ } from '@renderer/hooks/ptz'
import { cn } from '@renderer/libs/cn'
import { CameraPTZConfig } from '@renderer/schemas/CameraPTZ'
import { Loader2, Webcam, Eye } from 'lucide-react'
import { useState } from 'react'

export function PtzCards() {
  const cameraPTZConfig = useConfig((state) => state.config.cameraPTZConfig)
  const [cameraSelected, setCameraSelected] = useState<string | null>(
    Object.keys(cameraPTZConfig)[0] || null
  )
  return (
    <div className="flex flex-col gap-2 grow min-h-0 w-full">
      {Object.values(cameraPTZConfig).map((camera) => (
        <PtzCard
          key={camera.id}
          camera={camera}
          selected={cameraSelected === camera.id}
          changeColapsed={() => setCameraSelected(cameraSelected === camera.id ? null : camera.id)}
        />
      ))}
    </div>
  )
}

type PtzCardProps = {
  camera: CameraPTZConfig
  selected: boolean
  changeColapsed: () => void
}
function PtzCard({ camera, selected, changeColapsed }: PtzCardProps) {
  const { presets, isLoading, control, inProgress } = useInitPTZ(camera)
  console.log({ presets, isLoading })
  return (
    <Content.Container
      className={cn({ 'grow min-h-0': selected })}
      colapsed={!selected}
      changeColapsed={changeColapsed}
    >
      <Content.Header size="small">
        <Subtitle icon={Webcam}>{camera.name}</Subtitle>
      </Content.Header>
      <PTZControl control={control}>
        {isLoading ? (
          <Content.Content className="w-full h-full flex items-center justify-center">
            <Loader2 className="size-4 animate-spin" />
          </Content.Content>
        ) : (
          <Content.Content className="p-0 grow min-h-0">
            <div className="grid grid-cols-2 gap-2 p-2 h-full w-full overflow-auto">
              {presets.map((preset) => (
                <Preset key={preset.id} preset={preset} inProgress={inProgress} />
              ))}
            </div>
          </Content.Content>
        )}
      </PTZControl>
    </Content.Container>
  )
}

function Preset({ preset, inProgress }: { preset: PTZPreset; inProgress: boolean }) {
  const { gotoPreset, isLoading } = useGotoPTZ(preset)
  return (
    <GroupButton.Container>
      <GroupButton.Button
        onClick={() => gotoPreset(true)}
        variant={isLoading ? 'successOutline' : 'default'}
        disabled={inProgress}
        className="grow"
      >
        {preset.name}
      </GroupButton.Button>
      <GroupButton.Button
        onClick={() => gotoPreset(false)}
        variant={isLoading ? 'successOutline' : 'default'}
        disabled={inProgress}
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
      </GroupButton.Button>
    </GroupButton.Container>
  )
}
