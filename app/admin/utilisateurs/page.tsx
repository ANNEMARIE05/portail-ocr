'use client'

import { useEffect, useState, useCallback } from 'react'
import { Eye, Edit, Trash2, Ban, CheckCircle, Mail, Phone, Building2, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
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
import { ModaleFormulaire, type ChampFormulaire } from '@/components/admin/form-modal'
import { ModaleDetail, type SectionDetail } from '@/components/admin/detail-modal'
import { ChargeurPage } from '@/components/admin/page-loader'
import { recupererUtilisateurs, modifierStatutUtilisateur } from '@/lib/api/admin-service'
import type { Utilisateur, ColonneTable, ActionLigne, ConfigPagination, StatutUtilisateur } from '@/lib/types-admin'
import { formaterDateCourte, formaterDateRelative, genererInitiales, formaterTelephone, formaterNombre } from '@/lib/utils/formatage'

const champsFormulaireUtilisateur: ChampFormulaire[] = [
  { id: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Jean', required: true },
  { id: 'nom', label: 'Nom', type: 'text', placeholder: 'Dupont', required: true },
  { id: 'email', label: 'Email', type: 'email', placeholder: 'jean.dupont@example.com', required: true },
  { id: 'telephone', label: 'Téléphone', type: 'tel', placeholder: '+225 07 00 00 00 00', required: true },
  { id: 'entreprise', label: 'Entreprise', type: 'text', placeholder: 'Nom de l\'entreprise', required: true },
  { id: 'quotaTotal', label: 'Quota initial', type: 'number', placeholder: '1000', required: true, min: 0 },
  { 
    id: 'statut', 
    label: 'Statut', 
    type: 'select', 
    required: true,
    options: [
      { value: 'actif', label: 'Actif' },
      { value: 'inactif', label: 'Inactif' },
      { value: 'suspendu', label: 'Suspendu' },
    ]
  },
]

export default function PageUtilisateurs() {
  const [estChargement, setEstChargement] = useState(true)
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState<StatutUtilisateur | 'tous'>('tous')
  
  // Modales
  const [utilisateurSelectionne, setUtilisateurSelectionne] = useState<Utilisateur | null>(null)
  const [modaleCreationOuverte, setModaleCreationOuverte] = useState(false)
  const [modaleModificationOuverte, setModaleModificationOuverte] = useState(false)
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

  const gererCreation = async (donnees: Record<string, string | number | boolean>) => {
    const nouvelUtilisateur: Utilisateur = {
      id: `user-${Date.now()}`,
      prenom: String(donnees.prenom),
      nom: String(donnees.nom),
      email: String(donnees.email),
      telephone: String(donnees.telephone),
      entreprise: String(donnees.entreprise),
      dateInscription: new Date(),
      derniereConnexion: new Date(),
      statut: donnees.statut as StatutUtilisateur,
      quotaTotal: Number(donnees.quotaTotal),
      quotaUtilise: 0,
    }
    setUtilisateurs((prev) => [nouvelUtilisateur, ...prev])
  }

  const gererModification = async (donnees: Record<string, string | number | boolean>) => {
    if (!utilisateurSelectionne) return
    
    const utilisateurMisAJour = {
      ...utilisateurSelectionne,
      prenom: String(donnees.prenom),
      nom: String(donnees.nom),
      email: String(donnees.email),
      telephone: String(donnees.telephone),
      entreprise: String(donnees.entreprise),
      quotaTotal: Number(donnees.quotaTotal),
      statut: donnees.statut as StatutUtilisateur,
    }
    
    setUtilisateurs((prev) =>
      prev.map((u) => (u.id === utilisateurSelectionne.id ? utilisateurMisAJour : u))
    )
  }

  const gererSuppression = () => {
    if (!utilisateurSelectionne) return
    setUtilisateurs((prev) => prev.filter((u) => u.id !== utilisateurSelectionne.id))
    setModaleSuppressionOuverte(false)
    setUtilisateurSelectionne(null)
  }

  const getSectionsDetail = (utilisateur: Utilisateur): SectionDetail[] => [
    {
      titre: 'Informations personnelles',
      champs: [
        { id: 'nom', label: 'Nom complet', valeur: `${utilisateur.prenom} ${utilisateur.nom}` },
        { id: 'email', label: 'Email', valeur: utilisateur.email },
        { id: 'telephone', label: 'Téléphone', valeur: formaterTelephone(utilisateur.telephone) },
        { id: 'entreprise', label: 'Entreprise', valeur: utilisateur.entreprise },
      ],
    },
    {
      titre: 'Quota',
      champs: [
        { id: 'quotaUtilise', label: 'Documents utilisés', valeur: formaterNombre(utilisateur.quotaUtilise) },
        { id: 'quotaTotal', label: 'Quota total', valeur: formaterNombre(utilisateur.quotaTotal) },
        { 
          id: 'progression', 
          label: 'Utilisation', 
          valeur: `${Math.round((utilisateur.quotaUtilise / utilisateur.quotaTotal) * 100)}%`,
          type: 'custom',
        },
      ],
    },
    {
      titre: 'Statut et activité',
      champs: [
        { 
          id: 'statut', 
          label: 'Statut', 
          valeur: utilisateur.statut === 'actif' ? 'Actif' : utilisateur.statut === 'inactif' ? 'Inactif' : 'Suspendu',
          type: 'badge',
          couleurBadge: utilisateur.statut === 'actif' ? 'success' : utilisateur.statut === 'suspendu' ? 'destructive' : 'secondary'
        },
        { id: 'dateInscription', label: 'Inscrit le', valeur: formaterDateCourte(utilisateur.dateInscription) },
        { id: 'derniereConnexion', label: 'Dernière connexion', valeur: formaterDateRelative(utilisateur.derniereConnexion) },
      ],
    },
  ]

  const colonnes: ColonneTable<Utilisateur>[] = [
    {
      id: 'utilisateur',
      label: 'Utilisateur',
      largeur: '250px',
      accesseur: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
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
      id: 'modifier',
      label: 'Modifier',
      icone: Edit,
      onClick: (u) => {
        setUtilisateurSelectionne(u)
        setModaleModificationOuverte(true)
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
            <Button onClick={() => setModaleCreationOuverte(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Nouvel utilisateur
            </Button>
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

      {/* Modale de création */}
      <ModaleFormulaire
        estOuverte={modaleCreationOuverte}
        onFermer={() => setModaleCreationOuverte(false)}
        onSoumettre={gererCreation}
        titre="utilisateur"
        description="Créez un nouveau compte utilisateur"
        champs={champsFormulaireUtilisateur}
        texteValidation="Créer l'utilisateur"
        mode="creation"
      />

      {/* Modale de modification */}
      <ModaleFormulaire
        estOuverte={modaleModificationOuverte}
        onFermer={() => {
          setModaleModificationOuverte(false)
          setUtilisateurSelectionne(null)
        }}
        onSoumettre={gererModification}
        titre="utilisateur"
        description="Modifiez les informations de l'utilisateur"
        champs={champsFormulaireUtilisateur}
        texteValidation="Enregistrer"
        donneesInitiales={utilisateurSelectionne ? {
          prenom: utilisateurSelectionne.prenom,
          nom: utilisateurSelectionne.nom,
          email: utilisateurSelectionne.email,
          telephone: utilisateurSelectionne.telephone,
          entreprise: utilisateurSelectionne.entreprise,
          quotaTotal: utilisateurSelectionne.quotaTotal,
          statut: utilisateurSelectionne.statut,
        } : undefined}
        mode="modification"
      />

      {/* Modale détail utilisateur */}
      {utilisateurSelectionne && (
        <ModaleDetail
          estOuverte={modaleDetailOuverte}
          onFermer={() => {
            setModaleDetailOuverte(false)
            setUtilisateurSelectionne(null)
          }}
          titre="Détails de l'utilisateur"
          description="Informations complètes du compte"
          sections={getSectionsDetail(utilisateurSelectionne)}
          entete={
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-xl font-medium text-primary">
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
          }
          actions={
            <Button onClick={() => {
              setModaleDetailOuverte(false)
              setModaleModificationOuverte(true)
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          }
        />
      )}

      {/* Modale de suppression */}
      <ModaleConfirmation
        estOuverte={modaleSuppressionOuverte}
        onFermer={() => {
          setModaleSuppressionOuverte(false)
          setUtilisateurSelectionne(null)
        }}
        onConfirmer={gererSuppression}
        titre="Supprimer l'utilisateur"
        description={`Êtes-vous sûr de vouloir supprimer le compte de ${utilisateurSelectionne?.prenom} ${utilisateurSelectionne?.nom} ? Cette action est irréversible.`}
        texteConfirmation="Supprimer"
        variante="destructive"
        estChargement={actionEnCours}
      />
    </div>
  )
}
