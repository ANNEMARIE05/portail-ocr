'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Upload,
  X,
  Check,
  Copy,
  Loader2,
  AlertCircle,
  Sparkles,
  IdCard,
  Info,
  FileStack,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { recupererStatistiquesUser, soumettreDocument } from '@/lib/api/user-service'
import type { DocumentOCR } from '@/lib/types-user'
import { EVENEMENT_RAFRAICHIR_QUOTA_USER } from '@/lib/user-quota-refresh'

const LIBelles_CHAMPS_OCR: Record<string, string> = {
  code_pays: 'Code pays',
  mrz_validity: 'Validité MRZ',
  nom: 'Nom',
  type: 'Type',
  prenoms: 'Prénoms',
  prenom: 'Prénom',
  date_naissance: 'Date de naissance',
  date_expiration: 'Date d’expiration',
  numero_passeport: 'Numéro de passeport',
}

function libelleCleOcr(cle: string): string {
  if (LIBelles_CHAMPS_OCR[cle]) return LIBelles_CHAMPS_OCR[cle]
  return cle
    .replace(/_/g, ' ')
    .replace(/^\w|\s\w/g, (m) => m.toUpperCase())
}

function formaterValeurExtrait(v: unknown): string {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function resultatIssuApiStructuree(doc: DocumentOCR): boolean {
  return Boolean(
    doc.typeDocumentDetecte ||
      doc.messagesFeedback?.length ||
      doc.messageTraitement ||
      doc.statutReponseApi ||
      (doc.donneesExtraites && Object.keys(doc.donneesExtraites).length > 0),
  )
}

function libelleTypeDetecte(code: string): string {
  const c = code.toUpperCase()
  if (c === 'PASSPORT' || c === 'P') return 'Passeport'
  if (c.includes('ID') || c === 'CNI') return 'Pièce d’identité'
  return code.replace(/_/g, ' ')
}

interface FichierEnCours {
  id: string
  fichier: File
  progression: number
  statut: 'upload' | 'traitement' | 'termine' | 'erreur'
  resultat?: DocumentOCR
  erreur?: string
}

function genererIdFichierEnCours(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Attend le prochain frame peint après la mise à jour React (liste + résultat). */
function apresRenduVisuel(callback: () => void) {
  requestAnimationFrame(() => {
    requestAnimationFrame(callback)
  })
}

export default function PageDocuments() {
  const [fichiers, setFichiers] = useState<FichierEnCours[]>([])
  const [estSurvol, setEstSurvol] = useState(false)
  const [texteCopie, setTexteCopie] = useState<string | null>(null)
  /** Incrémenté à chaque nouvel envoi : ignore les mises à jour d’un lot précédent si l’utilisateur relance avant la fin. */
  const idLotRef = useRef(0)
  const refCarteResultats = useRef<HTMLDivElement>(null)
  const refAlerteQuota = useRef<HTMLDivElement>(null)
  /** `null` : quota pas encore connu (ou échec API). */
  const [creditsRestants, setCreditsRestants] = useState<number | null>(null)

  const chargerQuota = useCallback(async () => {
    const r = await recupererStatistiquesUser()
    if (r.succes && r.donnees) {
      setCreditsRestants(r.donnees.creditsRestants)
    }
  }, [])

  useEffect(() => {
    void chargerQuota()
    const ecouter = () => {
      void chargerQuota()
    }
    window.addEventListener(EVENEMENT_RAFRAICHIR_QUOTA_USER, ecouter)
    return () => window.removeEventListener(EVENEMENT_RAFRAICHIR_QUOTA_USER, ecouter)
  }, [chargerQuota])

  const ajouterFichiers = useCallback(async (nouveauxFichiers: File[]) => {
    if (nouveauxFichiers.length === 0) return

    const reponseQuota = await recupererStatistiquesUser()
    if (reponseQuota.succes && reponseQuota.donnees) {
      setCreditsRestants(reponseQuota.donnees.creditsRestants)
      if (reponseQuota.donnees.creditsRestants <= 0) {
        apresRenduVisuel(() => {
          refAlerteQuota.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        })
        return
      }
    }

    const idLot = ++idLotRef.current
    setFichiers([])

    for (const fichier of nouveauxFichiers) {
      if (idLot !== idLotRef.current) return

      const idEntree = genererIdFichierEnCours()
      const nouveauFichier: FichierEnCours = {
        id: idEntree,
        fichier,
        progression: 0,
        statut: 'upload',
      }

      setFichiers((prev) => {
        if (idLot !== idLotRef.current) return prev
        return [nouveauFichier, ...prev]
      })

      // Simuler progression upload
      for (let i = 0; i <= 100; i += 20) {
        if (idLot !== idLotRef.current) return
        await new Promise((r) => setTimeout(r, 100))
        setFichiers((prev) => {
          if (idLot !== idLotRef.current) return prev
          return prev.map((f) => (f.id === idEntree ? { ...f, progression: i } : f))
        })
      }

      if (idLot !== idLotRef.current) return

      // Passer au traitement
      setFichiers((prev) => {
        if (idLot !== idLotRef.current) return prev
        return prev.map((f) =>
          f.id === idEntree ? { ...f, statut: 'traitement', progression: 0 } : f,
        )
      })

      try {
        const reponse = await soumettreDocument(fichier)

        if (idLot !== idLotRef.current) return

        if (reponse.succes && reponse.donnees) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(EVENEMENT_RAFRAICHIR_QUOTA_USER))
          }
          setFichiers((prev) => {
            if (idLot !== idLotRef.current) return prev
            return prev.map((f) =>
              f.id === idEntree
                ? { ...f, statut: 'termine', resultat: reponse.donnees, progression: 100 }
                : f,
            )
          })
          apresRenduVisuel(() => {
            if (idLot !== idLotRef.current) return
            refCarteResultats.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          })
        } else {
          setFichiers((prev) => {
            if (idLot !== idLotRef.current) return prev
            return prev.map((f) =>
              f.id === idEntree ? { ...f, statut: 'erreur', erreur: reponse.erreur } : f,
            )
          })
          apresRenduVisuel(() => {
            if (idLot !== idLotRef.current) return
            refCarteResultats.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            })
          })
        }
      } catch {
        setFichiers((prev) => {
          if (idLot !== idLotRef.current) return prev
          return prev.map((f) =>
            f.id === idEntree ? { ...f, statut: 'erreur', erreur: 'Erreur lors du traitement' } : f,
          )
        })
        apresRenduVisuel(() => {
          if (idLot !== idLotRef.current) return
          refCarteResultats.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        })
      }
    }
  }, [])

  const gererDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setEstSurvol(false)

      const fichiersDeposes = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.type.startsWith('image/'),
      )

      void ajouterFichiers(fichiersDeposes)
    },
    [ajouterFichiers],
  )

  const gererSelectionFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target
    if (!el.files?.length) return
    const fichiersList = Array.from(el.files)
    void (async () => {
      await ajouterFichiers(fichiersList)
      el.value = ''
    })()
  }

  const supprimerFichier = (id: string) => {
    setFichiers((prev) => prev.filter((f) => f.id !== id))
  }

  const copierTexte = async (texte: string) => {
    try {
      if (!navigator.clipboard?.writeText) return
      await navigator.clipboard.writeText(texte)
      setTexteCopie(texte)
      setTimeout(() => setTexteCopie(null), 2000)
    } catch {
      /* contexte non securise ou acces refuse au presse-papiers */
    }
  }

  const formaterTaille = (octets: number) => {
    if (octets < 1024) return `${octets} o`
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`
    return `${(octets / (1024 * 1024)).toFixed(1)} Mo`
  }

  const quotaEpuise = creditsRestants !== null && creditsRestants <= 0

  return (
    <div className="space-y-3 sm:space-y-5 md:space-y-6">
      {quotaEpuise && (
        <div ref={refAlerteQuota} className="scroll-mt-24">
          <Alert variant="destructive" className="border-red-200 bg-red-50/90 text-red-950 [&>svg]:text-red-700">
            <AlertCircle />
            <AlertTitle>Plus de quota disponible</AlertTitle>
            <AlertDescription className="text-red-900/90">
              <p className="mb-3 leading-relaxed">
                Vous n&apos;avez plus de quota : vous ne pouvez pas lancer d&apos;extraction OCR. Achetez des
                quotas ou contactez l&apos;assistance pour demander un ajout de quota à un administrateur.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="bg-red-700 hover:bg-red-700/90">
                  <Link href="/user/achats">Acheter des quotas</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-red-300 bg-white text-red-900 hover:bg-red-50">
                  <Link href="/user/assistance">Assistance — demande de quota</Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Zone de depot */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-all duration-300",
          estSurvol && !quotaEpuise
            ? "border-primary bg-primary/5 shadow-lg" 
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
          quotaEpuise && "pointer-events-none border-slate-200 bg-slate-50 opacity-70",
        )}
        onDragOver={(e) => {
          if (quotaEpuise) return
          e.preventDefault()
          setEstSurvol(true)
        }}
        onDragLeave={() => setEstSurvol(false)}
        onDrop={
          quotaEpuise
            ? (e) => {
                e.preventDefault()
                setEstSurvol(false)
                apresRenduVisuel(() => {
                  refAlerteQuota.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                })
              }
            : gererDrop
        }
      >
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <input
            id="documents-upload-input"
            type="file"
            multiple
            accept=".pdf,image/*"
            onChange={gererSelectionFichier}
            disabled={quotaEpuise}
            className="sr-only"
          />
          <label
            htmlFor="documents-upload-input"
            className="flex w-full cursor-pointer flex-col items-center justify-center text-center"
          >
          <div className={cn(
            "flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-300 mb-6",
            estSurvol 
              ? "bg-primary shadow-lg shadow-primary/25 scale-110" 
              : "bg-slate-100"
          )}>
            <Upload className={cn(
              "h-8 w-8 transition-colors",
              estSurvol ? "text-primary-foreground" : "text-slate-500"
            )} />
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {quotaEpuise ? 'Extraction indisponible' : 'Deposez vos fichiers ici'}
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md">
            {quotaEpuise ? (
              <>
                Votre quota est épuisé. Utilisez les liens ci-dessus pour acheter des quotas ou ouvrir une
                demande via l&apos;assistance.
              </>
            ) : (
              <>
                Glissez-deposez vos documents PDF ou images, ou cliquez pour selectionner des fichiers.
                Formats acceptes : PDF, JPG, PNG, TIFF
              </>
            )}
          </p>
          
          <div className="flex items-center gap-4">
            <Button asChild className="gap-2 bg-primary hover:bg-primary/90 cursor-pointer">
              <span>
                <Upload className="h-4 w-4" />
                Selectionner des fichiers
              </span>
            </Button>
            <span className="text-sm text-slate-400">ou glissez-deposez</span>
          </div>
          </label>
        </CardContent>
      </Card>

      {/* Liste des fichiers */}
      {fichiers.length > 0 && (
        <Card
          ref={refCarteResultats}
          className="scroll-mt-24 border-border/40"
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Fichiers en cours</CardTitle>
            <CardDescription>
              Suivi du traitement OCR — {fichiers.length} fichier{fichiers.length > 1 ? 's' : ''}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fichiers.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-lg border p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
                  item.statut === 'termine' && "border-emerald-200 bg-emerald-50/50",
                  item.statut === 'erreur' && "border-red-200 bg-red-50/50",
                  (item.statut === 'upload' || item.statut === 'traitement') && "border-slate-200"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icone */}
                  <div className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                    item.statut === 'termine' && "bg-emerald-100",
                    item.statut === 'erreur' && "bg-red-100",
                    (item.statut === 'upload' || item.statut === 'traitement') && "bg-slate-100"
                  )}>
                    {item.statut === 'upload' || item.statut === 'traitement' ? (
                      <Loader2 className="h-5 w-5 text-slate-600 animate-spin" />
                    ) : item.statut === 'termine' ? (
                      <Check className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  
                  {/* Infos fichier */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.fichier.name}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {formaterTaille(item.fichier.size)}
                      </Badge>
                    </div>
                    
                    {/* Progression */}
                    {(item.statut === 'upload' || item.statut === 'traitement') && (
                      <div className="space-y-1">
                        <Progress value={item.progression} className="h-1" />
                        <p className="text-xs text-slate-500">
                          {item.statut === 'upload' ? 'Telechargement...' : 'Extraction OCR en cours...'}
                        </p>
                      </div>
                    )}
                    
                    {/* Resultat */}
                    {item.statut === 'termine' && item.resultat && (
                      <div className="mt-3 space-y-3">
                        {resultatIssuApiStructuree(item.resultat) ? (
                          <>
                            {item.resultat.messageTraitement && (
                              <p className="flex items-start gap-2 text-xs text-slate-600">
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                                {item.resultat.messageTraitement}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2">
                              {item.resultat.typeDocumentDetecte && (
                                <Badge
                                  variant="secondary"
                                  className="gap-1 border border-slate-200 bg-white font-medium text-slate-800"
                                >
                                  <IdCard className="h-3 w-3" />
                                  {libelleTypeDetecte(item.resultat.typeDocumentDetecte)}
                                </Badge>
                              )}
                              {item.resultat.statutReponseApi && (
                                <Badge className="border-0 bg-emerald-600/90 font-normal text-white hover:bg-emerald-600">
                                  {item.resultat.statutReponseApi}
                                </Badge>
                              )}
                            </div>

                            {item.resultat.messagesFeedback &&
                              item.resultat.messagesFeedback.length > 0 && (
                                <Alert
                                  className="border-amber-200 bg-amber-50/90 text-amber-950 [&>svg]:text-amber-700"
                                >
                                  <AlertCircle className="text-amber-700" />
                                  <AlertTitle>Analyse — points d&apos;attention</AlertTitle>
                                  <AlertDescription>
                                    <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-amber-900/90">
                                      {item.resultat.messagesFeedback.map((msg, i) => (
                                        <li key={i}>{msg}</li>
                                      ))}
                                    </ul>
                                  </AlertDescription>
                                </Alert>
                              )}

                            {item.resultat.donneesExtraites &&
                              Object.keys(item.resultat.donneesExtraites).length > 0 && (
                                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    Données extraites
                                  </p>
                                  <dl className="grid gap-2 sm:grid-cols-2">
                                    {Object.entries(item.resultat.donneesExtraites).map(
                                      ([cle, valeur]) => (
                                        <div
                                          key={cle}
                                          className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2"
                                        >
                                          <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                                            {libelleCleOcr(cle)}
                                          </dt>
                                          <dd className="mt-0.5 break-words text-sm font-medium text-slate-900">
                                            {formaterValeurExtrait(valeur)}
                                          </dd>
                                        </div>
                                      ),
                                    )}
                                  </dl>
                                </div>
                              )}

                            {(item.resultat.nomFichierRectoApi != null ||
                              item.resultat.nomFichierVersoApi !== undefined) && (
                              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                  <FileStack className="h-3.5 w-3.5 text-slate-500" />
                                  Fichiers côté serveur
                                </p>
                                <ul className="space-y-1 text-xs text-slate-700">
                                  {item.resultat.nomFichierRectoApi != null && (
                                    <li>
                                      <span className="font-medium text-slate-500">Recto : </span>
                                      {item.resultat.nomFichierRectoApi}
                                    </li>
                                  )}
                                  {item.resultat.nomFichierVersoApi !== undefined && (
                                    <li>
                                      <span className="font-medium text-slate-500">Verso : </span>
                                      {item.resultat.nomFichierVersoApi ?? '—'}
                                    </li>
                                  )}
                                </ul>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-amber-500" />
                                {item.resultat.precision}% precision
                              </span>
                              <span>{item.resultat.tempsTraitement}s</span>
                              {item.resultat.nombrePages && (
                                <span>
                                  {item.resultat.nombrePages} page
                                  {item.resultat.nombrePages > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {item.resultat.texteExtrait && (
                              <div className="rounded-md border border-slate-200 bg-white p-3">
                                <p className="line-clamp-3 font-mono text-xs text-slate-600">
                                  {item.resultat.texteExtrait}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Erreur */}
                    {item.statut === 'erreur' && (
                      <p className="text-xs text-red-600 mt-1">{item.erreur}</p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.statut === 'termine' && item.resultat?.texteExtrait && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copierTexte(item.resultat!.texteExtrait!)}
                        className="gap-1.5 text-xs"
                      >
                        {texteCopie === item.resultat.texteExtrait ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            Copie
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copier
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => supprimerFichier(item.id)}
                      className="h-8 w-8 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

