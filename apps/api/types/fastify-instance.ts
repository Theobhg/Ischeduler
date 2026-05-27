import type { FastifyBaseLogger, FastifyInstance, RawServerDefault } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { IncomingMessage, ServerResponse } from 'http'

export type FastifyWithZodInstance = FastifyInstance<
  RawServerDefault,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  FastifyBaseLogger,
  ZodTypeProvider
>
