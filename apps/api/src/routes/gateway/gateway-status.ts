import { gatewayStatusSchema, messageResponseSchema } from '@ischeduler/shared'
import { z } from 'zod'
import { router } from '../../lib/router'
import { messagesService } from '../../services/messages'

/**
 * POST /gateway/status
 *
 * Ingests a delivery-status callback from the gateway service (e.g. the
 * AppleScript adapter) and advances the message's state machine.
 *
 * The handler validates the requested status transition via
 * `assertTransition()`. If the transition is illegal (e.g. `DELIVERED →
 * SCHEDULED`) it throws, returning a 400. Status events are upserted with
 * an `idempotencyKey` so duplicate callbacks from the gateway are safely
 * ignored.
 *
 * @route POST /gateway/status
 * @tags gateway
 *
 * @body {GatewayStatusPayload}
 * @body.messageId         {string}  UUID of the message being updated.
 * @body.status            {MessageStatus} New status to apply.
 * @body.provider          {string}  [optional] Gateway adapter identifier (e.g. `"applescript"`).
 * @body.providerMessageId {string}  [optional] External ID assigned by the provider.
 * @body.idempotencyKey    {string}  Unique key used to deduplicate event upserts.
 * @body.raw               {object}  [optional] Raw provider payload for debugging.
 *
 * @response 200 {MessageResponse} The message record with the updated status.
 * @response 400 Invalid status transition or body validation failure.
 * @response 404 `{ message: "Message not found" }` — no record with the given `messageId`.
 * @response 500 Database error.
 */
export const gatewayStatusRoute = router({
  method: 'post',
  path: '/gateway/status',
  schema: {
    tags: ['gateway'],
    summary: 'Receive status update from gateway',
    body: gatewayStatusSchema,
    response: {
      200: messageResponseSchema,
      404: z.object({ message: z.string() }),
    },
  },
  handler: async (req, reply) => {
    const message = await messagesService.applyGatewayStatus(req.body)
    if (!message) return reply.code(404).send({ message: 'Message not found' })
    return reply.send(message)
  },
})
