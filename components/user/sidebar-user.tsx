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
  { label: 'Acheter des credits', href: '/user/achats', icone: ShoppingBag },
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
}

export function SidebarUser({ onDeconnexion, quotaUtilise = 340, quotaTotal = 500 }: PropsSidebarUser) {
  const pathname = usePathname()
  const [estReduit, setEstReduit] = useState(false)
  const pourcentageQuota = Math.min((quotaUtilise / quotaTotal) * 100, 100)

  const estActif = (href: string) => {
    if (href === '/user/tableau') {
      return pathname === '/user' || pathname === '/user/tableau'
    }
    return pathname.startsWith(href)
  }

  const renderLien = (element: ElementMenu, index: number) => {
    const Icone = element.icone
    const actif = estActif(element.href)

    return (
      <Link
        key={element.href}
        href={element.href}
        className={cn(
          'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
          'hover:bg-slate-100 hover:translate-x-0.5',
          actif ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600',
          estReduit && 'justify-center px-2'
        )}
        style={{ 
          animationDelay: `${index * 30}ms`,
        }}
        title={estReduit ? element.label : undefined}
      >
        <Icone className={cn(
          'h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110',
          actif ? 'text-white' : 'text-slate-500'
        )} />
        {!estReduit && (
          <>
            <span className="flex-1">{element.label}</span>
            {element.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-medium text-white">
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
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200/60 bg-white transition-all duration-300 ease-out',
        estReduit ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-slate-200/60 px-4', estReduit && 'justify-center px-2')}>
        <Link href="/user" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 shadow-lg shadow-slate-900/20 transition-transform duration-200 group-hover:scale-105">
            <ScanLine className="h-5 w-5 text-white" />
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          {!estReduit && (
            <div className="flex flex-col">
              <span className="text-base font-semibold text-slate-900">OCR Portal</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Espace personnel</span>
            </div>
          )}
        </Link>
      </div>

      {/* Quota Widget */}
      {!estReduit && (
        <div className="mx-3 mt-4 rounded-lg border border-slate-200/60 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-slate-700">Credits restants</span>
            </div>
            <span className="text-xs font-medium text-slate-500">{quotaTotal - quotaUtilise} / {quotaTotal}</span>
          </div>
          <Progress value={100 - pourcentageQuota} className="h-1.5" />
          <p className="mt-2 text-[10px] text-slate-400">
            {pourcentageQuota >= 80 ? 'Pensez a recharger vos credits' : 'Vos credits sont en bonne sante'}
          </p>
        </div>
      )}

      {/* Navigation principale */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 pt-4">
        <div className="space-y-1">
          {menuPrincipal.map((element, index) => renderLien(element, index))}
        </div>

        <div className="my-4 border-t border-slate-200/60" />

        <div className="space-y-1">
          {!estReduit && (
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Mon compte
            </p>
          )}
          {menuSecondaire.map((element, index) => renderLien(element, index + menuPrincipal.length))}
        </div>
      </nav>

      {/* Deconnexion */}
      <div className="border-t border-slate-200/60 p-3">
        <button
          onClick={onDeconnexion}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200',
            'hover:bg-red-50 hover:text-red-600',
            estReduit && 'justify-center px-2'
          )}
          title={estReduit ? 'Deconnexion' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!estReduit && <span>Deconnexion</span>}
        </button>
      </div>

      {/* Bouton reduire */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setEstReduit(!estReduit)}
        className={cn(
          'absolute -right-3 top-20 h-6 w-6 rounded-full border border-slate-200 bg-white shadow-sm',
          'hover:bg-slate-50 hover:shadow-md transition-all duration-200'
        )}
      >
        <ChevronLeft className={cn('h-4 w-4 text-slate-500 transition-transform duration-200', estReduit && 'rotate-180')} />
        <span className="sr-only">{estReduit ? 'Agrandir' : 'Reduire'} la sidebar</span>
      </Button>
    </aside>
  )
}
