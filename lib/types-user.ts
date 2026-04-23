// Types pour le dashboard utilisateur

export type StatutDocument = 'en-cours' | 'termine' | 'erreur'
export type TypeFichier = 'pdf' | 'image' | 'word' | 'autre'

export interface DocumentOCR {
  id: string
  nomFichier: string
  typeFichier: TypeFichier
  tailleFichier: number // en octets
  dateTraitement: Date
  statut: StatutDocument
  texteExtrait?: string
  nombrePages?: number
  tempsTraitement?: number // en secondes
  precision?: number // pourcentage
}

export interface HistoriqueAppel {
  id: string
  endpoint: string
  methode: 'GET' | 'POST' | 'PUT' | 'DELETE'
  dateAppel: Date
  statut: number
  latence: number // en ms
  creditsUtilises: number
}

export interface TransactionUser {
  id: string
  reference: string
  packNom: string
  montant: number
  devise: string
  credits: number
  dateTransaction: Date
  statut: 'complete' | 'en-attente' | 'echoue' | 'rembourse'
  methodePaiement: string
}

export interface PackDisponible {
  id: string
  nom: string
  description: string
  credits: number
  prix: number
  devise: string
  estPopulaire?: boolean
  economie?: number // pourcentage d'economie
  caracteristiques: string[]
}

export interface CleApiUser {
  id: string
  cle: string
  nom: string
  dateCreation: Date
  dateExpiration: Date
  estActive: boolean
  permissions: string[]
  nombreRequetes: number
  derniereUtilisation?: Date
}

export interface StatistiquesUser {
  creditsRestants: number
  creditsUtilises: number
  creditsTotal: number
  documentsTraites: number
  documentsJour: number
  variationDocuments: number
  precisionMoyenne: number
  tempsMoyenTraitement: number // en secondes
  appelApiMois: number
}

export interface TicketSupportUser {
  id: string
  sujet: string
  message: string
  dateCreation: Date
  statut: 'ouvert' | 'en-cours' | 'resolu' | 'ferme'
  priorite: 'basse' | 'normale' | 'haute'
  nombreReponses: number
  derniereReponse?: Date
}

export interface MessageTicket {
  id: string
  ticketId: string
  auteur: 'utilisateur' | 'support'
  contenu: string
  dateEnvoi: Date
  piecesJointes?: string[]
}

export interface ProfilUtilisateur {
  id: string
  email: string
  nom: string
  prenom: string
  entreprise?: string
  telephone?: string
  avatar?: string
  dateInscription: Date
  mfaActive: boolean
  notificationsEmail: boolean
  notificationsPush: boolean
}

export interface NotificationUser {
  id: string
  type: 'info' | 'succes' | 'attention' | 'erreur'
  titre: string
  message: string
  date: Date
  estLue: boolean
  lien?: string
}

// Types pour les reponses API
export interface ReponseApiUser<T> {
  succes: boolean
  donnees?: T
  erreur?: string
  pagination?: {
    page: number
    parPage: number
    total: number
  }
}
