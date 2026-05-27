import { createMessageSchema } from '@ischeduler/shared'
import { toast } from 'sonner'
import { useClientForm } from '@/lib/hooks/use-client-form'
import { useCreateMessage } from '@/hooks/use-messages'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SchedulePage() {
  const createMessage = useCreateMessage()

  const form = useClientForm({
    schema: createMessageSchema,
    handler: (values) => createMessage.mutateAsync(values),
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
            <div className="space-y-5">
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date & Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const local = e.target.value
                          if (local) {
                            field.onChange(new Date(local).toISOString())
                          } else {
                            field.onChange('')
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>Must be in the future.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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
