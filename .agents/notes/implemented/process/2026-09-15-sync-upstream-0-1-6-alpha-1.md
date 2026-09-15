# Agent Note: Sync upstream master (0.1.6-alpha.1) into the fork

Status: implemented

English | [中文](2026-09-15-sync-upstream-0-1-6-alpha-1.zh.md)

## Problem

Upstream advanced 666 commits past the fork's 0.1.5-rc.2 base (0.1.5-rc.2 to 0.1.6-alpha.1): the 0.1.6-alpha.1 release, typert schema materialization on first use, runtime bootfast and lazy native dependency resolution, Electron asar runtime resolution, experimental MCP resources and Stagehand browser tools, compaction image offload, and turning tool-ralph off by default in base cordis.patch.yml. The fork's surviving unique work (the `tool-mermaid` package with web rendering and e2e, settings-models editors for maxRetries and modalities, preset-rename fallback, plugin-inventory toggle, and llm-pi-ai opencode session headers) had to survive the merge without breaking repository gates.

## Decision

The merge incorporates upstream 0.1.6-alpha.1 into `sync/upstream-0.1.6-alpha.1` as a two-parent merge commit. Conflicts were resolved by fusion:
- `packages/client/ui-settings-models/src/client/locales.ts` retains both upstream DeepSeek URL hints and fork-specific `retryMaxRetries` and model modality settings in English and Chinese dictionaries.
- `packages/core/tools/tests/gen-tool-catalog.spec.ts` merges upstream MCP and Stagehand tools with the fork's `mermaid_render` tool in alphabetical order.
- `packages/mermaid/tool-mermaid/package.json` advances from 0.1.5-rc.2 to 0.1.6-alpha.1 to maintain workspace version coherence.
- `docs/tool-catalog.md`, `docs/module-graph.md`, and their Chinese pairs incorporate upstream MCP/Stagehand tools alongside `mermaid_render`, re-recorded with verified translation pairing.
- Session and SDK snapshot expectations are aligned: `mermaid_render` remains in the advertised tool list, while `ralph` is dropped following upstream's `cordis.patch.yml` default.
- Accidental editor tracking residue (`.zcode`) was purged from git tracking and ignored in `.gitignore`.

## Alternatives considered

**Squash the sync into a single-parent commit.** Rejected: squash merges destroy merge-base ancestry and cause hundreds of phantom conflicts on subsequent syncs.

**Keep tool-ralph enabled in fork default tools.** Rejected: upstream disabled it by default because completion is unverified worker self-report, and an overlay row can re-enable it when explicitly needed.

## Consequences

- The fork runs on 0.1.6-alpha.1 with all upstream improvements (fast boot, typert schema deferral, asar resolution, MCP resources, Stagehand tools, image offload).
- The mermaid tool, web rendering, e2e, settings-models editor, preset fallback, opencode session headers, and plugin-inventory toggle remain intact and pass repository gates.
