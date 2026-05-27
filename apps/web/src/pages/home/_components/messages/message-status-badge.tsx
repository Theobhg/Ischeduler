import type { MessageStatus } from '@ischeduler/shared'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { messageStatusTone } from './status-tones'

interface MessageStatusBadgeProps {
  status: MessageStatus
}

export function MessageStatusBadge({ status }: MessageStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn('border-transparent font-medium', messageStatusTone[status])}>
      {status}
    </Badge>
  )
}
