'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, ShieldCheck, Shield, UserCog, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChargeurPage } from '@/components/admin/page-loader'
import { BadgeRole } from '@/components/admin/status-badge'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { ModaleFormulaire, type ChampFormulaire } from '@/components/admin/form-modal'
import { ModaleDetail, type SectionDetail } from '@/components/admin/detail-modal'
import { recupererAdministrateurs } from '@/lib/api/admin-service'
import type { Administrateur } from '@/lib/types-admin'
import { formaterDateCourte, formaterDateRelative, genererInitiales } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

const champsFormulaireAdmin: ChampFormulaire[] = [
  { id: 'prenom', label: 'Prénom', type: 'text', placeholder: 'Jean', required: true },
  { id: 'nom', label: 'Nom', type: 'text', placeholder: 'Dupont', required: true },
  { id: 'email', label: 'Email', type: 'email', placeholder: 'jean.dupont@example.com', required: true },
  { 
    id: 'role', 
    label: 'Rôle', 
    type: 'select', 
    required: true,
    options: [
      { value: 'admin', label: 'Administrateur' },
      { value: 'moderateur', label: 'Modérateur' },
    ]
  },
  { id: 'estActif', label: 'Compte actif', type: 'switch', description: 'Activer ce compte administrateur' },
]

export default function PageAdministrateurs() {
  const [estChargement, setEstChargement] = useState(true)
  const [administrateurs, setAdministrateurs] = useState<Administrateur[]>([])
  const [adminSelectionne, setAdminSelectionne] = useState<Administrateur | null>(null)
  
  // Modales
  const [modaleCreationOuverte, setModaleCreationOuverte] = useState(false)
  const [modaleModificationOuverte, setModaleModificationOuverte] = useState(false)
  const [modaleDetailOuverte, setModaleDetailOuverte] = useState(false)
  const [modaleSuppressionOuverte, setModaleSuppressionOuverte] = useState(false)

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      const reponse = await recupererAdministrateurs()
      if (reponse.succes && reponse.donnees) {
        setAdministrateurs(reponse.donnees)
      }
      setEstChargement(false)
    }
    chargerDonnees()
  }, [])

  const getIconeRole = (role: Administrateur['role']) => {
    switch (role) {
      case 'super-admin':
        return <ShieldCheck className="h-5 w-5 text-red-600" />
      case 'admin':
        return <Shield className="h-5 w-5 text-primary" />
      case 'moderateur':
        return <UserCog className="h-5 w-5 text-muted-foreground" />
    }
  }

  const gererCreation = async (donnees: Record<string, string | number | boolean>) => {
    const nouvelAdmin: Administrateur = {
      id: `admin-${Date.now()}`,
      prenom: String(donnees.prenom),
      nom: String(donnees.nom),
      email: String(donnees.email),
      role: donnees.role as Administrateur['role'],
      dateCreation: new Date(),
      derniereActivite: new Date(),
      estActif: Boolean(donnees.estActif),
    }
    setAdministrateurs((prev) => [...prev, nouvelAdmin])
  }

  const gererModification = async (donnees: Record<string, string | number | boolean>) => {
    if (!adminSelectionne) return
    
    const adminMisAJour = {
      ...adminSelectionne,
      prenom: String(donnees.prenom),
      nom: String(donnees.nom),
      email: String(donnees.email),
      role: donnees.role as Administrateur['role'],
      estActif: Boolean(donnees.estActif),
    }
    
    setAdministrateurs((prev) =>
      prev.map((a) => (a.id === adminSelectionne.id ? adminMisAJour : a))
    )
  }

  const gererSuppression = () => {
    if (!adminSelectionne) return
    setAdministrateurs((prev) => prev.filter((a) => a.id !== adminSelectionne.id))
    setModaleSuppressionOuverte(false)
    setAdminSelectionne(null)
  }

  const ouvrirModification = (admin: Administrateur) => {
    setAdminSelectionne(admin)
    setModaleModificationOuverte(true)
  }

  const ouvrirDetail = (admin: Administrateur) => {
    setAdminSelectionne(admin)
    setModaleDetailOuverte(true)
  }

  const getSectionsDetail = (admin: Administrateur): SectionDetail[] => [
    {
      titre: 'Informations personnelles',
      champs: [
        { id: 'nom', label: 'Nom complet', valeur: `${admin.prenom} ${admin.nom}` },
        { id: 'email', label: 'Email', valeur: admin.email },
      ],
    },
    {
      titre: 'Rôle et accès',
      champs: [
        { 
          id: 'role', 
          label: 'Rôle', 
          valeur: admin.role === 'super-admin' ? 'Super Admin' : admin.role === 'admin' ? 'Administrateur' : 'Modérateur',
          type: 'badge',
          couleurBadge: admin.role === 'super-admin' ? 'destructive' : admin.role === 'admin' ? 'default' : 'secondary'
        },
        { 
          id: 'statut', 
          label: 'Statut', 
          valeur: admin.estActif ? 'Actif' : 'Inactif',
          type: 'badge',
          couleurBadge: admin.estActif ? 'success' : 'secondary'
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

  if (estChargement) {
    return <ChargeurPage avecTable />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Équipe d&apos;administration</h2>
          <p className="text-sm text-muted-foreground">
            {administrateurs.length} administrateurs au total
          </p>
        </div>
        <Button onClick={() => setModaleCreationOuverte(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un admin
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {administrateurs.map((admin) => (
          <Card
            key={admin.id}
            className={cn(
              'border-border/40 shadow-sm transition-all hover:shadow-md',
              !admin.estActif && 'opacity-60'
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
                      {genererInitiales(admin.prenom, admin.nom)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {admin.prenom} {admin.nom}
                    </h3>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                </div>
                {getIconeRole(admin.role)}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rôle</span>
                  <BadgeRole role={admin.role} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Créé le</span>
                  <span className="font-medium">{formaterDateCourte(admin.dateCreation)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dernière activité</span>
                  <span className="font-medium">{formaterDateRelative(admin.derniereActivite)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Statut</span>
                  <span
                    className={cn(
                      'flex items-center gap-1.5 font-medium',
                      admin.estActif ? 'text-emerald-600' : 'text-muted-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        admin.estActif ? 'bg-emerald-500' : 'bg-muted-foreground'
                      )}
                    />
                    {admin.estActif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t border-border/40 pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => ouvrirDetail(admin)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Détail
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => ouvrirModification(admin)}
                  disabled={admin.role === 'super-admin'}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    setAdminSelectionne(admin)
                    setModaleSuppressionOuverte(true)
                  }}
                  disabled={admin.role === 'super-admin'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modale de création */}
      <ModaleFormulaire
        estOuverte={modaleCreationOuverte}
        onFermer={() => setModaleCreationOuverte(false)}
        onSoumettre={gererCreation}
        titre="administrateur"
        description="Ajoutez un nouvel administrateur à votre équipe"
        champs={champsFormulaireAdmin}
        texteValidation="Créer l'administrateur"
        mode="creation"
      />

      {/* Modale de modification */}
      <ModaleFormulaire
        estOuverte={modaleModificationOuverte}
        onFermer={() => {
          setModaleModificationOuverte(false)
          setAdminSelectionne(null)
        }}
        onSoumettre={gererModification}
        titre="administrateur"
        description="Modifiez les informations de l'administrateur"
        champs={champsFormulaireAdmin}
        texteValidation="Enregistrer"
        donneesInitiales={adminSelectionne ? {
          prenom: adminSelectionne.prenom,
          nom: adminSelectionne.nom,
          email: adminSelectionne.email,
          role: adminSelectionne.role,
          estActif: adminSelectionne.estActif,
        } : undefined}
        mode="modification"
      />

      {/* Modale de détail */}
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
                <h3 className="text-lg font-semibold">
                  {adminSelectionne.prenom} {adminSelectionne.nom}
                </h3>
                <p className="text-sm text-muted-foreground">{adminSelectionne.email}</p>
              </div>
            </div>
          }
          actions={
            adminSelectionne.role !== 'super-admin' ? (
              <Button onClick={() => {
                setModaleDetailOuverte(false)
                setModaleModificationOuverte(true)
              }}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Modale de suppression */}
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
