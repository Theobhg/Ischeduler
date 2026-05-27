import { describe, it, expect } from 'vitest'
import { createMessageSchema, gatewayStatusSchema } from '@ischeduler/shared'

describe('createMessageSchema', () => {
  const futureDate = new Date(Date.now() + 3600_000).toISOString()

  it('accepts valid input', () => {
    const result = createMessageSchema.safeParse({
      toPhone: '+15551234567',
      body: 'Hello!',
      scheduledAt: futureDate,
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing phone', () => {
    const result = createMessageSchema.safeParse({
      body: 'Hello!',
      scheduledAt: futureDate,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid E.164 phone (no country code)', () => {
    const result = createMessageSchema.safeParse({
      toPhone: '5551234567',
      body: 'Hello!',
      scheduledAt: futureDate,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty body', () => {
    const result = createMessageSchema.safeParse({
      toPhone: '+15551234567',
      body: '',
      scheduledAt: futureDate,
    })
    expect(result.success).toBe(false)
  })

  it('rejects past scheduledAt', () => {
    const pastDate = new Date(Date.now() - 1000).toISOString()
    const result = createMessageSchema.safeParse({
      toPhone: '+15551234567',
      body: 'Hello!',
      scheduledAt: pastDate,
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-ISO scheduledAt', () => {
    const result = createMessageSchema.safeParse({
      toPhone: '+15551234567',
      body: 'Hello!',
      scheduledAt: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })
})

describe('gatewayStatusSchema', () => {
  const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

  it('accepts valid SENT payload', () => {
    const result = gatewayStatusSchema.safeParse({
      messageId: VALID_UUID,
      status: 'SENT',
      provider: 'mock',
      providerMessageId: 'mock-123',
      idempotencyKey: 'mock-123-SENT',
    })
    expect(result.success).toBe(true)
  })

  it('rejects unknown status', () => {
    const result = gatewayStatusSchema.safeParse({
      messageId: VALID_UUID,
      status: 'UNKNOWN',
      provider: 'mock',
      providerMessageId: 'mock-123',
      idempotencyKey: 'mock-123-UNKNOWN',
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-uuid messageId', () => {
    const result = gatewayStatusSchema.safeParse({
      messageId: 'not-a-uuid',
      status: 'SENT',
      provider: 'mock',
      providerMessageId: 'mock-123',
      idempotencyKey: 'mock-123-SENT',
    })
    expect(result.success).toBe(false)
  })
})
