import type { MessageStatus } from '@ischeduler/shared'

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
