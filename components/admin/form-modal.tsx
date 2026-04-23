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

  useEffect(() => {
    if (estOuverte) {
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
    }
  }, [estOuverte, champs, donneesInitiales])

  const validerFormulaire = (): boolean => {
    const nouvellesErreurs: Record<string, string> = {}
    
    champs.forEach((champ) => {
      if (champ.required) {
        const valeur = donnees[champ.id]
        if (valeur === undefined || valeur === '' || valeur === null) {
          nouvellesErreurs[champ.id] = `${champ.label} est requis`
        }
      }
      
      if (champ.type === 'email' && donnees[champ.id]) {
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
              {champ.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={champ.id}
              value={String(valeur || '')}
              onChange={(e) => mettreAJourChamp(champ.id, e.target.value)}
              placeholder={champ.placeholder}
              rows={champ.rows || 3}
              className={cn(erreur && 'border-destructive')}
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
              {champ.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select
              value={String(valeur || '')}
              onValueChange={(val) => mettreAJourChamp(champ.id, val)}
            >
              <SelectTrigger className={cn(erreur && 'border-destructive')}>
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
          <div key={champ.id} className="flex items-center justify-between rounded-lg border border-border p-4">
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
            />
          </div>
        )

      case 'number':
        return (
          <div key={champ.id} className="space-y-2">
            <Label htmlFor={champ.id} className="text-sm font-medium">
              {champ.label}
              {champ.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={champ.id}
              type="number"
              value={valeur as number}
              onChange={(e) => mettreAJourChamp(champ.id, parseFloat(e.target.value) || 0)}
              placeholder={champ.placeholder}
              min={champ.min}
              max={champ.max}
              className={cn(erreur && 'border-destructive')}
            />
            {erreur && <p className="text-xs text-destructive">{erreur}</p>}
          </div>
        )

      default:
        return (
          <div key={champ.id} className="space-y-2">
            <Label htmlFor={champ.id} className="text-sm font-medium">
              {champ.label}
              {champ.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={champ.id}
              type={champ.type}
              value={String(valeur || '')}
              onChange={(e) => mettreAJourChamp(champ.id, e.target.value)}
              placeholder={champ.placeholder}
              className={cn(erreur && 'border-destructive')}
            />
            {erreur && <p className="text-xs text-destructive">{erreur}</p>}
          </div>
        )
    }
  }

  return (
    <Dialog open={estOuverte} onOpenChange={onFermer}>
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

        <DialogFooter className="gap-2 sm:gap-0">
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
