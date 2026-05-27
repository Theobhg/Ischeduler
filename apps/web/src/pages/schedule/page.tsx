import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { createMessageSchema } from '@ischeduler/shared'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useClientForm } from '@/lib/hooks/use-client-form'
import { useCreateMessage } from '@/hooks/use-messages'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

function parseDateFromISO(iso: string | undefined): Date | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? undefined : d
}

function buildISO(date: Date, timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const result = new Date(date)
  result.setHours(hours ?? 0, minutes ?? 0, 0, 0)
  return result.toISOString()
}

export function SchedulePage() {
  const { createMessage } = useCreateMessage()

  const form = useClientForm({
    schema: createMessageSchema,
    handler: (values) => createMessage(values),
    onSubmitSuccess: () => {
      toast.success('Message scheduled successfully!')
      form.reset()
    },
    onSubmitError: (error) => {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Failed to schedule message'
      toast.error(msg)
    },
  })

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Schedule a Message</CardTitle>
          <CardDescription>
            Schedule an iMessage to be sent at a specific time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name="toPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+15551234567" {...field} />
                    </FormControl>
                    <FormDescription>E.164 format — include country code.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your message..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => {
                  const selectedDate = parseDateFromISO(field.value)
                  const timeStr = selectedDate
                    ? `${String(selectedDate.getHours()).padStart(2, '0')}:${String(selectedDate.getMinutes()).padStart(2, '0')}`
                    : '12:00'

                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Scheduled Date & Time</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !selectedDate && 'text-muted-foreground',
                              )}
                            >
                              <CalendarIcon data-icon="inline-start" />
                              {selectedDate
                                ? format(selectedDate, 'PPP p')
                                : 'Pick a date and time'}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(buildISO(date, timeStr))
                              } else {
                                field.onChange('')
                              }
                              field.onBlur()
                            }}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                          <div className="flex items-center gap-2 border-t p-3">
                            <span className="text-sm text-muted-foreground">Time</span>
                            <Input
                              type="time"
                              value={timeStr}
                              className="flex-1"
                              onChange={(e) => {
                                const newTime = e.target.value
                                if (selectedDate && newTime) {
                                  field.onChange(buildISO(selectedDate, newTime))
                                  field.onBlur()
                                }
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormDescription>Must be in the future.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <Button type="submit" disabled={!form.canSubmit} className="w-full">
                {form.isSubmitting ? 'Scheduling…' : 'Schedule Message'}
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
