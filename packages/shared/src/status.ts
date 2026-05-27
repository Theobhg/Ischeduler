export const MESSAGE_STATUSES = [
  'SCHEDULED',
  'QUEUED',
  'ACCEPTED',
  'SENT',
  'DELIVERED',
  'RECEIVED',
  'FAILED',
  'CANCELLED',
] as const

export type MessageStatus = (typeof MESSAGE_STATUSES)[number]

export const STATUS_TRANSITIONS: Record<MessageStatus, MessageStatus[]> = {
  SCHEDULED: ['QUEUED', 'CANCELLED'],
  QUEUED: ['ACCEPTED', 'FAILED'],
  ACCEPTED: ['SENT', 'FAILED'],
  SENT: ['DELIVERED', 'FAILED'],
  DELIVERED: ['RECEIVED'],
  RECEIVED: [],
  FAILED: [],
  CANCELLED: [],
}

export const TERMINAL_STATUSES: MessageStatus[] = ['CANCELLED', 'FAILED', 'RECEIVED']

export const CANCELLABLE_STATUSES: MessageStatus[] = ['SCHEDULED']

export function canTransition(from: MessageStatus, to: MessageStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to)
}
