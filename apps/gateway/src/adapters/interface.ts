export interface GatewaySendInput {
  messageId: string
  toPhone: string
  body: string
}

export interface GatewaySendResult {
  provider: string
  providerMessageId: string
  status: 'ACCEPTED' | 'SENT'
}

export interface IMessageGateway {
  send(input: GatewaySendInput): Promise<GatewaySendResult>
}
