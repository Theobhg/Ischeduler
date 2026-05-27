import type { MessageStatus } from '@ischeduler/shared'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { messageStatusIcon, messageStatusLabel, messageStatusTone } from './status-tones'

interface MessageStatusBadgeProps {
  status: MessageStatus
}

export function MessageStatusBadge({ status }: MessageStatusBadgeProps) {
  const Icon = messageStatusIcon[status]
  const label = messageStatusLabel[status]

  return (
    <Badge
      variant="outline"
      className={cn('border-transparent font-medium', messageStatusTone[status])}
    >
      <Icon data-icon="inline-start" />
      {label}
    </Badge>
  )
}
