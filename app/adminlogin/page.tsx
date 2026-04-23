'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function PageConnexionAdmin() {
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

    // Simulation d'appel API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Pour la démo : rediriger vers OTP admin
    if (email && motDePasse) {
      router.push(`/otp?email=${encodeURIComponent(email)}&next=/admin/tableau&profile=admin`)
    } else {
      setErreur('Veuillez remplir tous les champs')
      setEstChargement(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Motifs décoratifs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Logo et titre */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4 ring-2 ring-white/10">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Administration
            </h1>
            <p className="text-sm text-slate-400">
              Accès réservé aux administrateurs
            </p>
          </div>

          {/* Carte de connexion */}
          <Card className="border-slate-700/50 shadow-2xl bg-slate-800/80 backdrop-blur-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-semibold text-center text-white">
                Connexion sécurisée
              </CardTitle>
              <CardDescription className="text-center text-slate-400">
                Entrez vos identifiants administrateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Champ email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200',
                        champFocus === 'email' ? 'text-blue-400' : 'text-slate-500'
                      )}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setChampFocus('email')}
                      onBlur={() => setChampFocus(null)}
                      className={cn(
                        'pl-10 h-11 border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500',
                        'transition-all duration-200',
                        'focus:bg-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
                        champFocus === 'email' && 'bg-slate-700 border-blue-500 ring-2 ring-blue-500/20'
                      )}
                      disabled={estChargement}
                      required
                    />
                  </div>
                </div>

                {/* Champ mot de passe */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="motDePasse" className="text-sm font-medium text-slate-300">
                      Mot de passe
                    </label>
                    <Link
                      href="/reinitialisation?profile=admin"
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200',
                        champFocus === 'motDePasse' ? 'text-blue-400' : 'text-slate-500'
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
                        'pl-10 pr-10 h-11 border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500',
                        'transition-all duration-200',
                        'focus:bg-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
                        champFocus === 'motDePasse' && 'bg-slate-700 border-blue-500 ring-2 ring-blue-500/20'
                      )}
                      disabled={estChargement}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
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
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-sm text-red-400">{erreur}</p>
                  </div>
                )}

                {/* Bouton de connexion */}
                <Button
                  type="submit"
                  disabled={estChargement}
                  className={cn(
                    'w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-500',
                    'hover:from-blue-600 hover:to-indigo-600',
                    'text-white font-medium shadow-lg shadow-blue-500/20',
                    'transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30',
                    'disabled:opacity-70 disabled:cursor-not-allowed'
                  )}
                >
                  {estChargement ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Vérification...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Accéder à l&apos;administration
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Séparateur */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-800 px-2 text-slate-500">Espace utilisateur</span>
                </div>
              </div>

              {/* Lien utilisateur */}
              <Link href="/login">
                <Button
                  variant="outline"
                  className="w-full h-11 border-slate-600 text-slate-300 bg-transparent hover:bg-slate-700/50 hover:text-white transition-colors"
                >
                  Retour à la connexion utilisateur
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500">
            Accès surveillé et enregistré pour des raisons de sécurité
          </p>
        </div>
      </div>
    </div>
  )
}
