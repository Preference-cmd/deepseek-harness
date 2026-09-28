// @vitest-environment jsdom
/**
 * The diagram viewport's fitted scale, its zoom controls, and its wheel gate.
 * jsdom has no layout and reports every box as zero, so the spec stubs the
 * measured properties and lets Panzoom run for real against those numbers.
 * Panzoom applies a transform and reports the new scale from a
 * `requestAnimationFrame` callback, so a scale that follows a control awaits
 * that frame; the initial fit does not, because the viewport sets it directly.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MermaidViewport } from '../src/markdown/mermaid.tsx'

const labels = { zoomIn: 'Zoom in', zoomOut: 'Zoom out', reset: 'Reset zoom' }
const diagram = <svg data-testid="diagram" />

/** The measured boxes the viewport fits against. */
let boxes: { paper: { width: number; height: number }; canvas: number } = { paper: { width: 0, height: 0 }, canvas: 0 }

function stubBox(property: 'offsetWidth' | 'offsetHeight' | 'clientWidth', own: string, read: () => number): void {
  Object.defineProperty(HTMLElement.prototype, property, {
    configurable: true,
    get(this: HTMLElement) { return this.className.includes(own) ? read() : 0 },
  })
}

/** Give the paper and canvas the layout a browser would have produced. */
function layOut(paper: { width: number; height: number }, canvas: number): void {
  boxes = { paper, canvas }
  stubBox('offsetWidth', 'mermaidPaper', () => boxes.paper.width)
  stubBox('offsetHeight', 'mermaidPaper', () => boxes.paper.height)
  stubBox('clientWidth', 'mermaidCanvas', () => boxes.canvas)
}

function scaleReadout(): string {
  return document.querySelector('[class*="mermaidScale"]')?.textContent ?? ''
}

function canvasOf(container: HTMLElement): HTMLElement {
  const canvas = container.querySelector<HTMLElement>('[class*="mermaidCanvas"]')
  if (canvas === null) throw new Error('the viewport rendered no canvas')
  return canvas
}

/**
 * Await one animation frame. Panzoom applies its transform and reports the new
 * scale from a `requestAnimationFrame` callback, so a scale that follows a
 * control lands on the next frame; the initial fit does not, because the
 * viewport sets it directly during layout.
 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => { requestAnimationFrame(() => { resolve() }) })
}

beforeEach(() => { layOut({ width: 800, height: 400 }, 400) })

afterEach(() => {
  cleanup()
  for (const property of ['offsetWidth', 'offsetHeight', 'clientWidth']) {
    Reflect.deleteProperty(HTMLElement.prototype, property)
  }
})

describe('MermaidViewport', () => {
  it('shrinks a diagram wider than the column to the fitted scale', () => {
    const { container } = render(<MermaidViewport tree={diagram} labels={labels} />)
    expect(screen.getByTestId('diagram')).toBeDefined()
    expect(scaleReadout()).toBe('50%')
    // The canvas reserves the fitted height, not the diagram's full 400px.
    expect(canvasOf(container).style.height).toBe('200px')
  })

  it('leaves a diagram narrower than the column at its own size', () => {
    layOut({ width: 200, height: 100 }, 400)
    const { container } = render(<MermaidViewport tree={diagram} labels={labels} />)
    expect(scaleReadout()).toBe('100%')
    expect(canvasOf(container).style.height).toBe('100px')
  })

  it('zooms in and back out, stopping at the fitted floor', async () => {
    render(<MermaidViewport tree={diagram} labels={labels} />)
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    await nextFrame()
    expect(scaleReadout()).not.toBe('50%')
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    await nextFrame()
    expect(scaleReadout()).toBe('50%')
    // 50% is the floor: the diagram is never shown smaller than it fits.
    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    await nextFrame()
    expect(scaleReadout()).toBe('50%')
  })

  it('returns to the fitted view from the reset control', async () => {
    render(<MermaidViewport tree={diagram} labels={labels} />)
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    await nextFrame()
    expect(scaleReadout()).not.toBe('50%')
    fireEvent.click(screen.getByRole('button', { name: 'Reset zoom' }))
    await nextFrame()
    expect(scaleReadout()).toBe('50%')
  })

  it('zooms on a modified wheel and leaves a plain wheel to the page', async () => {
    const { container } = render(<MermaidViewport tree={diagram} labels={labels} />)
    const canvas = canvasOf(container)
    // A reader's cursor is usually over the message stream, so a bare wheel
    // must keep scrolling the transcript rather than zoom the diagram.
    fireEvent.wheel(canvas, { deltaY: -100 })
    await nextFrame()
    expect(scaleReadout()).toBe('50%')
    fireEvent.wheel(canvas, { deltaY: -100, ctrlKey: true })
    await nextFrame()
    expect(scaleReadout()).not.toBe('50%')
    fireEvent.wheel(canvas, { deltaY: 100, metaKey: true })
    await nextFrame()
    expect(scaleReadout()).toBe('50%')
  })

  it('keeps every control inert while the diagram has no measurable box', () => {
    for (const box of [
      { paper: { width: 0, height: 400 }, canvas: 400 },
      { paper: { width: 800, height: 0 }, canvas: 400 },
      { paper: { width: 800, height: 400 }, canvas: 0 },
    ]) {
      layOut(box.paper, box.canvas)
      const { container, unmount } = render(<MermaidViewport tree={diagram} labels={labels} />)
      fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
      fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
      fireEvent.click(screen.getByRole('button', { name: 'Reset zoom' }))
      fireEvent.wheel(canvasOf(container), { deltaY: -100, ctrlKey: true })
      expect(scaleReadout()).toBe('100%')
      expect(canvasOf(container).style.height).toBe('')
      unmount()
    }
  })

  it('detaches the wheel gate and the controller when the diagram unmounts', async () => {
    const { container, unmount } = render(<MermaidViewport tree={diagram} labels={labels} />)
    const canvas = canvasOf(container)
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    await nextFrame()
    expect(scaleReadout()).not.toBe('50%')
    unmount()
    // The detached canvas no longer reaches a live controller, and React has
    // already dropped the readout, so nothing is reported.
    fireEvent.wheel(canvas, { deltaY: -100, ctrlKey: true })
    expect(scaleReadout()).toBe('')
  })
})
