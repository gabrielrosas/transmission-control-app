import { Button } from '@renderer/components/Button'
import { Content } from '@renderer/components/containers'
import { TextField, FormControl } from '@renderer/components/form'
import { Title } from '@renderer/components/titles'
import { Layers, Plus, Trash, Save, EllipsisVertical, Edit } from 'lucide-react'
import { useConfig } from '@renderer/hooks/config'
import { OverlayerControl, OverlayerControlSchema } from '@renderer/schemas/OverlayerControl'
import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
import { useMutation } from '@tanstack/react-query'
import { useConfirm } from '@renderer/hooks/utils/confirm'
import { Dialog } from '@renderer/components/Dialog'
import { GroupButton } from '@renderer/components/GroupButton'
import { DropdownMenu } from '@renderer/components/DropdownMenu'

const addToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Adicionando controle...',
    success: 'Controle adicionado!',
    error: 'Erro ao adicionar controle'
  })
const saveToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Salvando controle...',
    success: 'Controle salvo!',
    error: 'Erro ao salvar controle'
  })
const deleteToast = (promise: Promise<unknown>) =>
  toast.promise(promise, {
    loading: 'Apagando controle...',
    success: 'Controle apagado!',
    error: 'Erro ao apagar controle'
  })

export function OverlayersSettingsPage() {
  const overlayerControls = useConfig((state) => state.config.overlayerControls)
  const setConfig = useConfig((state) => state.setConfig)
  const [selected, setSelected] = useState<OverlayerControl | null>(null)

  const { mutate: addControl, isPending: isAdding } = useMutation({
    mutationFn: async () => {
      await addToast(
        (async () => {
          const newControl: OverlayerControl = {
            id: uuidv4(),
            name: '',
            url: ''
          }
          await setConfig({
            overlayerControls: { ...overlayerControls, [newControl.id]: newControl }
          })
          setSelected(newControl)
        })()
      )
    }
  })

  const saveControl = useCallback(
    async (control: OverlayerControl) => {
      await saveToast(
        (async () => {
          await setConfig({
            overlayerControls: { ...overlayerControls, [control.id]: control }
          })
          setSelected(null)
        })()
      )
    },
    [overlayerControls, setConfig]
  )

  const deleteControl = useCallback(
    async (control: OverlayerControl) => {
      await deleteToast(
        (async () => {
          const next = { ...overlayerControls }
          delete next[control.id]
          await setConfig({ overlayerControls: next })
          setSelected(null)
        })()
      )
    },
    [overlayerControls, setConfig]
  )

  return (
    <Content.Container className="h-full">
      <Content.Header>
        <Title icon={Layers}>Overlayers</Title>
      </Content.Header>
      <Content.Content className="grow min-h-0 overflow-auto no-scrollbar flex flex-col gap-2">
        {Object.values(overlayerControls).map((control) => (
          <ControlItem
            key={control.id}
            control={control}
            setSelectedControl={setSelected}
            deleteControl={deleteControl}
          />
        ))}
        <Button
          icon={Plus}
          variant="primary"
          onClick={() => addControl()}
          type="button"
          isLoading={isAdding}
          full
        >
          Adicionar controle
        </Button>

        <Dialog
          open={!!selected}
          title={selected?.name || 'Novo controle'}
          setOpen={(open) => setSelected(open ? selected : null)}
        >
          {selected && (
            <FormControlBody
              control={selected}
              saveControl={saveControl}
              deleteControl={deleteControl}
            />
          )}
        </Dialog>
      </Content.Content>
    </Content.Container>
  )
}

function ControlItem({
  control,
  setSelectedControl,
  deleteControl
}: {
  control: OverlayerControl
  setSelectedControl: (c: OverlayerControl | null) => void
  deleteControl: (c: OverlayerControl) => Promise<void>
}) {
  const { component: confirmDelete, open: openConfirmDelete } = useConfirm({
    title: 'Tem certeza que deseja apagar este controle?',
    description: 'Esta ação remove o controle e todos os seus itens.',
    labelConfirm: 'Apagar',
    labelCancel: 'Cancelar',
    onSubmit: async (confirmed) => {
      if (confirmed) await deleteControl(control)
    }
  })

  return (
    <>
      <GroupButton.Container className="w-full">
        <GroupButton.Button className="grow" onClick={() => setSelectedControl(control)}>
          {control.name || 'Novo controle'}
        </GroupButton.Button>
        <DropdownMenu.Container
          trigger={
            <GroupButton.Button className="data-[state=open]:bg-secondary-hover">
              <EllipsisVertical />
            </GroupButton.Button>
          }
        >
          <DropdownMenu.Item icon={Edit} onClick={() => setSelectedControl(control)}>
            Editar controle
          </DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item icon={Trash} onClick={openConfirmDelete}>
            Apagar controle
          </DropdownMenu.Item>
        </DropdownMenu.Container>
      </GroupButton.Container>
      {confirmDelete}
    </>
  )
}

function FormControlBody({
  control,
  saveControl,
  deleteControl
}: {
  control: OverlayerControl
  saveControl: (c: OverlayerControl) => Promise<void>
  deleteControl: (c: OverlayerControl) => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(OverlayerControlSchema),
    defaultValues: control
  })

  const { mutate: saveMutation, isPending: isSaving } = useMutation({
    mutationFn: saveControl
  })
  const { mutate: deleteMutation, isPending: isDeleting } = useMutation({
    mutationFn: deleteControl
  })

  const { component: confirmDelete, open: openConfirmDelete } = useConfirm({
    title: 'Tem certeza que deseja apagar este controle?',
    description: 'Esta ação remove o controle e todos os seus itens.',
    labelConfirm: 'Apagar',
    labelCancel: 'Cancelar',
    onSubmit: async (confirmed) => {
      if (confirmed) await deleteMutation(control)
    }
  })

  useEffect(() => {
    reset(control)
  }, [control, reset])

  return (
    <>
      <form
        className="flex flex-col gap-2"
        onSubmit={handleSubmit(async (data) => saveMutation(data as OverlayerControl))}
      >
        <FormControl label="Nome do controle" error={errors.name?.message}>
          <TextField {...register('name')} type="text" placeholder="Ex: Overlay principal" />
        </FormControl>
        <FormControl label="URL do controle" error={errors.url?.message}>
          <TextField
            {...register('url')}
            type="text"
            placeholder="https://app.overlays.uno/control/..."
          />
        </FormControl>
        <div className="h-px w-full bg-border my-4" />
        <Button
          icon={Save}
          type="submit"
          variant="primary"
          isLoading={isSaving}
          disabled={isSaving || isDeleting}
        >
          Salvar
        </Button>
        <Button
          icon={Trash}
          type="button"
          variant="error"
          isLoading={isDeleting}
          disabled={isSaving || isDeleting}
          onClick={openConfirmDelete}
        >
          Apagar
        </Button>
      </form>
      {confirmDelete}
    </>
  )
}
