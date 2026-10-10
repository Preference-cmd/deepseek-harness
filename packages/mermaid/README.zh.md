---
description: "mermaid 包组：面向模型的图表工具。"
kind: "package-group"
---

# packages/mermaid

[English](README.md) | 中文

## Summary

`mermaid/` 组收纳面向模型的 Mermaid 图表工具。`tool-mermaid/`（`mermaid_render`）在主机端拒绝空图表并原样返回源码；网页客户端把返回的围栏源码渲染为按消息列适配的图表，带缩放、平移与复位控件。`mermaid-bundle/` 是把该工具挂载起来的可选 profile 层，默认关闭，因此选中它才是把 `mermaid_render` 加进 profile 的动作。

## Packages

| Package | Role | ctx key |
|---|---|---|
| [`tool-mermaid/`](tool-mermaid/README.zh.md) | 面向模型的 `mermaid_render` 工具：校验图表源码，供浏览器端渲染 | 注册到 `ctx.tools` |
| [`mermaid-bundle/`](mermaid-bundle/README.zh.md) | 挂载 `tool-mermaid` 的可选 profile 层，默认关闭 | profile 层，无 ctx key |

## Related documentation

- [Tool registry subsystem](../../docs/subsystems/tools.zh.md) — 本组工具所注册的 `ctx.tools` 约定。
- [Generated tool catalog](../../docs/tool-catalog.zh.md#deepseek-aidsh-tool-mermaid) — 本组注册的完整 schema。
