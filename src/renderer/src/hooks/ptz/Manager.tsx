import { useCallback, useState } from 'react'
import { PTZManagerContext, PTZPreset } from './hooks'
import { Dialog } from '@renderer/components/Dialog'
import { FormControl, TextField } from '@renderer/components/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { CameraPTZConfig } from '@renderer/schemas/CameraPTZ'
import { useLocalStorage } from 'usehooks-ts'
import { Button } from '@renderer/components/Button'
import { RotateCcw, Save } from 'lucide-react'

type PTZManagerProps = {
  children: React.ReactNode
}

type DialogAliasData = {
  config: CameraPTZConfig
  preset: PTZPreset
}

export function PTZManagerProvider({ children }: PTZManagerProps) {
  const [dialogAliasProps, setDialogAliasProps] = useState<DialogAliasData | null>(null)
  const [alias, setAliasState] = useLocalStorage<Record<string, string>>('presets-alias', {})
  const showModalAlias = useCallback(
    (config: CameraPTZConfig, preset: PTZPreset) => {
      setDialogAliasProps({
        config,
        preset
      })
    },
    [setDialogAliasProps]
  )

  const setAlias = useCallback(
    (key: string, value: string) => {
      setAliasState((prev) => ({ ...prev, [key]: value }))
      setDialogAliasProps(null)
    },
    [setAliasState, setDialogAliasProps]
  )

  const deleteAlias = useCallback(
    (key: string) => {
      setAliasState((prev) => {
        const newState = { ...prev }
        delete newState[key]
        return newState
      })
      setDialogAliasProps(null)
    },
    [setAliasState, setDialogAliasProps]
  )
  return (
    <PTZManagerContext.Provider
      value={{
        showModalAlias,
        alias
      }}
    >
      <div className="flex flex-col gap-2 grow min-h-0 w-full">{children}</div>
      <DialogAlias
        data={dialogAliasProps}
        onClose={() => setDialogAliasProps(null)}
        setAlias={setAlias}
        alias={alias}
        deleteAlias={deleteAlias}
      />
    </PTZManagerContext.Provider>
  )
}

type DialogAliasProps = {
  data: DialogAliasData | null
  onClose: () => void
  setAlias: (key: string, value: string) => void
  deleteAlias: (key: string) => void
  alias: Record<string, string>
}

function DialogAlias({ data, onClose, setAlias, deleteAlias, alias }: DialogAliasProps) {
  return (
    <Dialog open={!!data} title="Editar Nome do Preset" setOpen={(open) => !open && onClose()}>
      {data && (
        <DialogAliasForm data={data} setAlias={setAlias} deleteAlias={deleteAlias} alias={alias} />
      )}
    </Dialog>
  )
}

type DialogAliasFormProps = {
  data: DialogAliasData
  setAlias: (key: string, value: string) => void
  deleteAlias: (key: string) => void
  alias: Record<string, string>
}

function DialogAliasForm({ data, setAlias, deleteAlias, alias }: DialogAliasFormProps) {
  const {
    handleSubmit,
    register,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(z.object({ name: z.string().min(1) })),
    defaultValues: { name: alias[`${data?.config.id}-${data?.preset.id}`] || data.preset.name }
  })

  const onSubmit = (formData: { name: string }) => {
    setAlias(`${data.config.id}-${data.preset.id}`, formData.name)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <FormControl label="Nome do Preset" error={errors.name?.message}>
        <TextField {...register('name')} type="text" placeholder="Nome da câmera" />
      </FormControl>
      <div className="h-px w-full bg-border my-4" />
      <Button icon={Save} type="submit" variant="primary">
        Salvar nome
      </Button>
      <Button
        icon={RotateCcw}
        type="button"
        variant="error"
        onClick={() => deleteAlias(`${data.config.id}-${data.preset.id}`)}
      >
        Reverter nome
      </Button>
    </form>
  )
}
