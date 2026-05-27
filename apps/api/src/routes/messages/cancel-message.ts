import { messageParamsSchema, messageResponseSchema } from '@ischeduler/shared'
import { z } from 'zod'
import { router } from '../../lib/router'
import { messagesService } from '../../services/messages'

/**
 * PATCH /messages/:id/cancel
 *
 * Cancels a message that is currently in `SCHEDULED` status.
 *
 * Transitions the status to `CANCELLED`, appends a `CANCELLED` status-event
 * inside a transaction, then attempts to remove the pending BullMQ job.
 * If the job was already dequeued (race condition), the removal is silently
 * ignored.
 *
 * @route PATCH /messages/:id/cancel
 * @tags messages
 *
 * @param {string} id - UUID of the scheduled message to cancel.
 *
 * @response 200 {MessageResponse} The updated message with `status: "CANCELLED"`.
 * @response 400 `{ message: string }` — message is not in `SCHEDULED` state
 *   (e.g. already `SENT`, `QUEUED`, `FAILED`, etc.).
 * @response 404 `{ message: "Message not found" }` — no record with the given id.
 * @response 500 Database or queue error.
 */
export const cancelMessageRoute = router({
  method: 'patch',
  path: '/messages/:id/cancel',
  schema: {
    tags: ['messages'],
    summary: 'Cancel a scheduled message',
    params: messageParamsSchema,
    response: {
      200: messageResponseSchema,
      404: z.object({ message: z.string() }),
    },
  },
  handler: async (req, reply) => {
    const message = await messagesService.cancel(req.params.id)
    if (!message) return reply.code(404).send({ message: 'Message not found' })
    return reply.send(message)
  },
})
