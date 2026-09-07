# Agent Note: Sync upstream 0.1.3-alpha.1 into the fork

Status: implemented

English | [中文](2026-09-07-sync-upstream-0-1-3-alpha-1.zh.md)

## Problem

Upstream advanced 292 commits past the fork's alpha.5 base (`49a606bc5b` to `d347e70390`): session format v2 with its migration chain and embedded assistant streams, generic file upload, proxy convergence to a util library, skill fuzzy search, clickable-link unification, a session write-ownership lease, and test tmp hygiene. The fork's 60 unique commits (mermaid tool plus client rendering, settings-models editors, preset-rename compatibility, the Node 24.11 `resolveSync` fix) had to survive the merge without breaking the tightened gates.

## Decision

The sync branch takes upstream wholesale and resolves the 113 merge conflicts by rule: 107 v2 snapshot fixtures take the upstream generation, three delete/modify snapshots accept the upstream deletions, and `pnpm-lock.yaml` regenerates for the fork-only dependencies. The two genuine code collisions are fused rather than chosen: `render.tsx` keeps the fork mermaid import beside the upstream `LinkIcon` work, and the preset spec unions both sides' `node:fs/promises` imports. Post-merge gate fixes adapt the fork code to the new contracts: the mermaid e2e seeds `stream: []` on its assistant message, the tool drops `String()` casts the lint now rejects, the inventory CSS goes hairline, and the catalog and inventory specs cover the fork's `mermaid_render` tool and `toggle` remote.

## Alternatives considered

**Re-record the v2 snapshots against fork compositions.** Rejected: the v2 generation is an upstream format change, not a fork behavior change; re-recording would fork every fixture for no behavioral difference.

**Keep the deleted old-format snapshots.** Rejected: upstream removed them as part of the format rollout, and the harness owns no reader for the retired layout.

## Consequences

- The fork runs on session format v2; any future snapshot work targets the v2 fixtures.
- The mermaid tool and rendering, the settings-models editors, and the preset-rename compatibility remain fork-only and now satisfy the 0.1.3-alpha.1 gates.
- The spill boundary test remains timing-sensitive upstream and fails intermittently under load; it is unrelated to this sync.
