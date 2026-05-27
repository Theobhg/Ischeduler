import type { MessageStatus } from '@ischeduler/shared'
import { useState } from 'react'
import { toast } from 'sonner'
import { useCancelMessage, useMessages } from '@/hooks/use-messages'
import { getMessageColumns } from './message-columns'
import { MessageDetailSheet } from './message-detail-sheet'
import { MessagesTableCard } from './messages-table-card'

export function MessagesSection() {
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: filteredData } = useMessages({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: search.trim() || undefined,
  })

  const { cancelMessage, isCancellingMessage } = useCancelMessage()

  const messages = filteredData?.data ?? []
  const total = filteredData?.total ?? 0

  function handleCancel(id: string) {
    cancelMessage(id, {
      onSuccess: () => toast.success('Message cancelled'),
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to cancel'
        toast.error(msg)
      },
    })
  }

  function handleView(id: string) {
    setSelectedMessageId(id)
    setSheetOpen(true)
  }

  const columns = getMessageColumns({
    onCancel: handleCancel,
    onView: handleView,
    isCancelling: isCancellingMessage,
  })

  return (
    <>
      <MessagesTableCard
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        columns={columns}
        messages={messages}
        total={total}
      />

      <MessageDetailSheet messageId={selectedMessageId} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
