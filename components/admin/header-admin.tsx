'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'
import { useAdminProfil } from '@/components/admin/admin-profil-provider'
import { nomCompteCourtDepuisDonneesAdmin } from '@/lib/api/session-client'
import { recupererNotifications } from '@/lib/api/admin-service'
import { formaterDateRelative } from '@/lib/utils/formatage'
import type { RoleAdmin, Notification } from '@/lib/types-admin'

const libelleRole: Record<RoleAdmin, string> = {
  'super-admin': 'Super Admin',
  admin: 'Admin',
  moderateur: 'Modérateur',
}

const TITRE_ENTETE = 'Tableau de bord'
const DESCRIPTION_ENTETE = "Vue d'ensemble de votre plateforme OCR"

const APERCU_MAX = 8

interface PropsHeaderAdmin {
  onDeconnexion?: () => void
}

function filtrerNotificationsAfficables(liste: Notification[]): Notification[] {
  return liste
    .filter((n) => {
      if (n.estLue) return false
      const t = (n.titre ?? '').trim()
      const m = (n.message ?? '').trim()
      return t.length > 0 || m.length > 0
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, APERCU_MAX)
}

export function HeaderAdmin({ onDeconnexion }: PropsHeaderAdmin) {
  const { donnees } = useAdminProfil()
  const initiales = donnees.initialesAvatar || '?'
  const libelleSousTitre = libelleRole[donnees.role] ?? 'Admin'

  const [notifications, setNotifications] = useState<Notification[]>([])

  const charger = useCallback(async () => {
    const rep = await recupererNotifications()
    if (rep.succes && rep.donnees) {
      setNotifications(rep.donnees)
    } else {
      setNotifications([])
    }
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  const aAfficher = useMemo(() => filtrerNotificationsAfficables(notifications), [notifications])

  return (
    <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-white/60 sm:h-16 sm:px-6 sm:py-0">
      <div className="flex min-w-0 flex-1 flex-col sm:flex-initial">
        <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{TITRE_ENTETE}</h1>
        <p className="line-clamp-1 text-xs text-slate-500 sm:line-clamp-none sm:text-sm">{DESCRIPTION_ENTETE}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        {aAfficher.length > 0 && (
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
                {aAfficher.map((n) => (
                  <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3">
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="font-medium">{(n.titre ?? '').trim() || '—'}</span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {formaterDateRelative(new Date(n.date))}
                      </span>
                    </div>
                    <span className="text-sm text-slate-500">{n.message}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 pl-2 pr-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-slate-900 text-sm text-white">
                  {initiales}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start text-left md:flex">
                <span className="text-sm font-medium text-slate-900">
                  {nomCompteCourtDepuisDonneesAdmin(donnees)}
                </span>
                <span className="text-xs text-slate-500">{libelleSousTitre}</span>
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
              className="cursor-pointer text-red-600 focus:text-red-600"
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
