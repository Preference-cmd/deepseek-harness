import { memo, useCallback, useEffect, useRef, useState } from 'react'

interface Turn {
  turn: number
  label?: string
}

interface TurnNavigatorProps {
  getScrollport: () => HTMLElement | null
}

const styles = {
  nav: {
    position: 'absolute' as const,
    right: 4,
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    zIndex: 10,
    padding: '8px 0',
  },
  dot: {
    width: 24,
    height: 18,
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    fontSize: 9,
    fontWeight: 600,
    color: '#6b7280',
  },
  active: {
    background: '#3b82f6',
    color: '#fff',
  },
}

export const TurnNavigator = memo(function TurnNavigator({
  getScrollport,
}: TurnNavigatorProps) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [activeTurn, setActiveTurn] = useState<number | undefined>()
  const observerRef = useRef<MutationObserver | null>(null)
  const rafRef = useRef<number>(0)

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

    found.sort((a, b) => a.turn - b.turn)
    setTurns(found)
  }, [getScrollport])

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
    <nav style={styles.nav} aria-label="Turn navigation">
      {turns.map(({ turn, label }) => (
        <button
          key={turn}
          style={{
            ...styles.dot,
            ...(turn === activeTurn ? styles.active : {}),
          }}
          onClick={() => scrollToTurn(turn)}
          title={label ?? `Turn ${turn}`}
          aria-label={label ?? `Go to turn ${turn}`}
          data-turn-nav-turn={String(turn)}
        >
          <span>{turn}</span>
        </button>
      ))}
    </nav>
  )
})
