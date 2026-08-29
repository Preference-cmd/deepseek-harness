# Agent Note: Resolve agent-preset ids a durable session header recorded before a rename

Status: implemented

English | [中文](2026-08-29-resolve-renamed-agent-preset-ids.zh.md)

## Problem

The 2026-08-25 code-mode→ptc rename moved the shipped preset id from `code` to `ptc`, and — per the [rename note](../architecture/2026-08-25-rename-code-mode-to-ptc.md) — the session-persistent vocabulary intentionally keeps the old name until the `SESSION_FORMAT_VERSION` v0→v1 migration. But the durable session **header's `agentPreset` id** is part of that persistent vocabulary too, and nothing answered it after the rename: `agentPresets.resolve('code')` threw `UnknownPresetError`, which made every operation that resumes a session recorded under `code` fail with `resume failed ... preset "code" not found`.

In the Web app the failure surfaced as three symptoms of one root cause: a blank session created before the rename (the current session of the new-session screen) could not be resumed, so the preset chip showed the raw id `code` (an unknown preset has no display name) and any pick from the menu failed; `session/selectModel` failed the same way, so the model seat kept its old model; and a `settings.default` still naming `code` would break session creation the same way.

The web e2e lanes did not catch it, because they seed sessions and settings under current ids only.

## Decision

`agent-presets` — the package that owns the preset vocabulary — maps the pre-rename id to the preset that now owns the composition in `resolve()`. The map holds only ids whose composition is unchanged by the rename (`code` → `ptc`), and a directory that actually supplies the legacy id still wins, so an authored preset may reuse any name. The mapped id is what composition callers record (`mount`/`select` record the resolved preset's id), so a switched legacy session's log writes the current name.

This is the counterpart of the deferred session-persistent vocabulary: the session log keeps saying `code`, and resolution is the one seam that must keep answering it until the v0→v1 migration rewrites the vocabulary.

## Alternatives considered

**Recover unresolvable presets at resume in the session controller (compose blank sessions under the deployment default).** Rejected for this fix: it would silently change a renamed session's composition (deployment `standard` instead of the recorded `code`/`ptc`), and a blank-session fallback is a different product question than a faithful id mapping. It remains a candidate for the general deleted-preset case, which this note deliberately does not address.

**List the legacy id in the roster.** Rejected: the picker must not offer an id no directory supplies; the mapping exists to answer durable records, not to re-advertise the renamed preset.

## Consequences

- A session recorded under `code` resumes with the `ptc` composition; preset and model switching work on it, and `settings.default: code` resolves for session creation until the user updates it.
- `resolve('code')` succeeds, so the authoring paths (`copy`/`delete`) resolve the renamed composition as well; deleting `code` targets the shipped `ptc` row and is refused as read-only, which is the existing shipped-preset guard.
- The chip still shows the raw recorded id `code` until the session is switched; naming a legacy id in the client is deferred to the rename-vocabulary migration.
- The general case — a session recording a preset the deployment deleted — still fails to resume, loudly, by design.