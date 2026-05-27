import { createMessageSchema } from '@ischeduler/shared'
import { format } from 'date-fns'
import { CalendarIcon, SendIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { useCreateMessage } from '@/hooks/use-messages'
import { useClientForm } from '@/lib/hooks/use-client-form'
import { cn } from '@/lib/utils'
import { PrimaryIconBadge } from '@/components/primary-icon-badge'
import { buildISO, parseDateFromISO } from './schedule-form-utils'

export function ScheduleForm() {
  const { createMessage } = useCreateMessage()

  const form = useClientForm({
    schema: createMessageSchema,
    mode: 'onChange',
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PrimaryIconBadge>
            <SendIcon />
          </PrimaryIconBadge>
          New Message
        </CardTitle>
        <CardDescription>Fill in the details below to schedule a delivery</CardDescription>
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
                    <Textarea placeholder="Type your message..." className="resize-none min-h-[100px]" {...field} />
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
                            noMotion
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !selectedDate && 'text-muted-foreground',
                              selectedDate && 'border-primary/30 bg-primary/5',
                            )}
                          >
                            <CalendarIcon data-icon="inline-start" />
                            {selectedDate ? format(selectedDate, 'PPP p') : 'Pick a date and time'}
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
                          <span className="text-sm text-primary/80">Time</span>
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
  )
}
