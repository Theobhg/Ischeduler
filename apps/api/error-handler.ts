import type { FastifyError, FastifyInstance } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  type ZodFastifySchemaValidationError,
} from 'fastify-type-provider-zod'
import { BadRequestError } from './src/lib/errors/bad-request-error'
import { ForbiddenError } from './src/lib/errors/forbidden-error'
import { UnauthorizedError } from './src/lib/errors/unauthorized-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

type FastifyValidationError = FastifyError & {
  validation: ZodFastifySchemaValidationError[]
}

function prettifyZodValidationErrors(error: FastifyValidationError) {
  const issues = error.validation.map((error) => ({ path: error.instancePath.slice(1), message: error.message }))

  return issues
}

// biome-ignore lint/correctness/noUnusedFunctionParameters: We need to use the request and reply objects to send the response
export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  if (hasZodFastifySchemaValidationErrors(error)) {
    console.log(error.validation)

    return reply.code(400).send({
      error: 'Invalid request',
      issues: prettifyZodValidationErrors(error),
    })
  }

  if (isResponseSerializationError(error)) {
    console.error({
      message: "Response doesn't match the schema",
      details: {
        issues: error.cause.issues,
        method: error.method,
        url: error.url,
      },
    })

    return reply.code(500).send({
      error: 'Internal Server Error',
    })
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    })
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    })
  }

  if (error instanceof ForbiddenError) {
    return reply.status(403).send({
      message: error.message,
    })
  }

  console.log(error)


  return reply.status(500).send({ message: 'Internal server error' })
}
