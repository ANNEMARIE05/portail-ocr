'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { recupererHistoriqueAppels } from '@/lib/api/user-service'
import type { HistoriqueAppel } from '@/lib/types-user'
import type { ColonneTable, ConfigPagination } from '@/lib/types-admin'
import { formaterDateHeure } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageHistorique() {
  const [estChargement, setEstChargement] = useState(true)
  const [historique, setHistorique] = useState<HistoriqueAppel[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')

  const charger = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererHistoriqueAppels(pagination.page, pagination.parPage, {
      recherche,
      statutHttp: 'tous',
    })
    if (reponse.succes && reponse.donnees) {
      setHistorique(reponse.donnees)
      if (reponse.pagination) {
        setPagination(reponse.pagination)
      }
    }
    setEstChargement(false)
  }, [pagination.page, pagination.parPage, recherche])

  useEffect(() => {
    queueMicrotask(() => {
      void charger()
    })
  }, [charger])

  const gererRecherche = useCallback((terme: string) => {
    setRecherche(terme)
    setPagination((p) => ({ ...p, page: 1 }))
  }, [])

  const gererChangementPage = (nouvellePage: number) => {
    setPagination((p) => ({ ...p, page: nouvellePage }))
  }

  const colonnes: ColonneTable<HistoriqueAppel>[] = useMemo(
    () => [
      {
        id: 'endpoint',
        label: 'Endpoint',
        accesseur: (appel) => (
          <code className="block min-w-0 truncate font-mono text-sm font-medium text-foreground">
            {appel.endpoint}
          </code>
        ),
      },
      {
        id: 'statut',
        label: 'Statut',
        largeur: '100px',
        accesseur: (appel) => (
          <Badge
            variant="secondary"
            className={cn(
              'border-0 font-mono text-xs',
              appel.statut >= 200 && appel.statut < 300 && 'bg-emerald-50 text-emerald-700',
              appel.statut >= 400 && appel.statut < 500 && 'bg-amber-50 text-amber-700',
              appel.statut >= 500 && 'bg-red-50 text-red-700',
            )}
          >
            {appel.statut}
          </Badge>
        ),
      },
      {
        id: 'latence',
        label: 'Latence (ms)',
        largeur: '120px',
        accesseur: (appel) => (
          <span className="font-mono text-sm tabular-nums text-muted-foreground">{appel.latence}</span>
        ),
      },
      {
        id: 'timestamp',
        label: 'Timestamp',
        largeur: '160px',
        accesseur: (appel) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formaterDateHeure(appel.dateAppel)}
          </span>
        ),
      },
    ],
    [],
  )

  if (estChargement && historique.length === 0) {
    return <ChargeurPageUser avecListe typeAffichage="liste" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Historique des appels API</h2>
          <p className="text-sm text-muted-foreground">
            Journal des appels API — recherche par URL, méthode ou message d&apos;erreur.
          </p>
        </div>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          <TableDonnees
            colonnes={colonnes}
            donnees={historique}
            estChargement={estChargement}
            pagination={pagination.total > 0 ? pagination : undefined}
            onChangementPage={gererChangementPage}
            onChangementParPage={(parPage) => setPagination((p) => ({ ...p, parPage, page: 1 }))}
            selectParPageAuDessusDuTableau
            aCoteSelectParPage={
              <ChampRecherche
                placeholder="URL, verbe HTTP ou message d'erreur…"
                valeur={recherche}
                onChange={gererRecherche}
                className="min-w-0 w-full flex-1 sm:min-w-[220px] sm:max-w-md"
                aria-label={"Rechercher dans l'historique des appels"}
              />
            }
            idAccesseur={(h) => h.id}
            lignesParPageSkeleton={pagination.parPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
