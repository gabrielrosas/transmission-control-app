import { Button } from '@renderer/components/Button'
import { Content } from '@renderer/components/containers'
import { TextField, FormControl } from '@renderer/components/form'
import { Title } from '@renderer/components/titles'
import { WebcamIcon, Plus, Trash, Save, EllipsisVertical, Edit, ImageOff, Eye } from 'lucide-react'
import { useConfig } from '@renderer/hooks/config'
import { CameraPTZConfig, CameraPTZConfigSchema } from '@renderer/schemas/CameraPTZ'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
import { useMutation } from '@tanstack/react-query'
import { Select, type Option } from '@renderer/components/form/Select'
import { useOBS } from '@renderer/hooks/obs'

import { useClearHiddenPresets, useClearImages } from '@renderer/hooks/ptz'
import { useConfirm } from '@renderer/hooks/utils/confirm'
import { Dialog } from '@renderer/components/Dialog'
import { GroupButton } from '@renderer/components/GroupButton'
import { DropdownMenu } from '@renderer/components/DropdownMenu'

const addCameraToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Adicionando câmera...',
    success: 'Câmera adicionada com sucesso!',
    error: 'Erro ao adicionar câmera'
  })
const saveCameraToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Salvando câmera...',
    success: 'Câmera salva com sucesso!',
    error: 'Erro ao salvar câmera'
  })
const deleteCameraToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Deletando câmera...',
    success: 'Câmera deletada com sucesso!',
    error: 'Erro ao deletar câmera'
  })

export function PtzPage() {
  const cameraPTZConfig = useConfig((state) => state.config.cameraPTZConfig)
  const setConfig = useConfig((state) => state.setConfig)
  const [selectedCamera, setSelectedCamera] = useState<CameraPTZConfig | null>(null)

  const { mutate: addCamera, isPending: isAddingCamera } = useMutation({
    mutationFn: async () => {
      await addCameraToast(
        (async () => {
          const newCamera = {
            id: uuidv4(),
            name: '',
            ip: '',
            port: '',
            user: '',
            password: '',
            transitionTime: null,
            presetLimit: null,
            sceneId: null,
            axSceneId: null
          }
          await setConfig({ cameraPTZConfig: { ...cameraPTZConfig, [newCamera.id]: newCamera } })
          setSelectedCamera(newCamera)
        })()
      )
    }
  })

  const saveCamera = useCallback(
    async (camera: CameraPTZConfig) => {
      await saveCameraToast(
        (async () => {
          await setConfig({ cameraPTZConfig: { ...cameraPTZConfig, [camera.id]: camera } })
          setSelectedCamera(null)
        })()
      )
    },
    [cameraPTZConfig, setConfig]
  )

  const deleteCamera = useCallback(
    async (camera: CameraPTZConfig) => {
      await deleteCameraToast(
        (async () => {
          const newCameraPTZConfig = { ...cameraPTZConfig }
          delete newCameraPTZConfig[camera.id]
          await setConfig({ cameraPTZConfig: newCameraPTZConfig })
          setSelectedCamera(null)
        })()
      )
    },
    [cameraPTZConfig, setConfig]
  )
  return (
    <Content.Container className="h-full">
      <Content.Header>
        <Title icon={WebcamIcon}>PTZ</Title>
      </Content.Header>
      <Content.Content className="grow min-h-0 overflow-auto no-scrollbar flex flex-col gap-2">
        {Object.values(cameraPTZConfig).map((camera) => (
          <CameraItem
            key={camera.id}
            camera={camera}
            setSelectedCamera={setSelectedCamera}
            deleteCamera={deleteCamera}
          />
        ))}
        <Button
          icon={Plus}
          variant="primary"
          onClick={() => addCamera()}
          type="button"
          isLoading={isAddingCamera}
          full
        >
          Adicionar câmera
        </Button>

        <Dialog
          open={!!selectedCamera}
          title={selectedCamera?.name || 'Novo câmera'}
          setOpen={(open) => setSelectedCamera(open ? selectedCamera : null)}
        >
          {selectedCamera && (
            <FormCamera
              camera={selectedCamera}
              saveCamera={saveCamera}
              deleteCamera={deleteCamera}
            />
          )}
        </Dialog>
      </Content.Content>
    </Content.Container>
  )
}

function CameraItem({
  camera,
  setSelectedCamera,
  deleteCamera
}: {
  camera: CameraPTZConfig
  setSelectedCamera: (camera: CameraPTZConfig | null) => void
  deleteCamera: (camera: CameraPTZConfig) => Promise<void>
}) {
  const clearImages = useClearImages(camera)
  const { hiddenPresets, clearHiddenPresets } = useClearHiddenPresets(camera)

  const { component: confirmDelete, open: openConfirmDelete } = useConfirm({
    title: 'Tem certeza que deseja deletar a câmera?',
    description: 'Esta ação irá deletar a câmera e todas as imagens associadas a ela.',
    labelConfirm: 'Deletar',
    labelCancel: 'Cancelar',
    onSubmit: async (confirmed) => {
      if (confirmed) {
        clearImages()
        await deleteCamera(camera)
      }
    }
  })

  const { component: confirmClearImages, open: openConfirmClearImages } = useConfirm({
    title: 'Tem certeza que deseja limpar as imagens da câmera?',
    description: 'Esta ação irá limpar todas as imagens associadas a câmera.',
    labelConfirm: 'Limpar',
    labelCancel: 'Cancelar',
    onSubmit: async (confirmed) => {
      if (confirmed) {
        clearImages()
        toast.success('Imagens limpas com sucesso!')
      }
    }
  })

  return (
    <>
      <GroupButton.Container className="w-full">
        <GroupButton.Button className="grow" onClick={() => setSelectedCamera(camera)}>
          {camera.name || 'Novo câmera'}
        </GroupButton.Button>
        <DropdownMenu.Container
          trigger={
            <GroupButton.Button className="data-[state=open]:bg-secondary-hover">
              <EllipsisVertical />
            </GroupButton.Button>
          }
        >
          <DropdownMenu.Item icon={Edit} onClick={() => setSelectedCamera(camera)}>
            Editar câmera
          </DropdownMenu.Item>
          <DropdownMenu.Item icon={ImageOff} onClick={openConfirmClearImages}>
            Limpar imagens da câmera
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Label>{hiddenPresets.length} Presets ocultos</DropdownMenu.Label>
          <DropdownMenu.Item
            icon={Eye}
            onClick={clearHiddenPresets}
            disabled={hiddenPresets.length === 0}
          >
            Mostrar todos os Presets
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item icon={Trash} onClick={openConfirmDelete}>
            Deletar câmera
          </DropdownMenu.Item>
        </DropdownMenu.Container>
      </GroupButton.Container>
      {confirmDelete}
      {confirmClearImages}
    </>
  )
}

function FormCamera({
  camera,
  saveCamera,
  deleteCamera
}: {
  camera: CameraPTZConfig
  saveCamera: (camera: CameraPTZConfig) => Promise<void>
  deleteCamera: (camera: CameraPTZConfig) => Promise<void>
}) {
  const scenes = useOBS((state) => state.scenes)
  const clearImages = useClearImages(camera)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(CameraPTZConfigSchema),
    defaultValues: camera
  })

  const { mutate: saveCameraMutation, isPending: isSavingCamera } = useMutation({
    mutationFn: saveCamera
  })

  const { mutate: deleteCameraMutation, isPending: isDeletingCamera } = useMutation({
    mutationFn: deleteCamera
  })

  const { component: confirmDelete, open: openConfirmDelete } = useConfirm({
    title: 'Tem certeza que deseja deletar a câmera?',
    description: 'Esta ação irá deletar a câmera e todas as imagens associadas a ela.',
    labelConfirm: 'Deletar',
    labelCancel: 'Cancelar',
    onSubmit: async (confirmed) => {
      if (confirmed) {
        clearImages()
        await deleteCameraMutation(camera)
      }
    }
  })

  const { component: confirmClearImages, open: openConfirmClearImages } = useConfirm({
    title: 'Tem certeza que deseja limpar as imagens da câmera?',
    description: 'Esta ação irá limpar todas as imagens associadas a câmera.',
    labelConfirm: 'Limpar',
    labelCancel: 'Cancelar',
    onSubmit: async (confirmed) => {
      if (confirmed) {
        clearImages()
        toast.success('Imagens limpas com sucesso!')
      }
    }
  })

  useEffect(() => {
    reset(camera)
  }, [camera, reset])

  const sceneOptions = useMemo(
    () =>
      scenes.reduce<Record<string, Option>>((acc, scene) => {
        acc[scene.id] = { label: scene.name, value: scene.id }
        return acc
      }, {}),
    [scenes]
  )

  return (
    <>
      <form
        className="flex flex-col gap-2"
        onSubmit={handleSubmit(async (data) => saveCameraMutation(data))}
      >
        <FormControl label="Nome da câmera" error={errors.name?.message}>
          <TextField {...register('name')} type="text" placeholder="Nome da câmera" />
        </FormControl>
        <FormControl label="IP da câmera" error={errors.ip?.message}>
          <TextField {...register('ip')} type="text" placeholder="IP da câmera" />
        </FormControl>
        <FormControl label="Porta da câmera" error={errors.port?.message}>
          <TextField {...register('port')} type="text" placeholder="Porta da câmera" />
        </FormControl>
        <FormControl label="Usuário da câmera" error={errors.user?.message}>
          <TextField {...register('user')} type="text" placeholder="Usuário da câmera" />
        </FormControl>
        <FormControl label="Senha da câmera" error={errors.password?.message}>
          <TextField {...register('password')} type="text" placeholder="Senha da câmera" />
        </FormControl>
        <FormControl label="Limite de presets" error={errors.presetLimit?.message}>
          <TextField
            {...register('presetLimit')}
            type="number"
            placeholder="Limite de presets da câmera"
            min={1}
            max={100}
          />
        </FormControl>
        <FormControl label="Cena do OBS" error={errors.sceneId?.message}>
          <Controller
            control={control}
            name="sceneId"
            render={({ field: { value, onChange, onBlur } }) => (
              <Select
                isClearable
                options={Object.values(sceneOptions)}
                value={value ? { label: sceneOptions[value]?.label || '', value } : null}
                onChange={(value) => onChange(value?.value || null)}
                onBlur={onBlur}
                placeholder="Selecione uma cena"
              />
            )}
          />
        </FormControl>
        <FormControl label="Cena auxiliar do OBS" error={errors.axSceneId?.message}>
          <Controller
            control={control}
            name="axSceneId"
            render={({ field: { value, onChange, onBlur } }) => (
              <Select
                isClearable
                options={Object.values(sceneOptions)}
                value={value ? { label: sceneOptions[value]?.label || '', value } : null}
                onChange={(value) => onChange(value?.value || null)}
                onBlur={onBlur}
                placeholder="Selecione uma cena auxiliar"
              />
            )}
          />
        </FormControl>
        <FormControl label="Tempo de transição (ms)" error={errors.transitionTime?.message}>
          <TextField
            {...register('transitionTime')}
            type="number"
            placeholder="Tempo de transição"
            min={0}
            max={10000}
          />
        </FormControl>
        <div className="h-px w-full bg-border my-4" />
        <Button
          icon={Save}
          type="submit"
          variant="primary"
          isLoading={isSavingCamera}
          disabled={isSavingCamera || isDeletingCamera}
        >
          Salvar
        </Button>
        <Button
          icon={Trash}
          type="button"
          variant="error"
          isLoading={isDeletingCamera}
          disabled={isSavingCamera || isDeletingCamera}
          onClick={openConfirmDelete}
        >
          Apagar
        </Button>
        <Button icon={ImageOff} type="button" variant="error" onClick={openConfirmClearImages}>
          Limpar imagens
        </Button>
      </form>
      {confirmDelete}
      {confirmClearImages}
    </>
  )
}
