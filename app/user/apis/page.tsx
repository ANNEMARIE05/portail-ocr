'use client'

import { useEffect, useState } from 'react'
import { Key, Plus, Copy, Eye, EyeOff, Check, Trash2, Shield, Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChargeurPageUser } from '@/components/user/chargeur-page-user'
import { recupererClesApiUser } from '@/lib/api/user-service'
import type { CleApiUser } from '@/lib/types-user'
import { formaterDateCourte, formaterDateRelative, formaterNombreAbrege } from '@/lib/utils/formatage'
import { cn } from '@/lib/utils'

export default function PageApis() {
  const [estChargement, setEstChargement] = useState(true)
  const [cles, setCles] = useState<CleApiUser[]>([])
  const [cleVisible, setCleVisible] = useState<string | null>(null)
  const [cleCopie, setCleCopie] = useState<string | null>(null)

  useEffect(() => {
    const chargerDonnees = async () => {
      setEstChargement(true)
      const reponse = await recupererClesApiUser()
      
      if (reponse.succes && reponse.donnees) {
        setCles(reponse.donnees)
      }
      
      setEstChargement(false)
    }

    chargerDonnees()
  }, [])

  const copierCle = async (cle: string) => {
    await navigator.clipboard.writeText(cle)
    setCleCopie(cle)
    setTimeout(() => setCleCopie(null), 2000)
  }

  const masquerCle = (cle: string) => {
    return cle.substring(0, 12) + '...' + cle.substring(cle.length - 4)
  }

  if (estChargement) {
    return <ChargeurPageUser avecListe typeAffichage="liste" />
  }

  return (
    <div className="space-y-6">
      {/* En-tete avec bouton */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Mes cles API</h2>
          <p className="text-sm text-slate-500">Gerez vos cles d&apos;acces a l&apos;API OCR</p>
        </div>
        <Button className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
          <Plus className="h-4 w-4" />
          Nouvelle cle
        </Button>
      </div>

      {/* Liste des cles */}
      <div className="space-y-4">
        {cles.map((cle, index) => (
          <Card 
            key={cle.id} 
            className={cn(
              "border-slate-200/60 transition-all animate-in fade-in slide-in-from-bottom-2",
              !cle.estActive && "opacity-60"
            )}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                {/* Icone */}
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                  cle.estActive ? "bg-emerald-50" : "bg-slate-100"
                )}>
                  <Key className={cn(
                    "h-5 w-5",
                    cle.estActive ? "text-emerald-600" : "text-slate-400"
                  )} />
                </div>
                
                {/* Infos cle */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{cle.nom}</p>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-[10px] border-0",
                        cle.estActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {cle.estActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  {/* Cle API */}
                  <div className="flex items-center gap-2 rounded-md bg-slate-50 border border-slate-200/60 px-3 py-2">
                    <code className="flex-1 text-sm font-mono text-slate-600 truncate">
                      {cleVisible === cle.id ? cle.cle : masquerCle(cle.cle)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => setCleVisible(cleVisible === cle.id ? null : cle.id)}
                    >
                      {cleVisible === cle.id ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => copierCle(cle.cle)}
                    >
                      {cleCopie === cle.cle ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Metriques */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {cle.permissions.length} permission{cle.permissions.length > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {formaterNombreAbrege(cle.nombreRequetes)} requetes
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Creee le {formaterDateCourte(cle.dateCreation)}
                    </span>
                    {cle.derniereUtilisation && (
                      <span>
                        Derniere utilisation : {formaterDateRelative(cle.derniereUtilisation)}
                      </span>
                    )}
                  </div>
                  
                  {/* Permissions */}
                  <div className="flex flex-wrap gap-1.5">
                    {cle.permissions.map((perm) => (
                      <Badge key={perm} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 border-0 font-mono">
                        {perm}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Actions */}
                <Button variant="ghost" size="icon" className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documentation */}
      <Card className="border-slate-200/60 bg-slate-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Documentation API</CardTitle>
          <CardDescription>Consultez notre documentation pour integrer l&apos;API OCR dans vos applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-slate-900 p-4 overflow-x-auto">
            <pre className="text-sm text-slate-300 font-mono">
{`curl -X POST https://api.ocr-portal.com/v1/extract \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@document.pdf"`}
            </pre>
          </div>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" className="border-slate-200">
              Voir la documentation complete
            </Button>
            <Button variant="outline" className="border-slate-200">
              Exemples de code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
