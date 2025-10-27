import { Button } from '@renderer/components/Button'
import { Content } from '@renderer/components/containers'
import { TextField, FormControl } from '@renderer/components/form'
import { Title } from '@renderer/components/titles'
import { WebcamIcon, Plus, Trash, Save } from 'lucide-react'
import { useConfig } from '@renderer/hooks/config'
import { CameraPTZConfig, CameraPTZConfigSchema } from '@renderer/schemas/CameraPTZ'
import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
import { useMutation } from '@tanstack/react-query'
import { Select } from '@renderer/components/form/Select'
import { useOBS } from '@renderer/hooks/obs'

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
            password: ''
          }
          console.log(newCamera)
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
    <Content.Container hFull>
      <Content.Header>
        <Title icon={WebcamIcon}>PTZ</Title>
      </Content.Header>
      <Content.Content>
        <div className="flex flex-row gap-2 w-full min-h-full">
          <div className="w-[250px] flex flex-col gap-2">
            {Object.values(cameraPTZConfig).map((camera) => (
              <Button
                full
                variant={selectedCamera?.id === camera.id ? 'success' : 'defaultOutline'}
                key={camera.id}
                type="button"
                onClick={() => setSelectedCamera(camera)}
                icon={WebcamIcon}
              >
                {camera.name || 'nova da câmera'}
              </Button>
            ))}
            <Button
              full
              icon={Plus}
              variant="primary"
              onClick={() => addCamera()}
              type="button"
              isLoading={isAddingCamera}
            >
              Adicionar câmera
            </Button>
          </div>
          <div className="w-[2px] bg-border"></div>
          <div className="flex-1 min-h-[50vh]">
            {selectedCamera && (
              <FormCamera
                camera={selectedCamera}
                saveCamera={saveCamera}
                deleteCamera={deleteCamera}
              />
            )}
          </div>
        </div>
      </Content.Content>
    </Content.Container>
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CameraPTZConfig>({
    resolver: zodResolver(CameraPTZConfigSchema),
    defaultValues: camera
  })

  const { mutate: saveCameraMutation, isPending: isSavingCamera } = useMutation({
    mutationFn: saveCamera
  })

  const { mutate: deleteCameraMutation, isPending: isDeletingCamera } = useMutation({
    mutationFn: deleteCamera
  })

  useEffect(() => {
    reset(camera)
  }, [camera, reset])

  return (
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
      <FormControl label="Cena do OBS" error={errors.sceneId?.message}>
        <Select
          options={[
            { label: 'Selecione uma cena', value: '' },
            ...scenes.map((scene) => ({ label: scene.name, value: scene.id }))
          ]}
          {...register('sceneId')}
        />
      </FormControl>
      <div className="flex justify-end gap-4">
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
          onClick={() => deleteCameraMutation(camera)}
        >
          Apagar
        </Button>
      </div>
    </form>
  )
}
