'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { recupererTransactionsUser } from '@/lib/api/user-service'
import type { TransactionUser } from '@/lib/types-user'
import type { ColonneTable, ConfigPagination } from '@/lib/types-admin'
import { formaterMontant, formaterDateHeure } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

function badgeStatutTransaction(statut: TransactionUser['statut']) {
  switch (statut) {
    case 'succes':
      return { label: 'Succès', badgeClass: 'bg-emerald-50 text-emerald-700' }
    case 'echec':
      return { label: 'Échec', badgeClass: 'bg-red-50 text-red-700' }
  }
}

export default function PageTransactions() {
  const [estChargement, setEstChargement] = useState(true)
  const [transactions, setTransactions] = useState<TransactionUser[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')

  const charger = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererTransactionsUser(pagination.page, pagination.parPage, {
      recherche,
      statut: 'tous',
    })
    if (reponse.succes && reponse.donnees) {
      setTransactions(reponse.donnees)
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

  const colonnes: ColonneTable<TransactionUser>[] = useMemo(
    () => [
      {
        id: 'date',
        label: 'Date et heure',
        largeur: '160px',
        accesseur: (t) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
            {formaterDateHeure(t.dateTransaction)}
          </span>
        ),
      },
      {
        id: 'montant',
        label: 'Montant (XOF)',
        accesseur: (t) => (
          <span className="font-medium text-foreground">{formaterMontant(t.montant, t.devise)}</span>
        ),
      },
      {
        id: 'methode',
        label: 'Méthode de paiement',
        accesseur: (t) => <span className="text-sm text-muted-foreground">{t.methodePaiement}</span>,
      },
      {
        id: 'statut',
        label: 'Statut',
        accesseur: (t) => {
          const cfg = badgeStatutTransaction(t.statut)
          return <Badge className={cn('border-0 text-[10px]', cfg.badgeClass)}>{cfg.label}</Badge>
        },
      },
      {
        id: 'reference',
        label: 'Référence',
        accesseur: (t) => (
          <code className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-xs text-foreground">{t.reference}</code>
        ),
      },
    ],
    [],
  )

  if (estChargement && transactions.length === 0) {
    return <ChargeurPageUser avecListe typeAffichage="liste" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Historique des transactions</h2>
          <p className="text-sm text-muted-foreground">Vos paiements et leur statut.</p>
        </div>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          <TableDonnees
            colonnes={colonnes}
            donnees={transactions}
            estChargement={estChargement}
            pagination={pagination.total > 0 ? pagination : undefined}
            onChangementPage={gererChangementPage}
            onChangementParPage={(parPage) => setPagination((p) => ({ ...p, parPage, page: 1 }))}
            selectParPageAuDessusDuTableau
            aCoteSelectParPage={
              <ChampRecherche
                placeholder="Référence, pack, paiement..."
                valeur={recherche}
                onChange={gererRecherche}
                className="min-w-0 w-full flex-1 sm:min-w-[220px] sm:max-w-md"
              />
            }
            idAccesseur={(t) => t.id}
            lignesParPageSkeleton={pagination.parPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
