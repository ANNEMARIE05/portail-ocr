'use client'

import { useEffect, useState } from 'react'
import { FileText, Zap, Clock, Target, ArrowUpRight, Upload, Sparkles, TrendingUp, Activity } from 'lucide-react'
import { CarteStatUser } from '@/components/user/carte-stat-user'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { recupererStatistiquesUser, recupererDocumentsRecents } from '@/lib/api/user-service'
import type { StatistiquesUser, DocumentOCR } from '@/lib/types-user'
import { formaterDateRelative } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function PageTableauBordUser() {
  const [estChargement, setEstChargement] = useState(true)
  const [stats, setStats] = useState<StatistiquesUser | null>(null)
  const [documentsRecents, setDocumentsRecents] = useState<DocumentOCR[]>([])

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      
      const [reponseStats, reponseDocuments] = await Promise.all([
        recupererStatistiquesUser(),
        recupererDocumentsRecents(5),
      ])

      if (reponseStats.succes && reponseStats.donnees) {
        setStats(reponseStats.donnees)
      }
      if (reponseDocuments.succes && reponseDocuments.donnees) {
        setDocumentsRecents(reponseDocuments.donnees)
      }

      setEstChargement(false)
    }

    chargerDonnees()
  }, [])

  if (estChargement) {
    return <ChargeurPageUser avecCartes={4} avecActions avecListe />
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Erreur lors du chargement des donnees</p>
      </div>
    )
  }

  const pourcentageQuota = Math.round((stats.creditsUtilises / stats.creditsTotal) * 100)

  const getStatutBadge = (statut: DocumentOCR['statut']) => {
    switch (statut) {
      case 'termine':
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-0 text-[10px] font-medium">Termine</Badge>
      case 'en-cours':
        return <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-0 text-[10px] font-medium">En cours</Badge>
      case 'erreur':
        return <Badge variant="secondary" className="bg-red-50 text-red-700 border-0 text-[10px] font-medium">Erreur</Badge>
      default:
        return null
    }
  }

  const getIconeFichier = (type: DocumentOCR['typeFichier']) => {
    return (
      <div className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg",
        type === 'pdf' && "bg-red-50",
        type === 'image' && "bg-blue-50",
        type === 'word' && "bg-indigo-50",
        type === 'autre' && "bg-slate-50",
      )}>
        <FileText className={cn(
          "h-5 w-5",
          type === 'pdf' && "text-red-600",
          type === 'image' && "text-blue-600",
          type === 'word' && "text-indigo-600",
          type === 'autre' && "text-slate-600",
        )} />
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
          <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10 transition-all hover:shadow-xl hover:-translate-y-0.5">
            <Upload className="h-4 w-4" />
            Nouvelle extraction
          </Button>
        </Link>
      </div>

      {/* Cartes statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CarteStatUser
          titre="Credits restants"
          valeur={stats.creditsRestants}
          icone={Sparkles}
          variante="gradient"
          delaiAnimation={0}
          description={`sur ${stats.creditsTotal} total`}
        />
        <CarteStatUser
          titre="Documents traites"
          valeur={stats.documentsTraites}
          variation={stats.variationDocuments}
          icone={FileText}
          variante="defaut"
          delaiAnimation={100}
        />
        <CarteStatUser
          titre="Precision moyenne"
          valeur={stats.precisionMoyenne * 10}
          format="pourcentage"
          icone={Target}
          variante="defaut"
          delaiAnimation={200}
        />
        <CarteStatUser
          titre="Appels API ce mois"
          valeur={stats.appelApiMois}
          icone={Zap}
          variante="accent"
          delaiAnimation={300}
        />
      </div>

      {/* Section principale */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Zone d'action rapide */}
        <Card className="lg:col-span-1 border-slate-200/60 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-5 w-5 text-slate-600" />
              Utilisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Jauge de credits */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Credits utilises</span>
                <span className="font-semibold text-slate-900">{pourcentageQuota}%</span>
              </div>
              <div className="relative">
                <Progress value={pourcentageQuota} className="h-2" />
                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>{stats.creditsUtilises} utilises</span>
                  <span>{stats.creditsRestants} restants</span>
                </div>
              </div>
              {pourcentageQuota >= 80 && (
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                  <Sparkles className="h-4 w-4" />
                  <span>Vos credits sont presque epuises</span>
                </div>
              )}
            </div>

            {/* Metriques rapides */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="h-4 w-4" />
                  <span>Temps moyen</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{stats.tempsMoyenTraitement}s</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText className="h-4 w-4" />
                  <span>Docs aujourd&apos;hui</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">{stats.documentsJour}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <TrendingUp className="h-4 w-4" />
                  <span>Variation</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">+{stats.variationDocuments}%</span>
              </div>
            </div>

            {/* Bouton acheter */}
            <Link href="/user/achats" className="block">
              <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all">
                <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                Recharger mes credits
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Documents recents */}
        <Card className="lg:col-span-2 border-slate-200/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold">Documents recents</CardTitle>
              <CardDescription>Vos dernieres extractions OCR</CardDescription>
            </div>
            <Link href="/user/historique" className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Voir tout
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documentsRecents.map((doc, index) => (
                <div
                  key={doc.id}
                  className="group flex items-center gap-4 rounded-lg border border-slate-200/60 p-4 transition-all hover:bg-slate-50/50 hover:border-slate-300/60 hover:shadow-sm animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                >
                  {getIconeFichier(doc.typeFichier)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate">{doc.nomFichier}</p>
                      {getStatutBadge(doc.statut)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{formaterDateRelative(doc.dateTraitement)}</span>
                      {doc.nombrePages && <span>{doc.nombrePages} page{doc.nombrePages > 1 ? 's' : ''}</span>}
                      {doc.precision && <span>{doc.precision}% precision</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    Voir
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zone d'action principale */}
      <Card className="border-slate-200/60 border-dashed bg-gradient-to-br from-slate-50 to-white overflow-hidden">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/20 mb-4">
            <Upload className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Pret a extraire du texte ?</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md">
            Deposez vos documents PDF ou images pour extraire automatiquement le texte grace a notre technologie OCR avancee.
          </p>
          <div className="flex gap-3">
            <Link href="/user/documents">
              <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10">
                <Upload className="h-4 w-4" />
                Importer un document
              </Button>
            </Link>
            <Link href="/user/apis">
              <Button variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50">
                <Zap className="h-4 w-4" />
                Utiliser l&apos;API
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
