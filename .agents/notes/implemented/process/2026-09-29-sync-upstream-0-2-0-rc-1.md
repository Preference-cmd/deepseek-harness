# Agent Note: Sync upstream master (0.2.0-rc.1) into the fork

Status: implemented

English | [中文](2026-09-29-sync-upstream-0-2-0-rc-1.zh.md)

## Problem

Upstream advanced 261 commits past the fork's 0.1.7-rc.2 base and released `0.2.0-rc.1`. The version crosses the minor boundary, so this is the fork's first sync onto a `0.2` tree. The window lands the OpenTelemetry subsystem (a shared `dsh-otel` Cordis service splitting ordinary product events from byte-bounded Session-log channels, its `host-product-telemetry-otel` and `session-telemetry-otel` providers, a `client/product-analytics` collector, and a new `docs/subsystems/otel` page), the Schedule switch as an optional bundle, the running-status whale tail and its restored status line in the chat transcript, plugin-manager installation and registry interaction work, account-token routing for DeepSeek web search, and a fix that settles pending tool results before a failed agent step closes.

Two window changes reach the fork's own surface. The persistence type inventory is compacted (#5191), which rewrites `docs/persistence-schema.json` from 97,057 to 25,277 lines while keeping the same 62 roots — the apparent 75,173-line deletion in the window diff is that rewrite, not lost content, and the fork has never modified the file. And the window's plugin-manager and chat work lands in `packages/client/ui-primitives`, whose README component catalog the fork's zoomable Mermaid viewport also edits.

## Decision

The merge incorporates upstream `0.2.0-rc.1` into `sync/upstream-0.2.0-rc.1` as a two-parent merge commit whose parents are the fork trunk and the upstream release. Two files conflicted. A dry run with `git merge-tree` before touching the tree established that count, which is far below the eighteen paths the two sides' independent diffs share: the shared paths auto-merge, and the estimate from diff overlap alone is not a conflict count.

- `packages/client/ui-settings-models/package.json` takes the union of both dependency additions — upstream's `@deepseek-ai/dsh-client-product-analytics` and the fork's `reicon-react`. Each side appended one entry to the same list.
- `packages/client/ui-primitives/README.i18n.yaml` is re-recorded rather than resolved to a side. Both sides changed the same `component-catalog` section, so the merged text matches neither recorded hash; `verify-translation-pairing --write packages/client/ui-primitives/README.md` recomputes both languages, and the corpus check then reports all 1173 pairs consistent.

Two fork-side repairs, each surfaced by a gate rather than by the merge:

- `packages/mermaid/tool-mermaid/package.json` moves to `0.2.0-rc.1`. The family-version rule requires it, no upstream commit bumps a package it does not have, and crossing the minor boundary makes this a minor bump rather than another release-candidate increment.
- `packages/client/ui-theme/tests/expected/radius-exceptions.expected.json` gains the `ModelsSection` chip entry. The off-scale-radius gate compares every client stylesheet against an exact expectation list, `ModelsSection.module.css` sets a 6px radius on the toggle chips to outrank the primitive's own value, and the exception was never recorded — so `radius-styles` has failed on the fork's master since that stylesheet landed, before this window. 6px matches no `--dsw-radius-*` token (the scale is 4, 8, 12, 16, 20, 28), so the exception list is where the value belongs rather than a token substitution that would change rendered size.

## Alternatives considered

**Edit the paired record by hand, taking upstream's hashes.** Rejected: the merged section differs from both sides' text, so either hash would be wrong and the pairing gate would report a pair it cannot vouch for. The record is derived, and re-recording is the operation the verifier names.

**Fix the radius by moving the chip to a shared token.** Rejected for this window: it edits a stylesheet upstream owns, changes the rendered chip size from 6px to 4px or 8px, and would require re-recording snapshots for a change this sync did not make. The exception list is the mechanism the test provides for exactly this case.

**Re-record the changed recorded-session scenarios.** Not needed and not attempted: the only tool-description change in this window reaches the fork through `mermaid_render`, which upstream does not have, and the fork's entry survives in every merged sidecar. Recording would need an API key and would rewrite cross-platform baselines for no delta.

## Consequences

- The fork runs on `0.2.0-rc.1`; `SESSION_FORMAT_VERSION` stays 4. The window's persistence change is representational, and `verify-persistence-changes` reports all 62 roots against 7 history records, so the fork adds no acknowledgement of its own.
- The fork's surviving unique work is unchanged: the `tool-mermaid` package with its Web rendering and the zoomable viewport that followed it, the `ui-settings-models` `maxRetries` control and per-model reasoning levels, the `llm-pi-ai` `x-opencode-session` header, the pre-rename preset-id mapping in `agent-preset-registry`, and the `reicon-react` browser devDependency.
- Upstream pins Koffi to a validated native release in this window. The `Pack npm tarballs` job resolves dependencies from the registry rather than the lockfile, so a Koffi source build that fails under a Node version with no matching prebuilt binary turns that job red independently of any branch; `koffi@3.3.2` published after the fork's last green packaging run is the live instance.
- Verified on the merged tree: typecheck, lint, build, `hygiene` (18 gates), `doc-sync` (42 gates), `verify-persistence-changes`, `test:expected` (108 tests), and `test:snapshot` (175 passed, 2 skipped). The `radius-styles` unit spec passes after the exception above.
- `snapshots/acp` `escalation-approved` and `snapshots/session/fs-delete-recreate` fail on this host: both recordings capture a shell `rm`, and the local runtime routes `rm` to recoverable deletion, adding a `mavis-trash: moved to trash:` line to the recorded stdout. Re-recording would bake a host-specific line into a cross-platform baseline.
- `pnpm run test` reports two further failures, `hooks-claude-code` `coverage-stop` and `ptc-runtime-python` `runtime`, both 5s timeouts that pass when the file runs alone; the full suite on this machine is slower than the budget those two allow.
- `scripts/smoke-python-runtime.py` was not run locally: `--installed-wheel` requires a built wheel and a clean virtual environment, which only the CI job provides. It is the one gate in this window's checklist that local evidence does not cover.
