# Agent Note: Sync upstream 0.2.0-rc.2 into the fork

Status: implemented

English | [中文](2026-10-03-sync-upstream-0-2-0-rc-2.zh.md)

## Problem

Upstream released `0.2.0-rc.2`, 187 commits past the fork's `0.2.0-rc.1` base. The window lands Desktop's bundled `dsh` command launch with installation guards and native-menu management, the composer model picker gaining fuzzy search over unified grouped ordering with sticky headers, the workspace opening from the sidebar file tree, timed waits and late replies for user questions, due Schedule reminders framed as scheduled user messages, and performance work that time-slices the Session list, bounds streamed tool argument processing, and cuts long-session rendering overhead.

Two window changes reach the fork's own surface. `ask_user_question` gains a `mode: timed` option, so the fork's tool-catalog rows for that package change on both sides of the bilingual pair. And the new `@deepseek-ai/dsh-tool-schedule` package contributes `schedule_create`, `schedule_delete`, `schedule_list`, and `schedule_update` as model-visible tools, which the fork's recorded-session and Python single-exe tool lists enumerate.

Upstream's `master` has since advanced 258 commits beyond the tag. This sync targets the release, matching every prior fork sync, so those commits are deliberately excluded. One of them, `f028f25667`, removes the runtime invariant plugins and the `packages/runtime-diagnostics/invariants` package, and deletes the matching `AGENTS.md` rule. Because it lands after the tag, the fork keeps the invariant system and that rule; the question resurfaces only when the fork next syncs past it.

## Decision

The merge incorporates upstream `0.2.0-rc.2` into `sync/upstream-0.2.0-rc.2` as a two-parent merge commit whose parents are the fork trunk and the upstream release. Four files conflicted, all of them generated or derived documentation. A `git merge-tree` dry run before touching the tree established that count, and the output must be written to a file rather than piped: piping into `head` closes the pipe early, `git merge-tree` takes SIGPIPE, and the truncated run overcounted the conflicts.

- `docs/tool-catalog.md`, `docs/tool-catalog.zh.md`, and `docs/tool-catalog.i18n.yaml` take upstream's text and are then regenerated. Both sides changed the `ask_user_question` row, so neither recorded text survives. `gen-tool-catalog` rewrites the English catalog from the workspace, which restores the fork's `mermaid_render` row that upstream has never carried. The Chinese catalog is a translation the generator does not write, so the fork's previously confirmed `mermaid_render` row and detail section are restored from the pre-merge text rather than newly translated.
- `packages/client/ui-primitives/README.i18n.yaml` is re-recorded rather than resolved to a side. Both sides changed the same `component-catalog` section, so the merged text matches neither recorded hash.

Three further fork-side repairs, each surfaced by a gate rather than by the merge:

- `packages/mermaid/tool-mermaid/package.json` moves to `0.2.0-rc.2`. The family-version rule requires it, and no upstream commit bumps a package it does not have.
- `scripts/rescope-vendor.ts` gains three `GENERIC_SKIPS` entries: `packages/extensions/cordis-host-runner/tests/inspect-registry.spec.ts` and the two `snapshots/session/cordis-inspect-*/client-fixture.mjs` fixtures. All three name the `cordis/inspect-*` event domain and the `cordisInspect` service, which are wire ids rather than package references, the same category as the existing `docs/event-producer-consumer.md` entries. The `rescope-vendor` gate is the only one that reports them.
- `docs/tool-catalog.i18n.yaml` is re-recorded a second time after the Chinese mermaid restoration, because the restored sections are unconfirmed translated content until they are.

## Alternatives considered

**Merge `upstream/master` instead of the tag.** Rejected: it would pull 258 unreleased commits, including the invariant removal, and the fork's release point would no longer correspond to an upstream release. Every prior fork sync names an upstream release in its merge subject and its `dsh-fork-` tag.

**Delete the invariant system now, following upstream `master`.** Rejected for this window: the removal is not in the tag being synced, so adopting it would make the fork diverge from the release it claims to track. The fork's `packages/runtime-diagnostics/invariants` and its 38 `./invariant` exports stay.

**Hand-write the Chinese `mermaid_render` translation.** Rejected: the fork already carried a confirmed translation of exactly this row, and the pre-merge text is that translation. Only explicit `dsh-translate-docs` invocation may produce new translation output.

**Re-record the recorded-session scenarios.** Not needed: the only tool-list change reaching the fork is the `mermaid_render` entry upstream lacks, and the merge preserved it in every recorded sidecar. Recording would need an API key and would rewrite cross-platform baselines for no delta.

## Consequences

- The fork runs on `0.2.0-rc.2`; `SESSION_FORMAT_VERSION` stays 4. The window's persistence inventory change is representational, and the fork adds no acknowledgement of its own.
- The fork's surviving unique work is unchanged: the `tool-mermaid` package with its Web rendering and the zoomable viewport, the `ui-settings-models` `maxRetries` control and per-model reasoning levels, the `llm-pi-ai` `x-opencode-session` header, the pre-rename preset-id mapping in `agent-preset-registry`, and the `reicon-react` browser devDependency.
- Verified on the merged tree: typecheck, lint, build, `hygiene` (18 gates), and `doc-sync` (43 gates). The `verify-tool-catalog` check reports the regenerated English catalog current, and `verify-translation-pairing` reports all 1181 pairs consistent.
- `test:snapshot` and `test:expected` produced no trustworthy result on the host that ran this sync, and their outcome is deferred to CI. The two constraints conflict: a temp directory outside the repository makes vitest fail with `EPERM: operation not permitted, rename` because the agent sandbox denies writes outside the workspace, while a temp directory inside the repository makes `findProjectRoot` walk up to the repository's own `.agents/skills` and inject the skill catalog into every spawned application's system prompt, which produced 148 failures that assert nothing about the merge. Placing a `.git` marker in the temp base repairs the skill-contamination case but breaks the fixtures that rely on project-root discovery walking to the filesystem root and falling back to the scenario directory. The host's own difference is also present: recordings that capture a shell `rm` gain a `mavis-trash: moved to trash:` line from the local recoverable-deletion runtime, which is the known cause of the `escalation-approved` and `fs-delete-recreate` mismatches and is not a reason to re-record.
- `scripts/smoke-python-runtime.py` was not run: `--installed-wheel` needs a built wheel and a clean virtual environment that only the CI job provides. It owns the tool-name lists the new `schedule_*` tools and the retained `mermaid_render` entry would affect.
- The runtime invariant question is now open work for the next sync rather than a pending decision on this one.
