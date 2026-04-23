'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, ShieldCheck, Shield, UserCog } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChargeurPage } from '@/components/admin/page-loader'
import { BadgeRole } from '@/components/admin/status-badge'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { recupererAdministrateurs } from '@/lib/api/admin-service'
import type { Administrateur } from '@/lib/types-admin'
import { formaterDateCourte, formaterDateRelative, genererInitiales } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageAdministrateurs() {
  const [estChargement, setEstChargement] = useState(true)
  const [administrateurs, setAdministrateurs] = useState<Administrateur[]>([])
  const [adminSelectionne, setAdminSelectionne] = useState<Administrateur | null>(null)
  const [modaleSuppressionOuverte, setModaleSuppressionOuverte] = useState(false)

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      const reponse = await recupererAdministrateurs()
      if (reponse.succes && reponse.donnees) {
        setAdministrateurs(reponse.donnees)
      }
      setEstChargement(false)
    }
    chargerDonnees()
  }, [])

  const getIconeRole = (role: Administrateur['role']) => {
    switch (role) {
      case 'super-admin':
        return <ShieldCheck className="h-5 w-5 text-red-600" />
      case 'admin':
        return <Shield className="h-5 w-5 text-blue-600" />
      case 'moderateur':
        return <UserCog className="h-5 w-5 text-slate-600" />
    }
  }

  if (estChargement) {
    return <ChargeurPage avecTable />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Équipe d&apos;administration</h2>
          <p className="text-sm text-muted-foreground">
            {administrateurs.length} administrateurs au total
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un admin
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {administrateurs.map((admin) => (
          <Card
            key={admin.id}
            className={cn(
              'border-border/40 shadow-sm transition-all hover:shadow-md',
              !admin.estActif && 'opacity-60'
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-slate-100 text-lg font-medium text-slate-600">
                      {genererInitiales(admin.prenom, admin.nom)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {admin.prenom} {admin.nom}
                    </h3>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                  </div>
                </div>
                {getIconeRole(admin.role)}
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Rôle</span>
                  <BadgeRole role={admin.role} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Créé le</span>
                  <span className="font-medium">{formaterDateCourte(admin.dateCreation)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dernière activité</span>
                  <span className="font-medium">{formaterDateRelative(admin.derniereActivite)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Statut</span>
                  <span
                    className={cn(
                      'flex items-center gap-1.5 font-medium',
                      admin.estActif ? 'text-emerald-600' : 'text-slate-500'
                    )}
                  >
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        admin.estActif ? 'bg-emerald-500' : 'bg-slate-400'
                      )}
                    />
                    {admin.estActif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-2 border-t border-border/40 pt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => {
                    setAdminSelectionne(admin)
                    setModaleSuppressionOuverte(true)
                  }}
                  disabled={admin.role === 'super-admin'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ModaleConfirmation
        estOuverte={modaleSuppressionOuverte}
        onFermer={() => setModaleSuppressionOuverte(false)}
        onConfirmer={() => {
          setModaleSuppressionOuverte(false)
        }}
        titre="Supprimer l'administrateur"
        description={`Êtes-vous sûr de vouloir supprimer le compte de ${adminSelectionne?.prenom} ${adminSelectionne?.nom} ? Cette action est irréversible.`}
        texteConfirmation="Supprimer"
        variante="destructive"
      />
    </div>
  )
}
