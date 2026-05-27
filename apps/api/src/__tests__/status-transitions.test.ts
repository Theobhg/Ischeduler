import { canTransition, type MessageStatus, STATUS_TRANSITIONS } from '@ischeduler/shared'
import { describe, expect, it } from 'vitest'

describe('status transitions', () => {
  it('allows SCHEDULED → QUEUED', () => {
    expect(canTransition('SCHEDULED', 'QUEUED')).toBe(true)
  })

  it('allows SCHEDULED → CANCELLED', () => {
    expect(canTransition('SCHEDULED', 'CANCELLED')).toBe(true)
  })

  it('allows QUEUED → ACCEPTED', () => {
    expect(canTransition('QUEUED', 'ACCEPTED')).toBe(true)
  })

  it('allows QUEUED → FAILED', () => {
    expect(canTransition('QUEUED', 'FAILED')).toBe(true)
  })

  it('allows ACCEPTED → SENT', () => {
    expect(canTransition('ACCEPTED', 'SENT')).toBe(true)
  })

  it('allows SENT → DELIVERED', () => {
    expect(canTransition('SENT', 'DELIVERED')).toBe(true)
  })

  it('allows DELIVERED → RECEIVED', () => {
    expect(canTransition('DELIVERED', 'RECEIVED')).toBe(true)
  })

  it('rejects SCHEDULED → SENT (skipping steps)', () => {
    expect(canTransition('SCHEDULED', 'SENT')).toBe(false)
  })

  it('rejects CANCELLED → QUEUED (terminal state)', () => {
    expect(canTransition('CANCELLED', 'QUEUED')).toBe(false)
  })

  it('rejects FAILED → SCHEDULED (terminal state)', () => {
    expect(canTransition('FAILED', 'SCHEDULED')).toBe(false)
  })

  it('rejects RECEIVED → anything (terminal state)', () => {
    const targets = Object.keys(STATUS_TRANSITIONS) as MessageStatus[]
    for (const to of targets) {
      expect(canTransition('RECEIVED', to)).toBe(false)
    }
  })

  it('rejects DELIVERED → CANCELLED (wrong direction)', () => {
    expect(canTransition('DELIVERED', 'CANCELLED')).toBe(false)
  })
})
