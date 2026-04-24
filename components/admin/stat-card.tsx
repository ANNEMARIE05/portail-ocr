'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CompteurAnime } from './animated-counter'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type CouleurCarte = 'bleu' | 'vert' | 'orange' | 'violet' | 'rose'

interface PropsCarteStats {
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

const couleursConfig: Record<CouleurCarte, { fond: string; icone: string }> = {
  bleu: { fond: 'bg-blue-50', icone: 'text-blue-600' },
  vert: { fond: 'bg-emerald-50', icone: 'text-emerald-600' },
  orange: { fond: 'bg-amber-50', icone: 'text-amber-600' },
  violet: { fond: 'bg-indigo-50', icone: 'text-indigo-600' },
  rose: { fond: 'bg-rose-50', icone: 'text-rose-600' },
}

export function CarteStats({
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
}: PropsCarteStats) {
  const config = couleursConfig[couleur]

  const valeurCompteur =
    format === 'pourcentage' ? valeur * 10 : valeur

  if (estChargement) {
    return (
      <Card className="h-full border-border/40 shadow-sm">
        <CardContent className="flex flex-col gap-1 p-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-20" />
          <div className="space-y-0.5">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-2.5 w-28" />
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
      <CardContent className="flex flex-col gap-1 p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="line-clamp-2 flex-1 text-left text-xs font-medium leading-snug text-muted-foreground sm:text-sm">
            {titre}
          </h3>
          <div
            className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', config.fond)}
            aria-hidden
          >
            <Icone className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', config.icone)} />
          </div>
        </div>
        <p className="text-xl font-semibold leading-none tracking-tight text-foreground tabular-nums sm:text-2xl">
          <CompteurAnime
            valeur={valeurCompteur}
            format={format}
            devise={devise}
            delai={delaiAnimation}
          />
        </p>
        <div className="flex flex-col gap-0 text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
          {renderVariation()}
          {description ? <p className="line-clamp-2">{description}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
