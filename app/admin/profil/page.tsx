'use client'

import { useState } from 'react'
import { User, Mail, Phone, Shield, Key, Save, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { BadgeRole } from '@/components/admin/status-badge'

export default function PageProfil() {
  const [estEnregistrement, setEstEnregistrement] = useState(false)
  const [estChangementMdp, setEstChangementMdp] = useState(false)
  
  // Données du profil (simulées)
  const [profil, setProfil] = useState({
    prenom: 'Jean-Pierre',
    nom: 'Durand',
    email: 'jp.durand@ocrportal.fr',
    telephone: '06 12 34 56 78',
    role: 'super-admin' as const,
  })

  const [motsDePasse, setMotsDePasse] = useState({
    actuel: '',
    nouveau: '',
    confirmation: '',
  })

  const enregistrerProfil = async () => {
    setEstEnregistrement(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setEstEnregistrement(false)
  }

  const changerMotDePasse = async () => {
    if (motsDePasse.nouveau !== motsDePasse.confirmation) {
      return
    }
    setEstChangementMdp(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setMotsDePasse({ actuel: '', nouveau: '', confirmation: '' })
    setEstChangementMdp(false)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Carte profil */}
        <Card className="border-border/40 shadow-sm lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="bg-slate-900 text-2xl text-white">
                  {profil.prenom[0]}
                  {profil.nom[0]}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 transition-colors hover:bg-slate-200">
                <Camera className="h-4 w-4 text-slate-600" />
              </button>
            </div>
            
            <h2 className="mt-4 text-xl font-semibold text-foreground">
              {profil.prenom} {profil.nom}
            </h2>
            <p className="text-sm text-muted-foreground">{profil.email}</p>
            
            <div className="mt-3">
              <BadgeRole role={profil.role} />
            </div>

            <div className="mt-6 w-full space-y-3 border-t border-border/40 pt-6">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profil.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{profil.telephone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">2FA activé</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaires */}
        <div className="space-y-6 lg:col-span-2">
          {/* Informations personnelles */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Informations personnelles</CardTitle>
                  <CardDescription>Modifiez vos informations de profil</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={profil.prenom}
                    onChange={(e) => setProfil({ ...profil, prenom: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={profil.nom}
                    onChange={(e) => setProfil({ ...profil, nom: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profil.email}
                  onChange={(e) => setProfil({ ...profil, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={profil.telephone}
                  onChange={(e) => setProfil({ ...profil, telephone: e.target.value })}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={enregistrerProfil} disabled={estEnregistrement}>
                  {estEnregistrement ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Changement de mot de passe */}
          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                  <Key className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Mot de passe</CardTitle>
                  <CardDescription>Modifiez votre mot de passe</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mdpActuel">Mot de passe actuel</Label>
                <Input
                  id="mdpActuel"
                  type="password"
                  value={motsDePasse.actuel}
                  onChange={(e) => setMotsDePasse({ ...motsDePasse, actuel: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mdpNouveau">Nouveau mot de passe</Label>
                  <Input
                    id="mdpNouveau"
                    type="password"
                    value={motsDePasse.nouveau}
                    onChange={(e) => setMotsDePasse({ ...motsDePasse, nouveau: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mdpConfirmation">Confirmer le mot de passe</Label>
                  <Input
                    id="mdpConfirmation"
                    type="password"
                    value={motsDePasse.confirmation}
                    onChange={(e) => setMotsDePasse({ ...motsDePasse, confirmation: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={changerMotDePasse}
                  disabled={
                    estChangementMdp ||
                    !motsDePasse.actuel ||
                    !motsDePasse.nouveau ||
                    motsDePasse.nouveau !== motsDePasse.confirmation
                  }
                >
                  {estChangementMdp ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <Key className="mr-2 h-4 w-4" />
                  )}
                  Changer le mot de passe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
