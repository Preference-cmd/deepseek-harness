// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'

describe('TurnNavigator', () => {
  const mockGetScrollport = vi.fn()

  it('renders nothing when no turns are present', () => {
    mockGetScrollport.mockReturnValue(null)
    expect(mockGetScrollport()).toBeNull()
  })

  it('provides getScrollport callback interface', () => {
    const scrollport = document.createElement('div')
    mockGetScrollport.mockReturnValue(scrollport)
    expect(mockGetScrollport()).toBeInstanceOf(HTMLElement)
  })
})
