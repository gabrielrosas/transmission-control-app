import { Eye, Play } from 'lucide-react'
import { Button } from '../../components/Button'
import { Content } from '../../components/containers'
import { OBSIcon } from '../../components/icons/obs'
import { StatusTag } from '../../components/Tag'
import { Subtitle } from '../../components/titles'
import { useOBS } from '../../hooks/obs'

export function ObsCard() {
  const isConnected = useOBS((state) => state.isConnected)
  const isLoading = useOBS((state) => state.isLoading)
  const scenes = useOBS((state) => state.scenes)
  const programScene = useOBS((state) => state.programScene)
  const previewScene = useOBS((state) => state.previewScene)

  const changeProgramScene = useOBS((state) => state.changeProgramScene)

  return (
    <Content.Container className="w-[300px]">
      <Content.Header size="small">
        <Subtitle
          icon={OBSIcon}
          tag={<StatusTag isConnected={isConnected} isLoading={isLoading} />}
        >
          OBS
        </Subtitle>
      </Content.Header>
      <Content.Content className="flex flex-col gap-2">
        {scenes.map((scene) => (
          <Button
            key={scene.id}
            onClick={() => changeProgramScene(scene.id)}
            full
            variant={
              programScene?.id === scene.id
                ? 'error'
                : previewScene?.id === scene.id
                  ? 'successOutline'
                  : 'defaultOutline'
            }
            secondaryIcon={
              programScene?.id === scene.id ? Play : previewScene?.id === scene.id ? Eye : undefined
            }
          >
            {scene.name}
          </Button>
        ))}
      </Content.Content>
    </Content.Container>
  )
}
