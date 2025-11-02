import * as DialogBase from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from './Button'
// import { useConfirmStore } from '@renderer/hooks/utils'

type DialogProps = {
  trigger?: React.ReactNode
  title?: string
  description?: string
  children: React.ReactNode
  open?: boolean
  setOpen?: (open: boolean) => void
}

export function Dialog({ title, description, trigger, children, open, setOpen }: DialogProps) {
  return (
    <DialogBase.Root open={open} onOpenChange={setOpen}>
      {trigger && <DialogBase.Trigger asChild>{trigger}</DialogBase.Trigger>}
      <DialogBase.Portal>
        <DialogBase.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-overlayShow" />
        <DialogBase.Content className="fixed left-1/2 top-1/2 bg-background max-h-[90vh] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-md shadow-tooltip focus:outline-none data-[state=open]:animate-contentShow flex flex-col">
          <div className="border-b border-border flex flex-row items-stretch">
            <div className="p-4 grow">
              {title && (
                <DialogBase.Title className="m-0 text-[17px] font-medium text-white">
                  {title}
                </DialogBase.Title>
              )}
            </div>
            <DialogBase.Close asChild>
              <button
                className="cursor-pointer appearance-none p-3 flex items-center justify-center rounded-tr-md w-[40px] text-white bg-background hover:bg-background-hover outline-none"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </DialogBase.Close>
          </div>

          <div className="h-full w-full overflow-auto no-scrollbar p-[25px]">
            {description && (
              <DialogBase.Description className="text-[15px] leading-normal text-muted-foreground">
                {description}
              </DialogBase.Description>
            )}
            {children}
          </div>
        </DialogBase.Content>
      </DialogBase.Portal>
    </DialogBase.Root>
  )
}

export const DialogClose = DialogBase.Close

export type DialogConfirmProps = Omit<DialogProps, 'children'> & {
  onSubmit?: (confirmed: boolean) => void
  labelConfirm?: string
  labelCancel?: string
}
export function DialogConfirm({
  onSubmit,
  labelConfirm,
  labelCancel,
  ...props
}: DialogConfirmProps) {
  const handleConfirm = () => {
    console.log('handleConfirm')
    onSubmit?.(true)
  }

  const handleCancel = () => {
    console.log('handleCancel')
    onSubmit?.(false)
  }
  return (
    <Dialog {...props}>
      <div className="flex flex-row gap-2 mt-5">
        <DialogClose asChild>
          <Button variant="error" className="grow" onClick={handleConfirm}>
            {labelConfirm || 'Confirmar'}
          </Button>
        </DialogClose>
        <DialogClose asChild>
          <Button className="grow" onClick={handleCancel}>
            {labelCancel || 'Cancelar'}
          </Button>
        </DialogClose>
      </div>
    </Dialog>
  )
}
