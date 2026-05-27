interface QueueStatTileProps {
  label: string
  value: number
}

export function QueueStatTile({ label, value }: QueueStatTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border/70 bg-muted/35 p-3">
      <span className="text-2xl font-semibold tabular-nums leading-none text-foreground">{value}</span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  )
}
