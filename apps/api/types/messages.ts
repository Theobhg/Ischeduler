export type ScheduledMessage = {
  id: string
  toPhone: string
  body: string
  scheduledAt: Date
  status: string
  provider: string | null
  providerMessageId: string | null
  errorMessage: string | null
  retryCount: number
  createdAt: Date
  updatedAt: Date
}

export type QueueAdapter = {
  enqueue: (id: string, scheduledAt: Date) => Promise<void>
  remove: (id: string) => Promise<void>
}
