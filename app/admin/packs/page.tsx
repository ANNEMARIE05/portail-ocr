'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Package, Users, Check, X, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ChargeurPage } from '@/components/admin/page-loader'
import { ModaleFormulaire, type ChampFormulaire } from '@/components/admin/form-modal'
import { ModaleDetail, type SectionDetail } from '@/components/admin/detail-modal'
import { recupererPacks, modifierPack } from '@/lib/api/admin-service'
import type { Pack } from '@/lib/types-admin'
import { formaterMontant, formaterNombre, formaterDateCourte } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

const champsFormulairePack: ChampFormulaire[] = [
  { id: 'nom', label: 'Nom du pack', type: 'text', placeholder: 'Ex: Pack Pro', required: true },
  { id: 'description', label: 'Description', type: 'textarea', placeholder: 'Décrivez les avantages du pack...', required: true, rows: 3 },
  { id: 'quotas', label: 'Nombre de documents', type: 'number', placeholder: '1000', required: true, min: 1 },
  { id: 'prix', label: 'Prix (FCFA)', type: 'number', placeholder: '25000', required: true, min: 0 },
  { id: 'dureeValidite', label: 'Durée de validité (jours)', type: 'number', placeholder: '30', required: true, min: 1 },
  { id: 'estActif', label: 'Pack actif', type: 'switch', description: 'Rendre ce pack disponible à l\'achat' },
]

export default function PagePacks() {
  const [estChargement, setEstChargement] = useState(true)
  const [packs, setPacks] = useState<Pack[]>([])
  
  // Modales
  const [modaleCreationOuverte, setModaleCreationOuverte] = useState(false)
  const [modaleModificationOuverte, setModaleModificationOuverte] = useState(false)
  const [modaleDetailOuverte, setModaleDetailOuverte] = useState(false)
  const [packSelectionne, setPackSelectionne] = useState<Pack | null>(null)

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      const reponse = await recupererPacks()
      if (reponse.succes && reponse.donnees) {
        setPacks(reponse.donnees)
      }
      setEstChargement(false)
    }
    chargerDonnees()
  }, [])

  const basculerStatutPack = async (pack: Pack) => {
    const reponse = await modifierPack(pack.id, { estActif: !pack.estActif })
    if (reponse.succes) {
      setPacks((prev) =>
        prev.map((p) => (p.id === pack.id ? { ...p, estActif: !p.estActif } : p))
      )
    }
  }

  const gererCreation = async (donnees: Record<string, string | number | boolean>) => {
    // Simulation de creation
    const nouveauPack: Pack = {
      id: `pack-${Date.now()}`,
      nom: String(donnees.nom),
      description: String(donnees.description),
      quotas: Number(donnees.quotas),
      prix: Number(donnees.prix),
      devise: 'XOF',
      dureeValidite: Number(donnees.dureeValidite),
      estActif: Boolean(donnees.estActif),
      dateCreation: new Date(),
      nombreAchats: 0,
    }
    setPacks((prev) => [...prev, nouveauPack])
  }

  const gererModification = async (donnees: Record<string, string | number | boolean>) => {
    if (!packSelectionne) return
    
    const packMisAJour = {
      ...packSelectionne,
      nom: String(donnees.nom),
      description: String(donnees.description),
      quotas: Number(donnees.quotas),
      prix: Number(donnees.prix),
      dureeValidite: Number(donnees.dureeValidite),
      estActif: Boolean(donnees.estActif),
    }
    
    setPacks((prev) =>
      prev.map((p) => (p.id === packSelectionne.id ? packMisAJour : p))
    )
  }

  const ouvrirModification = (pack: Pack) => {
    setPackSelectionne(pack)
    setModaleModificationOuverte(true)
  }

  const ouvrirDetail = (pack: Pack) => {
    setPackSelectionne(pack)
    setModaleDetailOuverte(true)
  }

  const getSectionsDetail = (pack: Pack): SectionDetail[] => [
    {
      titre: 'Informations générales',
      champs: [
        { id: 'nom', label: 'Nom', valeur: pack.nom },
        { id: 'description', label: 'Description', valeur: pack.description, pleineLargeur: true },
        { 
          id: 'statut', 
          label: 'Statut', 
          valeur: pack.estActif ? 'Actif' : 'Inactif',
          type: 'badge',
          couleurBadge: pack.estActif ? 'success' : 'secondary'
        },
      ],
    },
    {
      titre: 'Tarification',
      champs: [
        { id: 'prix', label: 'Prix', valeur: pack.prix === 0 ? 'Gratuit' : formaterMontant(pack.prix, pack.devise) },
        { id: 'quotas', label: 'Documents inclus', valeur: formaterNombre(pack.quotas) },
        { id: 'duree', label: 'Validité', valeur: `${pack.dureeValidite} jours` },
      ],
    },
    {
      titre: 'Statistiques',
      champs: [
        { id: 'achats', label: 'Nombre d\'achats', valeur: formaterNombre(pack.nombreAchats) },
        { id: 'dateCreation', label: 'Date de création', valeur: formaterDateCourte(pack.dateCreation) },
      ],
    },
  ]

  if (estChargement) {
    return <ChargeurPage avecCartes={6} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Offres et tarifs</h2>
          <p className="text-sm text-muted-foreground">
            Gérez les packs de quotas disponibles à l&apos;achat
          </p>
        </div>
        <Button onClick={() => setModaleCreationOuverte(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau pack
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packs.map((pack) => (
          <Card
            key={pack.id}
            className={cn(
              'relative border-border/40 shadow-sm transition-all hover:shadow-md',
              !pack.estActif && 'opacity-60'
            )}
          >
            {pack.prix === 0 && (
              <div className="absolute -right-2 -top-2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-medium text-white">
                Gratuit
              </div>
            )}
            
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pack.nom}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium',
                          pack.estActif ? 'text-emerald-600' : 'text-muted-foreground'
                        )}
                      >
                        {pack.estActif ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        {pack.estActif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </div>
                </div>
                <Switch
                  checked={pack.estActif}
                  onCheckedChange={() => basculerStatutPack(pack)}
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{pack.description}</p>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {pack.prix === 0 ? 'Gratuit' : formaterMontant(pack.prix, pack.devise)}
                </span>
                {pack.prix > 0 && (
                  <span className="text-sm text-muted-foreground">/ {pack.dureeValidite} jours</span>
                )}
              </div>

              <div className="space-y-2 border-t border-border/40 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Documents inclus</span>
                  <span className="font-semibold">{formaterNombre(pack.quotas)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Validité</span>
                  <span className="font-medium">{pack.dureeValidite} jours</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Achats
                  </span>
                  <span className="font-medium">{formaterNombre(pack.nombreAchats)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => ouvrirDetail(pack)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Détail
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                  onClick={() => ouvrirModification(pack)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
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
        titre="pack"
        description="Créez un nouveau pack de quotas pour vos utilisateurs"
        champs={champsFormulairePack}
        texteValidation="Créer le pack"
        mode="creation"
      />

      {/* Modale de modification */}
      <ModaleFormulaire
        estOuverte={modaleModificationOuverte}
        onFermer={() => {
          setModaleModificationOuverte(false)
          setPackSelectionne(null)
        }}
        onSoumettre={gererModification}
        titre="pack"
        description="Modifiez les informations du pack"
        champs={champsFormulairePack}
        texteValidation="Enregistrer"
        donneesInitiales={packSelectionne ? {
          nom: packSelectionne.nom,
          description: packSelectionne.description,
          quotas: packSelectionne.quotas,
          prix: packSelectionne.prix,
          dureeValidite: packSelectionne.dureeValidite,
          estActif: packSelectionne.estActif,
        } : undefined}
        mode="modification"
      />

      {/* Modale de détail */}
      {packSelectionne && (
        <ModaleDetail
          estOuverte={modaleDetailOuverte}
          onFermer={() => {
            setModaleDetailOuverte(false)
            setPackSelectionne(null)
          }}
          titre={`Pack: ${packSelectionne.nom}`}
          description="Détails complets du pack"
          sections={getSectionsDetail(packSelectionne)}
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
    </div>
  )
}
