import { format } from 'date-fns'
import { CopyIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { MessageStatus, StatusEvent } from '@ischeduler/shared'
import { useMessage } from '@/hooks/use-messages'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageStatusBadge } from './message-status-badge'

interface MessageDetailSheetProps {
  messageId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive'

const TIMELINE_VARIANT: Record<MessageStatus, BadgeVariant> = {
  SCHEDULED: 'outline',
  QUEUED: 'outline',
  ACCEPTED: 'secondary',
  SENT: 'secondary',
  DELIVERED: 'default',
  RECEIVED: 'default',
  FAILED: 'destructive',
  CANCELLED: 'outline',
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => {
    toast.success(`${label} copied`)
  })
}

export function MessageDetailSheet({ messageId, open, onOpenChange }: MessageDetailSheetProps) {
  const { data: message, isLoading } = useMessage(messageId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Message Details</SheetTitle>
          <SheetDescription>
            Full status history and delivery information for this scheduled message.
          </SheetDescription>
        </SheetHeader>

        {isLoading && (
          <div className="px-4 pb-4 flex flex-col gap-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {message && (
          <div className="px-4 pb-4 flex flex-col gap-6">
            {/* Meta fields */}
            <dl className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Status</dt>
                <dd><MessageStatusBadge status={message.status} /></dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Recipient</dt>
                <dd className="text-sm font-mono">{message.toPhone}</dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Scheduled At</dt>
                <dd className="text-sm">{format(new Date(message.scheduledAt), 'PPp')}</dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-sm text-muted-foreground">Created At</dt>
                <dd className="text-sm text-muted-foreground">{format(new Date(message.createdAt), 'PPp')}</dd>
              </div>

              {message.retryCount > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Retries</dt>
                  <dd className="text-sm">{message.retryCount}</dd>
                </div>
              )}

              {message.provider && (
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Provider</dt>
                  <dd className="text-sm font-mono">{message.provider}</dd>
                </div>
              )}

              {message.providerMessageId && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-sm text-muted-foreground shrink-0">Provider ID</dt>
                  <dd className="flex items-center gap-1 min-w-0">
                    <span className="text-sm font-mono truncate">{message.providerMessageId}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0"
                      onClick={() => copyToClipboard(message.providerMessageId ?? '', 'Provider ID')}
                    >
                      <CopyIcon data-icon />
                    </Button>
                  </dd>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <dt className="text-sm text-muted-foreground shrink-0">Message ID</dt>
                <dd className="flex items-center gap-1 min-w-0">
                  <span className="text-xs font-mono truncate text-muted-foreground">{message.id}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 shrink-0"
                    onClick={() => copyToClipboard(message.id, 'Message ID')}
                  >
                    <CopyIcon data-icon />
                  </Button>
                </dd>
              </div>
            </dl>

            {/* Error alert */}
            {message.errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{message.errorMessage}</AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Message body */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Message body</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message.body}</p>
            </div>

            <Separator />

            {/* Status timeline */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Status timeline</p>
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
    <ol className="flex flex-col gap-0">
      {events.map((event, idx) => (
        <li key={event.id} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <Badge
              variant={TIMELINE_VARIANT[event.status as MessageStatus]}
              className="size-2.5 rounded-full p-0 shrink-0 mt-1"
            />
            {idx < events.length - 1 && (
              <Separator orientation="vertical" className="flex-1 my-1 min-h-6" />
            )}
          </div>
          <div className="flex flex-col gap-0.5 pb-3">
            <p className="text-sm font-medium leading-none">{event.status}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(event.createdAt), 'PPp')}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}
