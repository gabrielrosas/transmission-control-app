import { cn } from '@renderer/libs/cn'
import { Square, SquareCheckBig } from 'lucide-react'
import React, { useId } from 'react'

type BtnCheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
}

export function BtnCheckbox({ label, ...props }: BtnCheckboxProps) {
  const inputId = useId()
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex items-center justify-start gap-2 w-full group cursor-pointer',
        'border border-border p-2 rounded-md has-[input:checked]:bg-secondary-hover'
      )}
    >
      <input {...props} id={inputId} className="hidden" type="checkbox" />
      <Square className="group-has-[input:checked]:hidden" />
      <SquareCheckBig className="group-has-[input:checked]:block hidden" />
      {label}
    </label>
  )
}
