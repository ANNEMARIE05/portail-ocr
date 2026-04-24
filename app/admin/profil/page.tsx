'use client'

import { useState } from 'react'
import { User, Phone, Shield, Key, Save, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { BadgeRole } from '@/components/admin/status-badge'

/** Aperçu fixe (non lié aux champs du formulaire) */
const PROFIL_CARTE = {
  prenom: 'Jean-Pierre',
  nom: 'Durand',
  email: 'jp.durand@ocrportal.fr',
  telephone: '06 12 34 56 78',
  role: 'super-admin' as const,
}

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
        {/* Carte profil : aperçu statique, compact, reste visible au défilement */}
        <div className="shrink-0 self-start lg:sticky lg:top-20 lg:z-10 lg:col-span-1">
          <Card className="border-border/40 shadow-sm overflow-visible">
            <CardContent className="flex flex-col items-center p-4">
              <div className="relative">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-slate-900 text-sm text-white">
                    {PROFIL_CARTE.prenom[0]}
                    {PROFIL_CARTE.nom[0]}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-100 transition-colors hover:bg-slate-200"
                  aria-label="Changer la photo"
                >
                  <Camera className="h-3 w-3 text-slate-600" />
                </button>
              </div>

              <h2 className="mt-2 text-center text-sm font-semibold text-foreground">
                {PROFIL_CARTE.prenom} {PROFIL_CARTE.nom}
              </h2>
              <p className="mt-0.5 max-w-full truncate px-1 text-center text-xs text-muted-foreground">
                {PROFIL_CARTE.email}
              </p>

              <div className="mt-2 scale-90">
                <BadgeRole role={PROFIL_CARTE.role} />
              </div>

              <div className="mt-3 w-full space-y-2 border-t border-border/40 pt-3">
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-muted-foreground">{PROFIL_CARTE.telephone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">2FA activé</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
