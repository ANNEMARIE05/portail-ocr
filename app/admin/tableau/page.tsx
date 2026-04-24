'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Timer, Target, MessageSquare } from 'lucide-react'
import { CarteStats } from '@/components/admin/stat-card'
import { ChargeurPage } from '@/components/admin/page-loader'
import { Button } from '@/components/ui/button'
import { recupererStatistiques } from '@/lib/api/admin-service'
import type { StatistiquesGlobales } from '@/lib/types-admin'

export default function PageTableauBord() {
  const [estChargement, setEstChargement] = useState(true)
  const [stats, setStats] = useState<StatistiquesGlobales | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        setEstChargement(true)

        const reponseStats = await recupererStatistiques()

        if (reponseStats.succes && reponseStats.donnees) {
          setStats(reponseStats.donnees)
        }

        setEstChargement(false)
      })()
    })
  }, [])

  if (estChargement) {
    return <ChargeurPage avecCartes={4} />
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Erreur lors du chargement des donnees</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Bonjour Jean-Pierre</h2>
          <p className="text-sm text-slate-500">Voici un apercu de l&apos;activite de la plateforme</p>
        </div>
        <Link href="/admin/utilisateurs" className="shrink-0">
          <Button className="w-full gap-2 bg-primary hover:bg-primary/90 sm:w-auto">
            <Users className="h-4 w-4" />
            Gerer les utilisateurs
          </Button>
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <CarteStats
          titre="Utilisateurs actifs"
          valeur={stats.utilisateursActifs}
          variation={stats.variationUtilisateurs}
          icone={Users}
          couleur="bleu"
          delaiAnimation={0}
          description={`sur ${stats.totalUtilisateurs.toLocaleString('fr-FR')} inscrits`}
        />
        <CarteStats
          titre="Temps moyen"
          valeur={stats.tempsMoyenTraitement}
          format="duree"
          icone={Timer}
          couleur="violet"
          delaiAnimation={100}
          description="Par traitement OCR"
        />
        <CarteStats
          titre="Précision moyenne"
          valeur={stats.precisionMoyenne}
          format="pourcentage"
          variation={stats.variationPrecision}
          icone={Target}
          couleur="orange"
          delaiAnimation={200}
          description="Sur les documents validés"
        />
        <CarteStats
          titre="Tickets ouverts"
          valeur={stats.ticketsOuverts}
          icone={MessageSquare}
          couleur="vert"
          delaiAnimation={300}
          description="Ouverts et en cours"
        />
      </div>
    </div>
  )
}
