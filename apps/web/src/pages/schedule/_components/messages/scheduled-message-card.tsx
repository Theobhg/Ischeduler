import type { MessageResponse } from '@ischeduler/shared'
import { format } from 'date-fns'
import { ClockIcon, PhoneIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PrimaryIconBadge } from '@/components/primary-icon-badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCancelMessage } from '@/hooks/use-messages'
import { cn } from '@/lib/utils'

function formatPhoneDisplay(phone: string) {
  const match = phone.match(/^\+1(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `+1 (${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}

interface ScheduledMessageCardProps {
  message: MessageResponse
  overdue?: boolean
}

export function ScheduledMessageCard({ message, overdue = false }: ScheduledMessageCardProps) {
  const { cancelMessage, isCancellingMessage } = useCancelMessage()

  function handleCancel() {
    cancelMessage(message.id, {
      onSuccess: () => toast.success('Message cancelled.'),
      onError: () => toast.error('Failed to cancel message.'),
    })
  }

  return (
    <Card
      size="sm"
      className={cn(
        'shadow-none ring-0',
        overdue
          ? 'border border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/20'
          : 'border border-primary/15',
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <PrimaryIconBadge size="sm">
            <PhoneIcon />
          </PrimaryIconBadge>
          <span className="font-mono">{formatPhoneDisplay(message.toPhone)}</span>
          {overdue && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="ml-auto text-amber-600 hover:bg-amber-100 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
              disabled={isCancellingMessage}
              onClick={handleCancel}
              aria-label="Cancel message"
            >
              <XIcon />
            </Button>
          )}
        </CardTitle>
        <CardDescription className="line-clamp-2">{message.body}</CardDescription>
      </CardHeader>
      <Separator className={overdue ? 'bg-amber-400/20' : 'bg-primary/10'} />
      <CardFooter
        className={cn(
          'flex items-center gap-1.5',
          overdue ? 'text-amber-600 dark:text-amber-400' : 'text-primary/80',
        )}
      >
        <ClockIcon className="size-3.5 shrink-0" />
        <span className="text-xs">{format(new Date(message.scheduledAt), 'PPp')}</span>
      </CardFooter>
    </Card>
  )
}
