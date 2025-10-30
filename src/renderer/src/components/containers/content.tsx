import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../libs/cn'
import { createContext, useContext } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

const ContainerContext = createContext<{
  colapsed: boolean | undefined
  changeColapsed: (() => void) | undefined
}>({
  colapsed: undefined,
  changeColapsed: undefined
})

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
  colapsed?: boolean
  changeColapsed?: () => void
  children: React.ReactNode
  className?: string
} & VariantProps<typeof contentVariants>

export function Container({
  colapsed,
  changeColapsed,
  children,
  className,
  ...props
}: ContainerProps) {
  return (
    <ContainerContext.Provider value={{ colapsed, changeColapsed }}>
      <div className={cn(contentVariants(props), className)}>{children}</div>
    </ContainerContext.Provider>
  )
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

export function Header({ children, className, border, ...props }: HeaderProps) {
  const { colapsed, changeColapsed } = useContext(ContainerContext)

  if (changeColapsed && colapsed !== undefined) {
    return (
      <button
        onClick={changeColapsed}
        className={cn(
          HeaderVariants({
            ...props,
            border: colapsed === undefined ? border : !colapsed
          }),
          'cursor-pointer relative',
          { 'opacity-40': colapsed === true },
          className
        )}
      >
        {children}
        {colapsed === true && (
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-6" />
        )}
        {colapsed === false && (
          <ChevronUp className="absolute right-2 top-1/2 -translate-y-1/2 size-6" />
        )}
      </button>
    )
  }
  return (
    <div
      className={cn(
        HeaderVariants({
          ...props,
          border: colapsed === undefined ? border : !colapsed
        }),
        className
      )}
    >
      {children}
    </div>
  )
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
  const { colapsed } = useContext(ContainerContext)
  if (colapsed === true) return null
  return <div className={cn(ContentVariants(props), className)}>{children}</div>
}
