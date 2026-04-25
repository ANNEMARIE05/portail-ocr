'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarAdmin } from '@/components/admin/sidebar-admin'
import { HeaderAdmin } from '@/components/admin/header-admin'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { AdminProfilProvider } from '@/components/admin/admin-profil-provider'
import { useScrollToTop } from '@/hooks/use-scroll-to-top'

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [modaleDeconnexionOuverte, setModaleDeconnexionOuverte] = useState(false)
  const [sidebarReduite, setSidebarReduite] = useState(false)
  
  // Scroll automatique en haut à chaque changement de page
  useScrollToTop()

  const gererDeconnexion = () => {
    setModaleDeconnexionOuverte(false)
    router.push('/adminlogin')
  }

  return (
    <AdminProfilProvider>
      <div className="min-h-screen bg-slate-50">
        <SidebarAdmin
          onDeconnexion={() => setModaleDeconnexionOuverte(true)}
          estReduit={sidebarReduite}
          onEstReduitChange={setSidebarReduite}
        />

        <div
          className={cn(
            'transition-[padding] duration-300',
            sidebarReduite ? 'pl-16' : 'pl-64',
          )}
        >
          <HeaderAdmin
            onDeconnexion={() => setModaleDeconnexionOuverte(true)}
          />

          <main className="p-3 pb-5 sm:p-6 sm:pb-6">
            <div className="mx-auto max-w-7xl animate-in fade-in duration-300">
              {children}
            </div>
          </main>
        </div>

        <ModaleConfirmation
          estOuverte={modaleDeconnexionOuverte}
          onFermer={() => setModaleDeconnexionOuverte(false)}
          onConfirmer={gererDeconnexion}
          titre="Confirmer la déconnexion"
          description="Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à l'interface d'administration."
          texteConfirmation="Se déconnecter"
          variante="destructive"
        />
      </div>
    </AdminProfilProvider>
  )
}
