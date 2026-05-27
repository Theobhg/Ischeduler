'use client'

import type { Table } from '@tanstack/react-table'
import { X } from 'lucide-react'

import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  filterColumn?: string
  searchPlaceholder?: string
  showViewOptions?: boolean
}

export function DataTableToolbar<TData>({
  table,
  filterColumn,
  searchPlaceholder = 'Filter...',
  showViewOptions = true,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center space-x-2">
        {filterColumn && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn(filterColumn)?.setFilterValue(event.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        )}
        {isFiltered && (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
            Clear
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      {showViewOptions && <DataTableViewOptions table={table} />}
    </div>
  )
}
