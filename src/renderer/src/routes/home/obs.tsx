import { Eye, Loader2, Play, RefreshCcw, TvMinimalPlay } from 'lucide-react'
import { Content } from '../../components/containers'
import { OBSIcon } from '../../components/icons/obs'
import { StatusTag } from '../../components/Tag'
import { Subtitle } from '../../components/titles'
import { OBSScene, useOBS } from '../../hooks/obs'
import { GroupButton } from '@renderer/components/GroupButton'
import { useMutation } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { cn } from '@renderer/libs/cn'
import { useConfig } from '@renderer/hooks/config'

export function ObsCard() {
  const isConnected = useOBS((state) => state.isConnected)
  const obsConfig = useConfig((state) => state.config.obsConfig!)
  const isLoading = useOBS((state) => state.isLoading)
  const scenes = useOBS((state) => state.scenes)
  const programScene = useOBS((state) => state.programScene)
  const previewScene = useOBS((state) => state.previewScene)
  const reloadScenes = useOBS((state) => state.reloadScenes)

  const { mutate: reloadScenesMutation, isPending: isReloadingScenes } = useMutation({
    mutationFn: async () => {
      await reloadScenes()
    }
  })

  const scenesToShow = useMemo(() => {
    return scenes.filter((scene) => !(obsConfig?.ignoreSceneList || []).includes(scene.id))
  }, [scenes, obsConfig?.ignoreSceneList])

  const [colapsed, setColapsed] = useState(false)

  return (
    <Content.Container
      className="w-full"
      colapsed={isConnected ? colapsed : undefined}
      changeColapsed={() => setColapsed(!colapsed)}
    >
      <Content.Header size="small" border={!isLoading && isConnected}>
        <Subtitle
          icon={OBSIcon}
          className="text-left"
          tag={<StatusTag isConnected={isConnected} isLoading={isLoading} />}
          action={
            !isLoading ? (
              <div
                className="cursor-pointer opacity-50 hover:opacity-100"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  reloadScenesMutation()
                }}
              >
                <RefreshCcw
                  className={cn('size-4 cursor-pointer', isReloadingScenes ? 'animate-spin' : '')}
                />
              </div>
            ) : undefined
          }
        >
          OBS
        </Subtitle>
      </Content.Header>
      {!isLoading && isConnected && (
        <Content.Content className="grid grid-cols-2 gap-2 p-2">
          {scenesToShow
            .sort((a, b) => (b.order || 0) - (a.order || 0))
            .map((scene) => (
              <SceneButtons
                key={scene.id}
                scene={scene}
                isProgramScene={programScene?.id === scene.id}
                isPreviewScene={previewScene?.id === scene.id}
              />
            ))}
        </Content.Content>
      )}
    </Content.Container>
  )
}

type SceneButtonsProps = {
  scene: OBSScene
  isProgramScene: boolean
  isPreviewScene: boolean
}

function SceneButtons({ scene, isProgramScene, isPreviewScene }: SceneButtonsProps) {
  const changeProgramScene = useOBS((state) => state.changeProgramScene)
  const changePreviewScene = useOBS((state) => state.changePreviewScene)

  const { mutate: changeProgramSceneMutation, isPending: isChangingProgramScene } = useMutation({
    mutationFn: async () => {
      await changeProgramScene(scene.id)
    }
  })

  const { mutate: changePreviewSceneMutation, isPending: isChangingPreviewScene } = useMutation({
    mutationFn: async () => {
      await changePreviewScene(scene.id)
    }
  })

  return (
    <GroupButton.Container key={scene.id}>
      <GroupButton.Button
        icon={Eye}
        onClick={() => changePreviewSceneMutation()}
        variant={isProgramScene ? 'error' : isPreviewScene ? 'successOutline' : 'defaultOutline'}
        className="grow"
        isLoading={isChangingPreviewScene}
      >
        {scene.name}
      </GroupButton.Button>
      <GroupButton.Button
        onClick={() => changeProgramSceneMutation()}
        variant={isProgramScene ? 'error' : 'errorOutline'}
        disabled={isChangingProgramScene || isProgramScene}
      >
        {isChangingProgramScene ? (
          <Loader2 className="size-4 animate-spin" />
        ) : isProgramScene ? (
          <TvMinimalPlay className="size-4" />
        ) : (
          <Play className="size-4" />
        )}
      </GroupButton.Button>
    </GroupButton.Container>
  )
}
