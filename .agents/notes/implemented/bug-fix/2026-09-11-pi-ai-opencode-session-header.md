# Agent Note: Send x-opencode-session on the opencode-go route

Status: implemented

English | [中文](2026-09-11-pi-ai-opencode-session-header.zh.md)

## Problem

OpenCode Go requires a stable per-conversation `x-opencode-session` header on inference requests (upstream discussion #5495), and measured near-zero header presence from harness clients. Updating pi-ai cannot fix it: pi-ai 0.85.1 (already the pinned latest) contains no `x-opencode-session` logic — its `opencodeGoProvider` is only the three generic protocol implementations combined, and its session-affinity headers are a different set of names (`session_id`, `x-client-request-id`, `x-session-affinity`, `x-session-id`), which this adapter withholds in `catalog.ts` anyway.

## Decision

The pi-ai adapter injects the header itself at the `streamSimple` call site (`packages/llm/llm-pi-ai/src/adapter.ts`, `opencodeSessionHeaders`). The value is the harness session id — the same `options.sessionId` the DeepSeek adapter sends as `x-deepseek-harness-session-id`, stable for the session's lifetime and already reconstructable from the session log, so no new session event is needed. pi-ai merges per-request headers last over its defaults, so the header passes through untouched with no SDK change. Scope rules: only the `opencode-go` route sends it (the `opencode` Zen catalog is a different endpoint without this requirement); only when the request names a session; a deployment-configured header of the same name wins over the adapter default. Three tests in `adapter.spec.ts` pin the three rules (present on opencode-go with session, absent off-route and sessionless, deployment value wins).

## Alternatives considered

**Match on model baseUrl instead of the route key.** Rejected: `resolveEntry` stamps the route key over each model's `provider`, so the catalog origin is not recoverable downstream; the route key is the catalog id by configuration convention, which is the stable matching point.

**Derive a UUID v5 from the session id.** Deferred: the requirement asks for a stable per-conversation id and the session id satisfies that; UUID formatting is only added if Go telemetry rejects the plain value.

## Consequences

- opencode-go requests carry `x-opencode-session` with zero configuration; other routes are byte-identical to before.
- `packages/llm/llm-pi-ai` stays at 100% coverage; typecheck, lint, and the full package suite (328 tests) pass.
