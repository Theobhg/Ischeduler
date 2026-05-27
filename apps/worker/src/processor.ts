import axios from 'axios'
import type { Job } from 'bullmq'
import { prisma } from './prisma'

const GATEWAY_URL = process.env.GATEWAY_URL ?? 'http://localhost:4000'
const WORKER_ATTEMPTS = Number(process.env.WORKER_ATTEMPTS ?? 3)
const WORKER_BACKOFF_MS = Number(process.env.WORKER_BACKOFF_MS ?? 30000)

interface JobData {
  messageId: string
}

interface GatewayResponse {
  provider: string
  providerMessageId: string
  status: 'ACCEPTED' | 'SENT'
}

export async function processor(job: Job<JobData>): Promise<void> {
  const { messageId } = job.data

  // Reload from DB — skip if cancelled or already processed
  const message = await prisma.scheduledMessage.findUnique({ where: { id: messageId } })

  if (!message) {
    console.warn(`[processor] message ${messageId} not found — skipping`)
    return
  }

  // Allow retry if the job was interrupted after QUEUED but before the gateway responded
  const isRetryableQueued = message.status === 'QUEUED' && message.providerMessageId === null

  if (message.status !== 'SCHEDULED' && !isRetryableQueued) {
    console.warn(`[processor] message ${messageId} has status ${message.status} — skipping`)
    return
  }

  // Atomic claim: only one worker can win the SCHEDULED -> QUEUED transition
  if (message.status === 'SCHEDULED') {
    const claimed = await prisma.scheduledMessage.updateMany({
      where: { id: messageId, status: 'SCHEDULED' },
      data: { status: 'QUEUED' },
    })

    if (claimed.count === 0) {
      console.warn(`[processor] message ${messageId} was claimed by another worker — skipping`)
      return
    }

    await prisma.messageStatusEvent.create({
      data: { messageId, status: 'QUEUED' },
    })
  }

  // Call gateway
  let gatewayResponse: GatewayResponse

  try {
    const response = await axios.post<GatewayResponse>(`${GATEWAY_URL}/send`, {
      messageId,
      toPhone: message.toPhone,
      body: message.body,
    })

    gatewayResponse = response.data
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    // Re-throw so BullMQ retries with backoff
    throw Object.assign(new Error(`Gateway error: ${message}`), {
      attempts: WORKER_ATTEMPTS,
      backoff: { type: 'exponential', delay: WORKER_BACKOFF_MS },
    })
  }

  // Persist accepted/sent status from gateway response
  await prisma.$transaction([
    prisma.scheduledMessage.update({
      where: { id: messageId },
      data: {
        status: gatewayResponse.status,
        provider: gatewayResponse.provider,
        providerMessageId: gatewayResponse.providerMessageId,
      },
    }),
    prisma.messageStatusEvent.create({
      data: {
        messageId,
        status: gatewayResponse.status,
        idempotencyKey: `${gatewayResponse.providerMessageId}-${gatewayResponse.status}`,
        payload: { provider: gatewayResponse.provider, providerMessageId: gatewayResponse.providerMessageId },
      },
    }),
  ])

  console.log(`[processor] message ${messageId} → ${gatewayResponse.status}`)
}
