import { Eye, Loader2, Play } from 'lucide-react'
import { Button } from '../../components/Button'
import { Content } from '../../components/containers'
import { OBSIcon } from '../../components/icons/obs'
import { StatusTag } from '../../components/Tag'
import { Subtitle } from '../../components/titles'
import { useOBS } from '../../hooks/obs'
import { GroupButton } from '@renderer/components/GroupButton'

export function ObsCard() {
  const isConnected = useOBS((state) => state.isConnected)
  const isLoading = useOBS((state) => state.isLoading)
  const scenes = useOBS((state) => state.scenes)
  const programScene = useOBS((state) => state.programScene)
  const previewScene = useOBS((state) => state.previewScene)

  const changeProgramScene = useOBS((state) => state.changeProgramScene)
  const changePreviewScene = useOBS((state) => state.changePreviewScene)

  return (
    <Content.Container className="w-full">
      <Content.Header size="small" border={!isLoading}>
        <Subtitle
          icon={OBSIcon}
          tag={<StatusTag isConnected={isConnected} isLoading={isLoading} />}
        >
          OBS
        </Subtitle>
      </Content.Header>
      {!isLoading && (
        <Content.Content className="grid grid-cols-2 gap-2 p-2">
          {scenes.map((scene) => (
            <GroupButton.Container key={scene.id}>
              <GroupButton.Button
                icon={Eye}
                onClick={() => changePreviewScene(scene.id)}
                variant={
                  programScene?.id === scene.id
                    ? 'error'
                    : previewScene?.id === scene.id
                      ? 'successOutline'
                      : 'defaultOutline'
                }
                className="grow"
              >
                {scene.name}
              </GroupButton.Button>
              <GroupButton.Button
                onClick={() => changeProgramScene(scene.id)}
                variant={
                  programScene?.id === scene.id
                    ? 'error'
                    : previewScene?.id === scene.id
                      ? 'successOutline'
                      : 'defaultOutline'
                }
              >
                <Play className="size-4" />
              </GroupButton.Button>
            </GroupButton.Container>
          ))}
        </Content.Content>
      )}
    </Content.Container>
  )
}
