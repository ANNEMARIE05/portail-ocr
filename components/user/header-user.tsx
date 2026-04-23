'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search, ChevronDown, Sun, Moon } from 'lucide-react'
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

const titresPages: Record<string, { titre: string; description: string }> = {
  '/user': { titre: 'Tableau de bord', description: 'Bienvenue dans votre espace personnel' },
  '/user/tableau': { titre: 'Tableau de bord', description: 'Bienvenue dans votre espace personnel' },
  '/user/documents': { titre: 'Extraction OCR', description: 'Importez et traitez vos documents' },
  '/user/historique': { titre: 'Historique', description: 'Consultez vos extractions precedentes' },
  '/user/achats': { titre: 'Acheter des credits', description: 'Rechargez votre compte en credits' },
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
}

export function HeaderUser({ 
  nombreNotifications = 0, 
  utilisateur = { nom: 'Dupont', prenom: 'Marie', email: 'marie.dupont@example.com' }
}: PropsHeaderUser) {
  const pathname = usePathname()
  const infosPage = titresPages[pathname] || { titre: 'Mon espace', description: '' }
  const initiales = `${utilisateur.prenom.charAt(0)}${utilisateur.nom.charAt(0)}`.toUpperCase()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      {/* Titre de la page avec animation */}
      <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
        <h1 className="text-lg font-semibold text-slate-900 tracking-tight">{infosPage.titre}</h1>
        {infosPage.description && (
          <p className="text-sm text-slate-500">{infosPage.description}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Recherche globale */}
        <Button variant="outline" size="sm" className="hidden gap-2 text-slate-500 md:flex border-slate-200/60 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200">
          <Search className="h-4 w-4" />
          <span className="text-slate-400">Rechercher...</span>
          <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-slate-100 transition-colors">
              <Bell className="h-5 w-5 text-slate-500" />
              {nombreNotifications > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white animate-in zoom-in duration-200">
                  {nombreNotifications > 9 ? '9+' : nombreNotifications}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 border-slate-200/60">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="text-slate-900">Notifications</span>
              {nombreNotifications > 0 && (
                <Badge variant="secondary" className="font-normal text-[10px] bg-blue-50 text-blue-600 border-0">
                  {nombreNotifications} nouvelles
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <div className="max-h-80 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1.5 p-3 cursor-pointer hover:bg-slate-50">
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium text-slate-900">Extraction terminee</span>
                  <span className="text-[10px] text-slate-400">Il y a 5 min</span>
                </div>
                <span className="text-sm text-slate-500">Votre document facture_2024.pdf a ete traite avec succes.</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1.5 p-3 cursor-pointer hover:bg-slate-50">
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium text-slate-900">Credits faibles</span>
                  <span className="text-[10px] text-slate-400">Il y a 1h</span>
                </div>
                <span className="text-sm text-slate-500">Il vous reste 50 credits. Pensez a recharger.</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem className="justify-center text-blue-600 font-medium cursor-pointer">
              Voir toutes les notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separateur */}
        <div className="mx-1 h-6 w-px bg-slate-200" />

        {/* Profil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-1.5 pr-2 hover:bg-slate-100 transition-colors">
              <Avatar className="h-8 w-8 border-2 border-white shadow-sm">
                {utilisateur.avatar ? (
                  <AvatarImage src={utilisateur.avatar} alt={`${utilisateur.prenom} ${utilisateur.nom}`} />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-900 text-sm text-white font-medium">
                  {initiales}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium text-slate-900">{utilisateur.prenom} {utilisateur.nom.charAt(0)}.</span>
                <span className="text-[10px] text-slate-500">Compte personnel</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-slate-200/60">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-slate-900">{utilisateur.prenom} {utilisateur.nom}</p>
                <p className="text-xs text-slate-500 truncate">{utilisateur.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/user/profil">Mon profil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/user/parametres">Parametres</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/user/apis">Mes cles API</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
              Deconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
