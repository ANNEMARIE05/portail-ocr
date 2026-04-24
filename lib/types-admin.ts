// Types pour le dashboard administrateur

export type StatutUtilisateur = 'actif' | 'inactif' | 'suspendu'
export type RoleAdmin = 'super-admin' | 'admin' | 'moderateur'
export type StatutTransaction = 'succes' | 'echec'
export type StatutDemande = 'en-attente' | 'approuve' | 'rejete'

/** Entrée d'historique lorsqu'un administrateur assigne du quota à un client */
export interface EntreeHistoriqueQuota {
  id: string
  utilisateurId: string
  nomClient: string
  montant: number
  date: Date
}

export interface Utilisateur {
  id: string
  nom: string
  prenom: string
  email: string
  entreprise: string
  /** Rôle métier (ex. Utilisateur, Gestionnaire) */
  role: string
  telephone: string
  dateInscription: Date
  derniereConnexion: Date
  statut: StatutUtilisateur
  quotaTotal: number
  quotaUtilise: number
  avatar?: string
}

export interface Administrateur {
  id: string
  nom: string
  prenom: string
  email: string
  role: RoleAdmin
  dateCreation: Date
  derniereActivite: Date
  estActif: boolean
  avatar?: string
}

export interface Transaction {
  id: string
  reference: string
  utilisateurId: string
  utilisateurNom: string
  utilisateurEmail: string
  montant: number
  devise: string
  packNom: string
  dateTransaction: Date
  statut: StatutTransaction
  methodePaiement: string
}

export interface Pack {
  id: string
  nom: string
  description: string
  quotas: number
  prix: number
  devise: string
  dureeValidite: number // en jours
  estActif: boolean
  dateCreation: Date
  nombreAchats: number
}

export interface CleApi {
  id: string
  utilisateurId: string
  utilisateurNom: string
  cle: string
  dateCreation: Date
  dateExpiration: Date
  estActive: boolean
  permissions: string[]
  nombreRequetes: number
  /** Erreurs API (4xx/5xx) sur la période affichée — optionnel pour les mocks */
  nombreErreurs?: number
  derniereUtilisation?: Date
}

/** Une ligne du tableau admin « Gestion d'API » (agrégée par client). */
export interface LigneClientGestionApi {
  utilisateurId: string
  nomClient: string
  cleMasquee: string
  statutActif: boolean
  pourcentageUtilisation: number
  nombreCles: number
  cles: CleApi[]
}

export interface DemandeSuppressionCompte {
  id: string
  utilisateurId: string
  utilisateurNom: string
  utilisateurEmail: string
  datedemande: Date
  raison: string
  statut: StatutDemande
  traitePar?: string
  dateTraitement?: Date
}

export interface TicketSupport {
  id: string
  utilisateurId: string
  utilisateurNom: string
  utilisateurEmail: string
  sujet: string
  dateCreation: Date
  dernierMessage: Date
  statut: 'ouvert' | 'en-cours' | 'resolu' | 'ferme'
  priorite: 'basse' | 'normale' | 'haute' | 'urgente'
  nombreMessages: number
}

export interface MessageSupport {
  id: string
  ticketId: string
  auteurId: string
  auteurNom: string
  estAdmin: boolean
  contenu: string
  dateEnvoi: Date
  piecesJointes?: string[]
}

export interface StatistiquesGlobales {
  totalUtilisateurs: number
  utilisateursActifs: number
  nouveauxUtilisateursJour: number
  variationUtilisateurs: number
  totalDocumentsTraites: number
  documentsJour: number
  variationDocuments: number
  revenus30Jours: number
  variationRevenus: number
  tauxConversion: number
  variationTauxConversion: number
  /** Secondes, temps moyen de traitement OCR (plateforme) */
  tempsMoyenTraitement: number
  /** Pourcentage affiché (ex. 98.7) — même convention que le dashboard utilisateur */
  precisionMoyenne: number
  variationPrecision: number
  /** Tickets support non résolus (ouverts + en cours) */
  ticketsOuverts: number
  variationTicketsOuverts: number
}

export interface DonneesGraphique {
  jour: string
  documents: number
  utilisateurs: number
  revenus: number
}

export interface ActiviteRecente {
  id: string
  type: 'inscription' | 'achat' | 'document' | 'support' | 'api'
  description: string
  utilisateur: string
  date: Date
  details?: string
}

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  titre: string
  message: string
  date: Date
  estLue: boolean
}

// Types pour la pagination et les filtres
export interface ConfigPagination {
  page: number
  parPage: number
  total: number
}

export interface FiltresUtilisateurs {
  recherche?: string
  statut?: StatutUtilisateur | 'tous'
  dateDebut?: Date
  dateFin?: Date
}

export interface FiltresTransactions {
  recherche?: string
  statut?: StatutTransaction | 'tous'
  dateDebut?: Date
  dateFin?: Date
}

export interface FiltresAdministrateurs {
  recherche?: string
  role?: RoleAdmin | 'tous'
  statutCompte?: 'tous' | 'actif' | 'inactif'
}

export interface FiltresDemandesSuppression {
  recherche?: string
}

// Types pour les colonnes de table
export interface ColonneTable<T> {
  id: keyof T | string
  label: string
  accesseur: (item: T) => React.ReactNode
  triable?: boolean
  largeur?: string
  /** Classes Tailwind sur la cellule (`td`), ex. `max-w-[…] min-w-0` pour une troncature. */
  classNameCellule?: string
}

export interface ActionLigne<T> {
  id: string
  label: string
  icone: React.ComponentType<{ className?: string }>
  onClick: (item: T) => void
  variante?: 'default' | 'destructive'
  condition?: (item: T) => boolean
}

// Type pour les réponses API
export interface ReponseApi<T> {
  succes: boolean
  donnees?: T
  erreur?: string
  pagination?: ConfigPagination
}
