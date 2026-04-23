'use client'

import { useEffect, useState } from 'react'
import { Check, X, Clock, Mail, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChargeurPage } from '@/components/admin/page-loader'
import { BadgeStatut } from '@/components/admin/status-badge'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { recupererDemandesSuppression, traiterDemandeSuppression } from '@/lib/api/admin-service'
import type { DemandeSuppressionCompte } from '@/lib/types-admin'
import { formaterDateRelative, formaterDateCourte, genererInitiales } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageDemandesSuppression() {
  const [estChargement, setEstChargement] = useState(true)
  const [demandes, setDemandes] = useState<DemandeSuppressionCompte[]>([])
  const [ongletActif, setOngletActif] = useState('en-attente')
  
  const [demandeSelectionnee, setDemandeSelectionnee] = useState<DemandeSuppressionCompte | null>(null)
  const [modaleApprobationOuverte, setModaleApprobationOuverte] = useState(false)
  const [modaleRejetOuverte, setModaleRejetOuverte] = useState(false)
  const [actionEnCours, setActionEnCours] = useState(false)

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      const reponse = await recupererDemandesSuppression()
      if (reponse.succes && reponse.donnees) {
        setDemandes(reponse.donnees)
      }
      setEstChargement(false)
    }
    chargerDonnees()
  }, [])

  const traiterDemande = async (decision: 'approuve' | 'rejete') => {
    if (!demandeSelectionnee) return
    
    setActionEnCours(true)
    const reponse = await traiterDemandeSuppression(
      demandeSelectionnee.id,
      decision,
      'Jean-Pierre Durand'
    )
    
    if (reponse.succes && reponse.donnees) {
      setDemandes((prev) =>
        prev.map((d) => (d.id === demandeSelectionnee.id ? reponse.donnees! : d))
      )
    }
    
    setActionEnCours(false)
    setModaleApprobationOuverte(false)
    setModaleRejetOuverte(false)
  }

  const demandesFiltrees = demandes.filter((d) => {
    if (ongletActif === 'en-attente') return d.statut === 'en-attente'
    if (ongletActif === 'traitees') return d.statut !== 'en-attente'
    return true
  })

  const getBadgeStatut = (statut: DemandeSuppressionCompte['statut']) => {
    switch (statut) {
      case 'en-attente':
        return <BadgeStatut type="attention">En attente</BadgeStatut>
      case 'approuve':
        return <BadgeStatut type="succes">Approuvée</BadgeStatut>
      case 'rejete':
        return <BadgeStatut type="erreur">Rejetée</BadgeStatut>
    }
  }

  if (estChargement) {
    return <ChargeurPage avecTable />
  }

  const nombreEnAttente = demandes.filter((d) => d.statut === 'en-attente').length

  return (
    <div className="space-y-6">
      <Tabs value={ongletActif} onValueChange={setOngletActif}>
        <TabsList>
          <TabsTrigger value="en-attente" className="gap-2">
            <Clock className="h-4 w-4" />
            En attente
            {nombreEnAttente > 0 && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-medium text-white">
                {nombreEnAttente}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="traitees">Traitées</TabsTrigger>
          <TabsTrigger value="toutes">Toutes</TabsTrigger>
        </TabsList>

        <TabsContent value={ongletActif} className="mt-6">
          {demandesFiltrees.length === 0 ? (
            <Card className="border-border/40">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Check className="h-6 w-6 text-slate-500" />
                </div>
                <h3 className="mt-4 text-lg font-medium">Aucune demande</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {ongletActif === 'en-attente'
                    ? 'Toutes les demandes ont été traitées.'
                    : 'Aucune demande trouvée.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {demandesFiltrees.map((demande) => (
                <Card key={demande.id} className="border-border/40 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-slate-100 text-lg font-medium text-slate-600">
                            {genererInitiales(
                              demande.utilisateurNom.split(' ')[0],
                              demande.utilisateurNom.split(' ')[1] || ''
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-foreground">
                              {demande.utilisateurNom}
                            </h3>
                            {getBadgeStatut(demande.statut)}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {demande.utilisateurEmail}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Demandé {formaterDateRelative(demande.datedemande)}
                          </p>
                        </div>
                      </div>

                      {demande.statut === 'en-attente' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDemandeSelectionnee(demande)
                              setModaleRejetOuverte(true)
                            }}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Rejeter
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setDemandeSelectionnee(demande)
                              setModaleApprobationOuverte(true)
                            }}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approuver
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-lg border border-border/40 bg-slate-50 p-4">
                      <p className="text-sm font-medium text-muted-foreground">Raison de la demande</p>
                      <p className="mt-1 text-sm text-foreground">{demande.raison}</p>
                    </div>

                    {demande.statut !== 'en-attente' && demande.traitePar && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Traitée par {demande.traitePar}</span>
                        <span>•</span>
                        <span>{formaterDateCourte(demande.dateTraitement!)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modale approbation */}
      <ModaleConfirmation
        estOuverte={modaleApprobationOuverte}
        onFermer={() => setModaleApprobationOuverte(false)}
        onConfirmer={() => traiterDemande('approuve')}
        titre="Approuver la suppression"
        description={`Êtes-vous sûr de vouloir approuver la suppression du compte de ${demandeSelectionnee?.utilisateurNom} ? Cette action supprimera définitivement toutes les données associées.`}
        texteConfirmation="Approuver la suppression"
        variante="destructive"
        estChargement={actionEnCours}
      />

      {/* Modale rejet */}
      <ModaleConfirmation
        estOuverte={modaleRejetOuverte}
        onFermer={() => setModaleRejetOuverte(false)}
        onConfirmer={() => traiterDemande('rejete')}
        titre="Rejeter la demande"
        description={`Êtes-vous sûr de vouloir rejeter la demande de suppression de ${demandeSelectionnee?.utilisateurNom} ? L'utilisateur sera notifié.`}
        texteConfirmation="Rejeter"
        estChargement={actionEnCours}
      />
    </div>
  )
}
