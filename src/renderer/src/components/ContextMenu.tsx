import * as ContextMenuBase from '@radix-ui/react-context-menu'
import { cn } from '@renderer/libs/cn'
import { Loader2, LucideIcon } from 'lucide-react'

type DropdownMenuProps = {
  trigger: React.ReactNode
  children: React.ReactNode
  onOpenChange?: (open: boolean) => void
}

type DropdownMenuItemProps = {
  children: React.ReactNode
  icon?: LucideIcon
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export const ContextMenu = {
  Container({ trigger, children, onOpenChange }: DropdownMenuProps) {
    return (
      <ContextMenuBase.Root modal={false} onOpenChange={onOpenChange}>
        <ContextMenuBase.Trigger asChild>{trigger}</ContextMenuBase.Trigger>

        <ContextMenuBase.Portal>
          <ContextMenuBase.Content
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
          >
            {children}
          </ContextMenuBase.Content>
        </ContextMenuBase.Portal>
      </ContextMenuBase.Root>
    )
  },

  Item({
    children,
    icon: Icon,
    onClick,
    isLoading,
    className,
    disabled = false
  }: DropdownMenuItemProps) {
    return (
      <ContextMenuBase.Item asChild>
        <button
          className={cn(
            'w-full flex items-center gap-2 select-none cursor-pointer',
            'text-sm rounded-md p-2 hover:bg-secondary outline-none focus:bg-secondary',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
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
      </ContextMenuBase.Item>
    )
  },

  Separator() {
    return <ContextMenuBase.Separator className="h-px bg-secondary my-1" />
  }
}
