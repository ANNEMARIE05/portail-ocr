'use client'

import { useEffect, useState, useCallback } from 'react'
import { Key, Copy, RotateCcw, Ban, Check, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { CarteStats } from '@/components/admin/stat-card'
import { ChargeurPage } from '@/components/admin/page-loader'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { recupererClesApi, revoquerCleApi } from '@/lib/api/admin-service'
import { clesApiMock } from '@/lib/mock/donnees-utilisateurs'
import type { CleApi, ColonneTable, ActionLigne, ConfigPagination } from '@/lib/types-admin'
import { formaterDateCourte, formaterDateRelative, formaterNombre } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageApi() {
  const [estChargement, setEstChargement] = useState(true)
  const [clesApi, setClesApi] = useState<CleApi[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')
  
  const [cleSelectionnee, setCleSelectionnee] = useState<CleApi | null>(null)
  const [modaleRevocationOuverte, setModaleRevocationOuverte] = useState(false)
  const [cleCopiee, setCleCopiee] = useState<string | null>(null)
  const [cleVisible, setCleVisible] = useState<string | null>(null)

  const chargerClesApi = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererClesApi(pagination.page, pagination.parPage)
    
    if (reponse.succes && reponse.donnees) {
      setClesApi(reponse.donnees)
      if (reponse.pagination) {
        setPagination(reponse.pagination)
      }
    }
    setEstChargement(false)
  }, [pagination.page, pagination.parPage])

  useEffect(() => {
    chargerClesApi()
  }, [chargerClesApi])

  const copierCle = (cle: string) => {
    navigator.clipboard.writeText(cle)
    setCleCopiee(cle)
    setTimeout(() => setCleCopiee(null), 2000)
  }

  const statsApi = {
    total: clesApiMock.length,
    actives: clesApiMock.filter((c) => c.estActive).length,
    requetesTotales: clesApiMock.reduce((acc, c) => acc + c.nombreRequetes, 0),
    expirantBientot: clesApiMock.filter((c) => {
      const dansUnMois = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      return c.dateExpiration < dansUnMois && c.estActive
    }).length,
  }

  const colonnes: ColonneTable<CleApi>[] = [
    {
      id: 'utilisateur',
      label: 'Utilisateur',
      largeur: '200px',
      accesseur: (c) => (
        <span className="font-medium text-foreground">{c.utilisateurNom}</span>
      ),
    },
    {
      id: 'cle',
      label: 'Clé API',
      largeur: '280px',
      accesseur: (c) => (
        <div className="flex items-center gap-2">
          <code className="rounded bg-slate-100 px-2 py-1 font-mono text-xs">
            {cleVisible === c.id ? c.cle : `${c.cle.substring(0, 12)}${'•'.repeat(20)}`}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCleVisible(cleVisible === c.id ? null : c.id)}
          >
            {cleVisible === c.id ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => copierCle(c.cle)}
          >
            {cleCopiee === c.cle ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      ),
    },
    {
      id: 'permissions',
      label: 'Permissions',
      largeur: '180px',
      accesseur: (c) => (
        <div className="flex flex-wrap gap-1">
          {c.permissions.map((perm) => (
            <Badge key={perm} variant="secondary" className="text-xs">
              {perm}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'requetes',
      label: 'Requêtes',
      largeur: '100px',
      accesseur: (c) => (
        <span className="text-sm text-muted-foreground">{formaterNombre(c.nombreRequetes)}</span>
      ),
    },
    {
      id: 'statut',
      label: 'Statut',
      largeur: '100px',
      accesseur: (c) => (
        <span
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium',
            c.estActive ? 'text-emerald-600' : 'text-slate-500'
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              c.estActive ? 'bg-emerald-500' : 'bg-slate-400'
            )}
          />
          {c.estActive ? 'Active' : 'Révoquée'}
        </span>
      ),
    },
    {
      id: 'expiration',
      label: 'Expiration',
      largeur: '120px',
      accesseur: (c) => {
        const estExpiree = c.dateExpiration < new Date()
        const expireBientot =
          !estExpiree && c.dateExpiration < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        return (
          <span
            className={cn(
              'text-sm',
              estExpiree && 'text-red-600',
              expireBientot && !estExpiree && 'text-amber-600',
              !estExpiree && !expireBientot && 'text-muted-foreground'
            )}
          >
            {formaterDateCourte(c.dateExpiration)}
          </span>
        )
      },
    },
  ]

  const actions: ActionLigne<CleApi>[] = [
    {
      id: 'renouveler',
      label: 'Renouveler',
      icone: RotateCcw,
      onClick: (c) => {
        // Action de renouvellement
      },
      condition: (c) => c.estActive,
    },
    {
      id: 'revoquer',
      label: 'Révoquer',
      icone: Ban,
      variante: 'destructive',
      onClick: (c) => {
        setCleSelectionnee(c)
        setModaleRevocationOuverte(true)
      },
      condition: (c) => c.estActive,
    },
  ]

  if (estChargement && clesApi.length === 0) {
    return <ChargeurPage avecCartes={4} avecTable />
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CarteStats
          titre="Clés totales"
          valeur={statsApi.total}
          icone={Key}
          couleur="bleu"
          delaiAnimation={0}
        />
        <CarteStats
          titre="Clés actives"
          valeur={statsApi.actives}
          icone={Key}
          couleur="vert"
          delaiAnimation={100}
        />
        <CarteStats
          titre="Requêtes totales"
          valeur={statsApi.requetesTotales}
          format="abrege"
          icone={Key}
          couleur="violet"
          delaiAnimation={200}
        />
        <CarteStats
          titre="Expirant bientôt"
          valeur={statsApi.expirantBientot}
          icone={Key}
          couleur="orange"
          delaiAnimation={300}
        />
      </div>

      {/* Liste des clés */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Clés API</CardTitle>
            <CardDescription>Gérez les clés API et leurs permissions</CardDescription>
          </div>
          <ChampRecherche
            placeholder="Rechercher..."
            valeur={recherche}
            onChange={setRecherche}
            className="w-full sm:w-64"
          />
        </CardHeader>
        <CardContent>
          <TableDonnees
            colonnes={colonnes}
            donnees={clesApi}
            estChargement={estChargement}
            pagination={pagination}
            onChangementPage={(page) => setPagination((prev) => ({ ...prev, page }))}
            actions={actions}
            idAccesseur={(c) => c.id}
          />
        </CardContent>
      </Card>

      {/* Modale révocation */}
      <ModaleConfirmation
        estOuverte={modaleRevocationOuverte}
        onFermer={() => setModaleRevocationOuverte(false)}
        onConfirmer={async () => {
          if (cleSelectionnee) {
            await revoquerCleApi(cleSelectionnee.id)
            await chargerClesApi()
          }
          setModaleRevocationOuverte(false)
        }}
        titre="Révoquer la clé API"
        description={`Êtes-vous sûr de vouloir révoquer cette clé API ? L'utilisateur ne pourra plus l'utiliser pour accéder à l'API.`}
        texteConfirmation="Révoquer"
        variante="destructive"
      />
    </div>
  )
}
