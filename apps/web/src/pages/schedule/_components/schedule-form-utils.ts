export function parseDateFromISO(iso: string | undefined): Date | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export function buildISO(date: Date, timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return result.toISOString()
}
