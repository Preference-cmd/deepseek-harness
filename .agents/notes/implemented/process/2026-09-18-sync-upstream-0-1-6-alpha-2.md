# Agent Note: Sync upstream master (0.1.6-alpha.2) into the fork

Status: implemented

English | [中文](2026-09-18-sync-upstream-0-1-6-alpha-2.zh.md)

## Problem

Upstream advanced 882 commits past the fork's 0.1.6-alpha.1 base, and shipped `0.1.6-alpha.2`. The window is dominated by product surfaces rather than the core loop: the Desktop application grew from 100 to 291 files, plugin management became a first-class architecture seam, the dynamic Cordis toolset was cut back, and upstream replaced its profile module resolution.

Three of those changes land directly on fork-only work. `packages/boot/plugin-manager` plus `packages/client/ui-plugin-manager` now own plugin enablement, which is where an unfinished fork WIP had been reaching. The `ui-settings-models` card was rewritten around a shared `ModelRow`, which is where the fork's per-model reasoning declaration lives. The present tool moved out of the `fs` group into `packages/deliverables/tool-present`, which the fork's tool catalog and path map both named.

## Decision

The merge incorporates upstream `0.1.6-alpha.2` into `sync/upstream-0.1.6-alpha.2` as a two-parent merge commit whose parents are the fork trunk and the upstream release. Sixteen files conflicted; generated catalogs and recorded fixtures were resolved by taking the upstream recording and re-applying the fork delta, never by hand-editing recorded bytes.

- `packages/client/ui-settings-models`: upstream's `ModelRow` and `ModelInputTypes` are the base. The fork's reasoning-level declaration moves into `ModelRow` as an optional `reasoningLevels` control, passed only by the pi-ai catalog editor, so the DeepSeek editor's markup stays identical to upstream. The fork's static output-modalities display is dropped: it was a permanently disabled pill over a field the model draft does not carry, so it declared nothing and had no upstream counterpart to fuse with.
- `packages/core/tools/tests/gen-tool-catalog.spec.ts`: upstream's `plugin_manager` and the fork's `mermaid_render` merge into one alphabetical expectation.
- `tsconfig.base.json`: the fork's `@deepseek-ai/dsh-tool-mermaid` path and upstream's relocated `@deepseek-ai/dsh-tool-present` path both survive.
- `packages/client/ui-primitives/package.json`: keeps both the fork's `mermaid` dependency and upstream's `simple-icons`.
- `packages/experimental/webworker-packer/tests/image-loadable.spec.ts`: upstream's stricter `pluginPackages` assertion replaces the fork's permissive getter, because it pins the lookup name the resolver must perform.
- `docs/config-catalog.*`: upstream's `tool-cordis` requirement line (no `dynamicCordisRunner`) plus the fork's `mermaid` row, with the bilingual pairing re-recorded.
- `scripts/snapshots/python-sdk-single-exe/*`: upstream's refreshed recordings, with `mermaid_render` re-inserted in sorted position. These fixtures are compared by `scripts/smoke-python-runtime.py` in CI and cannot be regenerated locally, so the insertion is textual and preserves the recorded formatting.

Two fork-side cleanups ship with the sync:

- The orphaned plugin enable/disable WIP is removed. Its host `pluginInventory.toggle` Remote method, `.toggleButton` rules, and `enable`/`disable`/`toggling` locale keys had no consumer: the fork's client realignment dropped the settings-tab UI that called `toggle(entryId)` while leaving the host side behind, and the 2026-09-15 sync note's claim that the feature survived was inaccurate. Upstream's `pluginManager` service owns this capability now, so the leftovers were deleted instead of merged into the rewritten gateway.
- Request expectations that upstream refreshed are re-aligned with the fork tool catalog: five `tool-schemas.expected.json` files and the `minimal-preset` inline snapshot gain `mermaid_render`. The timestamp-only churn `test:snapshot:refresh` writes into `writer.expected.jsonl` is reverted, since those values are recording clocks rather than content.

## Alternatives considered

**Keep the fork's `pluginInventory.toggle` on top of upstream's rewritten gateway.** Rejected: nothing calls it, upstream's `pluginManager` covers the same operation with a service, a model tool, and a web UI, and preserving a second enablement path would leave two truths for one lifecycle.

**Re-apply the fork's output-modalities pill in the shared `ModelRow`.** Rejected: the pill was always `disabled` and always pressed, and the model draft has no output-modality field, so it displayed a constant instead of editing anything.

**Keep the fork's permissive `get: () => undefined` in the webworker-packer fixture.** Rejected: upstream's version asserts the resolver asks for `pluginPackages` by name, which is the behavior the fork's last sync commit added the getter for; the weaker form would pass even if the lookup stopped happening.

**Hand-merge the recorded python-sdk fixtures.** Rejected: they are compared by name and position against a live Python single-exe run, so the recording stays the authority and only the fork's tool name is re-inserted.

## Consequences

- The fork runs on 0.1.6-alpha.2. `SESSION_FORMAT_VERSION` stays 3 and the window carried no breaking commits, so no session-log migration is needed.
- The fork's surviving unique work is the `tool-mermaid` package with its web rendering, the settings-models maxRetries control and per-model reasoning levels, and the `llm-pi-ai` `x-opencode-session` header.
- `packages/deliverables/`, `packages/document/office-to-pdf`, `packages/skill/skill-office`, `packages/boot/hmr`, and `packages/client/ui-plugin-manager` are new to the fork; the dynamic Cordis toolset is gone and persistent plugin authoring goes through bundles and `plugin_manager`.
- Running the snapshot lane in its default source mode (`pnpm run test:snapshot` with `DSH_EXAMPLE_MODE` unset) fails with `Cannot read properties of undefined (reading 'prepare')`: tsx rewrites `@deepseek-ai/dsh-tools` to `src` inside the plugins that upstream's new resolution mode loads from `lib`, so the live `ToolRuntime` and the agent loop hold different `TOOL_RUNTIME_SCHEDULER` symbols. Upstream's own 0.1.6-alpha.2 tree fails identically, so this is not a merge defect; the gate lane sets `DSH_EXAMPLE_MODE=lib` (`scripts/run-gates.ts`) and passes. The fork inherits the behavior rather than introducing it, and fixing it belongs upstream.
- Verified on the merged tree: typecheck, build, `doc-sync` (41 gates), `test:snapshot` and `test:expected` in lib mode, lint, and the focused unit suites for the touched packages.
