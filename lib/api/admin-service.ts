import type {
  Utilisateur,
  Administrateur,
  Transaction,
  Pack,
  CleApi,
  LigneClientGestionApi,
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
  FiltresAdministrateurs,
  FiltresDemandesSuppression,
  EntreeHistoriqueQuota,
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
           u.entreprise.toLowerCase().includes(terme) ||
           u.role.toLowerCase().includes(terme)
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

/** Historique des assignations (mémoire de session, mock) */
const historiqueAssignationsQuota: EntreeHistoriqueQuota[] = []

export async function assignerQuotaAdministrateur(
  utilisateurId: string,
  montant: number
): Promise<ReponseApi<void>> {
  await simulerDelai(350)
  if (!Number.isFinite(montant) || montant <= 0 || !Number.isInteger(montant)) {
    return { succes: false, erreur: 'Le montant doit être un entier strictement positif.' }
  }
  const utilisateur = utilisateursMock.find((u) => u.id === utilisateurId)
  if (!utilisateur) {
    return { succes: false, erreur: 'Utilisateur non trouvé' }
  }
  utilisateur.quotaTotal += montant
  const nomClient = `${utilisateur.prenom} ${utilisateur.nom}`.trim()
  historiqueAssignationsQuota.unshift({
    id: `hq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    utilisateurId,
    nomClient,
    montant,
    date: new Date(),
  })
  return { succes: true }
}

export async function recupererHistoriqueAssignationsQuota(
  utilisateurId: string
): Promise<ReponseApi<EntreeHistoriqueQuota[]>> {
  await simulerDelai(250)
  return {
    succes: true,
    donnees: historiqueAssignationsQuota.filter((e) => e.utilisateurId === utilisateurId),
  }
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

export async function recupererAdministrateurs(
  page: number = 1,
  parPage: number = 10,
  filtres?: FiltresAdministrateurs
): Promise<ReponseApi<Administrateur[]>> {
  await simulerDelai(400)

  let donneesFiltrees = [...administrateursMock]

  if (filtres?.recherche) {
    const terme = filtres.recherche.toLowerCase()
    donneesFiltrees = donneesFiltrees.filter(
      (a) =>
        `${a.prenom} ${a.nom}`.toLowerCase().includes(terme) ||
        a.email.toLowerCase().includes(terme) ||
        a.role.toLowerCase().includes(terme)
    )
  }

  if (filtres?.role && filtres.role !== 'tous') {
    donneesFiltrees = donneesFiltrees.filter((a) => a.role === filtres.role)
  }

  if (filtres?.statutCompte && filtres.statutCompte !== 'tous') {
    if (filtres.statutCompte === 'actif') {
      donneesFiltrees = donneesFiltrees.filter((a) => a.estActif)
    } else {
      donneesFiltrees = donneesFiltrees.filter((a) => !a.estActif)
    }
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

export async function recupererPacks(
  page: number = 1,
  parPage: number = 10,
  recherche: string = ''
): Promise<ReponseApi<Pack[]>> {
  await simulerDelai(400)
  const q = recherche.trim().toLowerCase()
  const filtrees = q
    ? packsMock.filter((p) => {
        const nom = p.nom.toLowerCase()
        const desc = (p.description || '').toLowerCase()
        return (
          nom.includes(q) ||
          desc.includes(q) ||
          p.id.toLowerCase().includes(q) ||
          String(p.quotas).includes(q) ||
          String(p.prix).includes(q) ||
          String(p.dureeValidite).includes(q)
        )
      })
    : [...packsMock]

  const total = filtrees.length
  let pageCourante = page
  const dernierePage = Math.max(1, Math.ceil(total / parPage) || 1)
  if (pageCourante > dernierePage) {
    pageCourante = dernierePage
  }
  if (pageCourante < 1) {
    pageCourante = 1
  }
  const debut = (pageCourante - 1) * parPage
  const fin = debut + parPage

  return {
    succes: true,
    donnees: filtrees.slice(debut, fin),
    pagination: {
      page: pageCourante,
      parPage,
      total,
    },
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

export async function creerPack(pack: Pack): Promise<ReponseApi<Pack>> {
  await simulerDelai(400)
  packsMock.push({ ...pack })
  return { succes: true, donnees: pack }
}

export async function supprimerPack(id: string): Promise<ReponseApi<void>> {
  await simulerDelai(400)
  const index = packsMock.findIndex(p => p.id === id)
  if (index === -1) {
    return { succes: false, erreur: 'Pack non trouvé' }
  }
  packsMock.splice(index, 1)
  return { succes: true }
}

// ==================== CLÉS API ====================

const PLAFOND_REQUETES_UTILISATION_DEMO = 250_000

function masquerClePourTable(cle: string): string {
  const prefixe = cle.slice(0, 22)
  return cle.length > 22 ? `${prefixe}...` : `${cle}...`
}

function regrouperClesParClient(cles: CleApi[]): LigneClientGestionApi[] {
  const parUtilisateur = new Map<string, CleApi[]>()
  for (const c of cles) {
    const liste = parUtilisateur.get(c.utilisateurId) ?? []
    liste.push(c)
    parUtilisateur.set(c.utilisateurId, liste)
  }

  const lignes: LigneClientGestionApi[] = []
  for (const [utilisateurId, listeBrute] of parUtilisateur) {
    const clesTri = [...listeBrute].sort((a, b) => b.dateCreation.getTime() - a.dateCreation.getTime())
    const principale = clesTri[0]!
    const totalRequetes = clesTri.reduce((s, c) => s + c.nombreRequetes, 0)
    const pourcentageUtilisation = Math.min(
      100,
      Math.round((totalRequetes / PLAFOND_REQUETES_UTILISATION_DEMO) * 100)
    )
    const nomComplet = principale.utilisateurNom.trim()
    const nomClient = nomComplet.split(/\s+/)[0] ?? nomComplet

    lignes.push({
      utilisateurId,
      nomClient,
      cleMasquee: masquerClePourTable(principale.cle),
      statutActif: clesTri.some((c) => c.estActive),
      pourcentageUtilisation,
      nombreCles: clesTri.length,
      cles: clesTri,
    })
  }

  return lignes.sort((a, b) => a.nomClient.localeCompare(b.nomClient, 'fr', { sensitivity: 'base' }))
}

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

/** Lignes du tableau admin : un client et ses clés agrégées. */
export async function recupererClientsGestionApi(
  page: number = 1,
  parPage: number = 10,
  recherche?: string
): Promise<ReponseApi<LigneClientGestionApi[]>> {
  await simulerDelai(400)

  let lignes = regrouperClesParClient(clesApiMock)
  const q = recherche?.trim().toLowerCase()
  if (q) {
    lignes = lignes.filter(
      (l) =>
        l.nomClient.toLowerCase().includes(q) ||
        l.cleMasquee.toLowerCase().includes(q) ||
        l.utilisateurId.toLowerCase().includes(q)
    )
  }

  const total = lignes.length
  const debut = (page - 1) * parPage
  const donnees = lignes.slice(debut, debut + parPage)

  return {
    succes: true,
    donnees,
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

export async function mettreAJourPermissionsCleApi(
  id: string,
  permissions: string[]
): Promise<ReponseApi<CleApi>> {
  await simulerDelai(280)
  const cle = clesApiMock.find((c) => c.id === id)
  if (!cle) {
    return { succes: false, erreur: 'Clé API non trouvée' }
  }
  cle.permissions = [...permissions]
  return { succes: true, donnees: { ...cle } }
}

export async function regenererCleApi(id: string): Promise<ReponseApi<CleApi>> {
  await simulerDelai(500)
  const cle = clesApiMock.find((c) => c.id === id)
  if (!cle) {
    return { succes: false, erreur: 'Clé API non trouvée' }
  }
  if (!cle.estActive) {
    return { succes: false, erreur: 'Impossible de régénérer une clé inactive' }
  }
  const suffixe = `${Math.random().toString(36).slice(2, 20)}${Math.random().toString(36).slice(2, 20)}`
  cle.cle = `ocr_${suffixe}`
  cle.dateCreation = new Date()
  return { succes: true, donnees: { ...cle } }
}

// ==================== DEMANDES DE SUPPRESSION ====================

export async function recupererDemandesSuppression(
  page: number = 1,
  parPage: number = 10,
  filtres?: FiltresDemandesSuppression
): Promise<ReponseApi<DemandeSuppressionCompte[]>> {
  await simulerDelai(400)

  let donneesFiltrees = [...demandesSuppressionMock].sort(
    (a, b) => b.datedemande.getTime() - a.datedemande.getTime()
  )

  if (filtres?.recherche?.trim()) {
    const terme = filtres.recherche.trim().toLowerCase()
    donneesFiltrees = donneesFiltrees.filter(
      (d) =>
        d.utilisateurNom.toLowerCase().includes(terme) ||
        d.utilisateurEmail.toLowerCase().includes(terme) ||
        d.raison.toLowerCase().includes(terme) ||
        d.statut.toLowerCase().includes(terme)
    )
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
