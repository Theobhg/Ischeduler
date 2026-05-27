import type { MessageStatus } from '@ischeduler/shared'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

const STATUS_VARIANT: Record<MessageStatus, BadgeVariant> = {
  SCHEDULED: 'outline',
  QUEUED: 'outline',
  ACCEPTED: 'secondary',
  SENT: 'secondary',
  DELIVERED: 'default',
  RECEIVED: 'default',
  FAILED: 'destructive',
  CANCELLED: 'outline',
}

const STATUS_CLASS: Partial<Record<MessageStatus, string>> = {
  CANCELLED: 'text-muted-foreground',
}

interface MessageStatusBadgeProps {
  status: MessageStatus
}

export function MessageStatusBadge({ status }: MessageStatusBadgeProps) {
  return (
    <Badge
      variant={STATUS_VARIANT[status]}
      className={cn('font-medium text-xs', STATUS_CLASS[status])}
    >
      {status}
    </Badge>
  )
}
