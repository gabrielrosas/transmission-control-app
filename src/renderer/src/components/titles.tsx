import type { LucideIcon } from 'lucide-react'

type TitleProps = {
  children: React.ReactNode
  tag?: React.ReactNode
  icon?: LucideIcon
}

export function Title({ children, icon: Icon, tag }: TitleProps) {
  return (
    <h1 className="w-full flex flex-row items-center justify-start gap-2 text-2xl font-bold">
      {Icon && <Icon className="size-6" />}
      <div className="grow">{children}</div>
      {tag}
    </h1>
  )
}

type SubtitleProps = {
  children: React.ReactNode
  tag?: React.ReactNode
  icon?: LucideIcon
}

export function Subtitle({ children, icon: Icon, tag }: SubtitleProps) {
  return (
    <h1 className="w-full flex flex-row items-center justify-start gap-2 text-md font-bold">
      {Icon && <Icon className="size-4" />}
      <div className="grow">{children}</div>
      {tag}
    </h1>
  )
}
