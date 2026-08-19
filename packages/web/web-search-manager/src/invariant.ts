/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-web-search-manager`.
 * @module @deepseek-ai/dsh-web-search-manager/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@deepseek-ai/dsh-web-search-manager'

/** Cordis companion plugin name. */
export const name = 'web-search-manager-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the package registers providers into ctx.web and
 * owns a settings section, but does not own a later authoritative event
 * stream to relate registrations to. Provider presence is verified through
 * the web seam's own duplicate-id and selection diagnostics.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
