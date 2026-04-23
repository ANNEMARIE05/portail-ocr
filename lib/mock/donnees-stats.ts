import type { StatistiquesGlobales, DonneesGraphique, ActiviteRecente, Notification } from '@/lib/types-admin'
import { format, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

export const statistiquesGlobales: StatistiquesGlobales = {
  totalUtilisateurs: 1247,
  utilisateursActifs: 892,
  nouveauxUtilisateursJour: 12,
  variationUtilisateurs: 8.3,
  totalDocumentsTraites: 48523,
  documentsJour: 1842,
  variationDocuments: 12.7,
  revenus30Jours: 34280,
  variationRevenus: 5.2,
  tauxConversion: 3.8,
  variationTauxConversion: -0.4,
}

export function genererDonneesGraphique7Jours(): DonneesGraphique[] {
  const donnees: DonneesGraphique[] = []
  
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const jourSemaine = date.getDay()
    
    // Réduction le week-end
    const facteurJour = (jourSemaine === 0 || jourSemaine === 6) ? 0.4 : 1
    
    donnees.push({
      jour: format(date, 'EEE', { locale: fr }),
      documents: Math.floor((1500 + Math.random() * 800) * facteurJour),
      utilisateurs: Math.floor((80 + Math.random() * 40) * facteurJour),
      revenus: Math.floor((800 + Math.random() * 600) * facteurJour),
    })
  }
  
  return donnees
}

export function genererDonneesGraphique30Jours(): DonneesGraphique[] {
  const donnees: DonneesGraphique[] = []
  
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i)
    const jourSemaine = date.getDay()
    const facteurJour = (jourSemaine === 0 || jourSemaine === 6) ? 0.4 : 1
    
    donnees.push({
      jour: format(date, 'd MMM', { locale: fr }),
      documents: Math.floor((1500 + Math.random() * 800) * facteurJour),
      utilisateurs: Math.floor((80 + Math.random() * 40) * facteurJour),
      revenus: Math.floor((800 + Math.random() * 600) * facteurJour),
    })
  }
  
  return donnees
}

export const activitesRecentes: ActiviteRecente[] = [
  {
    id: 'act_001',
    type: 'inscription',
    description: 'Nouvel utilisateur inscrit',
    utilisateur: 'Claire Fontaine',
    date: new Date(Date.now() - 1800000),
    details: 'Cabinet Comptable Fontaine',
  },
  {
    id: 'act_002',
    type: 'achat',
    description: 'Achat pack Premium',
    utilisateur: 'Marc Leblanc',
    date: new Date(Date.now() - 3600000),
    details: '149€ - 1000 documents',
  },
  {
    id: 'act_003',
    type: 'document',
    description: 'Lot de 250 documents traités',
    utilisateur: 'Sophie Martin',
    date: new Date(Date.now() - 5400000),
  },
  {
    id: 'act_004',
    type: 'support',
    description: 'Nouveau ticket support',
    utilisateur: 'Thomas Girard',
    date: new Date(Date.now() - 7200000),
    details: 'Problème de facturation',
  },
  {
    id: 'act_005',
    type: 'api',
    description: 'Nouvelle clé API générée',
    utilisateur: 'Entreprise XYZ',
    date: new Date(Date.now() - 10800000),
  },
  {
    id: 'act_006',
    type: 'inscription',
    description: 'Nouvel utilisateur inscrit',
    utilisateur: 'Philippe Dumont',
    date: new Date(Date.now() - 14400000),
    details: 'Avocat indépendant',
  },
  {
    id: 'act_007',
    type: 'achat',
    description: 'Achat pack Starter',
    utilisateur: 'Julie Petit',
    date: new Date(Date.now() - 18000000),
    details: '29€ - 100 documents',
  },
  {
    id: 'act_008',
    type: 'document',
    description: 'Traitement terminé',
    utilisateur: 'Cabinet Médical Nord',
    date: new Date(Date.now() - 21600000),
    details: '85 documents',
  },
]

export const notificationsMock: Notification[] = [
  {
    id: 'notif_001',
    type: 'warning',
    titre: 'Quota presque atteint',
    message: '3 utilisateurs ont dépassé 90% de leur quota mensuel.',
    date: new Date(Date.now() - 1800000),
    estLue: false,
  },
  {
    id: 'notif_002',
    type: 'error',
    titre: 'Échec de paiement',
    message: 'La transaction #TRX-2024-0892 a échoué. Carte refusée.',
    date: new Date(Date.now() - 3600000),
    estLue: false,
  },
  {
    id: 'notif_003',
    type: 'info',
    titre: 'Mise à jour système',
    message: 'Une maintenance est prévue ce soir à 23h00 (15 min).',
    date: new Date(Date.now() - 7200000),
    estLue: true,
  },
  {
    id: 'notif_004',
    type: 'success',
    titre: 'Objectif atteint',
    message: 'Le cap des 1000 utilisateurs actifs a été dépassé !',
    date: new Date(Date.now() - 86400000),
    estLue: true,
  },
]
