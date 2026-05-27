import type { PrismaClient } from '@ischeduler/database'
import type { CreateMessageInput, GatewayStatusPayload, ListMessagesQuery, MessageStatus } from '@ischeduler/shared'
import type { QueueAdapter, ScheduledMessage } from '../../types/messages'
import { BadRequestError } from '../lib/errors/bad-request-error'
import { prisma } from '../lib/prisma'
import { enqueueMessage, messagesQueue } from '../lib/queue'
import { assertTransition } from '../lib/status-machine'

export class MessagesService {
  constructor(
    private readonly db: PrismaClient,
    private readonly queue: QueueAdapter,
  ) {}

  async create(input: CreateMessageInput) {
    const message = await this.db.$transaction(async (tx) => {
      const msg = await tx.scheduledMessage.create({
        data: {
          toPhone: input.toPhone,
          body: input.body,
          scheduledAt: new Date(input.scheduledAt),
          status: 'SCHEDULED',
        },
      })

      await tx.messageStatusEvent.create({
        data: {
          messageId: msg.id,
          status: 'SCHEDULED',
        },
      })

      return msg
    })

    await this.queue.enqueue(message.id, message.scheduledAt)

    return this.serialize(message)
  }

  async stats() {
    const groups = await this.db.scheduledMessage.groupBy({
      by: ['status'],
      _count: { _all: true },
    })

    const counts: Record<string, number> = {}
    let total = 0
    for (const g of groups) {
      counts[g.status] = g._count._all
      total += g._count._all
    }

    return {
      scheduled: counts['SCHEDULED'] ?? 0,
      queued: counts['QUEUED'] ?? 0,
      sent: (counts['SENT'] ?? 0) + (counts['DELIVERED'] ?? 0) + (counts['RECEIVED'] ?? 0) + (counts['ACCEPTED'] ?? 0),
      failed: counts['FAILED'] ?? 0,
      cancelled: counts['CANCELLED'] ?? 0,
      total,
    }
  }

  async list(query: ListMessagesQuery) {
    const { status, search, limit, offset } = query

    const where = {
      ...(status ? { status: status as MessageStatus } : {}),
      ...(search
        ? {
            OR: [
              { toPhone: { contains: search, mode: 'insensitive' as const } },
              { body: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [data, total] = await Promise.all([
      this.db.scheduledMessage.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.db.scheduledMessage.count({ where }),
    ])

    return {
      data: data.map((m) => this.serialize(m)),
      total,
      limit,
      offset,
    }
  }

  async findById(id: string) {
    const message = await this.db.scheduledMessage.findUnique({
      where: { id },
      include: {
        statusEvents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!message) return null

    return {
      ...this.serialize(message),
      statusEvents: message.statusEvents.map((e) => ({
        id: e.id,
        messageId: e.messageId,
        status: e.status,
        payload: e.payload as Record<string, unknown> | null,
        idempotencyKey: e.idempotencyKey,
        createdAt: e.createdAt.toISOString(),
      })),
    }
  }

  async cancel(id: string) {
    const message = await this.db.scheduledMessage.findUnique({ where: { id } })

    if (!message) return null

    if (message.status !== 'SCHEDULED') {
      throw new BadRequestError(
        `Cannot cancel message with status ${message.status}. Only SCHEDULED messages can be cancelled.`,
      )
    }

    const updated = await this.db.$transaction(async (tx) => {
      const msg = await tx.scheduledMessage.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })

      await tx.messageStatusEvent.create({
        data: {
          messageId: id,
          status: 'CANCELLED',
        },
      })

      return msg
    })

    await this.queue.remove(id)

    return this.serialize(updated)
  }

  async applyGatewayStatus(payload: GatewayStatusPayload) {
    const message = await this.db.scheduledMessage.findUnique({
      where: { id: payload.messageId },
    })

    if (!message) return null

    assertTransition(message.status as MessageStatus, payload.status as MessageStatus)

    const updated = await this.db.$transaction(async (tx) => {
      await tx.messageStatusEvent.upsert({
        where: {
          messageId_status_idempotencyKey: {
            messageId: payload.messageId,
            status: payload.status as MessageStatus,
            idempotencyKey: payload.idempotencyKey,
          },
        },
        create: {
          messageId: payload.messageId,
          status: payload.status as MessageStatus,
          idempotencyKey: payload.idempotencyKey,
          payload: payload.raw ?? {},
        },
        update: {},
      })

      return tx.scheduledMessage.update({
        where: { id: payload.messageId },
        data: {
          status: payload.status as MessageStatus,
          provider: payload.provider,
          providerMessageId: payload.providerMessageId,
          ...(payload.status === 'FAILED' ? { errorMessage: 'Gateway reported failure' } : {}),
        },
      })
    })

    return this.serialize(updated)
  }

  private serialize(msg: ScheduledMessage) {
    return {
      id: msg.id,
      toPhone: msg.toPhone,
      body: msg.body,
      scheduledAt: msg.scheduledAt.toISOString(),
      status: msg.status,
      provider: msg.provider,
      providerMessageId: msg.providerMessageId,
      errorMessage: msg.errorMessage,
      retryCount: msg.retryCount,
      createdAt: msg.createdAt.toISOString(),
      updatedAt: msg.updatedAt.toISOString(),
    }
  }
}

export const messagesService = new MessagesService(prisma, {
  enqueue: enqueueMessage,
  remove: async (id) => {
    try {
      await messagesQueue.remove(id)
    } catch {
      // Job may have already been processed; safe to ignore
    }
  },
})
