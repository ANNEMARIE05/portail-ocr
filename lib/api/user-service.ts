import type {
  DocumentOCR,
  HistoriqueAppel,
  TransactionUser,
  PackDisponible,
  CleApiUser,
  StatistiquesUser,
  TicketSupportUser,
  NotificationUser,
  ReponseApiUser,
  OptionsListeHistorique,
  OptionsListeTransactions,
  OptionsListeTickets,
  ResultatDemandeSuppressionCompte,
} from '@/lib/types-user'
import { estBackendFacturationConfigure, estBackendUtilisateurConfigure } from '@/lib/api/env-backend'
import * as userBackend from '@/lib/api/user-backend'
import { ticketsApiCreer } from '@/lib/api/tickets-api'
import {
  extraireParametresRetourPaiement,
  statutDepuisParametreUrl,
  type StatutRecuPaiement,
} from '@/lib/paiement-recu-retour'
function backendUserActif(): boolean {
  return estBackendUtilisateurConfigure()
}

function statistiquesUserVides(): StatistiquesUser {
  return {
    creditsRestants: 0,
    creditsUtilises: 0,
    creditsTotal: 0,
    documentsTraites: 0,
    documentsJour: 0,
    variationDocuments: 0,
    precisionMoyenne: 0,
    tempsMoyenTraitement: 0,
    appelApiMois: 0,
  }
}

// ==================== STATISTIQUES ====================

export async function recupererStatistiquesUser(): Promise<ReponseApiUser<StatistiquesUser>> {
  if (backendUserActif()) {
    const api = await userBackend.tryRecupererStatistiquesUser()
    if (api) return api
  }
  return {
    succes: true,
    donnees: statistiquesUserVides(),
  }
}

// ==================== DOCUMENTS ====================

export async function recupererDocumentsRecents(limite: number = 10): Promise<ReponseApiUser<DocumentOCR[]>> {
  void limite
  return {
    succes: true,
    donnees: [],
  }
}

export async function recupererDocumentParId(id: string): Promise<ReponseApiUser<DocumentOCR>> {
  void id
  return { succes: false, erreur: 'Document non trouve' }
}

export async function soumettreDocument(fichier: File): Promise<ReponseApiUser<DocumentOCR>> {
  if (backendUserActif()) {
    const api = await userBackend.trySoumettreDocument([fichier])
    if (api) return api
  }
  return { succes: false, erreur: 'API utilisateur non configuree ou indisponible.' }
}

// ==================== HISTORIQUE ====================

function filtrerHistoriqueAppels(liste: HistoriqueAppel[], options?: OptionsListeHistorique): HistoriqueAppel[] {
  let out = [...liste]
  const q = options?.recherche?.trim().toLowerCase() ?? ''
  if (q) {
    out = out.filter(
      (h) =>
        h.endpoint.toLowerCase().includes(q) ||
        h.methode.toLowerCase().includes(q) ||
        (h.erreur?.toLowerCase().includes(q) ?? false),
    )
  }
  const fam = options?.statutHttp ?? 'tous'
  if (fam === '2xx') out = out.filter((h) => h.statut >= 200 && h.statut < 300)
  if (fam === '4xx') out = out.filter((h) => h.statut >= 400 && h.statut < 500)
  if (fam === '5xx') out = out.filter((h) => h.statut >= 500)
  return out
}

export async function recupererHistoriqueAppels(
  page: number = 1,
  parPage: number = 10,
  options?: OptionsListeHistorique,
): Promise<ReponseApiUser<HistoriqueAppel[]>> {
  if (backendUserActif()) {
    const api = await userBackend.tryRecupererHistoriqueAppels(page, parPage)
    if (api && api.succes && api.donnees != null) {
      let donnees = api.donnees
      if (options?.recherche?.trim() || (options?.statutHttp && options.statutHttp !== 'tous')) {
        donnees = filtrerHistoriqueAppels(donnees, options)
        const total = donnees.length
        const debut = (page - 1) * parPage
        return {
          succes: true,
          donnees: donnees.slice(debut, debut + parPage),
          pagination: { page, parPage, total },
        }
      }
      return api
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

// ==================== TRANSACTIONS ====================

function filtrerTransactions(liste: TransactionUser[], options?: OptionsListeTransactions): TransactionUser[] {
  let out = [...liste]
  const q = options?.recherche?.trim().toLowerCase() ?? ''
  if (q) {
    out = out.filter(
      (t) =>
        t.reference.toLowerCase().includes(q) ||
        t.packNom.toLowerCase().includes(q) ||
        t.methodePaiement.toLowerCase().includes(q) ||
        String(t.credits).includes(q),
    )
  }
  const st = options?.statut ?? 'tous'
  if (st !== 'tous') out = out.filter((t) => t.statut === st)
  return out
}

export async function recupererTransactionsUser(
  page: number = 1,
  parPage: number = 10,
  options?: OptionsListeTransactions,
): Promise<ReponseApiUser<TransactionUser[]>> {
  if (estBackendFacturationConfigure() && backendUserActif()) {
    const api = await userBackend.tryRecupererTransactionsUser(page, parPage)
    if (api && api.succes && api.donnees != null) {
      let donnees = api.donnees
      if (options?.recherche?.trim() || (options?.statut && options.statut !== 'tous')) {
        donnees = filtrerTransactions(donnees, options)
        const total = donnees.length
        const debut = (page - 1) * parPage
        return {
          succes: true,
          donnees: donnees.slice(debut, debut + parPage),
          pagination: { page, parPage, total },
        }
      }
      return api
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

/** Reçu affiché après retour de la passerelle de paiement (`/user/achats/retour`). */
export interface DonneesRecuPaiement {
  statut: StatutRecuPaiement
  libelleStatut: string
  transaction: TransactionUser | null
  creditsTotal: number
  creditsUtilises: number
  creditsRestants: number
}

function libelleStatutRecu(statut: StatutRecuPaiement): string {
  switch (statut) {
    case 'succes':
      return 'Paiement réussi'
    case 'echec':
      return 'Paiement non finalisé ou refusé'
    case 'en-attente':
      return 'Paiement en cours de traitement'
    default:
      return 'Statut non communiqué par la passerelle'
  }
}

/**
 * Charge quota à jour + transaction éventuelle à partir des query params du retour paiement.
 */
export async function chargerRecuRetourPaiement(
  sp: URLSearchParams,
): Promise<{ succes: true; donnees: DonneesRecuPaiement } | { succes: false; erreur: string }> {
  const params = extraireParametresRetourPaiement(sp)
  const [statsRep, trxRep] = await Promise.all([
    recupererStatistiquesUser(),
    recupererTransactionsUser(1, 500),
  ])

  if (!statsRep.succes || !statsRep.donnees) {
    return { succes: false, erreur: statsRep.erreur ?? 'Impossible de charger votre quota.' }
  }

  const s = statsRep.donnees
  let transaction: TransactionUser | null = null
  if (trxRep.succes && trxRep.donnees?.length) {
    const idLc = params.idTransaction?.toLowerCase()
    const refLc = params.reference?.toLowerCase()
    transaction =
      trxRep.donnees.find((t) => {
        if (idLc && (t.id.toLowerCase() === idLc || t.reference.toLowerCase() === idLc)) return true
        if (refLc && (t.reference.toLowerCase() === refLc || t.id.toLowerCase() === refLc)) return true
        return false
      }) ?? null
  }

  let statut: StatutRecuPaiement = statutDepuisParametreUrl(params.statutBrut)
  if (transaction) {
    statut = transaction.statut === 'succes' ? 'succes' : 'echec'
  }

  return {
    succes: true,
    donnees: {
      statut,
      libelleStatut: libelleStatutRecu(statut),
      transaction,
      creditsTotal: s.creditsTotal,
      creditsUtilises: s.creditsUtilises,
      creditsRestants: s.creditsRestants,
    },
  }
}

// ==================== PACKS ====================

export async function recupererPacksDisponibles(): Promise<ReponseApiUser<PackDisponible[]>> {
  if (estBackendFacturationConfigure()) {
    const api = await userBackend.tryRecupererPacksDisponibles()
    if (api) return api
  }
  return {
    succes: true,
    donnees: [],
  }
}

export type ResultatAcheterPack = ReponseApiUser<TransactionUser> & {
  urlPaiement?: string
}

export async function acheterPack(packId: string): Promise<ResultatAcheterPack> {
  if (estBackendFacturationConfigure() && backendUserActif()) {
    const api = await userBackend.tryAcheterPack(packId)
    if (api && !api.succes) return { succes: false, erreur: api.erreur }
    if (api && api.succes && api.donnees) {
      return { succes: true, donnees: api.donnees, urlPaiement: api.urlPaiement }
    }
  }
  return { succes: false, erreur: 'API facturation ou utilisateur non configuree.' }
}

// ==================== CLES API ====================

export async function recupererClesApiUser(): Promise<ReponseApiUser<CleApiUser[]>> {
  if (backendUserActif()) {
    const api = await userBackend.tryRecupererClesApiUser()
    if (api) return api
  }
  return {
    succes: true,
    donnees: [],
  }
}

export async function creerCleApi(nom: string, permissions: string[]): Promise<ReponseApiUser<CleApiUser>> {
  void nom
  void permissions
  return { succes: false, erreur: 'Creation de cle non disponible sans API utilisateur.' }
}

export async function revoquerCleApiUser(id: string): Promise<ReponseApiUser<CleApiUser>> {
  void id
  return { succes: false, erreur: 'Revocation de cle non disponible sans API utilisateur.' }
}

export async function regenererCleApiUser(id: string): Promise<ReponseApiUser<CleApiUser>> {
  if (backendUserActif()) {
    const api = await userBackend.tryRegenererCleApiUser(id)
    if (api) return api
  }
  return { succes: false, erreur: 'Regeneration de cle non disponible sans API utilisateur.' }
}

// ==================== SUPPORT ====================

export async function recupererTicketsUser(
  page: number = 1,
  parPage: number = 10,
  options?: OptionsListeTickets,
): Promise<ReponseApiUser<TicketSupportUser[]>> {
  void options
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

export async function creerTicketSupport(
  sujet: string,
  message: string,
  priorite: 'basse' | 'normale' | 'haute',
): Promise<ReponseApiUser<TicketSupportUser>> {
  void priorite
  if (!backendUserActif()) {
    return {
      succes: false,
      erreur: "API tickets non configuree (URL d'API et prefixe service utilisateur).",
    }
  }
  const r = await ticketsApiCreer(sujet, message)
  if (!r.ok || !r.ticket) {
    return { succes: false, erreur: r.erreur ?? 'Creation du ticket impossible.' }
  }
  return { succes: true, donnees: r.ticket }
}

// ==================== NOTIFICATIONS ====================

export async function recupererNotificationsUser(): Promise<ReponseApiUser<NotificationUser[]>> {
  return {
    succes: true,
    donnees: [],
  }
}

export async function marquerNotificationLue(id: string): Promise<ReponseApiUser<NotificationUser>> {
  void id
  return { succes: false, erreur: 'Notification non trouvee' }
}

// ==================== COMPTE ====================

/** Longueur minimale du motif pour une demande de suppression de compte. */
export const LONGUEUR_MIN_MOTIF_SUPPRESSION_COMPTE = 10

/** Enregistre une demande de suppression de compte (a brancher sur l'API reelle). */
export async function demanderSuppressionCompte(
  motif: string,
): Promise<ReponseApiUser<ResultatDemandeSuppressionCompte>> {
  const motifTrim = motif.trim()
  if (motifTrim.length < LONGUEUR_MIN_MOTIF_SUPPRESSION_COMPTE) {
    return {
      succes: false,
      erreur: `Veuillez indiquer un motif d'au moins ${LONGUEUR_MIN_MOTIF_SUPPRESSION_COMPTE} caracteres.`,
    }
  }

  if (backendUserActif()) {
    const api = await userBackend.tryDemanderSuppressionCompte(motifTrim)
    if (api) return api
  }

  return { succes: false, erreur: 'API utilisateur non configuree ou indisponible.' }
}
