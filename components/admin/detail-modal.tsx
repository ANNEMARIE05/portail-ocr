'use client'

import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface ChampDetail {
  id: string
  label: string
  valeur: React.ReactNode
  type?: 'text' | 'badge' | 'date' | 'currency' | 'progress' | 'custom'
  couleurBadge?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  pleineLargeur?: boolean
}

export interface SectionDetail {
  titre?: string
  champs: ChampDetail[]
}

interface ModaleDetailProps {
  estOuverte: boolean
  onFermer: () => void
  titre: string
  description?: string
  sections: SectionDetail[]
  entete?: React.ReactNode
  actions?: React.ReactNode
}

export function ModaleDetail({
  estOuverte,
  onFermer,
  titre,
  description,
  sections,
  entete,
  actions,
}: ModaleDetailProps) {
  const renderValeur = (champ: ChampDetail) => {
    switch (champ.type) {
      case 'badge':
        const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          success: 'default',
          warning: 'secondary',
          default: 'default',
          secondary: 'secondary',
          destructive: 'destructive',
          outline: 'outline',
        }
        return (
          <Badge 
            variant={variantMap[champ.couleurBadge || 'default']}
            className={cn(
              champ.couleurBadge === 'success' && 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
              champ.couleurBadge === 'warning' && 'bg-amber-100 text-amber-700 hover:bg-amber-100'
            )}
          >
            {champ.valeur}
          </Badge>
        )
      
      case 'custom':
        return champ.valeur
      
      default:
        return (
          <span className="font-medium text-foreground">
            {champ.valeur}
          </span>
        )
    }
  }

  return (
    <Dialog open={estOuverte} onOpenChange={onFermer}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">{titre}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {entete && (
          <div className="py-2">
            {entete}
          </div>
        )}

        <div className="space-y-6">
          {sections.map((section, indexSection) => (
            <div key={indexSection} className="space-y-4">
              {section.titre && (
                <>
                  {indexSection > 0 && <Separator />}
                  <h4 className="text-sm font-semibold text-foreground">
                    {section.titre}
                  </h4>
                </>
              )}
              
              <div className="grid gap-3">
                {section.champs.map((champ) => (
                  <div 
                    key={champ.id}
                    className={cn(
                      'flex items-start justify-between gap-4',
                      champ.pleineLargeur && 'flex-col'
                    )}
                  >
                    <span className="text-sm text-muted-foreground shrink-0">
                      {champ.label}
                    </span>
                    <div className={cn(
                      'text-sm text-right',
                      champ.pleineLargeur && 'text-left w-full'
                    )}>
                      {renderValeur(champ)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {actions && (
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            {actions}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
