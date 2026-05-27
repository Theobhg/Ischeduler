import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertCircleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClockIcon,
  DatabaseIcon,
  SendIcon,
  XCircleIcon,
} from 'lucide-react'
import type { MessageResponse, MessageStatus } from '@ischeduler/shared'
import { MESSAGE_STATUSES } from '@ischeduler/shared'
import { useCancelMessage, useMessages } from '@/hooks/use-messages'
import { useQueueStats } from '@/hooks/use-queue-stats'
import { DataTable } from '@/components/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getMessageColumns } from '@/components/messages/message-columns'
import { MessageDetailSheet } from '@/components/messages/message-detail-sheet'

const STATUS_FILTER_OPTIONS: { label: string; value: MessageStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  ...MESSAGE_STATUSES.map((s) => ({ label: s, value: s })),
]

function deriveCounts(messages: MessageResponse[]) {
  const counts = { SCHEDULED: 0, SENT: 0, FAILED: 0, CANCELLED: 0 }
  for (const m of messages) {
    if (m.status === 'SCHEDULED') counts.SCHEDULED++
    else if (m.status === 'SENT' || m.status === 'DELIVERED' || m.status === 'RECEIVED') counts.SENT++
    else if (m.status === 'FAILED') counts.FAILED++
    else if (m.status === 'CANCELLED') counts.CANCELLED++
  }
  return counts
}

export function HomePage() {
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: allData } = useMessages({ limit: 200 })
  const { data: filteredData } = useMessages({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: search.trim() || undefined,
  })

  const { data: queueStats } = useQueueStats()
  const cancelMessage = useCancelMessage()

  const allMessages = allData?.data ?? []
  const messages = filteredData?.data ?? []
  const total = filteredData?.total ?? 0

  const counts = deriveCounts(allMessages)
  const failureRate =
    allMessages.length > 0 ? Math.round((counts.FAILED / allMessages.length) * 100) : 0

  const nextScheduled = allMessages
    .filter((m) => m.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]

  function handleCancel(id: string) {
    cancelMessage.mutate(id, {
      onSuccess: () => toast.success('Message cancelled'),
      onError: (err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to cancel'
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
    isCancelling: cancelMessage.isPending,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          title="Scheduled"
          value={counts.SCHEDULED}
          icon={<CalendarClockIcon className="size-4 text-blue-500" />}
          description="Pending delivery"
        />
        <SummaryCard
          title="Delivered"
          value={counts.SENT}
          icon={<CheckCircle2Icon className="size-4 text-green-500" />}
          description="Sent / delivered"
        />
        <SummaryCard
          title="Failed"
          value={counts.FAILED}
          icon={<AlertCircleIcon className="size-4 text-red-500" />}
          description={`${failureRate}% failure rate`}
        />
        <SummaryCard
          title="Cancelled"
          value={counts.CANCELLED}
          icon={<XCircleIcon className="size-4 text-gray-400" />}
          description="User cancelled"
        />
      </div>

      {/* Queue stats + extras row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <DatabaseIcon className="size-4" />
              Queue Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <QueueStatPill label="Waiting" value={queueStats?.waiting ?? 0} />
              <QueueStatPill label="Delayed" value={queueStats?.delayed ?? 0} />
              <QueueStatPill label="Active" value={queueStats?.active ?? 0} color="text-green-600" />
              <QueueStatPill label="Completed" value={queueStats?.completed ?? 0} color="text-blue-600" />
              <QueueStatPill label="Failed" value={queueStats?.failed ?? 0} color="text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClockIcon className="size-4" />
              System Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total messages</span>
              <span className="font-medium">{allData?.total ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Failure rate</span>
              <span className={`font-medium ${failureRate > 20 ? 'text-red-600' : ''}`}>
                {failureRate}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Next scheduled</span>
              <span className="font-medium">
                {nextScheduled
                  ? formatDistanceToNow(new Date(nextScheduled.scheduledAt), { addSuffix: true })
                  : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <SendIcon className="size-4" />
            Messages
            <Badge variant="secondary" className="ml-auto font-normal">
              {total} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              placeholder="Search phone or body…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as MessageStatus | 'ALL')}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable columns={columns} data={messages} />
        </CardContent>
      </Card>

      <MessageDetailSheet
        messageId={selectedMessageId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}

function SummaryCard({
  title,
  value,
  icon,
  description,
}: {
  title: string
  value: number
  icon: React.ReactNode
  description: string
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">{title}</span>
          {icon}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function QueueStatPill({
  label,
  value,
  color = 'text-foreground',
}: {
  label: string
  value: number
  color?: string
}) {
  return (
    <div className="flex flex-col items-center rounded-md border px-3 py-2 min-w-[70px]">
      <span className={`text-lg font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
