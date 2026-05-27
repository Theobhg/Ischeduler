import { PageMotion } from '@/components/motion/page-motion'
import { PageHeader } from '@/components/layout/page-header'
import { useMessageStats } from '@/hooks/use-message-stats'
import { useQueueStats } from '@/hooks/use-queue-stats'
import { MessagesSection } from './_components/messages'
import { QueueStatsCard, SummaryCardsSection, SystemInfoCard } from './_components/stats'

export function HomePage() {
  const { data: messageStats } = useMessageStats()
  const { data: queueStats } = useQueueStats()

  const failureRate =
    messageStats && messageStats.total > 0 ? Math.round((messageStats.failed / messageStats.total) * 100) : 0

  return (
    <PageMotion className="flex flex-col gap-6">
      <PageHeader title="Dashboard" subtitle="Overview of scheduled messages, delivery status, and queue activity." />

      <SummaryCardsSection stats={messageStats} failureRate={failureRate} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QueueStatsCard stats={queueStats} />
        <SystemInfoCard stats={messageStats} failureRate={failureRate} />
      </div>

      <MessagesSection />
    </PageMotion>
  )
}
