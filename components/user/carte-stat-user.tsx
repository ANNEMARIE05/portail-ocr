'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnimatedNumber } from '@/hooks/use-animated-number'
import { formaterNombre, formaterNombreAbrege, formaterMontant } from '@/lib/utils/formatage'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

type VarianteCarte = 'defaut' | 'accent' | 'gradient'

interface PropsCarteStatUser {
  titre: string
  valeur: number
  format?: 'nombre' | 'abrege' | 'montant' | 'pourcentage'
  devise?: string
  variation?: number
  icone: React.ComponentType<{ className?: string }>
  variante?: VarianteCarte
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
  variante = 'defaut',
  estChargement = false,
  delaiAnimation = 0,
  description,
}: PropsCarteStatUser) {
  const valeurAnimee = useAnimatedNumber(valeur, { duree: 1500, delai: delaiAnimation })

  const formaterValeur = () => {
    switch (format) {
      case 'abrege':
        return formaterNombreAbrege(valeurAnimee)
      case 'montant':
        return formaterMontant(valeurAnimee, devise)
      case 'pourcentage':
        return `${(valeurAnimee / 10).toFixed(1).replace('.', ',')}%`
      default:
        return formaterNombre(valeurAnimee)
    }
  }

  if (estChargement) {
    return (
      <Card className="border-slate-200/60 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-11 w-11 rounded-lg" />
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
          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
          estNeutre && 'bg-slate-100 text-slate-600',
          estPositif && 'bg-emerald-50 text-emerald-600',
          !estPositif && !estNeutre && 'bg-red-50 text-red-600'
        )}
      >
        {estNeutre ? (
          <Minus className="h-3 w-3" />
        ) : estPositif ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        <span>
          {estPositif ? '+' : ''}
          {variation.toFixed(1).replace('.', ',')}%
        </span>
      </div>
    )
  }

  return (
    <Card 
      className={cn(
        'group relative overflow-hidden border-slate-200/60 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        variante === 'accent' && 'border-l-4 border-l-slate-900',
        variante === 'gradient' && 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0'
      )}
      style={{ 
        animationDelay: `${delaiAnimation}ms`,
      }}
    >
      {/* Decoration subtile */}
      {variante === 'defaut' && (
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-slate-100/50 transition-transform duration-500 group-hover:scale-150" />
      )}
      
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-1">
            <p className={cn(
              'text-sm font-medium',
              variante === 'gradient' ? 'text-slate-300' : 'text-slate-500'
            )}>
              {titre}
            </p>
            <p className={cn(
              'text-2xl font-semibold tracking-tight',
              variante === 'gradient' ? 'text-white' : 'text-slate-900'
            )}>
              {formaterValeur()}
            </p>
            <div className="flex items-center gap-2 pt-1">
              {renderVariation()}
              {description && (
                <span className={cn(
                  'text-xs',
                  variante === 'gradient' ? 'text-slate-400' : 'text-slate-400'
                )}>
                  {description}
                </span>
              )}
            </div>
          </div>
          <div className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110',
            variante === 'gradient' ? 'bg-white/10' : 'bg-slate-100'
          )}>
            <Icone className={cn(
              'h-5 w-5',
              variante === 'gradient' ? 'text-white' : 'text-slate-600'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
