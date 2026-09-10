# Agent Note: Sync upstream master (0.1.5-alpha.2) into the fork

Status: implemented

English | [中文](2026-09-10-sync-upstream-0-1-5-alpha-2.zh.md)

## Problem

Upstream advanced 692 commits past the fork's 0.1.3-alpha.2 base (`c389f96bf3` to `b2e3b2a012`): the Session Log V3 format release (`SESSION_FORMAT_VERSION` 2 to 3, with canonical envelopes, content-admission fixes, and migration coverage), the Sidebar and delivered-file stack rework (sidebarfeat, leftsideslot, artifact file actions, image preview), the Mermaid/Graphviz/SVG/HTML chat preview that shipped and was then fully reverted, the experimental Agent Teams publication, the `tool-present` delivery tool, the code-dispatch to ptc-dispatch event rename, the client browser-dependency convention move (runtime `dependencies` into `devDependencies`, resolved through the shipping bundler configs), and the 0.1.5-alpha.1/alpha.2 releases. The fork's surviving unique work (the `tool-mermaid` package plus its web rendering and e2e, the settings-models editors) had to survive the merge without breaking the tightened gates.

## Decision

The sync branch takes upstream wholesale and resolves the 8 merge conflicts by rule. Every conflict is an additive fork insertion beside an additive upstream change, so both sides stay: `tsconfig.base.json` and `pnpm-lock.yaml` keep the `dsh-tool-mermaid` entries next to the new `dsh-tool-present` entries; `gen-tool-catalog.spec.ts` expects both `mermaid_render` and `present`; `docs/tool-catalog.md` and its Chinese counterpart keep the fork's mermaid row while the `run_code` row follows the upstream `ptc-dispatch` event rename; `packages/client/ui-primitives/package.json` follows the upstream browser-dependency convention by declaring `mermaid` in `devDependencies` (browser inputs resolve through the bundler configs, not the declaring section); `docs/tool-catalog.i18n.yaml` is re-recorded through `verify-translation-pairing --write` after the owner files merge. `THIRD_PARTY_NOTICES.md` is regenerated rather than hand-merged: `mermaid` stays a single Runtime row (browser-bundled input) and the type-only `micromark-util-types` stays a single Development row. The fork-only `tool-mermaid` manifest follows the dsh family's shared version (`0.1.3-alpha.1` to `0.1.5-alpha.2`): the release family requires one version across every `packages/*/` member, so a version left behind fails `release:verify`, `verify-npm-install-layout`, and the workspace constraint. The `python-sdk-single-exe` advanced and restart snapshots record `mermaid_render` in their tool lists (`result.json`, the v3 session logs, restart `requests.json`): the base bundle mounts the tool, so every packaged profile advertises it.

## Alternatives considered

**Re-record the upstream snapshots against fork compositions.** Rejected: the upstream generations are format and behavior changes, not fork behavior changes; re-recording would fork every fixture for no behavioral difference.

**Keep the fork's old `dependencies` placement for `mermaid`.** Rejected: the upstream convention move is repository-wide and mechanically checked; the browser notices generator resolves inputs through the shipping configs either way, and keeping a fork-only declaring section would fight the gate on every future sync.

## Consequences

- The fork runs on 0.1.5-alpha.2 with Session Log V3, the reworked Sidebar and delivered-file stack, and the `present` delivery tool.
- The mermaid tool, its web rendering, its e2e, and the settings-models editors remain fork-only and pass the merged gates (`verify-tool-catalog`, `verify-tsconfig-paths`, `verify-third-party-notices`, translation pairing, typecheck, lint).
- The fork-only browser icon input `reicon-react` (used only by `ModelListEditor.tsx`, with an empty Host `apply()`) moves from `dependencies` to `devDependencies` in `ui-settings-models`, following the same upstream browser-dependency convention as `mermaid`; the `Dependency layout` CI gate caught the old placement.
- `pnpm run test` is 22127 passed with 1 failure in `scripts/browser-bundled-externals.spec.ts` ("follows shell workspace aliases"); the failure reproduces on a clean upstream tree (a Vite path assertion against the macOS `/private/var` temporary directory), so it is owned upstream and not by this sync.
