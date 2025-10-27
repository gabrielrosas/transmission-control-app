import { Content } from '../../components/containers'
import { OBSIcon } from '../../components/icons/obs'
import { Title } from '../../components/titles'
import { Button } from '../../components/Button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControl, TextField } from '../../components/form'
import toast from 'react-hot-toast'
import { Save } from 'lucide-react'
import { Box } from '../../components/Box'
import { type OBSConfig, OBSConfigSchema } from '../../schemas/OBSConfig'
import { useConfig } from '../../hooks/config'
import { useOBS } from '@renderer/hooks/obs'
import { StatusTag } from '@renderer/components/Tag'

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
      </Content.Content>
    </Content.Container>
  )
}
