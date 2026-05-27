import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { QueueStats } from '@ischeduler/shared'
import { api } from '@/lib/api'

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
