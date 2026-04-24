'use client'

import { useEffect, useState, useCallback } from 'react'
import { UserPlus, History, AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { ChargeurPage } from '@/components/admin/page-loader'
import {
  recupererUtilisateurs,
  assignerQuotaAdministrateur,
  recupererHistoriqueAssignationsQuota,
} from '@/lib/api/admin-service'
import type { Utilisateur, ColonneTable, ActionLigne, ConfigPagination, EntreeHistoriqueQuota } from '@/lib/types-admin'
import { formaterNombre, formaterDateHeure } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

const TAILLE_LISTE_SELECT = 200

export default function PageDocuments() {
  const [estChargement, setEstChargement] = useState(true)
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')

  const [modaleAssignerOuverte, setModaleAssignerOuverte] = useState(false)
  const [utilisateursPourSelect, setUtilisateursPourSelect] = useState<Utilisateur[]>([])
  const [chargementListeUtilisateurs, setChargementListeUtilisateurs] = useState(false)
  const [utilisateurCibleId, setUtilisateurCibleId] = useState<string>('')
  const [montantAssignation, setMontantAssignation] = useState('')
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false)
  const [erreurAssignation, setErreurAssignation] = useState<string | null>(null)

  const [modaleHistoriqueOuverte, setModaleHistoriqueOuverte] = useState(false)
  const [utilisateurHistorique, setUtilisateurHistorique] = useState<Utilisateur | null>(null)
  const [entreesHistorique, setEntreesHistorique] = useState<EntreeHistoriqueQuota[]>([])
  const [chargementHistorique, setChargementHistorique] = useState(false)

  const chargerUtilisateurs = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererUtilisateurs(pagination.page, pagination.parPage, {
      recherche,
      statut: 'tous',
    })

    if (reponse.succes && reponse.donnees) {
      setUtilisateurs(reponse.donnees)
      if (reponse.pagination) {
        setPagination(reponse.pagination)
      }
    }
    setEstChargement(false)
  }, [pagination.page, pagination.parPage, recherche])

  useEffect(() => {
    queueMicrotask(() => {
      void chargerUtilisateurs()
    })
  }, [chargerUtilisateurs])

  const chargerListePourSelect = useCallback(async () => {
    setChargementListeUtilisateurs(true)
    const reponse = await recupererUtilisateurs(1, TAILLE_LISTE_SELECT, { statut: 'tous' })
    if (reponse.succes && reponse.donnees) {
      setUtilisateursPourSelect(reponse.donnees)
    }
    setChargementListeUtilisateurs(false)
  }, [])

  const ouvrirModaleAssigner = (utilisateurParDefaut?: Utilisateur) => {
    setErreurAssignation(null)
    setMontantAssignation('')
    setUtilisateurCibleId(utilisateurParDefaut?.id ?? '')
    setModaleAssignerOuverte(true)
    void chargerListePourSelect()
  }

  const ouvrirModaleHistorique = async (u: Utilisateur) => {
    setUtilisateurHistorique(u)
    setModaleHistoriqueOuverte(true)
    setChargementHistorique(true)
    const reponse = await recupererHistoriqueAssignationsQuota(u.id)
    if (reponse.succes && reponse.donnees) {
      setEntreesHistorique(reponse.donnees)
    } else {
      setEntreesHistorique([])
    }
    setChargementHistorique(false)
  }

  const enregistrerAssignation = async () => {
    setErreurAssignation(null)
    if (!utilisateurCibleId) {
      setErreurAssignation('Sélectionnez un utilisateur.')
      return
    }
    const montant = Number.parseInt(montantAssignation, 10)
    setEnregistrementEnCours(true)
    const reponse = await assignerQuotaAdministrateur(utilisateurCibleId, montant)
    setEnregistrementEnCours(false)
    if (!reponse.succes) {
      setErreurAssignation(reponse.erreur ?? 'Une erreur est survenue.')
      return
    }
    setModaleAssignerOuverte(false)
    await chargerUtilisateurs()
  }

  const colonnes: ColonneTable<Utilisateur>[] = [
    {
      id: 'nomClient',
      label: 'Nom du client',
      largeur: '200px',
      accesseur: (u) => (
        <span className="font-medium text-foreground">
          {`${u.prenom} ${u.nom}`.trim()}
        </span>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      largeur: '240px',
      accesseur: (u) => <span className="text-sm text-muted-foreground">{u.email}</span>,
    },
    {
      id: 'quotaRestant',
      label: 'Quotas restants',
      largeur: '120px',
      accesseur: (u) => (
        <span className="font-medium tabular-nums text-foreground">
          {formaterNombre(Math.max(0, u.quotaTotal - u.quotaUtilise))}
        </span>
      ),
    },
    {
      id: 'progression',
      label: 'Utilisation',
      largeur: '200px',
      accesseur: (u) => {
        const denominateur = u.quotaTotal > 0 ? u.quotaTotal : 1
        const pourcentage = Math.round((u.quotaUtilise / denominateur) * 100)
        const estAlerte = pourcentage > 90
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={cn(estAlerte ? 'font-medium text-amber-600' : 'text-muted-foreground')}>
                {formaterNombre(u.quotaUtilise)} / {formaterNombre(u.quotaTotal)} ({pourcentage}%)
              </span>
              {estAlerte && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
            </div>
            <Progress
              value={Math.min(pourcentage, 100)}
              className={cn('h-2', estAlerte && '[&>div]:bg-amber-500')}
            />
          </div>
        )
      },
    },
  ]

  const actions: ActionLigne<Utilisateur>[] = [
    {
      id: 'assigner',
      label: 'Assigner',
      icone: UserPlus,
      onClick: (u) => ouvrirModaleAssigner(u),
    },
    {
      id: 'historique',
      label: 'Historique',
      icone: History,
      onClick: (u) => void ouvrirModaleHistorique(u),
    },
  ]

  if (estChargement && utilisateurs.length === 0) {
    return <ChargeurPage avecTable />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Quotas par utilisateur</h2>
          <p className="text-sm text-muted-foreground">Gérez les allocations de documents par client</p>
        </div>
        <Button type="button" variant="default" className="shrink-0" onClick={() => ouvrirModaleAssigner()}>
          Assigner un quota
        </Button>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          <TableDonnees
            colonnes={colonnes}
            donnees={utilisateurs}
            estChargement={estChargement}
            pagination={pagination}
            onChangementPage={(page) => setPagination((prev) => ({ ...prev, page }))}
            onChangementParPage={(parPage) =>
              setPagination((prev) => ({ ...prev, parPage, page: 1 }))
            }
            selectParPageAuDessusDuTableau
            aCoteSelectParPage={
              <ChampRecherche
                placeholder="Rechercher un utilisateur..."
                valeur={recherche}
                onChange={(terme) => {
                  setRecherche(terme)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
                className="min-w-0 w-full flex-1 sm:min-w-[220px] sm:max-w-md"
              />
            }
            actions={actions}
            idAccesseur={(u) => u.id}
            lignesParPageSkeleton={pagination.parPage}
          />
        </CardContent>
      </Card>

      <Dialog open={modaleAssignerOuverte} onOpenChange={setModaleAssignerOuverte}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assigner du quota</DialogTitle>
            <DialogDescription>
              Choisissez le client concerné et le nombre de quotas (documents) à ajouter à son enveloppe totale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="utilisateur-quota">Utilisateur</Label>
              <Select
                value={utilisateurCibleId || undefined}
                onValueChange={setUtilisateurCibleId}
                disabled={chargementListeUtilisateurs}
              >
                <SelectTrigger id="utilisateur-quota" className="w-full">
                  <SelectValue placeholder={chargementListeUtilisateurs ? 'Chargement…' : 'Sélectionner un utilisateur'} />
                </SelectTrigger>
                <SelectContent>
                  {utilisateursPourSelect.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {`${u.prenom} ${u.nom}`.trim()} — {u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="montant-quota">Nombre de quotas à assigner</Label>
              <Input
                id="montant-quota"
                type="number"
                min={1}
                step={1}
                placeholder="Ex. 500"
                value={montantAssignation}
                onChange={(e) => setMontantAssignation(e.target.value)}
              />
            </div>

            {erreurAssignation && <p className="text-sm text-destructive">{erreurAssignation}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModaleAssignerOuverte(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void enregistrerAssignation()} disabled={enregistrementEnCours}>
              {enregistrementEnCours ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={modaleHistoriqueOuverte} onOpenChange={setModaleHistoriqueOuverte}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Historique des assignations</DialogTitle>
            <DialogDescription>
              {utilisateurHistorique
                ? `Quota assigné manuellement à ${`${utilisateurHistorique.prenom} ${utilisateurHistorique.nom}`.trim()} (${utilisateurHistorique.email}).`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[min(360px,50vh)] overflow-y-auto rounded-md border border-border/40">
            {chargementHistorique ? (
              <p className="p-4 text-sm text-muted-foreground">Chargement…</p>
            ) : entreesHistorique.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Aucune assignation enregistrée pour ce client.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {entreesHistorique.map((e) => (
                  <li key={e.id} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">+{formaterNombre(e.montant)} quotas</p>
                      <p className="text-xs text-muted-foreground">Assignation manuelle</p>
                    </div>
                    <time className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formaterDateHeure(e.date)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModaleHistoriqueOuverte(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
