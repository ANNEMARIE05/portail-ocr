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

export async function recupererHistoriqueAppels(
  page: number = 1,
  parPage: number = 10
): Promise<ReponseApiUser<HistoriqueAppel[]>> {
  await simulerDelai(400)
  
  const debut = (page - 1) * parPage
  const fin = debut + parPage
  
  return {
    succes: true,
    donnees: historiqueAppelsMock.slice(debut, fin),
    pagination: {
      page,
      parPage,
      total: historiqueAppelsMock.length,
    },
  }
}

// ==================== TRANSACTIONS ====================

export async function recupererTransactionsUser(
  page: number = 1,
  parPage: number = 10
): Promise<ReponseApiUser<TransactionUser[]>> {
  await simulerDelai(400)
  
  const debut = (page - 1) * parPage
  const fin = debut + parPage
  
  return {
    succes: true,
    donnees: transactionsUserMock.slice(debut, fin),
    pagination: {
      page,
      parPage,
      total: transactionsUserMock.length,
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
    statut: 'complete',
    methodePaiement: 'Carte bancaire',
  }
  
  return { succes: true, donnees: transaction }
}

// ==================== CLES API ====================

export async function recupererClesApiUser(): Promise<ReponseApiUser<CleApiUser[]>> {
  await simulerDelai(400)
  return {
    succes: true,
    donnees: clesApiUserMock,
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

// ==================== SUPPORT ====================

export async function recupererTicketsUser(): Promise<ReponseApiUser<TicketSupportUser[]>> {
  await simulerDelai(400)
  return {
    succes: true,
    donnees: ticketsSupportUserMock,
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
  }
  
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
