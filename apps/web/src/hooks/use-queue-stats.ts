import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { QueueStats } from '@ischeduler/shared'
import { api } from '@/lib/api'

async function fetchQueueStats(): Promise<QueueStats> {
  const { data } = await api.get<QueueStats>('/api/queue/stats')
  return data
}

export function useQueueStats() {
  return useQuery({
    queryKey: ['queue-stats'],
    queryFn: fetchQueueStats,
    refetchInterval: 5000,
    staleTime: 4000,
    placeholderData: keepPreviousData,
  })
}
