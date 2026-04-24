'use client'

import { useEffect, useState } from 'react'
import { FileStack } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { recupererPacksDisponibles } from '@/lib/api/user-service'
import type { PackDisponible } from '@/lib/types-user'
import { formaterMontant, formaterNombre } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

/** Même cadre visuel pour le bloc quotas et le bloc prix (hauteur et largeur). */
const classeBlocMetrique =
  'flex min-h-14 w-full items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5'

export default function PageAchats() {
  const [estChargement, setEstChargement] = useState(true)
  const [packs, setPacks] = useState<PackDisponible[]>([])
  const [packSelectionne, setPackSelectionne] = useState<string | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        setEstChargement(true)
        const reponse = await recupererPacksDisponibles()

        if (reponse.succes && reponse.donnees) {
          setPacks(reponse.donnees)
        }

        setEstChargement(false)
      })()
    })
  }, [])

  if (estChargement) {
    return <ChargeurPageUser avecListe typeAffichage="grille" />
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 pb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Acheter des quotas</h2>
        <p className="mx-auto max-w-lg text-sm text-slate-500">
          Quotas, prix en XOF et validité sont indiqués sur chaque carte.
        </p>
      </div>

      <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {packs.map((pack, index) => {
          return (
            <Card
              key={pack.id}
              className={cn(
                'flex h-full cursor-pointer flex-col overflow-hidden border-border/40 transition-all duration-200 animate-in fade-in slide-in-from-bottom-3',
                packSelectionne === pack.id && 'ring-2 ring-primary ring-offset-2'
              )}
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}
              onClick={() => setPackSelectionne(pack.id)}
            >
              <CardHeader className="space-y-2 pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900">{pack.nom}</CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-slate-600">
                  {pack.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                <div className={classeBlocMetrique}>
                  <FileStack className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="text-sm text-slate-700">
                    <span className="font-semibold tabular-nums">{formaterNombre(pack.credits)}</span>
                    <span className="text-slate-500"> quotas</span>
                  </span>
                </div>

                <div className={cn(classeBlocMetrique, 'flex-col items-stretch justify-center gap-0.5')}>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Prix (XOF)</p>
                  <p className="text-lg font-bold tabular-nums leading-tight text-slate-900">
                    {formaterMontant(pack.prix, pack.devise)}
                  </p>
                </div>

                <Button
                  type="button"
                  className="mt-auto w-full max-w-full shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPackSelectionne(pack.id)
                  }}
                >
                  Choisir ce pack
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
