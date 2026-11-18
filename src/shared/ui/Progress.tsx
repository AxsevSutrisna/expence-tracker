import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@shared/lib/cn'

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorColor?: string
}

function Progress({ className, value, indicatorColor, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn('neo-progress-root', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="neo-progress-indicator"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: indicatorColor || 'var(--color-primary)',
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
