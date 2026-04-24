'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Breadcrumb {
  label: string
  href?: string
}

const titresPages: Record<string, { titre: string; description: string }> = {
  '/admin': { titre: 'Tableau de bord', description: 'Vue d\'ensemble de votre plateforme OCR' },
  '/admin/tableau': { titre: 'Tableau de bord', description: 'Vue d\'ensemble de votre plateforme OCR' },
  '/admin/utilisateurs': {
    titre: 'Liste des utilisateurs',
    description: 'Comptes clients — recherche, création et gestion.',
  },
  '/admin/administrateurs': {
    titre: 'Liste des administrateurs',
    description: 'Comptes avec accès à l\'administration.',
  },
  '/admin/documents': {
    titre: 'Quotas par utilisateur',
    description: 'Gérez les allocations de documents par client',
  },
  '/admin/api': {
    titre: "Gestion d'API",
    description: 'Vue par client : clés, statut et utilisation',
  },
  '/admin/transactions': {
    titre: 'Historique des transactions',
    description: 'Paiements et achats — recherche par référence ou libellé.',
  },
  '/admin/packs': {
    titre: 'Packs',
    description: 'Liste des packs — création et modification au besoin.',
  },
  '/admin/demandes-suppression': { titre: 'Demandes de suppression', description: 'Traitement des demandes de suppression de compte' },
  '/admin/parametres': { titre: 'Paramètres', description: 'Configuration de la sécurité et des notifications' },
  '/admin/profil': { titre: 'Mon profil', description: 'Gérez vos informations personnelles' },
  '/admin/support': { titre: 'Support', description: 'Gestion des tickets de support client' },
}

interface PropsHeaderAdmin {
  nombreNotifications?: number
  onDeconnexion?: () => void
}

export function HeaderAdmin({ nombreNotifications = 0, onDeconnexion }: PropsHeaderAdmin) {
  const pathname = usePathname()
  const infosPage = titresPages[pathname] || { titre: 'Administration', description: '' }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Titre de la page */}
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-slate-900">{infosPage.titre}</h1>
        {infosPage.description && (
          <p className="text-sm text-slate-500">{infosPage.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Recherche globale */}
        <Button variant="outline" size="sm" className="hidden gap-2 text-slate-500 md:flex">
          <Search className="h-4 w-4" />
          <span>Rechercher...</span>
          <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-500" />
              {nombreNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-medium text-white">
                  {nombreNotifications > 9 ? '9+' : nombreNotifications}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {nombreNotifications > 0 && (
                <Badge variant="secondary" className="font-normal">
                  {nombreNotifications} nouvelles
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">Quota presque atteint</span>
                  <span className="text-xs text-slate-400">Il y a 30 min</span>
                </div>
                <span className="text-sm text-slate-500">3 utilisateurs ont dépassé 90% de leur quota.</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">Échec de paiement</span>
                  <span className="text-xs text-slate-400">Il y a 1h</span>
                </div>
                <span className="text-sm text-slate-500">Transaction #TRX-2024-0892 échouée.</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-blue-600">
              Voir toutes les notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-900 text-sm text-white">JP</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium text-slate-900">Jean-Pierre D.</span>
                <span className="text-xs text-slate-500">Super Admin</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/profil">Mon profil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/parametres">Paramètres</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600 cursor-pointer"
              onSelect={() => onDeconnexion?.()}
            >
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
