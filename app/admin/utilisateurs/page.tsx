'use client'

import { useEffect, useState, useCallback } from 'react'
import { Eye, Edit, Trash2, Ban, CheckCircle, Mail, Phone, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
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
import { BadgeStatutUtilisateur } from '@/components/admin/status-badge'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { ChargeurPage } from '@/components/admin/page-loader'
import { recupererUtilisateurs, modifierStatutUtilisateur } from '@/lib/api/admin-service'
import type { Utilisateur, ColonneTable, ActionLigne, ConfigPagination, StatutUtilisateur } from '@/lib/types-admin'
import { formaterDateCourte, formaterDateRelative, genererInitiales, formaterTelephone, formaterNombre } from '@/lib/utils/formatage'

export default function PageUtilisateurs() {
  const [estChargement, setEstChargement] = useState(true)
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<StatutUtilisateur | 'tous'>('tous')
  
  // Modales
  const [utilisateurSelectionne, setUtilisateurSelectionne] = useState<Utilisateur | null>(null)
  const [modaleDetailOuverte, setModaleDetailOuverte] = useState(false)
  const [modaleSuppressionOuverte, setModaleSuppressionOuverte] = useState(false)
  const [actionEnCours, setActionEnCours] = useState(false)

  const chargerUtilisateurs = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererUtilisateurs(pagination.page, pagination.parPage, {
      recherche,
      statut: filtreStatut,
    })
    
    if (reponse.succes && reponse.donnees) {
      setUtilisateurs(reponse.donnees)
      if (reponse.pagination) {
        setPagination(reponse.pagination)
      }
    }
    setEstChargement(false)
  }, [pagination.page, pagination.parPage, recherche, filtreStatut])

  useEffect(() => {
    chargerUtilisateurs()
  }, [chargerUtilisateurs])

  const gererChangementPage = (nouvellePage: number) => {
    setPagination((prev) => ({ ...prev, page: nouvellePage }))
  }

  const gererRecherche = (terme: string) => {
    setRecherche(terme)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const gererChangementStatut = async (utilisateur: Utilisateur, nouveauStatut: StatutUtilisateur) => {
    setActionEnCours(true)
    const reponse = await modifierStatutUtilisateur(utilisateur.id, nouveauStatut)
    if (reponse.succes) {
      await chargerUtilisateurs()
    }
    setActionEnCours(false)
  }

  const colonnes: ColonneTable<Utilisateur>[] = [
    {
      id: 'utilisateur',
      label: 'Utilisateur',
      largeur: '250px',
      accesseur: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-slate-100 text-sm font-medium text-slate-600">
              {genererInitiales(u.prenom, u.nom)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{u.prenom} {u.nom}</span>
            <span className="text-xs text-muted-foreground">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'entreprise',
      label: 'Entreprise',
      accesseur: (u) => <span className="text-sm text-muted-foreground">{u.entreprise}</span>,
    },
    {
      id: 'quota',
      label: 'Quota',
      largeur: '180px',
      accesseur: (u) => {
        const pourcentage = Math.round((u.quotaUtilise / u.quotaTotal) * 100)
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {formaterNombre(u.quotaUtilise)} / {formaterNombre(u.quotaTotal)}
              </span>
              <span className="font-medium">{pourcentage}%</span>
            </div>
            <Progress value={pourcentage} className="h-1.5" />
          </div>
        )
      },
    },
    {
      id: 'statut',
      label: 'Statut',
      largeur: '100px',
      accesseur: (u) => <BadgeStatutUtilisateur statut={u.statut} />,
    },
    {
      id: 'derniereConnexion',
      label: 'Dernière connexion',
      largeur: '150px',
      accesseur: (u) => (
        <span className="text-sm text-muted-foreground">{formaterDateRelative(u.derniereConnexion)}</span>
      ),
    },
  ]

  const actions: ActionLigne<Utilisateur>[] = [
    {
      id: 'voir',
      label: 'Voir le détail',
      icone: Eye,
      onClick: (u) => {
        setUtilisateurSelectionne(u)
        setModaleDetailOuverte(true)
      },
    },
    {
      id: 'activer',
      label: 'Activer',
      icone: CheckCircle,
      onClick: (u) => gererChangementStatut(u, 'actif'),
      condition: (u) => u.statut !== 'actif',
    },
    {
      id: 'suspendre',
      label: 'Suspendre',
      icone: Ban,
      onClick: (u) => gererChangementStatut(u, 'suspendu'),
      condition: (u) => u.statut !== 'suspendu',
    },
    {
      id: 'supprimer',
      label: 'Supprimer',
      icone: Trash2,
      variante: 'destructive',
      onClick: (u) => {
        setUtilisateurSelectionne(u)
        setModaleSuppressionOuverte(true)
      },
    },
  ]

  if (estChargement && utilisateurs.length === 0) {
    return <ChargeurPage avecTable />
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">Liste des utilisateurs</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={filtreStatut}
              onValueChange={(val) => {
                setFiltreStatut(val as StatutUtilisateur | 'tous')
                setPagination((prev) => ({ ...prev, page: 1 }))
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actifs</SelectItem>
                <SelectItem value="inactif">Inactifs</SelectItem>
                <SelectItem value="suspendu">Suspendus</SelectItem>
              </SelectContent>
            </Select>
            <ChampRecherche
              placeholder="Rechercher un utilisateur..."
              valeur={recherche}
              onChange={gererRecherche}
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <TableDonnees
            colonnes={colonnes}
            donnees={utilisateurs}
            estChargement={estChargement}
            pagination={pagination}
            onChangementPage={gererChangementPage}
            actions={actions}
            idAccesseur={(u) => u.id}
          />
        </CardContent>
      </Card>

      {/* Modale détail utilisateur */}
      <Dialog open={modaleDetailOuverte} onOpenChange={setModaleDetailOuverte}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de l&apos;utilisateur</DialogTitle>
            <DialogDescription>Informations complètes du compte</DialogDescription>
          </DialogHeader>
          {utilisateurSelectionne && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-slate-100 text-xl font-medium text-slate-600">
                    {genererInitiales(utilisateurSelectionne.prenom, utilisateurSelectionne.nom)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {utilisateurSelectionne.prenom} {utilisateurSelectionne.nom}
                  </h3>
                  <BadgeStatutUtilisateur statut={utilisateurSelectionne.statut} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{utilisateurSelectionne.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{formaterTelephone(utilisateurSelectionne.telephone)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{utilisateurSelectionne.entreprise}</span>
                </div>
              </div>

              <div className="rounded-lg border border-border/40 p-4 space-y-3">
                <h4 className="text-sm font-medium">Utilisation du quota</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Documents utilisés</span>
                    <span className="font-medium">
                      {formaterNombre(utilisateurSelectionne.quotaUtilise)} / {formaterNombre(utilisateurSelectionne.quotaTotal)}
                    </span>
                  </div>
                  <Progress
                    value={(utilisateurSelectionne.quotaUtilise / utilisateurSelectionne.quotaTotal) * 100}
                    className="h-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Inscrit le</span>
                  <p className="font-medium">{formaterDateCourte(utilisateurSelectionne.dateInscription)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dernière connexion</span>
                  <p className="font-medium">{formaterDateRelative(utilisateurSelectionne.derniereConnexion)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modale de suppression */}
      <ModaleConfirmation
        estOuverte={modaleSuppressionOuverte}
        onFermer={() => setModaleSuppressionOuverte(false)}
        onConfirmer={() => {
          setModaleSuppressionOuverte(false)
          // Simulation de suppression
        }}
        titre="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer le compte de ${utilisateurSelectionne?.prenom} ${utilisateurSelectionne?.nom} ? Cette action est irréversible.`}
        texteConfirmation="Supprimer"
        variante="destructive"
        estChargement={actionEnCours}
      />
    </div>
  )
}
