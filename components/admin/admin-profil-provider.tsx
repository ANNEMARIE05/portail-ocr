'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { chargerProfilAdmin } from '@/lib/api/auth-api'
import { estBackendAdminConfigure } from '@/lib/api/env-backend'
import {
  donneesProfilAdminSessionVides,
  lireDonneesProfilAdminSession,
  lireJetonBearer,
  type DonneesProfilAdminSession,
} from '@/lib/api/session-client'

type ContexteValeur = {
  donnees: DonneesProfilAdminSession
  estChargement: boolean
  recharger: () => Promise<void>
}

const Ctx = createContext<ContexteValeur | null>(null)

export function AdminProfilProvider({ children }: { children: ReactNode }) {
  // Ne pas lire la session au premier rendu : le SSR n’a pas localStorage, le client si → décalage d’hydratation.
  const [donnees, setDonnees] = useState<DonneesProfilAdminSession>(donneesProfilAdminSessionVides)
  const [estChargement, setEstChargement] = useState(true)

  const recharger = useCallback(async () => {
    if (estBackendAdminConfigure()) {
      const t = lireJetonBearer()
      if (t) {
        await chargerProfilAdmin(t)
      }
    }
    setDonnees(lireDonneesProfilAdminSession())
  }, [])

  useEffect(() => {
    void (async () => {
      setEstChargement(true)
      await recharger()
      setEstChargement(false)
    })()
  }, [recharger])

  const value = useMemo(
    () => ({ donnees, estChargement, recharger }),
    [donnees, estChargement, recharger],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAdminProfil() {
  const c = useContext(Ctx)
  if (!c) {
    throw new Error('useAdminProfil doit être utilisé dans AdminProfilProvider')
  }
  return c
}
