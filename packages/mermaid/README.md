---
description: "The mermaid package group: the model-facing diagram tool."
kind: "package-group"
---

# packages/mermaid

English | [中文](README.zh.md)

## Summary

The `mermaid/` group holds the model-facing Mermaid diagram tool. `tool-mermaid/` (`mermaid_render`) validates diagram source on the host and returns it; the web client renders the returned fenced source as a diagram.

## Packages

| Package | Role | ctx key |
|---|---|---|
| [`tool-mermaid/`](tool-mermaid/README.md) | Model-facing `mermaid_render` tool: validates diagram source for browser-side rendering | registers on `ctx.tools` |

## Related documentation

- [Tool registry subsystem](../../docs/subsystems/tools.md) — the `ctx.tools` contract this group's tool registers on.
- [Generated tool catalog](../../docs/tool-catalog.md#deepseek-aidsh-tool-mermaid) — the exhaustive schemas this group registers.
