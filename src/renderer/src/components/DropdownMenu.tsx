import * as DropdownMenuBase from '@radix-ui/react-dropdown-menu'
import { cn } from '@renderer/libs/cn'
import { Loader2, LucideIcon } from 'lucide-react'
import { useState } from 'react'

type DropdownMenuProps = {
  trigger: React.ReactNode
  children: React.ReactNode
  side?: 'bottom' | 'left' | 'right' | 'top'
}

type DropdownMenuItemProps = {
  children: React.ReactNode
  icon?: LucideIcon
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
}

export const DropdownMenu = {
  Container({ trigger, children, side = 'bottom' }: DropdownMenuProps) {
    const [open, setOpen] = useState(false)
    return (
      <DropdownMenuBase.Root open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuBase.Trigger asChild>{trigger}</DropdownMenuBase.Trigger>

        <DropdownMenuBase.Portal>
          <DropdownMenuBase.Content
            side={side}
            collisionPadding={8}
            className={cn(
              'min-w-[220px] rounded-md bg-secondary-hover p-1',
              'will-change-[opacity,transform] shadow-tooltip',
              'data-[side=bottom]:animate-slideUpAndFade',
              'data-[side=left]:animate-slideRightAndFade',
              'data-[side=right]:animate-slideLeftAndFade',
              'data-[side=top]:animate-slideDownAndFade',
              'data-[state=closed]:hidden'
            )}
            sideOffset={0}
            onInteractOutside={(event) => {
              event.preventDefault()
              setOpen(false)
            }}
            onFocusOutside={(event) => {
              event.preventDefault()
              setOpen(false)
            }}
          >
            {children}

            <DropdownMenuBase.Arrow className="fill-secondary-hover" width={16} height={8} />
          </DropdownMenuBase.Content>
        </DropdownMenuBase.Portal>
      </DropdownMenuBase.Root>
    )
  },

  Item({ children, icon: Icon, onClick, isLoading, disabled = false }: DropdownMenuItemProps) {
    return (
      <DropdownMenuBase.Item asChild>
        <button
          className={cn(
            'w-full flex items-center gap-2 select-none cursor-pointer',
            'text-sm rounded-md p-2 hover:bg-secondary outline-none focus:bg-secondary',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          onClick={onClick}
          disabled={disabled || isLoading}
        >
          {Icon && !isLoading ? (
            <Icon className="size-4" />
          ) : (
            <Loader2 className="size-4 animate-spin" />
          )}
          {children}
        </button>
      </DropdownMenuBase.Item>
    )
  },

  Separator() {
    return <DropdownMenuBase.Separator className="h-px bg-secondary my-1" />
  },

  Label({ children }: { children: React.ReactNode }) {
    return (
      <DropdownMenuBase.Label className="text-xs font-medium text-muted-foreground px-2 py-1">
        {children}
      </DropdownMenuBase.Label>
    )
  }
}
