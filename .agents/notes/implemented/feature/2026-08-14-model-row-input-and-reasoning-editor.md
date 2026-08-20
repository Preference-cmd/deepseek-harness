# Agent Note: Edit input modalities and reasoning levels on a custom-provider model

Status: implemented

English | [中文](2026-08-14-model-row-input-and-reasoning-editor.zh.md)

## Problem

`settings.yaml` could already declare a hand-declared pi-ai model's `input` ([[2026-08-12-pi-ai-route-default-input-modalities]]) and `reasoningEfforts` ([[2026-08-08-pi-ai-per-model-reasoning-declarations]]), but the Models page's per-row editor only wrote `id`, `name`, and the two capacities. A user adding a custom provider through the web UI therefore could not mark a vision model nor declare which reasoning levels a model supports: such models materialized as text-only and non-reasoning, so images were refused at admission with no reachable remedy and the composer offered no effort picker.

## Decision

Each pi-ai model row's disclosure now edits input modalities and reasoning levels as chips over the shared `Pill` primitive; modality chips carry a Reicon glyph, reasoning chips carry text:

- **Input modalities** is two icon chips: a locked `Text` chip (text is always accepted, so it is disabled and never toggles) and an `Image` toggle that writes `input: [text, image]` when selected and `input: [text]` when not.
- **Output modalities** is one locked `Text` icon chip: chat output is always text, so the group is display-only and writes nothing.
- Six reasoning chips (`minimal` through `max`) write `reasoningEfforts` as `{ off: null, <level>: <level> }` per selected level. `off` is never offered as a chip: it is implicit (`off: null`, "supported, send nothing") for a reasoning model and meaningless for a non-reasoning one. A row with no level selected writes `reasoningEfforts: false` — a non-reasoning model — never an empty dict, which the resolver refuses.
- Wire spellings are fixed to the level name, the value most OpenAI-compatible gateways accept as `reasoning_effort`; per-level renames and `compat.supportsReasoningEffort`/`thinkingFormat` stay in `settings.yaml`.
- The disclosure button's label moves from **Capacities** to **More**, since the fold now holds more than the two token counts.

This reverses the "no configuration surface edits `input`" clause of [[2026-08-12-pi-ai-route-default-input-modalities]] for `input` and `reasoningEfforts` alone, and surfaces the [[2026-08-08-pi-ai-per-model-reasoning-declarations]] declaration in the GUI. The resolution chains those notes own are unchanged — the chips write the same values a hand-written document would.

## Alternatives considered

**Checkboxes, as first shipped.** Rejected by the user, who asked for button-style selectable chips; the `Pill` primitive already supplies the active/hover chrome and the composer uses the same toggle idiom for effort selection.

**Hand-roll the modality glyphs into the `ic_ds_*` set.** Rejected: that set has no image/audio/pdf glyph, and extracting new ones from Figma is more work than the decision justified. The page instead introduces `reicon-react` for the two glyphs it needs (`Text`, `Image`); Reicon's catalog also covers the deferred `video`/`audio`/`pdf` for when the backend vocabulary grows.

**Per-level wire-spelling editors.** Rejected as out of scope: spelling = level name covers the common `reasoning_effort` case, and exposing a spelling field per level would crowd the disclosure and re-enter the pi-ai map semantics the config note deliberately hid.

**Offer `off` as its own chip.** Rejected: `off` is a constant of the reasoning model, not a level it offers; offering it would let a row read "reasoning with zero levels", the exact state `false` already means.

**A route-level input or reasoning control instead.** Rejected: both are per-model capabilities; the same rationale that keeps the route `reasoning` default out of the card applies.

## Consequences

- A GUI-only user can declare vision and reasoning per model; `resolveModelInfo` reports them through the existing seam, so the composer's effort pane and the image-admission gates light up with no change there.
- The image and reasoning controls write explicit values on first touch; a catalog-model override once touched does not return to "inherit" by deselecting everything — `false` and `[text]` are the honest explicit spellings, and the whole-array reset affordance is how to restore inheritance.
- `compat` (wire dialect) and per-level spellings remain settings-document-only; a private gateway whose `reasoning_effort` vocabulary differs from pi's level names still needs `settings.yaml`.
