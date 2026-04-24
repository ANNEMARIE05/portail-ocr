'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnimatedNumber } from '@/hooks/use-animated-number'
import { formaterNombre, formaterNombreAbrege, formaterMontant } from '@/lib/utils/formatage'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type CouleurCarte = 'bleu' | 'vert' | 'orange' | 'violet' | 'rose'

const couleursConfig: Record<CouleurCarte, { fond: string; icone: string }> = {
  bleu: { fond: 'bg-blue-50', icone: 'text-blue-600' },
  vert: { fond: 'bg-emerald-50', icone: 'text-emerald-600' },
  orange: { fond: 'bg-amber-50', icone: 'text-amber-600' },
  violet: { fond: 'bg-indigo-50', icone: 'text-indigo-600' },
  rose: { fond: 'bg-rose-50', icone: 'text-rose-600' },
}

interface PropsCarteStatUser {
  titre: string
  valeur: number
  format?: 'nombre' | 'abrege' | 'montant' | 'pourcentage' | 'duree'
  devise?: string
  variation?: number
  icone: React.ComponentType<{ className?: string }>
  couleur?: CouleurCarte
  estChargement?: boolean
  delaiAnimation?: number
  description?: string
}

export function CarteStatUser({
  titre,
  valeur,
  format = 'nombre',
  devise,
  variation,
  icone: Icone,
  couleur = 'bleu',
  estChargement = false,
  delaiAnimation = 0,
  description,
}: PropsCarteStatUser) {
  const valeurAnimee = useAnimatedNumber(valeur, { duree: 1500, delai: delaiAnimation })
  const config = couleursConfig[couleur]

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

  if (estChargement) {
    return (
      <Card className="h-full border-border/40 shadow-sm">
        <CardContent className="flex flex-col gap-1.5 p-4">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-24" />
          <div className="mt-0.5 space-y-1">
            <Skeleton className="h-2.5 w-36" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderVariation = () => {
    if (variation === undefined) return null

    const estPositif = variation > 0
    const estNeutre = variation === 0

    return (
      <p
        className={cn(
          'flex flex-wrap items-center gap-x-1 text-[11px] leading-tight',
          estNeutre && 'text-muted-foreground',
          estPositif && 'text-emerald-600',
          !estPositif && !estNeutre && 'text-red-600'
        )}
      >
        {estNeutre ? (
          <Minus className="h-3.5 w-3.5 shrink-0" />
        ) : estPositif ? (
          <TrendingUp className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="font-medium tabular-nums">
          {estPositif ? '+' : ''}
          {variation.toFixed(1).replace('.', ',')}%
        </span>
        <span className="text-muted-foreground font-normal">vs mois précédent</span>
      </p>
    )
  }

  return (
    <Card className="h-full border-border/40 transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-left text-sm font-medium leading-tight text-muted-foreground">
            {titre}
          </h3>
          <div
            className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', config.fond)}
            aria-hidden
          >
            <Icone className={cn('h-4 w-4', config.icone)} />
          </div>
        </div>
        <p className="text-2xl font-semibold leading-none tracking-tight text-foreground tabular-nums sm:text-[1.75rem]">
          {formaterValeur()}
        </p>
        <div className="flex min-h-0 flex-col gap-0.5 text-[11px] text-muted-foreground">
          {renderVariation()}
          {description ? <p className="line-clamp-1 leading-tight">{description}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
