# Agent Note: Sync upstream master (0.1.7-rc.1) into the fork

Status: implemented

English | [中文](2026-09-24-sync-upstream-0-1-7-rc-1.zh.md)

## Problem

Upstream advanced 318 commits past the fork's 0.1.7-alpha.1 base, shipping `0.1.7-alpha.2` and then `0.1.7-rc.1`. The window splits every tool call into preparing, start, and result stages, enforces DSH peer compatibility for installed plugins, rewrites the Web code-card and agent-team header surfaces, writes a desktop crash report before the fatal recovery dialog, and retightens internal DSH workspace references to `workspace:*` and `workspace:~`.

Two of those changes land on fork work. `packages/bundle/base/package.json` and `packages/client/ui-settings-models/package.json` are the files where the fork registers `@deepseek-ai/dsh-tool-mermaid` and declares the `reicon-react` browser devDependency, and upstream rewrote both dependency blocks to change every workspace range. `snapshots/session/office-skills` stops sharing `text-turn`'s sidecars: upstream gives that scenario its own `system-prompt.expected.md` and `tool-schemas.expected.json`, points `office-skills-no-renderer` at those, and drops the symlinks the fork inherited. Both sidecars record upstream's tool catalog, so the fork's `mermaid_render` entry has to be re-applied.

## Decision

The merge incorporates upstream `0.1.7-rc.1` into `sync/upstream-0.1.7-rc.1` as a two-parent merge commit whose parents are the fork trunk and the upstream release. Two files conflicted with content and two more changed file type. Generated catalogs were resolved by running their generators, and recorded tool-schema sidecars by re-applying the fork's `mermaid_render` entry at its name-sorted position; neither by hand-editing recorded bytes.

- `packages/bundle/base/package.json`: upstream's dependency block wins, including its workspace ranges, and `@deepseek-ai/dsh-tool-mermaid` returns between `dsh-tool-goal` and `dsh-tool-pwsh`.
- `packages/client/ui-settings-models/package.json`: upstream's `workspace:*` ranges for `dsh-client-ui-renderer`, `dsh-util-values`, and `dsh-remote-mock` win, and the fork's `reicon-react` devDependency stays.
- `snapshots/session/office-skills/tool-schemas.expected.json` and `snapshots/session/multimodal-spill-ends/tool-schemas.expected.json` take the canonical `mermaid_render` entry from `text-turn` at its sorted position, 23 → 24 and 25 → 26 tools. `office-skills-no-renderer` names `office-skills` as its sidecar source and `multimodal-spill-middle` shares the `multimodal-spill` class pin, so those two scenarios compare through the same files.
- `pwsh-tool-turn` (20 → 21) and `persistent-pwsh-tool-turn` (17 → 18) take the same insertion, because their compositions patch the headless profile without disabling `tool-mermaid` and therefore carry the fork's larger catalog. No `pwsh` exists on the machine that merged this, so those two edits are recorded without a local run; `test:snapshot` skips both scenarios here.
- `docs/tool-catalog.*`, `docs/config-catalog.*`, `docs/module-graph.*`, `THIRD_PARTY_NOTICES.md`, and the composition-reference package list come from `gen-tool-catalog`, `gen-config-catalog`, `gen-module-graph`, `gen-third-party-notices`, `gen-plugin-packages`, `gen-client-catalog`, and `gen-dependency-catalog`. Each generator reproduced the merged content exactly, so only `pnpm-lock.yaml` needed a second write after the conflict resolution.

Two fork-side repairs, each surfaced by a gate the merge made fail:

- `packages/mermaid/tool-mermaid/package.json`: the version moves to `0.1.7-rc.1` and its dependency sections adopt the window's range policy (`workspace:*` for DSH packages, `workspace:~` for `@deepseek-ai/cordis`). `verify-npm-install-layout` requires every `packages/*/*` member to carry the family version, and `release:verify --family dsh` fails on the member that does not; the fork-only package is absent upstream, so no upstream commit bumps it.
- `scripts/rescope-vendor.ts`: `packages/extensions/ui-cordis/src/client/CordisPreparingRow.tsx` joins the skip list for the bare `cordis` token. The window adds this preparing-card family, whose `PropsLocale<'cordis'>` names the UI locale namespace that `locales.ts` declares as `NS = 'cordis'` — a product key, exactly as in its four sibling row files. `rescope-vendor:check` reports the token as residue otherwise, because rewriting it would resolve a locale namespace as a package name.

## Alternatives considered

**Keep the `office-skills` sidecars shared with `text-turn`.** Rejected: upstream's own sidecar records a 23-tool catalog that differs from `text-turn`'s, so the shared file would assert an equality the scenario no longer has.

**Leave the pwsh sidecars on upstream's recorded bytes.** Rejected: both compositions patch the headless profile that enables `tool-mermaid`, so their recordings are short by exactly the fork's entry, and the same re-application applies.

**Re-record the sidecars instead of inserting one entry.** Rejected: `test:snapshot` refresh rewrites stdout expectations only, and recording needs an API key. The inserted entry is identical to the `text-turn` entry that the four passing scenarios already compare against.

## Consequences

- The fork runs on `0.1.7-rc.1` with `SESSION_FORMAT_VERSION` 4. The window adds the app-boot plugin compatibility preflight, the desktop crash report, the voice-input and plugin-manager download-mirror selection, and the cordis 4.0.4 vendor bump.
- The fork's surviving unique work is the `tool-mermaid` package with its Web rendering, the `ui-settings-models` `maxRetries` control and per-model reasoning levels, the `llm-pi-ai` `x-opencode-session` header, the pre-rename preset-id mapping in `agent-preset-registry`, and the `reicon-react` browser devDependency.
- The fork's earlier retirement of the search packages needs no re-application: neither tree carries those paths.
- Verified on the merged tree: typecheck, lint, `hygiene` (18 gates), `doc-sync` (42 gates), `test:expected` (106 tests), and `test:snapshot` (169 passed, 2 skipped in 173 scenarios).
- Two scenarios fail on this host only: `snapshots/acp` `escalation-approved` and `snapshots/session/fs-delete-recreate` compare a bash tool result whose recorded text is `(no output)` against the `mavis-trash: moved to trash: …` line this machine's `rm` prints. The merge changes neither scenario, and their recorded bytes stay unchanged.
