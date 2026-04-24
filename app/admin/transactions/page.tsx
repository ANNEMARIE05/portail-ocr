'use client'

import { useEffect, useState, useCallback } from 'react'
import { RotateCcw, Download } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { BadgeStatutTransaction } from '@/components/admin/status-badge'
import { ChargeurPage } from '@/components/admin/page-loader'
import { recupererTransactions } from '@/lib/api/admin-service'
import type { Transaction, ColonneTable, ConfigPagination } from '@/lib/types-admin'
import { formaterDateCourte, formaterMontant, formaterDateLongue } from '@/lib/utils/formatage'

export default function PageTransactions() {
  const [estChargement, setEstChargement] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')

  // Modale détail
  const [transactionSelectionnee, setTransactionSelectionnee] = useState<Transaction | null>(null)
  const [modaleDetailOuverte, setModaleDetailOuverte] = useState(false)

  const chargerTransactions = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererTransactions(pagination.page, pagination.parPage, {
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
      void chargerTransactions()
    })
  }, [chargerTransactions])

  const gererChangementPage = (nouvellePage: number) => {
    setPagination((prev) => ({ ...prev, page: nouvellePage }))
  }

  const gererRecherche = (terme: string) => {
    setRecherche(terme)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const colonnes: ColonneTable<Transaction>[] = [
    {
      id: 'date',
      label: 'Date',
      largeur: '120px',
      accesseur: (t) => (
        <span className="text-sm text-muted-foreground">{formaterDateCourte(t.dateTransaction)}</span>
      ),
    },
    {
      id: 'utilisateur',
      label: 'Utilisateur',
      accesseur: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{t.utilisateurNom}</span>
          <span className="text-xs text-muted-foreground">{t.utilisateurEmail}</span>
        </div>
      ),
    },
    {
      id: 'methodePaiement',
      label: 'Méthode de paiement',
      largeur: '140px',
      accesseur: (t) => <span className="text-sm text-muted-foreground">{t.methodePaiement}</span>,
    },
    {
      id: 'montant',
      label: 'Montant (XOF)',
      largeur: '100px',
      accesseur: (t) => (
        <span className="font-medium text-foreground">{formaterMontant(t.montant, t.devise)}</span>
      ),
    },
    {
      id: 'statut',
      label: 'Statut',
      largeur: '120px',
      accesseur: (t) => <BadgeStatutTransaction statut={t.statut} />,
    },
    {
      id: 'reference',
      label: 'Référence',
      largeur: '140px',
      accesseur: (t) => (
        <span className="font-mono text-sm font-medium text-foreground">{t.reference}</span>
      ),
    },
  ]

  if (estChargement && transactions.length === 0) {
    return <ChargeurPage avecTable />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Historique des transactions</h2>
          <p className="text-sm text-muted-foreground">Paiements et achats — recherche par référence ou libellé.</p>
        </div>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          <TableDonnees
            colonnes={colonnes}
            donnees={transactions}
            estChargement={estChargement}
            pagination={pagination}
            onChangementPage={gererChangementPage}
            onChangementParPage={(parPage) =>
              setPagination((prev) => ({ ...prev, parPage, page: 1 }))
            }
            selectParPageAuDessusDuTableau
            aCoteSelectParPage={
              <ChampRecherche
                placeholder="Rechercher une transaction..."
                valeur={recherche}
                onChange={gererRecherche}
                className="min-w-0 w-full flex-1 sm:min-w-[220px] sm:max-w-md"
              />
            }
            idAccesseur={(t) => t.id}
            onLigneClick={(t) => {
              setTransactionSelectionnee(t)
              setModaleDetailOuverte(true)
            }}
            lignesParPageSkeleton={pagination.parPage}
          />
        </CardContent>
      </Card>

      {/* Modale détail transaction */}
      <Dialog open={modaleDetailOuverte} onOpenChange={setModaleDetailOuverte}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de la transaction</DialogTitle>
            <DialogDescription>
              {transactionSelectionnee?.reference}
            </DialogDescription>
          </DialogHeader>
          {transactionSelectionnee && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-foreground">
                  {formaterMontant(transactionSelectionnee.montant, transactionSelectionnee.devise)}
                </div>
                <BadgeStatutTransaction statut={transactionSelectionnee.statut} />
              </div>

              <div className="space-y-4 rounded-lg border border-border/40 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{transactionSelectionnee.utilisateurNom}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{transactionSelectionnee.utilisateurEmail}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pack acheté</span>
                  <span className="font-medium">{transactionSelectionnee.packNom}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Méthode de paiement</span>
                  <span className="font-medium">{transactionSelectionnee.methodePaiement}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{formaterDateLongue(transactionSelectionnee.dateTransaction)}</span>
                </div>
              </div>

              {transactionSelectionnee.statut === 'succes' && (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Facture
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Rembourser
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
