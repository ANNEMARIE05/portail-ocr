'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Clock, HelpCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { chargerRecuRetourPaiement, type DonneesRecuPaiement } from '@/lib/api/user-service'
import { EVENEMENT_RAFRAICHIR_QUOTA_USER } from '@/lib/user-quota-refresh'
import { formaterDateCourte, formaterMontant, formaterNombre } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

function ContenuRecuPaiement() {
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()
  const [estChargement, setEstChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [recu, setRecu] = useState<DonneesRecuPaiement | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        setEstChargement(true)
        setErreur(null)
        setRecu(null)
        const params = new URLSearchParams(queryString)
        const reponse = await chargerRecuRetourPaiement(params)
        setEstChargement(false)
        if (!reponse.succes) {
          setErreur(reponse.erreur)
          return
        }
        setRecu(reponse.donnees)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(EVENEMENT_RAFRAICHIR_QUOTA_USER))
        }
      })()
    })
  }, [queryString])

  if (estChargement) {
    return <ChargeurPageUser avecListe={false} />
  }

  if (erreur) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Impossible d’afficher le reçu</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <p>{erreur}</p>
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link href="/user/achats">Retour aux achats</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!recu) {
    return null
  }

  const IconeStatut =
    recu.statut === 'succes'
      ? CheckCircle2
      : recu.statut === 'echec'
        ? XCircle
        : recu.statut === 'en-attente'
          ? Clock
          : HelpCircle
  const couleurIcone =
    recu.statut === 'succes'
      ? 'text-emerald-600'
      : recu.statut === 'echec'
        ? 'text-red-600'
        : recu.statut === 'en-attente'
          ? 'text-amber-600'
          : 'text-slate-500'

  const varianteBadge =
    recu.statut === 'succes'
      ? 'default' as const
      : recu.statut === 'echec'
        ? ('destructive' as const)
        : recu.statut === 'en-attente'
          ? ('secondary' as const)
          : ('outline' as const)

  return (
    <div className="mx-auto max-w-lg space-y-3 sm:space-y-5 md:space-y-6">
      <div className="text-center space-y-1 pb-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Retour de paiement</h2>
        <p className="text-sm text-slate-500">Récapitulatif et solde de quotas mis à jour.</p>
      </div>

      <Card className="overflow-hidden border-border/40 shadow-md">
        <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-start gap-3">
            <IconeStatut className={cn('h-10 w-10 shrink-0', couleurIcone)} aria-hidden />
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-lg leading-tight">Reçu</CardTitle>
              <CardDescription>
                Les montants reflètent les données du serveur au moment du chargement.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Statut du paiement</span>
            <Badge variant={varianteBadge}>{recu.libelleStatut}</Badge>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vos quotas</p>
            <p className="text-2xl font-bold tabular-nums text-slate-900">
              {formaterNombre(recu.creditsRestants)} <span className="text-base font-semibold text-slate-600">restants</span>
            </p>
            <p className="text-sm text-slate-600">
              Total du compte :{' '}
              <span className="font-semibold tabular-nums text-slate-900">{formaterNombre(recu.creditsTotal)}</span>
              {' — '}
              Déjà utilisés :{' '}
              <span className="font-semibold tabular-nums text-slate-900">{formaterNombre(recu.creditsUtilises)}</span>
            </p>
          </div>

          {recu.transaction ? (
            <div className="space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Détail de la transaction</p>
              <p>
                Référence :{' '}
                <span className="font-mono text-xs text-slate-800">
                  {recu.transaction.reference || recu.transaction.id || '—'}
                </span>
              </p>
              <p>
                Montant :{' '}
                <span className="font-medium text-slate-900">
                  {formaterMontant(recu.transaction.montant, recu.transaction.devise)}
                </span>
              </p>
              <p>Date : {formaterDateCourte(recu.transaction.dateTransaction)}</p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/user/achats">Acheter d’autres quotas</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/user/transactions">Mes transactions</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PageRetourPaiement() {
  return (
    <Suspense fallback={<ChargeurPageUser avecListe={false} />}>
      <ContenuRecuPaiement />
    </Suspense>
  )
}
