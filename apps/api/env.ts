import z from 'zod'

export const env: z.infer<typeof ENV_SCHEMA> = {
  database: {
    pgConnectionString: process.env.DATABASE_URL ?? '',
    redisUrl: process.env.REDIS_URL ?? '',
  },
}

const ENV_SCHEMA = z.object({
  database: z.object({
    pgConnectionString: z.string(),
    redisUrl: z.url(),
  }),
})

export function validateEnv() {
  const result = ENV_SCHEMA.safeParse(env)

  if (!result.success) {
    throw new Error('Invalid environment variables')
  }

  return result.data
}
