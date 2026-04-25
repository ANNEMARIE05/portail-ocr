'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface PropsChargeurPageUser {
  avecCartes?: number
  avecActions?: boolean
  avecListe?: boolean
  typeAffichage?: 'grille' | 'liste'
}

export function ChargeurPageUser({
  avecCartes = 0,
  avecActions = false,
  avecListe = false,
  typeAffichage = 'grille',
}: PropsChargeurPageUser) {
  return (
    <div className="space-y-2 animate-in fade-in duration-500 sm:space-y-4 md:space-y-6">
      {/* Cartes de statistiques */}
      {avecCartes > 0 && (
        <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-2 md:gap-3 lg:grid-cols-4">
          {Array.from({ length: avecCartes }).map((_, i) => (
            <Card 
              key={i} 
              className="border-border/40 overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardContent className="flex flex-col gap-1 p-2.5 sm:gap-1.5 sm:p-4">
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
          ))}
        </div>
      )}

      {/* Zone d'actions */}
      {avecActions && (
        <Card className="border-border/40 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-6 sm:p-10 md:p-12">
            <Skeleton className="h-16 w-16 rounded-xl mb-4" />
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      )}

      {/* Liste ou grille */}
      {avecListe && (
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent>
            {typeAffichage === 'grille' ? (
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 md:gap-4 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col gap-3 rounded-lg border border-border/40 p-4"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-4 rounded-lg border border-border/40 p-4"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Composant de chargement pour les cartes d'action
 */
export function ChargeurCarteAction() {
  return (
    <Card className="border-border/40 border-dashed animate-pulse">
      <CardContent className="flex flex-col items-center justify-center p-6 sm:p-10 md:p-12">
        <div className="mb-3 h-14 w-14 rounded-xl bg-slate-100 sm:mb-4 sm:h-16 sm:w-16" />
        <div className="h-6 w-48 rounded bg-slate-100 mb-2" />
        <div className="h-4 w-64 rounded bg-slate-100" />
      </CardContent>
    </Card>
  )
}

/**
 * Spinner de chargement
 */
export function SpinnerChargement({ taille = 'md', className }: { taille?: 'sm' | 'md' | 'lg'; className?: string }) {
  const tailles = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  }

  return (
    <div 
      className={cn(
        'rounded-full border-slate-200 border-t-slate-900 animate-spin',
        tailles[taille],
        className
      )}
    />
  )
}
