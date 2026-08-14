# Agent Note: Map pi-ai 0.84 terminal states and caller abort in llm-pi-ai

Status: implemented

[English](2026-08-14-pi-ai-084-terminal-state-mapping.md) | 中文

## Problem

把 `@earendil-works/pi-ai` 从 0.82.1 升到 0.84.1 扩大了 `StopReason`，新增两个值——`deferred` 与 `pending`——并改变了懒加载流对「预中止」的上报方式。`mapStopReason` 对旧联合类型做了穷尽 switch，因此新成员会在编译期报错而不是被静默误处理；同时 pi-ai 0.84 的 `lazyStream` 会把落在其鉴权建立阶段的调用方中止，上报成普通的 `error` 事件（`stopReason: "error"`），而非 0.82 所产出的 `"aborted"`。这一回归打破了 `adapter.spec.ts` 里两条中止接线测试，也会把一次用户取消变成一次提供方失败。

## Decision

- `mapStopReason` 把两个新终态映射为失败：`deferred` → `DEFERRED_UNSUPPORTED`（pi-ai 交回一个轮询句柄而非最终消息，而本适配器只读单条事件流、从不轮询，因此这一轮无法完成）；`pending` → `PI_AI_ERROR`（携带非终态理由的 done/error 事件被响亮拒绝，而不是把一条未完成消息当作完成）。
- `toStreamChunks` 接受调用方的 `AbortSignal`，当该信号已经中止时，把 `error` 事件重分类为 `aborted` 完成——pi-ai 的懒加载建立路径把预中止压平成普通错误，只有 harness 自己的信号仍能区分「用户取消」与「提供方失败」。
- `catalog.ts` 把 `baseten` 加入 withheld `thinkingFormat` 集合——这是 0.84 联合类型的新成员，会通过本配置未暴露的 `chatTemplateArgs` 驱动请求——从而让漂移门保持完整。

## Alternatives considered

**让两个新停因落入 error 兜底。** 拒绝：`deferred` 是本适配器无法服务的生命周期而非普通失败，一个光秃秃的 `PI_AI_ERROR` 会掩盖「只有轮询才能完成」这一事实；`pending` 绝不能读作完成。switch 的穷尽性也正是「上游新增需要一次决策」的编译期信号。

**教适配器去轮询 deferred 响应。** 拒绝：deferred 一轮是第二条长生命周期（存句柄、排状态轮询、恢复流），目前没有任何消费者需要它。在有人需要之前，如实记录这项负面能力才是诚实的停法。

**相信 pi-ai 对预中止给出的 `error` 停因。** 拒绝：harness 的 `aborted` 完成承载着重试与循环会与提供方错误区别对待的调用方取消语义；从调用方信号重分类，能在不深入 pi-ai 懒加载建立路径的前提下恢复 0.82 的上报。

## Consequences

- deferred 或 pending 终态现在以具名代码失败，而不是落入兜底；映射会在下一次 pi-ai 升级时由类型门重新检查。
- 懒加载建立阶段发生的调用方中止，端到端保持其 `aborted` 身份（由 `convert.spec.ts` 与适配器中止测试钉住）。
- 取消优先于并发的提供方失败：调用方信号已中止时到达的 `error` 事件会按 aborted 上报，这正是想要的优先级——对已经取消的调用方而言，那次失败已无关紧要。
