import z from 'zod'

const ENV_SCHEMA = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
})

export type Env = z.infer<typeof ENV_SCHEMA>

export function validateEnv(): Env {
  const result = ENV_SCHEMA.safeParse(process.env)

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }

  return result.data
}
