'use client'

import { useAnimatedNumber } from '@/hooks/use-animated-number'
import { formaterNombre, formaterNombreAbrege, formaterMontant } from '@/lib/utils/formatage'

interface PropsCompteurAnime {
  valeur: number
  format?: 'nombre' | 'abrege' | 'montant' | 'pourcentage' | 'duree'
  devise?: string
  duree?: number
  delai?: number
  className?: string
}

export function CompteurAnime({
  valeur,
  format = 'nombre',
  devise = 'XOF',
  duree = 1500,
  delai = 0,
  className,
}: PropsCompteurAnime) {
  const valeurAnimee = useAnimatedNumber(valeur, { duree, delai })

  const formaterValeur = () => {
    switch (format) {
      case 'abrege':
        return formaterNombreAbrege(valeurAnimee)
      case 'montant':
        return formaterMontant(valeurAnimee, devise)
      case 'pourcentage':
        return `${(valeurAnimee / 10).toFixed(1).replace('.', ',')}%`
      case 'duree':
        return `${valeurAnimee.toFixed(1).replace('.', ',')}\u00A0s`
      default:
        return formaterNombre(valeurAnimee)
    }
  }

  return <span className={className}>{formaterValeur()}</span>
}
