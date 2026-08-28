/** `resolveInternalModuleUrl` across the two Node-internal `resolveSync` parameter orders. */

import { describe, expect, it } from 'vitest'
import type { ModuleLoader } from '@deepseek-ai/cordis-plugin-loader'
import { resolveInternalModuleUrl } from '../src/index.ts'

const BASE = 'file:///tree/'
const NAME = '@deepseek-ai/dsh-client-ui-chat'

/**
 * A `resolveSync` implementing one parameter order. The new order receives
 * `(parentURL, request)` so its second argument is the request object; the
 * old order receives `(specifier, parentURL, attributes)` so its second
 * argument is the parent URL string. `none` rejects every call. The
 * implementation reads the receiver, so an unbound call — extracting the
 * method off the loader object — throws like the real Node-internal one.
 */
function fakeInternal(tag: 'v1' | 'v2', implemented: 'new' | 'old' | 'none'): ModuleLoader {
  const loader = {
    version: tag,
    resolveSync(this: { id: string }, first: unknown, second: unknown): { url: string } {
      if ((this as unknown as object) !== (loader as unknown as object)) throw new Error('resolveSync lost its receiver')
      const isNewOrder = typeof second === 'object' && second !== null && 'specifier' in second
      if (implemented === 'none') throw new Error('unresolvable')
      if (implemented === 'new' && !isNewOrder) throw new Error('old order not implemented')
      if (implemented === 'old' && isNewOrder) throw new Error('new order not implemented')
      return { url: `file:///resolved/${isNewOrder ? String(first) : NAME}` }
    },
  }
  return loader as unknown as ModuleLoader
}

describe('resolveInternalModuleUrl', () => {
  it('resolves through the stamped new order when this Node implements it', () => {
    expect(resolveInternalModuleUrl(fakeInternal('v2', 'new'), NAME, BASE)).toBe(`file:///resolved/${BASE}`)
  })

  it('falls back to the old order when the v2 tag pairs with the old implementation', () => {
    expect(resolveInternalModuleUrl(fakeInternal('v2', 'old'), NAME, BASE)).toBe(`file:///resolved/${NAME}`)
  })

  it('resolves through the stamped old order when this Node implements it', () => {
    expect(resolveInternalModuleUrl(fakeInternal('v1', 'old'), NAME, BASE)).toBe(`file:///resolved/${NAME}`)
  })

  it('falls back to the new order when the v1 tag pairs with the new implementation', () => {
    expect(resolveInternalModuleUrl(fakeInternal('v1', 'new'), NAME, BASE)).toBe(`file:///resolved/${BASE}`)
  })

  it('returns undefined when both orders reject the name', () => {
    expect(resolveInternalModuleUrl(fakeInternal('v2', 'none'), NAME, BASE)).toBeUndefined()
  })
})
