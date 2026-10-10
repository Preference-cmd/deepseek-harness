---
description: "The mermaid package group: the model-facing diagram tool."
kind: "package-group"
---

# packages/mermaid

English | [中文](README.zh.md)

## Summary

The `mermaid/` group holds the model-facing Mermaid diagram tool. `tool-mermaid/` (`mermaid_render`) rejects an empty diagram on the host and returns the source unchanged; the web client renders the returned fenced source as a diagram fitted to the message column, with zoom, pan, and reset controls. `mermaid-bundle/` is the optional profile layer that mounts that tool; it ships switched off, so selecting it is what adds `mermaid_render` to a profile.

## Packages

| Package | Role | ctx key |
|---|---|---|
| [`tool-mermaid/`](tool-mermaid/README.md) | Model-facing `mermaid_render` tool: validates diagram source for browser-side rendering | registers on `ctx.tools` |
| [`mermaid-bundle/`](mermaid-bundle/README.md) | Optional profile layer that mounts `tool-mermaid`; ships switched off | profile layer, no ctx key |

## Related documentation

- [Tool registry subsystem](../../docs/subsystems/tools.md) — the `ctx.tools` contract this group's tool registers on.
- [Generated tool catalog](../../docs/tool-catalog.md#deepseek-aidsh-tool-mermaid) — the exhaustive schemas this group registers.
