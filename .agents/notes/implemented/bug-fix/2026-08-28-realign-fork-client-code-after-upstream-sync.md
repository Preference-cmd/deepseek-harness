# Agent Note: Realign fork client code with the upstream client rewrite

Status: implemented

English | [中文](2026-08-28-realign-fork-client-code-after-upstream-sync.zh.md)

## Problem

The 2026-08-28 upstream sync (dsh-0.1.2-alpha.1) rewrote the web client, and the merge took upstream's versions of the shared files. Fork-authored client code was left speaking the pre-rewrite vocabulary: imports from the deleted `@deepseek-ai/dsh-client-runtime`, the `webSearchManager*` locale keys dropped from the merged plugins-settings locale bundle, `PluginEntryId` moved from `@deepseek-ai/dsh-api-remotes/client` to the host plugin-inventory package, and a seat-controller test written against the pre-rewrite controller and RPC envelopes. Twenty-six type errors made `pnpm run typecheck` — the pre-push gate — refuse every push.

## Decision

Fork client code realigns to the current vocabulary. `SettingsScope` imports from `@deepseek-ai/dsh-client-ui-settings/client` and `SnapshotStore` from `@deepseek-ai/dsh-client-store`; the `webSearchManager*` keys return to the plugins-settings locale bundle in both languages; `PluginEntryId` imports from `@deepseek-ai/dsh-host-plugin-inventory`. The fork-added seat test was removed rather than ported: it asserted the pre-rewrite controller's stage-survival semantics — a pick staying displayed across loads after the host accepted it — which upstream replaced with spend-once-then-summary-driven display, a lifecycle upstream's own suite already owns ("spends the stage exactly once", "applies the stage to the blank session the flow lands on").

## Alternatives considered

**Restore the stage-survival semantics in the seat controller.** Rejected: upstream restructured the chip display deliberately, and the fork test contradicted upstream's own coverage of the same controller.

**Adopt upstream's webSearch card and delete the fork's manager card.** Rejected for now: the fork card configures three providers (DeepSeek, Exa, Perplexity) where upstream's covers one, so the fork surface still carries capability. Consolidating the two cards is product work deferred until wanted; see [the ui-turn-nav retirement](../simplification/2026-08-28-retire-dormant-ui-turn-nav-stub.md) for the same post-sync supersession pattern taken to removal.

## Consequences

- `pnpm run typecheck` is green, so the pre-push gate runs.
- The plugin configuration tab renders both web-search cards: upstream's single-provider card and the fork's multi-provider manager card.
- A future consolidation of the two cards supersedes the key restoration this note records.
