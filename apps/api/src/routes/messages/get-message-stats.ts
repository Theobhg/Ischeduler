import { messageStatsSchema } from '@ischeduler/shared'
import { router } from '../../lib/router'
import { messagesService } from '../../services/messages'

/**
 * GET /messages/stats
 *
 * Returns message counts grouped by status, aggregated via a single
 * Prisma `groupBy` query.
 *
 * The `sent` bucket is a composite that includes `ACCEPTED`, `SENT`,
 * `DELIVERED`, and `RECEIVED` — i.e. any status that represents a
 * successfully dispatched message.
 *
 * @route GET /messages/stats
 * @tags messages
 *
 * @response 200 {MessageStats}
 *   ```json
 *   {
 *     "scheduled": 4,
 *     "queued":    1,
 *     "sent":      12,
 *     "failed":    2,
 *     "cancelled": 1,
 *     "total":     20
 *   }
 *   ```
 * @response 500 Database error.
 */
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
