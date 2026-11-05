# Agent Note: Sync upstream 0.2.2-rc.1 into the fork

Status: implemented

English | [中文](2026-11-04-sync-upstream-0-2-2-rc-1.zh.md)

## Problem

Upstream released `0.2.2-rc.1` on 2026-11-04, one `0.2.2-alpha.3` release past the fork's `0.2.2-alpha.2` base. The fork trunk sat 1277 upstream commits behind that release, with a merge base of upstream's own `dsh-v0.2.2-alpha.2` release commit and 157 fork-only commits above it.

The window is large enough to rearrange the product surface. `agent-team` leaves `packages/experimental/` for a new `packages/team/` package group, and `fs/fs-patch` and `mcp/mcp-manager` appear beside it. Computer Use becomes an optional bundle whose macOS helpers carry a shared development signature and arrive notarized. Forge gains a unified review/worktree entry with a diff file tree and inline review comments. Schedule's standalone tasks fold into the WebUI and its tools move to an RRULE-and-target model (`schedule_create`, `schedule_list`, `schedule_view`, `schedule_edit`). `apply_patch` ships in `tool-fs` as an opt-in tool while the `fs-observation-policy` row ships disabled, so a write or an edit no longer requires a prior read. The SDK's `run()` accepts native commands, the web Search default moves from a model-billed Messages search to the DeepSeek Search API and the Exa and Perplexity packages are removed, Desktop gains switchable update channels with a staged rollout, and the session projection sends one frame per committed event.

Three of those changes reach the fork's own surface. The Web `cordis` preset id is spelled the same way in the shipped tool catalog, so the vendor-rescope gate reads it as a package reference. The `apply_patch` row is what the fork's own styling contract and its `fs-observation-policy` upgrade guide describe. And the `MarkdownLabels` contract the fork extended for its Mermaid rendering gained a required member, so every upstream site that builds one now owes that member.

The fork's `vendor/` was still the `0.2.1-rc.2` snapshot — cordis `4.0.6-alpha.1`, schemastery `3.18.6-alpha.1`, logger-console `1.0.6-alpha.1` — and upstream had moved the vendored set to cordis `4.1.0`, schemastery `3.19.0`, logger-console `1.1.0`.

A sync PR (#29) was open against the fork trunk, based on upstream `master` as of 2026-10-31 and already 926 commits behind the tip.

## Decision

The sync merges upstream `master` (the rc.1 release) into `sync/upstream-0.2.2-rc.1` off the fork trunk, and supersedes PR #29 rather than merging it. Six files conflicted, and each resolution was read against both sides rather than taken by rule:

- `.gitignore` keeps the fork's `.zcode/` entry beside upstream's generated CUA release record.
- `docs/web-styling.i18n.yaml` and `packages/client/ui-primitives/README.i18n.yaml` take upstream's recorded hashes and are re-recorded afterwards, because both sides changed the same sections.
- `packages/client/ui-primitives/tests/icons.client.spec.tsx` takes upstream's dynamic assertion over the fork's hard-coded glyph count. The fork adds two zoom glyphs, and upstream's assertion derives the expected names from the artwork table, so it already covers them.
- `packages/llm/llm-pi-ai/src/adapter.ts` keeps both sides: upstream's `requestHeaders` now takes the request options, the base URL, and the plugin-supplied `prepareHeaders` hook, and the fork's `opencodeSessionHeaders` still adds `x-opencode-session` to opencode routes. The fork's helper runs after upstream's builder, so a deployment-configured or plugin-prepared header of that name still wins.
- `scripts/rescope-vendor.ts` takes upstream's `listRescopeFiles` helper, which raises the spawn buffer and is shared with the other vendor scripts.

Four fork-side decisions follow the merge, each surfaced by a gate rather than by the merge itself:

- The pre-rename preset-id mapping in `packages/preset/agent-preset-registry` is dropped. The mapping answered a durable `code` id by resolving it to `ptc`; upstream's `session-format-v0-to-v1` migration already rewrites that vocabulary when it reads the record, and the fork has carried that migration since before this sync. The mapping was a stopgap whose stated precondition — "until the v0→v1 session-format migration rewrites the vocabulary" — is met, and upstream removed it on the same reasoning.
- The six recorded-session snapshots that still carried a range-compressed `sourceEventSeqs` follow upstream's expanded list. The projection code that produced the compressed form is upstream's, and upstream changed the encoding back; keeping the fork's recordings would pin the fork to a retired encoding.
- `scripts/tests/ci-release-selfhosted.spec.ts` follows upstream. The fork's version accepted a failover expression for the vendor-publish jobs, but that workflow is upstream's own and never took the expression, so the leniency covered nothing.
- `scripts/rescope-vendor.ts` takes two repairs. Upstream gave the vendored README stable `V*` ids, which left the script's `vendor/README.md` postcondition naming a retired list position, and five files that name the Web `cordis` preset id are absent from the skips: `docs/tool-catalog.md`, `docs/tool-catalog.zh.md`, the `fs-observation-policy-default-off` guide and its Chinese side, and `scripts/gen-tool-catalog.ts`. The postcondition token becomes the `V17` entry, and the five files join the `GENERIC_SKIPS` entries that already preserve the preset id.

Two smaller repairs follow the same shape. Upstream's new `packages/client/ui-chat/tests/context-menu.client.spec.tsx` builds a `MarkdownLabels` without the `mermaid` member the fork's contract requires, so the test now passes it. Three files the fork carried without a trailing newline get one, per the repository rule.

## Alternatives considered

**Merge PR #29 and sync again afterwards.** Rejected: its base, upstream `master` as of 2026-10-31, is already 926 commits behind the release, so merging it would mean two syncs of one release.

**Base the branch on upstream `master` instead of merging into the fork trunk.** Rejected: every prior fork sync merged upstream into the fork trunk, and the 157 fork-only commits carry the record of which adjustments each earlier sync needed.

**Keep the pre-rename preset-id mapping.** Rejected: the durable-record case it served is answered by the session-format migration the fork already ships, and upstream ships the same registry without it. Keeping it would make the fork resolve an id upstream deliberately stopped resolving.

**Keep the range-compressed recorded sessions.** Rejected: the producer of that encoding is gone from the tree, so the recordings would no longer describe any runnable behavior.

**Keep the fork's previous vendor tree.** Rejected: upstream's newer vendored set arrives with this sync, and the rescope gate is what keeps the fork's own `cordis` preset id intact inside it.

## Consequences

- The fork runs on `0.2.2-rc.1`; `SESSION_FORMAT_VERSION` stays 4.
- The fork's surviving unique work is the client-side Mermaid rendering with its zoomable viewport, the `llm-pi-ai` `x-opencode-session` header, the `ui-settings-models` chip-radius work with its `reicon-react` dependency, and the `plugins/**` exclusion that keeps standalone plugin checkouts out of the bilingual-pairing corpus.
- The pre-rename preset-id mapping leaves the fork. A deployment whose `settings.default` still names `code` loses the fork's fallback and needs that id updated.
- The Web `cordis` preset id keeps its spelling in the shipped tool catalog and in the `fs-observation-policy` upgrade guide; the rescope skips are what hold it there.
- The `0.2.0-rc.2` sync note named an upstream commit by hash, which upstream's tightened repository-reference rule rejects; it now names upstream PR #5517 instead. That note's open question — whether the fork keeps the runtime invariant system — was already answered when the fork took upstream's alpha.2 base, and this sync confirms it.
- The fork's GitHub Actions stopped starting workflows after 2026-10-08: every pull request opened since reports no check run at all. The substantive evidence for this sync is therefore the local gate matrix above, not a CI verdict.
- Verified on the merged tree: typecheck (5 gates), lint, `build:artifacts` (8 gates) and `build:check` (2 gates), `hygiene` (23 gates), `doc-sync` (43 gates), and `verify-translation-pairing` across the whole corpus.
