import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import { useState } from 'react'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { DataTableActionButton } from './data-table-action-button'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  searchPlaceholder?: string
  showViewOptions?: boolean
  actionButton?: {
    label: React.ReactNode
    onClick: () => void
  }
  // Manual pagination props
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  manualPagination?: boolean
  pageCount?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  searchPlaceholder = 'Filter...',
  showViewOptions = true,
  actionButton,
  pagination: externalPagination,
  onPaginationChange,
  manualPagination = false,
  pageCount,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [internalPagination, setInternalPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  // Use external pagination state when in manual mode, otherwise use internal
  const pagination = manualPagination && externalPagination ? externalPagination : internalPagination
  const paginationChangeHandler = manualPagination && onPaginationChange ? onPaginationChange : setInternalPagination

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: paginationChangeHandler,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination,
    pageCount: manualPagination ? pageCount : undefined,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-between animate-fade-up duration-300 delay-100">
        {filterColumn && (
          <DataTableToolbar
            table={table}
            filterColumn={filterColumn}
            searchPlaceholder={searchPlaceholder}
            showViewOptions={showViewOptions}
          />
        )}
        {actionButton && <DataTableActionButton label={actionButton.label} onClick={actionButton.onClick} />}
      </div>

      <div className="rounded-md border animate-fade-up duration-300 delay-200">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="animate-fade-up duration-300 delay-400">
        <DataTablePagination table={table} />
      </div>
    </div>
  )
}
