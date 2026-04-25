'use client'

import { useEffect, useMemo, useState } from 'react'
import { User, Shield, Key, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { BadgeStatutUtilisateur } from '@/components/admin/status-badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  lireDonneesProfilUtilisateurSession,
  type DonneesProfilUtilisateurSession,
} from '@/lib/api/session-client'
import { lire2faRequisUtilisateur } from '@/lib/mfa-preference'
import { changerMotDePasseUtilisateurConnecte, rafraichirProfilConnecteDepuisMe } from '@/lib/api/auth-api'
import { estBackendUtilisateurConfigure } from '@/lib/api/env-backend'

function texteOuInconnu(v: string | null | undefined): string {
  const t = typeof v === 'string' ? v.trim() : ''
  return t || 'inconnu'
}

function ligneTelephoneAffichee(
  indicatif: string | null | undefined,
  numero: string | null | undefined,
): string {
  const n = typeof numero === 'string' ? numero.trim() : ''
  if (!n) return 'inconnu'
  const ind = typeof indicatif === 'string' ? indicatif.trim() : ''
  return ind ? `+${ind} ${n}` : n
}

type EtatProfil = DonneesProfilUtilisateurSession

export default function PageProfil() {
  const [estChangementMdp, setEstChangementMdp] = useState(false)

  const [profil, setProfil] = useState<EtatProfil>(() => ({
    prenom: '',
    nom: '',
    email: '',
    statut: 'actif',
    twoFactorDepuisApi: null,
    initialesAvatar: '?',
    username: '',
    role: '',
    quota: null,
    telephone: null,
    indicatifPays: null,
    creeLe: null,
    misAJourLe: null,
    premiereConnexion: null,
    emailVerifie: null,
    bio: null,
    localisation: null,
    entreprise: '',
  }))

  useEffect(() => {
    let annule = false
    const sync = async () => {
      if (estBackendUtilisateurConfigure()) {
        await rafraichirProfilConnecteDepuisMe('user')
      }
      if (annule) return
      setProfil(lireDonneesProfilUtilisateurSession())
    }
    void sync()
    return () => {
      annule = true
    }
  }, [])

  const titreCarte = useMemo(() => {
    const nomSeul = (profil.nom || '').trim()
    if (nomSeul) return nomSeul
    if (profil.email) return profil.email
    return 'Profil'
  }, [profil.nom, profil.email])

  const deuxFacteursAffiche =
    profil.twoFactorDepuisApi !== null ? profil.twoFactorDepuisApi : lire2faRequisUtilisateur()

  const [motsDePasse, setMotsDePasse] = useState({
    actuel: '',
    nouveau: '',
    confirmation: '',
  })
  const [erreurMotDePasse, setErreurMotDePasse] = useState<string | null>(null)
  const [succesMotDePasse, setSuccesMotDePasse] = useState<string | null>(null)

  const changerMotDePasse = async () => {
    setErreurMotDePasse(null)
    setSuccesMotDePasse(null)
    if (motsDePasse.nouveau !== motsDePasse.confirmation) {
      setErreurMotDePasse('Les mots de passe ne correspondent pas.')
      return
    }
    if (motsDePasse.nouveau.length < 8) {
      setErreurMotDePasse('Le nouveau mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (!estBackendUtilisateurConfigure()) {
      setErreurMotDePasse(
        'API utilisateur non configurée (NEXT_PUBLIC_API_*). Le changement de mot de passe requiert le backend.',
      )
      return
    }
    setEstChangementMdp(true)
    try {
      const res = await changerMotDePasseUtilisateurConnecte({
        motDePasseActuel: motsDePasse.actuel,
        nouveauMotDePasse: motsDePasse.nouveau,
        confirmerMotDePasse: motsDePasse.confirmation,
      })
      if (!res.ok) {
        setErreurMotDePasse(res.erreur ?? 'Changement impossible.')
        return
      }
      setSuccesMotDePasse('Mot de passe mis à jour.')
      setMotsDePasse({ actuel: '', nouveau: '', confirmation: '' })
    } finally {
      setEstChangementMdp(false)
    }
  }

  return (
    <div className="space-y-3 sm:space-y-5 md:space-y-6">
      <div className="grid gap-3 sm:gap-5 md:gap-6 lg:grid-cols-3">
        <div className="shrink-0 self-start lg:sticky lg:top-20 lg:z-10 lg:col-span-1">
          <Card className="border-border/40 shadow-sm overflow-visible">
            <CardContent className="flex flex-col items-center p-4">
              <div className="relative">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-slate-900 text-sm text-white">
                    {profil.initialesAvatar}
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

              <h2 className="mt-2 text-center text-sm font-semibold text-foreground">{titreCarte}</h2>
              <p className="mt-0.5 max-w-full truncate px-1 text-center text-xs text-muted-foreground">
                {profil.email || '—'}
              </p>
              {profil.username ? (
                <p className="mt-0.5 max-w-full truncate px-1 text-center text-[11px] text-muted-foreground/90">
                  {profil.username}
                </p>
              ) : null}

              <dl className="mt-2 w-full space-y-1 border-t border-border/40 pt-2 text-left text-xs">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-muted-foreground">Nom</dt>
                  <dd className="truncate font-medium text-foreground">{texteOuInconnu(profil.nom)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-muted-foreground">Téléphone</dt>
                  <dd className="truncate font-medium text-foreground">
                    {ligneTelephoneAffichee(profil.indicatifPays, profil.telephone)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="shrink-0 text-muted-foreground">Entreprise</dt>
                  <dd className="truncate font-medium text-foreground">{texteOuInconnu(profil.entreprise)}</dd>
                </div>
              </dl>

              <div className="mt-2 scale-90">
                <BadgeStatutUtilisateur statut={profil.statut} />
              </div>

              <div className="mt-3 w-full space-y-2 border-t border-border/40 pt-3">
                <div className="flex items-center gap-2 text-xs">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {deuxFacteursAffiche ? '2FA activé' : '2FA désactivé'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 sm:space-y-5 md:space-y-6 lg:col-span-2">
          <Card className="border-border/40 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Informations personnelles</CardTitle>
                  <CardDescription>
                    Données de votre compte (lecture seule, saisie désactivée)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  readOnly
                  autoComplete="family-name"
                  placeholder="inconnu"
                  value={profil.nom}
                  className="cursor-default bg-muted/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  readOnly
                  type="email"
                  autoComplete="email"
                  value={profil.email}
                  className="cursor-default bg-muted/40"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,7rem)_1fr]">
                <div className="space-y-2">
                  <Label htmlFor="indicatif">Indicatif</Label>
                  <Input
                    id="indicatif"
                    readOnly
                    inputMode="numeric"
                    autoComplete="tel-country-code"
                    placeholder="inconnu"
                    value={profil.indicatifPays ?? ''}
                    className="cursor-default bg-muted/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    readOnly
                    type="tel"
                    autoComplete="tel-national"
                    placeholder="inconnu"
                    value={profil.telephone ?? ''}
                    className="cursor-default bg-muted/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="entreprise">Entreprise</Label>
                <Input
                  id="entreprise"
                  readOnly
                  autoComplete="organization"
                  placeholder="inconnu"
                  value={profil.entreprise}
                  className="cursor-default bg-muted/40"
                />
              </div>
            </CardContent>
          </Card>

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
              {erreurMotDePasse && (
                <Alert variant="destructive">
                  <AlertTitle>Erreur</AlertTitle>
                  <AlertDescription>{erreurMotDePasse}</AlertDescription>
                </Alert>
              )}
              {succesMotDePasse && (
                <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
                  <AlertTitle>Succès</AlertTitle>
                  <AlertDescription>{succesMotDePasse}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="mdpActuel">Mot de passe actuel</Label>
                <Input
                  id="mdpActuel"
                  type="password"
                  value={motsDePasse.actuel}
                  onChange={(e) => {
                    setErreurMotDePasse(null)
                    setSuccesMotDePasse(null)
                    setMotsDePasse({ ...motsDePasse, actuel: e.target.value })
                  }}
                  autoComplete="current-password"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="mdpNouveau">Nouveau mot de passe</Label>
                  <Input
                    id="mdpNouveau"
                    type="password"
                    value={motsDePasse.nouveau}
                    onChange={(e) => {
                      setErreurMotDePasse(null)
                      setSuccesMotDePasse(null)
                      setMotsDePasse({ ...motsDePasse, nouveau: e.target.value })
                    }}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mdpConfirmation">Confirmer le mot de passe</Label>
                  <Input
                    id="mdpConfirmation"
                    type="password"
                    value={motsDePasse.confirmation}
                    onChange={(e) => {
                      setErreurMotDePasse(null)
                      setSuccesMotDePasse(null)
                      setMotsDePasse({ ...motsDePasse, confirmation: e.target.value })
                    }}
                    autoComplete="new-password"
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
