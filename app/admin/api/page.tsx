'use client'

import { useEffect, useState, useCallback } from 'react'
import { Copy, RotateCcw, Ban, Check, Eye, EyeOff, PanelRight, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { ChargeurPage } from '@/components/admin/page-loader'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  recupererClientsGestionApi,
  revoquerCleApi,
  mettreAJourPermissionsCleApi,
  regenererCleApi,
} from '@/lib/api/admin-service'
import type { CleApi, ColonneTable, ActionLigne, ConfigPagination, LigneClientGestionApi } from '@/lib/types-admin'
import {
  formaterDateCourte,
  formaterNombre,
  formaterPourcentage,
  formaterDateHeureAvecSecondes,
} from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

const PERMISSIONS_AFFICHAGE = ['ecriture', 'lecture', 'soumission'] as const

const libellePermission = (code: string): string => {
  const map: Record<string, string> = {
    ecriture: 'Modifier',
    lecture: 'Lecture seule',
    soumission: 'Soumission',
    suppression: 'Suppression',
  }
  return map[code] ?? code
}

function masquerClePourApercu(cle: string): string {
  const prefixe = cle.slice(0, 22)
  return cle.length > 22 ? `${prefixe}...` : `${cle}...`
}

export default function PageApi() {
  const [estChargement, setEstChargement] = useState(true)
  const [lignes, setLignes] = useState<LigneClientGestionApi[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')

  const [ligneDetail, setLigneDetail] = useState<LigneClientGestionApi | null>(null)
  const [sheetOuvert, setSheetOuvert] = useState(false)
  const [cleSelectionnee, setCleSelectionnee] = useState<CleApi | null>(null)
  const [modaleRevocationOuverte, setModaleRevocationOuverte] = useState(false)
  const [cleCopiee, setCleCopiee] = useState<string | null>(null)
  const [cleVisibleDansSheet, setCleVisibleDansSheet] = useState(false)
  const [permissionEnCours, setPermissionEnCours] = useState<string | null>(null)
  const [modaleRegenerationOuverte, setModaleRegenerationOuverte] = useState(false)
  const [estRegenerationEnCours, setEstRegenerationEnCours] = useState(false)

  const charger = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererClientsGestionApi(pagination.page, pagination.parPage, recherche)

    if (reponse.succes && reponse.donnees) {
      setLignes(reponse.donnees)
      if (reponse.pagination) {
        setPagination(reponse.pagination)
      }
    }
    setEstChargement(false)
  }, [pagination.page, pagination.parPage, recherche])

  useEffect(() => {
    queueMicrotask(() => {
      void charger()
    })
  }, [charger])

  const gererChangementRecherche = useCallback((terme: string) => {
    setRecherche(terme)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  const copierCle = (cle: string) => {
    navigator.clipboard.writeText(cle)
    setCleCopiee(cle)
    setTimeout(() => setCleCopiee(null), 2000)
  }

  const ouvrirDetail = (l: LigneClientGestionApi) => {
    setLigneDetail(l)
    setCleVisibleDansSheet(false)
    setSheetOuvert(true)
  }

  const appliquerCleDansPanier = (cle: CleApi) => {
    setLigneDetail((prev) => {
      if (!prev || prev.utilisateurId !== cle.utilisateurId) return prev
      const cles = prev.cles.map((c) => (c.id === cle.id ? cle : c))
      const tri = [...cles].sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime())
      const principale = tri[0]!
      return {
        ...prev,
        cleMasquee: masquerClePourApercu(principale.cle),
        statutActif: tri.some((c) => c.estActive),
        cles: tri,
      }
    })
  }

  const basculerPermission = async (
    code: (typeof PERMISSIONS_AFFICHAGE)[number],
    active: boolean
  ) => {
    const principale = ligneDetail?.cles[0]
    if (!principale?.estActive) return
    const ensemble = new Set(principale.permissions)
    if (active) ensemble.add(code)
    else ensemble.delete(code)
    setPermissionEnCours(code)
    const reponse = await mettreAJourPermissionsCleApi(principale.id, Array.from(ensemble))
    setPermissionEnCours(null)
    if (reponse.succes && reponse.donnees) {
      appliquerCleDansPanier(reponse.donnees)
      await charger()
    }
  }

  const principaleDetail = ligneDetail?.cles[0] ?? null

  const colonnes: ColonneTable<LigneClientGestionApi>[] = [
    {
      id: 'nomClient',
      label: 'Nom du client',
      largeur: '160px',
      accesseur: (l) => <span className="font-medium text-foreground">{l.nomClient}</span>,
    },
    {
      id: 'cle',
      label: 'Clé API',
      largeur: '240px',
      accesseur: (l) => (
        <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
          {l.cleMasquee}
        </code>
      ),
    },
    {
      id: 'statut',
      label: 'Statut',
      largeur: '110px',
      accesseur: (l) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-medium',
            l.statutActif ? 'text-emerald-600' : 'text-muted-foreground'
          )}
        >
          <span
            className={cn('h-2 w-2 rounded-full', l.statutActif ? 'bg-emerald-500' : 'bg-slate-400')}
          />
          {l.statutActif ? 'Actif' : 'Inactif'}
        </span>
      ),
    },
    {
      id: 'utilisation',
      label: 'Utilisation',
      largeur: '180px',
      accesseur: (l) => (
        <div className="flex max-w-[160px] flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{formaterPourcentage(l.pourcentageUtilisation, 0)}</span>
          </div>
          <Progress value={l.pourcentageUtilisation} className="h-1.5" />
        </div>
      ),
    },
    {
      id: 'nombreCles',
      label: 'Clés API',
      largeur: '100px',
      accesseur: (l) => (
        <Badge variant="secondary" className="tabular-nums">
          {l.nombreCles}
        </Badge>
      ),
    },
  ]

  const actions: ActionLigne<LigneClientGestionApi>[] = [
    {
      id: 'detail',
      label: 'Voir le détail',
      icone: PanelRight,
      onClick: (l) => ouvrirDetail(l),
    },
    {
      id: 'revoquer',
      label: 'Révoquer',
      icone: Ban,
      variante: 'destructive',
      onClick: (l) => {
        const c = l.cles[0]
        if (c?.estActive) {
          setCleSelectionnee(c)
          setModaleRevocationOuverte(true)
        }
      },
      condition: (l) => Boolean(l.cles[0]?.estActive),
    },
  ]

  if (estChargement && lignes.length === 0) {
    return <ChargeurPage avecTable />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Gestion d&apos;API</h2>
          <p className="text-sm text-muted-foreground">Vue par client : clés, statut et utilisation</p>
        </div>
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="pt-6">
          <TableDonnees
            colonnes={colonnes}
            donnees={lignes}
            estChargement={estChargement}
            pagination={pagination}
            onChangementPage={(page) => setPagination((prev) => ({ ...prev, page }))}
            onChangementParPage={(parPage) =>
              setPagination((prev) => ({ ...prev, parPage, page: 1 }))
            }
            selectParPageAuDessusDuTableau
            aCoteSelectParPage={
              <ChampRecherche
                placeholder="Rechercher un client ou une clé…"
                valeur={recherche}
                onChange={gererChangementRecherche}
                className="min-w-0 w-full flex-1 sm:min-w-[220px] sm:max-w-md"
              />
            }
            actions={actions}
            idAccesseur={(l) => l.utilisateurId}
            lignesParPageSkeleton={pagination.parPage}
            onLigneClick={ouvrirDetail}
          />
        </CardContent>
      </Card>

      <Sheet
        open={sheetOuvert}
        onOpenChange={(ouvert) => {
          setSheetOuvert(ouvert)
          if (!ouvert) {
            setLigneDetail(null)
            setCleVisibleDansSheet(false)
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-y-auto border-l p-0 sm:max-w-md"
        >
          {ligneDetail && principaleDetail && (
            <>
              <SheetHeader className="space-y-1 border-b border-border/60 px-6 py-5 text-left">
                <SheetTitle className="text-lg">Clés API — {ligneDetail.nomClient}</SheetTitle>
                <SheetDescription>Gérez les clés d&apos;accès et les permissions</SheetDescription>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-6 px-6 py-5">
                <section className="rounded-xl border border-border/60 bg-muted/25 p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Clé API principale</h3>
                      <p className="text-xs text-muted-foreground">
                        Créée le {formaterDateCourte(principaleDetail.dateCreation)}
                      </p>
                    </div>
                    <Badge
                      variant={principaleDetail.estActive ? 'default' : 'secondary'}
                      className={cn(
                        'shrink-0 capitalize',
                        principaleDetail.estActive && 'bg-emerald-600 hover:bg-emerald-600'
                      )}
                    >
                      {principaleDetail.estActive ? 'active' : 'révoquée'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-2.5">
                    <code className="min-w-0 flex-1 truncate font-mono text-xs">
                      {cleVisibleDansSheet
                        ? principaleDetail.cle
                        : '•'.repeat(42)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setCleVisibleDansSheet((v) => !v)}
                    >
                      {cleVisibleDansSheet ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copierCle(principaleDetail.cle)}
                    >
                      {cleCopiee === principaleDetail.cle ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {principaleDetail.estActive && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full gap-2"
                      onClick={() => setModaleRegenerationOuverte(true)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Régénérer la clé API
                    </Button>
                  )}
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Permissions</h3>
                    {!principaleDetail.estActive && (
                      <span className="text-xs text-muted-foreground">Clé révoquée — lecture seule</span>
                    )}
                  </div>
                  <div className="space-y-3 rounded-xl border border-border/60 bg-background p-4">
                    {PERMISSIONS_AFFICHAGE.map((code) => {
                      const active = principaleDetail.permissions.includes(code)
                      const estCharge = permissionEnCours === code
                      return (
                        <div key={code} className="flex items-center justify-between gap-4">
                          <Label htmlFor={`perm-${code}`} className="text-sm font-normal">
                            {libellePermission(code)}
                          </Label>
                          <div className="flex items-center gap-2">
                            {estCharge && (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                            )}
                            <Switch
                              id={`perm-${code}`}
                              checked={active}
                              disabled={!principaleDetail.estActive || estCharge}
                              onCheckedChange={(v) => basculerPermission(code, v)}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Soumission</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-border/50 bg-muted/15 p-3">
                      <p className="text-xs text-muted-foreground">Requêtes</p>
                      <p className="text-lg font-semibold tabular-nums">
                        {formaterNombre(principaleDetail.nombreRequetes)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-muted/15 p-3">
                      <p className="text-xs text-muted-foreground">Erreurs</p>
                      <p className="text-lg font-semibold tabular-nums">
                        {formaterNombre(principaleDetail.nombreErreurs ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Dernier :</span>{' '}
                      {principaleDetail.derniereUtilisation
                        ? formaterDateHeureAvecSecondes(principaleDetail.derniereUtilisation)
                        : '—'}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Expire :</span>{' '}
                      {formaterDateCourte(principaleDetail.dateExpiration)}
                    </p>
                  </div>
                </section>

                {ligneDetail.nombreCles > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Ce client possède {ligneDetail.nombreCles} clés au total. Ici : vue de la clé
                    principale (la plus récente).
                  </p>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ModaleConfirmation
        estOuverte={modaleRevocationOuverte}
        onFermer={() => setModaleRevocationOuverte(false)}
        onConfirmer={async () => {
          if (cleSelectionnee) {
            await revoquerCleApi(cleSelectionnee.id)
            await charger()
            setSheetOuvert(false)
            setLigneDetail(null)
          }
          setModaleRevocationOuverte(false)
        }}
        titre="Révoquer la clé API"
        description={
          cleSelectionnee
            ? `La clé principale de ${cleSelectionnee.utilisateurNom} sera révoquée. L’accès API ne sera plus possible avec cette clé.`
            : ''
        }
        texteConfirmation="Révoquer"
        variante="destructive"
      />

      <ModaleConfirmation
        estOuverte={modaleRegenerationOuverte}
        onFermer={() => {
          if (!estRegenerationEnCours) setModaleRegenerationOuverte(false)
        }}
        onConfirmer={async () => {
          const c = ligneDetail?.cles[0]
          if (!c?.estActive) {
            setModaleRegenerationOuverte(false)
            return
          }
          setEstRegenerationEnCours(true)
          const reponse = await regenererCleApi(c.id)
          setEstRegenerationEnCours(false)
          if (reponse.succes && reponse.donnees) {
            appliquerCleDansPanier(reponse.donnees)
            setCleVisibleDansSheet(true)
            await charger()
          }
          setModaleRegenerationOuverte(false)
        }}
        titre="Régénérer la clé API ?"
        description={
          principaleDetail
            ? `Une nouvelle clé secrète sera générée pour ${principaleDetail.utilisateurNom}. L’ancienne valeur cessera immédiatement de fonctionner : mettez à jour vos intégrations.`
            : ''
        }
        texteConfirmation="Régénérer"
        estChargement={estRegenerationEnCours}
      />
    </div>
  )
}
