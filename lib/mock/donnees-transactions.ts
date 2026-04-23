import type { Transaction, Pack, TicketSupport, MessageSupport } from '@/lib/types-admin'
import { utilisateursMock } from './donnees-utilisateurs'

function genererReference(): string {
  const annee = new Date().getFullYear()
  const numero = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `TRX-${annee}-${numero}`
}

function genererDateAleatoire(debut: Date, fin: Date): Date {
  return new Date(debut.getTime() + Math.random() * (fin.getTime() - debut.getTime()))
}

export const packsMock: Pack[] = [
  {
    id: 'pack_001',
    nom: 'Découverte',
    description: 'Idéal pour tester notre service OCR avec un petit volume de documents.',
    quotas: 50,
    prix: 0,
    devise: 'EUR',
    dureeValidite: 30,
    estActif: true,
    dateCreation: new Date('2022-01-01'),
    nombreAchats: 892,
  },
  {
    id: 'pack_002',
    nom: 'Starter',
    description: 'Pour les indépendants et petites structures avec un besoin régulier.',
    quotas: 100,
    prix: 29,
    devise: 'EUR',
    dureeValidite: 30,
    estActif: true,
    dateCreation: new Date('2022-01-01'),
    nombreAchats: 1247,
  },
  {
    id: 'pack_003',
    nom: 'Business',
    description: 'La solution idéale pour les PME avec un volume de documents important.',
    quotas: 500,
    prix: 99,
    devise: 'EUR',
    dureeValidite: 30,
    estActif: true,
    dateCreation: new Date('2022-01-01'),
    nombreAchats: 634,
  },
  {
    id: 'pack_004',
    nom: 'Premium',
    description: 'Pour les entreprises exigeantes avec de gros volumes et un support prioritaire.',
    quotas: 1000,
    prix: 149,
    devise: 'EUR',
    dureeValidite: 30,
    estActif: true,
    dateCreation: new Date('2022-03-15'),
    nombreAchats: 312,
  },
  {
    id: 'pack_005',
    nom: 'Enterprise',
    description: 'Solution sur mesure pour les grandes entreprises avec API dédiée et SLA.',
    quotas: 5000,
    prix: 499,
    devise: 'EUR',
    dureeValidite: 30,
    estActif: true,
    dateCreation: new Date('2022-06-01'),
    nombreAchats: 87,
  },
  {
    id: 'pack_006',
    nom: 'Promo Été',
    description: 'Offre limitée été 2023 - Plus disponible.',
    quotas: 200,
    prix: 49,
    devise: 'EUR',
    dureeValidite: 60,
    estActif: false,
    dateCreation: new Date('2023-06-01'),
    nombreAchats: 156,
  },
]

const methodessPaiement = ['Carte bancaire', 'PayPal', 'Virement', 'Prélèvement']
const statuts: Array<'complete' | 'en-attente' | 'echoue' | 'rembourse'> = ['complete', 'complete', 'complete', 'complete', 'complete', 'en-attente', 'echoue', 'rembourse']

export function genererTransactions(nombre: number): Transaction[] {
  const transactions: Transaction[] = []
  const dateDebut = new Date('2024-01-01')
  const dateFin = new Date()

  for (let i = 0; i < nombre; i++) {
    const utilisateur = utilisateursMock[Math.floor(Math.random() * utilisateursMock.length)]
    const pack = packsMock.filter(p => p.prix > 0)[Math.floor(Math.random() * (packsMock.length - 2))]
    
    transactions.push({
      id: `trx_${(i + 1).toString().padStart(5, '0')}`,
      reference: genererReference(),
      utilisateurId: utilisateur.id,
      utilisateurNom: `${utilisateur.prenom} ${utilisateur.nom}`,
      utilisateurEmail: utilisateur.email,
      montant: pack.prix,
      devise: 'EUR',
      packNom: pack.nom,
      dateTransaction: genererDateAleatoire(dateDebut, dateFin),
      statut: statuts[Math.floor(Math.random() * statuts.length)],
      methodePaiement: methodessPaiement[Math.floor(Math.random() * methodessPaiement.length)],
    })
  }

  return transactions.sort((a, b) => b.dateTransaction.getTime() - a.dateTransaction.getTime())
}

export const transactionsMock = genererTransactions(150)

export const ticketsSupportMock: TicketSupport[] = [
  {
    id: 'tkt_001',
    utilisateurId: 'usr_00012',
    utilisateurNom: 'Thomas Girard',
    utilisateurEmail: 'thomas.girard@example.fr',
    sujet: 'Problème de facturation - Double prélèvement',
    dateCreation: new Date(Date.now() - 3600000 * 2),
    dernierMessage: new Date(Date.now() - 1800000),
    statut: 'ouvert',
    priorite: 'haute',
    nombreMessages: 3,
  },
  {
    id: 'tkt_002',
    utilisateurId: 'usr_00025',
    utilisateurNom: 'Marie Dupont',
    utilisateurEmail: 'marie.dupont@cabinet.fr',
    sujet: 'Erreur OCR sur documents manuscrits',
    dateCreation: new Date(Date.now() - 86400000),
    dernierMessage: new Date(Date.now() - 3600000 * 4),
    statut: 'en-cours',
    priorite: 'normale',
    nombreMessages: 5,
  },
  {
    id: 'tkt_003',
    utilisateurId: 'usr_00038',
    utilisateurNom: 'Pierre Martin',
    utilisateurEmail: 'p.martin@entreprise.com',
    sujet: 'Question sur l\'API REST',
    dateCreation: new Date(Date.now() - 86400000 * 2),
    dernierMessage: new Date(Date.now() - 86400000),
    statut: 'en-cours',
    priorite: 'normale',
    nombreMessages: 8,
  },
  {
    id: 'tkt_004',
    utilisateurId: 'usr_00042',
    utilisateurNom: 'Sophie Bernard',
    utilisateurEmail: 'sophie.b@startup.io',
    sujet: 'Demande de fonctionnalité - Export Excel',
    dateCreation: new Date(Date.now() - 86400000 * 5),
    dernierMessage: new Date(Date.now() - 86400000 * 3),
    statut: 'resolu',
    priorite: 'basse',
    nombreMessages: 4,
  },
  {
    id: 'tkt_005',
    utilisateurId: 'usr_00055',
    utilisateurNom: 'François Leroy',
    utilisateurEmail: 'f.leroy@legal.fr',
    sujet: 'Compte bloqué - Urgent',
    dateCreation: new Date(Date.now() - 7200000),
    dernierMessage: new Date(Date.now() - 3600000),
    statut: 'ouvert',
    priorite: 'urgente',
    nombreMessages: 2,
  },
  {
    id: 'tkt_006',
    utilisateurId: 'usr_00008',
    utilisateurNom: 'Claire Fontaine',
    utilisateurEmail: 'claire@comptable.fr',
    sujet: 'Formation utilisation avancée',
    dateCreation: new Date(Date.now() - 86400000 * 7),
    dernierMessage: new Date(Date.now() - 86400000 * 6),
    statut: 'ferme',
    priorite: 'basse',
    nombreMessages: 6,
  },
]

export const messagesSupportMock: MessageSupport[] = [
  {
    id: 'msg_001',
    ticketId: 'tkt_001',
    auteurId: 'usr_00012',
    auteurNom: 'Thomas Girard',
    estAdmin: false,
    contenu: 'Bonjour, j\'ai été prélevé deux fois pour mon abonnement ce mois-ci. Pouvez-vous vérifier et me rembourser le doublon ? Merci.',
    dateEnvoi: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'msg_002',
    ticketId: 'tkt_001',
    auteurId: 'adm_002',
    auteurNom: 'Marie Lefebvre',
    estAdmin: true,
    contenu: 'Bonjour Thomas, je vérifie immédiatement dans notre système de facturation. Pourriez-vous me confirmer les 4 derniers chiffres de la carte utilisée ?',
    dateEnvoi: new Date(Date.now() - 3600000),
  },
  {
    id: 'msg_003',
    ticketId: 'tkt_001',
    auteurId: 'usr_00012',
    auteurNom: 'Thomas Girard',
    estAdmin: false,
    contenu: 'Oui, ce sont les chiffres 4582.',
    dateEnvoi: new Date(Date.now() - 1800000),
  },
]
