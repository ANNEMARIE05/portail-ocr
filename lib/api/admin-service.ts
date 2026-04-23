import type {
  Utilisateur,
  Administrateur,
  Transaction,
  Pack,
  CleApi,
  DemandeSuppressionCompte,
  TicketSupport,
  StatistiquesGlobales,
  DonneesGraphique,
  ActiviteRecente,
  Notification,
  ConfigPagination,
  ReponseApi,
  FiltresUtilisateurs,
  FiltresTransactions,
} from '@/lib/types-admin'
import { simulerDelai } from '@/lib/utils/delai'
import { utilisateursMock, administrateursMock, demandesSuppressionMock, clesApiMock } from '@/lib/mock/donnees-utilisateurs'
import { statistiquesGlobales, genererDonneesGraphique7Jours, activitesRecentes, notificationsMock } from '@/lib/mock/donnees-stats'
import { transactionsMock, packsMock, ticketsSupportMock } from '@/lib/mock/donnees-transactions'

// ==================== STATISTIQUES ====================

export async function recupererStatistiques(): Promise<ReponseApi<StatistiquesGlobales>> {
  await simulerDelai(400)
  return {
    succes: true,
    donnees: statistiquesGlobales,
  }
}

export async function recupererDonneesGraphique(periode: '7j' | '30j' = '7j'): Promise<ReponseApi<DonneesGraphique[]>> {
  await simulerDelai(300)
  return {
    succes: true,
    donnees: genererDonneesGraphique7Jours(),
  }
}

export async function recupererActivitesRecentes(limite: number = 8): Promise<ReponseApi<ActiviteRecente[]>> {
  await simulerDelai(250)
  return {
    succes: true,
    donnees: activitesRecentes.slice(0, limite),
  }
}

export async function recupererNotifications(): Promise<ReponseApi<Notification[]>> {
  await simulerDelai(200)
  return {
    succes: true,
    donnees: notificationsMock,
  }
}

// ==================== UTILISATEURS ====================

export async function recupererUtilisateurs(
  page: number = 1,
  parPage: number = 10,
  filtres?: FiltresUtilisateurs
): Promise<ReponseApi<Utilisateur[]>> {
  await simulerDelai(500)
  
  let donneesFiltrees = [...utilisateursMock]
  
  if (filtres?.recherche) {
    const terme = filtres.recherche.toLowerCase()
    donneesFiltrees = donneesFiltrees.filter(
      u => u.nom.toLowerCase().includes(terme) ||
           u.prenom.toLowerCase().includes(terme) ||
           u.email.toLowerCase().includes(terme) ||
           u.entreprise.toLowerCase().includes(terme)
    )
  }
  
  if (filtres?.statut && filtres.statut !== 'tous') {
    donneesFiltrees = donneesFiltrees.filter(u => u.statut === filtres.statut)
  }
  
  const total = donneesFiltrees.length
  const debut = (page - 1) * parPage
  const fin = debut + parPage
  
  return {
    succes: true,
    donnees: donneesFiltrees.slice(debut, fin),
    pagination: {
      page,
      parPage,
      total,
    },
  }
}

export async function recupererUtilisateurParId(id: string): Promise<ReponseApi<Utilisateur>> {
  await simulerDelai(300)
  const utilisateur = utilisateursMock.find(u => u.id === id)
  
  if (!utilisateur) {
    return { succes: false, erreur: 'Utilisateur non trouvé' }
  }
  
  return { succes: true, donnees: utilisateur }
}

export async function modifierStatutUtilisateur(id: string, statut: 'actif' | 'inactif' | 'suspendu'): Promise<ReponseApi<Utilisateur>> {
  await simulerDelai(400)
  const utilisateur = utilisateursMock.find(u => u.id === id)
  
  if (!utilisateur) {
    return { succes: false, erreur: 'Utilisateur non trouvé' }
  }
  
  utilisateur.statut = statut
  return { succes: true, donnees: utilisateur }
}

// ==================== ADMINISTRATEURS ====================

export async function recupererAdministrateurs(): Promise<ReponseApi<Administrateur[]>> {
  await simulerDelai(400)
  return {
    succes: true,
    donnees: administrateursMock,
  }
}

export async function recupererAdministrateurParId(id: string): Promise<ReponseApi<Administrateur>> {
  await simulerDelai(300)
  const admin = administrateursMock.find(a => a.id === id)
  
  if (!admin) {
    return { succes: false, erreur: 'Administrateur non trouvé' }
  }
  
  return { succes: true, donnees: admin }
}

// ==================== TRANSACTIONS ====================

export async function recupererTransactions(
  page: number = 1,
  parPage: number = 10,
  filtres?: FiltresTransactions
): Promise<ReponseApi<Transaction[]>> {
  await simulerDelai(500)
  
  let donneesFiltrees = [...transactionsMock]
  
  if (filtres?.recherche) {
    const terme = filtres.recherche.toLowerCase()
    donneesFiltrees = donneesFiltrees.filter(
      t => t.reference.toLowerCase().includes(terme) ||
           t.utilisateurNom.toLowerCase().includes(terme) ||
           t.utilisateurEmail.toLowerCase().includes(terme)
    )
  }
  
  if (filtres?.statut && filtres.statut !== 'tous') {
    donneesFiltrees = donneesFiltrees.filter(t => t.statut === filtres.statut)
  }
  
  const total = donneesFiltrees.length
  const debut = (page - 1) * parPage
  const fin = debut + parPage
  
  return {
    succes: true,
    donnees: donneesFiltrees.slice(debut, fin),
    pagination: {
      page,
      parPage,
      total,
    },
  }
}

// ==================== PACKS ====================

export async function recupererPacks(): Promise<ReponseApi<Pack[]>> {
  await simulerDelai(400)
  return {
    succes: true,
    donnees: packsMock,
  }
}

export async function modifierPack(id: string, donnees: Partial<Pack>): Promise<ReponseApi<Pack>> {
  await simulerDelai(400)
  const pack = packsMock.find(p => p.id === id)
  
  if (!pack) {
    return { succes: false, erreur: 'Pack non trouvé' }
  }
  
  Object.assign(pack, donnees)
  return { succes: true, donnees: pack }
}

// ==================== CLÉS API ====================

export async function recupererClesApi(
  page: number = 1,
  parPage: number = 10
): Promise<ReponseApi<CleApi[]>> {
  await simulerDelai(400)
  
  const total = clesApiMock.length
  const debut = (page - 1) * parPage
  const fin = debut + parPage
  
  return {
    succes: true,
    donnees: clesApiMock.slice(debut, fin),
    pagination: {
      page,
      parPage,
      total,
    },
  }
}

export async function revoquerCleApi(id: string): Promise<ReponseApi<CleApi>> {
  await simulerDelai(300)
  const cle = clesApiMock.find(c => c.id === id)
  
  if (!cle) {
    return { succes: false, erreur: 'Clé API non trouvée' }
  }
  
  cle.estActive = false
  return { succes: true, donnees: cle }
}

// ==================== DEMANDES DE SUPPRESSION ====================

export async function recupererDemandesSuppression(): Promise<ReponseApi<DemandeSuppressionCompte[]>> {
  await simulerDelai(400)
  return {
    succes: true,
    donnees: demandesSuppressionMock,
  }
}

export async function traiterDemandeSuppression(
  id: string,
  decision: 'approuve' | 'rejete',
  adminNom: string
): Promise<ReponseApi<DemandeSuppressionCompte>> {
  await simulerDelai(500)
  const demande = demandesSuppressionMock.find(d => d.id === id)
  
  if (!demande) {
    return { succes: false, erreur: 'Demande non trouvée' }
  }
  
  demande.statut = decision
  demande.traitePar = adminNom
  demande.dateTraitement = new Date()
  
  return { succes: true, donnees: demande }
}

// ==================== SUPPORT ====================

export async function recupererTicketsSupport(): Promise<ReponseApi<TicketSupport[]>> {
  await simulerDelai(400)
  return {
    succes: true,
    donnees: ticketsSupportMock,
  }
}

export async function recupererTicketParId(id: string): Promise<ReponseApi<TicketSupport>> {
  await simulerDelai(300)
  const ticket = ticketsSupportMock.find(t => t.id === id)
  
  if (!ticket) {
    return { succes: false, erreur: 'Ticket non trouvé' }
  }
  
  return { succes: true, donnees: ticket }
}
