import type {
  Utilisateur,
  Administrateur,
  Transaction,
  Pack,
  CleApi,
  LigneClientGestionApi,
  DemandeSuppressionCompte,
  StatistiquesGlobales,
  TicketSupport,
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
  MessageSupport,
} from '@/lib/types-admin'
import * as adminBackend from '@/lib/api/admin-backend'
import {
  estBackendAdminConfigure,
  estBackendFacturationConfigure,
  estBackendUtilisateurConfigure,
} from '@/lib/api/env-backend'

function statistiquesGlobalesVides(): StatistiquesGlobales {
  return {
    totalUtilisateurs: 0,
    utilisateursActifs: 0,
    nouveauxUtilisateursJour: 0,
    variationUtilisateurs: 0,
    totalDocumentsTraites: 0,
    documentsJour: 0,
    variationDocuments: 0,
    revenus30Jours: 0,
    variationRevenus: 0,
    tauxConversion: 0,
    variationTauxConversion: 0,
    tempsMoyenTraitement: 0,
    precisionMoyenne: 0,
    variationPrecision: 0,
    ticketsOuverts: 0,
    variationTicketsOuverts: 0,
  }
}

function listeUtilisateursBackendDisponible(): boolean {
  return estBackendUtilisateurConfigure()
}

// ==================== STATISTIQUES ====================

const PAR_PAGE_LISTE_STATS = 500_000

function compterTicketsOuvertsOuEnCours(tickets: TicketSupport[]): number {
  return tickets.filter((t) => t.statut === 'ouvert' || t.statut === 'en-cours').length
}

/** Aligne les comptages utilisateurs / tickets sur les mêmes sources que les pages admin. */
async function enrichirStatistiquesAvecListes(stats: StatistiquesGlobales): Promise<void> {
  const repUsers = await recupererUtilisateurs(1, PAR_PAGE_LISTE_STATS)
  if (repUsers.succes && repUsers.pagination) {
    stats.totalUtilisateurs = repUsers.pagination.total
    const liste = repUsers.donnees ?? []
    stats.utilisateursActifs = liste.filter((u) => u.statut === 'actif').length
  }

  const repTickets = await recupererTicketsSupport()
  if (repTickets.succes && repTickets.donnees) {
    stats.ticketsOuverts = compterTicketsOuvertsOuEnCours(repTickets.donnees)
  }
}

export async function recupererStatistiques(): Promise<ReponseApi<StatistiquesGlobales>> {
  let donnees: StatistiquesGlobales

  if (estBackendAdminConfigure()) {
    const api = await adminBackend.tryRecupererStatistiques()
    if (api?.donnees) {
      donnees = { ...api.donnees }
    } else {
      donnees = statistiquesGlobalesVides()
    }
  } else {
    donnees = statistiquesGlobalesVides()
  }

  await enrichirStatistiquesAvecListes(donnees)

  return {
    succes: true,
    donnees,
  }
}

export async function recupererDonneesGraphique(periode: '7j' | '30j' = '7j'): Promise<ReponseApi<DonneesGraphique[]>> {
  void periode
  return {
    succes: true,
    donnees: [],
  }
}

export async function recupererActivitesRecentes(limite: number = 8): Promise<ReponseApi<ActiviteRecente[]>> {
  void limite
  return {
    succes: true,
    donnees: [],
  }
}

export async function recupererNotifications(): Promise<ReponseApi<Notification[]>> {
  return {
    succes: true,
    donnees: [],
  }
}

// ==================== UTILISATEURS ====================

export async function recupererUtilisateurs(
  page: number = 1,
  parPage: number = 10,
  filtres?: FiltresUtilisateurs
): Promise<ReponseApi<Utilisateur[]>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryRecupererUtilisateurs(1, 1)
    if (api && api.donnees) {
      let donneesFiltrees = [...api.donnees]
      if (filtres?.recherche) {
        const terme = filtres.recherche.toLowerCase()
        donneesFiltrees = donneesFiltrees.filter(
          (u) =>
            u.nom.toLowerCase().includes(terme) ||
            u.prenom.toLowerCase().includes(terme) ||
            u.email.toLowerCase().includes(terme) ||
            u.entreprise.toLowerCase().includes(terme) ||
            u.role.toLowerCase().includes(terme),
        )
      }
      if (filtres?.statut && filtres.statut !== 'tous') {
        donneesFiltrees = donneesFiltrees.filter((u) => u.statut === filtres.statut)
      }
      const total = donneesFiltrees.length
      const debut = (page - 1) * parPage
      return {
        succes: true,
        donnees: donneesFiltrees.slice(debut, debut + parPage),
        pagination: { page, parPage, total },
      }
    }
  }
  return {
    succes: true,
    donnees: [],
    pagination: {
      page,
      parPage,
      total: 0,
    },
  }
}

export async function recupererUtilisateurParId(id: string): Promise<ReponseApi<Utilisateur>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryRecupererUtilisateurs(1, 500)
    const trouve = api?.donnees?.find((u) => u.id === id)
    if (trouve) return { succes: true, donnees: trouve }
  }
  return { succes: false, erreur: 'Utilisateur non trouvé' }
}

export async function creerUtilisateur(donnees: {
  prenom: string
  nom: string
  email: string
  role: string
  entreprise: string
}): Promise<ReponseApi<Utilisateur>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryCreerUtilisateur(donnees)
    if (api) return api
  }
  return { succes: false, erreur: 'API utilisateurs non configurée ou indisponible.' }
}

export async function modifierUtilisateur(
  id: string,
  donnees: {
    prenom: string
    nom: string
    email: string
    role: string
    entreprise: string
    statut: Utilisateur['statut']
  },
): Promise<ReponseApi<Utilisateur>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryModifierUtilisateur(id, {
      prenom: donnees.prenom,
      nom: donnees.nom,
      email: donnees.email,
      role: donnees.role,
      entreprise: donnees.entreprise,
    })
    if (api?.succes && api.donnees) {
      let u = api.donnees
      if (u.statut !== donnees.statut) {
        u = { ...u, statut: donnees.statut }
      }
      return { succes: true, donnees: u }
    }
    if (api && !api.succes) {
      return { succes: false, erreur: api.erreur }
    }
  }
  return { succes: false, erreur: 'API utilisateurs non configurée ou indisponible.' }
}

export async function supprimerUtilisateur(id: string): Promise<ReponseApi<void>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.trySupprimerUtilisateur(id)
    if (api) {
      if (!api.succes) {
        return { succes: false, erreur: api.erreur }
      }
      return { succes: true }
    }
  }
  return { succes: false, erreur: 'API utilisateurs non configurée ou indisponible.' }
}

/** Historique des assignations réussies en session (affichage local). */
const historiqueAssignationsQuota: EntreeHistoriqueQuota[] = []

export async function assignerQuotaAdministrateur(
  utilisateurId: string,
  montant: number
): Promise<ReponseApi<void>> {
  if (!Number.isFinite(montant) || montant <= 0 || !Number.isInteger(montant)) {
    return { succes: false, erreur: 'Le montant doit être un entier strictement positif.' }
  }
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryAssignerQuotaAdministrateur(utilisateurId, montant)
    if (api) {
      if (!api.succes) return api
      const repUser = await recupererUtilisateurParId(utilisateurId)
      const nomClient =
        repUser.succes && repUser.donnees
          ? `${repUser.donnees.prenom} ${repUser.donnees.nom}`.trim() || repUser.donnees.email
          : utilisateurId
      historiqueAssignationsQuota.unshift({
        id: `hq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        utilisateurId,
        nomClient,
        montant,
        date: new Date(),
      })
      return { succes: true }
    }
  }
  return { succes: false, erreur: 'API utilisateurs non configurée ou indisponible.' }
}

export async function recupererHistoriqueAssignationsQuota(
  utilisateurId: string
): Promise<ReponseApi<EntreeHistoriqueQuota[]>> {
  return {
    succes: true,
    donnees: historiqueAssignationsQuota.filter((e) => e.utilisateurId === utilisateurId),
  }
}

export async function modifierStatutUtilisateur(
  id: string,
  statut: 'actif' | 'inactif' | 'suspendu',
): Promise<ReponseApi<Utilisateur>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryModifierStatutUtilisateur(id, statut)
    if (api?.succes && api.donnees) return { succes: true, donnees: api.donnees }
    if (api && !api.succes) return api
    if (api === null) {
      return { succes: false, erreur: 'Utilisateur non trouvé.' }
    }
  }
  return { succes: false, erreur: 'Modification du statut indisponible sans API utilisateurs.' }
}

// ==================== ADMINISTRATEURS ====================

function appliquerFiltresEtPaginationAdministrateurs(
  donnees: Administrateur[],
  page: number,
  parPage: number,
  filtres?: FiltresAdministrateurs
): { slice: Administrateur[]; total: number } {
  let donneesFiltrees = [...donnees]
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
  return { slice: donneesFiltrees.slice(debut, debut + parPage), total }
}

export async function recupererAdministrateurs(
  page: number = 1,
  parPage: number = 10,
  filtres?: FiltresAdministrateurs
): Promise<ReponseApi<Administrateur[]>> {
  if (estBackendAdminConfigure()) {
    const api = await adminBackend.tryRecupererAdministrateurs()
    if (api?.donnees) {
      const { slice, total } = appliquerFiltresEtPaginationAdministrateurs(api.donnees, page, parPage, filtres)
      return {
        succes: true,
        donnees: slice,
        pagination: { page, parPage, total },
      }
    }
  }
  const { slice, total } = appliquerFiltresEtPaginationAdministrateurs([], page, parPage, filtres)
  return {
    succes: true,
    donnees: slice,
    pagination: { page, parPage, total },
  }
}

export async function creerAdministrateur(donnees: {
  prenom: string
  nom: string
  email: string
  role: Administrateur['role']
}): Promise<ReponseApi<Administrateur>> {
  if (estBackendAdminConfigure()) {
    const res = await adminBackend.tryCreerAdministrateur(donnees)
    if (res) {
      return res
    }
  }
  return { succes: false, erreur: 'API administration non configurée ou indisponible.' }
}

export async function modifierAdministrateur(
  id: string,
  donnees: { prenom: string; nom: string; email: string; role: Administrateur['role']; estActif: boolean }
): Promise<ReponseApi<Administrateur>> {
  if (estBackendAdminConfigure()) {
    const res = await adminBackend.tryModifierAdministrateur(id, donnees)
    if (res) {
      return res
    }
  }
  return { succes: false, erreur: 'API administration non configurée ou indisponible.' }
}

export async function supprimerAdministrateur(id: string): Promise<ReponseApi<void>> {
  if (estBackendAdminConfigure()) {
    const res = await adminBackend.trySupprimerAdministrateur(id)
    if (res) {
      if (!res.succes) {
        return { succes: false, erreur: res.erreur }
      }
      return { succes: true }
    }
  }
  return { succes: false, erreur: 'API administration non configurée ou indisponible.' }
}

export async function recupererAdministrateurParId(id: string): Promise<ReponseApi<Administrateur>> {
  if (estBackendAdminConfigure()) {
    const res = await adminBackend.tryRecupererAdministrateurParId(id)
    if (res?.donnees) {
      return { succes: true, donnees: res.donnees }
    }
  }
  return { succes: false, erreur: 'Administrateur non trouvé' }
}

// ==================== TRANSACTIONS ====================

export async function recupererTransactions(
  page: number = 1,
  parPage: number = 10,
  filtres?: FiltresTransactions
): Promise<ReponseApi<Transaction[]>> {
  if (estBackendFacturationConfigure()) {
    const api = await adminBackend.tryRecupererTransactions(1, 10_000)
    if (api && api.donnees) {
      let donneesFiltrees = [...api.donnees]
      if (filtres?.recherche) {
        const terme = filtres.recherche.toLowerCase()
        donneesFiltrees = donneesFiltrees.filter(
          (t) =>
            t.reference.toLowerCase().includes(terme) ||
            t.utilisateurNom.toLowerCase().includes(terme) ||
            t.utilisateurEmail.toLowerCase().includes(terme),
        )
      }
      if (filtres?.statut && filtres.statut !== 'tous') {
        donneesFiltrees = donneesFiltrees.filter((t) => t.statut === filtres.statut)
      }
      const total = donneesFiltrees.length
      const debut = (page - 1) * parPage
      return {
        succes: true,
        donnees: donneesFiltrees.slice(debut, debut + parPage),
        pagination: { page, parPage, total },
      }
    }
  }
  return {
    succes: true,
    donnees: [],
    pagination: {
      page,
      parPage,
      total: 0,
    },
  }
}

// ==================== PACKS ====================

export async function recupererPacks(
  page: number = 1,
  parPage: number = 10,
  recherche: string = ''
): Promise<ReponseApi<Pack[]>> {
  if (estBackendFacturationConfigure()) {
    const api = await adminBackend.tryRecupererPacks(page, parPage, recherche)
    if (api) return api
  }
  return {
    succes: true,
    donnees: [],
    pagination: {
      page: 1,
      parPage,
      total: 0,
    },
  }
}

export async function modifierPack(id: string, donnees: Partial<Pack>): Promise<ReponseApi<Pack>> {
  if (estBackendFacturationConfigure()) {
    const api = await adminBackend.tryModifierPack(id, donnees)
    if (api) return api
  }
  return { succes: false, erreur: 'API facturation non configurée ou indisponible.' }
}

export async function creerPack(pack: Pack): Promise<ReponseApi<Pack>> {
  if (estBackendFacturationConfigure()) {
    const api = await adminBackend.tryCreerPack(pack)
    if (api) return api
  }
  return { succes: false, erreur: 'API facturation non configurée ou indisponible.' }
}

export async function supprimerPack(id: string): Promise<ReponseApi<void>> {
  if (estBackendFacturationConfigure()) {
    const api = await adminBackend.trySupprimerPack(id)
    if (api) return api
  }
  return { succes: false, erreur: 'API facturation non configurée ou indisponible.' }
}

// ==================== CLÉS API ====================

async function listerToutesClesApiDepuisBackend(): Promise<CleApi[]> {
  const api = await adminBackend.tryRecupererClientsGestionApi(1, 500_000)
  if (!api?.donnees?.length) return []
  const out: CleApi[] = []
  for (const ligne of api.donnees) {
    for (const c of ligne.cles) {
      out.push(c)
    }
  }
  return out
}

export async function recupererClesApi(
  page: number = 1,
  parPage: number = 10
): Promise<ReponseApi<CleApi[]>> {
  if (listeUtilisateursBackendDisponible()) {
    const toutes = await listerToutesClesApiDepuisBackend()
    const total = toutes.length
    const debut = (page - 1) * parPage
    return {
      succes: true,
      donnees: toutes.slice(debut, debut + parPage),
      pagination: {
        page,
        parPage,
        total,
      },
    }
  }
  return {
    succes: true,
    donnees: [],
    pagination: {
      page,
      parPage,
      total: 0,
    },
  }
}

/** Lignes du tableau admin : un client et ses clés agrégées. */
export async function recupererClientsGestionApi(
  page: number = 1,
  parPage: number = 10,
  recherche?: string
): Promise<ReponseApi<LigneClientGestionApi[]>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryRecupererClientsGestionApi(page, parPage, recherche)
    if (api) return api
  }
  return {
    succes: true,
    donnees: [],
    pagination: {
      page,
      parPage,
      total: 0,
    },
  }
}

export async function revoquerCleApi(id: string): Promise<ReponseApi<CleApi>> {
  void id
  return { succes: false, erreur: 'Révocation de clé non exposée par l’API actuelle.' }
}

export async function mettreAJourPermissionsCleApi(
  id: string,
  permissions: string[]
): Promise<ReponseApi<CleApi>> {
  if (estBackendAdminConfigure() && listeUtilisateursBackendDisponible()) {
    const ocr = await adminBackend.tryResoudreOcrUserId(id)
    if (ocr != null) {
      const lecture = permissions.includes('lecture')
      const soumission = permissions.includes('soumission')
      const api = await adminBackend.tryMettreAJourPermissionsCleApi(id, ocr, lecture, soumission)
      if (api && api.succes && api.donnees) return api
    }
  }
  return { succes: false, erreur: 'Mise à jour des permissions indisponible sans API.' }
}

export async function regenererCleApi(id: string): Promise<ReponseApi<CleApi>> {
  if (estBackendAdminConfigure() && listeUtilisateursBackendDisponible()) {
    const ocr = await adminBackend.tryResoudreOcrUserId(id)
    if (ocr != null) {
      const api = await adminBackend.tryRegenererCleApi(id, ocr)
      if (api && api.succes && api.donnees) return api
    }
  }
  return { succes: false, erreur: 'Régénération de clé indisponible sans API.' }
}

// ==================== DEMANDES DE SUPPRESSION ====================

export async function recupererDemandesSuppression(
  page: number = 1,
  parPage: number = 10,
  filtres?: FiltresDemandesSuppression
): Promise<ReponseApi<DemandeSuppressionCompte[]>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryRecupererDemandesSuppression(page, parPage)
    if (api && api.donnees) {
      let donneesFiltrees = [...api.donnees]
      if (filtres?.recherche?.trim()) {
        const terme = filtres.recherche.trim().toLowerCase()
        donneesFiltrees = donneesFiltrees.filter(
          (d) =>
            d.utilisateurNom.toLowerCase().includes(terme) ||
            d.utilisateurEmail.toLowerCase().includes(terme) ||
            d.raison.toLowerCase().includes(terme) ||
            d.statut.toLowerCase().includes(terme),
        )
      }
      const total = donneesFiltrees.length
      const debut = (page - 1) * parPage
      return {
        succes: true,
        donnees: donneesFiltrees.slice(debut, debut + parPage),
        pagination: { page, parPage, total },
      }
    }
  }
  return {
    succes: true,
    donnees: [],
    pagination: {
      page,
      parPage,
      total: 0,
    },
  }
}

export async function traiterDemandeSuppression(
  id: string,
  decision: 'approuve' | 'rejete',
  adminNom: string
): Promise<ReponseApi<DemandeSuppressionCompte>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryTraiterDemandeSuppression(id, decision)
    if (api?.succes && api.donnees) {
      return {
        succes: true,
        donnees: { ...api.donnees, traitePar: adminNom },
      }
    }
    if (api && !api.succes) {
      return { succes: false, erreur: api.erreur ?? 'Traitement impossible.' }
    }
  }
  return { succes: false, erreur: 'Traitement de la demande indisponible sans API utilisateurs.' }
}

// ==================== SUPPORT ====================

export async function recupererTicketsSupport(): Promise<ReponseApi<TicketSupport[]>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryRecupererTicketsSupport()
    if (api) return api
  }
  return {
    succes: true,
    donnees: [],
  }
}

export async function recupererMessagesTicketSupport(
  ticketId: string,
  utilisateurId: string,
  utilisateurNom?: string,
): Promise<ReponseApi<MessageSupport[]>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryRecupererMessagesTicketSupport(
      ticketId,
      utilisateurId,
      utilisateurNom,
    )
    if (api && api.succes) {
      return { succes: true, donnees: api.donnees ?? [] }
    }
  }
  return {
    succes: true,
    donnees: [],
  }
}

export async function envoyerMessageTicketSupport(
  ticketId: string,
  texte: string,
): Promise<ReponseApi<void>> {
  if (listeUtilisateursBackendDisponible()) {
    const api = await adminBackend.tryEnvoyerMessageTicketSupport(ticketId, texte)
    if (api) return api
  }
  return { succes: false, erreur: 'Envoi du message indisponible sans API utilisateurs.' }
}

export async function recupererTicketParId(id: string): Promise<ReponseApi<TicketSupport>> {
  const rep = await recupererTicketsSupport()
  if (!rep.succes || !rep.donnees) {
    return { succes: false, erreur: rep.erreur ?? 'Ticket non trouvé' }
  }
  const ticket = rep.donnees.find((t) => t.id === id)
  if (!ticket) {
    return { succes: false, erreur: 'Ticket non trouvé' }
  }
  return { succes: true, donnees: ticket }
}
