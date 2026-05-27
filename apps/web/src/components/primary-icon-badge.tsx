import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PrimaryIconBadgeProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md'
}

export function PrimaryIconBadge({ children, className, size = 'md' }: PrimaryIconBadgeProps) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary',
        size === 'sm' ? 'size-8 rounded-md [&>svg]:size-3.5' : 'size-9 [&>svg]:size-4',
        '[&>svg]:shrink-0',
        className,
      )}
    >
      {children}
    </span>
  )
}
