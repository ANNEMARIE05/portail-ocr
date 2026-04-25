'use client'

import { useMemo } from 'react'
import { Bell, ChevronDown } from 'lucide-react'
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
import Link from 'next/link'
import { formaterDateRelative, genererInitiales } from '@/lib/utils/formatage'
import type { NotificationUser } from '@/lib/types-user'

const TITRE_ENTETE = 'Tableau de bord'
const DESCRIPTION_ENTETE = 'Vue d\'ensemble de votre plateforme OCR'

const APERCU_MAX = 8

interface PropsHeaderUser {
  notifications?: NotificationUser[]
  utilisateur?: {
    nom: string
    prenom: string
    email: string
    avatar?: string
  }
  onDeconnexion?: () => void
}

export function HeaderUser({
  notifications = [],
  utilisateur = { nom: '', prenom: '', email: '' },
  onDeconnexion,
}: PropsHeaderUser) {
  const prenomTrim = (utilisateur.prenom ?? '').trim()
  const nomTrim = (utilisateur.nom ?? '').trim()
  const nomCompacte =
    [prenomTrim, nomTrim].filter(Boolean).join(' ') || utilisateur.email || 'Compte'
  const initiales =
    prenomTrim || nomTrim
      ? genererInitiales(prenomTrim, nomTrim)
      : utilisateur.email
        ? genererInitiales(utilisateur.email.split('@')[0] || utilisateur.email, '')
        : '?'

  const notificationsNonLuesAfficables = useMemo(() => {
    return [...notifications]
      .filter((n) => {
        if (n.estLue) return false
        const t = (n.titre ?? '').trim()
        const m = (n.message ?? '').trim()
        return t.length > 0 || m.length > 0
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, APERCU_MAX)
  }, [notifications])

  return (
    <header className="sticky top-0 z-20 flex min-h-12 items-center justify-between gap-1.5 border-b border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:min-h-14 sm:gap-2 sm:px-3 sm:py-2 md:h-16 md:px-6 md:py-0">
      <div className="flex min-w-0 flex-1 flex-col sm:flex-initial">
        <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base md:text-lg">{TITRE_ENTETE}</h1>
        <p className="line-clamp-1 text-[11px] text-slate-500 sm:text-xs md:line-clamp-none md:text-sm">{DESCRIPTION_ENTETE}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {notificationsNonLuesAfficables.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" type="button">
                <Bell className="h-5 w-5 text-slate-500" />
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notificationsNonLuesAfficables.map((n) => {
                  const contenu = (
                    <>
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="font-medium">{(n.titre ?? '').trim() || '—'}</span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {formaterDateRelative(new Date(n.date))}
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">{n.message}</span>
                    </>
                  )
                  if (n.lien) {
                    return (
                      <DropdownMenuItem key={n.id} asChild className="cursor-pointer">
                        <Link href={n.lien} className="flex w-full flex-col items-start gap-1 p-3">
                          {contenu}
                        </Link>
                      </DropdownMenuItem>
                    )
                  }
                  return (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3">
                      {contenu}
                    </DropdownMenuItem>
                  )
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-1">
              <Avatar className="h-8 w-8">
                {utilisateur.avatar ? (
                  <AvatarImage src={utilisateur.avatar} alt={nomCompacte} />
                ) : null}
                <AvatarFallback className="bg-slate-900 text-sm text-white">{initiales}</AvatarFallback>
              </Avatar>
              <div className="hidden max-w-[200px] flex-col items-start text-left md:flex">
                <span className="truncate text-sm font-medium text-slate-900">{nomCompacte}</span>
                <span className="text-xs text-slate-500">Compte personnel</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-slate-900">{nomCompacte}</p>
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
