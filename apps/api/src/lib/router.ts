import type { FastifyInstance, FastifyReply, FastifyRequest, FastifySchema } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'

type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

type AnyZod = z.ZodTypeAny

type RouteSchema = {
  body?: AnyZod
  querystring?: AnyZod
  params?: AnyZod
  headers?: AnyZod
  response?: Record<string | number, AnyZod>
  tags?: readonly string[]
  summary?: string
  description?: string
  security?: ReadonlyArray<{ [key: string]: string[] }>
}

type InferOrUnknown<T> = T extends AnyZod ? z.infer<T> : unknown

export function router<TSchema extends RouteSchema>(opts: {
  method: HTTPMethod
  path: string
  schema: TSchema
  handler: (
    request: FastifyRequest<{
      Body: InferOrUnknown<TSchema['body']>
      Querystring: InferOrUnknown<TSchema['querystring']>
      Params: InferOrUnknown<TSchema['params']>
      Headers: InferOrUnknown<TSchema['headers']>
    }>,
    reply: FastifyReply,
  ) => Promise<unknown> | unknown
}) {
  return async (app: FastifyInstance) => {
    const appTyped = app.withTypeProvider<ZodTypeProvider>()

    const schema: FastifySchema = {}

    if (opts.schema.body) schema.body = opts.schema.body
    if (opts.schema.querystring) schema.querystring = opts.schema.querystring
    if (opts.schema.params) schema.params = opts.schema.params
    if (opts.schema.headers) schema.headers = opts.schema.headers
    if (opts.schema.response) schema.response = opts.schema.response
    if (opts.schema.tags) schema.tags = opts.schema.tags as unknown as string[]
    if (opts.schema.summary) schema.summary = opts.schema.summary
    if (opts.schema.description) schema.description = opts.schema.description
    if (opts.schema.security) schema.security = opts.schema.security as unknown as Array<Record<string, string[]>>

    appTyped.route({
      method: opts.method.toUpperCase() as Uppercase<HTTPMethod>,
      url: opts.path,
      schema,
      handler: opts.handler,
    })
  }
}
