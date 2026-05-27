import type React from 'react'
import { Button } from '../ui/button'

interface DataTableActionButtonProps {
  label: React.ReactNode
  onClick: () => void
}

export function DataTableActionButton({ label, onClick }: DataTableActionButtonProps) {
  return <Button onClick={onClick}>{label}</Button>
}
