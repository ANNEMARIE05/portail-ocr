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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { genererInitiales } from '@/lib/utils/formatage'

const titresPages: Record<string, { titre: string; description: string }> = {
  '/user': { titre: 'Tableau de bord', description: 'Bienvenue dans votre espace personnel' },
  '/user/tableau': { titre: 'Tableau de bord', description: 'Bienvenue dans votre espace personnel' },
  '/user/documents': { titre: 'Extraction OCR', description: 'Importez et traitez vos documents' },
  '/user/historique': {
    titre: 'Historique des appels API',
    description:
      "Filtrez par famille de code HTTP et recherchez par URL, verbe HTTP ou message d'erreur.",
  },
  '/user/achats': { titre: 'Acheter des quotas', description: 'Augmentez le quota de votre compte' },
  '/user/transactions': { titre: 'Transactions', description: 'Historique de vos paiements' },
  '/user/apis': { titre: 'Mes cles API', description: 'Gerez vos cles et acces API' },
  '/user/profil': { titre: 'Mon profil', description: 'Gerez vos informations personnelles' },
  '/user/parametres': { titre: 'Parametres', description: 'Configurez votre compte' },
  '/user/assistance': { titre: 'Assistance', description: 'Contactez notre equipe support' },
}

interface PropsHeaderUser {
  nombreNotifications?: number
  utilisateur?: {
    nom: string
    prenom: string
    email: string
    avatar?: string
  }
  onDeconnexion?: () => void
}

export function HeaderUser({
  nombreNotifications = 0,
  utilisateur = { nom: 'Dupont', prenom: 'Marie', email: 'marie.dupont@example.com' },
  onDeconnexion,
}: PropsHeaderUser) {
  const pathname = usePathname()
  const infosPage = titresPages[pathname] || { titre: 'Mon espace', description: '' }
  const initiales = genererInitiales(utilisateur.prenom ?? '', utilisateur.nom ?? '')

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-slate-900">{infosPage.titre}</h1>
        {infosPage.description && <p className="text-sm text-slate-500">{infosPage.description}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="hidden gap-2 text-slate-500 md:flex">
          <Search className="h-4 w-4" />
          <span>Rechercher...</span>
          <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-500 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

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
                  <span className="font-medium">Extraction terminee</span>
                  <span className="text-xs text-slate-400">Il y a 5 min</span>
                </div>
                <span className="text-sm text-slate-500">Votre document facture_2024.pdf a ete traite avec succes.</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">Quota faible</span>
                  <span className="text-xs text-slate-400">Il y a 1h</span>
                </div>
                <span className="text-sm text-slate-500">Il vous reste peu de quota. Pensez a en acheter.</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-blue-600">Voir toutes les notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-1">
              <Avatar className="h-8 w-8">
                {utilisateur.avatar ? (
                  <AvatarImage src={utilisateur.avatar} alt={`${utilisateur.prenom} ${utilisateur.nom}`} />
                ) : null}
                <AvatarFallback className="bg-slate-900 text-sm text-white">{initiales}</AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium text-slate-900">
                  {utilisateur.prenom} {utilisateur.nom.charAt(0)}.
                </span>
                <span className="text-xs text-slate-500">Compte personnel</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-slate-900">
                  {utilisateur.prenom} {utilisateur.nom}
                </p>
                <p className="truncate text-xs text-slate-500">{utilisateur.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/user/profil">Mon profil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/user/parametres">Parametres</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/user/apis">Mes cles API</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600"
              onSelect={() => onDeconnexion?.()}
            >
              Deconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
