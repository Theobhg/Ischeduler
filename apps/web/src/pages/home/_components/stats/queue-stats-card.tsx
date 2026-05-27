import type { QueueStats } from '@ischeduler/shared'
import { DatabaseIcon } from 'lucide-react'
import { PrimaryIconBadge } from '@/components/primary-icon-badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QueueStatTile } from './queue-stat-tile'

interface QueueStatsCardProps {
  stats: QueueStats | undefined
}

export function QueueStatsCard({ stats }: QueueStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PrimaryIconBadge>
            <DatabaseIcon />
          </PrimaryIconBadge>
          Queue Stats
        </CardTitle>
        <CardDescription>Live job counts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <QueueStatTile label="Waiting" value={stats?.waiting ?? 0} />
          <QueueStatTile label="Delayed" value={stats?.delayed ?? 0} />
          <QueueStatTile label="Active" value={stats?.active ?? 0} />
          <QueueStatTile label="Completed" value={stats?.completed ?? 0} />
          <QueueStatTile label="Failed" value={stats?.failed ?? 0} />
        </div>
      </CardContent>
    </Card>
  )
}
