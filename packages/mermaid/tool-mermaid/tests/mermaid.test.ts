import { describe, expect, it } from 'vitest'

describe('tool-mermaid', () => {
  it('exports the correct name', async () => {
    const mod = await import('../src/index.ts')
    expect(mod.name).toBe('tool-mermaid')
  })

  it('exports apply function', async () => {
    const mod = await import('../src/index.ts')
    expect(typeof mod.apply).toBe('function')
  })
})
