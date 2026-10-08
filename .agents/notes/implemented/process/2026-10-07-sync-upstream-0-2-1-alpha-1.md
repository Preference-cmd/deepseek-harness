# Agent Note: Sync upstream 0.2.1-alpha.1 into the fork

Status: implemented

English | [中文](2026-10-07-sync-upstream-0-2-1-alpha-1.zh.md)

## Problem

Upstream released `0.2.1-alpha.1`, 266 commits past the fork's `0.2.0-rc.2` base, and the release tag is upstream `master`'s head. The window lands the `session-inspector` and Chrome DevTools embedding, a Claude Code mods bridge with a Web band, Schedule's reminder tools moving from a retired bundle into a preset-owned `@deepseek-ai/dsh-tool-schedule`, streamed tool arguments bounded and displayed while a call is preparing, Session list work time-sliced in the API, isolated npm release channels, and a batch of Web and plugin fixes.

Four changes are externally perceptible and carry an upgrade guide. `@deepseek-ai/dsh-invariants`, every `<package>/invariant` subpath, and the `runtime-diagnostics/invariants` package are removed; the `sdk-minimal` profile loses the five rows that mounted them. The Automation tasks bundle is retired and the Web composition mounts `schedule` and `ui-schedule` itself. A subpath plugin reads its display text from `<subpath>/locale/*.json` and its image from `<subpath>/icon` rather than from `<subpath>/package.json`. `SignInErrorCode` gains `no-response` for a fetch that fails before returning a Response.

The invariant removal is the question the previous sync deferred: that commit landed after `dsh-v0.2.0-rc.2`, so the fork kept the system and recorded the decision as open work. It is inside this release, so the fork adopts it.

## Decision

The merge incorporates upstream `0.2.1-alpha.1` into `sync/upstream-0.2.1-alpha.1` as a two-parent merge commit whose parents are the fork trunk and the upstream release. A `git merge-tree --write-tree --name-only` dry run, with its output written to a file rather than piped, predicted eight conflicts.

- `packages/client/ui-sidebar-documentpreview/src/client/markdown/MarkdownBody.tsx` is the only conflicting code. The two sides changed disjoint parts of one `useMemo`: the fork adds the `mermaid` label entry, upstream adds the `splitFrontmatter` memo and its two lines of derived text. Both are kept.
- `docs/config-catalog.md`, `docs/config-catalog.zh.md`, `docs/module-graph.md`, and `docs/module-graph.zh.md` take upstream's text and are regenerated. `gen-config-catalog` and `gen-module-graph` each write both language sides from the workspace, which restores the fork's `tool-mermaid` rows that upstream has never carried.
- `docs/tool-catalog.i18n.yaml`, `docs/web-styling.i18n.yaml`, and `packages/client/ui-primitives/README.i18n.yaml` take upstream's records and are re-recorded after their merged content is confirmed, because both sides changed the same sections and the merged text matches neither recorded hash.

Three fork-side repairs, each surfaced by a gate rather than by the merge:

- `packages/mermaid/tool-mermaid/package.json` moves to `0.2.1-alpha.1`. The family-version rule requires it, and no upstream commit bumps a package it does not have.
- `scripts/rescope-vendor.ts` gains thirteen `GENERIC_SKIPS` entries for the name `cordis`. Schedule's move into the presets put the `cordis` agent-preset id, the `cordis_inspect_*` tool ids, and the `cordis.patch.yml` filename into the Schedule subsystem and user docs, the retired bundle's upgrade guide, the Web bundle patch, the plugin-creation roster, and their tests. Every occurrence is product data, the same category as the entries the previous sync added. The `rescope-vendor` gate is the only one that reports them.
- `scripts/snapshots/python-sdk-single-exe/**` and the recorded-session sidecars keep their `mermaid_render` entries. Upstream did not touch either tree this window, so nothing had to be restored; the audit confirmed all seventeen single-file-runtime recordings and all sixty-seven recorded-session sidecars that carried the entry on the fork trunk still carry it, in the same position between `job_output` and `run_code`.

## Alternatives considered

**Merge `upstream/master` instead of the tag.** Not a distinction this window: the release tag is upstream `master`'s head, so both name the same commit. The fork still syncs to a tag, because every prior fork sync names an upstream release in its merge subject and its `dsh-fork-` tag.

**Keep the invariant system.** Not available: the removal is inside the tag being synced, so keeping it would make the fork diverge from the release it claims to track. The merge deletes `packages/runtime-diagnostics/invariants`, the ~104 `src/invariant.ts` and test files across the workspace, and the `scripts/*invariant*` generators, with no conflict, because upstream deleted the same paths.

**Translate the restored Chinese catalog rows.** Not needed: both `gen-config-catalog` and `gen-module-graph` splice generated regions into their Chinese counterparts, so the rows come from the generator rather than from hand-written translation. Only explicit `dsh-translate-docs` invocation may produce new translation output.

**Re-record the recorded-session scenarios.** Not needed: upstream did not touch the recorded tree, and no tool list changed on either side of the merge. Recording would need an API key and would rewrite cross-platform baselines for no delta.

## Consequences

- The fork runs on `0.2.1-alpha.1`; `SESSION_FORMAT_VERSION` stays 4.
- The fork's surviving unique work is unchanged: the `tool-mermaid` package with its Web rendering and the zoomable viewport, the `ui-settings-models` `maxRetries` control and per-model reasoning levels, the `llm-pi-ai` `x-opencode-session` header, the pre-rename preset-id mapping in `agent-preset-registry`, and the `reicon-react` browser devDependency.
- `pnpm install` cannot complete on the host that made this sync, so most of the gate suite could not run locally. `@deepseek-ai/dsh-experimental-inspector` added `chrome-devtools-frontend`, which ships a `.gitmodules` file; the host's agent sandbox denies creating any `.git*` path, so materializing the package fails with `EPERM` and leaves `node_modules` partially linked, with workspace links present and external dependencies absent. Removing that one dependency lets resolution finish but the link phase then stalls indefinitely, so the tree cannot be repaired locally. Every gate that shells out to `pnpm run` fails on the resulting dependency check, and the type-aware oxlint rules report `error` typed values wherever a dependency is unlinked. All of these are environment failures, and the outcome is deferred to CI.
- Verified on the merged tree without a complete install: `rescope-vendor:check` reports no residue over 8816 tracked files and `verify-translation-pairing` reports all 884 pairs consistent. `oxlint` parsed the tree and reported zero non-type errors, including none in the one file this sync resolved by hand.
- `test:snapshot` and `test:expected` produced no trustworthy result on this host, for the sandbox reasons recorded in the previous sync note, and their outcome is deferred to CI.
- `scripts/smoke-python-runtime.py` owns the recorded tool lists and is the gate that reports a missing fork entry. It was not run locally, because `--installed-wheel` needs a built wheel and a clean virtual environment that only CI provides. The audit above is the local substitute, and it found no gap.