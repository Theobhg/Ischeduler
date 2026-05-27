import type { CreateMessageInput, ListMessagesResponse, MessageResponse, MessageWithEvents } from '@ischeduler/shared'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { MessagesFilters } from '@/types'

/** Shared React Query key prefix for all message-related queries. */
const QUERY_KEY = ['messages'] as const

/**
 * Fetches a paginated, filtered list of messages from `GET /messages`.
 *
 * Automatically refetches every 3 seconds to keep the table up-to-date
 * without requiring manual refresh. Retains the previous data while a new
 * request is in-flight to avoid flickering.
 *
 * @param filters - Optional query filters applied to the request.
 * @param filters.status  Filter by a specific `MessageStatus`.
 * @param filters.search  Case-insensitive substring match on `toPhone` or `body`.
 * @param filters.limit   Number of records to return (default `20`).
 * @param filters.offset  Number of records to skip for pagination (default `0`).
 *
 * @returns A React Query result object. The `data` property is a
 *   `ListMessagesResponse`:
 *   `{ data: MessageResponse[], total: number, limit: number, offset: number }`.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useMessages({ status: 'SCHEDULED', limit: 50 })
 * const messages = data?.data ?? []
 * ```
 */
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

/**
 * Fetches a single message by ID from `GET /messages/:id`, including its
 * full status-event timeline.
 *
 * The query is disabled when `id` is `null`, so it is safe to call this hook
 * unconditionally even before a message has been selected.
 *
 * Refetches every 3 seconds while the sheet is open.
 *
 * @param id - UUID of the message to fetch, or `null` to skip the request.
 *
 * @returns A React Query result object. The `data` property is a
 *   `MessageWithEvents` (message fields + `statusEvents` array).
 *
 * @example
 * ```tsx
 * const { data: message, isLoading } = useMessage(selectedId)
 * ```
 */
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

/**
 * Mutation hook for scheduling a new message via `POST /messages`.
 *
 * On success, invalidates all `messages` queries so the table and stats
 * refresh automatically.
 *
 * @returns
 * - `createMessage`       — `async (input: CreateMessageInput) => MessageResponse`
 * - `isCreatingMessage`   — `boolean` — `true` while the request is in-flight.
 * - `createMessageError`  — The error thrown by the last failed mutation, or `null`.
 *
 * @throws The underlying Axios error is stored in `createMessageError`.
 *   The response body typically contains `{ message: string }` with a
 *   human-readable reason.
 *
 * @example
 * ```tsx
 * const { createMessage, isCreatingMessage } = useCreateMessage()
 * await createMessage({ toPhone: '+15551234567', body: 'Hello', scheduledAt: iso })
 * ```
 */
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

/**
 * Mutation hook for cancelling a scheduled message via `PATCH /messages/:id/cancel`.
 *
 * Only messages in `SCHEDULED` status can be cancelled. The API returns 400
 * with `{ message: string }` if the status is not eligible.
 *
 * On success, invalidates the message list and the specific detail query for
 * the cancelled message.
 *
 * @returns
 * - `cancelMessage`        — `(id: string, options?) => void` (non-async `mutate`).
 * - `isCancellingMessage`  — `boolean` — `true` while the request is in-flight.
 * - `cancelMessageError`   — The error from the last failed mutation, or `null`.
 *
 * @throws The underlying Axios error is stored in `cancelMessageError`.
 *   The response body typically contains `{ message: string }`.
 *
 * @example
 * ```tsx
 * const { cancelMessage } = useCancelMessage()
 * cancelMessage(message.id, {
 *   onSuccess: () => toast.success('Cancelled'),
 *   onError: (err) => toast.error(err.message),
 * })
 * ```
 */
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
