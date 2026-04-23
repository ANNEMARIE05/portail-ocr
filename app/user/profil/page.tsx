'use client'

import { useState } from 'react'
import { User, Mail, Building, Phone, Calendar, Shield, Loader2, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { formaterDateCourte } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageProfil() {
  const [estEdition, setEstEdition] = useState(false)
  const [estEnregistrement, setEstEnregistrement] = useState(false)
  const [profil, setProfil] = useState({
    prenom: 'Marie',
    nom: 'Dupont',
    email: 'marie.dupont@example.com',
    entreprise: 'Entreprise ABC',
    telephone: '06 12 34 56 78',
    dateInscription: new Date('2024-01-15'),
  })

  const gererEnregistrement = async () => {
    setEstEnregistrement(true)
    await new Promise(r => setTimeout(r, 1000))
    setEstEnregistrement(false)
    setEstEdition(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* En-tete profil */}
      <Card className="border-slate-200/60 overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-slate-900 to-slate-700" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-2xl text-white font-semibold">
                {profil.prenom.charAt(0)}{profil.nom.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-slate-900">{profil.prenom} {profil.nom}</h2>
              <p className="text-sm text-slate-500">{profil.email}</p>
            </div>
            <Button 
              variant={estEdition ? "default" : "outline"} 
              onClick={() => estEdition ? gererEnregistrement() : setEstEdition(true)}
              disabled={estEnregistrement}
              className={cn(
                estEdition && "bg-slate-900 hover:bg-slate-800 text-white"
              )}
            >
              {estEnregistrement ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : estEdition ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              ) : (
                'Modifier'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-slate-500" />
            Informations personnelles
          </CardTitle>
          <CardDescription>Vos informations de compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prenom</Label>
              <Input
                id="prenom"
                value={profil.prenom}
                onChange={(e) => setProfil({ ...profil, prenom: e.target.value })}
                disabled={!estEdition}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                value={profil.nom}
                onChange={(e) => setProfil({ ...profil, nom: e.target.value })}
                disabled={!estEdition}
                className="border-slate-200"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={profil.email}
              onChange={(e) => setProfil({ ...profil, email: e.target.value })}
              disabled={!estEdition}
              className="border-slate-200"
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entreprise" className="flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-400" />
                Entreprise
              </Label>
              <Input
                id="entreprise"
                value={profil.entreprise}
                onChange={(e) => setProfil({ ...profil, entreprise: e.target.value })}
                disabled={!estEdition}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                Telephone
              </Label>
              <Input
                id="telephone"
                value={profil.telephone}
                onChange={(e) => setProfil({ ...profil, telephone: e.target.value })}
                disabled={!estEdition}
                className="border-slate-200"
              />
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-4 w-4" />
            <span>Membre depuis le {formaterDateCourte(profil.dateInscription)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Securite */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-slate-500" />
            Securite
          </CardTitle>
          <CardDescription>Gerez la securite de votre compte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200/60 p-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Mot de passe</p>
              <p className="text-sm text-slate-500">Derniere modification il y a 3 mois</p>
            </div>
            <Button variant="outline" className="border-slate-200">
              Modifier
            </Button>
          </div>
          
          <div className="flex items-center justify-between rounded-lg border border-slate-200/60 p-4">
            <div>
              <p className="text-sm font-medium text-slate-900">Authentification a deux facteurs</p>
              <p className="text-sm text-slate-500">Renforcez la securite de votre compte</p>
            </div>
            <Button variant="outline" className="border-slate-200">
              Activer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Zone dangereuse */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-red-900">Zone dangereuse</CardTitle>
          <CardDescription className="text-red-700/70">
            Actions irreversibles sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
            Demander la suppression du compte
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
