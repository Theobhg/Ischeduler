import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { MessageStats } from '@ischeduler/shared'
import { api } from '@/lib/api'

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
