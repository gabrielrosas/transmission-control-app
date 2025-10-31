import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@renderer/components/Button'
import { Content } from '@renderer/components/containers'
import { Dialog } from '@renderer/components/Dialog'
import { FormControl, TextAreaField, TextField } from '@renderer/components/form'
import { GroupButton } from '@renderer/components/GroupButton'
import { Subtitle } from '@renderer/components/titles'
import { useAuth } from '@renderer/hooks/firebase'
import { useOverlayer } from '@renderer/hooks/overlayer'
import { useConfirm } from '@renderer/hooks/utils'
import { cn } from '@renderer/libs/cn'
import { Overlayer, OverlayerSchema } from '@renderer/schemas/Overlayer'
import { useMutation } from '@tanstack/react-query'
import { Layers2, Play, Square, Pencil, Plus, Loader2, Trash, Save, Copy } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

const addOverlayerToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Adicionando overlayer...',
    success: 'Overlayer adicionado com sucesso!',
    error: 'Erro ao adicionar overlayer'
  })
const saveOverlayerToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Salvando overlayer...',
    success: 'Overlayer salvo com sucesso!',
    error: 'Erro ao salvar overlayer'
  })
const deleteOverlayerToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Deletando overlayer...',
    success: 'Overlayer deletado com sucesso!',
    error: 'Erro ao deletar overlayer'
  })

type OverlayersProps = {
  selected: boolean
  changeColapsed: () => void
}

export function OverlayersCard({ selected, changeColapsed }: OverlayersProps) {
  const [overlayer, setOverlayer] = useState<Overlayer | null>(null)
  const addOverlayer = useOverlayer((state) => state.addOverlayer)
  const overlayers = useOverlayer((state) => state.overlayers)
  const output = useOverlayer((state) => state.output)
  const user = useAuth((state) => state.user)

  const { mutate: handleAddOverlayer, isPending: isAddingOverlayer } = useMutation({
    mutationFn: async () => {
      await addOverlayerToast(
        (async () => {
          const newOverlayer = await addOverlayer()
          setOverlayer(newOverlayer)
        })()
      )
    }
  })

  return (
    <Content.Container
      className={cn({ 'grow min-h-0': selected })}
      colapsed={!selected}
      changeColapsed={changeColapsed}
    >
      <Content.Header size="small">
        <Subtitle
          icon={Layers2}
          className="text-left"
          action={
            selected ? (
              <div
                className={cn('cursor-pointer opacity-50 hover:opacity-100')}
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  if (!isAddingOverlayer) {
                    handleAddOverlayer()
                  }
                }}
              >
                {isAddingOverlayer ? (
                  <Loader2 className={cn('size-6 cursor-pointer animate-spin')} />
                ) : (
                  <Plus className={cn('size-6 cursor-pointer')} />
                )}
              </div>
            ) : undefined
          }
        >
          Overlayers
        </Subtitle>
      </Content.Header>
      <Content.Content className="p-2 grow min-h-0 flex flex-col gap-2 items-center justify-start">
        <div className="flex flex-col  text-sm text-muted-foreground">
          <Button
            variant="defaultOutline"
            icon={Copy}
            onClick={() => {
              window.clipboard.writeText(
                `https://transmissao-f65a0.web.app/overlayers/output/${user?.uid}`
              )
              toast.success('URL do overlayer copiada para a área de transferência')
            }}
          >
            Copiar URL do overlayer
          </Button>
        </div>
        {Object.values(overlayers).map((overlayer) => (
          <OverlayerItem
            key={overlayer.id}
            overlayer={overlayer}
            setOverlayer={setOverlayer}
            isPlaying={output?.id === overlayer.id}
          />
        ))}
        {Object.values(overlayers).length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-10">
            Nenhum overlayer encontrado
          </div>
        )}
        <Dialog title="Overlayer" open={!!overlayer} setOpen={() => setOverlayer(null)}>
          {overlayer && <FormOverlayerDialog overlayer={overlayer} setOverlayer={setOverlayer} />}
        </Dialog>
      </Content.Content>
    </Content.Container>
  )
}

type OverlayerItemProps = {
  overlayer: Overlayer
  isPlaying?: boolean
  setOverlayer: (overlayer: Overlayer | null) => void
}
function OverlayerItem({ overlayer, isPlaying, setOverlayer }: OverlayerItemProps) {
  const setOutput = useOverlayer((state) => state.setOutput)

  const { mutate: handleSetOutput, isPending: isSettingOutput } = useMutation({
    mutationFn: async () => {
      await setOutput(overlayer)
    }
  })
  return (
    <GroupButton.Container className="w-full">
      <GroupButton.Button
        icon={isPlaying ? Square : Play}
        iconClassName={!isPlaying ? 'text-error' : undefined}
        variant={isPlaying ? 'error' : 'defaultOutline'}
        isLoading={isSettingOutput}
        onClick={() => handleSetOutput()}
        className="grow"
      >
        <div className="grow ml-2 text-left">{overlayer.name}</div>
      </GroupButton.Button>
      <GroupButton.Button
        iconClassName="text-error"
        variant={'defaultOutline'}
        onClick={() => setOverlayer(overlayer)}
      >
        <Pencil className="size-4" />
      </GroupButton.Button>
    </GroupButton.Container>
  )
}

type FormOverlayerDialogProps = {
  overlayer: Overlayer
  setOverlayer: (overlayer: Overlayer | null) => void
}

function FormOverlayerDialog({ overlayer, setOverlayer }: FormOverlayerDialogProps) {
  const updateOverlayer = useOverlayer((state) => state.updateOverlayer)
  const deleteOverlayer = useOverlayer((state) => state.deleteOverlayer)
  const setOutput = useOverlayer((state) => state.setOutput)
  const output = useOverlayer((state) => state.output)

  const confirm = useConfirm()
  const { mutate: handleDeleteOverlayer, isPending: isDeletingOverlayer } = useMutation({
    mutationFn: async () => {
      const confirmed = await confirm({
        title: 'Deletar Overlayer',
        description: 'Tem certeza que deseja deletar este overlayer?',
        labelConfirm: 'Deletar',
        labelCancel: 'Cancelar'
      })
      if (confirmed) {
        await deleteOverlayerToast(
          deleteOverlayer(overlayer.id).then(async () => {
            if (output?.id === overlayer.id) {
              await setOutput(null)
            }
            setOverlayer(null)
          })
        )
      }
    }
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(OverlayerSchema),
    defaultValues: overlayer
  })

  const onSubmit = async (data: Overlayer) => {
    console.log(data)
    await saveOverlayerToast(
      updateOverlayer(data).then(async (updatedOverlayer) => {
        if (output?.id === updatedOverlayer.id) {
          await setOutput(updatedOverlayer, true)
        }
        setOverlayer(null)
      })
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 mt-6">
      <FormControl label="Nome do Overlayer" error={errors.name?.message}>
        <TextField {...register('name')} placeholder="Nome do Overlayer" error={!!errors.name} />
      </FormControl>
      <FormControl label="Título" error={errors.title?.message}>
        <TextField
          {...register('title')}
          placeholder="Título do Overlayer"
          error={!!errors.title}
        />
      </FormControl>
      <FormControl label="Texto" error={errors.text?.message}>
        <TextAreaField
          {...register('text')}
          rows={5}
          placeholder="Texto do Overlayer"
          error={!!errors.text}
        />
      </FormControl>
      <div className="flex gap-2 w-full pt-6">
        <Button
          type="submit"
          variant="primary"
          className="grow"
          icon={Save}
          isLoading={isSubmitting}
        >
          Salvar
        </Button>
        <Button
          icon={Trash}
          type="button"
          variant="error"
          className="grow"
          isLoading={isDeletingOverlayer}
          onClick={() => handleDeleteOverlayer()}
        >
          Deletar
        </Button>
      </div>
    </form>
  )
}
