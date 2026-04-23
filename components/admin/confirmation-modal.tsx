'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

type VarianteModale = 'default' | 'destructive'

interface PropsModaleConfirmation {
  estOuverte: boolean
  onFermer: () => void
  onConfirmer: () => void
  titre: string
  description: string
  texteConfirmation?: string
  texteAnnulation?: string
  variante?: VarianteModale
  estChargement?: boolean
}

export function ModaleConfirmation({
  estOuverte,
  onFermer,
  onConfirmer,
  titre,
  description,
  texteConfirmation = 'Confirmer',
  texteAnnulation = 'Annuler',
  variante = 'default',
  estChargement = false,
}: PropsModaleConfirmation) {
  return (
    <AlertDialog open={estOuverte} onOpenChange={(open) => !open && onFermer()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titre}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={estChargement}>{texteAnnulation}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirmer()
            }}
            disabled={estChargement}
            className={cn(
              variante === 'destructive' &&
                'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            )}
          >
            {estChargement ? <Spinner className="h-4 w-4" /> : texteConfirmation}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
