import { Queue } from 'bullmq'

function redisConnectionFromUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    ...(parsed.password ? { password: decodeURIComponent(parsed.password) } : {}),
  }
}

export const messagesQueue = new Queue('messages', {
  connection: redisConnectionFromUrl(process.env.REDIS_URL ?? 'redis://localhost:6379'),
  defaultJobOptions: {
    removeOnComplete: { age: 24 * 3600, count: 100 },
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
