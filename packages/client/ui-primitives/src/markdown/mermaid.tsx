/**
 * Mermaid source to React, following the KaTeX renderer in `katex.tsx`: the
 * engine emits an SVG string, the browser's own HTML parser turns it into a
 * tree, and this module maps that tree onto React elements. The mermaid engine
 * sanitizes its output at `securityLevel: 'strict'` (scripts and event
 * handlers removed); the DOM-to-React mapping additionally drops every
 * `on*` attribute and `javascript:` URL, so no raw engine string reaches
 * `dangerouslySetInnerHTML`.
 *
 * The engine loads lazily: `mermaid` is an ~84MB unpacked dependency, so the
 * first settled mermaid fence imports it once and every later fence reuses
 * the same module promise. While loading — or when the source does not
 * parse — the caller keeps its code-block fallback, the same degradation
 * every other fence gets.
 */

import { createElement, useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

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
 * Render Mermaid source to a React SVG tree.
 * @param value - the fence's source text, without the trailing newline the
 * code-block path appends for display trimming.
 * @returns the rendered diagram, null while the engine loads, or undefined
 * when the source does not parse (the caller keeps its code fallback).
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
          const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml')
          if (parsed.querySelector('parsererror') !== null) {
            setTree(undefined)
            return
          }
          const root = parsed.documentElement
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
