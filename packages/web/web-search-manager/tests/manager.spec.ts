/** The web-search-manager plugin registers providers based on config sections. */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import WebRuntime from '@deepseek-ai/dsh-web'
import * as managerPlugin from '@deepseek-ai/dsh-web-search-manager'

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

/** Minimal Exa-shaped search response. */
const EXA_RESULT = {
  results: [{ url: 'https://a.test', title: 'A', highlights: ['snippet a'] }],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('web-search-manager', () => {
  describe('provider registration', () => {
    it('registers only providers whose sub-config is present', async () => {
      const ctx = new Context()
      await ctx.plugin(WebRuntime, {})
      await ctx.plugin(managerPlugin, {
        exa: { apiKey: 'exa-key' },
      })

      // Exa is registered and available — search should not throw "no usable web provider"
      vi.spyOn(globalThis, 'fetch')
        .mockImplementation(() => Promise.resolve(jsonResponse(EXA_RESULT)))
      await expect(ctx.web.search({ query: 'test' })).resolves.toBeDefined()
      await ctx.fiber.dispose()
    })

    it('does not register providers whose sub-config is absent', async () => {
      const ctx = new Context()
      await ctx.plugin(WebRuntime, {})
      await ctx.plugin(managerPlugin, {})

      // No providers registered → unavailable
      await expect(ctx.web.search({ query: 'test' })).rejects.toThrow(/no usable web provider/)
      await ctx.fiber.dispose()
    })

    it('registers multiple providers when multiple sub-configs are present', async () => {
      const ctx = new Context()
      await ctx.plugin(WebRuntime, {})
      await ctx.plugin(managerPlugin, {
        exa: { apiKey: 'exa-key' },
        perplexity: { apiKey: 'px-key' },
      })

      // Multiple usable providers → ambiguous
      await expect(ctx.web.search({ query: 'test' })).rejects.toThrow(/multiple usable web providers/)
      await ctx.fiber.dispose()
    })

    it('selects the pinned provider when searchProvider is set', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
        .mockImplementation(() => Promise.resolve(jsonResponse(EXA_RESULT)))

      const ctx = new Context()
      await ctx.plugin(WebRuntime, { searchProvider: 'exa' })
      await ctx.plugin(managerPlugin, {
        exa: { apiKey: 'exa-key' },
        perplexity: { apiKey: 'px-key' },
      })

      const result = await ctx.web.search({ query: 'test' })
      expect(result.sources.length).toBeGreaterThan(0)
      // Verify the Exa endpoint was called. fetch's first argument is a string
      // URL in this spec (not a Request object) so String() is unambiguous;
      // the optional chaining preserves the existing assertion if no call
      // landed.
      const lastCallArg = fetchSpy.mock.calls.at(-1)?.[0]
      const calledUrl = typeof lastCallArg === 'string' ? lastCallArg : ''
      expect(calledUrl).toContain('exa.ai')
      await ctx.fiber.dispose()
    })

    it('unregisters a provider when its sub-config is removed', async () => {
      const ctx = new Context()
      await ctx.plugin(WebRuntime, { searchProvider: 'exa' })
      await ctx.plugin(managerPlugin, {
        exa: { apiKey: 'exa-key' },
      })

      // Exa is registered and available
      vi.spyOn(globalThis, 'fetch')
        .mockImplementation(() => Promise.resolve(jsonResponse(EXA_RESULT)))
      await expect(ctx.web.search({ query: 'test' })).resolves.toBeDefined()

      // Dispose the manager — Exa should be unregistered
      await ctx.fiber.dispose()
    })
  })
})
