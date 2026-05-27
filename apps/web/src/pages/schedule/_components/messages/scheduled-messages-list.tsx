import { CalendarClockIcon } from 'lucide-react'
import { PrimaryIconBadge } from '@/components/primary-icon-badge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMessages } from '@/hooks/use-messages'
import { ScheduledMessageCard } from './scheduled-message-card'

export function ScheduledMessagesList() {
  const { data, isLoading } = useMessages({ status: 'SCHEDULED', limit: 50 })

  const messages = [...(data?.data ?? [])].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PrimaryIconBadge>
            <CalendarClockIcon />
          </PrimaryIconBadge>
          Scheduled Messages
          <Badge variant="outline" className="ml-auto border-primary/20 bg-primary/10 font-normal text-primary">
            {messages.length}
          </Badge>
        </CardTitle>
        <CardDescription>Upcoming messages waiting to be sent</CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground">No scheduled messages yet.</p>
        )}

        {!isLoading && messages.length > 0 && (
          <div className="flex max-h-[calc(100dvh-14rem)] flex-col gap-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <ScheduledMessageCard key={message.id} message={message} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
