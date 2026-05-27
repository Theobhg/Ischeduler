import { messageParamsSchema, messageWithEventsSchema } from '@ischeduler/shared'
import { z } from 'zod'
import { router } from '../../lib/router'
import { getMessage } from '../../services/messages'

export const getMessageRoute = router({
  method: 'get',
  path: '/messages/:id',
  schema: {
    tags: ['messages'],
    summary: 'Get a message with status timeline',
    params: messageParamsSchema,
    response: {
      200: messageWithEventsSchema,
      404: z.object({ message: z.string() }),
    },
  },
  handler: async (req, reply) => {
    const message = await getMessage(req.params.id)
    if (!message) return reply.code(404).send({ message: 'Message not found' })
    return reply.send(message)
  },
})
