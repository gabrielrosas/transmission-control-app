import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../libs/cn'
import { ChevronDown } from 'lucide-react'

const textFieldVariants = cva('appearance-none', {
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
  containerClassName?: string
  error?: boolean
  options: { label: string; value: string }[]
} & VariantProps<typeof textFieldVariants> &
  React.SelectHTMLAttributes<HTMLSelectElement>

export function Select({
  containerClassName,
  className,
  variant,
  error,
  options,
  ...props
}: TextFieldProps) {
  return (
    <div className={cn(containerClassName, 'relative')}>
      <select {...props} className={cn(textFieldVariants({ variant, error }), className)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-6" />
    </div>
  )
}
