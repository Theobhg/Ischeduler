import type { MessageStats } from '@ischeduler/shared'
import { ClockIcon } from 'lucide-react'
import { PrimaryIconBadge } from '@/components/primary-icon-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SystemInfoCardProps {
  stats: MessageStats | undefined
  failureRate: number
}

export function SystemInfoCard({ stats, failureRate }: SystemInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PrimaryIconBadge>
            <ClockIcon />
          </PrimaryIconBadge>
          System Info
        </CardTitle>
        <CardDescription>Message delivery overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total messages</span>
            <span className="font-medium">{stats?.total ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Failure rate</span>
            <span className={cn('font-medium', failureRate > 20 && 'text-destructive')}>{failureRate}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">In queue</span>
            <span className="font-medium">{stats?.queued ?? '—'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
