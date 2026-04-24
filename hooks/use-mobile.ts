import * as React from 'react'

const MOBILE_BREAKPOINT = 768
const MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function souscrireMobile(onChangement: () => void) {
  const mql = window.matchMedia(MEDIA_QUERY)
  mql.addEventListener('change', onChangement)
  return () => mql.removeEventListener('change', onChangement)
}

function lireMobile(): boolean {
  return window.matchMedia(MEDIA_QUERY).matches
}

function lireMobileCoteServeur(): boolean {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(souscrireMobile, lireMobile, lireMobileCoteServeur)
}
