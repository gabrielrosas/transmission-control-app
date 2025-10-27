import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle, Zap, ZapOff, type LucideIcon } from 'lucide-react'
import { cn } from '../libs/cn'

const tagVariants = cva(
  'flex flex-row items-center justify-start gap-1 text-xs font-bold px-2 py-1 rounded',
  {
    variants: {
      variant: {
        default: 'bg-popover text-popover-foreground',
        error: 'bg-error/30 text-foreground',
        success: 'bg-success/30 text-foreground'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

const tagIconVariants = cva('size-3', {
  variants: {
    variant: {
      default: 'text-popover-foreground',
      error: 'text-error',
      success: 'text-success'
    },
    spin: {
      true: 'animate-spin',
      false: ''
    }
  },
  defaultVariants: {
    spin: false
  }
})

type Props = {
  className?: string
  iconClassName?: string
  label: string
  icon?: LucideIcon
} & VariantProps<typeof tagVariants> &
  VariantProps<typeof tagIconVariants>

export function Tag(props: Props) {
  const { className, iconClassName, label, icon: Icon, spin, variant } = props
  return (
    <div className={cn(tagVariants({ variant }), className)}>
      {Icon && <Icon className={cn(tagIconVariants({ spin, variant }), iconClassName)} />}
      {label}
    </div>
  )
}

export function StatusTag({
  isConnected,
  isLoading
}: {
  isConnected: boolean
  isLoading: boolean
}) {
  if (isLoading) {
    return <Tag label="Conectando..." icon={LoaderCircle} spin />
  }
  if (isConnected) {
    return <Tag label="Conectado" icon={Zap} variant="success" />
  }
  return <Tag label="Desconectado" icon={ZapOff} variant="error" />
}
