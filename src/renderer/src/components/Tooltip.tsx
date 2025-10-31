import * as TooltipBase from '@radix-ui/react-tooltip'

type TooltipProps = {
  children: React.ReactNode
  trigger: React.ReactNode
  delay?: number
  skipDelay?: number
}

export function Tooltip({ children, trigger, delay = 700, skipDelay = 300 }: TooltipProps) {
  return (
    <TooltipBase.Provider delayDuration={delay} skipDelayDuration={skipDelay}>
      <TooltipBase.Root>
        <TooltipBase.Trigger asChild>{trigger}</TooltipBase.Trigger>
        <TooltipBase.Portal>
          <TooltipBase.Content
            collisionPadding={8}
            className="select-none rounded-lg bg-secondary-hover p-1 text-[15px] leading-none text-white shadow-tooltip will-change-[transform,opacity] data-[state=delayed-open]:data-[side=bottom]:animate-slideUpAndFade data-[state=delayed-open]:data-[side=left]:animate-slideRightAndFade data-[state=delayed-open]:data-[side=right]:animate-slideLeftAndFade data-[state=delayed-open]:data-[side=top]:animate-slideDownAndFade"
            sideOffset={0}
          >
            {children}
            <TooltipBase.Arrow className="fill-secondary-hover" width={24} height={12} />
          </TooltipBase.Content>
        </TooltipBase.Portal>
      </TooltipBase.Root>
    </TooltipBase.Provider>
  )
}
