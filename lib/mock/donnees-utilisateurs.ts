import type { Utilisateur, Administrateur, DemandeSuppressionCompte, CleApi, RoleAdmin } from '@/lib/types-admin'

const prenomsHommes = ['Thomas', 'Nicolas', 'Julien', 'Pierre', 'Antoine', 'Maxime', 'Alexandre', 'François', 'Guillaume', 'Sébastien', 'Mathieu', 'David', 'Laurent', 'Philippe', 'Christophe', 'Jean', 'Michel', 'Olivier', 'Frédéric', 'Éric']
const prenomsFemmes = ['Marie', 'Sophie', 'Julie', 'Camille', 'Émilie', 'Céline', 'Nathalie', 'Aurélie', 'Isabelle', 'Caroline', 'Stéphanie', 'Valérie', 'Sandrine', 'Virginie', 'Claire', 'Anne', 'Catherine', 'Sylvie', 'Martine', 'Christine']
const noms = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'André', 'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'François', 'Martinez', 'Legrand', 'Garnier', 'Faure', 'Rousseau', 'Blanc', 'Guérin', 'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin']
const entreprises = ['TechSolutions SAS', 'Cabinet Médical Dr. ', 'Immobilier Plus', 'Assurances Mutuelles', 'Comptabilité Expert', 'Notaire Office', 'Architectes Associés', 'Cabinet Juridique', 'Banque Régionale', 'Pharmacie Centrale', 'Clinique Vétérinaire', 'Auto-École Conduite', 'Agence Voyage Plus', 'Restaurant Le Gourmet', 'Hôtel Grand Palace', 'Garage Mécanique Pro', 'Salon Beauté Élégance', 'Boulangerie Artisanale', 'Librairie Culturelle', 'Fleuriste Pétales']
const rolesUtilisateur = ['Utilisateur', 'Gestionnaire', 'Comptable', 'Collaborateur']

function genererDateAleatoire(debut: Date, fin: Date): Date {
  return new Date(debut.getTime() + Math.random() * (fin.getTime() - debut.getTime()))
}

function genererEmail(prenom: string, nom: string, entreprise: string): string {
  const domaines = ['gmail.com', 'outlook.fr', 'yahoo.fr', 'orange.fr', 'free.fr', 'sfr.fr']
  const prenomNormalise = prenom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const nomNormalise = nom.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  
  if (Math.random() > 0.6) {
    const domaineEntreprise = entreprise.split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '')
    return `${prenomNormalise}.${nomNormalise}@${domaineEntreprise}.fr`
  }
  return `${prenomNormalise}.${nomNormalise}@${domaines[Math.floor(Math.random() * domaines.length)]}`
}

function genererTelephone(): string {
  const prefixes = ['06', '07']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const numero = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')
  return `${prefix}${numero}`
}

export function genererUtilisateurs(nombre: number): Utilisateur[] {
  const utilisateurs: Utilisateur[] = []
  const dateDebutInscription = new Date('2022-01-01')
  const dateFin = new Date()

  for (let i = 0; i < nombre; i++) {
    const estFemme = Math.random() > 0.5
    const prenom = estFemme 
      ? prenomsFemmes[Math.floor(Math.random() * prenomsFemmes.length)]
      : prenomsHommes[Math.floor(Math.random() * prenomsHommes.length)]
    const nom = noms[Math.floor(Math.random() * noms.length)]
    const entreprise = entreprises[Math.floor(Math.random() * entreprises.length)]
    const dateInscription = genererDateAleatoire(dateDebutInscription, dateFin)
    const derniereConnexion = genererDateAleatoire(dateInscription, dateFin)
    
    const statuts: Array<'actif' | 'inactif' | 'suspendu'> = ['actif', 'actif', 'actif', 'actif', 'inactif', 'suspendu']
    const statut = statuts[Math.floor(Math.random() * statuts.length)]
    
    const quotaTotal = [100, 250, 500, 1000, 2500, 5000][Math.floor(Math.random() * 6)]
    const quotaUtilise = Math.floor(Math.random() * quotaTotal)
    const role = rolesUtilisateur[Math.floor(Math.random() * rolesUtilisateur.length)]

    utilisateurs.push({
      id: `usr_${(i + 1).toString().padStart(5, '0')}`,
      nom,
      prenom,
      email: genererEmail(prenom, nom, entreprise),
      entreprise,
      role,
      telephone: genererTelephone(),
      dateInscription,
      derniereConnexion,
      statut,
      quotaTotal,
      quotaUtilise,
    })
  }

  return utilisateurs.sort((a, b) => b.dateInscription.getTime() - a.dateInscription.getTime())
}

export const utilisateursMock = genererUtilisateurs(67)

const administrateursMockBase: Administrateur[] = [
  {
    id: 'adm_001',
    nom: 'Durand',
    prenom: 'Jean-Pierre',
    email: 'jp.durand@ocrportal.fr',
    role: 'super-admin',
    dateCreation: new Date('2021-03-15'),
    derniereActivite: new Date(),
    estActif: true,
  },
  {
    id: 'adm_002',
    nom: 'Lefebvre',
    prenom: 'Marie',
    email: 'm.lefebvre@ocrportal.fr',
    role: 'admin',
    dateCreation: new Date('2022-06-20'),
    derniereActivite: new Date(Date.now() - 3600000),
    estActif: true,
  },
  {
    id: 'adm_003',
    nom: 'Martin',
    prenom: 'Sophie',
    email: 's.martin@ocrportal.fr',
    role: 'admin',
    dateCreation: new Date('2023-01-10'),
    derniereActivite: new Date(Date.now() - 86400000),
    estActif: true,
  },
  {
    id: 'adm_004',
    nom: 'Bernard',
    prenom: 'Lucas',
    email: 'l.bernard@ocrportal.fr',
    role: 'moderateur',
    dateCreation: new Date('2023-08-05'),
    derniereActivite: new Date(Date.now() - 172800000),
    estActif: true,
  },
  {
    id: 'adm_005',
    nom: 'Petit',
    prenom: 'Claire',
    email: 'c.petit@ocrportal.fr',
    role: 'moderateur',
    dateCreation: new Date('2024-02-12'),
    derniereActivite: new Date(Date.now() - 604800000),
    estActif: false,
  },
]

function genererAdministrateursMockSupplementaires(): Administrateur[] {
  const prenoms = [...prenomsHommes, ...prenomsFemmes]
  const roles: RoleAdmin[] = ['admin', 'moderateur']
  return Array.from({ length: 16 }).map((_, idx) => {
    const i = idx + 6
    const prenom = prenoms[idx % prenoms.length]
    const nom = noms[(idx + 4) % noms.length]
    const role = roles[idx % 2]
    return {
      id: `adm_${String(i).padStart(3, '0')}`,
      prenom,
      nom,
      email: `equipe.${i}@ocrportal.fr`,
      role,
      dateCreation: new Date(2024, idx % 12, (idx % 27) + 1),
      derniereActivite: new Date(Date.now() - idx * 7200000),
      estActif: idx % 6 !== 0,
    }
  })
}

export const administrateursMock: Administrateur[] = [
  ...administrateursMockBase,
  ...genererAdministrateursMockSupplementaires(),
]

export const demandesSuppressionMock: DemandeSuppressionCompte[] = [
  {
    id: 'dem_001',
    utilisateurId: 'usr_00045',
    utilisateurNom: 'Thomas Martin',
    utilisateurEmail: 'thomas.martin@example.fr',
    datedemande: new Date(Date.now() - 86400000 * 2),
    raison: 'Je n\'utilise plus le service depuis plusieurs mois.',
    statut: 'en-attente',
  },
  {
    id: 'dem_002',
    utilisateurId: 'usr_00032',
    utilisateurNom: 'Sophie Dubois',
    utilisateurEmail: 'sophie.dubois@techcorp.fr',
    datedemande: new Date(Date.now() - 86400000 * 5),
    raison: 'Changement d\'entreprise, je n\'ai plus besoin de ce compte.',
    statut: 'en-attente',
  },
  {
    id: 'dem_003',
    utilisateurId: 'usr_00018',
    utilisateurNom: 'Pierre Moreau',
    utilisateurEmail: 'p.moreau@cabinet-legal.fr',
    datedemande: new Date(Date.now() - 86400000 * 10),
    raison: 'Consolidation des comptes professionnels.',
    statut: 'approuve',
    traitePar: 'Marie Lefebvre',
    dateTraitement: new Date(Date.now() - 86400000 * 8),
  },
  {
    id: 'dem_004',
    utilisateurId: 'usr_00056',
    utilisateurNom: 'Émilie Laurent',
    utilisateurEmail: 'e.laurent@startup.io',
    datedemande: new Date(Date.now() - 86400000 * 15),
    raison: 'Service trop cher pour mon usage.',
    statut: 'rejete',
    traitePar: 'Jean-Pierre Durand',
    dateTraitement: new Date(Date.now() - 86400000 * 12),
  },
]

const ensemblesPermissions = [
  ['lecture', 'ecriture', 'soumission'],
  ['lecture', 'ecriture', 'suppression'],
  ['lecture', 'ecriture'],
  ['lecture', 'soumission'],
] as const

export const clesApiMock: CleApi[] = utilisateursMock.slice(0, 25).map((user, index) => ({
  id: `api_${(index + 1).toString().padStart(4, '0')}`,
  utilisateurId: user.id,
  utilisateurNom: `${user.prenom} ${user.nom}`,
  cle: `ocr_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
  dateCreation: genererDateAleatoire(user.dateInscription, new Date()),
  dateExpiration: new Date(Date.now() + 86400000 * (Math.floor(Math.random() * 365) + 30)),
  estActive: Math.random() > 0.15,
  permissions: [...ensemblesPermissions[index % ensemblesPermissions.length]],
  nombreRequetes: Math.floor(Math.random() * 50000),
  nombreErreurs: Math.floor(Math.random() * 120),
  derniereUtilisation: Math.random() > 0.3 ? genererDateAleatoire(new Date(Date.now() - 86400000 * 30), new Date()) : undefined,
}))

/** Démo : client « Yasmine » aligné sur la maquette (0 %, clé hex masquée, etc.) */
if (clesApiMock[0]) {
  const ref = clesApiMock[0]
  ref.utilisateurNom = 'Yasmine Martin'
  ref.cle = 'a787004fed9b42d8da0b1c2e3f4a5b6c7d8e9f0a1b2c3d4e5f67890abcdef'
  ref.dateCreation = new Date('2026-04-23T10:00:00')
  ref.dateExpiration = new Date('2027-04-23T23:59:59')
  ref.estActive = true
  ref.permissions = ['ecriture', 'lecture', 'soumission']
  ref.nombreRequetes = 0
  ref.nombreErreurs = 0
  ref.derniereUtilisation = new Date('2026-04-23T15:49:11')
}
