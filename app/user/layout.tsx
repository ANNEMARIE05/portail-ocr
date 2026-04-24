'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SidebarUser } from '@/components/user/sidebar-user'
import { HeaderUser } from '@/components/user/header-user'
import { ModaleConfirmation } from '@/components/admin/confirmation-modal'
import { useScrollToTop } from '@/hooks/use-scroll-to-top'
import { statistiquesUser } from '@/lib/mock/donnees-user'

export default function LayoutUser({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [modaleDeconnexionOuverte, setModaleDeconnexionOuverte] = useState(false)
  const [sidebarReduite, setSidebarReduite] = useState(false)
  
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
        quotaUtilise={statistiquesUser.creditsUtilises}
        quotaTotal={statistiquesUser.creditsTotal}
        estReduit={sidebarReduite}
        onEstReduitChange={setSidebarReduite}
      />

      <div
        className={cn(
          'transition-[padding] duration-300',
          sidebarReduite ? 'pl-16' : 'pl-64',
        )}
      >
        <HeaderUser 
          nombreNotifications={2} 
          utilisateur={{
            nom: 'Dupont',
            prenom: 'Marie',
            email: 'marie.dupont@example.com',
          }}
          onDeconnexion={() => setModaleDeconnexionOuverte(true)}
        />
        
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
        titre="Confirmer la deconnexion"
        description="Etes-vous sur de vouloir vous deconnecter ? Vous devrez vous reconnecter pour acceder a votre espace personnel."
        texteConfirmation="Se deconnecter"
        variante="destructive"
      />
    </div>
  )
}
