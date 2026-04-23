'use client'

import { useEffect, useState } from 'react'
import { Check, Sparkles, Zap, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { recupererPacksDisponibles } from '@/lib/api/user-service'
import type { PackDisponible } from '@/lib/types-user'
import { formaterMontant } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageAchats() {
  const [estChargement, setEstChargement] = useState(true)
  const [packs, setPacks] = useState<PackDisponible[]>([])
  const [packSelectionne, setPackSelectionne] = useState<string | null>(null)

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      const reponse = await recupererPacksDisponibles()
      
      if (reponse.succes && reponse.donnees) {
        setPacks(reponse.donnees)
      }
      
      setEstChargement(false)
    }

    chargerDonnees()
  }, [])

  if (estChargement) {
    return <ChargeurPageUser avecListe typeAffichage="grille" />
  }

  const prixParCredit = (pack: PackDisponible) => {
    return (pack.prix / pack.credits).toFixed(3)
  }

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="text-center space-y-2 pb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Rechargez vos credits</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Choisissez le pack qui correspond a vos besoins. Plus le pack est grand, plus le prix par credit est avantageux.
        </p>
      </div>

      {/* Grille des packs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {packs.map((pack, index) => (
          <Card
            key={pack.id}
            className={cn(
              "relative overflow-hidden transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-4",
              pack.estPopulaire 
                ? "border-2 border-slate-900 shadow-lg shadow-slate-900/10" 
                : "border-slate-200/60 hover:border-slate-300 hover:shadow-md",
              packSelectionne === pack.id && "ring-2 ring-slate-900 ring-offset-2"
            )}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
            onClick={() => setPackSelectionne(pack.id)}
          >
            {/* Badge populaire */}
            {pack.estPopulaire && (
              <div className="absolute -right-12 top-5 rotate-45 bg-slate-900 px-12 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                Populaire
              </div>
            )}
            
            {/* Badge economie */}
            {pack.economie && (
              <div className="absolute left-4 top-4">
                <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px] font-medium">
                  -{pack.economie}%
                </Badge>
              </div>
            )}
            
            <CardHeader className={cn("pb-4", pack.estPopulaire && "pt-8")}>
              <CardTitle className="text-lg font-semibold text-slate-900">{pack.nom}</CardTitle>
              <CardDescription className="text-sm">{pack.description}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Prix */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-900">{formaterMontant(pack.prix)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span>{pack.credits} credits</span>
                  <span className="text-slate-300">|</span>
                  <span>{prixParCredit(pack)} EUR/credit</span>
                </div>
              </div>
              
              {/* Caracteristiques */}
              <ul className="space-y-2.5">
                {pack.caracteristiques.map((carac, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{carac}</span>
                  </li>
                ))}
              </ul>
              
              {/* Bouton */}
              <Button 
                className={cn(
                  "w-full transition-all",
                  pack.estPopulaire 
                    ? "bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/10" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                )}
              >
                {pack.estPopulaire ? (
                  <>
                    <Star className="mr-2 h-4 w-4" />
                    Choisir ce pack
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Selectionner
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informations supplementaires */}
      <Card className="border-slate-200/60 bg-slate-50/50">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Activation instantanee</h4>
                <p className="text-sm text-slate-500">Vos credits sont disponibles immediatement apres le paiement.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Paiement securise</h4>
                <p className="text-sm text-slate-500">Transactions cryptees et securisees par Stripe.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Credits cumulates</h4>
                <p className="text-sm text-slate-500">Vos credits s&apos;ajoutent a votre solde existant.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
