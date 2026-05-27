import { z } from 'zod'
import { MESSAGE_STATUSES } from './status'

export const messageStatusSchema = z.enum(MESSAGE_STATUSES)

// ─── Request schemas ────────────────────────────────────────────────────────

export const createMessageSchema = z.object({
  toPhone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, 'Must be a valid E.164 phone number (e.g. +15551234567)'),
  body: z.string().min(1, 'Message body cannot be empty'),
  scheduledAt: z
    .string()
    .datetime({ message: 'Must be a valid ISO 8601 datetime' })
    .refine((val) => new Date(val) > new Date(), { message: 'Scheduled time must be in the future' }),
})

export type CreateMessageInput = z.infer<typeof createMessageSchema>

export const listMessagesQuerySchema = z.object({
  status: messageStatusSchema.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>

export const messageParamsSchema = z.object({
  id: z.uuid(),
})

export const gatewayStatusSchema = z.object({
  messageId: z.uuid(),
  status: z.enum(['ACCEPTED', 'SENT', 'DELIVERED', 'RECEIVED', 'FAILED']),
  provider: z.string(),
  providerMessageId: z.string(),
  idempotencyKey: z.string(),
  raw: z.record(z.string(), z.any()).optional(),
})

export type GatewayStatusPayload = z.infer<typeof gatewayStatusSchema>

// ─── Response schemas ────────────────────────────────────────────────────────

export const statusEventSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  status: messageStatusSchema,
  payload: z.record(z.string(), z.any()).nullable(),
  idempotencyKey: z.string().nullable(),
  createdAt: z.string(),
})

export type StatusEvent = z.infer<typeof statusEventSchema>

export const messageResponseSchema = z.object({
  id: z.string(),
  toPhone: z.string(),
  body: z.string(),
  scheduledAt: z.string(),
  status: messageStatusSchema,
  provider: z.string().nullable(),
  providerMessageId: z.string().nullable(),
  errorMessage: z.string().nullable(),
  retryCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type MessageResponse = z.infer<typeof messageResponseSchema>

export const messageWithEventsSchema = messageResponseSchema.extend({
  statusEvents: z.array(statusEventSchema),
})

export type MessageWithEvents = z.infer<typeof messageWithEventsSchema>

export const listMessagesResponseSchema = z.object({
  data: z.array(messageResponseSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
})

export type ListMessagesResponse = z.infer<typeof listMessagesResponseSchema>

export const queueStatsSchema = z.object({
  waiting: z.number(),
  delayed: z.number(),
  active: z.number(),
  completed: z.number(),
  failed: z.number(),
})

export type QueueStats = z.infer<typeof queueStatsSchema>

export const messageStatsSchema = z.object({
  scheduled: z.number(),
  queued: z.number(),
  sent: z.number(),
  failed: z.number(),
  cancelled: z.number(),
  total: z.number(),
})

export type MessageStats = z.infer<typeof messageStatsSchema>
