# Agent Note: Retire the fork web-search-manager and tool-search packages

Status: implemented

English | [中文](2026-09-03-retire-fork-search-packages.zh.md)

## Problem

The fork carried two search packages upstream never had: `packages/web/web-search-manager` (a unified DeepSeek/Exa/Perplexity provider manager) and `packages/tool-search/tool-search` (a model-facing `tool_search` discovery tool). Both accumulated standing failures against repository gates — the manager's provider-registration tests fail because schemastery expands an absent provider section into its all-default object, so the single-Exa case reports `WEB_PROVIDER_AMBIGUOUS`; tool-search's index tests fail because `createSearchIndex()` returns `ready: false` while the tests expect `true`. The manager also structurally conflicts with recorded-session snapshots: the fork's base bundle disables the direct `web-search-deepseek` row in favour of manager registration, while the `web-search-endpoint-guidance` snapshot composition configures the direct provider row with `apiKey: snapshot-key`, so replay resolves `WEB_PROVIDER_CREDENTIAL_MISSING` instead of the recorded 401. Neither package is referenced by any shipped profile outside the fork's own bundle rows, and the manager's settings card (`WebSearchManagerCard`) was never mounted — only the direct `WebSearchCard` ships.

## Decision

The fork no longer carries either package. The removal deletes `packages/web/web-search-manager` and `packages/tool-search/tool-search` with their bundle rows, bundle dependency lines, `tsconfig.host.json` / `tsconfig.client.json` project references, and the unmounted manager settings card (`WebSearchManagerCard`, `ProviderCard`, `ToggleSwitch`, their controllers, styles, and locale keys), and regenerates `pnpm-lock.yaml`. The base bundle's `web-search-deepseek` row returns to the upstream shape (`apiKeyEnv: DEEPSEEK_API_KEY`), so `searchProvider: deepseek-official` resolves through the direct provider again.

## Alternatives considered

**Fix the packages instead of removing them.** Rejected for this change: the manager needs its `syncProviders` presence check reworked around schemastery's default-expansion semantics, tool-search needs its index-ready contract corrected, and the snapshot composition needs a manager-aware variant. That is three independent product fixes with no standing demand; the direct provider and upstream toolset already cover search.

**Keep the packages dormant.** Rejected: they hold bundle wiring, project references, and lockfile weight while breaking the snapshot replay and the settings-card surface they were built to serve.

## Consequences

- Web search resolves through the direct `web-search-deepseek` provider on the upstream configuration path; the `web-search-endpoint-guidance` snapshot replays against the recorded endpoint again.
- The fork's `verify-tool-catalog`, `verify-tsconfig-paths`, `verify-cordis-config`, and package-invariant failures attributed to these two packages clear; remaining fork debts (mermaid, settings-models) are unaffected.
- Reintroducing multi-provider management means a new package built against the current `ctx.web` selection semantics and a manager-aware snapshot composition, not a revival of the removed code.
