# Agent Note: Sync upstream 0.2.3-alpha.2 into the fork

Status: implemented

English | [中文](2026-11-18-sync-upstream-0-2-3-alpha-2.zh.md)

## Problem

Upstream's `dsh-v0.2.3-alpha.2` release (2026-11-22) was the current `upstream/master` tip. The fork trunk stood on upstream's `0.2.2-rc.1` release merge, 3124 upstream commits behind, with 160 fork-only commits above it. The window covers 8655 files, +408,806 / −122,486 lines, and six release tags from `0.2.2-rc.2` through `0.2.3-alpha.2`. `SESSION_FORMAT_VERSION` stays 4, `SQLITE_SESSION_FORMAT_VERSION` matches it, and no bundle package is added, so the session format and bundle contracts carry over.

The window rearranges the product surface. The shipped JSONL persistence backend starts writing checksummed Zstandard frames by default while still decoding earlier generations, and an opt-in SQLite provider imports legacy JSONL on first open. The Python PTC runtime, `working_directory`, and the `personalized-recommendations` bundle leave. Office, Computer Use on Windows and MCP, Forge GitLab, the Feishu, DingTalk, WeCom, Linear, Notion and Tencent connectors, the session panel and status, timeline, terminal panel and the desktop publisher arrive (37 packages added, 9 removed). `exit_worktree` replaces `working_directory`, `subagent` drops `cwd`, `engines.node` becomes `^24.22.3 || >=26.13.1`, and the vendored Cordis set moves from `4.1.0` to `4.2.0-alpha.1`.

The window reaches four pieces of fork work. Upstream rebuilt the Markdown fence pipeline around `FenceBlocks`, `MarkdownFenceSeat`, and the `renderCode` delegate, and the fork's Mermaid renderer is a branch inside the exact function upstream rewrote. The fork's `MarkdownLabels` contract gained a required `mermaid` member, so every upstream site that builds one owes it. Upstream shipped its own `RetryPolicyEditor` where the fork had a single `maxRetries` input. The remaining repairs came from gates rather than from the merge: two upstream e2e specs symlink the vendored library into a scaffolded `node_modules/@deepseek-ai`, where the vendor-rescope token rule read the bare directory segment as a package name.

## Decision

The sync merges upstream's release merge into `sync/upstream-0.2.3-alpha.2` off the fork trunk, and PR #31 lands it on the fork's `master` as a merge commit. Ten files conflicted, and each resolution was read against both sides rather than taken by rule:

- `docs/web-styling.i18n.yaml` and `packages/client/ui-primitives/README.i18n.yaml` take upstream's recorded hashes and are re-recorded afterwards, because both sides changed the same sections.
- `packages/client/ui-primitives/README.md` and its Chinese side merge both descriptions: the fork's Mermaid sentence and upstream's fence, diff and `renderCode` contract.
- `packages/client/ui-primitives/src/icons/artwork.ts` takes upstream's rewritten table and re-adds `zoom-in-outline` and `zoom-out-outline` after `refresh-outline`. Upstream's `icons.client.spec.tsx` derives expected names from that table, so the two glyphs are covered once they are back in it.
- `packages/client/ui-settings-models/package.json` keeps both sides: the fork's `reicon-react` and upstream's manifests.
- `packages/client/ui-settings-models/src/client/ProviderEditor.tsx` and its `locales.ts` take upstream's `RetryPolicyEditor`; the fork's `maxRetries` input and its `retryMaxRetriesPlaceholder` and `retryMaxRetriesInvalid` keys leave the eight locale records.
- `pnpm-lock.yaml` is regenerated with `pnpm install --no-frozen-lockfile`.
- `scripts/rescope-vendor.ts` takes upstream's `vendor/README.md` anchor and skip list; the fork's five `cordis` skip entries are already upstream's, and upstream's looser anchor survives a `V*` renumber.

Four repairs follow, each surfaced by a compiler or a gate rather than by the merge itself:

- `packages/client/ui-primitives/src/markdown/render.tsx` merges without a marker and stops compiling: upstream replaced `CodeBlock` with `FenceCodeBlock`, so `MermaidBlock` renders its fallback through `FenceCodeBlock` and takes the whole `MarkdownCodeLabels` instead of two copy strings.
- Four `MarkdownLabels` builders upstream added lack the fork's `mermaid` member — the Forge `ReviewThreads` panel, the Forge review detail page, the timeline `Markdown` body, and the document-preview `SummaryPreview`. All four supply the zoom labels, and the Forge and timeline locale records carry the three `mermaid.*` keys in all eight languages.
- `packages/client/ui-settings-models/tests/provider-form.client.spec.tsx` takes upstream's expectations and keeps the fork's fixture line that gives a model both a text and an image input.
- `scripts/rescope-vendor.ts` lists both e2e specs in `GENERIC_SKIPS`, and `scripts/rescope-vendor.spec.ts` asserts the two files suffer zero rewrites. Both changes ride in the merge commit, because the merged tree does not pass its own gates without them.

Fifteen directories under `packages/` held `lib/` and `node_modules/` residue for packages the window deleted or moved, so `pnpm run constraints` read them as package directories without a manifest. They were removed from the working tree and were never tracked.

### The Mermaid branch

Upstream's `render.tsx` sends every fence that has a language through `MarkdownFenceSeat`, which reads `useMarkdownDelegate().renderCode`, supplied by `ChatView` through the keyed hoc slot `conversation.chat.markdown.fence`. The fork's Mermaid branch sits one branch above that seat, so it keeps rendering in every Markdown context rather than the chat flow alone, and it keeps the DOM the web golden records. The sync keeps the branch there and repairs only its fallback chrome.

### Fork work upstream supersedes

The fork's provider retry editor came from a fork commit of 2026-08-22 that upstream never took. Upstream's `RetryPolicyEditor` builds its fields from the provider's own `retryPolicy` schema, offers a mode, and picks retryable error codes from a labelled list, so the fork's single-value input retires with this sync.

The fork's surviving unique work is the Mermaid renderer with its zoomable viewport, the `llm-pi-ai` `x-opencode-session` header, the `reicon-react` dependency, the `plugins/**` bilingual-pairing exclusion, and the `ModelsSection` chip-radius exception.

### Verification

The merged tree is verified by the local gate matrix under Node `v26.13.1`, because the fork's GitHub Actions stopped starting workflows after 2026-10-08.

- `pnpm install --frozen-lockfile` (422 workspace projects), `pnpm run build` (10 gates), `pnpm run typecheck` (5 gates), `pnpm run build:check` (2 gates).
- `pnpm run lint` (0 warnings and 0 errors across 7697 files), `pnpm run hygiene` (27 gates), `pnpm run doc-sync` (43 gates), `pnpm run verify-translation-pairing` (1422 pairs).
- `pnpm run rescope-vendor:check` reports no residue, and `pnpm run test:snapshot` replays 4 files with 313 passing tests and 2 skips, including the retained V3 input case.
- Focused suites over the six packages this sync touches: 317 files and 6193 tests pass.
- `pnpm run duplication` fails on three clones between `katex.tsx` and `mermaid.tsx`; both files are unchanged by this sync, and the failure pre-dates it on the fork trunk.

## Alternatives considered

**Keep the fork's retry-policy editor beside upstream's.** Rejected: the two would write the same schema field from two editors, and upstream's already covers the mode, the error codes, and the backoff fields the fork's input never offered.

**Move the Mermaid renderer to the `conversation.chat.markdown.fence` slot.** Rejected: it puts the diagram behind a plugin-shaped registration, narrows where it renders, and moves the web golden, all for no gain in this sync.

**Let the plugin own the renderer entirely and drop the fork's fence branch.** Rejected: the plugin's own renderer draws the diagram without the fork's zoom viewport, and the transcript zoom controls are what the fork's web golden records.

**Target `0.2.2-rc.5` instead of `0.2.3-alpha.2`.** Rejected: rc.5 stops at the 0.2.2 maintenance line and omits the 0.2.3 work, so the same window returns in the next sync and the fork carries two release lines of divergence for a narrower change.

**Keep the fork's stricter `vendor/README.md` anchor.** Rejected: upstream's looser anchor survives a `V*` renumber, which the previous sync already had to repair once.

## Consequences

- The fork runs `0.2.3-alpha.2`; `SESSION_FORMAT_VERSION` stays 4, the window adds 83 upgrade guides (201 in the tree) and 7 persistence-change records, and the package count moves from 374 to 402.
- A pre-merge fork Session opens through the new JSONL reader. The writer switched to checksummed Zstandard frames, so older generations decode through the retained readers; the snapshot suite's retained V3 input case is the local evidence.
- The fork's unique work keeps its behavior: the Mermaid fence branch renders the same diagrams with the same zoom viewport, the `x-opencode-session` header still wins on opencode routes, and the `ModelsSection` chip radius stands.
- A deployment that set the fork's `maxRetries` input now edits the provider's `retryPolicy` through upstream's editor; the two fork locale keys that described the old input are gone.
- `plugins/dsh-mermaid` carries its own release work. Its version matrix ends at `0.2.2-rc.1`, so it owes `0.2.2-rc.2` through `0.2.3-alpha.2`, peer ranges that admit `0.2.3-alpha.2` and cordis `4.2.0-alpha.1`, an `UPSTREAM_RELEASE` pin at `dsh-v0.2.3-alpha.2`, and a README claim that matches.
- The evidence for this sync is local, not a CI verdict: the fork's Actions stopped starting workflows after 2026-10-08.
- `pnpm run duplication` stays red on the fork trunk for the `katex.tsx` and `mermaid.tsx` clones, which this sync neither introduces nor touches.
