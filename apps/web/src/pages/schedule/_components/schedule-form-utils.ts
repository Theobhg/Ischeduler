/**
 * Parses an ISO-8601 datetime string into a `Date` object.
 *
 * Returns `undefined` (instead of an invalid `Date`) when the input is
 * empty, undefined, or not a valid datetime — making it safe to pass
 * directly to shadcn's `<Calendar selected={...}>` prop.
 *
 * @param iso - An ISO-8601 datetime string (e.g. `"2026-05-28T15:00:00.000Z"`),
 *   an empty string, or `undefined`.
 *
 * @returns A valid `Date` object, or `undefined` if the input is absent or
 *   produces `NaN` when parsed.
 *
 * @example
 * ```ts
 * parseDateFromISO('2026-05-28T15:00:00.000Z') // → Date object
 * parseDateFromISO('')                          // → undefined
 * parseDateFromISO(undefined)                   // → undefined
 * parseDateFromISO('not-a-date')                // → undefined
 * ```
 */
export function parseDateFromISO(iso: string | undefined): Date | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/**
 * Combines a `Date` (providing year/month/day) with a `"HH:MM"` time string
 * (providing hours/minutes) into a single ISO-8601 string.
 *
 * Used by the date-picker popover to merge the calendar selection with the
 * `<input type="time">` value into the field's unified `scheduledAt` string.
 *
 * Seconds and milliseconds are zeroed out.
 *
 * @param date    - The selected date from the calendar. Provides the date portion.
 * @param timeStr - A 24-hour time string in `"HH:MM"` format (e.g. `"14:30"`).
 *   If the parts cannot be parsed, hours and minutes default to `0`.
 *
 * @returns ISO-8601 string (e.g. `"2026-05-28T14:30:00.000Z"`) representing
 *   the combined date and time in UTC.
 *
 * @example
 * ```ts
 * buildISO(new Date('2026-05-28'), '14:30') // → "2026-05-28T14:30:00.000Z" (local TZ)
 * buildISO(new Date('2026-05-28'), '09:00') // → "2026-05-28T09:00:00.000Z"
 * ```
 */
export function buildISO(date: Date, timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return result.toISOString()
}
