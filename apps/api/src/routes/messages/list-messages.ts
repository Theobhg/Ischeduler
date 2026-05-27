import { listMessagesQuerySchema, listMessagesResponseSchema } from '@ischeduler/shared'
import { router } from '../../lib/router'
import { listMessages } from '../../services/messages'

export const listMessagesRoute = router({
  method: 'get',
  path: '/messages',
  schema: {
    tags: ['messages'],
    summary: 'List scheduled messages',
    querystring: listMessagesQuerySchema,
    response: {
      200: listMessagesResponseSchema,
    },
  },
  handler: async (req, reply) => {
    const result = await listMessages(req.query)
    return reply.send(result)
  },
})
