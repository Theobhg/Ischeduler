import type { PrismaClient } from '@ischeduler/database'
import type { CreateMessageInput, GatewayStatusPayload, ListMessagesQuery, MessageStatus } from '@ischeduler/shared'
import type { QueueAdapter, ScheduledMessage } from '../../types/messages'
import { BadRequestError } from '../lib/errors/bad-request-error'
import { prisma } from '../lib/prisma'
import { enqueueMessage, messagesQueue } from '../lib/queue'
import { assertTransition } from '../lib/status-machine'

/**
 * Core business logic for the scheduled-messages domain.
 *
 * Depends on a `PrismaClient` for persistence and a `QueueAdapter` for
 * BullMQ interactions. Both are injected at construction time, making the
 * class fully testable with mocks.
 *
 * The singleton `messagesService` exported at the bottom wires the real
 * Prisma client and the production queue adapter.
 *
 * @example
 * ```ts
 * // Production singleton (already exported)
 * import { messagesService } from './services/messages'
 *
 * // Test usage with mocks
 * const svc = new MessagesService(mockDb, mockQueue)
 * ```
 */
export class MessagesService {
  constructor(
    private readonly db: PrismaClient,
    private readonly queue: QueueAdapter,
  ) {}

  /**
   * Creates and schedules a new iMessage.
   *
   * Runs inside a Prisma transaction:
   * 1. Inserts the `ScheduledMessage` record with `status: "SCHEDULED"`.
   * 2. Inserts the initial `MessageStatusEvent` with `status: "SCHEDULED"`.
   *
   * After the transaction commits, enqueues a BullMQ delayed job that fires
   * at `scheduledAt`.
   *
   * @param input - Validated message payload from `createMessageSchema`.
   * @param input.toPhone     Recipient phone number (E.164 format).
   * @param input.body        Text body of the message.
   * @param input.scheduledAt ISO-8601 string representing the future send time.
   *
   * @returns The serialized `MessageResponse` of the newly created record.
   *
   * @throws If the database transaction fails or the queue enqueue throws.
   */
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

  /**
   * Returns aggregated message counts grouped by status.
   *
   * Uses a single `groupBy` query for efficiency. The `sent` bucket is a
   * composite of `ACCEPTED`, `SENT`, `DELIVERED`, and `RECEIVED` — any state
   * that represents a successfully dispatched message.
   *
   * @returns An object with the shape:
   * ```ts
   * {
   *   scheduled: number,
   *   queued:    number,
   *   sent:      number,  // ACCEPTED + SENT + DELIVERED + RECEIVED
   *   failed:    number,
   *   cancelled: number,
   *   total:     number,
   * }
   * ```
   *
   * @throws If the database query fails.
   */
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

  /**
   * Returns a paginated, filtered list of messages ordered by `updatedAt` desc.
   *
   * The `search` filter applies a case-insensitive `contains` match to both
   * `toPhone` and `body` (OR logic).
   *
   * @param query - Validated query params from `listMessagesQuerySchema`.
   * @param query.status  Optional status filter.
   * @param query.search  Optional substring search across phone and body.
   * @param query.limit   Maximum records to return (default 20).
   * @param query.offset  Records to skip for pagination (default 0).
   *
   * @returns `{ data, total, limit, offset }` where `data` is an array of
   *   serialized `MessageResponse` objects and `total` is the unfiltered count.
   *
   * @throws If the database query fails.
   */
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

  /**
   * Fetches a single message by ID, including its full status-event timeline.
   *
   * Status events are returned in chronological order (oldest first).
   *
   * @param id - UUID of the scheduled message.
   *
   * @returns The serialized message with a `statusEvents` array, or `null` if
   *   no record with the given `id` exists.
   *
   * @throws If the database query fails.
   */
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

  /**
   * Cancels a scheduled message, transitioning it to `CANCELLED` status.
   *
   * Only messages in `SCHEDULED` status can be cancelled. Any other status
   * throws a `BadRequestError` with a descriptive message.
   *
   * Inside a transaction:
   * 1. Updates the message `status` to `CANCELLED`.
   * 2. Inserts a `CANCELLED` status event.
   *
   * After the transaction commits, attempts to remove the BullMQ job.
   * If the job was already picked up by the worker (race condition), the
   * removal silently no-ops.
   *
   * @param id - UUID of the message to cancel.
   *
   * @returns The serialized updated `MessageResponse`, or `null` if the
   *   message does not exist.
   *
   * @throws {BadRequestError} If the message status is not `SCHEDULED`.
   * @throws If the database transaction fails.
   */
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

  /**
   * Applies a delivery-status update received from the gateway service.
   *
   * Validates the status transition via `assertTransition()` before writing.
   * The status event is upserted using `(messageId, status, idempotencyKey)`
   * as a composite unique key, so duplicate callbacks from the gateway are
   * safely deduplicated — the upsert `update` clause is intentionally empty.
   *
   * Inside a transaction:
   * 1. Upserts the `MessageStatusEvent`.
   * 2. Updates the `ScheduledMessage` status, provider info, and (on failure)
   *    sets `errorMessage` to `"Gateway reported failure"`.
   *
   * @param payload - Gateway status payload validated by `gatewayStatusSchema`.
   * @param payload.messageId          UUID of the message being updated.
   * @param payload.status             New status to apply.
   * @param payload.provider           Gateway adapter identifier (e.g. `"applescript"`).
   * @param payload.providerMessageId  External message ID from the provider.
   * @param payload.idempotencyKey     Key used to deduplicate upserts.
   * @param payload.raw                Raw provider payload stored for debugging.
   *
   * @returns The serialized updated `MessageResponse`, or `null` if no record
   *   exists for `payload.messageId`.
   *
   * @throws If the requested status transition is invalid (via `assertTransition`).
   * @throws If the database transaction fails.
   */
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

  /**
   * Converts a raw Prisma `ScheduledMessage` record into a plain serializable
   * `MessageResponse` object, converting all `Date` fields to ISO-8601 strings.
   *
   * @param msg - The raw Prisma record.
   * @returns A plain object safe for JSON serialization.
   */
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

/**
 * Pre-wired singleton of `MessagesService` using the shared Prisma client
 * and the production BullMQ queue adapter.
 *
 * Import this in route handlers instead of constructing a new instance.
 *
 * @example
 * ```ts
 * import { messagesService } from '../services/messages'
 * const result = await messagesService.list(req.query)
 * ```
 */
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
