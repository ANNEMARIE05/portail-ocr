'use client'

import { useEffect, useState } from 'react'
import { FileText, Target, Upload, Sparkles, Timer } from 'lucide-react'
import { CarteStatUser } from '@/components/user/carte-stat-user'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { Button } from '@/components/ui/button'
import { recupererStatistiquesUser } from '@/lib/api/user-service'
import { titreBienvenueDepuisUserinfo } from '@/lib/api/session-client'
import type { StatistiquesUser } from '@/lib/types-user'
import Link from 'next/link'

export default function PageTableauBordUser() {
  const [estChargement, setEstChargement] = useState(true)
  const [stats, setStats] = useState<StatistiquesUser | null>(null)
  const [titreBienvenue, setTitreBienvenue] = useState('Bonjour')

  useEffect(() => {
    setTitreBienvenue(titreBienvenueDepuisUserinfo())
  }, [])

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
    <div className="space-y-2 sm:space-y-4 md:space-y-6">
      {/* Message de bienvenue */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-0 sm:space-y-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl md:text-2xl">{titreBienvenue}</h2>
          <p className="text-[11px] text-slate-500 sm:text-xs md:text-sm">Voici un apercu de votre activite OCR</p>
        </div>
        <Link href="/user/documents" className="shrink-0">
          <Button className="w-full gap-2 bg-primary hover:bg-primary/90 sm:w-auto">
            <Upload className="h-4 w-4" />
            Nouvelle extraction
          </Button>
        </Link>
      </div>

      {/* Cartes statistiques */}
      <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-2 md:gap-3 lg:grid-cols-4">
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
