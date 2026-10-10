// @vitest-environment jsdom
/**
 * The `mermaid` fence's handoff to the engine. The engine writes label markup as
 * HTML inside `<foreignObject>`, so a payload can carry `<br>` — well-formed
 * HTML that no XML parse accepts, and the fence must still draw the diagram.
 * Payloads the engine cannot turn into an SVG keep the fence's code fallback.
 */
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MarkdownText } from '../src/index.ts'
import { markdownLabels } from './labels.client.ts'

const engine = vi.hoisted(() => ({
  render: vi.fn<(id: string, source: string) => Promise<{ svg: string }>>(),
}))

vi.mock('mermaid', () => ({
  default: { initialize: (): void => {}, render: engine.render },
}))

const FENCE = ['```mermaid', 'flowchart TD', '    A[one] --> B[two]', '```'].join('\n')

/** Render the settled fence and hand back the markdown container. */
function renderFence(): HTMLElement {
  return render(<MarkdownText text={FENCE} labels={markdownLabels} />).container
}

/** The engine's rendered diagram, identifiable by the id it minted. */
function diagram(container: HTMLElement): Element | null {
  return container.querySelector('svg[id^="dsh-mermaid-"]')
}

afterEach(() => {
  cleanup()
  engine.render.mockReset()
})

describe('the mermaid fence', () => {
  it('draws a diagram whose labels carry an HTML line break', async () => {
    engine.render.mockImplementation((id: string) => Promise.resolve({
      svg: `<svg id="${id}" xmlns="http://www.w3.org/2000/svg">`
        + '<foreignObject><p>one<br>two</p></foreignObject></svg>',
    }))
    const container = renderFence()
    await waitFor(() => { expect(diagram(container)).not.toBeNull() })
    // The void element and both label halves survive into the React tree
    // instead of failing the parse and degrading the fence to a code block.
    expect(container.querySelector('br')).not.toBeNull()
    expect(container.querySelector('foreignObject p')?.textContent).toBe('onetwo')
  })

  it('keeps the code fallback when the payload holds no SVG', async () => {
    engine.render.mockImplementation(() => Promise.resolve({ svg: '<div>not a diagram</div>' }))
    const container = renderFence()
    await waitFor(() => { expect(engine.render).toHaveBeenCalledTimes(1) })
    await waitFor(() => { expect(container.querySelector('pre')).not.toBeNull() })
    expect(diagram(container)).toBeNull()
  })

  it('keeps the code fallback when the engine rejects the source', async () => {
    engine.render.mockImplementation(() => Promise.reject(new Error('Parse error on line 2')))
    const container = renderFence()
    await waitFor(() => { expect(engine.render).toHaveBeenCalledTimes(1) })
    await waitFor(() => { expect(container.querySelector('pre')).not.toBeNull() })
    expect(diagram(container)).toBeNull()
  })
})
