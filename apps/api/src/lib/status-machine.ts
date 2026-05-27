import { canTransition, type MessageStatus } from '@ischeduler/shared'
import { BadRequestError } from './errors/bad-request-error'

export function assertTransition(from: MessageStatus, to: MessageStatus): void {
  if (!canTransition(from, to)) {
    throw new BadRequestError(
      `Invalid status transition from ${from} to ${to}`,
    )
  }
}
