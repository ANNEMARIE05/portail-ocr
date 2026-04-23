'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Package, Users, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ChargeurPage } from '@/components/admin/page-loader'
import { recupererPacks, modifierPack } from '@/lib/api/admin-service'
import type { Pack } from '@/lib/types-admin'
import { formaterMontant, formaterNombre } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PagePacks() {
  const [estChargement, setEstChargement] = useState(true)
  const [packs, setPacks] = useState<Pack[]>([])

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
        <Button>
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <Package className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{pack.nom}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex items-center gap-1 text-xs font-medium',
                          pack.estActif ? 'text-emerald-600' : 'text-slate-500'
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

              <Button variant="outline" className="w-full">
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
