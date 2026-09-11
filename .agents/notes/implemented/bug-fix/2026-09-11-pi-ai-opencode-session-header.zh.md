# Agent Note: 在 opencode-go 路由发送 x-opencode-session

Status: implemented

[English](2026-09-11-pi-ai-opencode-session-header.md) | 中文

## 问题

OpenCode Go 要求推理请求携带稳定的每会话 `x-opencode-session` header（上游讨论 #5495），并测得 harness 客户端的 header 出现率接近零。升级 pi-ai 修不了：pi-ai 0.85.1（已是 pinned 的最新版）不含任何 `x-opencode-session` 逻辑 —— 它的 `opencodeGoProvider` 只是三个通用协议实现的组合，它的 session-affinity header 是另一组名字（`session_id`、`x-client-request-id`、`x-session-affinity`、`x-session-id`），且本 adapter 在 `catalog.ts` 里本来就 withhold 了那套机制。

## 决策

pi-ai adapter 在 `streamSimple` 调用点自己注入该 header（`packages/llm/llm-pi-ai/src/adapter.ts`，`opencodeSessionHeaders`）。值取 harness session id —— 与 DeepSeek adapter 以 `x-deepseek-harness-session-id` 发送的是同一个 `options.sessionId`，会话生命周期内稳定，且已可从 session log 重建，因此不需要新 session event。pi-ai 把 per-request header 最后合并、覆盖 defaults，所以无需改 SDK 即可原样透传。作用域规则：只在 `opencode-go` 路由发送（`opencode` Zen catalog 是另一个端点，没有该要求）；只在请求带 session 时发送；部署配置的同名 header 优先于 adapter 默认值。`adapter.spec.ts` 中三个测试锁定三条规则（opencode-go + session 则有、非本路由或无 session 则无、部署值获胜）。

## 备选方案

**按 model baseUrl 而不是路由 key 匹配。** 否决：`resolveEntry` 用路由 key 覆盖了每个 model 的 `provider`，下游无法恢复 catalog 来源；按配置约定路由 key 即 catalog id，这是稳定的匹配点。

**从 session id 派生 UUID v5。** 暂缓：需求要的是稳定的每会话 id，session id 已满足；只有 Go telemetry 拒绝纯值时才加 UUID 格式化。

## 后果

- opencode-go 请求零配置携带 `x-opencode-session`；其他路由与之前逐字节一致。
- `packages/llm/llm-pi-ai` 保持 100% 覆盖率；typecheck、lint 与全包套件（328 测试）通过。
