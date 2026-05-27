import type { MessageStatus } from '@ischeduler/shared'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<MessageStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  QUEUED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ACCEPTED: 'bg-purple-100 text-purple-800 border-purple-200',
  SENT: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  RECEIVED: 'bg-green-200 text-green-900 border-green-300',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200',
}

interface MessageStatusBadgeProps {
  status: MessageStatus
}

export function MessageStatusBadge({ status }: MessageStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn('font-medium text-xs', STATUS_STYLES[status])}
    >
      {status}
    </Badge>
  )
}
