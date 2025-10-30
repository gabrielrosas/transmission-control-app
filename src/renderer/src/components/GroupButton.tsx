import { cn } from '@renderer/libs/cn'
import { Button, ButtonProps } from './Button'

export const GroupButton = {
  Container({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn('flex flex-row gap-px', className)}>{children}</div>
  },
  Button({ className, ...props }: ButtonProps) {
    return (
      <Button
        className={cn(
          className,
          'first:rounded-l first:rounded-r-none last:rounded-r last:rounded-l-none'
        )}
        rounded={false}
        {...props}
      />
    )
  }
}
