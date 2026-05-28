import { openai } from '@ai-sdk/openai'
import { generateMessageSchema } from '@ischeduler/shared'
import { streamText } from 'ai'
import { router } from '../../lib/router'

const SYSTEM_PROMPT = `You are a copywriter who writes short, warm, human iMessage marketing texts for small businesses.

Rules:
- Conversational and personal, like a real person texting a friend
- 1 to 3 short sentences maximum
- No corporate tone, no jargon, no spam or opt-out language
- Use minimal emojis (zero or one, only if it feels genuinely natural)
- Never use em dashes (the symbol "—") anywhere in the message
- Never include placeholder brackets like [name] or [business] unless they appear in the input
- Do not add a subject line or greeting label, just the message body`

export const generateMessageRoute = router({
  method: 'post',
  path: '/messages/generate',
  schema: {
    tags: ['messages'],
    summary: 'Stream a natural marketing message via AI',
    body: generateMessageSchema,
  },
  handler: async (req, reply) => {
    const { prompt, draft } = req.body

    const userPrompt = draft
      ? `Rewrite this draft so it sounds natural, warm and human, like a real person texting:\n\n${draft}`
      : prompt
        ? `Write a marketing text message about: ${prompt}`
        : `Write a friendly, natural marketing text message a small business could send to a customer.`

    const result = streamText({
      model: openai('gpt-5-nano'),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    })

    reply.header('Content-Type', 'text/plain; charset=utf-8')
    return reply.send(result.textStream)
  },
})
