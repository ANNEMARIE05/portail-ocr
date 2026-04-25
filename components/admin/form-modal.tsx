'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

export interface ChampFormulaire {
  id: string
  label: string
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'textarea' | 'select' | 'switch'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  defaultValue?: string | number | boolean
  min?: number
  max?: number
  rows?: number
  description?: string
  /** Si vrai, champ en lecture seule (grisé), non pris en compte pour l’exigence « requis ». */
  desactive?: boolean
}

interface ModaleFormulaireProps {
  estOuverte: boolean
  onFermer: () => void
  onSoumettre: (donnees: Record<string, string | number | boolean>) => Promise<void>
  titre: string
  description?: string
  champs: ChampFormulaire[]
  texteValidation?: string
  donneesInitiales?: Record<string, string | number | boolean>
  mode?: 'creation' | 'modification'
}

export function ModaleFormulaire({
  estOuverte,
  onFermer,
  onSoumettre,
  titre,
  description,
  champs,
  texteValidation = 'Enregistrer',
  donneesInitiales,
  mode = 'creation',
}: ModaleFormulaireProps) {
  const [donnees, setDonnees] = useState<Record<string, string | number | boolean>>({})
  const [estChargement, setEstChargement] = useState(false)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})

  /** Réinitialise uniquement à l’ouverture de la modale (pas à chaque rendu parent) — sinon
   *  `donneesInitiales` (nouvel objet) ou `champs` feraient disparaître la saisie en cours. */
  useEffect(() => {
    if (!estOuverte) {
      return
    }
    const valeursInitiales: Record<string, string | number | boolean> = {}
    champs.forEach((champ) => {
      if (donneesInitiales && donneesInitiales[champ.id] !== undefined) {
        valeursInitiales[champ.id] = donneesInitiales[champ.id]
      } else if (champ.defaultValue !== undefined) {
        valeursInitiales[champ.id] = champ.defaultValue
      } else if (champ.type === 'switch') {
        valeursInitiales[champ.id] = false
      } else if (champ.type === 'number') {
        valeursInitiales[champ.id] = 0
      } else {
        valeursInitiales[champ.id] = ''
      }
    })
    setDonnees(valeursInitiales)
    setErreurs({})
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seule l’ouverture doit réappliquer les champs
  }, [estOuverte])

  const validerFormulaire = (): boolean => {
    const nouvellesErreurs: Record<string, string> = {}
    
    champs.forEach((champ) => {
      if (champ.required && !champ.desactive) {
        const valeur = donnees[champ.id]
        if (valeur === undefined || valeur === '' || valeur === null) {
          nouvellesErreurs[champ.id] = `${champ.label} est requis`
        }
      }
      
      if (champ.type === 'email' && donnees[champ.id] && !champ.desactive) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(donnees[champ.id]))) {
          nouvellesErreurs[champ.id] = 'Email invalide'
        }
      }
    })
    
    setErreurs(nouvellesErreurs)
    return Object.keys(nouvellesErreurs).length === 0
  }

  const gererSoumission = async () => {
    if (!validerFormulaire()) return
    
    setEstChargement(true)
    try {
      await onSoumettre(donnees)
      onFermer()
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
    } finally {
      setEstChargement(false)
    }
  }

  const mettreAJourChamp = (id: string, valeur: string | number | boolean) => {
    setDonnees((prev) => ({ ...prev, [id]: valeur }))
    if (erreurs[id]) {
      setErreurs((prev) => {
        const nouvellesErreurs = { ...prev }
        delete nouvellesErreurs[id]
        return nouvellesErreurs
      })
    }
  }

  const renderChamp = (champ: ChampFormulaire) => {
    const valeur = donnees[champ.id]
    const erreur = erreurs[champ.id]

    switch (champ.type) {
      case 'textarea':
        return (
          <div key={champ.id} className="space-y-2">
            <Label htmlFor={champ.id} className="text-sm font-medium">
              {champ.label}
              {champ.required && !champ.desactive && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={champ.id}
              value={String(valeur || '')}
              onChange={(e) => mettreAJourChamp(champ.id, e.target.value)}
              placeholder={champ.placeholder}
              rows={champ.rows || 3}
              disabled={champ.desactive}
              className={cn(erreur && 'border-destructive', champ.desactive && 'cursor-not-allowed bg-muted/50 text-muted-foreground')}
            />
            {champ.description && (
              <p className="text-xs text-muted-foreground">{champ.description}</p>
            )}
            {erreur && <p className="text-xs text-destructive">{erreur}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={champ.id} className="space-y-2">
            <Label htmlFor={champ.id} className="text-sm font-medium">
              {champ.label}
              {champ.required && !champ.desactive && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={String(valeur || '')}
              onValueChange={(val) => mettreAJourChamp(champ.id, val)}
              disabled={champ.desactive}
            >
              <SelectTrigger
                className={cn(
                  erreur && 'border-destructive',
                  champ.desactive && 'cursor-not-allowed bg-muted/50 text-muted-foreground',
                )}
              >
                <SelectValue placeholder={champ.placeholder || `Sélectionner ${champ.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {champ.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erreur && <p className="text-xs text-destructive">{erreur}</p>}
          </div>
        )

      case 'switch':
        return (
          <div
            key={champ.id}
            className={cn(
              'flex items-center justify-between rounded-lg border border-border p-4',
              champ.desactive && 'bg-muted/30',
            )}
          >
            <div className="space-y-0.5">
              <Label htmlFor={champ.id} className="text-sm font-medium">
                {champ.label}
              </Label>
              {champ.description && (
                <p className="text-xs text-muted-foreground">{champ.description}</p>
              )}
            </div>
            <Switch
              id={champ.id}
              checked={Boolean(valeur)}
              onCheckedChange={(checked) => mettreAJourChamp(champ.id, checked)}
              disabled={champ.desactive}
            />
          </div>
        )

      case 'number': {
        const affichage =
          valeur === '' || valeur === undefined ? '' : String(valeur as string | number)
        return (
          <div key={champ.id} className="space-y-2">
            <Label htmlFor={champ.id} className="text-sm font-medium">
              {champ.label}
              {champ.required && !champ.desactive && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={champ.id}
              type="number"
              value={affichage}
              onChange={(e) => {
                const raw = e.target.value
                if (raw === '') {
                  mettreAJourChamp(champ.id, '')
                  return
                }
                const n = parseFloat(raw)
                if (!Number.isNaN(n)) {
                  mettreAJourChamp(champ.id, n)
                }
              }}
              placeholder={champ.placeholder}
              min={champ.min}
              max={champ.max}
              disabled={champ.desactive}
              className={cn(erreur && 'border-destructive', champ.desactive && 'cursor-not-allowed bg-muted/50 text-muted-foreground')}
            />
            {erreur && <p className="text-xs text-destructive">{erreur}</p>}
          </div>
        )
      }

      default:
        return (
          <div key={champ.id} className="space-y-2">
            <Label htmlFor={champ.id} className="text-sm font-medium">
              {champ.label}
              {champ.required && !champ.desactive && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={champ.id}
              type={champ.type}
              value={String(valeur || '')}
              onChange={(e) => mettreAJourChamp(champ.id, e.target.value)}
              placeholder={champ.placeholder}
              disabled={champ.desactive}
              className={cn(erreur && 'border-destructive', champ.desactive && 'cursor-not-allowed bg-muted/50 text-muted-foreground')}
            />
            {erreur && <p className="text-xs text-destructive">{erreur}</p>}
          </div>
        )
    }
  }

  return (
    <Dialog open={estOuverte} onOpenChange={(open) => !open && onFermer()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {mode === 'creation' ? 'Nouveau' : 'Modifier'} {titre}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {champs.map(renderChamp)}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onFermer}
            disabled={estChargement}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={gererSoumission}
            disabled={estChargement}
            className="bg-primary hover:bg-primary/90"
          >
            {estChargement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {texteValidation}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
