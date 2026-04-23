import type {
  DocumentOCR,
  HistoriqueAppel,
  TransactionUser,
  PackDisponible,
  CleApiUser,
  StatistiquesUser,
  TicketSupportUser,
  NotificationUser,
} from '@/lib/types-user'
import { subDays, subHours, subMinutes } from 'date-fns'

// Statistiques utilisateur
export const statistiquesUser: StatistiquesUser = {
  creditsRestants: 340,
  creditsUtilises: 160,
  creditsTotal: 500,
  documentsTraites: 892,
  documentsJour: 24,
  variationDocuments: 12.5,
  precisionMoyenne: 98.7,
  tempsMoyenTraitement: 1.4,
  appelApiMois: 1247,
}

// Documents recents
export const documentsRecentsMock: DocumentOCR[] = [
  {
    id: 'doc_001',
    nomFichier: 'facture_client_2024.pdf',
    typeFichier: 'pdf',
    tailleFichier: 245000,
    dateTraitement: subMinutes(new Date(), 15),
    statut: 'termine',
    texteExtrait: 'FACTURE N°2024-0892\nClient: Entreprise ABC\nMontant: 1 250,00 €',
    nombrePages: 2,
    tempsTraitement: 1.2,
    precision: 99.1,
  },
  {
    id: 'doc_002',
    nomFichier: 'contrat_partenariat.pdf',
    typeFichier: 'pdf',
    tailleFichier: 1250000,
    dateTraitement: subMinutes(new Date(), 45),
    statut: 'termine',
    texteExtrait: 'CONTRAT DE PARTENARIAT\nEntre les soussignes...',
    nombrePages: 8,
    tempsTraitement: 3.5,
    precision: 98.4,
  },
  {
    id: 'doc_003',
    nomFichier: 'bon_commande_001.png',
    typeFichier: 'image',
    tailleFichier: 520000,
    dateTraitement: subHours(new Date(), 2),
    statut: 'termine',
    texteExtrait: 'BON DE COMMANDE\nReference: BC-2024-0156',
    nombrePages: 1,
    tempsTraitement: 0.8,
    precision: 97.8,
  },
  {
    id: 'doc_004',
    nomFichier: 'rapport_financier_q1.pdf',
    typeFichier: 'pdf',
    tailleFichier: 3200000,
    dateTraitement: subHours(new Date(), 5),
    statut: 'en-cours',
    nombrePages: 24,
  },
  {
    id: 'doc_005',
    nomFichier: 'image_floue.jpg',
    typeFichier: 'image',
    tailleFichier: 180000,
    dateTraitement: subHours(new Date(), 8),
    statut: 'erreur',
    nombrePages: 1,
  },
]

// Historique des appels API
export const historiqueAppelsMock: HistoriqueAppel[] = [
  {
    id: 'api_001',
    endpoint: '/v1/ocr/extract',
    methode: 'POST',
    dateAppel: subMinutes(new Date(), 5),
    statut: 200,
    latence: 1240,
    creditsUtilises: 2,
  },
  {
    id: 'api_002',
    endpoint: '/v1/ocr/extract',
    methode: 'POST',
    dateAppel: subMinutes(new Date(), 12),
    statut: 200,
    latence: 980,
    creditsUtilises: 1,
  },
  {
    id: 'api_003',
    endpoint: '/v1/documents/list',
    methode: 'GET',
    dateAppel: subMinutes(new Date(), 25),
    statut: 200,
    latence: 45,
    creditsUtilises: 0,
  },
  {
    id: 'api_004',
    endpoint: '/v1/ocr/extract',
    methode: 'POST',
    dateAppel: subHours(new Date(), 1),
    statut: 429,
    latence: 12,
    creditsUtilises: 0,
  },
  {
    id: 'api_005',
    endpoint: '/v1/ocr/batch',
    methode: 'POST',
    dateAppel: subHours(new Date(), 3),
    statut: 200,
    latence: 5420,
    creditsUtilises: 8,
  },
]

// Transactions utilisateur
export const transactionsUserMock: TransactionUser[] = [
  {
    id: 'trx_001',
    reference: 'PAY-2024-0892',
    packNom: 'Pack Pro',
    montant: 49.99,
    devise: 'EUR',
    credits: 500,
    dateTransaction: subDays(new Date(), 2),
    statut: 'complete',
    methodePaiement: 'Carte bancaire',
  },
  {
    id: 'trx_002',
    reference: 'PAY-2024-0756',
    packNom: 'Pack Starter',
    montant: 19.99,
    devise: 'EUR',
    credits: 150,
    dateTransaction: subDays(new Date(), 18),
    statut: 'complete',
    methodePaiement: 'PayPal',
  },
  {
    id: 'trx_003',
    reference: 'PAY-2024-0621',
    packNom: 'Pack Pro',
    montant: 49.99,
    devise: 'EUR',
    credits: 500,
    dateTransaction: subDays(new Date(), 45),
    statut: 'complete',
    methodePaiement: 'Carte bancaire',
  },
]

// Packs disponibles
export const packsDisponiblesMock: PackDisponible[] = [
  {
    id: 'pack_001',
    nom: 'Pack Decouverte',
    description: 'Ideal pour tester le service',
    credits: 50,
    prix: 9.99,
    devise: 'EUR',
    caracteristiques: [
      '50 credits',
      'Support par email',
      'API basique',
      'Validite 30 jours',
    ],
  },
  {
    id: 'pack_002',
    nom: 'Pack Starter',
    description: 'Pour les petits volumes',
    credits: 150,
    prix: 19.99,
    devise: 'EUR',
    caracteristiques: [
      '150 credits',
      'Support prioritaire',
      'API complete',
      'Validite 60 jours',
    ],
  },
  {
    id: 'pack_003',
    nom: 'Pack Pro',
    description: 'Le choix des professionnels',
    credits: 500,
    prix: 49.99,
    devise: 'EUR',
    estPopulaire: true,
    economie: 15,
    caracteristiques: [
      '500 credits',
      'Support 24/7',
      'API complete + webhooks',
      'Validite 90 jours',
      'Rapports detailles',
    ],
  },
  {
    id: 'pack_004',
    nom: 'Pack Enterprise',
    description: 'Pour les grandes entreprises',
    credits: 2000,
    prix: 149.99,
    devise: 'EUR',
    economie: 25,
    caracteristiques: [
      '2000 credits',
      'Support dedie',
      'API illimitee',
      'Validite 180 jours',
      'SLA garanti',
      'Facturation personnalisee',
    ],
  },
]

// Cles API utilisateur
export const clesApiUserMock: CleApiUser[] = [
  {
    id: 'key_001',
    cle: 'ocr_live_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    nom: 'Production principale',
    dateCreation: subDays(new Date(), 120),
    dateExpiration: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    estActive: true,
    permissions: ['ocr:read', 'ocr:write', 'documents:read'],
    nombreRequetes: 8924,
    derniereUtilisation: subMinutes(new Date(), 5),
  },
  {
    id: 'key_002',
    cle: 'ocr_test_sk_yyyyyyyyyyyyyyyyyyyyyyyyyyyy',
    nom: 'Environnement de test',
    dateCreation: subDays(new Date(), 45),
    dateExpiration: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000),
    estActive: true,
    permissions: ['ocr:read', 'ocr:write'],
    nombreRequetes: 156,
    derniereUtilisation: subDays(new Date(), 2),
  },
]

// Tickets support
export const ticketsSupportUserMock: TicketSupportUser[] = [
  {
    id: 'ticket_001',
    sujet: 'Erreur lors de l\'extraction d\'un PDF',
    message: 'Bonjour, je rencontre une erreur 500 lors de l\'extraction...',
    dateCreation: subDays(new Date(), 3),
    statut: 'en-cours',
    priorite: 'haute',
    nombreReponses: 2,
    derniereReponse: subHours(new Date(), 6),
  },
  {
    id: 'ticket_002',
    sujet: 'Question sur la facturation',
    message: 'Je souhaiterais savoir comment modifier mon mode de paiement...',
    dateCreation: subDays(new Date(), 10),
    statut: 'resolu',
    priorite: 'normale',
    nombreReponses: 4,
    derniereReponse: subDays(new Date(), 8),
  },
]

// Notifications utilisateur
export const notificationsUserMock: NotificationUser[] = [
  {
    id: 'notif_001',
    type: 'succes',
    titre: 'Extraction terminee',
    message: 'Votre document facture_client_2024.pdf a ete traite avec succes.',
    date: subMinutes(new Date(), 15),
    estLue: false,
    lien: '/user/documents',
  },
  {
    id: 'notif_002',
    type: 'attention',
    titre: 'Credits faibles',
    message: 'Il vous reste 50 credits. Pensez a recharger votre compte.',
    date: subHours(new Date(), 2),
    estLue: false,
    lien: '/user/achats',
  },
  {
    id: 'notif_003',
    type: 'info',
    titre: 'Nouvelle fonctionnalite',
    message: 'Decouvrez notre nouvelle API de traitement par lots.',
    date: subDays(new Date(), 1),
    estLue: true,
  },
  {
    id: 'notif_004',
    type: 'succes',
    titre: 'Paiement confirme',
    message: 'Votre achat du Pack Pro a ete confirme. 500 credits ajoutes.',
    date: subDays(new Date(), 2),
    estLue: true,
    lien: '/user/transactions',
  },
]
