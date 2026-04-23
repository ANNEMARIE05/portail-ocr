'use client'

import { useEffect, useState, useRef } from 'react'

interface OptionsAnimation {
  duree?: number
  delai?: number
  easing?: (t: number) => number
}

// Fonction d'easing pour une animation fluide
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

/**
 * Hook qui anime une transition de nombre de 0 vers une valeur cible
 */
export function useAnimatedNumber(
  valeurCible: number,
  options: OptionsAnimation = {}
): number {
  const { duree = 1500, delai = 0, easing = easeOutExpo } = options
  const [valeurActuelle, setValeurActuelle] = useState(0)
  const animationRef = useRef<number | null>(null)
  const debutRef = useRef<number | null>(null)

  useEffect(() => {
    // Annuler l'animation précédente si elle existe
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const demarrerAnimation = () => {
      const animer = (timestamp: number) => {
        if (!debutRef.current) {
          debutRef.current = timestamp
        }

        const progression = Math.min((timestamp - debutRef.current) / duree, 1)
        const valeurAnimee = Math.floor(easing(progression) * valeurCible)
        
        setValeurActuelle(valeurAnimee)

        if (progression < 1) {
          animationRef.current = requestAnimationFrame(animer)
        } else {
          setValeurActuelle(valeurCible)
        }
      }

      animationRef.current = requestAnimationFrame(animer)
    }

    if (delai > 0) {
      const timeout = setTimeout(demarrerAnimation, delai)
      return () => {
        clearTimeout(timeout)
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    } else {
      demarrerAnimation()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [valeurCible, duree, delai, easing])

  return valeurActuelle
}

/**
 * Hook qui anime un pourcentage
 */
export function useAnimatedPercentage(
  valeurCible: number,
  options: OptionsAnimation = {}
): string {
  const valeur = useAnimatedNumber(valeurCible * 10, options)
  return (valeur / 10).toFixed(1).replace('.', ',')
}
