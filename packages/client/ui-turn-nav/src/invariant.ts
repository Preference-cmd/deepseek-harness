declare global {
  interface Window {
    __DSH_TURN_NAV__?: boolean
  }
}

if (typeof window !== 'undefined') {
  window.__DSH_TURN_NAV__ = true
}

export {}
