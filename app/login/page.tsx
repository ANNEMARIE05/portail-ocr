'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { lire2faRequisUtilisateur } from '@/lib/mfa-preference'
import { estBackendUtilisateurConfigure } from '@/lib/api/env-backend'
import { chargerProfilUtilisateur, connexionUtilisateur } from '@/lib/api/auth-api'

export default function PageConnexion() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const [estChargement, setEstChargement] = useState(false)
  const [erreur, setErreur] = useState('')
  const [champFocus, setChampFocus] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur('')
    setEstChargement(true)

    if (!email || !motDePasse) {
      setErreur('Veuillez remplir tous les champs')
      setEstChargement(false)
      return
    }

    const cible = '/user'

    if (estBackendUtilisateurConfigure()) {
      const res = await connexionUtilisateur(email, motDePasse)
      if (res.type === 'erreur') {
        setErreur(res.message)
        setEstChargement(false)
        return
      }
      if (res.type === 'otp_2fa') {
        router.push(
          `/otp?email=${encodeURIComponent(email)}&next=${encodeURIComponent(cible)}&profile=user&mode=connexion&userid=${encodeURIComponent(res.userId)}`
        )
        setEstChargement(false)
        return
      }
      if (res.type === 'session') {
        const profil = await chargerProfilUtilisateur(res.token)
        if (!profil.ok) {
          setErreur(profil.erreur ?? 'Impossible de charger le profil.')
          setEstChargement(false)
          return
        }
        router.push(cible)
        setEstChargement(false)
        return
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 800))
    if (lire2faRequisUtilisateur()) {
      router.push(
        `/otp?email=${encodeURIComponent(email)}&next=${encodeURIComponent(cible)}`
      )
    } else {
      router.push(cible)
    }
    setEstChargement(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Motifs décoratifs subtils */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Logo et titre */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary shadow-lg shadow-primary/25 mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Portail OCR
            </h1>
            <p className="text-sm text-slate-500">
              Connectez-vous à votre espace personnel
            </p>
          </div>

          {/* Carte de connexion */}
          <Card className="border-border/60 shadow-xl shadow-primary/10 backdrop-blur-sm bg-card/80">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-semibold text-center">Connexion</CardTitle>
              <CardDescription className="text-center">
                Entrez vos identifiants pour accéder à votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Champ email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-700">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200',
                        champFocus === 'email' ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setChampFocus('email')}
                      onBlur={() => setChampFocus(null)}
                      className={cn(
                        'pl-10 h-11 border-border bg-muted/50 transition-all duration-200',
                        'focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20',
                        champFocus === 'email' && 'bg-card border-primary ring-2 ring-primary/20'
                      )}
                      disabled={estChargement}
                      required
                    />
                  </div>
                </div>

                {/* Champ mot de passe */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="motDePasse" className="text-sm font-medium text-slate-700">
                      Mot de passe
                    </label>
                    <Link
                      href="/reinitialisation"
                      className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200',
                        champFocus === 'motDePasse' ? 'text-primary' : 'text-muted-foreground'
                      )}
                    />
                    <Input
                      id="motDePasse"
                      type={afficherMotDePasse ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      onFocus={() => setChampFocus('motDePasse')}
                      onBlur={() => setChampFocus(null)}
                      className={cn(
                        'pl-10 pr-10 h-11 border-border bg-muted/50 transition-all duration-200',
                        'focus:bg-card focus:border-primary focus:ring-2 focus:ring-primary/20',
                        champFocus === 'motDePasse' && 'bg-card border-primary ring-2 ring-primary/20'
                      )}
                      disabled={estChargement}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {afficherMotDePasse ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Message d'erreur */}
                {erreur && (
                  <div className="p-3 rounded-md bg-red-50 border border-red-200 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-sm text-red-600">{erreur}</p>
                  </div>
                )}

                {/* Bouton de connexion */}
                <Button
                  type="submit"
                  disabled={estChargement}
                  className={cn(
                    'w-full h-11 bg-primary hover:bg-primary/90',
                    'text-primary-foreground font-medium shadow-lg shadow-primary/25',
                    'transition-all duration-200 hover:shadow-xl hover:shadow-primary/30',
                    'disabled:opacity-70 disabled:cursor-not-allowed'
                  )}
                >
                  {estChargement ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connexion en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Se connecter
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Séparateur */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-400">Accès administrateur</span>
                </div>
              </div>

              {/* Lien admin */}
              <Link href="/adminlogin">
                <Button
                  variant="outline"
                  className="w-full h-11 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Connexion administrateur
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400">
            En vous connectant, vous acceptez nos{' '}
            <Link href="#" className="text-primary hover:underline">
              conditions d&apos;utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="#" className="text-primary hover:underline">
              politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
