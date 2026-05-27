import type {
  CreateMessageInput,
  GatewayStatusPayload,
  ListMessagesQuery,
  MessageStatus,
} from '@ischeduler/shared'
import { prisma } from '../lib/prisma'
import { enqueueMessage, messagesQueue } from '../lib/queue'
import { assertTransition } from '../lib/status-machine'
import { BadRequestError } from '../lib/errors/bad-request-error'

export async function createScheduledMessage(input: CreateMessageInput) {
  const message = await prisma.$transaction(async (tx) => {
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

  await enqueueMessage(message.id, message.scheduledAt)

  return serializeMessage(message)
}

export async function listMessages(query: ListMessagesQuery) {
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
    prisma.scheduledMessage.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.scheduledMessage.count({ where }),
  ])

  return {
    data: data.map(serializeMessage),
    total,
    limit,
    offset,
  }
}

export async function getMessage(id: string) {
  const message = await prisma.scheduledMessage.findUnique({
    where: { id },
    include: {
      statusEvents: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!message) return null

  return {
    ...serializeMessage(message),
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

export async function cancelMessage(id: string) {
  const message = await prisma.scheduledMessage.findUnique({ where: { id } })

  if (!message) return null

  if (message.status !== 'SCHEDULED') {
    throw new BadRequestError(
      `Cannot cancel message with status ${message.status}. Only SCHEDULED messages can be cancelled.`,
    )
  }

  const updated = await prisma.$transaction(async (tx) => {
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

  try {
    await messagesQueue.remove(id)
  } catch {
    // Job may have already been processed; safe to ignore
  }

  return serializeMessage(updated)
}

export async function applyGatewayStatus(payload: GatewayStatusPayload) {
  const message = await prisma.scheduledMessage.findUnique({
    where: { id: payload.messageId },
  })

  if (!message) return null

  assertTransition(message.status as MessageStatus, payload.status as MessageStatus)

  const updated = await prisma.$transaction(async (tx) => {
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

  return serializeMessage(updated)
}

function serializeMessage(msg: {
  id: string
  toPhone: string
  body: string
  scheduledAt: Date
  status: string
  provider: string | null
  providerMessageId: string | null
  errorMessage: string | null
  retryCount: number
  createdAt: Date
  updatedAt: Date
}) {
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
