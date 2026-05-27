import 'dotenv/config'
import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { processor } from './processor'

const SEND_INTERVAL_MS = Number(process.env.SEND_INTERVAL_MS ?? 60000)
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY ?? 1)

const connection = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
})

const worker = new Worker('messages', processor, {
  connection,
  concurrency: WORKER_CONCURRENCY,
  limiter: {
    max: 1,
    duration: SEND_INTERVAL_MS,
  },
})

worker.on('completed', (job) => {
  console.log(`[worker] job ${job.id} completed`)
})

worker.on('failed', async (job, err) => {
  if (!job) return

  const isLastAttempt = job.attemptsMade >= (job.opts.attempts ?? 1)

  if (isLastAttempt) {
    const { prisma } = await import('./prisma.js')

    const messageId = (job.data as { messageId: string }).messageId

    await prisma.scheduledMessage.update({
      where: { id: messageId },
      data: {
        status: 'FAILED',
        errorMessage: err.message,
      },
    })

    await prisma.messageStatusEvent.create({
      data: {
        messageId,
        status: 'FAILED',
        payload: { error: err.message },
      },
    })

    console.error(`[worker] job ${job.id} permanently failed: ${err.message}`)
  }
})

worker.on('error', (err) => {
  console.error('[worker] error:', err)
})

console.log(`[worker] started — concurrency=${WORKER_CONCURRENCY}, rate limit: 1 per ${SEND_INTERVAL_MS}ms`)
