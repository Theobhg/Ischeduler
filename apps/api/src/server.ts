import fastifyCors from '@fastify/cors'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { validateEnv } from '../env'
import { errorHandler } from '../error-handler'
import { gatewayStatusRoute } from './routes/gateway/gateway-status'
import { cancelMessageRoute } from './routes/messages/cancel-message'
import { createMessageRoute } from './routes/messages/create-message'
import { getMessageRoute } from './routes/messages/get-message'
import { getMessageStatsRoute } from './routes/messages/get-message-stats'
import { listMessagesRoute } from './routes/messages/list-messages'
import { queueStatsRoute } from './routes/queue/queue-stats'

/* 
==============================================
  Application
============================================== 
*/

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler)

/* 
==============================================
  Swagger
============================================== 
*/

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'IScheduler API',
      description: 'iMessage Scheduler REST API',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

/* 
==============================================
  Bootstrap
============================================== 
*/

app.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
})

/* 
==============================================
  Routes
============================================== 
*/

app.register(createMessageRoute)
app.register(listMessagesRoute)
app.register(getMessageStatsRoute)
app.register(getMessageRoute)
app.register(cancelMessageRoute)
app.register(gatewayStatusRoute)
app.register(queueStatsRoute)

/* 
==============================================
  Env validation & Server startup
============================================== 
*/

validateEnv()

app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('HTTP server running on port 3333')
})
