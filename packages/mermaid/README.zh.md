---
description: "mermaid 包组：面向模型的图表工具。"
kind: "package-group"
---

# packages/mermaid

[English](README.md) | 中文

## Summary

`mermaid/` 组收纳面向模型的 Mermaid 图表工具。`tool-mermaid/`（`mermaid_render`）在主机端校验图表源码并返回；网页客户端把返回的围栏源码渲染为图表。

## Packages

| Package | Role | ctx key |
|---|---|---|
| [`tool-mermaid/`](tool-mermaid/README.zh.md) | 面向模型的 `mermaid_render` 工具：校验图表源码，供浏览器端渲染 | 注册到 `ctx.tools` |

## Related documentation

- [Tool registry subsystem](../../docs/subsystems/tools.zh.md) — 本组工具所注册的 `ctx.tools` 约定。
- [Generated tool catalog](../../docs/tool-catalog.zh.md#deepseek-aidsh-tool-mermaid) — 本组注册的完整 schema。
