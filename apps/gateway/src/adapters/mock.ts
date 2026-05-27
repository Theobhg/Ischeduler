import type { GatewaySendInput, GatewaySendResult, IMessageGateway } from './interface'

const FAILURE_RATE = Number(process.env.MOCK_FAILURE_RATE ?? 0)

export class MockAdapter implements IMessageGateway {
  async send(input: GatewaySendInput): Promise<GatewaySendResult> {
    await sleep(200)

    if (FAILURE_RATE > 0 && Math.random() < FAILURE_RATE) {
      throw new Error(`[mock] simulated send failure for message ${input.messageId}`)
    }

    const providerMessageId = `mock-${Date.now()}-${input.messageId.slice(0, 8)}`

    console.log(`[mock] sent message ${input.messageId} → ${input.toPhone}`)

    return {
      provider: 'mock',
      providerMessageId,
      status: 'SENT',
    }
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
