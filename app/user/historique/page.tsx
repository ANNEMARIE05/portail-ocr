'use client'

import { useEffect, useState } from 'react'
import { Search, Filter, FileText, Clock, Zap, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { recupererHistoriqueAppels } from '@/lib/api/user-service'
import type { HistoriqueAppel } from '@/lib/types-user'
import { formaterDateRelative } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageHistorique() {
  const [estChargement, setEstChargement] = useState(true)
  const [historique, setHistorique] = useState<HistoriqueAppel[]>([])
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      const reponse = await recupererHistoriqueAppels(1, 20)
      
      if (reponse.succes && reponse.donnees) {
        setHistorique(reponse.donnees)
      }
      
      setEstChargement(false)
    }

    chargerDonnees()
  }, [])

  if (estChargement) {
    return <ChargeurPageUser avecListe typeAffichage="liste" />
  }

  const historiqueFiltree = historique.filter(h => 
    h.endpoint.toLowerCase().includes(recherche.toLowerCase())
  )

  const getStatutConfig = (statut: number) => {
    if (statut >= 200 && statut < 300) {
      return {
        icone: CheckCircle2,
        couleur: 'text-emerald-600',
        bg: 'bg-emerald-50',
        label: 'Succes',
      }
    }
    if (statut >= 400 && statut < 500) {
      return {
        icone: AlertCircle,
        couleur: 'text-amber-600',
        bg: 'bg-amber-50',
        label: 'Erreur client',
      }
    }
    return {
      icone: XCircle,
      couleur: 'text-red-600',
      bg: 'bg-red-50',
      label: 'Erreur',
    }
  }

  const getMethodeBadge = (methode: HistoriqueAppel['methode']) => {
    const couleurs: Record<string, string> = {
      GET: 'bg-blue-50 text-blue-700',
      POST: 'bg-emerald-50 text-emerald-700',
      PUT: 'bg-amber-50 text-amber-700',
      DELETE: 'bg-red-50 text-red-700',
    }
    return couleurs[methode] || 'bg-slate-50 text-slate-700'
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <Card className="border-slate-200/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Rechercher par endpoint..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="pl-10 border-slate-200"
              />
            </div>
            <Button variant="outline" className="gap-2 border-slate-200">
              <Filter className="h-4 w-4" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des appels */}
      <Card className="border-slate-200/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Historique des appels API</CardTitle>
          <CardDescription>{historiqueFiltree.length} appels enregistres</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {historiqueFiltree.map((appel, index) => {
              const statutConfig = getStatutConfig(appel.statut)
              const StatutIcone = statutConfig.icone
              
              return (
                <div
                  key={appel.id}
                  className="flex items-center gap-4 rounded-lg border border-slate-200/60 p-4 transition-all hover:bg-slate-50/50 hover:border-slate-300/60 animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 30}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Icone statut */}
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", statutConfig.bg)}>
                    <StatutIcone className={cn("h-5 w-5", statutConfig.couleur)} />
                  </div>
                  
                  {/* Infos appel */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn("text-[10px] font-mono border-0", getMethodeBadge(appel.methode))}>
                        {appel.methode}
                      </Badge>
                      <code className="text-sm font-medium text-slate-900 truncate">{appel.endpoint}</code>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formaterDateRelative(appel.dateAppel)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {appel.latence}ms
                      </span>
                      {appel.creditsUtilises > 0 && (
                        <span className="text-amber-600">-{appel.creditsUtilises} credit{appel.creditsUtilises > 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Statut HTTP */}
                  <div className="shrink-0">
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "font-mono text-xs border-0",
                        appel.statut >= 200 && appel.statut < 300 && "bg-emerald-50 text-emerald-700",
                        appel.statut >= 400 && appel.statut < 500 && "bg-amber-50 text-amber-700",
                        appel.statut >= 500 && "bg-red-50 text-red-700"
                      )}
                    >
                      {appel.statut}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
          
          {historiqueFiltree.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Aucun appel trouve</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
