'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  FileText,
  Key,
  CreditCard,
  Package,
  Trash2,
  Settings,
  UserCircle,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ScanLine,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface ElementMenu {
  label: string
  href: string
  icone: React.ComponentType<{ className?: string }>
  badge?: number
}

const menuPrincipal: ElementMenu[] = [
  { label: 'Tableau de bord', href: '/admin/tableau', icone: LayoutDashboard },
  { label: 'Utilisateurs', href: '/admin/utilisateurs', icone: Users },
  { label: 'Administrateurs', href: '/admin/administrateurs', icone: ShieldCheck },
  { label: 'Gestion de quota', href: '/admin/documents', icone: FileText },
  { label: "Gestion d'API", href: '/admin/api', icone: Key },
  { label: 'Transactions', href: '/admin/transactions', icone: CreditCard },
  { label: 'Packs', href: '/admin/packs', icone: Package },
]

const menuSecondaire: ElementMenu[] = [
  { label: 'Demandes suppression', href: '/admin/demandes-suppression', icone: Trash2, badge: 2 },
  { label: 'Support', href: '/admin/support', icone: MessageSquare, badge: 3 },
]

const menuBas: ElementMenu[] = [
  { label: 'Paramètres', href: '/admin/parametres', icone: Settings },
  { label: 'Mon profil', href: '/admin/profil', icone: UserCircle },
]

interface PropsSidebarAdmin {
  onDeconnexion?: () => void
  estReduit?: boolean
  onEstReduitChange?: (estReduit: boolean) => void
}

export function SidebarAdmin({
  onDeconnexion,
  estReduit: estReduitControle,
  onEstReduitChange,
}: PropsSidebarAdmin) {
  const pathname = usePathname()
  const [estReduitInterne, setEstReduitInterne] = useState(false)
  const estReduit = estReduitControle ?? estReduitInterne
  const definirEstReduit = (value: boolean) => {
    onEstReduitChange?.(value)
    if (estReduitControle === undefined) setEstReduitInterne(value)
  }

  const estActif = (href: string) => {
    if (href === '/admin/tableau') {
      return pathname === '/admin' || pathname === '/admin/tableau'
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
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-slate-200 px-4', estReduit && 'justify-center px-2')}>
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <ScanLine className="h-5 w-5 text-white" />
          </div>
          {!estReduit && <span className="text-lg font-semibold text-slate-900">Portail OCR</span>}
        </Link>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {menuPrincipal.map(renderLien)}
        </div>

        <div className="my-4 border-t border-slate-200" />

        <div className="space-y-1">
          {!estReduit && (
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Modération
            </p>
          )}
          {menuSecondaire.map(renderLien)}
        </div>
      </nav>

      {/* Menu bas */}
      <div className="border-t border-slate-200 p-3 space-y-1">
        {menuBas.map(renderLien)}
        
        <button
          onClick={onDeconnexion}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors',
            'hover:bg-red-50 hover:text-red-600',
            estReduit && 'justify-center px-2'
          )}
          title={estReduit ? 'Déconnexion' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!estReduit && <span>Déconnexion</span>}
        </button>
      </div>

      {/* Bouton réduire */}
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
        <span className="sr-only">{estReduit ? 'Agrandir' : 'Réduire'} la sidebar</span>
      </Button>
    </aside>
  )
}
