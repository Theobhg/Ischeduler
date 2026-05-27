import type { IMessageGateway } from './interface'
import { MockAdapter } from './mock'
import { AppleScriptAdapter } from './applescript'

export function createAdapter(): IMessageGateway {
  const adapterType = process.env.GATEWAY_ADAPTER ?? 'mock'

  switch (adapterType) {
    case 'applescript':
      return new AppleScriptAdapter()
    case 'mock':
      return new MockAdapter()
    default:
      throw new Error(`Unknown gateway adapter: ${adapterType}. Supported: mock, applescript`)
  }
}
