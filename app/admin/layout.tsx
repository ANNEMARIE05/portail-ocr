'use client'

import { useState } from 'react'
import { SidebarAdmin } from '@/components/admin/sidebar-admin'
import { HeaderAdmin } from '@/components/admin/header-admin'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { useScrollToTop } from '@/hooks/use-scroll-to-top'

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const [modaleDeconnexionOuverte, setModaleDeconnexionOuverte] = useState(false)
  
  // Scroll automatique en haut à chaque changement de page
  useScrollToTop()

  const gererDeconnexion = () => {
    // Simulation de déconnexion
    setModaleDeconnexionOuverte(false)
    // Dans une vraie app : router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SidebarAdmin onDeconnexion={() => setModaleDeconnexionOuverte(true)} />
      
      <div className="pl-64 transition-all duration-300">
        <HeaderAdmin nombreNotifications={3} />
        
        <main className="p-6">
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
  )
}
