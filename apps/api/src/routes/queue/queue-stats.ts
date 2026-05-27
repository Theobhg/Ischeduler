import { queueStatsSchema } from '@ischeduler/shared'
import { router } from '../../lib/router'
import { getQueueStats } from '../../lib/queue'

export const queueStatsRoute = router({
  method: 'get',
  path: '/queue/stats',
  schema: {
    tags: ['queue'],
    summary: 'Get BullMQ queue statistics',
    response: {
      200: queueStatsSchema,
    },
  },
  handler: async (_req, reply) => {
    const stats = await getQueueStats()
    return reply.send(stats)
  },
})
