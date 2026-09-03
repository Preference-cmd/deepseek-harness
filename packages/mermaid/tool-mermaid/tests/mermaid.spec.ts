import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import * as ToolMermaid from '../src/index.ts'

const signal = new AbortController().signal
const session = { header: {} }
let callCounter = 0

async function boot() {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(ToolMermaid)
  return ctx
}

function call(ctx: Context, name: string, args: unknown) {
  return ctx.tools.execute({
    signal,
    callId: ToolCallId(`call-${++callCounter}`),
    name,
    arguments: args,
    agent: { session } as never,
  })
}

describe('tool-mermaid', () => {
  it('registers mermaid_render with a diagram parameter', async () => {
    const ctx = await boot()
    try {
      const schemas = ctx.tools.schemas()
      const render = schemas.find(schema => schema.name === 'mermaid_render')
      expect(render).toBeDefined()
      expect(render?.parameters).toMatchObject({
        type: 'object',
        properties: { diagram: { type: 'string' } },
      })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('returns the source as a mermaid fence', async () => {
    const ctx = await boot()
    try {
      const result = await call(ctx, 'mermaid_render', { diagram: 'sequenceDiagram\nA->>B: hi' })
      expect(result.content).toContainEqual({
        type: 'text',
        text: '```mermaid\nsequenceDiagram\nA->>B: hi\n```',
      })
    } finally {
      await ctx.fiber.dispose()
    }
  })

  it('refuses an empty diagram', async () => {
    const ctx = await boot()
    try {
      const result = await call(ctx, 'mermaid_render', { diagram: '  ' })
      expect(result.isError).toBe(true)
    } finally {
      await ctx.fiber.dispose()
    }
  })
})
