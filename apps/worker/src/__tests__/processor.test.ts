import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Job } from 'bullmq'

// ─── Hoist mocks ─────────────────────────────────────────────────────────────

const { prismaMock, scheduledMessage } = vi.hoisted(() => {
  const scheduledMessage = {
    id: 'msg-1',
    toPhone: '+15551234567',
    body: 'Hello',
    scheduledAt: new Date(),
    status: 'SCHEDULED',
    provider: null,
    providerMessageId: null,
    errorMessage: null,
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const prismaMock = {
    scheduledMessage: {
      findUnique: vi.fn().mockResolvedValue(scheduledMessage),
      update: vi.fn().mockResolvedValue(scheduledMessage),
    },
    messageStatusEvent: {
      create: vi.fn().mockResolvedValue({ id: 'evt-1' }),
    },
    $transaction: vi.fn().mockImplementation(async (args: unknown[]) => {
      for (const op of args) await (op as Promise<unknown>)
    }),
  }

  return { prismaMock, scheduledMessage }
})

vi.mock('../prisma.js', () => ({ prisma: prismaMock }))

vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: { provider: 'mock', providerMessageId: 'mock-1', status: 'SENT' },
    }),
  },
}))

import { processor } from '../processor'

// ─── Tests ───────────────────────────────────────────────────────────────────

function makeJob(messageId: string): Job<{ messageId: string }> {
  return { data: { messageId } } as unknown as Job<{ messageId: string }>
}

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.scheduledMessage.findUnique.mockResolvedValue(scheduledMessage)
})

describe('processor', () => {
  it('processes a SCHEDULED message and transitions to SENT', async () => {
    await processor(makeJob('msg-1'))

    // Should have called $transaction twice: QUEUED transition, then SENT
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(2)
  })

  it('skips a CANCELLED message without calling gateway', async () => {
    prismaMock.scheduledMessage.findUnique.mockResolvedValue({
      ...scheduledMessage,
      status: 'CANCELLED',
    })

    const axios = await import('axios')
    await processor(makeJob('msg-1'))

    expect(axios.default.post).not.toHaveBeenCalled()
    expect(prismaMock.$transaction).not.toHaveBeenCalled()
  })

  it('skips a message not found in DB', async () => {
    prismaMock.scheduledMessage.findUnique.mockResolvedValue(null)

    const axios = await import('axios')
    await processor(makeJob('msg-missing'))

    expect(axios.default.post).not.toHaveBeenCalled()
  })

  it('throws on gateway error to trigger BullMQ retry', async () => {
    const axios = await import('axios')
    ;(axios.default.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('gateway timeout'),
    )

    await expect(processor(makeJob('msg-1'))).rejects.toThrow(/gateway/i)
  })
})
