import { useState } from 'react'
import {
  AlertCircleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClockIcon,
  DatabaseIcon,
  SendIcon,
  XCircleIcon,
} from 'lucide-react'
import type { MessageStatus } from '@ischeduler/shared'
import { MESSAGE_STATUSES } from '@ischeduler/shared'
import { useCancelMessage, useMessages } from '@/hooks/use-messages'
import { useMessageStats } from '@/hooks/use-message-stats'
import { useQueueStats } from '@/hooks/use-queue-stats'
import { DataTable } from '@/components/data-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { getMessageColumns } from '@/components/messages/message-columns'
import { MessageDetailSheet } from '@/components/messages/message-detail-sheet'
import { cn } from '@/lib/utils'

const STATUS_FILTER_OPTIONS: { label: string; value: MessageStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  ...MESSAGE_STATUSES.map((s) => ({ label: s, value: s })),
]

export function HomePage() {
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'ALL'>('ALL')
  const [search, setSearch] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const { data: messageStats } = useMessageStats()
  const { data: filteredData } = useMessages({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: search.trim() || undefined,
  })

  const { data: queueStats } = useQueueStats()
  const { cancelMessage, isCancellingMessage } = useCancelMessage()

  const messages = filteredData?.data ?? []
  const total = filteredData?.total ?? 0

  const failureRate =
    messageStats && messageStats.total > 0
      ? Math.round((messageStats.failed / messageStats.total) * 100)
      : 0

  function handleCancel(id: string) {
    cancelMessage(id, {
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
    isCancelling: isCancellingMessage,
  })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          title="Scheduled"
          value={messageStats?.scheduled ?? 0}
          icon={<CalendarClockIcon />}
          description="Pending delivery"
        />
        <SummaryCard
          title="Delivered"
          value={messageStats?.sent ?? 0}
          icon={<CheckCircle2Icon />}
          description="Sent / delivered"
        />
        <SummaryCard
          title="Failed"
          value={messageStats?.failed ?? 0}
          icon={<AlertCircleIcon />}
          description={`${failureRate}% failure rate`}
        />
        <SummaryCard
          title="Cancelled"
          value={messageStats?.cancelled ?? 0}
          icon={<XCircleIcon />}
          description="User cancelled"
        />
      </div>

      {/* Queue stats + extras row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DatabaseIcon />
              Queue Stats
            </CardTitle>
            <CardDescription>Live BullMQ job counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <QueueStatPill label="Waiting" value={queueStats?.waiting ?? 0} />
              <QueueStatPill label="Delayed" value={queueStats?.delayed ?? 0} />
              <QueueStatPill label="Active" value={queueStats?.active ?? 0} />
              <QueueStatPill label="Completed" value={queueStats?.completed ?? 0} />
              <QueueStatPill label="Failed" value={queueStats?.failed ?? 0} variant="destructive" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClockIcon />
              System Info
            </CardTitle>
            <CardDescription>Message delivery overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total messages</span>
                <span className="font-medium">{messageStats?.total ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Failure rate</span>
                <span className={cn('font-medium', failureRate > 20 && 'text-destructive')}>
                  {failureRate}%
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">In queue</span>
                <span className="font-medium">{messageStats?.queued ?? '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SendIcon />
            Messages
            <Badge variant="secondary" className="ml-auto font-normal">
              {total} total
            </Badge>
          </CardTitle>
          <CardDescription>All scheduled and processed messages</CardDescription>
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
                <SelectGroup>
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
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
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          {title}
          {icon}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

function QueueStatPill({
  label,
  value,
  variant = 'secondary',
}: {
  label: string
  value: number
  variant?: 'secondary' | 'destructive' | 'outline'
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Badge variant={variant} className="text-sm font-bold px-3 py-1">
        {value}
      </Badge>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
