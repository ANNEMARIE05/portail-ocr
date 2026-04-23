'use client'

import { useState } from 'react'
import { SidebarUser } from '@/components/user/sidebar-user'
import { HeaderUser } from '@/components/user/header-user'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { useScrollToTop } from '@/hooks/use-scroll-to-top'
import { statistiquesUser } from '@/lib/mock/donnees-user'

export default function LayoutUser({ children }: { children: React.ReactNode }) {
  const [modaleDeconnexionOuverte, setModaleDeconnexionOuverte] = useState(false)
  
  // Scroll automatique en haut a chaque changement de page
  useScrollToTop()

  const gererDeconnexion = () => {
    // Simulation de deconnexion
    setModaleDeconnexionOuverte(false)
    // Dans une vraie app : router.push('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <SidebarUser 
        onDeconnexion={() => setModaleDeconnexionOuverte(true)} 
        quotaUtilise={statistiquesUser.creditsUtilises}
        quotaTotal={statistiquesUser.creditsTotal}
      />
      
      <div className="pl-64 transition-all duration-300">
        <HeaderUser 
          nombreNotifications={2} 
          utilisateur={{
            nom: 'Dupont',
            prenom: 'Marie',
            email: 'marie.dupont@example.com',
          }}
        />
        
        <main className="p-6">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
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
