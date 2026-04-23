'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, CreditCard, TrendingUp, UserPlus, ShoppingCart, Zap, MessageSquare } from 'lucide-react'
import { CarteStats } from '@/components/admin/stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChargeurPage } from '@/components/admin/page-loader'
import { BadgeStatut } from '@/components/admin/status-badge'
import {
  recupererStatistiques,
  recupererDonneesGraphique,
  recupererActivitesRecentes,
} from '@/lib/api/admin-service'
import type { StatistiquesGlobales, DonneesGraphique, ActiviteRecente } from '@/lib/types-admin'
import { formaterDateRelative, formaterMontant } from '@/lib/utils/formatage'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

export default function PageTableauBord() {
  const [estChargement, setEstChargement] = useState(true)
  const [stats, setStats] = useState<StatistiquesGlobales | null>(null)
  const [donneesGraphique, setDonneesGraphique] = useState<DonneesGraphique[]>([])
  const [activites, setActivites] = useState<ActiviteRecente[]>([])

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      
      const [reponseStats, reponseGraphique, reponseActivites] = await Promise.all([
        recupererStatistiques(),
        recupererDonneesGraphique('7j'),
        recupererActivitesRecentes(8),
      ])

      if (reponseStats.succes && reponseStats.donnees) {
        setStats(reponseStats.donnees)
      }
      if (reponseGraphique.succes && reponseGraphique.donnees) {
        setDonneesGraphique(reponseGraphique.donnees)
      }
      if (reponseActivites.succes && reponseActivites.donnees) {
        setActivites(reponseActivites.donnees)
      }

      setEstChargement(false)
    }

    chargerDonnees()
  }, [])

  if (estChargement) {
    return <ChargeurPage avecCartes={4} avecGraphique avecTable />
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Erreur lors du chargement des données</p>
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
          titre="Documents traités"
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

      {/* Graphiques */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Graphique documents */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Documents traités</CardTitle>
            <CardDescription>Évolution sur les 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donneesGraphique} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientDocuments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="jour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="documents"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#gradientDocuments)"
                    name="Documents"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Graphique revenus */}
        <Card className="border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenus quotidiens</CardTitle>
            <CardDescription>Évolution sur les 7 derniers jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={donneesGraphique} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="jour"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    width={50}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => [`${value}€`, 'Revenus']}
                  />
                  <Bar dataKey="revenus" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenus" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activités récentes */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Activités récentes</CardTitle>
          <CardDescription>Les dernières actions sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activites.map((activite) => (
              <div
                key={activite.id}
                className="flex items-start gap-4 rounded-lg border border-border/40 p-4 transition-colors hover:bg-muted/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  {getIconeActivite(activite.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{activite.description}</p>
                    <span className="text-xs text-muted-foreground">
                      {formaterDateRelative(activite.date)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activite.utilisateur}</p>
                  {activite.details && (
                    <p className="text-xs text-muted-foreground">{activite.details}</p>
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
