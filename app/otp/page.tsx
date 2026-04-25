'use client'

import { useState, useEffect, useLayoutEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { lire2faRequisAdmin, lire2faRequisUtilisateur } from '@/lib/mfa-preference'
import { estBackendAdminConfigure, estBackendUtilisateurConfigure } from '@/lib/api/env-backend'
import {
  chargerProfilAdmin,
  chargerProfilUtilisateur,
  renvoyerOtp,
  verifier2FA,
  verifierOtpConnexionOuReset,
} from '@/lib/api/auth-api'

function ContenuOTP() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const destination = searchParams.get('next') || '/user'
  const profil = searchParams.get('profile') || 'user'
  const estAdmin = profil === 'admin'
  const mode = searchParams.get('mode') ?? 'connexion'
  const purpose = searchParams.get('purpose') ?? ''
  const userId2fa = searchParams.get('userid') ?? ''

  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [estChargement, setEstChargement] = useState(false)
  const [estVerifie, setEstVerifie] = useState(false)
  const [erreur, setErreur] = useState('')
  const [tempsRestant, setTempsRestant] = useState(60)
  const [peutRenvoyer, setPeutRenvoyer] = useState(false)
  const [renvoyerEnCours, setRenvoyerEnCours] = useState(false)
  const [peutSaisir, setPeutSaisir] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useLayoutEffect(() => {
    const backend = estAdmin ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()
    const requisDemo = estAdmin ? lire2faRequisAdmin() : lire2faRequisUtilisateur()
    const fluxReinitialisation = mode === 'reinitialisation'
    /** Connexion + API : écran OTP uniquement si le login a renvoyé une étape 2FA (`userid`), comme l’ancien portail. */
    const fluxConnexion2faRequis =
      backend && mode === 'connexion' && userId2fa.trim().length > 0

    if (backend && (fluxConnexion2faRequis || fluxReinitialisation)) {
      queueMicrotask(() => setPeutSaisir(true))
      return
    }
    if (!backend && requisDemo) {
      queueMicrotask(() => setPeutSaisir(true))
      return
    }
    router.replace(destination)
  }, [estAdmin, destination, router, mode, userId2fa])

  // Timer pour le renvoi de code
  useEffect(() => {
    if (!peutSaisir) return
    if (tempsRestant > 0) {
      const timer = setTimeout(() => setTempsRestant(tempsRestant - 1), 1000)
      return () => clearTimeout(timer)
    }
    queueMicrotask(() => setPeutRenvoyer(true))
  }, [tempsRestant, peutSaisir])

  // Focus sur le premier champ
  useEffect(() => {
    if (peutSaisir) {
      inputRefs.current[0]?.focus()
    }
  }, [peutSaisir])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const nouveauCode = [...code]
    nouveauCode[index] = value.slice(-1)
    setCode(nouveauCode)
    setErreur('')

    // Passer au champ suivant
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Vérification automatique si code complet
    if (nouveauCode.every((c) => c !== '') && value) {
      verifierCode(nouveauCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const nouveauCode = pastedData.split('')
      setCode(nouveauCode)
      verifierCode(pastedData)
    }
  }

  const verifierCode = async (codeComplet: string) => {
    setEstChargement(true)
    setErreur('')

    const service = estAdmin ? 'admin' : 'user'
    const backend = estAdmin ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()

    if (backend && userId2fa) {
      const res = await verifier2FA({
        service,
        userId: userId2fa,
        code: codeComplet,
      })
      if (!res.ok || !res.token) {
        setErreur(res.erreur ?? 'Code incorrect.')
        setEstChargement(false)
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }
      const profil = estAdmin
        ? await chargerProfilAdmin(res.token)
        : await chargerProfilUtilisateur(res.token)
      if (!profil.ok) {
        setErreur(profil.erreur ?? 'Session invalide.')
        setEstChargement(false)
        return
      }
      setEstVerifie(true)
      setEstChargement(false)
      setTimeout(() => {
        router.push(destination)
      }, 1200)
      return
    }

    if (backend && mode === 'connexion' && !userId2fa && email) {
      const res = await verifierOtpConnexionOuReset({
        service,
        email,
        code: codeComplet,
        purpose: purpose || 'login',
      })
      if (!res.ok) {
        setErreur(res.erreur ?? 'Code incorrect.')
        setEstChargement(false)
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }
      if (res.token) {
        const profil = estAdmin
          ? await chargerProfilAdmin(res.token)
          : await chargerProfilUtilisateur(res.token)
        if (!profil.ok) {
          setErreur(profil.erreur ?? 'Session invalide.')
          setEstChargement(false)
          return
        }
      }
      setEstVerifie(true)
      setEstChargement(false)
      setTimeout(() => {
        router.push(destination)
      }, 1200)
      return
    }

    if (backend && mode === 'reinitialisation') {
      const res = await verifierOtpConnexionOuReset({
        service,
        email,
        code: codeComplet,
        purpose: purpose || 'password reset',
      })
      if (!res.ok) {
        setErreur(res.erreur ?? 'Code incorrect.')
        setEstChargement(false)
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }
      setEstVerifie(true)
      setEstChargement(false)
      const q = new URLSearchParams()
      q.set('email', email)
      if (estAdmin) q.set('profile', 'admin')
      setTimeout(() => {
        router.push(`/reinitialisation?${q.toString()}`)
      }, 1200)
      return
    }

    await new Promise((resolve) => setTimeout(resolve, 800))
    if (codeComplet.length === 6) {
      setEstVerifie(true)
      setEstChargement(false)
      setTimeout(() => {
        router.push(destination)
      }, 1200)
    } else {
      setErreur('Code invalide. Veuillez réessayer.')
      setEstChargement(false)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    }
  }

  const renvoyerCode = async () => {
    setRenvoyerEnCours(true)
    const service = estAdmin ? 'admin' : 'user'
    const backend = estAdmin ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()
    if (backend && email) {
      const fin = await renvoyerOtp({
        service,
        email,
        purpose: purpose || (mode === 'reinitialisation' ? 'password reset' : 'login'),
      })
      if (!fin.ok) {
        setErreur(fin.erreur ?? 'Impossible de renvoyer le code.')
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600))
    }
    setTempsRestant(60)
    setPeutRenvoyer(false)
    setRenvoyerEnCours(false)
  }

  const masquerEmail = (email: string) => {
    const [nom, domaine] = email.split('@')
    if (!domaine) return email
    const nomMasque = nom.slice(0, 2) + '***'
    return `${nomMasque}@${domaine}`
  }

  if (!peutSaisir) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          estAdmin
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
            : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100'
        )}
      >
        <Loader2
          className={cn(
            'h-8 w-8 animate-spin',
            estAdmin ? 'text-blue-400' : 'text-blue-600'
          )}
        />
      </div>
    )
  }

  if (estVerifie) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center px-4',
        estAdmin
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          : 'bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100'
      )}>
        <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
          <div className={cn(
            'inline-flex items-center justify-center w-20 h-20 rounded-full',
            estAdmin
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-emerald-100 text-emerald-600'
          )}>
            <CheckCircle2 className="w-10 h-10 animate-in zoom-in duration-300 delay-200" />
          </div>
          <h2 className={cn(
            'text-xl font-semibold',
            estAdmin ? 'text-white' : 'text-slate-900'
          )}>
            Vérification réussie
          </h2>
          <p className={cn(
            'text-sm',
            estAdmin ? 'text-slate-400' : 'text-slate-500'
          )}>
            Redirection en cours...
          </p>
          <Loader2 className={cn(
            'w-5 h-5 animate-spin mx-auto',
            estAdmin ? 'text-blue-400' : 'text-blue-600'
          )} />
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
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className={cn(
              'text-2xl font-semibold tracking-tight',
              estAdmin ? 'text-white' : 'text-slate-900'
            )}>
              Vérification en deux étapes
            </h1>
            <p className={cn(
              'text-sm',
              estAdmin ? 'text-slate-400' : 'text-slate-500'
            )}>
              Un code a été envoyé à {masquerEmail(email)}
            </p>
          </div>

          {/* Carte OTP */}
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
                Entrez le code
              </CardTitle>
              <CardDescription className={cn(
                'text-center',
                estAdmin ? 'text-slate-400' : 'text-slate-500'
              )}>
                Code à 6 chiffres
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Champs OTP */}
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={estChargement}
                    className={cn(
                      'w-12 h-14 text-center text-xl font-semibold rounded-lg border-2 transition-all duration-200',
                      'focus:outline-none focus:ring-2',
                      estAdmin
                        ? 'border-slate-600 bg-slate-700/50 text-white focus:border-blue-500 focus:ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white',
                      estChargement && 'opacity-50 cursor-not-allowed',
                      digit && (estAdmin ? 'border-blue-500 bg-slate-700' : 'border-blue-500 bg-blue-50/50')
                    )}
                  />
                ))}
              </div>

              {/* Indicateur de chargement */}
              {estChargement && (
                <div className="flex justify-center">
                  <Loader2 className={cn(
                    'w-6 h-6 animate-spin',
                    estAdmin ? 'text-blue-400' : 'text-blue-600'
                  )} />
                </div>
              )}

              {/* Message d'erreur */}
              {erreur && (
                <div className={cn(
                  'p-3 rounded-md animate-in fade-in slide-in-from-top-1 duration-200',
                  estAdmin
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-red-50 border border-red-200'
                )}>
                  <p className={cn(
                    'text-sm text-center',
                    estAdmin ? 'text-red-400' : 'text-red-600'
                  )}>
                    {erreur}
                  </p>
                </div>
              )}

              {/* Renvoi de code */}
              <div className="text-center space-y-2">
                <p className={cn(
                  'text-sm',
                  estAdmin ? 'text-slate-400' : 'text-slate-500'
                )}>
                  Vous n&apos;avez pas reçu le code ?
                </p>
                {peutRenvoyer ? (
                  <Button
                    variant="ghost"
                    onClick={renvoyerCode}
                    disabled={renvoyerEnCours}
                    className={cn(
                      'text-sm',
                      estAdmin
                        ? 'text-blue-400 hover:text-blue-300 hover:bg-slate-700/50'
                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                    )}
                  >
                    {renvoyerEnCours ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi en cours...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Renvoyer le code
                      </span>
                    )}
                  </Button>
                ) : (
                  <p className={cn(
                    'text-sm font-medium',
                    estAdmin ? 'text-slate-300' : 'text-slate-700'
                  )}>
                    Renvoyer dans {tempsRestant}s
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className={cn(
            'text-center text-xs',
            estAdmin ? 'text-slate-500' : 'text-slate-400'
          )}>
            Le code expire dans 10 minutes
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PageOTP() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ContenuOTP />
    </Suspense>
  )
}
