'use client'

import { useEffect, useState, useCallback } from 'react'
import { Eye, Edit, Trash2, Ban, CheckCircle, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { BadgeStatutUtilisateur } from '@/components/admin/status-badge'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { ModaleFormulaire, type ChampFormulaire } from '@/components/admin/form-modal'
import { ModaleDetail, type SectionDetail } from '@/components/admin/detail-modal'
import { ChargeurPage } from '@/components/admin/page-loader'
import {
  creerUtilisateur,
  modifierStatutUtilisateur,
  modifierUtilisateur,
  recupererUtilisateurs,
  supprimerUtilisateur,
} from '@/lib/api/admin-service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Utilisateur, ColonneTable, ActionLigne, ConfigPagination, StatutUtilisateur } from '@/lib/types-admin'
import { formaterDateCourte, separerPrenomNom, genererInitiales, formaterTelephone, formaterNombre } from '@/lib/utils/formatage'

const optionsRoleUtilisateur = [
  { value: 'Utilisateur', label: 'Utilisateur' },
  { value: 'Gestionnaire', label: 'Gestionnaire' },
  { value: 'Comptable', label: 'Comptable' },
  { value: 'Collaborateur', label: 'Collaborateur' },
]

const champsFormulaireCreation: ChampFormulaire[] = [
  {
    id: 'nomComplet',
    label: 'Nom',
    type: 'text',
    placeholder: 'Ex. Marie Durand',
    required: true,
  },
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'marie.durand@example.com',
    required: true,
  },
  {
    id: 'role',
    label: 'Rôle',
    type: 'select',
    required: true,
    options: optionsRoleUtilisateur,
    defaultValue: 'Utilisateur',
  },
  {
    id: 'entreprise',
    label: 'Compagnie',
    type: 'text',
    placeholder: 'Nom de la compagnie',
    required: true,
  },
]

const champsFormulaireModification: ChampFormulaire[] = (
  [
    ...champsFormulaireCreation,
    {
      id: 'statut',
      label: 'Statut',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'actif', label: 'Actif' },
        { value: 'inactif', label: 'Inactif' },
        { value: 'suspendu', label: 'Suspendu' },
      ],
    } satisfies ChampFormulaire,
  ] as ChampFormulaire[]
).map((c) => (c.id === 'email' ? c : { ...c, desactive: true }))

export default function PageUtilisateurs() {
  const [estChargement, setEstChargement] = useState(true)
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')

  const [utilisateurSelectionne, setUtilisateurSelectionne] = useState<Utilisateur | null>(null)
  const [modaleCreationOuverte, setModaleCreationOuverte] = useState(false)
  const [modaleModificationOuverte, setModaleModificationOuverte] = useState(false)
  const [modaleDetailOuverte, setModaleDetailOuverte] = useState(false)
  const [modaleSuppressionOuverte, setModaleSuppressionOuverte] = useState(false)
  const [actionEnCours, setActionEnCours] = useState(false)
  const [messageErreur, setMessageErreur] = useState<string | null>(null)

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
    setMessageErreur(null)
    const { prenom, nom } = separerPrenomNom(String(donnees.nomComplet))
    const reponse = await creerUtilisateur({
      prenom,
      nom,
      email: String(donnees.email),
      role: String(donnees.role),
      entreprise: String(donnees.entreprise),
    })
    if (!reponse.succes) {
      setMessageErreur(reponse.erreur ?? 'Création impossible')
      return
    }
    setModaleCreationOuverte(false)
    setPagination((prev) => ({ ...prev, page: 1 }))
    const refresh = await recupererUtilisateurs(1, pagination.parPage, {
      recherche,
      statut: 'tous',
    })
    if (refresh.succes && refresh.donnees) {
      setUtilisateurs(refresh.donnees)
      if (refresh.pagination) {
        setPagination(refresh.pagination)
      }
    }
  }

  const gererModification = async (donnees: Record<string, string | number | boolean>) => {
    if (!utilisateurSelectionne) return
    setMessageErreur(null)
    const reponse = await modifierUtilisateur(utilisateurSelectionne.id, {
      prenom: utilisateurSelectionne.prenom,
      nom: utilisateurSelectionne.nom,
      email: String(donnees.email),
      entreprise: utilisateurSelectionne.entreprise,
      role: utilisateurSelectionne.role,
      statut: utilisateurSelectionne.statut,
    })
    if (!reponse.succes) {
      setMessageErreur(reponse.erreur ?? 'Mise à jour impossible')
      return
    }
    setModaleModificationOuverte(false)
    setUtilisateurSelectionne(null)
    const refresh = await recupererUtilisateurs(pagination.page, pagination.parPage, {
      recherche,
      statut: 'tous',
    })
    if (refresh.succes && refresh.donnees) {
      setUtilisateurs(refresh.donnees)
      if (refresh.pagination) {
        setPagination(refresh.pagination)
      }
    }
  }

  const gererSuppression = async () => {
    if (!utilisateurSelectionne) return
    setMessageErreur(null)
    setActionEnCours(true)
    const reponse = await supprimerUtilisateur(utilisateurSelectionne.id)
    setActionEnCours(false)
    if (!reponse.succes) {
      setMessageErreur(reponse.erreur ?? 'Suppression impossible')
      return
    }
    setModaleSuppressionOuverte(false)
    setUtilisateurSelectionne(null)
    const refresh = await recupererUtilisateurs(pagination.page, pagination.parPage, {
      recherche,
      statut: 'tous',
    })
    if (refresh.succes && refresh.donnees) {
      setUtilisateurs(refresh.donnees)
      if (refresh.pagination) {
        setPagination(refresh.pagination)
      }
    }
  }

  const getSectionsDetail = (utilisateur: Utilisateur): SectionDetail[] => [
    {
      titre: 'Informations personnelles',
      champs: [
        { id: 'nom', label: 'Nom complet', valeur: `${utilisateur.prenom} ${utilisateur.nom}`.trim() },
        { id: 'email', label: 'Email', valeur: utilisateur.email },
        { id: 'role', label: 'Rôle', valeur: utilisateur.role },
        { id: 'telephone', label: 'Téléphone', valeur: formaterTelephone(utilisateur.telephone) },
        { id: 'entreprise', label: 'Compagnie', valeur: utilisateur.entreprise },
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
          valeur:
            utilisateur.statut === 'actif'
              ? 'Actif'
              : utilisateur.statut === 'inactif'
                ? 'Inactif'
                : 'Suspendu',
          type: 'badge',
          couleurBadge:
            utilisateur.statut === 'actif'
              ? 'success'
              : utilisateur.statut === 'suspendu'
                ? 'destructive'
                : 'secondary',
        },
        { id: 'dateInscription', label: 'Inscrit le', valeur: formaterDateCourte(utilisateur.dateInscription) },
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
            <span className="font-medium text-foreground">{`${u.prenom} ${u.nom}`.trim()}</span>
            <span className="text-xs text-muted-foreground">{u.email}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'compagnie',
      label: 'Compagnie',
      accesseur: (u) => <span className="text-sm text-muted-foreground">{u.entreprise}</span>,
    },
    {
      id: 'role',
      label: 'Rôle',
      largeur: '120px',
      accesseur: (u) => <span className="text-sm text-foreground">{u.role}</span>,
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
      {messageErreur ? (
        <Alert variant="destructive">
          <AlertTitle>Action impossible</AlertTitle>
          <AlertDescription>{messageErreur}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Liste des utilisateurs</h2>
          <p className="text-sm text-muted-foreground">Comptes clients — recherche, création et gestion.</p>
        </div>
        <Button
          onClick={() => {
            setMessageErreur(null)
            setModaleCreationOuverte(true)
          }}
          className="shrink-0 bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          <TableDonnees
            colonnes={colonnes}
            donnees={utilisateurs}
            estChargement={estChargement}
            pagination={pagination}
            onChangementPage={gererChangementPage}
            onChangementParPage={(parPage) =>
              setPagination((prev) => ({ ...prev, parPage, page: 1 }))
            }
            selectParPageAuDessusDuTableau
            aCoteSelectParPage={
              <ChampRecherche
                placeholder="Rechercher un utilisateur..."
                valeur={recherche}
                onChange={gererRecherche}
                className="min-w-0 w-full flex-1 sm:min-w-[220px] sm:max-w-md"
              />
            }
            actions={actions}
            idAccesseur={(u) => u.id}
            lignesParPageSkeleton={pagination.parPage}
          />
        </CardContent>
      </Card>

      <ModaleFormulaire
        estOuverte={modaleCreationOuverte}
        onFermer={() => {
          setMessageErreur(null)
          setModaleCreationOuverte(false)
        }}
        onSoumettre={gererCreation}
        titre="utilisateur"
        description="Créez un nouveau compte (nom complet, email, rôle et compagnie)"
        champs={champsFormulaireCreation}
        texteValidation="Créer l'utilisateur"
        mode="creation"
      />

      <ModaleFormulaire
        estOuverte={modaleModificationOuverte}
        onFermer={() => {
          setMessageErreur(null)
          setModaleModificationOuverte(false)
          setUtilisateurSelectionne(null)
        }}
        onSoumettre={gererModification}
        titre="utilisateur"
        description="Seul l'email est modifiable (nom, rôle, compagnie et statut se gèrent ailleurs)"
        champs={champsFormulaireModification}
        texteValidation="Enregistrer"
        donneesInitiales={
          utilisateurSelectionne
            ? {
                nomComplet: `${utilisateurSelectionne.prenom} ${utilisateurSelectionne.nom}`.trim(),
                email: utilisateurSelectionne.email,
                role: utilisateurSelectionne.role,
                entreprise: utilisateurSelectionne.entreprise,
                statut: utilisateurSelectionne.statut,
              }
            : undefined
        }
        mode="modification"
      />

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
                  {`${utilisateurSelectionne.prenom} ${utilisateurSelectionne.nom}`.trim()}
                </h3>
                <BadgeStatutUtilisateur statut={utilisateurSelectionne.statut} />
              </div>
            </div>
          }
          actions={
            <Button
              onClick={() => {
                setModaleDetailOuverte(false)
                setModaleModificationOuverte(true)
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          }
        />
      )}

      <ModaleConfirmation
        estOuverte={modaleSuppressionOuverte}
        onFermer={() => {
          setMessageErreur(null)
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
