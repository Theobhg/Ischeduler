import { createMessageSchema, messageResponseSchema } from '@ischeduler/shared'
import { router } from '../../lib/router'
import { messagesService } from '../../services/messages'

/**
 * POST /messages
 *
 * Schedules a new iMessage for future delivery.
 *
 * Persists the message with status `SCHEDULED`, records the initial
 * `SCHEDULED` status event, and enqueues a BullMQ delayed job that
 * fires at `scheduledAt`.
 *
 * @route POST /messages
 * @tags messages
 *
 * @body {CreateMessageInput}
 * @body.toPhone  {string} Recipient phone number in E.164 format (e.g. `+15551234567`).
 * @body.body     {string} Text content of the message.
 * @body.scheduledAt {string} ISO-8601 datetime — must be in the future.
 *
 * @response 201 {MessageResponse} The created message record.
 * @response 400 Validation error — body does not match `createMessageSchema`.
 * @response 500 Internal error persisting the record or enqueueing the job.
 */
export const createMessageRoute = router({
  method: 'post',
  path: '/messages',
  schema: {
    tags: ['messages'],
    summary: 'Schedule a new iMessage',
    body: createMessageSchema,
    response: {
      201: messageResponseSchema,
    },
  },
  handler: async (req, reply) => {
    const message = await messagesService.create(req.body)
    return reply.code(201).send(message)
  },
})
