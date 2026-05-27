import { gatewayStatusSchema, messageResponseSchema } from '@ischeduler/shared'
import { z } from 'zod'
import { router } from '../../lib/router'
import { applyGatewayStatus } from '../../services/messages'

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
    const message = await applyGatewayStatus(req.body)
    if (!message) return reply.code(404).send({ message: 'Message not found' })
    return reply.send(message)
  },
})
