import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle: string
  className?: string
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <h1 className="text-base font-semibold">{title}</h1>
      <p className="text-base text-muted-foreground">{subtitle}</p>
    </div>
  )
}
