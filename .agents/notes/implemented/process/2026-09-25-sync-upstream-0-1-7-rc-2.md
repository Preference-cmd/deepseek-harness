# Agent Note: Sync upstream master (0.1.7-rc.2) into the fork

Status: implemented

English | [中文](2026-09-25-sync-upstream-0-1-7-rc-2.zh.md)

## Problem

Upstream advanced 346 commits past the fork's 0.1.7-rc.1 base and shipped `0.1.7-rc.2`. The window absorbs several long-running branches — desktop onboarding, the shortcuts rework, the account provider lifecycle, and Schedule storage with automation phase 1 — trims constraint prose from every tool description (#5109), starts emitting dynamic tool-update messages whose recordings enumerate the full tool catalog (#4844), disables the shipped Schedule and time-context plugins in the default Web composition (#5175), and merges and then reverts the timed-questions UX reconciliation (#4868, #5174).

Three of those changes land on fork work. The trimmed tool descriptions rewrite every recorded sidecar that carries the fork's `mermaid_render` entry, the same sidecars the previous window taught the fork to patch. The bilingual pairing records change format (#5036, keyed by heading section): upstream migrated its own records, so the twenty-one `.i18n.yaml` records the fork owns are the ones left in a schema the checker now reports as malformed. And the window's new recordings project the full tool catalog into `request/header` events and SDK notifications, giving the fork's entry roughly two dozen insertion points beyond the five sidecars.

## Decision

The merge incorporates upstream `0.1.7-rc.2` into `sync/upstream-0.1.7-rc.2` as a two-parent merge commit whose parents are the fork trunk and the upstream release. Ten files conflicted: five generated catalog artifacts and five recorded sidecars. Generated catalogs were resolved by running their generators, recorded sidecars by taking upstream's bytes and re-applying the fork's `mermaid_render` entry at its name-sorted position; neither by hand-editing recorded bytes.

- The five sidecars from last window (`office-skills`, `multimodal-spill-ends`, `pwsh-tool-turn`, `persistent-pwsh-tool-turn` tool schemas; `ptc-python-turn` system prompt) take upstream's trimmed descriptions, and the `mermaid_render` entry returns at its sorted position. This time the re-application preserves literal UTF-8 em-dashes: the rc.1 sync's insertion script had rewritten those four JSON sidecars with `\u2014` escapes, an artifact the fork's own convention — `text-turn` and the other sidecars record literal em-dashes — never carried.
- The seven generators reproduce the catalogs: `gen-config-catalog` re-adds the fork's `tool-mermaid` row, the others match the merged bytes exactly, and `docs/tool-catalog.i18n.yaml` needs a `verify-translation-pairing --write` re-record once the generators settle.
- The window's full-catalog projections take the same insertion, surfaced by the gates rather than by conflicts: `subagent-inheritance`'s parent expectation (tools list and tool-addition events), the `dynamic-tool-updates`, `dynamic-tool-prompt-updates`, and `plugin-manager-mcp` session logs, the SDK `dynamic-tool-updates` session and notifications logs, and the `dynamic-tool-updates` tool-schema sidecar (initial plus both change snapshots).

Three fork-side repairs, each surfaced by a gate or by the standing rules:

- `packages/mermaid/tool-mermaid/package.json`: the version moves to `0.1.7-rc.2`. The family-version rule (`verify-npm-install-layout`, `release:verify --family dsh`) applies unchanged, and no upstream commit bumps a package it does not have.
- The twenty-one fork-only `.i18n.yaml` pairing records — the three mermaid READMEs and eighteen agent notes — move to the section-keyed format via `verify-translation-pairing --write`. No pair's content changes; only the record schema and its hashes are re-recorded.
- `scripts/rescope-vendor.ts` needs no change: `rescope-vendor:check` passes over the merged tree without new skip-list entries.

## Alternatives considered

**Re-record the changed scenarios instead of inserting entries.** Rejected: recording needs an API key, and the inserted entries replicate exactly what the live fork run emits — the Received side of each gate failure — which is what the passing scenarios already compare against.

**Keep the `\u2014` escapes the four sidecars carry from rc.1.** Rejected: they were an artifact of last window's insertion script, not the fork's convention; taking upstream's bytes and inserting the ASCII-only entry puts those files on the literal em-dash every other sidecar records.

**Leave the fork-only pairing records in the previous format.** Rejected: the checker reports the old schema as malformed, and a record it cannot parse confirms nothing; migrating is a format change with no content delta to review.

## Consequences

- The fork runs on `0.1.7-rc.2`; `SESSION_FORMAT_VERSION` stays 4.
- The fork's surviving unique work is unchanged: the `tool-mermaid` package with its Web rendering, the `ui-settings-models` `maxRetries` control and per-model reasoning levels, the `llm-pi-ai` `x-opencode-session` header, the pre-rename preset-id mapping in `agent-preset-registry`, and the `reicon-react` browser devDependency.
- The trimmed tool descriptions (#5109) and the disabled shipped Schedule/time-context plugins (#5175) are inherited by every fork composition and recording; the reverted reconciliation (#5174) puts timed questions back on their pre-reconciliation settlement behavior.
- Verified on the merged tree: typecheck, lint, build, `hygiene` (18 gates), `doc-sync` (42 gates), `test:expected` (108 tests), and `test:snapshot` in the `DSH_EXAMPLE_MODE=lib` lane (182 passed, 2 skipped — the same two pwsh scenarios this host skips; no `pwsh` is installed here).
- The two rc.1-era host-only failures (`snapshots/acp` `escalation-approved`, `snapshots/session/fs-delete-recreate`) pass on this tree.
