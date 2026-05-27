import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { MessageStats } from '@ischeduler/shared'
import { api } from '@/lib/api'

/**
 * Fetches aggregated message counts grouped by status from `GET /messages/stats`.
 *
 * Used by the dashboard summary cards and system-info card. Polls every
 * 3 seconds to stay in sync with the worker and gateway callbacks.
 *
 * @returns A React Query result object. The `data` property is a `MessageStats`:
 *   ```ts
 *   {
 *     scheduled: number,  // messages awaiting dispatch
 *     queued:    number,  // messages handed to BullMQ
 *     sent:      number,  // ACCEPTED + SENT + DELIVERED + RECEIVED (composite)
 *     failed:    number,  // terminal failure count
 *     cancelled: number,  // user-cancelled count
 *     total:     number,  // sum of all statuses
 *   }
 *   ```
 *
 * @example
 * ```tsx
 * const { data: stats } = useMessageStats()
 * const failureRate = stats
 *   ? Math.round((stats.failed / stats.total) * 100)
 *   : 0
 * ```
 */
export function useMessageStats() {
  return useQuery({
    queryKey: ['message-stats'],
    queryFn: async (): Promise<MessageStats> => {
      const response = await api.get<MessageStats>('/messages/stats')
      return response.data
    },
    refetchInterval: 3000,
    staleTime: 2000,
    placeholderData: keepPreviousData,
  })
}
