import { Queue } from 'bullmq'

export const messagesQueue = new Queue('messages', {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 50,
  },
})

export async function enqueueMessage(messageId: string, scheduledAt: Date): Promise<void> {
  const delay = Math.max(0, scheduledAt.getTime() - Date.now())

  await messagesQueue.add(
    'send',
    { messageId },
    {
      delay,
      jobId: messageId,
      attempts: Number(process.env.WORKER_ATTEMPTS ?? 3),
      backoff: {
        type: 'exponential',
        delay: Number(process.env.WORKER_BACKOFF_MS ?? 30000),
      },
    },
  )
}

export async function getQueueStats() {
  const [waiting, delayed, active, completed, failed] = await Promise.all([
    messagesQueue.getWaitingCount(),
    messagesQueue.getDelayedCount(),
    messagesQueue.getActiveCount(),
    messagesQueue.getCompletedCount(),
    messagesQueue.getFailedCount(),
  ])

  return { waiting, delayed, active, completed, failed }
}
