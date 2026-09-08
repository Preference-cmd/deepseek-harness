# Agent Note: Sync upstream master (0.1.3-alpha.2) into the fork

Status: implemented

English | [中文](2026-09-08-sync-upstream-alpha-2.zh.md)

## Problem

Upstream advanced 449 commits past the fork's 0.1.3-alpha.1 base (`d347e70390` to `c389f96bf3`): the Sidebar workspace-file stack (dockkit, resources, workspace-files, sidebar-files/textpreview/right, open-in-app, deliverables), the Electron desktop app, subprocess native containment, session streaming migration plus a performance series, durable inbox recovery, the 0.1.3-alpha.2 release, and pi-ai 0.85.1 with the default `str_replace_editor` removal. The fork's surviving unique work (mermaid tool plus client rendering, settings-models editors, preset-rename compatibility, the Node 24.11 `resolveSync` fix) had to survive the merge without breaking the tightened gates.

## Decision

The sync branch takes upstream wholesale and resolves the 2 merge conflicts by rule: the `THIRD_PARTY_NOTICES.md` text conflict takes the upstream hunk and then regenerates the file so the fork's `mermaid`/`reicon-react` runtime rows return to their tier while upstream's `msgpackr`/Electron rows stay; the `2026-08-28-subprocess-native-containment.i18n.yaml` rename-detection conflict takes the upstream sidecar because the fork's pi-ai sidecar edit already reached the tree through the archived rename. The archived pi-ai triplet is restored byte-identical to upstream since archived content is frozen and the fork paragraph it dropped lives on in the settings-models editor note. The fork's stale `implemented/architecture` link to the archived rename note is repointed at `archived/` in both languages.

## Alternatives considered

**Re-record the upstream snapshots against fork compositions.** Rejected: the upstream generations are format and behavior changes, not fork behavior changes; re-recording would fork every fixture for no behavioral difference.

**Keep the fork-edited archived pi-ai triplet.** Rejected: archived notes are frozen history and the archive gate seals their hashes; the fork's editor rationale is preserved in its own active note.

## Consequences

- The fork runs on 0.1.3-alpha.2 with the Sidebar file stack, the desktop app, native containment, and durable inbox recovery.
- The mermaid tool and rendering, the settings-models editors, and the preset-rename compatibility remain fork-only and pass the merged gates.
- `scripts/repo-files.ts` gains a symlink-safe `**` glob fallback because Node 24's native glob crashes with ENOTDIR on the pre-existing symlinked `snapshots/acp/image-compaction/system-prompt.expected.md`; the crash reproduces on a clean upstream tree, so the fix is owned here until upstream repairs the script.
