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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Cartes de statistiques */}
      {avecCartes > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: avecCartes }).map((_, i) => (
            <Card 
              key={i} 
              className="border-slate-200/60 overflow-hidden"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-11 w-11 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Zone d'actions */}
      {avecActions && (
        <Card className="border-slate-200/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Skeleton className="h-16 w-16 rounded-xl mb-4" />
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      )}

      {/* Liste ou grille */}
      {avecListe && (
        <Card className="border-slate-200/60">
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col gap-3 rounded-lg border border-slate-200/60 p-4"
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
                    className="flex items-center gap-4 rounded-lg border border-slate-200/60 p-4"
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
    <Card className="border-slate-200/60 border-dashed animate-pulse">
      <CardContent className="flex flex-col items-center justify-center p-12">
        <div className="h-16 w-16 rounded-xl bg-slate-100 mb-4" />
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
