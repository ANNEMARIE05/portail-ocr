'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Loader2, CheckCircle2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function ContenuReinitialisation() {
  const searchParams = useSearchParams()
  const profil = searchParams.get('profile') || 'user'
  const estAdmin = profil === 'admin'

  const [email, setEmail] = useState('')
  const [estChargement, setEstChargement] = useState(false)
  const [estEnvoye, setEstEnvoye] = useState(false)
  const [champFocus, setChampFocus] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstChargement(true)

    // Simulation d'envoi
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setEstEnvoye(true)
    setEstChargement(false)
  }

  if (estEnvoye) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center px-4',
        estAdmin
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100'
      )}>
        <div className="w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className={cn(
            'inline-flex items-center justify-center w-20 h-20 rounded-full',
            estAdmin
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-emerald-100 text-emerald-600'
          )}>
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className={cn(
              'text-xl font-semibold',
              estAdmin ? 'text-white' : 'text-slate-900'
            )}>
              Email envoyé
            </h2>
            <p className={cn(
              'text-sm',
              estAdmin ? 'text-slate-400' : 'text-slate-500'
            )}>
              Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.
            </p>
          </div>
          <Link href={estAdmin ? '/adminlogin' : '/login'}>
            <Button
              className={cn(
                'mt-4',
                estAdmin
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
              )}
            >
              Retour à la connexion
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'min-h-screen',
      estAdmin
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100'
    )}>
      {/* Motifs décoratifs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          'absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl',
          estAdmin ? 'bg-blue-500/10' : 'bg-blue-100/40'
        )} />
        <div className={cn(
          'absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl',
          estAdmin ? 'bg-indigo-500/10' : 'bg-indigo-100/30'
        )} />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Retour */}
          <Link
            href={estAdmin ? '/adminlogin' : '/login'}
            className={cn(
              'inline-flex items-center gap-2 text-sm transition-colors',
              estAdmin
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>

          {/* Logo et titre */}
          <div className="text-center space-y-2">
            <div className={cn(
              'inline-flex items-center justify-center w-16 h-16 rounded-xl shadow-lg mb-4',
              estAdmin
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30 ring-2 ring-white/10'
                : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/25'
            )}>
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className={cn(
              'text-2xl font-semibold tracking-tight',
              estAdmin ? 'text-white' : 'text-slate-900'
            )}>
              Réinitialisation
            </h1>
            <p className={cn(
              'text-sm',
              estAdmin ? 'text-slate-400' : 'text-slate-500'
            )}>
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>

          {/* Carte */}
          <Card className={cn(
            'shadow-xl backdrop-blur-sm',
            estAdmin
              ? 'border-slate-700/50 bg-slate-800/80'
              : 'border-slate-200/60 bg-white/80 shadow-slate-200/50'
          )}>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className={cn(
                'text-xl font-semibold text-center',
                estAdmin ? 'text-white' : 'text-slate-900'
              )}>
                Mot de passe oublié
              </CardTitle>
              <CardDescription className={cn(
                'text-center',
                estAdmin ? 'text-slate-400' : 'text-slate-500'
              )}>
                Nous vous enverrons un lien par email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className={cn(
                    'text-sm font-medium',
                    estAdmin ? 'text-slate-300' : 'text-slate-700'
                  )}>
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail
                      className={cn(
                        'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200',
                        champFocus
                          ? (estAdmin ? 'text-blue-400' : 'text-blue-600')
                          : (estAdmin ? 'text-slate-500' : 'text-slate-400')
                      )}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@exemple.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setChampFocus(true)}
                      onBlur={() => setChampFocus(false)}
                      className={cn(
                        'pl-10 h-11 transition-all duration-200',
                        estAdmin
                          ? 'border-slate-600 bg-slate-700/50 text-white placeholder:text-slate-500 focus:bg-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                      )}
                      disabled={estChargement}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={estChargement}
                  className={cn(
                    'w-full h-11 font-medium shadow-lg transition-all duration-200',
                    estAdmin
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30',
                    'disabled:opacity-70 disabled:cursor-not-allowed'
                  )}
                >
                  {estChargement ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Envoyer le lien
                      <Send className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function PageReinitialisation() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ContenuReinitialisation />
    </Suspense>
  )
}
