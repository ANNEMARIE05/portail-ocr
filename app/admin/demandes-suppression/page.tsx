'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Inbox, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ChargeurPage } from '@/components/admin/page-loader'
import { ChampRecherche } from '@/components/admin/search-input'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { BadgeStatutDemandeSuppression } from '@/components/admin/status-badge'
import { TableDonnees } from '@/components/admin/data-table'
import { recupererDemandesSuppression, traiterDemandeSuppression } from '@/lib/api/admin-service'
import type { ActionLigne, ColonneTable, ConfigPagination, DemandeSuppressionCompte } from '@/lib/types-admin'
import { formaterDateCourte } from '@/lib/utils/formatage'

export default function PageDemandesSuppression() {
  const [estChargement, setEstChargement] = useState(true)
  const [demandes, setDemandes] = useState<DemandeSuppressionCompte[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')

  const [demandeSelectionnee, setDemandeSelectionnee] = useState<DemandeSuppressionCompte | null>(null)
  const [modaleApprobationOuverte, setModaleApprobationOuverte] = useState(false)
  const [modaleRejetOuverte, setModaleRejetOuverte] = useState(false)
  const [actionEnCours, setActionEnCours] = useState(false)

  const chargerDemandes = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererDemandesSuppression(pagination.page, pagination.parPage, {
      recherche,
    })
    if (reponse.succes && reponse.donnees) {
      setDemandes(reponse.donnees)
      if (reponse.pagination) {
        setPagination(reponse.pagination)
      }
    }
    setEstChargement(false)
  }, [pagination.page, pagination.parPage, recherche])

  useEffect(() => {
    queueMicrotask(() => {
      void chargerDemandes()
    })
  }, [chargerDemandes])

  const gererChangementPage = (nouvellePage: number) => {
    setPagination((prev) => ({ ...prev, page: nouvellePage }))
  }

  const gererRecherche = (terme: string) => {
    setRecherche(terme)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const traiterDemande = async (decision: 'approuve' | 'rejete') => {
    if (!demandeSelectionnee) return

    setActionEnCours(true)
    const reponse = await traiterDemandeSuppression(
      demandeSelectionnee.id,
      decision,
      'Jean-Pierre Durand'
    )

    if (reponse.succes) {
      await chargerDemandes()
    }

    setActionEnCours(false)
    setModaleApprobationOuverte(false)
    setModaleRejetOuverte(false)
    setDemandeSelectionnee(null)
  }

  const colonnes: ColonneTable<DemandeSuppressionCompte>[] = useMemo(
    () => [
      {
        id: 'utilisateur',
        label: 'Utilisateur',
        accesseur: (d) => (
          <div className="flex min-w-0 max-w-[280px] flex-col gap-0.5">
            <span className="truncate font-medium text-foreground">{d.utilisateurNom}</span>
            <span className="truncate text-sm text-muted-foreground">{d.utilisateurEmail}</span>
          </div>
        ),
        classNameCellule: 'min-w-[12rem]',
      },
      {
        id: 'raison',
        label: 'Motif',
        accesseur: (d) => (
          <p className="whitespace-pre-line break-words text-sm text-foreground">
            {d.raison}
          </p>
        ),
        classNameCellule: 'max-w-md min-w-[12rem]',
      },
      {
        id: 'statut',
        label: 'Statut',
        accesseur: (d) => <BadgeStatutDemandeSuppression statut={d.statut} />,
        classNameCellule: 'whitespace-nowrap',
      },
      {
        id: 'datedemande',
        label: 'Date de création',
        accesseur: (d) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formaterDateCourte(d.datedemande)}
          </span>
        ),
      },
    ],
    []
  )

  const actionsLigne: ActionLigne<DemandeSuppressionCompte>[] = useMemo(
    () => [
      {
        id: 'confirmer',
        label: 'Confirmer la suppression',
        icone: Check,
        onClick: (d) => {
          setDemandeSelectionnee(d)
          setModaleApprobationOuverte(true)
        },
        condition: (d) => d.statut === 'en-attente',
      },
      {
        id: 'annuler',
        label: 'Annuler la demande',
        icone: X,
        onClick: (d) => {
          setDemandeSelectionnee(d)
          setModaleRejetOuverte(true)
        },
        condition: (d) => d.statut === 'en-attente',
      },
    ],
    []
  )

  if (estChargement && demandes.length === 0) {
    return <ChargeurPage avecTable />
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Demandes de suppression</h2>
        <p className="text-sm text-muted-foreground">
          Traitement des demandes de fermeture de compte (validation ou refus).
        </p>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          {pagination.total === 0 && !estChargement ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium">Aucune demande</h3>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                {recherche.trim()
                  ? 'Aucun résultat pour cette recherche. Modifiez les termes ou effacez la recherche.'
                  : 'Il n’y a aucune demande de suppression pour le moment.'}
              </p>
            </div>
          ) : (
            <TableDonnees
              colonnes={colonnes}
              donnees={demandes}
              estChargement={estChargement}
              pagination={pagination}
              onChangementPage={gererChangementPage}
              onChangementParPage={(parPage) =>
                setPagination((prev) => ({ ...prev, parPage, page: 1 }))
              }
              selectParPageAuDessusDuTableau
              aCoteSelectParPage={
                <ChampRecherche
                  placeholder="Rechercher par nom, email, motif…"
                  valeur={recherche}
                  onChange={gererRecherche}
                  className="min-w-0 w-full flex-1 sm:min-w-[220px] sm:max-w-md"
                />
              }
              actions={actionsLigne}
              idAccesseur={(d) => d.id}
              lignesParPageSkeleton={pagination.parPage}
            />
          )}
        </CardContent>
      </Card>

      <ModaleConfirmation
        estOuverte={modaleApprobationOuverte}
        onFermer={() => {
          setModaleApprobationOuverte(false)
          setDemandeSelectionnee(null)
        }}
        onConfirmer={() => traiterDemande('approuve')}
        titre="Confirmer la suppression du compte"
        description={`Vous allez approuver la suppression définitive du compte de ${demandeSelectionnee?.utilisateurNom} (${demandeSelectionnee?.utilisateurEmail}). Toutes les données associées seront supprimées.`}
        texteConfirmation="Confirmer la suppression"
        variante="destructive"
        estChargement={actionEnCours}
      />

      <ModaleConfirmation
        estOuverte={modaleRejetOuverte}
        onFermer={() => {
          setModaleRejetOuverte(false)
          setDemandeSelectionnee(null)
        }}
        onConfirmer={() => traiterDemande('rejete')}
        titre="Annuler la demande"
        description={`Annuler la demande de suppression pour ${demandeSelectionnee?.utilisateurNom} ? L'utilisateur conservera son compte et sera notifié.`}
        texteConfirmation="Annuler la demande"
        estChargement={actionEnCours}
      />
    </div>
  )
}
