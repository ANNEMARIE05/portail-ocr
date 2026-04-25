'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarUser } from '@/components/user/sidebar-user'
import { HeaderUser } from '@/components/user/header-user'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { useScrollToTop } from '@/hooks/use-scroll-to-top'
import { recupererStatistiquesUser, recupererNotificationsUser } from '@/lib/api/user-service'
import type { NotificationUser } from '@/lib/types-user'
import { lireDonneesProfilUtilisateurSession } from '@/lib/api/session-client'
import { EVENEMENT_RAFRAICHIR_QUOTA_USER } from '@/lib/user-quota-refresh'

export default function LayoutUser({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [modaleDeconnexionOuverte, setModaleDeconnexionOuverte] = useState(false)
  const [sidebarReduite, setSidebarReduite] = useState(false)
  const [quota, setQuota] = useState({
    utilise: 0,
    total: 0,
  })
  const [notifications, setNotifications] = useState<NotificationUser[]>([])
  const [utilisateurHeader, setUtilisateurHeader] = useState({
    prenom: '',
    nom: '',
    email: '',
  })

  const chargerQuota = useCallback(async () => {
    const reponse = await recupererStatistiquesUser()
    if (reponse.succes && reponse.donnees) {
      setQuota({
        utilise: reponse.donnees.creditsUtilises,
        total: reponse.donnees.creditsTotal,
      })
    }
  }, [])

  const chargerNotifications = useCallback(async () => {
    const reponse = await recupererNotificationsUser()
    if (reponse.succes && reponse.donnees) {
      setNotifications(reponse.donnees)
    } else {
      setNotifications([])
    }
  }, [])

  useEffect(() => {
    void chargerQuota()
    void chargerNotifications()
  }, [chargerQuota, chargerNotifications])

  useEffect(() => {
    const d = lireDonneesProfilUtilisateurSession()
    setUtilisateurHeader({ prenom: d.prenom, nom: d.nom, email: d.email })
  }, [pathname])

  useEffect(() => {
    const ecouter = () => {
      void chargerQuota()
    }
    window.addEventListener(EVENEMENT_RAFRAICHIR_QUOTA_USER, ecouter)
    return () => window.removeEventListener(EVENEMENT_RAFRAICHIR_QUOTA_USER, ecouter)
  }, [chargerQuota])
  
  // Scroll automatique en haut a chaque changement de page
  useScrollToTop()

  const gererDeconnexion = () => {
    setModaleDeconnexionOuverte(false)
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SidebarUser
        onDeconnexion={() => setModaleDeconnexionOuverte(true)}
        quotaUtilise={quota.utilise}
        quotaTotal={quota.total}
        estReduit={sidebarReduite}
        onEstReduitChange={setSidebarReduite}
      />

      <div
        className={cn(
          'transition-[padding] duration-300 max-md:pl-16',
          sidebarReduite ? 'pl-16' : 'pl-64',
        )}
      >
        <HeaderUser
          notifications={notifications}
          utilisateur={utilisateurHeader}
          onDeconnexion={() => setModaleDeconnexionOuverte(true)}
        />
        
        <main className="p-2 pb-4 sm:p-4 sm:pb-5 md:p-6 md:pb-6">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>

      <ModaleConfirmation
        estOuverte={modaleDeconnexionOuverte}
        onFermer={() => setModaleDeconnexionOuverte(false)}
        onConfirmer={gererDeconnexion}
        titre="Confirmer la deconnexion"
        description="Etes-vous sur de vouloir vous deconnecter ? Vous devrez vous reconnecter pour acceder a votre espace personnel."
        texteConfirmation="Se deconnecter"
        variante="destructive"
      />
    </div>
  )
}
