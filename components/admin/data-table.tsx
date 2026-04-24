'use client'

import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColonneTable, ActionLigne, ConfigPagination } from '@/lib/types-admin'
import { OPTIONS_ELEMENTS_PAR_PAGE_DEFAUT } from '@/lib/constants-pagination'

interface PropsTableDonnees<T> {
  colonnes: ColonneTable<T>[]
  donnees: T[]
  estChargement?: boolean
  pagination?: ConfigPagination
  onChangementPage?: (page: number) => void
  /** Propositions pour « X résultats par page » (affiché dans la barre de pagination). */
  optionsParPage?: readonly number[]
  onChangementParPage?: (parPage: number) => void
  actions?: ActionLigne<T>[]
  lignesParPageSkeleton?: number
  idAccesseur: (item: T) => string
  /** Clic sur la ligne (hors menu actions) pour ouvrir un détail, une modale, etc. */
  onLigneClick?: (item: T) => void
  /** Place le sélecteur « par page » au-dessus du tableau, en flex avec `aCoteSelectParPage`. */
  selectParPageAuDessusDuTableau?: boolean
  aCoteSelectParPage?: ReactNode
}

export function TableDonnees<T>({
  colonnes,
  donnees,
  estChargement = false,
  pagination,
  onChangementPage,
  optionsParPage = OPTIONS_ELEMENTS_PAR_PAGE_DEFAUT,
  onChangementParPage,
  actions,
  lignesParPageSkeleton = 5,
  idAccesseur,
  onLigneClick,
  selectParPageAuDessusDuTableau = false,
  aCoteSelectParPage,
}: PropsTableDonnees<T>) {
  const parPageEffectif = pagination ? Math.max(1, pagination.parPage) : 1
  const nombrePages = pagination ? Math.max(1, Math.ceil(pagination.total / parPageEffectif)) : 1
  const debut = pagination ? (pagination.page - 1) * parPageEffectif + 1 : 1
  const fin = pagination ? Math.min(pagination.page * parPageEffectif, pagination.total) : donnees.length

  const renderSkeleton = () => (
    <>
      {Array.from({ length: lignesParPageSkeleton }).map((_, i) => (
        <TableRow key={i}>
          {colonnes.map((col, j) => (
            <TableCell key={j} className={cn('py-3', col.classNameCellule)}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
          {actions && (
            <TableCell className="py-3">
              <Skeleton className="h-8 w-8" />
            </TableCell>
          )}
        </TableRow>
      ))}
    </>
  )

  const renderActions = (item: T) => {
    if (!actions || actions.length === 0) return null

    const actionsVisibles = actions.filter((action) => !action.condition || action.condition(item))

    if (actionsVisibles.length === 0) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actionsVisibles.map((action) => {
            const Icone = action.icone
            return (
              <DropdownMenuItem
                key={action.id}
                onClick={() => action.onClick(item)}
                className={cn(action.variante === 'destructive' && 'text-destructive focus:text-destructive')}
              >
                <Icone className="mr-2 h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const selectParPage = onChangementParPage && pagination && (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-sm text-muted-foreground whitespace-nowrap">Par page</span>
      <Select
        value={String(pagination.parPage)}
        onValueChange={(v) => onChangementParPage(Number(v))}
        disabled={estChargement}
      >
        <SelectTrigger className="h-8 w-[100px]" aria-label="Nombre de résultats par page">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(optionsParPage.includes(pagination.parPage)
            ? [...optionsParPage]
            : [...optionsParPage, pagination.parPage].sort((a, b) => a - b)
          ).map((n) => (
            <SelectItem key={n} value={String(n)}>
              {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="space-y-4">
      {selectParPageAuDessusDuTableau && (selectParPage || aCoteSelectParPage) && (
        <div className="flex w-full flex-wrap items-center gap-3 sm:justify-between">
          {aCoteSelectParPage}
          {selectParPage}
        </div>
      )}
      <div className="rounded-md border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              {colonnes.map((col) => (
                <TableHead
                  key={String(col.id)}
                  style={col.largeur ? { width: col.largeur } : undefined}
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {col.label}
                </TableHead>
              ))}
              {actions && (
                <TableHead className="w-12 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {estChargement ? (
              renderSkeleton()
            ) : donnees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colonnes.length + (actions ? 1 : 0)} className="h-24 text-center">
                  <p className="text-muted-foreground">Aucun résultat trouvé</p>
                </TableCell>
              </TableRow>
            ) : (
              donnees.map((item) => (
                <TableRow
                  key={idAccesseur(item)}
                  className={cn('transition-colors', onLigneClick && 'cursor-pointer hover:bg-muted/40')}
                  onClick={() => onLigneClick?.(item)}
                >
                  {colonnes.map((col) => (
                    <TableCell key={String(col.id)} className={cn('py-3', col.classNameCellule)}>
                      {col.accesseur(item)}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell className="py-3" onClick={(e) => e.stopPropagation()}>
                      {renderActions(item)}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-sm text-muted-foreground">
              Affichage de {debut} à {fin} sur {pagination.total} résultats
            </p>
            {onChangementParPage && !selectParPageAuDessusDuTableau && selectParPage}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChangementPage?.(pagination.page - 1)}
              disabled={pagination.page <= 1 || estChargement}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, nombrePages) }).map((_, i) => {
                let pageNum: number
                if (nombrePages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= nombrePages - 2) {
                  pageNum = nombrePages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => onChangementPage?.(pageNum)}
                    disabled={estChargement}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChangementPage?.(pagination.page + 1)}
              disabled={pagination.page >= nombrePages || estChargement}
            >
              Suivant
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
