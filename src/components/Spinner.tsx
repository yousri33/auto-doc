import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <div
      className={cn('animate-spin rounded-full shrink-0', className)}
      style={{
        width: size,
        height: size,
        border: `${Math.max(2, size * 0.1)}px solid hsl(var(--border))`,
        borderTopColor: 'hsl(var(--primary))',
      }}
    />
  )
}
