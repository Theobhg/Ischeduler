import 'dotenv/config'
import fastifyCors from '@fastify/cors'
import axios from 'axios'
import { fastify } from 'fastify'
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { createAdapter } from './adapters/factory'

const GATEWAY_PORT = Number(process.env.GATEWAY_PORT ?? 4000)
const API_STATUS_CALLBACK_URL = process.env.API_STATUS_CALLBACK_URL ?? 'http://localhost:3333/api/gateway/status'

const adapter = createAdapter()

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: true })

const sendBodySchema = z.object({
  messageId: z.string().uuid(),
  toPhone: z.string(),
  body: z.string(),
})

const sendResponseSchema = z.object({
  provider: z.string(),
  providerMessageId: z.string(),
  status: z.enum(['ACCEPTED', 'SENT']),
})

app.route({
  method: 'POST',
  url: '/send',
  schema: {
    body: sendBodySchema,
    response: { 200: sendResponseSchema },
  },
  handler: async (req, reply) => {
    const { messageId, toPhone, body } = req.body as z.infer<typeof sendBodySchema>

    const result = await adapter.send({ messageId, toPhone, body })

    const idempotencyKey = `${result.providerMessageId}-${result.status}`
    axios
      .post(API_STATUS_CALLBACK_URL, {
        messageId,
        status: result.status,
        provider: result.provider,
        providerMessageId: result.providerMessageId,
        idempotencyKey,
        raw: {},
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[gateway] status callback failed: ${msg}`)
      })

    return reply.send(result)
  },
})

app.listen({ port: GATEWAY_PORT, host: '0.0.0.0' }).then(() => {
  const adapterType = process.env.GATEWAY_ADAPTER ?? 'mock'
  console.log(`[gateway] running on port ${GATEWAY_PORT} with adapter=${adapterType}`)
})
