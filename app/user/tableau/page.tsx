'use client'

import { useEffect, useState } from 'react'
import { FileText, Target, Upload, Sparkles, Timer } from 'lucide-react'
import { CarteStatUser } from '@/components/user/carte-stat-user'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { Button } from '@/components/ui/button'
import { recupererStatistiquesUser } from '@/lib/api/user-service'
import type { StatistiquesUser } from '@/lib/types-user'
import Link from 'next/link'

export default function PageTableauBordUser() {
  const [estChargement, setEstChargement] = useState(true)
  const [stats, setStats] = useState<StatistiquesUser | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      void (async () => {
        setEstChargement(true)

        const reponseStats = await recupererStatistiquesUser()

        if (reponseStats.succes && reponseStats.donnees) {
          setStats(reponseStats.donnees)
        }

        setEstChargement(false)
      })()
    })
  }, [])

  if (estChargement) {
    return <ChargeurPageUser avecCartes={4} avecActions />
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Erreur lors du chargement des donnees</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message de bienvenue */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Bonjour Marie</h2>
          <p className="text-sm text-slate-500">Voici un apercu de votre activite OCR</p>
        </div>
        <Link href="/user/documents">
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4" />
            Nouvelle extraction
          </Button>
        </Link>
      </div>

      {/* Cartes statistiques */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CarteStatUser
          titre="Documents traités"
          valeur={stats.documentsTraites}
          variation={stats.variationDocuments}
          icone={FileText}
          couleur="vert"
          delaiAnimation={0}
        />
        <CarteStatUser
          titre="Quotas restants"
          valeur={stats.creditsRestants}
          icone={Sparkles}
          couleur="bleu"
          delaiAnimation={100}
          description={`sur ${stats.creditsTotal} au total`}
        />
        <CarteStatUser
          titre="Précision moyenne"
          valeur={stats.precisionMoyenne * 10}
          format="pourcentage"
          icone={Target}
          couleur="orange"
          delaiAnimation={200}
          description="Sur les documents validés"
        />
        <CarteStatUser
          titre="Temps moyen"
          valeur={stats.tempsMoyenTraitement}
          format="duree"
          icone={Timer}
          couleur="violet"
          delaiAnimation={300}
          description="Par document traité"
        />
      </div>
    </div>
  )
}
