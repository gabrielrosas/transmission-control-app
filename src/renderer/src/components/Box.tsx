import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../libs/cn'

const boxVariants = cva('flex', {
  variants: {
    direction: {
      column: 'flex-col',
      row: 'flex-row'
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end'
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end'
    },
    gap: {
      none: 'gap-0',
      small: 'gap-2',
      medium: 'gap-4',
      large: 'gap-6'
    },
    padding: {
      none: 'p-0',
      small: 'p-1',
      medium: 'p-2',
      large: 'p-3'
    },
    margin: {
      none: 'm-0',
      small: 'm-1',
      medium: 'm-2',
      large: 'm-3',
      auto: 'm-auto'
    },
    width: {
      full: 'w-full',
      form: 'w-full max-w-[400px]'
    }
  },
  defaultVariants: {
    direction: 'row',
    align: 'center',
    justify: 'start'
  }
})

type BoxProps = {
  children: React.ReactNode
  className?: string
} & VariantProps<typeof boxVariants> &
  React.HTMLAttributes<HTMLDivElement>

export function Box({ children, className, ...props }: BoxProps) {
  return <div className={cn(boxVariants(props), className)}>{children}</div>
}
