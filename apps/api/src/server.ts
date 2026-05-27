import fastifyCors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
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
      title: 'App API',
      description: 'App API',
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

app.register(fastifyMultipart, {
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB for audio files
  },
})

app.register(fastifyCors, {
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
})

/* 
==============================================
  Routes
============================================== 
*/


/* 
==============================================
  Env validation & Server startup
============================================== 
*/

validateEnv()

app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('🚀 HTTP server running on port 3333')
})
