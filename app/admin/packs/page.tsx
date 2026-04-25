'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { Plus, Edit, Eye, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ChargeurPage } from '@/components/admin/page-loader'
import { ModaleFormulaire, type ChampFormulaire } from '@/components/admin/form-modal'
import { ModaleDetail, type SectionDetail } from '@/components/admin/detail-modal'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { recupererPacks, modifierPack, creerPack, supprimerPack } from '@/lib/api/admin-service'
import type { Pack, ColonneTable, ActionLigne, ConfigPagination } from '@/lib/types-admin'
import { formaterMontant, formaterNombre, formaterDateCourte } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

const champsFormulairePack: ChampFormulaire[] = [
  { id: 'nom', label: 'Nom', type: 'text', placeholder: 'Ex. Pack Pro', required: true },
  {
    id: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Avantages et contenu du pack…',
    required: false,
    rows: 3,
  },
  {
    id: 'quotas',
    label: 'Quota inclus',
    type: 'number',
    placeholder: '1000',
    required: true,
    min: 1,
  },
  { id: 'prix', label: 'Prix (XOF)', type: 'number', placeholder: '25000', required: true, min: 0 },
  {
    id: 'dureeValidite',
    label: 'Validité (jours)',
    type: 'number',
    placeholder: '30',
    required: true,
    min: 1,
  },
  {
    id: 'estActif',
    label: 'Statut',
    type: 'select',
    required: true,
    options: [
      { value: 'true', label: 'Actif' },
      { value: 'false', label: 'Inactif' },
    ],
    defaultValue: 'true',
  },
]

const champsFormulairePackModification = champsFormulairePack.filter((c) => c.id !== 'description')

function estPackActifDepuisFormulaire(valeur: string | number | boolean | undefined): boolean {
  return valeur === true || valeur === 'true'
}

export default function PagePacks() {
  const [estChargement, setEstChargement] = useState(true)
  const [packs, setPacks] = useState<Pack[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')

  const [modaleCreationOuverte, setModaleCreationOuverte] = useState(false)
  const [modaleModificationOuverte, setModaleModificationOuverte] = useState(false)
  const [modaleDetailOuverte, setModaleDetailOuverte] = useState(false)
  const [modaleSuppressionOuverte, setModaleSuppressionOuverte] = useState(false)
  const [packSelectionne, setPackSelectionne] = useState<Pack | null>(null)
  const [packPourSuppression, setPackPourSuppression] = useState<Pack | null>(null)

  const chargerPacks = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererPacks(pagination.page, pagination.parPage, recherche)
    if (reponse.succes && reponse.donnees) {
      setPacks(reponse.donnees)
      if (reponse.pagination) {
        setPagination(reponse.pagination)
      }
    }
    setEstChargement(false)
  }, [pagination.page, pagination.parPage, recherche])

  useEffect(() => {
    queueMicrotask(() => {
      void chargerPacks()
    })
  }, [chargerPacks])

  const gererRecherche = (terme: string) => {
    setRecherche(terme)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const basculerStatutPack = useCallback(async (pack: Pack) => {
    const reponse = await modifierPack(pack.id, { estActif: !pack.estActif })
    if (reponse.succes) {
      await chargerPacks()
    }
  }, [chargerPacks])

  const gererCreation = async (donnees: Record<string, string | number | boolean>) => {
    const nouveauPack: Pack = {
      id: `pack-${Date.now()}`,
      nom: String(donnees.nom).trim(),
      description: String(donnees.description ?? '').trim(),
      quotas: Math.max(1, Number(donnees.quotas)),
      prix: Number(donnees.prix),
      devise: 'XOF',
      dureeValidite: Math.max(1, Number(donnees.dureeValidite)),
      estActif: estPackActifDepuisFormulaire(donnees.estActif),
      dateCreation: new Date(),
      nombreAchats: 0,
    }
    const reponse = await creerPack(nouveauPack)
    if (reponse.succes) {
      await chargerPacks()
    }
  }

  const gererModification = async (donnees: Record<string, string | number | boolean>) => {
    if (!packSelectionne) return

    const misesAJour: Partial<Pack> = {
      nom: String(donnees.nom).trim(),
      quotas: Math.max(1, Number(donnees.quotas)),
      prix: Number(donnees.prix),
      dureeValidite: Math.max(1, Number(donnees.dureeValidite)),
      estActif: estPackActifDepuisFormulaire(donnees.estActif),
    }

    const reponse = await modifierPack(packSelectionne.id, misesAJour)
    if (reponse.succes && reponse.donnees) {
      setPackSelectionne(reponse.donnees)
      await chargerPacks()
    }
  }

  const ouvrirModification = (pack: Pack) => {
    setPackSelectionne(pack)
    setModaleModificationOuverte(true)
  }

  const ouvrirDetail = (pack: Pack) => {
    setPackSelectionne(pack)
    setModaleDetailOuverte(true)
  }

  const ouvrirSuppression = (pack: Pack) => {
    setPackPourSuppression(pack)
    setModaleSuppressionOuverte(true)
  }

  const confirmerSuppression = async () => {
    if (!packPourSuppression) return
    const id = packPourSuppression.id
    const reponse = await supprimerPack(id)
    if (!reponse.succes) return
    if (packSelectionne?.id === id) {
      setPackSelectionne(null)
      setModaleDetailOuverte(false)
    }
    setModaleSuppressionOuverte(false)
    setPackPourSuppression(null)
    await chargerPacks()
  }

  const getSectionsDetail = (pack: Pack): SectionDetail[] => [
    {
      titre: 'Informations générales',
      champs: [
        { id: 'nom', label: 'Nom', valeur: pack.nom },
        { id: 'description', label: 'Description', valeur: pack.description || '—', pleineLargeur: true },
        {
          id: 'statut',
          label: 'Statut',
          valeur: pack.estActif ? 'Actif' : 'Inactif',
          type: 'badge',
          couleurBadge: pack.estActif ? 'success' : 'secondary',
        },
        { id: 'dateCreation', label: 'Date de création', valeur: formaterDateCourte(pack.dateCreation) },
      ],
    },
    {
      titre: 'Tarification',
      champs: [
        {
          id: 'prix',
          label: 'Prix (XOF)',
          valeur: pack.prix === 0 ? 'Gratuit' : formaterMontant(pack.prix, pack.devise),
        },
        { id: 'quotas', label: 'Quota inclus', valeur: formaterNombre(pack.quotas) },
        { id: 'duree', label: 'Validité', valeur: `${pack.dureeValidite} jours` },
      ],
    },
  ]

  const colonnes: ColonneTable<Pack>[] = useMemo(
    () => [
      {
        id: 'nom',
        label: 'Nom',
        largeur: '160px',
        accesseur: (pack) => (
          <span className="font-medium text-foreground">{pack.nom}</span>
        ),
      },
      {
        id: 'quotas',
        label: 'Quota',
        largeur: '100px',
        accesseur: (pack) => (
          <span className="tabular-nums text-sm font-medium">{formaterNombre(pack.quotas)}</span>
        ),
      },
      {
        id: 'prix',
        label: 'Prix (XOF)',
        largeur: '120px',
        accesseur: (pack) => (
          <span className="text-sm font-medium text-foreground">
            {pack.prix === 0 ? 'Gratuit' : formaterMontant(pack.prix, pack.devise)}
          </span>
        ),
      },
      {
        id: 'validite',
        label: 'Validité',
        largeur: '100px',
        accesseur: (pack) => (
          <span className="text-sm text-muted-foreground">{pack.dureeValidite} jours</span>
        ),
      },
      {
        id: 'statut',
        label: 'Statut',
        largeur: '140px',
        accesseur: (pack) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Badge
              variant={pack.estActif ? 'default' : 'secondary'}
              className={cn(pack.estActif && 'bg-emerald-600 hover:bg-emerald-600/90')}
            >
              {pack.estActif ? 'Actif' : 'Inactif'}
            </Badge>
            <Switch checked={pack.estActif} onCheckedChange={() => basculerStatutPack(pack)} />
          </div>
        ),
      },
    ],
    [basculerStatutPack]
  )

  const actionsLigne: ActionLigne<Pack>[] = useMemo(
    () => [
      {
        id: 'detail',
        label: 'Voir le détail',
        icone: Eye,
        onClick: (pack) => ouvrirDetail(pack),
      },
      {
        id: 'modifier',
        label: 'Modifier',
        icone: Edit,
        onClick: (pack) => ouvrirModification(pack),
      },
      {
        id: 'supprimer',
        label: 'Supprimer',
        icone: Trash2,
        onClick: (pack) => ouvrirSuppression(pack),
        variante: 'destructive',
      },
    ],
    []
  )

  if (estChargement && packs.length === 0) {
    return <ChargeurPage avecTable />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Packs</h2>
          <p className="text-sm text-muted-foreground">Liste des packs — création et modification au besoin.</p>
        </div>
        <Button onClick={() => setModaleCreationOuverte(true)} className="shrink-0 bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau pack
        </Button>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          <TableDonnees
            colonnes={colonnes}
            donnees={packs}
            estChargement={estChargement}
            pagination={pagination}
            onChangementPage={(page) => setPagination((prev) => ({ ...prev, page }))}
            onChangementParPage={(parPage) =>
              setPagination((prev) => ({ ...prev, parPage, page: 1 }))
            }
            selectParPageAuDessusDuTableau
            aCoteSelectParPage={
              <ChampRecherche
                placeholder="Rechercher un pack (nom, description, quota…)"
                valeur={recherche}
                onChange={gererRecherche}
                className="min-w-0 w-full flex-1 sm:min-w-[220px] sm:max-w-md"
              />
            }
            idAccesseur={(p) => p.id}
            actions={actionsLigne}
            lignesParPageSkeleton={pagination.parPage}
          />
        </CardContent>
      </Card>

      <ModaleFormulaire
        estOuverte={modaleCreationOuverte}
        onFermer={() => setModaleCreationOuverte(false)}
        onSoumettre={gererCreation}
        titre="pack"
        description="Créez un pack de quotas (nom, quota inclus, prix, validité en jours et statut)"
        champs={champsFormulairePack}
        texteValidation="Créer le pack"
        mode="creation"
      />

      <ModaleFormulaire
        estOuverte={modaleModificationOuverte}
        onFermer={() => {
          setModaleModificationOuverte(false)
          setPackSelectionne(null)
        }}
        onSoumettre={gererModification}
        titre="pack"
        description="Modifiez les informations du pack"
        champs={champsFormulairePackModification}
        texteValidation="Enregistrer"
        donneesInitiales={
          packSelectionne
            ? {
                nom: packSelectionne.nom,
                quotas: packSelectionne.quotas,
                prix: packSelectionne.prix,
                dureeValidite: packSelectionne.dureeValidite,
                estActif: packSelectionne.estActif ? 'true' : 'false',
              }
            : undefined
        }
        mode="modification"
      />

      {packSelectionne && (
        <ModaleDetail
          estOuverte={modaleDetailOuverte}
          onFermer={() => {
            setModaleDetailOuverte(false)
            setPackSelectionne(null)
          }}
          titre={`Pack : ${packSelectionne.nom}`}
          description="Détails complets du pack"
          sections={getSectionsDetail(packSelectionne)}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setModaleDetailOuverte(false)
                  setModaleModificationOuverte(true)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setModaleDetailOuverte(false)
                  ouvrirSuppression(packSelectionne)
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </div>
          }
        />
      )}

      <ModaleConfirmation
        estOuverte={modaleSuppressionOuverte}
        onFermer={() => {
          setModaleSuppressionOuverte(false)
          setPackPourSuppression(null)
        }}
        onConfirmer={confirmerSuppression}
        titre="Supprimer ce pack ?"
        description={
          packPourSuppression
            ? `Le pack « ${packPourSuppression.nom} » sera retiré de la liste des offres. Cette action est irréversible dans cette démo.`
            : ''
        }
        texteConfirmation="Supprimer"
        variante="destructive"
      />
    </div>
  )
}
