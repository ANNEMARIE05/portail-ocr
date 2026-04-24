'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  History,
  ShoppingBag,
  CreditCard,
  Key,
  UserCircle,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ScanLine,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useState } from 'react'

interface ElementMenu {
  label: string
  href: string
  icone: React.ComponentType<{ className?: string }>
  badge?: number
}

const menuPrincipal: ElementMenu[] = [
  { label: 'Tableau de bord', href: '/user/tableau', icone: LayoutDashboard },
  { label: 'Extraction OCR', href: '/user/documents', icone: FileText },
  { label: 'Historique', href: '/user/historique', icone: History },
  { label: 'Acheter des quotas', href: '/user/achats', icone: ShoppingBag },
  { label: 'Transactions', href: '/user/transactions', icone: CreditCard },
  { label: 'Mes cles API', href: '/user/apis', icone: Key },
]

const menuSecondaire: ElementMenu[] = [
  { label: 'Mon profil', href: '/user/profil', icone: UserCircle },
  { label: 'Parametres', href: '/user/parametres', icone: Settings },
  { label: 'Assistance', href: '/user/assistance', icone: HelpCircle },
]

interface PropsSidebarUser {
  onDeconnexion?: () => void
  quotaUtilise?: number
  quotaTotal?: number
  estReduit?: boolean
  onEstReduitChange?: (estReduit: boolean) => void
}

export function SidebarUser({
  onDeconnexion,
  quotaUtilise = 340,
  quotaTotal = 500,
  estReduit: estReduitControle,
  onEstReduitChange,
}: PropsSidebarUser) {
  const pathname = usePathname()
  const [estReduitInterne, setEstReduitInterne] = useState(false)
  const estReduit = estReduitControle ?? estReduitInterne
  const definirEstReduit = (value: boolean) => {
    onEstReduitChange?.(value)
    if (estReduitControle === undefined) setEstReduitInterne(value)
  }
  const denominateurQuota = quotaTotal > 0 ? quotaTotal : 1
  const pourcentageQuota = Math.min((quotaUtilise / denominateurQuota) * 100, 100)

  const estActif = (href: string) => {
    if (href === '/user/tableau') {
      return pathname === '/user' || pathname === '/user/tableau'
    }
    return pathname.startsWith(href)
  }

  const renderLien = (element: ElementMenu) => {
    const Icone = element.icone
    const actif = estActif(element.href)

    return (
      <Link
        key={element.href}
        href={element.href}
        className={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-slate-100',
          actif ? 'bg-slate-100 text-slate-900' : 'text-slate-600',
          estReduit && 'justify-center px-2'
        )}
        title={estReduit ? element.label : undefined}
      >
        <Icone className={cn('h-5 w-5 shrink-0', actif ? 'text-slate-900' : 'text-slate-500')} />
        {!estReduit && (
          <>
            <span className="flex-1">{element.label}</span>
            {element.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
                {element.badge}
              </span>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-all duration-300',
        estReduit ? 'w-16' : 'w-64'
      )}
    >
      <div className={cn('flex h-16 items-center border-b border-slate-200 px-4', estReduit && 'justify-center px-2')}>
        <Link href="/user" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <ScanLine className="h-5 w-5 text-white" />
          </div>
          {!estReduit && (
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-slate-900">Portail OCR</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Espace personnel</span>
            </div>
          )}
        </Link>
      </div>

      {!estReduit && (
        <div className="mx-3 mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-slate-700">Quota restant</span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {quotaTotal > 0
                ? `${Math.max(0, quotaTotal - quotaUtilise)} / ${quotaTotal}`
                : '—'}
            </span>
          </div>
          <Progress value={100 - pourcentageQuota} className="h-1.5" />
          <p className="mt-2 text-[10px] text-slate-400">
            {pourcentageQuota >= 80 ? 'Pensez a acheter du quota' : 'Votre quota est confortable'}
          </p>
        </div>
      )}

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 pt-4">
        <div className="space-y-1">{menuPrincipal.map(renderLien)}</div>

        <div className="my-4 border-t border-slate-200" />

        <div className="space-y-1">
          {!estReduit && (
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Mon compte</p>
          )}
          {menuSecondaire.map(renderLien)}
        </div>
      </nav>

      <div className="space-y-1 border-t border-slate-200 p-3">
        <button
          onClick={onDeconnexion}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors',
            'hover:bg-red-50 hover:text-red-600',
            estReduit && 'justify-center px-2'
          )}
          title={estReduit ? 'Deconnexion' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!estReduit && <span>Deconnexion</span>}
        </button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => definirEstReduit(!estReduit)}
        className={cn(
          'absolute -right-3 top-20 h-6 w-6 rounded-full border border-slate-200 bg-white shadow-sm',
          'hover:bg-slate-50'
        )}
      >
        <ChevronLeft className={cn('h-4 w-4 text-slate-500 transition-transform', estReduit && 'rotate-180')} />
        <span className="sr-only">{estReduit ? 'Agrandir' : 'Reduire'} la sidebar</span>
      </Button>
    </aside>
  )
}
