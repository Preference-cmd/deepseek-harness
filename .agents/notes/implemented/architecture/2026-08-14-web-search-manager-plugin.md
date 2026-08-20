# Agent Note: web-search-manager plugin

Status: implemented

## Problem

The existing web search providers (DeepSeek, Exa, Perplexity) are independent packages, each requiring separate cordis.yml entries and configuration surfaces. Users who want to use multiple search providers must configure each provider independently, with no centralised settings UI for managing credentials, endpoints, and model parameters across providers.

## Decision

A unified web search provider manager plugin (`@deepseek-ai/dsh-web-search-manager`) provides a single configuration surface for all known search providers. The plugin is a function/namespace plugin (`inject: ['web']`) that registers providers into `ctx.web` based on its config.

Each provider sub-config is optional — an omitted section means that provider is not registered. A single settings namespace (`web-search-manager`) carries all provider configurations, enabling the settings UI to expose every provider's tunables without requiring separate plugin entries.

Provider selection (which registered provider wins at execution time) remains the `web` service's `searchProvider` config. The manager registers providers but does not own selection.

### Provider lifecycle

DeepSeek uses option-thunks (like the standalone provider), so operational settings changes take effect at the next search without re-registration. Exa and Perplexity store options at construction time, so they are re-created on settings change via the `onChange` callback.

### Settings integration

The `installSettingsSection` mechanism registers the `web-search-manager` namespace with the settings provider. The web GUI's settings page exposes all provider tunables (API keys, endpoints, models) through this section. Provider sub-configs are resolved per-search via thunks, so settings changes reach the next search without restart.

## Alternatives considered

1. **Separate provider plugins without a manager**: The status quo. Each provider is independent, but composition requires multiple cordis.yml entries and no unified settings surface exists.

2. **Manager that owns provider selection**: A manager that also controls `searchProvider` would duplicate the web seam's existing selection logic and create a hidden priority chain. The web seam's selection semantics are well-defined and should remain the single authority.

3. **Manager that inlines all provider logic**: Copying provider implementations into the manager would violate the capability seam pattern (Service Definition / Service Provider / Consumer separation) and create maintenance burden when providers update.

## Consequences

- **Unified configuration surface**: Users configure all search providers in one plugin entry with one settings namespace.
- **Settings UI integration**: The web GUI's settings page exposes all provider tunables without requiring separate plugin entries.
- **No selection duplication**: Provider selection remains the web seam's responsibility, keeping the capability seam pattern intact.
- **Dynamic provider registration**: Settings changes that add/remove provider sub-configs dynamically register/unregister providers.
- **Dependency on all provider packages**: The manager has peer dependencies on all three search provider packages, increasing the dependency graph. This is acceptable because the manager is an optional composition layer, not a required dependency.

## Testing

- Typecheck: `npx tsc --noEmit --project packages/web/web-search-manager/tsconfig.json` passes.
- Host typecheck: `npx tsc --noEmit --project tsconfig.host.json` includes the new package.
- Unit tests: `packages/web/web-search-manager/tests/manager.spec.ts` (blocked by pre-existing test-invariants `FiberState` issue affecting all `ctx.plugin()`-based tests).
