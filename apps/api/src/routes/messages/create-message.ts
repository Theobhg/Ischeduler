import { createMessageSchema, messageResponseSchema } from '@ischeduler/shared'
import { router } from '../../lib/router'
import { messagesService } from '../../services/messages'

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
