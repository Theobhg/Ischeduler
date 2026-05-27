import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { GatewaySendInput, GatewaySendResult, IMessageGateway } from './interface'

const execFileAsync = promisify(execFile)

export class AppleScriptAdapter implements IMessageGateway {
  async send(input: GatewaySendInput): Promise<GatewaySendResult> {
    const escaped = input.body
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')

    const script = [
      `tell application "Messages"`,
      `  set targetService to 1st service whose service type = iMessage`,
      `  set targetBuddy to buddy "${input.toPhone}" of targetService`,
      `  send "${escaped}" to targetBuddy`,
      `end tell`,
    ].join('\n')

    try {
      await execFileAsync('osascript', ['-e', script])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`[applescript] osascript failed: ${msg}`)
    }

    const providerMessageId = `local-${Date.now()}`

    console.log(`[applescript] sent message ${input.messageId} → ${input.toPhone}`)

    return {
      provider: 'local-applescript',
      providerMessageId,
      status: 'SENT',
    }
  }
}
