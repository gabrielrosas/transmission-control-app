import * as Slot from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import { Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '../libs/cn'
import { useMemo } from 'react'

const buttonVariants = cva(
  'flex flex-row items-center justify-center gap-1 text-sm outline-none disabled:!pointer-events-none disabled:opacity-50 p-2 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-secondary hover:bg-secondary-hover border border-secondary',
        defaultOutline:
          'bg-secondary text-secondary-foreground border border-border hover:bg-secondary-foreground/20',
        primary: 'bg-primary text-primary-foreground  border border-primary hover:bg-primary-hover',
        success: 'bg-success text-white border border-success hover:bg-success-hover',
        successOutline: 'bg-secondary text-success border border-success hover:bg-success/20',
        error:
          'bg-error text-white hover:bg-error-hover border border-error disabled:opacity-100 disabled:cursor-not-allowed',
        errorOutline:
          'bg-secondary text-error border border-error hover:bg-error/20 disabled:cursor-not-allowed',
        nav: 'rounded-none hover:bg-background-hover self-stretch'
      },
      rounded: {
        true: 'rounded-md ',
        false: ''
      },
      full: {
        true: 'w-full',
        false: ''
      },
      size: {
        normal: '',
        small: 'text-sm px-2 py-1',
        large: 'text-lg px-4 py-2'
      }
    },
    compoundVariants: [
      {
        variant: 'nav',
        rounded: true,
        className: 'rounded-none'
      }
    ],
    defaultVariants: {
      variant: 'default',
      full: false,
      size: 'normal',
      rounded: true
    }
  }
)
const buttonIconVariants = cva('', {
  variants: {
    size: {
      normal: 'size-4',
      small: 'size-3',
      large: 'size-5'
    }
  },
  defaultVariants: {
    size: 'normal'
  }
})

export type ButtonProps = {
  asChild?: boolean
  icon?: LucideIcon
  secondaryIcon?: LucideIcon
  isLoading?: boolean
  iconClassName?: string
} & VariantProps<typeof buttonVariants> &
  React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  children,
  icon: Icon,
  secondaryIcon: SecondaryIcon,
  isLoading,
  disabled,
  className,
  asChild,
  variant,
  rounded,
  full,
  size,
  iconClassName,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'

  const IconRender = useMemo(() => {
    if (Icon) {
      if (isLoading) {
        return <Loader2 className="size-4 animate-spin" />
      }
      return <Icon className={cn(buttonIconVariants({ size }), iconClassName)} />
    }
    return undefined
  }, [Icon, isLoading, size, iconClassName])

  const SecondaryIconRender = useMemo(() => {
    if (SecondaryIcon) {
      return <SecondaryIcon className={buttonIconVariants({ size })} />
    }
    return undefined
  }, [SecondaryIcon, size])

  return (
    <Comp
      className={cn(buttonVariants({ variant, full, size, rounded }), className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {IconRender}
      <Slot.Slottable>{children}</Slot.Slottable>
      {SecondaryIconRender}
    </Comp>
  )
}
