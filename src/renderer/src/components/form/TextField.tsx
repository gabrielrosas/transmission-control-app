import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../libs/cn'

const textFieldVariants = cva('', {
  variants: {
    variant: {
      default:
        'w-full px-3 py-2 border border-border rounded-md text-white placeholder-neutral-400 outline-none disabled:bg-muted disabled:text-muted-foreground'
    },
    error: {
      true: 'border-error',
      false: ''
    }
  },
  defaultVariants: {
    variant: 'default',
    error: false
  }
})

type TextFieldProps = {
  error?: boolean
} & VariantProps<typeof textFieldVariants> &
  React.InputHTMLAttributes<HTMLInputElement>

export function TextField({ className, variant, error, ...props }: TextFieldProps) {
  return <input {...props} className={cn(textFieldVariants({ variant, error }), className)} />
}
