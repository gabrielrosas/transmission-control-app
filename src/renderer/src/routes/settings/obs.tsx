import { Content } from '../../components/containers'
import { OBSIcon } from '../../components/icons/obs'
import { Subtitle, Title } from '../../components/titles'
import { Button } from '../../components/Button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl, TextField } from '../../components/form'
import toast from 'react-hot-toast'
import { ListChecks, Save } from 'lucide-react'
import { Box } from '../../components/Box'
import { type OBSConfig, OBSConfigSchema } from '../../schemas/OBSConfig'
import { useConfig } from '../../hooks/config'
import { useOBS } from '@renderer/hooks/obs'
import { StatusTag } from '@renderer/components/Tag'
import z from 'zod'
import { useEffect } from 'react'
import { BtnCheckbox } from '@renderer/components/form/Checkbox'

const promiseToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Salvando...',
    success: 'Salvo com sucesso!',
    error: 'Erro ao salvar'
  })

export function ObsPage() {
  const isConnected = useOBS((state) => state.isConnected)
  const isLoading = useOBS((state) => state.isLoading)
  const obsSettings = useConfig((state) => state.config.obsConfig)
  const setConfig = useConfig((state) => state.setConfig)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<OBSConfig>({
    resolver: zodResolver(OBSConfigSchema),
    defaultValues: obsSettings || {
      ip: '',
      port: '',
      password: ''
    }
  })

  const onSubmit = async (data: OBSConfig) => {
    await promiseToast(setConfig({ obsConfig: data }))
  }

  return (
    <Content.Container hFull>
      <Content.Header>
        <Title icon={OBSIcon} tag={<StatusTag isConnected={isConnected} isLoading={isLoading} />}>
          OBS
        </Title>
      </Content.Header>
      <Content.Content>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box direction="column" gap="medium" margin="auto" padding="medium" width="form">
            <FormControl label="Endereço IP" error={errors.ip?.message}>
              <TextField
                {...register('ip')}
                type="text"
                id="ip"
                placeholder="192.168.1.100"
                error={!!errors.ip}
                disabled={isSubmitting}
              />
            </FormControl>

            <FormControl label="Porta" error={errors.port?.message}>
              <TextField
                {...register('port')}
                type="text"
                id="port"
                placeholder="4455"
                error={!!errors.port}
                disabled={isSubmitting}
              />
            </FormControl>

            <FormControl label="Senha" error={errors.password?.message}>
              <TextField
                {...register('password')}
                type="password"
                id="password"
                placeholder="Digite a senha do OBS WebSocket"
                error={!!errors.password}
                disabled={isSubmitting}
              />
            </FormControl>

            <Button
              type="submit"
              variant="primary"
              full
              icon={Save}
              isLoading={isSubmitting}
              size="large"
            >
              Conectar ao OBS
            </Button>
          </Box>
        </form>
        {isConnected && <FormIgnoreSceneList />}
      </Content.Content>
    </Content.Container>
  )
}

function FormIgnoreSceneList() {
  const obsConfig = useConfig((state) => state.config.obsConfig!)
  const setConfig = useConfig((state) => state.setConfig)

  const scenes = useOBS((state) => state.scenes)
  const {
    register,
    watch,
    handleSubmit,
    formState: { isSubmitting }
  } = useForm<{ ignoreSceneList: string[] }>({
    resolver: zodResolver(z.object({ ignoreSceneList: z.array(z.string()) })),
    defaultValues: {
      ignoreSceneList: scenes
        .map((scene) => scene.id)
        .filter((id) => !(obsConfig?.ignoreSceneList || []).includes(id))
    }
  })

  useEffect(() => {
    const subscription = watch((values) => {
      console.log(values)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [watch, setConfig, obsConfig, scenes])

  const onSubmit = async (values: { ignoreSceneList: string[] }) => {
    await promiseToast(
      setConfig({
        obsConfig: {
          ...obsConfig,
          ignoreSceneList: scenes
            .map((scene) => scene.id)
            .filter((id) => !(values?.ignoreSceneList || []).includes(id))
        }
      })
    )
  }

  return (
    <>
      <div className="bg-border w-full h-px my-2" />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Subtitle icon={ListChecks} className="my-4">
          Cenas do OBS
        </Subtitle>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {scenes.map((scene) => (
            <BtnCheckbox
              key={scene.id}
              label={scene.name}
              {...register('ignoreSceneList')}
              value={scene.id}
            />
          ))}
        </div>
        <Button
          type="submit"
          variant="primary"
          full
          icon={Save}
          isLoading={isSubmitting}
          size="large"
        >
          Salvar Cenas
        </Button>
      </form>
    </>
  )
}
