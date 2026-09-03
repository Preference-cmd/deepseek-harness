---
description: "Model-facing Mermaid diagram tool: validates diagram source and returns it for browser-side rendering."
kind: "package-reference"
---

# @deepseek-ai/dsh-tool-mermaid

English | [中文](README.zh.md)

## Summary

The `tool-mermaid/` package registers one model-facing tool, `mermaid_render`, on `ctx.tools`. The tool validates that the diagram source is non-empty, detects its family from the first keyword, and returns the source unchanged. Rendering happens in the web client: the tool's model-facing result is a fenced `mermaid` code block, and the client's markdown renderer turns that block into a diagram. The host never shells out to a renderer and holds no browser dependency.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Load the plugin beside the tool runtime; it registers `mermaid_render` with one required `diagram` string parameter. A deployment that wants the model to draw diagrams mounts this package (for example through the [example patch overlay](examples/cordis.yml)) and serves the web client, which owns rendering.

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | Plugin entry: `Config`, the `mermaid_render` definition, family detection, fenced result rendering |
| [`src/types.ts`](src/types.ts) | `MermaidDiagramType` and the validated `MermaidRenderResult` |

No runtime invariant companion is published because this stateless adapter owns no independent state or event protocol; execution relations are owned by the tool seam it calls.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

This section explains the design decisions behind the tool; the observable behavior is fully covered in [Use this package](#use-this-package).

### Design concept

Validation lives on the host, rendering lives in the browser. The tool checks only that the source is non-empty and classifies its family for the result metadata; syntax errors surface at render time in the client, where the mermaid engine reports the failing line. This split keeps the host dependency-free (no Chromium, no jsdom) while the browser — which already parses and lays out graphics — does the drawing.

### Source map

| File | Role |
|---|---|
| [`src/index.ts`](src/index.ts) | Plugin entry: `Config`, tool composition, `mermaid_render` executor |
| [`src/types.ts`](src/types.ts) | `MermaidDiagramType` and the validated `MermaidRenderResult` |

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

Read these pages when the package-level contract is not enough.

- [Generated tool catalog](../../../docs/tool-catalog.md#deepseek-aidsh-tool-mermaid) — the exhaustive schemas this package registers.
- [Example patch overlay](examples/cordis.yml) — mount the tool on a base-backed profile.

-----

<a id="model-experience"></a>
## Model Experience

### Tool schemas

#### What the model sees

The model sees the generated [`mermaid_render` schema](../../../docs/tool-catalog.md#deepseek-aidsh-tool-mermaid), with a single required `diagram` string argument. Scoped tool restrictions can remove the definition for one agent.

#### Token effect

Fixed schema cost on every request in that tool view.

#### KV Cache effect

Prefix-stable while the visible tool definitions and order are unchanged. Registration lifecycle or scoped restrictions may invalidate reuse from the first changed schema token.

### Tool result

#### What the model sees

A successful call returns the validated source wrapped as a fenced `mermaid` code block. An empty diagram fails with `mermaid_render: diagram must not be empty`.

#### Token effect

The returned source is resent until compaction; large diagrams cost per-request tokens like any other tool result.

#### KV Cache effect

Append-only; newly visible content follows the reusable request prefix and does not invalidate existing KV-cache entries.

## Known Limitations and Deferred Work

- Rendering requires the web client: headless and API-only deployments receive the source but no picture.
- Syntax errors surface at render time in the browser, not as tool errors; the client shows the engine's message with the failing line.
- No PNG or PDF export; the browser renders SVG in place.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
