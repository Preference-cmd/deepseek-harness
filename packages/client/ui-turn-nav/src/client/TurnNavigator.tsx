import { memo, useCallback, useEffect, useRef, useState } from 'react'
import css from './TurnNavigator.module.css'

interface Turn {
  /** 1-based turn number */
  turn: number
  /** Optional label for the turn */
  label?: string
}

interface TurnNavigatorProps {
  /** Resolve the current session scrollport */
  getScrollport: () => HTMLElement | null
}

/**
 * A vertical rail displayed alongside the conversation scroll area,
 * showing loaded turn numbers and allowing quick navigation between them.
 */
export const TurnNavigator = memo(function TurnNavigator({
  getScrollport,
}: TurnNavigatorProps) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [activeTurn, setActiveTurn] = useState<number | undefined>()
  const observerRef = useRef<MutationObserver | null>(null)
  const rafRef = useRef<number>(0)

  // Scan the scrollport for turn markers and build the turn list
  const scanTurns = useCallback(() => {
    const scrollport = getScrollport()
    if (!scrollport) return

    const markers = scrollport.querySelectorAll<HTMLElement>('[data-chat-turn]')
    const seen = new Set<number>()
    const found: Turn[] = []

    markers.forEach((el) => {
      const raw = el.getAttribute('data-chat-turn')
      if (!raw) return
      const turn = parseInt(raw, 10)
      if (Number.isNaN(turn) || seen.has(turn)) return
      seen.add(turn)
      found.push({ turn })
    })

    // Sort ascending
    found.sort((a, b) => a.turn - b.turn)
    setTurns(found)
  }, [getScrollport])

  // Determine which turn is most visible in the viewport
  const updateActiveTurn = useCallback(() => {
    const scrollport = getScrollport()
    if (!scrollport || turns.length === 0) return

    const viewportRect = scrollport.getBoundingClientRect()
    const viewportMid = viewportRect.top + viewportRect.height / 2

    let closest: Turn | null = null
    let closestDist = Infinity

    turns.forEach((t) => {
      const el = scrollport.querySelector<HTMLElement>(
        `[data-chat-turn="${t.turn}"]`,
      )
      if (!el) return
      const rect = el.getBoundingClientRect()
      const dist = Math.abs(rect.top + rect.height / 2 - viewportMid)
      if (dist < closestDist) {
        closestDist = dist
        closest = t
      }
    })

    if (closest) setActiveTurn(closest.turn)
  }, [getScrollport, turns])

  // Set up MutationObserver to detect new turn markers
  useEffect(() => {
    const scrollport = getScrollport()
    if (!scrollport) return

    scanTurns()

    const observer = new MutationObserver(() => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(scanTurns)
    })
    observer.observe(scrollport, { childList: true, subtree: true, attributes: true })
    observerRef.current = observer

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [getScrollport, scanTurns])

  // Update active turn on scroll
  useEffect(() => {
    const scrollport = getScrollport()
    if (!scrollport) return

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(updateActiveTurn)
    }
    scrollport.addEventListener('scroll', onScroll, { passive: true })
    updateActiveTurn()

    return () => scrollport.removeEventListener('scroll', onScroll)
  }, [getScrollport, updateActiveTurn, turns])

  // Scroll to a specific turn
  const scrollToTurn = useCallback(
    (turn: number) => {
      const scrollport = getScrollport()
      if (!scrollport) return

      const el = scrollport.querySelector<HTMLElement>(
        `[data-chat-turn="${turn}"]`,
      )
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },
    [getScrollport],
  )

  if (turns.length === 0) return null

  return (
    <nav className={css.nav} aria-label="Turn navigation">
      {turns.map(({ turn, label }) => (
        <button
          key={turn}
          className={`${css.dot} ${turn === activeTurn ? css.active : ''}`}
          onClick={() => scrollToTurn(turn)}
          title={label ?? `Turn ${turn}`}
          aria-label={label ?? `Go to turn ${turn}`}
          data-turn-nav-turn={String(turn)}
        >
          <span className={css.label}>{turn}</span>
        </button>
      ))}
    </nav>
  )
})
