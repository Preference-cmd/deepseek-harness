# Agent Note: Map pi-ai 0.84 terminal states and caller abort in llm-pi-ai

Status: implemented

English | [中文](2026-08-14-pi-ai-084-terminal-state-mapping.zh.md)

## Problem

Upgrading `@earendil-works/pi-ai` from 0.82.1 to 0.84.1 widened `StopReason` with two new values — `deferred` and `pending` — and changed what the lazy stream reports for a pre-abort. `mapStopReason` switched exhaustively over the old union, so the new members failed compilation instead of being silently mishandled; and pi-ai 0.84's `lazyStream` reports a caller abort that landed during its auth setup as a plain `error` event (`stopReason: "error"`) rather than the `"aborted"` that 0.82 produced. That regression broke the two abort-wiring tests in `adapter.spec.ts` and would have turned a user cancel into a provider failure.

## Decision

- `mapStopReason` maps the two new terminal states to failures: `deferred` → `DEFERRED_UNSUPPORTED` (pi-ai hands back a poll handle instead of a final message, and this adapter reads one event stream and never polls, so the turn cannot complete); `pending` → `PI_AI_ERROR` (a done/error event carrying a non-terminal reason is refused loudly rather than completing an unfinished message).
- `toStreamChunks` accepts the caller's `AbortSignal` and reclassifies an `error` event as an `aborted` finish when that signal is already aborted — pi-ai's lazy setup path collapses a pre-abort into a plain error, and only the harness's own signal still distinguishes "user cancelled" from "provider failed".
- `catalog.ts` adds `baseten` to the withheld `thinkingFormat` set — the 0.84 union's new member, which drives the request through `chatTemplateArgs` this configuration does not expose — so the drift gate stays whole.

## Alternatives considered

**Let the two new stop reasons fall through to the error catch-all.** Rejected: `deferred` is a lifecycle the adapter cannot serve rather than a plain failure, and a bare `PI_AI_ERROR` would hide that polling is the only way to finish; `pending` must never read as a completion. The exhaustiveness of the switch is also the compile-time signal that an upstream addition needs a decision.

**Teach the adapter to poll deferred responses.** Rejected: a deferred turn is a second, long-lived provider lifecycle (store the handle, schedule a status poll, resume the stream) no consumer has asked for. Recording the negative capability is the honest stop until one does.

**Trust pi-ai's `error` stopReason for a pre-abort.** Rejected: the harness's `aborted` finish carries caller-cancellation semantics that retry and the loop read differently from a provider error; reclassifying from the caller signal restores what 0.82 reported without reaching into pi-ai's lazy setup.

## Consequences

- A deferred or pending terminal now fails with a named code instead of falling through, and the mapping is re-checked by the type gate on the next pi-ai upgrade.
- A caller abort during lazy setup keeps its `aborted` identity end to end (pinned by `convert.spec.ts` and the adapter abort tests).
- Cancellation wins over a concurrent provider failure: an `error` event arriving while the caller signal is already aborted is reported as aborted, which is the intended precedence — the failure no longer matters to the caller that cancelled.
