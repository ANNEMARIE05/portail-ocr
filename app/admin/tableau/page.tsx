'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, CreditCard, TrendingUp, UserPlus, ShoppingCart, Zap, MessageSquare, ArrowUpRight, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { CarteStats } from '@/components/admin/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChargeurPage } from '@/components/admin/page-loader'
import { BadgeStatut } from '@/components/admin/status-badge'
import { Progress } from '@/components/ui/progress'
import {
  recupererStatistiques,
  recupererActivitesRecentes,
} from '@/lib/api/admin-service'
import type { StatistiquesGlobales, ActiviteRecente } from '@/lib/types-admin'
import { formaterDateRelative, formaterMontant, formaterNombreAbrege } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageTableauBord() {
  const [estChargement, setEstChargement] = useState(true)
  const [stats, setStats] = useState<StatistiquesGlobales | null>(null)
  const [activites, setActivites] = useState<ActiviteRecente[]>([])

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      
      const [reponseStats, reponseActivites] = await Promise.all([
        recupererStatistiques(),
        recupererActivitesRecentes(8),
      ])

      if (reponseStats.succes && reponseStats.donnees) {
        setStats(reponseStats.donnees)
      }
      if (reponseActivites.succes && reponseActivites.donnees) {
        setActivites(reponseActivites.donnees)
      }

      setEstChargement(false)
    }

    chargerDonnees()
  }, [])

  if (estChargement) {
    return <ChargeurPage avecCartes={4} avecTable />
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Erreur lors du chargement des donnees</p>
      </div>
    )
  }

  const getIconeActivite = (type: ActiviteRecente['type']) => {
    switch (type) {
      case 'inscription':
        return <UserPlus className="h-4 w-4 text-blue-600" />
      case 'achat':
        return <ShoppingCart className="h-4 w-4 text-emerald-600" />
      case 'document':
        return <FileText className="h-4 w-4 text-amber-600" />
      case 'support':
        return <MessageSquare className="h-4 w-4 text-violet-600" />
      case 'api':
        return <Zap className="h-4 w-4 text-rose-600" />
      default:
        return null
    }
  }

  const getCouleurActivite = (type: ActiviteRecente['type']) => {
    switch (type) {
      case 'inscription':
        return 'bg-blue-50 border-blue-100'
      case 'achat':
        return 'bg-emerald-50 border-emerald-100'
      case 'document':
        return 'bg-amber-50 border-amber-100'
      case 'support':
        return 'bg-violet-50 border-violet-100'
      case 'api':
        return 'bg-rose-50 border-rose-100'
      default:
        return 'bg-slate-50 border-slate-100'
    }
  }

  // Donnees pour les indicateurs de performance
  const indicateursPerformance = [
    {
      label: 'Taux de reussite OCR',
      valeur: 98.7,
      cible: 99,
      statut: 'excellent' as const,
    },
    {
      label: 'Temps moyen traitement',
      valeur: 1.2,
      cible: 2,
      unite: 's',
      statut: 'excellent' as const,
    },
    {
      label: 'Disponibilite API',
      valeur: 99.9,
      cible: 99.5,
      statut: 'excellent' as const,
    },
    {
      label: 'Tickets en attente',
      valeur: 5,
      cible: 10,
      statut: 'attention' as const,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Cartes statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CarteStats
          titre="Utilisateurs actifs"
          valeur={stats.utilisateursActifs}
          variation={stats.variationUtilisateurs}
          icone={Users}
          couleur="bleu"
          delaiAnimation={0}
        />
        <CarteStats
          titre="Documents traites"
          valeur={stats.totalDocumentsTraites}
          format="abrege"
          variation={stats.variationDocuments}
          icone={FileText}
          couleur="vert"
          delaiAnimation={100}
        />
        <CarteStats
          titre="Revenus (30j)"
          valeur={stats.revenus30Jours}
          format="montant"
          variation={stats.variationRevenus}
          icone={CreditCard}
          couleur="violet"
          delaiAnimation={200}
        />
        <CarteStats
          titre="Taux de conversion"
          valeur={stats.tauxConversion}
          format="pourcentage"
          variation={stats.variationTauxConversion}
          icone={TrendingUp}
          couleur="orange"
          delaiAnimation={300}
        />
      </div>

      {/* Section avec indicateurs et resume */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Indicateurs de performance */}
        <Card className="border-border/40 shadow-sm lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Performance systeme
            </CardTitle>
            <CardDescription>Indicateurs cles en temps reel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {indicateursPerformance.map((indicateur, index) => (
              <div 
                key={indicateur.label} 
                className="space-y-2 animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{indicateur.label}</span>
                  <span className={cn(
                    "font-semibold",
                    indicateur.statut === 'excellent' && "text-emerald-600",
                    indicateur.statut === 'attention' && "text-amber-600",
                    indicateur.statut === 'critique' && "text-red-600",
                  )}>
                    {indicateur.valeur}{indicateur.unite || '%'}
                  </span>
                </div>
                <Progress 
                  value={Math.min((indicateur.valeur / indicateur.cible) * 100, 100)} 
                  className="h-1.5"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resume rapide */}
        <Card className="border-border/40 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Clock className="h-5 w-5 text-blue-600" />
              Resume du jour
            </CardTitle>
            <CardDescription>Apercu des activites des dernieres 24 heures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 hover:shadow-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nouveaux users</span>
                <span className="text-2xl font-semibold text-foreground">{stats.nouveauxUtilisateursJour}</span>
                <span className="text-xs text-emerald-600">+{Math.round(stats.variationUtilisateurs)}% vs hier</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 hover:shadow-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Docs traites</span>
                <span className="text-2xl font-semibold text-foreground">{formaterNombreAbrege(stats.documentsJour)}</span>
                <span className="text-xs text-emerald-600">+{Math.round(stats.variationDocuments)}% vs hier</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 hover:shadow-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Revenus</span>
                <span className="text-2xl font-semibold text-foreground">{formaterMontant(stats.revenus30Jours / 30)}</span>
                <span className="text-xs text-emerald-600">Moyenne journaliere</span>
              </div>
              <div className="flex flex-col gap-1 rounded-lg border border-border/40 bg-slate-50/50 p-4 transition-all hover:bg-slate-50 hover:shadow-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total utilisateurs</span>
                <span className="text-2xl font-semibold text-foreground">{formaterNombreAbrege(stats.totalUtilisateurs)}</span>
                <span className="text-xs text-muted-foreground">{Math.round((stats.utilisateursActifs / stats.totalUtilisateurs) * 100)}% actifs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activites recentes */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Activites recentes</CardTitle>
            <CardDescription>Les dernieres actions sur la plateforme</CardDescription>
          </div>
          <a href="/admin/utilisateurs" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Voir tout
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {activites.map((activite, index) => (
              <div
                key={activite.id}
                className={cn(
                  "flex items-start gap-4 rounded-lg border p-4 transition-all hover:shadow-sm animate-in fade-in slide-in-from-bottom-2",
                  getCouleurActivite(activite.type)
                )}
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  {getIconeActivite(activite.type)}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{activite.description}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formaterDateRelative(activite.date)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{activite.utilisateur}</p>
                  {activite.details && (
                    <p className="text-xs text-muted-foreground truncate">{activite.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
