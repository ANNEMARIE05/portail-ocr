'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Hook qui effectue un scroll vers le haut à chaque changement de page
 */
export function useScrollToTop(enabled: boolean = true) {
  const pathname = usePathname()

  useEffect(() => {
    if (enabled) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [pathname, enabled])
}
