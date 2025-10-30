import { cn } from '@renderer/libs/cn'

export function Container({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn(className)}>{children}</div>
}
