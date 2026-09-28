# Agent Note: 可缩放的 Mermaid 图表容器

Status: implemented

English | [中文](2026-09-28-zoomable-mermaid-diagram.zh.md)

## Problem

A settled ```mermaid fence rendered its SVG inline at `max-width: 100%` with `overflow-x: auto` on the wrapper. A diagram wider than the message column therefore reached only as a horizontal scrollbar: the reader could not enlarge the labels of a sequence or class diagram without leaving the conversation, and had no way to pan to a region the column had already clipped. The documentation site already solved this for its own diagrams — a trigger per diagram opening a full-viewport Panzoom surface — but the product client had no equivalent, and the two surfaces could not share code: the site's viewer lives in `website/.vitepress/theme/`, which the application bundle does not import.

## Decision

The client wraps a settled diagram in a fitted frame with a zoom toolbar. `@panzoom/panzoom` — already a workspace dependency of the documentation site, and the library behind its viewer — does the transform, so pointer dragging, pinch, focal-point wheel zoom, and scale clamping are the library's tested behavior rather than hand-written pointer math.

The fit scale brings the diagram inside the canvas width and is capped at the diagram's own size, so a small diagram is never enlarged; that fit is also `minScale`, so zooming out stops at the view the unzoomed fence already showed and the reset control returns there. `maxScale` is 4, the library default. The canvas reserves the *fitted* height, so a shrunk diagram leaves no empty band beneath it.

The frame owns its border, the toolbar, and the canvas height; Panzoom owns the transform on the paper element alone. That split is load-bearing: Panzoom writes `style.transform` imperatively, and a React element that also carried a `style` prop would have the two overwrite each other.

Panzoom binds pointer dragging on the paper's parent but binds no wheel listener at all — which is why the documentation viewer wires one itself. The client wires one too, gated on Ctrl or ⌘. A reader's cursor is usually over the message stream, so a bare wheel over a diagram has to keep scrolling the transcript; requiring the modifier follows the convention of the browser and design tools that zoom on Ctrl+wheel, and trackpad pinch already arrives as a ctrlKey wheel event.

The toolbar floats over the frame's top-right edge and reveals on hover or focus, so a transcript does not carry a permanent control strip per diagram. Its three controls are icon-only with a `Tooltip` each, and the current scale reads out beside them.

## Alternatives considered

**Hand-rolled `transform: scale()` with a stepper and no drag.** Rejected: it is smaller, but drag-to-pan and focal-point zoom are the fiddly parts, they would have no test coverage beyond what this repository writes by hand, and the repository already ships a maintained implementation of exactly this interaction for the same content type.

**A full-viewport modal, mirroring the documentation site's viewer.** Rejected for this change: it does not answer the question asked, which was a scalable container in the transcript. It remains the better answer for a phone-sized window, and the site keeps it.

**Intercepting an unmodified wheel to zoom, the way the modal viewer does.** Rejected: the viewer sits in a locked full-screen dialog where page scroll is already disabled. In a transcript, capturing the bare wheel would break scrolling through a long conversation.

**Reusing `max-width: 100%` plus a scrollbar, and adding only a zoom toolbar.** Rejected: the toolbar would then have to control the SVG's own width rather than a transform, so each step reflowed the message column and reset the reader's scroll position.

**Reading the scale from Panzoom's `panzoomchange` event alone, with no state.** Rejected: the event fires from a `requestAnimationFrame` callback, so the readout lags a frame behind the button press. The viewport keeps the fitted scale in state and updates it on the event, which is one frame of latency on an animated control.

## Consequences

- `MarkdownLabels` gains a required `mermaid` field, so every owner that builds the object compiles against it: the chat view, the document preview sidebar, the tool view, the trajectory table, the plan preview, the question composer, the agent-preset guide dialog, and the test fixtures.
- `IconZoomInOutlineRegular`/`Medium` and `IconZoomOutOutlineRegular`/`Medium` are new glyphs in the shared icon set, drawn on the 16-grid at the regular and medium stroke widths. A new glyph needs designer review; the closest existing glyphs (refresh, fullscreen) do not mean "zoom in" or "zoom out", so the two were added rather than substituted.
- `@panzoom/panzoom` ships no `exports` map, so Node resolution reaches its CommonJS `main` and the default import arrives as a namespace object. The `thread-safe` test project inlines it so Vite takes the `module` build, which is what the browser bundle and the site already use.
- The `mermaid-diagram` web e2e golden records the accessibility tree of the message column, so the new toolbar buttons appear in it; the scenario still asserts two settled fences render as inline SVG.
- Headless and API-only surfaces are unaffected: they never load the web client, and the host tool still only returns the fenced source.
