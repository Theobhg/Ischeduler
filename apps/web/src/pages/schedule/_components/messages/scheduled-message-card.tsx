import type { MessageResponse } from '@ischeduler/shared'
import { format } from 'date-fns'
import { ClockIcon, PhoneIcon } from 'lucide-react'
import { PrimaryIconBadge } from '@/components/primary-icon-badge'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function formatPhoneDisplay(phone: string) {
  const match = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `+1 (${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

interface ScheduledMessageCardProps {
  message: MessageResponse
}

export function ScheduledMessageCard({ message }: ScheduledMessageCardProps) {
  return (
    <Card size="sm" className="border border-primary/15 shadow-none ring-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <PrimaryIconBadge size="sm">
            <PhoneIcon />
          </PrimaryIconBadge>
          <span className="font-mono">{formatPhoneDisplay(message.toPhone)}</span>
        </CardTitle>
        <CardDescription className="line-clamp-2">{message.body}</CardDescription>
      </CardHeader>
      <Separator className="bg-primary/10" />
      <CardFooter className="flex items-center gap-1.5 text-primary/80">
        <ClockIcon className="size-3.5 shrink-0" />
        <span className="text-xs">{format(new Date(message.scheduledAt), 'PPp')}</span>
      </CardFooter>
    </Card>
  )
}
