# Agent Note: Sync upstream master (0.1.5-rc.2) into the fork

Status: implemented

English | [中文](2026-09-11-sync-upstream-0-1-5-rc-2.zh.md)

## Problem

Upstream advanced 90 first-parent PR merges past the fork's 0.1.5-alpha.2 base (`b2e3b2a012` to `c291e7961a`): the 0.1.5-rc.1/rc.2 releases, the composer-plus-menu and sidebar/document-preview/composer-preview UI wave (including the new `ui-sidebar-documentpreview` package), the feedback-dialog deliverables backport, the agent-preset mode-selection gating, the DeepSeek V41 Flash default catalog, the `dshCachePath` home-paths change, the new `test-support/remote-mock` assembly tier, and CI/build reliability work (Blacksmith hosted image, parallel macOS notarization, bundle-speed). The fork's surviving unique work (the `tool-mermaid` package plus its web rendering and e2e, the settings-models editors, the preset-rename fallback) had to survive the merge without breaking the gates. A complication: the alpha.2 sync landed as a single-parent commit, so the naive merge-base fell back to `c389f96bf3` and reported 795 conflicts; only 18 files truly diverge from the alpha.2 tree.

## Decision

The sync restores the true alpha.2 ancestry first (a local `git replace` graft giving the squash commit its upstream parent, local only and never pushed), then merges `upstream/master` and resolves the 2 real conflicts by fusion. `packages/preset/agent-presets/src/index.ts` keeps the fork's `RENAMED_PRESET_IDS` (`code` to `ptc`) fallback beside the upstream mode-selection settings (`modeSelectionEnabled`, `selectionPolicy`); `scripts/repo-files.ts` takes the upstream `expandGlob` walker wholesale and retires the fork's `safeGlob` ENOTDIR workaround, because both repair the same Node 24 glob failure and the upstream walker is pinned by its own spec. The remaining 16 overlap files auto-merge with both sides intact (`tool-mermaid` wiring in `cordis.patch.yml`, tsconfigs, `gen-tool-catalog.ts`; `mermaid`/`reicon-react` in `devDependencies`; `python-sdk-single-exe` `mermaid_render` rows). The fork-only `tool-mermaid` manifest follows the dsh family's shared version (`0.1.5-alpha.2` to `0.1.5-rc.2`): the release family requires one version across every `packages/*/` member, so a version left behind fails `release:verify`. `pnpm install` leaves the lockfile untouched; `THIRD_PARTY_NOTICES.md`, the tool catalog, and translation pairing all verify clean with no regeneration needed.

## Alternatives considered

**Resolve the 795 naive conflicts one by one.** Rejected: 777 of them are phantom conflicts from the squash-broken merge-base, where the fork side is byte-identical to the alpha.2 tree; resolving each by hand would risk exactly the accidental fork-drift the merge is meant to avoid.

**Keep the fork's `safeGlob` workaround over the upstream walker.** Rejected: both fix the same Node 24 `ENOTDIR` glob failure, the upstream walker carries its own spec coverage and stricter segment validation, and keeping a fork-only shadow implementation would fight every future sync in the same file.

## Consequences

- The fork runs on 0.1.5-rc.2 with the new composer/sidebar/document-preview UI, preset mode-selection gating, the V41 Flash default catalog, and the `remote-mock` test tier.
- The mermaid tool, its web rendering, its e2e, the settings-models editors, and the preset-rename fallback remain fork-only and pass the merged gates (`verify-tool-catalog`, `verify-tsconfig-paths`, `verify-third-party-notices`, translation pairing, typecheck, lint, `release:verify`, full build, `doc-sync` 34/34).
- Future syncs must preserve two-parent merge history (never squash a sync into master), or the same phantom-conflict inflation recurs; the graft used here is local-only and must not be pushed.
