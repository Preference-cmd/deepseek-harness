# Agent Note: Resolve the Node-internal resolveSync across its parameter orders

Status: implemented

English | [中文](2026-08-29-node-internal-resolvesync-orders.zh.md)

## Problem

On Node 24.11, `dsh web` served an empty `window.__DSH_BOOT__` graph — `"entries":[],"batches":[]` — so the browser died with "Failed to load plugins: client-modules: HTML did not preload `@deepseek-ai/dsh-client-modules/client.js`". `ClientModuleRegistry` had classified every one of the 119 resolved packages as permanently not a client row. The chain: `locatePkgJson` resolves the row's specifier through the Node-internal loader, whose raw object `ModuleLoader.fromInternal` tags `v2` on every Node ≥ 24; on Node 24.11 that object still implements the old `(specifier, parentURL, attributes)` order the tag claims was replaced, its implementation requires its receiver, and the v2-shaped call therefore threw for every name — including packages that demonstrably load.

## Decision

`resolveInternalModuleUrl` resolves through the stamped order first and the other order second, and invokes `resolveSync` as a method of the internal loader on every attempt — extracting the function would lose the receiver and break the working order too. Both orders rejecting still returns `undefined`, which keeps the existing "permanently not a client row" classification for genuinely unresolvable names. Receiver-checking fakes cover the tagged-order/implemented-order matrix.

## Alternatives considered

**Normalize the version stamp inside `vendor/loader`'s `fromInternal`.** Rejected: a vendored-source edit with a blast radius over every loader consumer for one caller's needs; the signature probe would also have to live behind the same receiver rule to stay honest.

**Drop the internal resolver for a `createRequire` walk.** Rejected: the internal resolver honours the Loader's active ESM hooks, the same resolution the row's own import will use; a `require` walk classifies rows differently from how they actually load.

## Consequences

- On Node 24.11 the boot graph composes again (45 client entries, bootstrap and application batches), so the web shell receives the module registrations it waits for.
- A future Node release that restores the new order keeps working: the stamped order is attempted first, so the fallback only runs when it must.
- Upstream carries the same defect; this fix is fork-local until then.

## Related

The same post-sync repair family as [the fork client realignment](../bug-fix/2026-08-28-realign-fork-client-code-after-upstream-sync.md).
