'use client'

import { useEffect, useState, useCallback } from 'react'
import { Eye, RotateCcw, Download, CreditCard, Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { BadgeStatutTransaction } from '@/components/admin/status-badge'
import { ChargeurPage } from '@/components/admin/page-loader'
import { CarteStats } from '@/components/admin/stat-card'
import { recupererTransactions } from '@/lib/api/admin-service'
import { transactionsMock } from '@/lib/mock/donnees-transactions'
import type { Transaction, ColonneTable, ActionLigne, ConfigPagination, StatutTransaction } from '@/lib/types-admin'
import { formaterDateCourte, formaterMontant, formaterDateLongue } from '@/lib/utils/formatage'

export default function PageTransactions() {
  const [estChargement, setEstChargement] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<StatutTransaction | 'tous'>('tous')
  
  // Modale détail
  const [transactionSelectionnee, setTransactionSelectionnee] = useState<Transaction | null>(null)
  const [modaleDetailOuverte, setModaleDetailOuverte] = useState(false)

  // Statistiques calculées
  const statsTransactions = {
    total: transactionsMock.length,
    completes: transactionsMock.filter((t) => t.statut === 'complete').length,
    enAttente: transactionsMock.filter((t) => t.statut === 'en-attente').length,
    montantTotal: transactionsMock
      .filter((t) => t.statut === 'complete')
      .reduce((acc, t) => acc + t.montant, 0),
  }

  const chargerTransactions = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererTransactions(pagination.page, pagination.parPage, {
      recherche,
      statut: filtreStatut,
    })
    
    if (reponse.succes && reponse.donnees) {
      setTransactions(reponse.donnees)
      if (reponse.pagination) {
        setPagination(reponse.pagination)
      }
    }
    setEstChargement(false)
  }, [pagination.page, pagination.parPage, recherche, filtreStatut])

  useEffect(() => {
    chargerTransactions()
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
      id: 'reference',
      label: 'Référence',
      largeur: '140px',
      accesseur: (t) => (
        <span className="font-mono text-sm font-medium text-foreground">{t.reference}</span>
      ),
    },
    {
      id: 'utilisateur',
      label: 'Client',
      accesseur: (t) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{t.utilisateurNom}</span>
          <span className="text-xs text-muted-foreground">{t.utilisateurEmail}</span>
        </div>
      ),
    },
    {
      id: 'pack',
      label: 'Pack',
      largeur: '120px',
      accesseur: (t) => <span className="text-sm">{t.packNom}</span>,
    },
    {
      id: 'montant',
      label: 'Montant',
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
      id: 'date',
      label: 'Date',
      largeur: '120px',
      accesseur: (t) => (
        <span className="text-sm text-muted-foreground">{formaterDateCourte(t.dateTransaction)}</span>
      ),
    },
  ]

  const actions: ActionLigne<Transaction>[] = [
    {
      id: 'voir',
      label: 'Voir le détail',
      icone: Eye,
      onClick: (t) => {
        setTransactionSelectionnee(t)
        setModaleDetailOuverte(true)
      },
    },
    {
      id: 'rembourser',
      label: 'Rembourser',
      icone: RotateCcw,
      onClick: (t) => {
        // Action de remboursement
      },
      condition: (t) => t.statut === 'complete',
    },
    {
      id: 'telecharger',
      label: 'Télécharger facture',
      icone: Download,
      onClick: (t) => {
        // Téléchargement facture
      },
      condition: (t) => t.statut === 'complete',
    },
  ]

  if (estChargement && transactions.length === 0) {
    return <ChargeurPage avecCartes={4} avecTable />
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CarteStats
          titre="Total transactions"
          valeur={statsTransactions.total}
          icone={Receipt}
          couleur="bleu"
          delaiAnimation={0}
        />
        <CarteStats
          titre="Complétées"
          valeur={statsTransactions.completes}
          icone={CreditCard}
          couleur="vert"
          delaiAnimation={100}
        />
        <CarteStats
          titre="En attente"
          valeur={statsTransactions.enAttente}
          icone={Receipt}
          couleur="orange"
          delaiAnimation={200}
        />
        <CarteStats
          titre="Montant total"
          valeur={statsTransactions.montantTotal}
          format="montant"
          icone={CreditCard}
          couleur="violet"
          delaiAnimation={300}
        />
      </div>

      {/* Liste des transactions */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">Historique des transactions</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={filtreStatut}
              onValueChange={(val) => {
                setFiltreStatut(val as StatutTransaction | 'tous')
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="complete">Complétées</SelectItem>
                <SelectItem value="en-attente">En attente</SelectItem>
                <SelectItem value="echoue">Échouées</SelectItem>
                <SelectItem value="rembourse">Remboursées</SelectItem>
              </SelectContent>
            </Select>
            <ChampRecherche
              placeholder="Rechercher une transaction..."
              valeur={recherche}
              onChange={gererRecherche}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <TableDonnees
            colonnes={colonnes}
            donnees={transactions}
            estChargement={estChargement}
            pagination={pagination}
            onChangementPage={gererChangementPage}
            actions={actions}
            idAccesseur={(t) => t.id}
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

              {transactionSelectionnee.statut === 'complete' && (
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
