'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, X, Check, Copy, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { soumettreDocument } from '@/lib/api/user-service'
import type { DocumentOCR } from '@/lib/types-user'

interface FichierEnCours {
  fichier: File
  progression: number
  statut: 'upload' | 'traitement' | 'termine' | 'erreur'
  resultat?: DocumentOCR
  erreur?: string
}

export default function PageDocuments() {
  const [fichiers, setFichiers] = useState<FichierEnCours[]>([])
  const [estSurvol, setEstSurvol] = useState(false)
  const [texteCopie, setTexteCopie] = useState<string | null>(null)

  const ajouterFichiers = useCallback(async (nouveauxFichiers: File[]) => {
    for (const fichier of nouveauxFichiers) {
      const nouveauFichier: FichierEnCours = {
        fichier,
        progression: 0,
        statut: 'upload',
      }

      setFichiers((prev) => [...prev, nouveauFichier])

      // Simuler progression upload
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((r) => setTimeout(r, 100))
        setFichiers((prev) =>
          prev.map((f) => (f.fichier === fichier ? { ...f, progression: i } : f)),
        )
      }

      // Passer au traitement
      setFichiers((prev) =>
        prev.map((f) =>
          f.fichier === fichier ? { ...f, statut: 'traitement', progression: 0 } : f,
        ),
      )

      try {
        const reponse = await soumettreDocument(fichier)

        if (reponse.succes && reponse.donnees) {
          setFichiers((prev) =>
            prev.map((f) =>
              f.fichier === fichier
                ? { ...f, statut: 'termine', resultat: reponse.donnees, progression: 100 }
                : f,
            ),
          )
        } else {
          setFichiers((prev) =>
            prev.map((f) =>
              f.fichier === fichier ? { ...f, statut: 'erreur', erreur: reponse.erreur } : f,
            ),
          )
        }
      } catch {
        setFichiers((prev) =>
          prev.map((f) =>
            f.fichier === fichier
              ? { ...f, statut: 'erreur', erreur: 'Erreur lors du traitement' }
              : f,
          ),
        )
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
    if (e.target.files) {
      const fichiersList = Array.from(e.target.files)
      void ajouterFichiers(fichiersList)
    }
  }

  const supprimerFichier = (fichier: File) => {
    setFichiers(prev => prev.filter(f => f.fichier !== fichier))
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

  return (
    <div className="space-y-6">
      {/* Zone de depot */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-all duration-300",
          estSurvol 
            ? "border-primary bg-primary/5 shadow-lg" 
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
        )}
        onDragOver={(e) => { e.preventDefault(); setEstSurvol(true) }}
        onDragLeave={() => setEstSurvol(false)}
        onDrop={gererDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <input
            id="documents-upload-input"
            type="file"
            multiple
            accept=".pdf,image/*"
            onChange={gererSelectionFichier}
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
            Deposez vos fichiers ici
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md">
            Glissez-deposez vos documents PDF ou images, ou cliquez pour selectionner des fichiers. 
            Formats acceptes : PDF, JPG, PNG, TIFF
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
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Fichiers en cours</CardTitle>
            <CardDescription>
              Suivi du traitement OCR — {fichiers.length} fichier{fichiers.length > 1 ? 's' : ''}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fichiers.map((item, index) => (
              <div
                key={index}
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
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            {item.resultat.precision}% precision
                          </span>
                          <span>{item.resultat.tempsTraitement}s</span>
                          {item.resultat.nombrePages && (
                            <span>{item.resultat.nombrePages} page{item.resultat.nombrePages > 1 ? 's' : ''}</span>
                          )}
                        </div>
                        
                        {item.resultat.texteExtrait && (
                          <div className="rounded-md bg-white border border-slate-200 p-3">
                            <p className="text-xs text-slate-600 font-mono line-clamp-3">
                              {item.resultat.texteExtrait}
                            </p>
                          </div>
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
                      onClick={() => supprimerFichier(item.fichier)}
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

