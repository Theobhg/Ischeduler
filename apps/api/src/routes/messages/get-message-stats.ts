import { messageStatsSchema } from '@ischeduler/shared'
import { router } from '../../lib/router'
import { messagesService } from '../../services/messages'

export const getMessageStatsRoute = router({
  method: 'get',
  path: '/messages/stats',
  schema: {
    tags: ['messages'],
    summary: 'Get message counts grouped by status',
    response: {
      200: messageStatsSchema,
    },
  },
  handler: async (_req, reply) => {
    const stats = await messagesService.stats()
    return reply.send(stats)
  },
})
