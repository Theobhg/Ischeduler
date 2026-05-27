import type { CreateMessageInput, ListMessagesResponse, MessageResponse, MessageWithEvents } from '@ischeduler/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { MessagesFilters } from '@/types'

const QUERY_KEY = ['messages'] as const

export function useMessages(filters: MessagesFilters = {}) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters],
    queryFn: async (): Promise<ListMessagesResponse> => {
      const params: Record<string, string | number> = {
        limit: filters.limit ?? 20,
        offset: filters.offset ?? 0,
      }
      if (filters.status) params.status = filters.status
      if (filters.search) params.search = filters.search

      const response = await api.get<ListMessagesResponse>('/messages', { params })
      return response.data
    },
    refetchInterval: 3000,
    staleTime: 2000,
    placeholderData: keepPreviousData,
  })
}

export function useMessage(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', id],
    queryFn: async (): Promise<MessageWithEvents> => {
      const response = await api.get<MessageWithEvents>(`/messages/${id}`)
      return response.data
    },
    enabled: !!id,
    refetchInterval: 3000,
    staleTime: 2000,
    placeholderData: keepPreviousData,
  })
}

export function useCreateMessage() {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (input: CreateMessageInput): Promise<MessageResponse> => {
      const response = await api.post<MessageResponse>('/messages', input)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return {
    createMessage: mutateAsync,
    isCreatingMessage: isPending,
    createMessageError: error,
  }
}

export function useCancelMessage() {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (id: string): Promise<MessageResponse> => {
      const response = await api.patch<MessageResponse>(`/messages/${id}/cancel`)
      return response.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, 'detail', id] })
    },
  })

  return {
    cancelMessage: mutate,
    isCancellingMessage: isPending,
    cancelMessageError: error,
  }
}
