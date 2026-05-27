import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { XCircleIcon, EyeIcon } from 'lucide-react'
import type { MessageResponse } from '@ischeduler/shared'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { MessageStatusBadge } from './message-status-badge'

interface MessageColumnsOptions {
  onCancel: (id: string) => void
  onView: (id: string) => void
  isCancelling: boolean
}

export function getMessageColumns({
  onCancel,
  onView,
  isCancelling,
}: MessageColumnsOptions): ColumnDef<MessageResponse>[] {
  return [
    {
      accessorKey: 'toPhone',
      header: 'Recipient',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.toPhone}</span>
      ),
    },
    {
      accessorKey: 'body',
      header: 'Preview',
      cell: ({ row }) => (
        <span className="max-w-[200px] truncate block text-sm text-muted-foreground">
          {row.original.body}
        </span>
      ),
    },
    {
      accessorKey: 'scheduledAt',
      header: 'Scheduled At',
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap">
          {format(new Date(row.original.scheduledAt), 'PPp')}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <MessageStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.updatedAt), 'PPp')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const msg = row.original
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => onView(msg.id)}
                >
                  <EyeIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View timeline</TooltipContent>
            </Tooltip>

            {msg.status === 'SCHEDULED' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    disabled={isCancelling}
                    onClick={() => onCancel(msg.id)}
                  >
                    <XCircleIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cancel message</TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      },
    },
  ]
}
