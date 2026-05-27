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

const STATUS_FILTER_OPTIONS: { label: string; value: MessageStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  ...MESSAGE_STATUSES.map((s) => ({ label: s, value: s })),
]

interface MessagesTableCardProps {
  search: string
  statusFilter: MessageStatus | 'ALL'
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: MessageStatus | 'ALL') => void
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
          <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as MessageStatus | 'ALL')}>
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
  )
}
