import type { ListMessagesQuery } from '@ischeduler/shared'

export type MessagesFilters = Omit<ListMessagesQuery, 'limit' | 'offset'> & {
  limit?: number
  offset?: number
}
