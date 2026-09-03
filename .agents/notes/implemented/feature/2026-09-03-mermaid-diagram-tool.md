# Agent Note: Mermaid diagram tool with browser-side rendering

Status: implemented

English | [中文](2026-09-03-mermaid-diagram-tool.zh.md)

## Problem

The fork shipped `packages/mermaid/tool-mermaid` as a model-facing `mermaid_render` tool, but it never met repository gates: the manifest lacked `license`, `repository`, and conforming `exports`/`files`; `src/invariant.ts` was an empty companion the invariant rules reject; the tool was absent from the tool-catalog boot manifest; the example `cordis.yml` used a retired map shape; and the READMEs lacked model-context entries. The tool was also unwired: no bundle mounted it, so no shipped profile served it. Its executor returned a placeholder SVG (grey box with the first five source lines), not a diagram.

## Decision

The tool now conforms and renders for real. The host side validates that the diagram source is non-empty, detects its family from the first keyword, and returns the source unchanged; the model-facing result is a fenced `mermaid` code block. The package drops the empty invariant companion (with the README omission sentence), declares MIT, joins the tool catalog, the base bundle, and the generated composition and module graphs. Rendering lives in the web client: `packages/client/ui-primitives` renders settled `mermaid` fences through the `mermaid` engine (lazily imported, `securityLevel: 'strict'`), mapping the emitted SVG onto React elements through the same DOM-parser path as KaTeX, with `on*` attributes and `javascript:` URLs stripped. Engine load failure or an unparseable source keeps the code-block fallback, and streaming fences stay code until settled.

## Alternatives considered

**Render on the host with @mermaid-js/mermaid-cli.** Rejected: it shells out to a headless Chromium, which the host sandbox model cannot assume; the browser already lays out graphics.

**Render on the host with the mermaid package under jsdom.** Rejected: an 84MB engine plus a DOM shim on every host for a presentation concern the client owns.

**A dedicated toolview card for mermaid_render results.** Rejected for this change: the fenced result flows through the existing markdown renderer, so every mermaid fence — hand-written or tool-returned — renders identically with no new slot or card. A bespoke card remains possible if per-call chrome is ever needed.

## Consequences

- `mermaid_render` is served by base-backed profiles; the `web-search-endpoint-guidance`-style snapshot lane is unaffected (no session events involved).
- The `mermaid-diagram` web e2e pins two settled fences (flowchart, sequence) rendering to inline SVG with zero page errors.
- Host deployments without the web client receive validated source but no picture; this is stated in the package's Known Limitations.
- Reintroducing server-side export (PNG/PDF) means a new execution path with its own sandbox story, not a change to this split.
