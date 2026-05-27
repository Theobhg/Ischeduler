import type { MessageStatus } from '@ischeduler/shared'
import {
  AlertCircleIcon,
  BanIcon,
  CalendarClockIcon,
  CheckCheckIcon,
  CheckCircle2Icon,
  ClockIcon,
  MailCheckIcon,
  SendIcon,
} from 'lucide-react'

export const messageStatusTone: Record<MessageStatus, string> = {
  SCHEDULED: 'bg-muted/70 text-muted-foreground',
  QUEUED: 'bg-accent/50 text-accent-foreground',
  ACCEPTED: 'bg-primary/8 text-primary',
  SENT: 'bg-primary/12 text-primary',
  DELIVERED: 'bg-primary/16 text-primary',
  RECEIVED: 'bg-primary/20 text-primary',
  FAILED: 'bg-destructive/10 text-destructive',
  CANCELLED: 'bg-muted/40 text-muted-foreground',
}

export const messageStatusLabel: Record<MessageStatus, string> = {
  SCHEDULED: 'Scheduled',
  QUEUED: 'Queued',
  ACCEPTED: 'Accepted',
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  RECEIVED: 'Received',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

export const messageStatusIcon: Record<MessageStatus, typeof CalendarClockIcon> = {
  SCHEDULED: CalendarClockIcon,
  QUEUED: ClockIcon,
  ACCEPTED: CheckCircle2Icon,
  SENT: SendIcon,
  DELIVERED: CheckCheckIcon,
  RECEIVED: MailCheckIcon,
  FAILED: AlertCircleIcon,
  CANCELLED: BanIcon,
}
