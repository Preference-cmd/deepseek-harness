# Agent Note: Sync upstream master (0.1.7-alpha.1) into the fork

Status: implemented

English | [中文](2026-09-22-sync-upstream-0-1-7-alpha-1.zh.md)

## Problem

Upstream advanced 1299 commits past the fork's 0.1.6-alpha.2 base and shipped `0.1.7-alpha.1`. The window raises the Session writer to V4, retires four packages, adds twenty, and rewrites the Desktop, account, voice-input, jobs, and shell surfaces.

Three changes land on fork-only work. `packages/preset/agent-presets` — the home of the fork's pre-rename preset-id mapping — was split into `preset/agent-preset` (the YAML-declared composition component) and `preset/agent-preset-registry` (the registry service), so the mapping had no package left to sit in. The `ui-settings-models` card was rewritten across the same files that carry the fork's per-model reasoning levels and `maxRetries` control. `packages/client/ui-primitives/src/markdown/render.tsx`, where the fork mounts its Mermaid renderer, renamed the `LinkIcon` export to `LinkIconMedium`.

The Python SDK single-exe fixtures also gained a V4 generation, and `scripts/smoke-python-runtime.py` selects the highest generation per session role, so the fork's tool now has to appear in the V4 recordings rather than only the V3 ones the previous sync patched.

## Decision

The merge incorporates upstream `0.1.7-alpha.1` into `sync/upstream-0.1.7-alpha.1` as a two-parent merge commit whose parents are the fork trunk and the upstream release. Sixteen files conflicted. Generated catalogs were resolved by running their generators, recorded fixtures by taking the upstream recording and re-applying the fork delta, and neither by hand-editing recorded bytes.

- `packages/preset/agent-presets` (modified by the fork, deleted upstream): the package is deleted. Its `RENAMED_PRESET_IDS` mapping moves into `packages/preset/agent-preset-registry/src/index.ts`, where a private `currentId()` resolves a requested id against the definition map and falls back to the mapping only when no definition supplies the requested id. Both `resolve()` and `retain()` call it. `retain()` is the activation path behind `mount()` and `select()`, so a session header recorded under the pre-rename id starts as well as resolves, which is the failure the shim exists to prevent.
- `packages/client/ui-settings-models`: upstream's icon names (`IconChevronDownOutlineRegular`, `IconChevronRightOutlineRegular`, `IconTrashOutlineRegular`) and its `customNeedsBaseUrl` copy replace the fork's, while the fork's three `retryMaxRetries` keys and upstream's three `protocol*` labels both survive in both languages. The `ProviderEditor` header comment keeps upstream's `cordis.patch.yml` naming and the fork's statement that the per-model capability lives in the model rows that card edits.
- `packages/client/ui-primitives/src/markdown/render.tsx`: the fork's `useMermaidDiagram` import and upstream's `LinkIconMedium` import both survive, matching the `LinkIconMedium` call sites the merge took from upstream.
- `packages/core/tools/tests/gen-tool-catalog.spec.ts`: upstream's `load_workspace_dependencies` and the fork's `mermaid_render` merge into one alphabetical expectation.
- `packages/session/session-persistence-jsonl/package.json`: upstream's `@deepseek-ai/dsh-session-format-v3-to-v4` dependency replaces `dsh-session-format-v2-to-v3`, and the fork's duplicated `@deepseek-ai/dsh-llm` key is dropped.
- `packages/host/plugin-inventory/tests/inventory.spec.ts`: upstream's file wins. The fork's only change was rewording one test title, and upstream's title states the property the assertion checks.
- `snapshots/session/ptc-python-turn/system-prompt.expected.md`: upstream's `list_agents` docstring plus the fork's `mermaid_render` method in sorted position.
- `docs/config-catalog.md`, `docs/module-graph.*`: regenerated with `scripts/gen-config-catalog.ts` and `scripts/gen-module-graph.ts`, which restore the fork's `tool-mermaid` rows and re-record the bilingual pairings.
- `scripts/snapshots/python-sdk-single-exe/{advanced,restart}/session*.v4.jsonl`: `mermaid_render` inserted between `job_output` and `run_code` in every recorded tool list, matching the sorted insertion the V3 recordings already carry.

## Alternatives considered

**Keep `agent-presets` beside the packages that replaced it.** Rejected: upstream split one vocabulary into a component and a registry, and a second registry would leave two definitions of what a preset id means.

**Port only `resolve()`, mirroring the old patch literally.** Rejected: upstream moved activation to `retain()`, which `mount()` and `select()` call directly, so a `resolve()`-only mapping would leave sessions recorded under `code` failing to start — the failure the mapping exists to prevent.

**Patch only the V3 single-exe recordings, as the previous sync did.** Rejected: the smoke script selects the highest generation per role, so the V4 recordings are now the compared set and V3 is history.

**Hand-merge the generated catalogs and pairing records.** Rejected: the generators own that content, and they re-record the pairing hashes as they write.

## Consequences

- The fork runs on `0.1.7-alpha.1` with `SESSION_FORMAT_VERSION` 4. The window adds `docs/persistence-changes/2026-09-16-session-format-v4.*`, the finalized V4 checkpoint, and `packages/session/session-format-v3-to-v4`; V3 moves to the historical formats.
- The fork's surviving unique work is the `tool-mermaid` package with its web rendering, the settings-models `maxRetries` control and per-model reasoning levels, the `llm-pi-ai` `x-opencode-session` header, and the pre-rename preset-id mapping, now in `agent-preset-registry`.
- `packages/client/ui-settings-unarchive-sessions`, `packages/experimental/agent-team-web-profile`, `packages/settings/settings-file`, and `packages/preset/agent-presets` are gone; the fork carries upstream's successors, including `preset/agent-preset`, `preset/agent-preset-registry`, `session/session-format-v3-to-v4`, and `skill/tool-workspace-dependencies`.
- Upstream's new `AGENTS.md` rules apply to fork work: no new assertions to `unknown`, and the unified `dev:web` / `dev:desktop` and `make web|desktop|build` launch commands.
