import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { task } = await request.json().catch(() => ({ task: '' }))
  if (typeof task !== 'string' || task.trim().length < 3) {
    return NextResponse.json({ error: 'Enter a task with at least 3 characters.' }, { status: 400 })
  }
  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: 'DEEPSEEK_API_KEY is not configured.' }, { status: 503 })
  }

  const result = streamText({
    model: openai('deepseek-chat', {
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    }),
    system: `You are the reasoning lead for AgentPay Mesh. Analyze the user's task in clear, practical stages. Do not claim to have completed external actions, made purchases, or accessed live data. Return concise plain text with exactly these sections: INTENT, PLAN, RISKS, RECOMMENDATION. Explain what each specialized agent should contribute.`,
    prompt: task.trim(),
    temperature: 0.2,
  })

  return result.toTextStreamResponse()
}
