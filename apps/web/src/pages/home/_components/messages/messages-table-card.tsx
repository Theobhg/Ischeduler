import type { ColumnDef } from '@tanstack/react-table'
import type { MessageResponse, MessageStatus } from '@ischeduler/shared'
import { MESSAGE_STATUSES } from '@ischeduler/shared'
import { SendIcon } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { PrimaryIconBadge } from '@/components/primary-icon-badge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { messageStatusIcon, messageStatusLabel } from './status-tones'

type StatusFilterValue = MessageStatus | 'ALL'

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilterValue }[] = [
  { label: 'All', value: 'ALL' },
  ...MESSAGE_STATUSES.map((s) => ({ label: messageStatusLabel[s], value: s })),
]

interface MessagesTableCardProps {
  search: string
  statusFilter: StatusFilterValue
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: StatusFilterValue) => void
  columns: ColumnDef<MessageResponse>[]
  messages: MessageResponse[]
  total: number
}

export function MessagesTableCard({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  columns,
  messages,
  total,
}: MessagesTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PrimaryIconBadge>
            <SendIcon />
          </PrimaryIconBadge>
          Messages
          <Badge
            variant="outline"
            className="ml-auto border-primary/20 bg-primary/10 font-normal text-primary"
          >
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilterValue)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {STATUS_FILTER_OPTIONS.map((opt) => {
                  const Icon = opt.value !== 'ALL' ? messageStatusIcon[opt.value] : null
                  return (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center gap-2">
                        {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
                        {opt.label}
                      </span>
                    </SelectItem>
                  )
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <DataTable columns={columns} data={messages} />
      </CardContent>
    </Card>
  )
}
