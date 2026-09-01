# Agent Note: Restore the per-model reasoning and modality editor lost in the upstream sync merge

Status: implemented

English | [中文](2026-08-29-restore-model-reasoning-modality-editor.zh.md)

## Problem

The 2026-08-28 upstream sync merge (`65ca80f16c`, dsh-0.1.2-alpha.1) took upstream's rewritten `ModelListEditor.tsx`, overwriting the fork's per-row disclosure that edits a custom provider model's input modalities and reasoning levels ([feature note](../feature/2026-08-14-model-row-input-and-reasoning-editor.md)). The surrounding vocabulary survived — the locale keys, the chip CSS, the `Pill` primitive, and the component tests — but the editor body and its `reicon-react` dependency were gone, so the Models settings page again let a user declare only `id`, `name`, and the two capacities. The three surviving tests went red, and in the running GUI a custom provider's vision and reasoning declarations could no longer be edited (a vision model could not be marked, and no effort picker appeared for the models the deployment config declared).

## Decision

Port the lost editor back onto the current (post-rewrite) `ModelListEditor.tsx`:

- The disclosure regains the input-modalities chips (locked text + image toggle), the display-only output-modalities chip, and the six reasoning-level chips (`minimal`…`max`) writing `reasoningEfforts = { off: null, <level>: <level> }`, with none selected storing `false` (non-reasoning) — the original decision's wire spellings unchanged.
- `patch` widens to `Record<string, unknown>` because the chips write arrays, dicts, and booleans, not just scalar text.
- The `reicon-react@^1.2.0` dependency is restored to the package manifest and lockfile, matching the original feature commit; the `Pill` interface and both icon exports are unchanged.

The merge also left one stale golden: upstream's `models-settings/declared-edit.expected.md` dropped the `retryPolicy.maxRetries` field the fork's `ProviderEditor` still renders. That file is refreshed to the current rendering (three lines), so the models-settings web e2e lane is green again.

## Alternatives considered

**Leave the editor lost.** Rejected: upstream has no per-model reasoning/modality editor, so this fork's GUI-only users would permanently lose the only surface declaring vision and reasoning for a custom provider.

**Reintroduce the controls with inline SVG glyphs instead of `reicon-react`.** Rejected: the original decision already picked Reicon for the two glyphs (the Figma `ic_ds_*` set has no text/image glyph), and restoring the same dependency keeps the port byte-close to the reviewed feature rather than re-litigating the glyph source.

## Consequences

- The Models page disclosure edits a custom provider model's input modalities and reasoning levels again; the composer's effort picker and image admission light up through the existing `resolveModelInfo` seam, unchanged.
- The three component tests that had gone red with the merge are green again; the full `ui-settings-models` suite (232 tests) passes, and the models-settings + default-model web e2e lanes pass in replay mode.
- The port is the second fork feature restored after this sync, following the preset-id resolution fix; a future upstream merge should treat `ModelListEditor.tsx` and `ProviderEditor.tsx` as fork-owned files.