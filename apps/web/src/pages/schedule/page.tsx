import { PageHeader } from '@/components/layout/page-header'
import { PageMotion } from '@/components/motion/page-motion'
import { ScheduledMessagesList } from './_components/messages'
import { ScheduleForm } from './_components/schedule-form'

export function SchedulePage() {
  return (
    <PageMotion className="flex min-h-[calc(100dvh-5rem)] w-full flex-col">
      <PageHeader title="Schedule" subtitle="Schedule an iMessage to be sent at a specific time." />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 pb-6">
        <div className="flex w-full max-w-5xl flex-col items-center gap-6">
          <ScheduleForm />
          <ScheduledMessagesList />
        </div>
      </div>
    </PageMotion>
  )
}
