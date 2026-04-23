'use client'

import { useState, useCallback } from 'react'

interface EtatChargement<T> {
  donnees: T | null
  estChargement: boolean
  erreur: string | null
}

interface RetourHook<T> {
  donnees: T | null
  estChargement: boolean
  erreur: string | null
  charger: () => Promise<void>
  reinitialiser: () => void
}

/**
 * Hook pour gérer les états de chargement de manière centralisée
 */
export function useEtatChargement<T>(
  fonctionChargement: () => Promise<{ succes: boolean; donnees?: T; erreur?: string }>
): RetourHook<T> {
  const [etat, setEtat] = useState<EtatChargement<T>>({
    donnees: null,
    estChargement: false,
    erreur: null,
  })

  const charger = useCallback(async () => {
    setEtat(prev => ({ ...prev, estChargement: true, erreur: null }))
    
    try {
      const reponse = await fonctionChargement()
      
      if (reponse.succes && reponse.donnees) {
        setEtat({
          donnees: reponse.donnees,
          estChargement: false,
          erreur: null,
        })
      } else {
        setEtat({
          donnees: null,
          estChargement: false,
          erreur: reponse.erreur || 'Une erreur est survenue',
        })
      }
    } catch (error) {
      setEtat({
        donnees: null,
        estChargement: false,
        erreur: error instanceof Error ? error.message : 'Une erreur est survenue',
      })
    }
  }, [fonctionChargement])

  const reinitialiser = useCallback(() => {
    setEtat({
      donnees: null,
      estChargement: false,
      erreur: null,
    })
  }, [])

  return {
    ...etat,
    charger,
    reinitialiser,
  }
}

/**
 * Hook simplifié pour un état de chargement booléen
 */
export function useChargement(initial: boolean = false): [boolean, (val: boolean) => void] {
  const [estChargement, setEstChargement] = useState(initial)
  return [estChargement, setEstChargement]
}
