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
  format?: 'nombre' | 'abrege' | 'montant' | 'pourcentage'
  devise?: string
  variation?: number
  icone: React.ComponentType<{ className?: string }>
  couleur?: CouleurCarte
  estChargement?: boolean
  delaiAnimation?: number
}

const couleursConfig: Record<CouleurCarte, { fond: string; icone: string; texte: string }> = {
  bleu: {
    fond: 'bg-blue-50',
    icone: 'text-blue-600',
    texte: 'text-blue-700',
  },
  vert: {
    fond: 'bg-emerald-50',
    icone: 'text-emerald-600',
    texte: 'text-emerald-700',
  },
  orange: {
    fond: 'bg-amber-50',
    icone: 'text-amber-600',
    texte: 'text-amber-700',
  },
  violet: {
    fond: 'bg-indigo-50',
    icone: 'text-indigo-600',
    texte: 'text-indigo-700',
  },
  rose: {
    fond: 'bg-rose-50',
    icone: 'text-rose-600',
    texte: 'text-rose-700',
  },
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
}: PropsCarteStats) {
  const config = couleursConfig[couleur]

  if (estChargement) {
    return (
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-md" />
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
      <div
        className={cn(
          'flex items-center gap-1 text-sm font-medium',
          estNeutre && 'text-muted-foreground',
          estPositif && 'text-emerald-600',
          !estPositif && !estNeutre && 'text-red-600'
        )}
      >
        {estNeutre ? (
          <Minus className="h-3.5 w-3.5" />
        ) : estPositif ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" />
        )}
        <span>
          {estPositif ? '+' : ''}
          {variation.toFixed(1).replace('.', ',')}%
        </span>
        <span className="text-muted-foreground font-normal">vs mois dernier</span>
      </div>
    )
  }

  return (
    <Card className="border-border/40 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{titre}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              <CompteurAnime
                valeur={format === 'pourcentage' ? valeur * 10 : valeur}
                format={format}
                devise={devise}
                delai={delaiAnimation}
              />
            </p>
            <div className="pt-1">{renderVariation()}</div>
          </div>
          <div className={cn('rounded-md p-3', config.fond)}>
            <Icone className={cn('h-6 w-6', config.icone)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
