'use client';

import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Returns whether the viewport is mobile-sized.
 * `undefined` until the first client measurement so callers can avoid
 * painting the desktop layout and then remounting as a mobile sheet.
 */
export function useIsMobile(): boolean | undefined {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}