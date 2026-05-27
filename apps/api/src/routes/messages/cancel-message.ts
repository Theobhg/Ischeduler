import { messageParamsSchema, messageResponseSchema } from '@ischeduler/shared'
import { z } from 'zod'
import { router } from '../../lib/router'
import { cancelMessage } from '../../services/messages'

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
    const message = await cancelMessage(req.params.id)
    if (!message) return reply.code(404).send({ message: 'Message not found' })
    return reply.send(message)
  },
})
