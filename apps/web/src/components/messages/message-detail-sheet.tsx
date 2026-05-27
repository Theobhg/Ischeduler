import { format } from 'date-fns'
import { CheckCircle2Icon, CircleDotIcon, ClockIcon, XCircleIcon } from 'lucide-react'
import type { MessageStatus, StatusEvent } from '@ischeduler/shared'
import { useMessage } from '@/hooks/use-messages'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageStatusBadge } from './message-status-badge'

interface MessageDetailSheetProps {
  messageId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_ICONS: Record<MessageStatus, React.ReactNode> = {
  SCHEDULED: <ClockIcon className="size-4 text-blue-500" />,
  QUEUED: <ClockIcon className="size-4 text-yellow-500" />,
  ACCEPTED: <CircleDotIcon className="size-4 text-purple-500" />,
  SENT: <CheckCircle2Icon className="size-4 text-cyan-500" />,
  DELIVERED: <CheckCircle2Icon className="size-4 text-green-500" />,
  RECEIVED: <CheckCircle2Icon className="size-4 text-green-700" />,
  FAILED: <XCircleIcon className="size-4 text-red-500" />,
  CANCELLED: <XCircleIcon className="size-4 text-gray-400" />,
}

export function MessageDetailSheet({ messageId, open, onOpenChange }: MessageDetailSheetProps) {
  const { data: message, isLoading } = useMessage(messageId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Message Details</SheetTitle>
        </SheetHeader>

        {isLoading && (
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}

        {message && (
          <div className="mt-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <MessageStatusBadge status={message.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">To</span>
                <span className="text-sm font-mono">{message.toPhone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Scheduled At</span>
                <span className="text-sm">{format(new Date(message.scheduledAt), 'PPp')}</span>
              </div>
              {message.provider && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Provider</span>
                  <span className="text-sm font-mono">{message.provider}</span>
                </div>
              )}
              {message.errorMessage && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-700">{message.errorMessage}</p>
                </div>
              )}
            </div>

            <div className="rounded-md border p-3 bg-muted/30">
              <p className="text-sm whitespace-pre-wrap">{message.body}</p>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3">Status Timeline</h3>
              <StatusTimeline events={[...message.statusEvents].reverse()} />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function StatusTimeline({ events }: { events: StatusEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No events yet.</p>
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0">
            {STATUS_ICONS[event.status as MessageStatus]}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{event.status}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(event.createdAt), 'PPp')}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
