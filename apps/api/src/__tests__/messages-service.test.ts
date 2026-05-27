import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Hoist mocks so they are available before module import ─────────────────

const { prismaMock, mockMessage } = vi.hoisted(() => {
  const mockMessage = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    toPhone: '+15551234567',
    body: 'Test message',
    scheduledAt: new Date(Date.now() + 3600_000),
    status: 'SCHEDULED' as const,
    provider: null,
    providerMessageId: null,
    errorMessage: null,
    retryCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const prismaMock = {
    scheduledMessage: {
      create: vi.fn().mockResolvedValue(mockMessage),
      findUnique: vi.fn().mockResolvedValue(mockMessage),
      findMany: vi.fn().mockResolvedValue([mockMessage]),
      update: vi.fn().mockResolvedValue({ ...mockMessage, status: 'CANCELLED' }),
      count: vi.fn().mockResolvedValue(1),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    messageStatusEvent: {
      create: vi.fn().mockResolvedValue({ id: 'evt-1' }),
      upsert: vi.fn().mockResolvedValue({ id: 'evt-1' }),
    },
    $transaction: vi.fn().mockImplementation(async (fn: ((tx: typeof prismaMock) => Promise<unknown>) | unknown[]) => {
      if (typeof fn === 'function') return fn(prismaMock)
      for (const op of fn as Promise<unknown>[]) await op
    }),
  }

  return { prismaMock, mockMessage }
})

vi.mock('../lib/prisma.js', () => ({ prisma: prismaMock }))

vi.mock('../lib/queue.js', () => ({
  enqueueMessage: vi.fn().mockResolvedValue(undefined),
  messagesQueue: { remove: vi.fn().mockResolvedValue(1) },
}))

import { MessagesService } from '../services/messages'

// ─── Queue mock ──────────────────────────────────────────────────────────────

const queueMock = {
  enqueue: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
}

// ─── Tests ───────────────────────────────────────────────────────────────────

let service: MessagesService

beforeEach(() => {
  vi.clearAllMocks()
  prismaMock.scheduledMessage.findUnique.mockResolvedValue(mockMessage)
  prismaMock.scheduledMessage.create.mockResolvedValue(mockMessage)
  prismaMock.scheduledMessage.update.mockResolvedValue({ ...mockMessage, status: 'CANCELLED' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service = new MessagesService(prismaMock as any, queueMock)
})

describe('create', () => {
  it('creates a message and returns serialized data', async () => {
    const result = await service.create({
      toPhone: '+15551234567',
      body: 'Test message',
      scheduledAt: new Date(Date.now() + 3600_000).toISOString(),
    })

    expect(result.toPhone).toBe('+15551234567')
    expect(result.status).toBe('SCHEDULED')
    expect(prismaMock.scheduledMessage.create).toHaveBeenCalledOnce()
    expect(prismaMock.messageStatusEvent.create).toHaveBeenCalledOnce()
    expect(queueMock.enqueue).toHaveBeenCalledOnce()
  })
})

describe('cancel', () => {
  it('cancels a SCHEDULED message', async () => {
    const result = await service.cancel(mockMessage.id)
    expect(result?.status).toBe('CANCELLED')
  })

  it('throws when trying to cancel a non-SCHEDULED message', async () => {
    prismaMock.scheduledMessage.findUnique.mockResolvedValue({
      ...mockMessage,
      status: 'QUEUED',
    })

    await expect(service.cancel(mockMessage.id)).rejects.toThrow(/Cannot cancel/)
  })

  it('returns null for unknown message id', async () => {
    prismaMock.scheduledMessage.findUnique.mockResolvedValue(null)
    const result = await service.cancel('nonexistent-id')
    expect(result).toBeNull()
  })
})

describe('applyGatewayStatus (idempotency)', () => {
  it('applies a valid QUEUED → ACCEPTED transition', async () => {
    prismaMock.scheduledMessage.findUnique.mockResolvedValue({
      ...mockMessage,
      status: 'QUEUED',
    })
    prismaMock.scheduledMessage.update.mockResolvedValue({
      ...mockMessage,
      status: 'ACCEPTED',
    })

    const result = await service.applyGatewayStatus({
      messageId: mockMessage.id,
      status: 'ACCEPTED',
      provider: 'mock',
      providerMessageId: 'mock-123',
      idempotencyKey: 'mock-123-ACCEPTED',
    })

    expect(result?.status).toBe('ACCEPTED')
    expect(prismaMock.messageStatusEvent.upsert).toHaveBeenCalledOnce()
  })

  it('rejects an invalid transition (SCHEDULED → SENT)', async () => {
    prismaMock.scheduledMessage.findUnique.mockResolvedValue(mockMessage)

    await expect(
      service.applyGatewayStatus({
        messageId: mockMessage.id,
        status: 'SENT',
        provider: 'mock',
        providerMessageId: 'mock-123',
        idempotencyKey: 'mock-123-SENT',
      }),
    ).rejects.toThrow(/Invalid status transition/)
  })

  it('returns null for unknown message', async () => {
    prismaMock.scheduledMessage.findUnique.mockResolvedValue(null)

    const result = await service.applyGatewayStatus({
      messageId: '550e8400-e29b-41d4-a716-446655440099',
      status: 'SENT',
      provider: 'mock',
      providerMessageId: 'mock-999',
      idempotencyKey: 'mock-999-SENT',
    })

    expect(result).toBeNull()
  })
})
