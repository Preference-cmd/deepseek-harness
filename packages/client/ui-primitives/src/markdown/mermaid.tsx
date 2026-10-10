/**
 * Mermaid source to React, following the KaTeX renderer in `katex.tsx`: the
 * engine emits an SVG string, the browser's own HTML parser turns it into a
 * tree, and this module maps that tree onto React elements. The mermaid engine
 * sanitizes its output at `securityLevel: 'strict'` (scripts and event handlers
 * removed); the DOM-to-React mapping additionally drops every `on*` attribute
 * and `javascript:` URL, so no raw engine string reaches `dangerouslySetInnerHTML`.
 *
 * The engine loads lazily: `mermaid` is an ~84MB unpacked dependency, so the
 * first settled mermaid fence imports it once and every later fence reuses the
 * same module promise. While loading — or when the source does not parse —
 * the caller keeps its code-block fallback, the same degradation every other
 * fence gets.
 *
 * A settled diagram is wrapped in {@link MermaidViewport}, which fits it to the
 * message column and lets the reader zoom and pan it.
 */

import { createElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import Panzoom from '@panzoom/panzoom'
import { IconRefreshOutlineRegular, IconZoomInOutlineRegular, IconZoomOutOutlineRegular } from '../icons/index.tsx'
import { Tooltip } from '../Tooltip.tsx'
import css from './MarkdownText.module.css'

type MermaidModule = typeof import('mermaid')

/** One shared engine load per page lifetime; fences reuse the settled module. */
let enginePromise: Promise<MermaidModule> | undefined

function loadEngine(): Promise<MermaidModule> {
  enginePromise ??= import('mermaid').then((module) => {
    module.default.initialize({ startOnLoad: false, securityLevel: 'strict' })
    return module
  })
  return enginePromise
}

/** Largest scale the viewport offers; the panzoom default, named here as this feature's limit. */
const MAX_SCALE = 4

/** Localized controls of a rendered diagram. */
export interface MermaidZoomLabels {
  /** Action that enlarges the diagram one step. */
  zoomIn: string
  /** Action that shrinks the diagram one step. */
  zoomOut: string
  /** Action that restores the fitted view. */
  reset: string
}

/** Convert one inline `style` attribute string into React's style object. */
function styleObject(css: string): CSSProperties {
  const style: Record<string, string> = {}
  for (const declaration of css.split(';')) {
    const colon = declaration.indexOf(':')
    if (colon === -1) continue
    const name = declaration.slice(0, colon).trim()
    const key = name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
    style[key] = declaration.slice(colon + 1).trim()
  }
  return style
}

/** Whether an attribute value may reach the element. */
function isSafeAttribute(name: string, value: string): boolean {
  if (name.startsWith('on')) return false
  if ((name === 'href' || name === 'xlink:href') && /^\s*javascript:/i.test(value)) return false
  return true
}

/** Map one parsed DOM node onto a React element (text nodes pass through). */
function domToReact(node: ChildNode, key: number): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent
  if (node.nodeType !== Node.ELEMENT_NODE) return null
  const element = node as Element
  const props: Record<string, unknown> = { key }
  for (const attribute of element.attributes) {
    if (!isSafeAttribute(attribute.name, attribute.value)) continue
    if (attribute.name === 'class') props['className'] = attribute.value
    else if (attribute.name === 'style') props['style'] = styleObject(attribute.value)
    else props[attribute.name] = attribute.value
  }
  const children = [...element.childNodes].map(domToReact)
  return children.length === 0
    ? createElement(element.localName, props)
    : createElement(element.localName, props, ...children)
}

/**
 * Parse one serialized engine document down to its `<svg>` root.
 *
 * The engine writes labels as HTML inside `<foreignObject>`: a line break in
 * the source arrives as `<br>`, which is well-formed HTML but not well-formed
 * XML, so an XML parse rejects the whole document and the fence would fall back
 * to a code block. The HTML parser accepts both spellings and applies the
 * spec's SVG attribute adjustments, the same parse the KaTeX renderer uses.
 * @param svg - the engine's serialized SVG document.
 * @returns the `<svg>` root, or null when the document holds no SVG element.
 */
function parseSvgRoot(svg: string): Element | null {
  return new DOMParser().parseFromString(svg, 'text/html').querySelector('svg')
}

/**
 * Render Mermaid source to a React SVG tree.
 * @param value - the fence's source text, without the trailing newline the
 * code-block path appends for display trimming.
 * @returns the rendered diagram, null while the engine loads, or undefined
 * when the engine rejects the source or returns no SVG (the caller keeps its
 * code fallback).
 */
export function useMermaidDiagram(value: string): ReactNode | null | undefined {
  const [tree, setTree] = useState<ReactNode | null | undefined>(null)
  useEffect(() => {
    let cancelled = false
    setTree(null)
    loadEngine().then(
      async (module) => {
        try {
          const { svg } = await module.default.render(`dsh-mermaid-${hashSource(value)}`, value)
          if (cancelled) return
          const root = parseSvgRoot(svg)
          if (root === null) {
            setTree(undefined)
            return
          }
          setTree(domToReact(root, 0))
        } catch {
          if (!cancelled) setTree(undefined)
        }
      },
      () => {
        if (!cancelled) setTree(undefined)
      },
    )
    return () => {
      cancelled = true
    }
  }, [value])
  return tree
}

/** Stable short hash for the engine's render id (ids must be unique per diagram). */
function hashSource(value: string): string {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(hash, 31) + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash).toString(36)
}

/**
 * A settled diagram inside a fitted, zoomable container.
 *
 * The frame owns its border, the toolbar, and the canvas height; Panzoom owns
 * the transform on the paper element alone. Keeping the two on separate
 * elements is what lets React keep rendering the toolbar while Panzoom
 * imperatively writes `style.transform` on the paper — a shared element would
 * have the two fighting over its `style` attribute.
 *
 * The fit scale is the one that brings the diagram inside the canvas width,
 * capped at the diagram's own size, so a small diagram is never enlarged. It
 * is also the floor: zooming out stops there, which is the view the unzoomed
 * fence already showed.
 *
 * @param props.tree - the rendered SVG tree, produced by {@link useMermaidDiagram}.
 * @param props.labels - localized zoom controls.
 * @returns the framed diagram with its zoom toolbar.
 */
export function MermaidViewport({ tree, labels }: { tree: ReactNode; labels: MermaidZoomLabels }) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const paperRef = useRef<HTMLDivElement | null>(null)
  // The fitted scale and its controller, or undefined while this diagram has no
  // measurable box. Every control no-ops in that state, so the toolbar is inert
  // on a diagram the browser has not laid out yet.
  const viewRef = useRef<{ zoom: ReturnType<typeof Panzoom>; fit: number } | undefined>(undefined)
  const [scale, setScale] = useState(1)
  const [canvasHeight, setCanvasHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    const paper = paperRef.current
    // Both divs render unconditionally, so React has attached both refs before
    // this first layout effect.
    /* v8 ignore next -- see above */
    if (canvas === null || paper === null) return
    // Measured before Panzoom writes a transform, so this is the diagram's own
    // layout box. A zero box has no meaningful fit: a hidden ancestor, a fence
    // that has not reached the viewport, or a render that has not settled.
    const width = paper.offsetWidth
    const height = paper.offsetHeight
    const available = canvas.clientWidth
    if (width === 0 || height === 0 || available === 0) return
    const fit = Math.min(1, available / width)
    const listeners = new AbortController()
    const zoom = Panzoom(paper, {
      canvas: true, startScale: fit, minScale: fit, maxScale: MAX_SCALE,
      animate: false, pinchAndPan: true,
    })
    viewRef.current = { zoom, fit }
    const report = (): void => { setScale(zoom.getScale()) }
    paper.addEventListener('panzoomchange', report, { signal: listeners.signal })
    // Panzoom binds pointer dragging on the paper's parent — the canvas — but
    // binds no wheel listener of its own, which is why the documentation viewer
    // wires one itself. Requiring the modifier here keeps an ordinary wheel
    // over a diagram scrolling the message stream, which is where a reader's
    // cursor usually is.
    const onWheel = (event: WheelEvent): void => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      zoom.zoomWithWheel(event)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    // The canvas clips the fitted diagram, so it reserves the fitted height
    // rather than the diagram's full layout height.
    setCanvasHeight(height * fit)
    setScale(fit)
    return () => {
      listeners.abort()
      canvas.removeEventListener('wheel', onWheel)
      zoom.destroy()
      viewRef.current = undefined
    }
  }, [tree])

  const reset = useCallback(() => {
    const view = viewRef.current
    if (view === undefined) return
    view.zoom.zoom(view.fit, { animate: false })
    view.zoom.pan(0, 0, { animate: false })
  }, [])

  return (
    <div className={css.mermaidFrame}>
      <div className={css.mermaidToolbar}>
        <span className={css.mermaidScale}>{Math.round(scale * 100)}%</span>
        <Tooltip label={labels.zoomOut} side="top" portal>
          <button
            type="button"
            className={css.mermaidAction}
            aria-label={labels.zoomOut}
            onClick={() => viewRef.current?.zoom.zoomOut({ animate: false })}
          >
            <IconZoomOutOutlineRegular size={14} />
          </button>
        </Tooltip>
        <Tooltip label={labels.zoomIn} side="top" portal>
          <button
            type="button"
            className={css.mermaidAction}
            aria-label={labels.zoomIn}
            onClick={() => viewRef.current?.zoom.zoomIn({ animate: false })}
          >
            <IconZoomInOutlineRegular size={14} />
          </button>
        </Tooltip>
        <Tooltip label={labels.reset} side="top" portal>
          <button type="button" className={css.mermaidAction} aria-label={labels.reset} onClick={reset}>
            <IconRefreshOutlineRegular size={14} />
          </button>
        </Tooltip>
      </div>
      <div className={css.mermaidCanvas} ref={canvasRef} style={canvasHeight === undefined ? undefined : { height: canvasHeight }}>
        {/* Panzoom writes this element's transform; it must carry no React style prop. */}
        <div className={css.mermaidPaper} ref={paperRef}>{tree}</div>
      </div>
    </div>
  )
}
