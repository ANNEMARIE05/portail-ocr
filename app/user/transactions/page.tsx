'use client'

import { useEffect, useState } from 'react'
import { Search, Download, CreditCard, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { recupererTransactionsUser } from '@/lib/api/user-service'
import type { TransactionUser } from '@/lib/types-user'
import { formaterMontant, formaterDateCourte } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageTransactions() {
  const [estChargement, setEstChargement] = useState(true)
  const [transactions, setTransactions] = useState<TransactionUser[]>([])
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      const reponse = await recupererTransactionsUser(1, 20)
      
      if (reponse.succes && reponse.donnees) {
        setTransactions(reponse.donnees)
      }
      
      setEstChargement(false)
    }

    chargerDonnees()
  }, [])

  if (estChargement) {
    return <ChargeurPageUser avecListe typeAffichage="liste" />
  }

  const transactionsFiltrees = transactions.filter(t => 
    t.reference.toLowerCase().includes(recherche.toLowerCase()) ||
    t.packNom.toLowerCase().includes(recherche.toLowerCase())
  )

  const getStatutConfig = (statut: TransactionUser['statut']) => {
    switch (statut) {
      case 'complete':
        return {
          icone: CheckCircle2,
          couleur: 'text-emerald-600',
          bg: 'bg-emerald-50',
          label: 'Complete',
          badgeClass: 'bg-emerald-50 text-emerald-700',
        }
      case 'en-attente':
        return {
          icone: Clock,
          couleur: 'text-amber-600',
          bg: 'bg-amber-50',
          label: 'En attente',
          badgeClass: 'bg-amber-50 text-amber-700',
        }
      case 'echoue':
        return {
          icone: XCircle,
          couleur: 'text-red-600',
          bg: 'bg-red-50',
          label: 'Echone',
          badgeClass: 'bg-red-50 text-red-700',
        }
      case 'rembourse':
        return {
          icone: RefreshCw,
          couleur: 'text-blue-600',
          bg: 'bg-blue-50',
          label: 'Rembourse',
          badgeClass: 'bg-blue-50 text-blue-700',
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <Card className="border-slate-200/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Rechercher par reference ou pack..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="pl-10 border-slate-200"
              />
            </div>
            <Button variant="outline" className="gap-2 border-slate-200">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des transactions */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Historique des transactions</CardTitle>
          <CardDescription>{transactionsFiltrees.length} transaction{transactionsFiltrees.length > 1 ? 's' : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactionsFiltrees.map((transaction, index) => {
              const statutConfig = getStatutConfig(transaction.statut)
              const StatutIcone = statutConfig.icone
              
              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 rounded-lg border border-slate-200/60 p-4 transition-all hover:bg-slate-50/50 hover:border-slate-300/60 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Icone */}
                  <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", statutConfig.bg)}>
                    <CreditCard className={cn("h-5 w-5", statutConfig.couleur)} />
                  </div>
                  
                  {/* Infos transaction */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900">{transaction.packNom}</p>
                      <Badge className={cn("text-[10px] border-0", statutConfig.badgeClass)}>
                        {statutConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <code className="font-mono">{transaction.reference}</code>
                      <span>{formaterDateCourte(transaction.dateTransaction)}</span>
                      <span>{transaction.methodePaiement}</span>
                    </div>
                  </div>
                  
                  {/* Montant et credits */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {formaterMontant(transaction.montant, transaction.devise)}
                    </p>
                    <p className="text-xs text-emerald-600">+{transaction.credits} credits</p>
                  </div>
                  
                  {/* Actions */}
                  <Button variant="ghost" size="sm" className="shrink-0">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
          
          {transactionsFiltrees.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Aucune transaction trouvee</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
