import type { MessageStats } from '@ischeduler/shared'
import { AlertCircleIcon, CalendarClockIcon, CheckCircle2Icon, XCircleIcon } from 'lucide-react'
import { SummaryCard } from './summary-card'

interface SummaryCardsSectionProps {
  stats: MessageStats | undefined
  failureRate: number
}

export function SummaryCardsSection({ stats, failureRate }: SummaryCardsSectionProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <SummaryCard
        title="Scheduled"
        value={stats?.scheduled ?? 0}
        icon={<CalendarClockIcon />}
        description="Pending delivery"
      />
      <SummaryCard
        title="Delivered"
        value={stats?.sent ?? 0}
        icon={<CheckCircle2Icon />}
        description="Sent / delivered"
      />
      <SummaryCard
        title="Failed"
        value={stats?.failed ?? 0}
        icon={<AlertCircleIcon />}
        description={`${failureRate}% failure rate`}
      />
      <SummaryCard
        title="Cancelled"
        value={stats?.cancelled ?? 0}
        icon={<XCircleIcon />}
        description="User cancelled"
      />
    </div>
  )
}
