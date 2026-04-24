'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Key, Copy, Eye, EyeOff, Check, RefreshCw, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { recupererClesApiUser, regenererCleApiUser, recupererStatistiquesUser } from '@/lib/api/user-service'
import type { CleApiUser, StatistiquesUser } from '@/lib/types-user'
import { formaterDateCourte, formaterNombre } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

function masquerCle(cle: string) {
  return `${cle.substring(0, 12)}...${cle.substring(cle.length - 4)}`
}

export default function PageApis() {
  const [estChargement, setEstChargement] = useState(true)
  const [cles, setCles] = useState<CleApiUser[]>([])
  const [stats, setStats] = useState<StatistiquesUser | null>(null)
  const [visibiliteCle, setVisibiliteCle] = useState<Record<string, boolean>>({})
  const [cleCopie, setCleCopie] = useState<string | null>(null)
  const [idCleRegeneration, setIdCleRegeneration] = useState<string | null>(null)
  const [estRegenerationEnCours, setEstRegenerationEnCours] = useState(false)
  const [erreurRegeneration, setErreurRegeneration] = useState<string | null>(null)

  const charger = useCallback(async () => {
    setEstChargement(true)
    const [reponseCles, reponseStats] = await Promise.all([
      recupererClesApiUser(),
      recupererStatistiquesUser(),
    ])
    if (reponseCles.succes && reponseCles.donnees) {
      setCles(reponseCles.donnees)
    }
    if (reponseStats.succes && reponseStats.donnees) {
      setStats(reponseStats.donnees)
    }
    setEstChargement(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void charger()
    })
  }, [charger])

  const copierCle = async (cle: string) => {
    await navigator.clipboard.writeText(cle)
    setCleCopie(cle)
    setTimeout(() => setCleCopie(null), 2000)
  }

  const basculerVisibilite = (id: string) => {
    setVisibiliteCle((p) => ({ ...p, [id]: !p[id] }))
  }

  const confirmerRegenerationCle = async () => {
    if (!idCleRegeneration) return
    setErreurRegeneration(null)
    setEstRegenerationEnCours(true)
    const reponse = await regenererCleApiUser(idCleRegeneration)
    setEstRegenerationEnCours(false)

    if (reponse.succes && reponse.donnees) {
      setCleCopie(null)
      setVisibiliteCle((p) => ({ ...p, [idCleRegeneration]: true }))
      setIdCleRegeneration(null)
      await charger()
    } else {
      setErreurRegeneration(reponse.erreur ?? 'La regeneration a echoue.')
    }
  }

  const cleEnCoursDeRegeneration = idCleRegeneration ? cles.find((c) => c.id === idCleRegeneration) : null

  const pourcentageQuotaUtilise =
    stats && stats.creditsTotal > 0
      ? Math.min((stats.creditsUtilises / stats.creditsTotal) * 100, 100)
      : 0

  if (estChargement && cles.length === 0) {
    return <ChargeurPageUser avecListe typeAffichage="liste" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Mes cles API</h2>
        <p className="text-sm text-slate-500">Gerez vos cles d&apos;acces a l&apos;API OCR</p>
      </div>

      {stats && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Votre quota</CardTitle>
                <CardDescription>
                  Même quota que pour les extractions depuis le portail — chaque appel le consomme.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="shrink-0" asChild>
                <Link href="/user/achats">Acheter des quotas</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Quota restant</span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {formaterNombre(stats.creditsRestants)} / {formaterNombre(stats.creditsTotal)}
              </span>
            </div>
            <Progress value={100 - pourcentageQuotaUtilise} className="h-2" />
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Utilisation : {formaterNombre(stats.creditsUtilises)} / {formaterNombre(stats.creditsTotal)}
              </span>
              {pourcentageQuotaUtilise >= 80 ? (
                <span className="font-medium text-amber-700">Pensez a acheter du quota</span>
              ) : (
                <span>Votre quota est confortable</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Vos cles d&apos;acces</CardTitle>
          <CardDescription>
            Authentifiez vos appels — gardez la clé privée et régénérez-la si elle fuite.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cles.length === 0 && !estChargement ? (
            <p className="text-sm text-muted-foreground">Aucune cle API enregistree.</p>
          ) : (
            cles.map((cle) => (
              <div
                key={cle.id}
                className="overflow-hidden rounded-xl border border-border/50 bg-muted/20 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                        cle.estActive ? 'bg-emerald-50' : 'bg-muted',
                      )}
                    >
                      <Key
                        className={cn('h-5 w-5', cle.estActive ? 'text-emerald-600' : 'text-muted-foreground')}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{cle.nom}</h3>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'border-0 text-[10px]',
                            cle.estActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {cle.estActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cle.permissions.map((perm) => (
                          <Badge
                            key={perm}
                            variant="outline"
                            className="text-[10px] font-normal text-muted-foreground"
                          >
                            {perm}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Creee le {formaterDateCourte(cle.dateCreation)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                    {cle.estActive && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => {
                          setErreurRegeneration(null)
                          setIdCleRegeneration(cle.id)
                        }}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerer
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex max-w-full flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-border/40 bg-background px-2 py-2">
                    <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                      {visibiliteCle[cle.id] ? cle.cle : masquerCle(cle.cle)}
                    </code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => basculerVisibilite(cle.id)}
                      aria-label={visibiliteCle[cle.id] ? 'Masquer la cle' : 'Afficher la cle'}
                    >
                      {visibiliteCle[cle.id] ? (
                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => copierCle(cle.cle)}
                    >
                      {cleCopie === cle.cle ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <ModaleConfirmation
        estOuverte={idCleRegeneration !== null}
        onFermer={() => {
          if (!estRegenerationEnCours) {
            setIdCleRegeneration(null)
            setErreurRegeneration(null)
          }
        }}
        onConfirmer={confirmerRegenerationCle}
        titre="Regenerer cette cle API ?"
        description={
          erreurRegeneration
            ? erreurRegeneration
            : cleEnCoursDeRegeneration
              ? `L'ancienne valeur de « ${cleEnCoursDeRegeneration.nom} » cessera de fonctionner tout de suite. Mettez a jour vos integrations avec la nouvelle cle.`
              : 'Une nouvelle cle secrete sera generee.'
        }
        texteConfirmation="Regenerer"
        estChargement={estRegenerationEnCours}
      />
    </div>
  )
}
