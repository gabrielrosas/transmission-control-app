import { DialogConfirm } from '@renderer/components/Dialog'
import { useMemo, useState } from 'react'

type ConfirmProps = {
  title?: string
  description?: string
  labelConfirm?: string
  labelCancel?: string
  onSubmit?: (confirmed: boolean) => void
}

export function useConfirm(props: ConfirmProps) {
  const [open, setOpen] = useState(false)

  const component = useMemo(() => {
    return (
      <DialogConfirm
        open={open}
        setOpen={setOpen}
        title={props.title}
        description={props.description}
        labelConfirm={props.labelConfirm}
        labelCancel={props.labelCancel}
        onSubmit={props.onSubmit}
      />
    )
  }, [props, open])

  return { component, open: () => setOpen(true), close: () => setOpen(false) }
}
