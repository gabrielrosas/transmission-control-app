import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../libs/cn'

type FormControlProps = {
  label?: string
  children: React.ReactNode
  error?: string
}

export function FormControl({ label, children, error }: FormControlProps) {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <FormLabel variant="default" error={!!error}>
          {label}
        </FormLabel>
      )}
      {children}
      {error && <FormError>{error}</FormError>}
    </div>
  )
}

const labelVariants = cva('', {
  variants: {
    variant: {
      default: 'block text-sm font-medium text-white'
    },
    error: {
      true: 'text-error',
      false: ''
    }
  },
  defaultVariants: {
    variant: 'default',
    error: false
  }
})
type FormLabelProps = {
  children: React.ReactNode
} & VariantProps<typeof labelVariants>

export function FormLabel({ children, variant, error }: FormLabelProps) {
  return <label className={cn(labelVariants({ variant, error }))}>{children}</label>
}

export function FormError({ children }: { children: React.ReactNode }) {
  return <p className="text-error text-xs">{children}</p>
}
