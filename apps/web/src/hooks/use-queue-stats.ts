import type { QueueStats } from '@ischeduler/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

/**
 * Fetches live BullMQ job counts from `GET /queue/stats`.
 *
 * Polls every 5 seconds to keep the dashboard queue-stats card up-to-date.
 * Retains the previous data while refetching to prevent layout shifts.
 *
 * @returns A React Query result object. The `data` property is a `QueueStats`:
 *   ```ts
 *   {
 *     waiting:   number, // jobs waiting to be picked up
 *     delayed:   number, // jobs scheduled for a future time
 *     active:    number, // jobs currently being processed by the worker
 *     completed: number, // jobs that finished successfully (retained window)
 *     failed:    number, // jobs that exhausted all retries
 *   }
 *   ```
 *
 * @example
 * ```tsx
 * const { data: queueStats } = useQueueStats()
 * const active = queueStats?.active ?? 0
 * ```
 */
export function useQueueStats() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: async (): Promise<QueueStats> => {
      const response = await api.get<QueueStats>('/queue/stats')
      return response.data
    },
    refetchInterval: 5000,
    staleTime: 4000,
    placeholderData: keepPreviousData,
  })
}
