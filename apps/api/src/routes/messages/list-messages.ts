import { listMessagesQuerySchema, listMessagesResponseSchema } from '@ischeduler/shared'
import { router } from '../../lib/router'
import { messagesService } from '../../services/messages'

/**
 * GET /messages
 *
 * Returns a paginated, optionally filtered list of scheduled messages,
 * ordered by `updatedAt` descending.
 *
 * @route GET /messages
 * @tags messages
 *
 * @query {ListMessagesQuery}
 * @query.status  {MessageStatus} [optional] Filter by a specific status
 *   (`SCHEDULED` | `QUEUED` | `ACCEPTED` | `SENT` | `DELIVERED` |
 *    `RECEIVED` | `FAILED` | `CANCELLED`).
 * @query.search  {string} [optional] Case-insensitive substring match
 *   applied to both `toPhone` and `body`.
 * @query.limit   {number} [default=20] Maximum number of records to return.
 * @query.offset  {number} [default=0]  Number of records to skip.
 *
 * @response 200 {ListMessagesResponse}
 *   `{ data: MessageResponse[], total: number, limit: number, offset: number }`
 * @response 400 Validation error — query string does not match `listMessagesQuerySchema`.
 * @response 500 Database error.
 */
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
    const result = await messagesService.list(req.query)
    return reply.send(result)
  },
})
