'use client'

import { useEffect, useState, useCallback } from 'react'
import { FileText, Plus, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TableDonnees } from '@/components/admin/data-table'
import { ChampRecherche } from '@/components/admin/search-input'
import { CarteStats } from '@/components/admin/stat-card'
import { ChargeurPage } from '@/components/admin/page-loader'
import { recupererUtilisateurs } from '@/lib/api/admin-service'
import type { Utilisateur, ColonneTable, ActionLigne, ConfigPagination } from '@/lib/types-admin'
import { formaterNombre, genererInitiales } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageDocuments() {
  const [estChargement, setEstChargement] = useState(true)
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [pagination, setPagination] = useState<ConfigPagination>({ page: 1, parPage: 10, total: 0 })
  const [recherche, setRecherche] = useState('')
  
  const [utilisateurSelectionne, setUtilisateurSelectionne] = useState<Utilisateur | null>(null)
  const [modaleQuotaOuverte, setModaleQuotaOuverte] = useState(false)
  const [nouveauQuota, setNouveauQuota] = useState('')

  const chargerUtilisateurs = useCallback(async () => {
    setEstChargement(true)
    const reponse = await recupererUtilisateurs(pagination.page, pagination.parPage, { recherche })
    
    if (reponse.succes && reponse.donnees) {
      setUtilisateurs(reponse.donnees)
      if (reponse.pagination) {
        setPagination(reponse.pagination)
      }
    }
    setEstChargement(false)
  }, [pagination.page, pagination.parPage, recherche])

  useEffect(() => {
    chargerUtilisateurs()
  }, [chargerUtilisateurs])

  // Calculs des statistiques
  const statsQuotas = {
    totalDocuments: utilisateurs.reduce((acc, u) => acc + u.quotaUtilise, 0),
    quotaAlloue: utilisateurs.reduce((acc, u) => acc + u.quotaTotal, 0),
    utilisateursAlerte: utilisateurs.filter((u) => u.quotaUtilise / u.quotaTotal > 0.9).length,
    tauxUtilisation: utilisateurs.length > 0
      ? Math.round(
          (utilisateurs.reduce((acc, u) => acc + u.quotaUtilise, 0) /
            utilisateurs.reduce((acc, u) => acc + u.quotaTotal, 0)) *
            100
        )
      : 0,
  }

  const colonnes: ColonneTable<Utilisateur>[] = [
    {
      id: 'utilisateur',
      label: 'Utilisateur',
      largeur: '250px',
      accesseur: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-slate-100 text-sm font-medium text-slate-600">
              {genererInitiales(u.prenom, u.nom)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{u.prenom} {u.nom}</span>
            <span className="text-xs text-muted-foreground">{u.entreprise}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'quotaUtilise',
      label: 'Utilisé',
      largeur: '100px',
      accesseur: (u) => (
        <span className="font-medium text-foreground">{formaterNombre(u.quotaUtilise)}</span>
      ),
    },
    {
      id: 'quotaTotal',
      label: 'Quota total',
      largeur: '100px',
      accesseur: (u) => (
        <span className="text-muted-foreground">{formaterNombre(u.quotaTotal)}</span>
      ),
    },
    {
      id: 'progression',
      label: 'Utilisation',
      largeur: '200px',
      accesseur: (u) => {
        const pourcentage = Math.round((u.quotaUtilise / u.quotaTotal) * 100)
        const estAlerte = pourcentage > 90
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={cn(estAlerte ? 'text-amber-600 font-medium' : 'text-muted-foreground')}>
                {pourcentage}%
              </span>
              {estAlerte && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
            </div>
            <Progress
              value={pourcentage}
              className={cn('h-2', estAlerte && '[&>div]:bg-amber-500')}
            />
          </div>
        )
      },
    },
    {
      id: 'statut',
      label: 'Statut',
      largeur: '100px',
      accesseur: (u) => {
        const pourcentage = (u.quotaUtilise / u.quotaTotal) * 100
        if (pourcentage >= 100) {
          return <span className="text-sm font-medium text-red-600">Épuisé</span>
        }
        if (pourcentage >= 90) {
          return <span className="text-sm font-medium text-amber-600">Critique</span>
        }
        if (pourcentage >= 75) {
          return <span className="text-sm font-medium text-blue-600">Élevé</span>
        }
        return <span className="text-sm text-muted-foreground">Normal</span>
      },
    },
  ]

  const actions: ActionLigne<Utilisateur>[] = [
    {
      id: 'ajouterQuota',
      label: 'Ajouter du quota',
      icone: Plus,
      onClick: (u) => {
        setUtilisateurSelectionne(u)
        setNouveauQuota('')
        setModaleQuotaOuverte(true)
      },
    },
  ]

  if (estChargement && utilisateurs.length === 0) {
    return <ChargeurPage avecCartes={4} avecTable />
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CarteStats
          titre="Documents traités"
          valeur={statsQuotas.totalDocuments}
          format="abrege"
          icone={FileText}
          couleur="bleu"
          delaiAnimation={0}
        />
        <CarteStats
          titre="Quota total alloué"
          valeur={statsQuotas.quotaAlloue}
          format="abrege"
          icone={FileText}
          couleur="vert"
          delaiAnimation={100}
        />
        <CarteStats
          titre="Taux d'utilisation"
          valeur={statsQuotas.tauxUtilisation}
          format="pourcentage"
          icone={TrendingUp}
          couleur="violet"
          delaiAnimation={200}
        />
        <CarteStats
          titre="Comptes en alerte"
          valeur={statsQuotas.utilisateursAlerte}
          icone={AlertTriangle}
          couleur="orange"
          delaiAnimation={300}
        />
      </div>

      {/* Liste des quotas */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Quotas par utilisateur</CardTitle>
            <CardDescription>Gérez les allocations de documents par client</CardDescription>
          </div>
          <ChampRecherche
            placeholder="Rechercher un utilisateur..."
            valeur={recherche}
            onChange={(terme) => {
              setRecherche(terme)
              setPagination((prev) => ({ ...prev, page: 1 }))
            }}
            className="w-full sm:w-64"
          />
        </CardHeader>
        <CardContent>
          <TableDonnees
            colonnes={colonnes}
            donnees={utilisateurs}
            estChargement={estChargement}
            pagination={pagination}
            onChangementPage={(page) => setPagination((prev) => ({ ...prev, page }))}
            actions={actions}
            idAccesseur={(u) => u.id}
          />
        </CardContent>
      </Card>

      {/* Modale ajout quota */}
      <Dialog open={modaleQuotaOuverte} onOpenChange={setModaleQuotaOuverte}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter du quota</DialogTitle>
            <DialogDescription>
              Ajoutez des documents supplémentaires au compte de {utilisateurSelectionne?.prenom} {utilisateurSelectionne?.nom}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-border/40 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Quota actuel</span>
                <span className="font-medium">
                  {utilisateurSelectionne && formaterNombre(utilisateurSelectionne.quotaUtilise)} / {utilisateurSelectionne && formaterNombre(utilisateurSelectionne.quotaTotal)}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quota">Documents à ajouter</Label>
              <Input
                id="quota"
                type="number"
                placeholder="Ex: 500"
                value={nouveauQuota}
                onChange={(e) => setNouveauQuota(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModaleQuotaOuverte(false)}>
              Annuler
            </Button>
            <Button onClick={() => setModaleQuotaOuverte(false)}>
              Ajouter le quota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
