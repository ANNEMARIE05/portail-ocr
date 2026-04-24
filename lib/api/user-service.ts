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
import { simulerDelai } from '@/lib/utils/delai'
import {
  statistiquesUser,
  documentsRecentsMock,
  historiqueAppelsMock,
  transactionsUserMock,
  packsDisponiblesMock,
  clesApiUserMock,
  ticketsSupportUserMock,
  notificationsUserMock,
} from '@/lib/mock/donnees-user'

// ==================== STATISTIQUES ====================

export async function recupererStatistiquesUser(): Promise<ReponseApiUser<StatistiquesUser>> {
  await simulerDelai(400)
  return {
    succes: true,
    donnees: statistiquesUser,
  }
}

// ==================== DOCUMENTS ====================

export async function recupererDocumentsRecents(limite: number = 10): Promise<ReponseApiUser<DocumentOCR[]>> {
  await simulerDelai(500)
  return {
    succes: true,
    donnees: documentsRecentsMock.slice(0, limite),
  }
}

export async function recupererDocumentParId(id: string): Promise<ReponseApiUser<DocumentOCR>> {
  await simulerDelai(300)
  const document = documentsRecentsMock.find(d => d.id === id)
  
  if (!document) {
    return { succes: false, erreur: 'Document non trouve' }
  }
  
  return { succes: true, donnees: document }
}

export async function soumettreDocument(fichier: File): Promise<ReponseApiUser<DocumentOCR>> {
  await simulerDelai(2000)
  
  // Simulation d'un nouveau document
  const nouveauDocument: DocumentOCR = {
    id: `doc_${Date.now()}`,
    nomFichier: fichier.name,
    typeFichier: fichier.type.includes('pdf') ? 'pdf' : 'image',
    tailleFichier: fichier.size,
    dateTraitement: new Date(),
    statut: 'termine',
    texteExtrait: 'Texte extrait du document...',
    nombrePages: 1,
    tempsTraitement: 1.5,
    precision: 98.5,
  }
  
  return { succes: true, donnees: nouveauDocument }
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
  await simulerDelai(400)

  const filtree = filtrerHistoriqueAppels(historiqueAppelsMock, options)
  const total = filtree.length
  const debut = (page - 1) * parPage

  return {
    succes: true,
    donnees: filtree.slice(debut, debut + parPage),
    pagination: {
      page,
      parPage,
      total,
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
  await simulerDelai(400)

  const filtree = filtrerTransactions(transactionsUserMock, options)
  const total = filtree.length
  const debut = (page - 1) * parPage

  return {
    succes: true,
    donnees: filtree.slice(debut, debut + parPage),
    pagination: {
      page,
      parPage,
      total,
    },
  }
}

// ==================== PACKS ====================

export async function recupererPacksDisponibles(): Promise<ReponseApiUser<PackDisponible[]>> {
  await simulerDelai(400)
  return {
    succes: true,
    donnees: packsDisponiblesMock,
  }
}

export async function acheterPack(packId: string): Promise<ReponseApiUser<TransactionUser>> {
  await simulerDelai(1500)
  
  const pack = packsDisponiblesMock.find(p => p.id === packId)
  if (!pack) {
    return { succes: false, erreur: 'Pack non trouve' }
  }
  
  const transaction: TransactionUser = {
    id: `trx_${Date.now()}`,
    reference: `PAY-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
    packNom: pack.nom,
    montant: pack.prix,
    devise: pack.devise,
    credits: pack.credits,
    dateTransaction: new Date(),
    statut: 'succes',
    methodePaiement: 'Carte bancaire',
  }
  
  return { succes: true, donnees: transaction }
}

// ==================== CLES API ====================

export async function recupererClesApiUser(): Promise<ReponseApiUser<CleApiUser[]>> {
  await simulerDelai(400)

  return {
    succes: true,
    donnees: [...clesApiUserMock],
  }
}

export async function creerCleApi(nom: string, permissions: string[]): Promise<ReponseApiUser<CleApiUser>> {
  await simulerDelai(500)
  
  const nouvelleCle: CleApiUser = {
    id: `key_${Date.now()}`,
    cle: `ocr_live_sk_${Math.random().toString(36).substring(2, 30)}`,
    nom,
    dateCreation: new Date(),
    dateExpiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    estActive: true,
    permissions,
    nombreRequetes: 0,
  }
  
  return { succes: true, donnees: nouvelleCle }
}

export async function revoquerCleApiUser(id: string): Promise<ReponseApiUser<CleApiUser>> {
  await simulerDelai(300)
  
  const cle = clesApiUserMock.find(c => c.id === id)
  if (!cle) {
    return { succes: false, erreur: 'Cle API non trouvee' }
  }
  
  cle.estActive = false
  return { succes: true, donnees: cle }
}

export async function regenererCleApiUser(id: string): Promise<ReponseApiUser<CleApiUser>> {
  await simulerDelai(500)

  const cle = clesApiUserMock.find((c) => c.id === id)
  if (!cle) {
    return { succes: false, erreur: 'Cle API non trouvee' }
  }
  if (!cle.estActive) {
    return { succes: false, erreur: 'Impossible de regenerer une cle inactive' }
  }

  const estTest = cle.cle.includes('ocr_test')
  const suffixe = `${Math.random().toString(36).slice(2, 18)}${Math.random().toString(36).slice(2, 18)}`
  cle.cle = estTest ? `ocr_test_sk_${suffixe}` : `ocr_live_sk_${suffixe}`

  return { succes: true, donnees: { ...cle } }
}

// ==================== SUPPORT ====================

function filtrerTickets(liste: TicketSupportUser[], options?: OptionsListeTickets): TicketSupportUser[] {
  let out = [...liste]
  const q = options?.recherche?.trim().toLowerCase() ?? ''
  if (q) {
    out = out.filter(
      (t) =>
        t.sujet.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q),
    )
  }
  const st = options?.statut ?? 'tous'
  if (st !== 'tous') out = out.filter((t) => t.statut === st)
  return out
}

export async function recupererTicketsUser(
  page: number = 1,
  parPage: number = 10,
  options?: OptionsListeTickets,
): Promise<ReponseApiUser<TicketSupportUser[]>> {
  await simulerDelai(400)

  const filtree = filtrerTickets(ticketsSupportUserMock, options)
  const total = filtree.length
  const debut = (page - 1) * parPage

  return {
    succes: true,
    donnees: filtree.slice(debut, debut + parPage),
    pagination: {
      page,
      parPage,
      total,
    },
  }
}

export async function creerTicketSupport(
  sujet: string,
  message: string,
  priorite: 'basse' | 'normale' | 'haute'
): Promise<ReponseApiUser<TicketSupportUser>> {
  await simulerDelai(500)

  const ticket: TicketSupportUser = {
    id: `ticket_${Date.now()}`,
    sujet,
    message,
    dateCreation: new Date(),
    statut: 'ouvert',
    priorite,
    nombreReponses: 0,
    statutBrutApi: 'OPEN',
  }

  ticketsSupportUserMock.unshift(ticket)

  return { succes: true, donnees: ticket }
}

// ==================== NOTIFICATIONS ====================

export async function recupererNotificationsUser(): Promise<ReponseApiUser<NotificationUser[]>> {
  await simulerDelai(200)
  return {
    succes: true,
    donnees: notificationsUserMock,
  }
}

export async function marquerNotificationLue(id: string): Promise<ReponseApiUser<NotificationUser>> {
  await simulerDelai(100)
  
  const notification = notificationsUserMock.find(n => n.id === id)
  if (!notification) {
    return { succes: false, erreur: 'Notification non trouvee' }
  }
  
  notification.estLue = true
  return { succes: true, donnees: notification }
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

  await simulerDelai(900)
  return {
    succes: true,
    donnees: {
      idDemande: `suppr_${Date.now()}`,
      dateEnregistrement: new Date(),
    },
  }
}
