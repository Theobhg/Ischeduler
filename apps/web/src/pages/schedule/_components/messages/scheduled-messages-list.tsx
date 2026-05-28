import { AlertTriangleIcon, CalendarClockIcon } from 'lucide-react'
import { PrimaryIconBadge } from '@/components/primary-icon-badge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMessages } from '@/hooks/use-messages'
import { ScheduledMessageCard } from './scheduled-message-card'

export function ScheduledMessagesList() {
  const { data } = useMessages({ status: 'SCHEDULED', limit: 50 })

  const now = new Date()

  const all = [...(data?.data ?? [])].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )

  const upcoming = all.filter((m) => new Date(m.scheduledAt) > now)
  const overdue = all.filter((m) => new Date(m.scheduledAt) <= now)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PrimaryIconBadge>
            <CalendarClockIcon />
          </PrimaryIconBadge>
          Scheduled Messages
          <Badge variant="outline" className="ml-auto border-primary/20 bg-primary/10 font-normal text-primary">
            {upcoming.length}
          </Badge>
        </CardTitle>
        <CardDescription>Upcoming messages waiting to be sent</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {upcoming.length === 0 && overdue.length === 0 && (
          <p className="text-sm text-muted-foreground">No scheduled messages yet.</p>
        )}

        {upcoming.length > 0 && (
          <div className="flex flex-col gap-3">
            {upcoming.map((message) => (
              <ScheduledMessageCard key={message.id} message={message} />
            ))}
          </div>
        )}

        {overdue.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertTriangleIcon className="size-3.5 shrink-0" />
              <span>
                {overdue.length} message{overdue.length > 1 ? 's were' : ' was'} not sent because the server was
                offline. Cancel {overdue.length > 1 ? 'them' : 'it'} or reschedule.
              </span>
            </div>
            {overdue.map((message) => (
              <ScheduledMessageCard key={message.id} message={message} overdue />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
