import type { CreateMessageInput, ListMessagesResponse, MessageResponse, MessageWithEvents } from '@ischeduler/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { MessagesFilters } from '@/types'

const QUERY_KEY = ['messages'] as const

export function useMessages(filters: MessagesFilters = {}) {
  return useQuery({
    queryKey: ['messages', filters],
    queryFn: () => {
      const params: Record<string, string | number | undefined> = {
        limit: filters.limit ?? 20,
        offset: filters.offset ?? 0,
      }
      if (filters.status) params.status = filters.status
      if (filters.search) params.search = filters.search

      return api.get<ListMessagesResponse>('/api/messages', { params }).then((r) => r.data)
    },
    refetchInterval: 3000,
    staleTime: 2000,
    placeholderData: keepPreviousData,
  })
}

export function useMessage(id: string | null) {
  return useQuery({
    queryKey: ['messages', 'detail', id],
    queryFn: () => api.get<MessageWithEvents>(`/api/messages/${id}`).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 3000,
    staleTime: 2000,
    placeholderData: keepPreviousData,
  })
}

export function useCreateMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateMessageInput) => api.post<MessageResponse>('/api/messages', input).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useCancelMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.patch<MessageResponse>(`/api/messages/${id}/cancel`).then((r) => r.data),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'detail', id] })
    },
  })
}
