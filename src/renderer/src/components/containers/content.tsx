import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../libs/cn'

const contentVariants = cva('flex flex-col', {
  variants: {
    variant: {
      default: 'w-full',
      container: 'w-full max-w-[1000px]'
    },
    border: {
      true: 'border border-border rounded',
      false: ''
    },
    hFull: {
      true: 'min-h-full',
      false: ''
    }
  },
  defaultVariants: {
    variant: 'default',
    border: true,
    hFull: false
  }
})

type ContainerProps = {
  children: React.ReactNode
  className?: string
} & VariantProps<typeof contentVariants>

export function Container({ children, className, ...props }: ContainerProps) {
  return <main className={cn(contentVariants(props), className)}>{children}</main>
}

const HeaderVariants = cva('p-4', {
  variants: {
    variant: {
      default: 'w-full flex items-center'
    },
    size: {
      small: 'p-2',
      medium: 'p-4'
    },
    border: {
      true: 'border-b border-border',
      false: ''
    }
  },
  defaultVariants: {
    variant: 'default',
    border: true,
    size: 'medium'
  }
})

type HeaderProps = {
  children: React.ReactNode
  className?: string
} & VariantProps<typeof HeaderVariants>

export function Header({ children, className, ...props }: HeaderProps) {
  return <div className={cn(HeaderVariants(props), className)}>{children}</div>
}

const ContentVariants = cva('p-4 flex-1', {
  variants: {
    variant: {
      default: ''
    }
  },
  defaultVariants: {
    variant: 'default'
  }
})

type ContentProps = {
  children: React.ReactNode
  className?: string
} & VariantProps<typeof ContentVariants>

export function Content({ children, className, ...props }: ContentProps) {
  return <div className={cn(ContentVariants(props), className)}>{children}</div>
}
