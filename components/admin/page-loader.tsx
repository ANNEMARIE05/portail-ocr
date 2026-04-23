'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface PropsChargeurPage {
  avecCartes?: number
  avecTable?: boolean
  avecGraphique?: boolean
}

export function ChargeurPage({
  avecCartes = 0,
  avecTable = false,
  avecGraphique = false,
}: PropsChargeurPage) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* En-tête de page */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Cartes de statistiques */}
      {avecCartes > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: avecCartes }).map((_, i) => (
            <Card key={i} className="border-border/40">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Graphique */}
      {avecGraphique && (
        <Card className="border-border/40">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {avecTable && (
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* En-tête de table */}
              <div className="flex gap-4 border-b pb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
              {/* Lignes de table */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 py-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-4 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Squelette pour une ligne de table
 */
export function LigneTableSkeleton({ colonnes = 5 }: { colonnes?: number }) {
  return (
    <div className="flex gap-4 py-4 border-b border-border/40">
      {Array.from({ length: colonnes }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  )
}
