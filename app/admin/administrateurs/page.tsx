'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChargeurPage } from '@/components/admin/page-loader'
import { BadgeRole } from '@/components/admin/status-badge'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { ModaleFormulaire, type ChampFormulaire } from '@/components/admin/form-modal'
import { ModaleDetail, type SectionDetail } from '@/components/admin/detail-modal'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import {
  creerAdministrateur,
  modifierAdministrateur,
  recupererAdministrateurs,
  supprimerAdministrateur,
} from '@/lib/api/admin-service'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Administrateur, ColonneTable, ActionLigne, ConfigPagination } from '@/lib/types-admin'
import { formaterDateCourte, formaterDateRelative, genererInitiales, separerPrenomNom } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

const optionsRoleCreation = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'moderateur', label: 'Modérateur' },
]

const champsFormulaireCreation: ChampFormulaire[] = [
  {
    id: 'nomComplet',
    label: 'Nom',
    type: 'text',
    placeholder: 'Ex. Jean-Pierre Durand',
    required: true,
  },
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'jean.durand@example.com',
    required: true,
  },
  {
    id: 'role',
    label: 'Rôle',
    type: 'select',
    required: true,
    options: optionsRoleCreation,
    defaultValue: 'admin',
  },
]

const optionsRoleModification = [
  { value: 'super-admin', label: 'Super administrateur' },
  ...optionsRoleCreation,
]

const champsFormulaireModification: ChampFormulaire[] = [
  ...champsFormulaireCreation.map((c) =>
    c.id === 'role' ? { ...c, options: optionsRoleModification } : c,
  ),
  { id: 'estActif', label: 'Compte actif', type: 'switch', description: 'Activer ce compte administrateur' },
].map((c) => (c.id === 'email' ? c : { ...c, desactive: true })) as ChampFormulaire[]

export default function PageAdministrateurs() {
  const [estChargement, setEstChargement] = useState(true)
  const [administrateurs, setAdministrateurs] = useState<Administrateur[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')

  const [adminSelectionne, setAdminSelectionne] = useState<Administrateur | null>(null)
  const [modaleCreationOuverte, setModaleCreationOuverte] = useState(false)
  const [modaleModificationOuverte, setModaleModificationOuverte] = useState(false)
  const [modaleDetailOuverte, setModaleDetailOuverte] = useState(false)
  const [modaleSuppressionOuverte, setModaleSuppressionOuverte] = useState(false)
  const [messageErreur, setMessageErreur] = useState<string | null>(null)

  const chargerAdministrateurs = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererAdministrateurs(pagination.page, pagination.parPage, {
      recherche,
      role: 'tous',
      statutCompte: 'tous',
    })

    if (reponse.succes && reponse.donnees) {
      setAdministrateurs(reponse.donnees)
      if (reponse.pagination) {
        setPagination(reponse.pagination)
      }
    }
    setEstChargement(false)
  }, [pagination.page, pagination.parPage, recherche])

  useEffect(() => {
    queueMicrotask(() => {
      void chargerAdministrateurs()
    })
  }, [chargerAdministrateurs])

  const gererChangementPage = (nouvellePage: number) => {
    setPagination((prev) => ({ ...prev, page: nouvellePage }))
  }

  const gererRecherche = (terme: string) => {
    setRecherche(terme)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const gererCreation = async (donnees: Record<string, string | number | boolean>) => {
    setMessageErreur(null)
    const { prenom, nom } = separerPrenomNom(String(donnees.nomComplet))
    const reponse = await creerAdministrateur({
      prenom,
      nom,
      email: String(donnees.email),
      role: donnees.role as Administrateur['role'],
    })
    if (!reponse.succes) {
      setMessageErreur(reponse.erreur ?? 'Création impossible')
      return
    }
    setModaleCreationOuverte(false)
    setPagination((prev) => ({ ...prev, page: 1 }))
    const refresh = await recupererAdministrateurs(1, pagination.parPage, {
      recherche,
      role: 'tous',
      statutCompte: 'tous',
    })
    if (refresh.succes && refresh.donnees) {
      setAdministrateurs(refresh.donnees)
      if (refresh.pagination) {
        setPagination(refresh.pagination)
      }
    }
  }

  const gererModification = async (donnees: Record<string, string | number | boolean>) => {
    if (!adminSelectionne) {
      return
    }
    setMessageErreur(null)
    const reponse = await modifierAdministrateur(adminSelectionne.id, {
      prenom: adminSelectionne.prenom,
      nom: adminSelectionne.nom,
      email: String(donnees.email),
      role: adminSelectionne.role,
      estActif: adminSelectionne.estActif,
    })
    if (!reponse.succes) {
      setMessageErreur(reponse.erreur ?? 'Mise à jour impossible')
      return
    }
    setModaleModificationOuverte(false)
    setAdminSelectionne(null)
    const refresh = await recupererAdministrateurs(pagination.page, pagination.parPage, {
      recherche,
      role: 'tous',
      statutCompte: 'tous',
    })
    if (refresh.succes && refresh.donnees) {
      setAdministrateurs(refresh.donnees)
      if (refresh.pagination) {
        setPagination(refresh.pagination)
      }
    }
  }

  const gererSuppression = async () => {
    if (!adminSelectionne) {
      return
    }
    setMessageErreur(null)
    const reponse = await supprimerAdministrateur(adminSelectionne.id)
    if (!reponse.succes) {
      setMessageErreur(reponse.erreur ?? 'Suppression impossible')
      return
    }
    setModaleSuppressionOuverte(false)
    setAdminSelectionne(null)
    const filtresListe = { recherche, role: 'tous' as const, statutCompte: 'tous' as const }
    let p = pagination.page
    const refresh = await recupererAdministrateurs(p, pagination.parPage, filtresListe)
    if (refresh.succes && refresh.donnees && refresh.pagination) {
      if (refresh.donnees.length === 0 && refresh.pagination.total > 0) {
        p = Math.max(1, p - 1)
        setPagination((prev) => ({ ...prev, page: p }))
        const rechargement = await recupererAdministrateurs(p, refresh.pagination.parPage, filtresListe)
        if (rechargement.succes && rechargement.donnees) {
          setAdministrateurs(rechargement.donnees)
        }
        if (rechargement?.pagination) {
          setPagination(rechargement.pagination)
        }
        return
      }
      if (refresh.donnees.length === 0 && refresh.pagination.total === 0) {
        setAdministrateurs([])
        setPagination(refresh.pagination)
        return
      }
      setAdministrateurs(refresh.donnees)
      setPagination(refresh.pagination)
    }
  }

  const getSectionsDetail = (admin: Administrateur): SectionDetail[] => [
    {
      titre: 'Informations personnelles',
      champs: [
        { id: 'nom', label: 'Nom complet', valeur: `${admin.prenom} ${admin.nom}`.trim() },
        { id: 'email', label: 'Email', valeur: admin.email },
      ],
    },
    {
      titre: 'Rôle et accès',
      champs: [
        {
          id: 'role',
          label: 'Rôle',
          valeur:
            admin.role === 'super-admin'
              ? 'Super Admin'
              : admin.role === 'admin'
                ? 'Administrateur'
                : 'Modérateur',
          type: 'badge',
          couleurBadge: admin.role === 'super-admin' ? 'destructive' : admin.role === 'admin' ? 'default' : 'secondary',
        },
        {
          id: 'statut',
          label: 'Statut',
          valeur: admin.estActif ? 'Actif' : 'Inactif',
          type: 'badge',
          couleurBadge: admin.estActif ? 'success' : 'secondary',
        },
      ],
    },
    {
      titre: 'Activité',
      champs: [
        { id: 'dateCreation', label: 'Créé le', valeur: formaterDateCourte(admin.dateCreation) },
        { id: 'derniereActivite', label: 'Dernière activité', valeur: formaterDateRelative(admin.derniereActivite) },
      ],
    },
  ]

  const colonnes: ColonneTable<Administrateur>[] = [
    {
      id: 'nom',
      label: 'Nom',
      largeur: '260px',
      accesseur: (a) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback
              className={cn(
                'text-sm font-medium',
                a.estActif ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              {genererInitiales(a.prenom, a.nom)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground">{`${a.prenom} ${a.nom}`.trim()}</span>
        </div>
      ),
    },
    {
      id: 'email',
      label: 'Email',
      accesseur: (a) => <span className="text-sm text-muted-foreground">{a.email}</span>,
    },
    {
      id: 'role',
      label: 'Rôle',
      largeur: '140px',
      accesseur: (a) => <BadgeRole role={a.role} />,
    },
  ]

  const actions: ActionLigne<Administrateur>[] = [
    {
      id: 'voir',
      label: 'Voir le détail',
      icone: Eye,
      onClick: (a) => {
        setAdminSelectionne(a)
        setModaleDetailOuverte(true)
      },
    },
    {
      id: 'modifier',
      label: 'Modifier',
      icone: Edit,
      onClick: (a) => {
        setAdminSelectionne(a)
        setModaleModificationOuverte(true)
      },
    },
    {
      id: 'supprimer',
      label: 'Supprimer',
      icone: Trash2,
      variante: 'destructive',
      onClick: (a) => {
        setAdminSelectionne(a)
        setModaleSuppressionOuverte(true)
      },
    },
  ]

  if (estChargement && administrateurs.length === 0) {
    return <ChargeurPage avecTable />
  }

  return (
    <div className="space-y-6">
      {messageErreur && (
        <Alert variant="destructive" className="py-2">
          <AlertTitle>Action refusée</AlertTitle>
          <AlertDescription>{messageErreur}</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Liste des administrateurs</h2>
          <p className="text-sm text-muted-foreground">Comptes avec accès à l&apos;administration.</p>
        </div>
        <Button
          onClick={() => setModaleCreationOuverte(true)}
          className="shrink-0 bg-primary hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvel administrateur
        </Button>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          <TableDonnees
            colonnes={colonnes}
            donnees={administrateurs}
            estChargement={estChargement}
            pagination={pagination}
            onChangementPage={gererChangementPage}
            onChangementParPage={(parPage) =>
              setPagination((prev) => ({ ...prev, parPage, page: 1 }))
            }
            selectParPageAuDessusDuTableau
            aCoteSelectParPage={
              <ChampRecherche
                placeholder="Rechercher un administrateur..."
                valeur={recherche}
                onChange={gererRecherche}
                className="min-w-0 w-full flex-1 sm:min-w-[220px] sm:max-w-md"
              />
            }
            actions={actions}
            idAccesseur={(a) => a.id}
            lignesParPageSkeleton={pagination.parPage}
          />
        </CardContent>
      </Card>

      <ModaleFormulaire
        estOuverte={modaleCreationOuverte}
        onFermer={() => setModaleCreationOuverte(false)}
        onSoumettre={gererCreation}
        titre="administrateur"
        description="Création à partir du nom complet, de l&apos;email et du rôle"
        champs={champsFormulaireCreation}
        texteValidation="Créer l'administrateur"
        mode="creation"
      />

      <ModaleFormulaire
        estOuverte={modaleModificationOuverte}
        onFermer={() => {
          setModaleModificationOuverte(false)
          setAdminSelectionne(null)
        }}
        onSoumettre={gererModification}
        titre="administrateur"
        description="Seul l'email est modifiable (nom, rôle et statut du compte se gèrent ailleurs)"
        champs={champsFormulaireModification}
        texteValidation="Enregistrer"
        donneesInitiales={
          adminSelectionne
            ? {
                nomComplet: `${adminSelectionne.prenom} ${adminSelectionne.nom}`.trim(),
                email: adminSelectionne.email,
                role: adminSelectionne.role,
                estActif: adminSelectionne.estActif,
              }
            : undefined
        }
        mode="modification"
      />

      {adminSelectionne && (
        <ModaleDetail
          estOuverte={modaleDetailOuverte}
          onFermer={() => {
            setModaleDetailOuverte(false)
            setAdminSelectionne(null)
          }}
          titre="Détails de l'administrateur"
          description="Informations complètes du compte"
          sections={getSectionsDetail(adminSelectionne)}
          entete={
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-xl font-medium text-primary">
                  {genererInitiales(adminSelectionne.prenom, adminSelectionne.nom)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">{`${adminSelectionne.prenom} ${adminSelectionne.nom}`.trim()}</h3>
                <p className="text-sm text-muted-foreground">{adminSelectionne.email}</p>
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
          setModaleSuppressionOuverte(false)
          setAdminSelectionne(null)
        }}
        onConfirmer={gererSuppression}
        titre="Supprimer l'administrateur"
        description={`Êtes-vous sûr de vouloir supprimer le compte de ${adminSelectionne?.prenom} ${adminSelectionne?.nom} ? Cette action est irréversible.`}
        texteConfirmation="Supprimer"
        variante="destructive"
      />
    </div>
  )
}
