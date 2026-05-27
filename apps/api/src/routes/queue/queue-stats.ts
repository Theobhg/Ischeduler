import { queueStatsSchema } from '@ischeduler/shared'
import { router } from '../../lib/router'
import { getQueueStats } from '../../lib/queue'

/**
 * GET /queue/stats
 *
 * Returns live BullMQ job counts for the `messages` queue, read directly
 * from Redis via BullMQ's `getJobCounts()` API.
 *
 * Useful for monitoring queue health and diagnosing processing backlogs.
 * Polled by the dashboard every 5 seconds.
 *
 * @route GET /queue/stats
 * @tags queue
 *
 * @response 200 {QueueStats}
 *   ```json
 *   {
 *     "waiting":   3,
 *     "delayed":   10,
 *     "active":    1,
 *     "completed": 42,
 *     "failed":    2
 *   }
 *   ```
 * @response 500 Redis/BullMQ connection error.
 */
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
