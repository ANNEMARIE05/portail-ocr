/**
 * Appels REST alignés sur l’ancien portail pour l’administration.
 */

import {
  estBackendAdminConfigure,
  estBackendFacturationConfigure,
  estBackendUtilisateurConfigure,
  urlService,
} from '@/lib/api/env-backend'
import { fetchAvecAuth } from '@/lib/api/fetch-auth'
import {
  lireAdminIdStockage,
  lireDonneesProfilAdminSession,
  normaliserRoleAdmin,
} from '@/lib/api/session-client'
import { separerPrenomNom } from '@/lib/utils/formatage'
import {
  dateEnvoiDepuisLigneMessageApi,
  estMessageAuteurUtilisateurApi,
  expediteurIdDepuisPayloadWs,
  lignesMessagesDepuisReponseApi,
  texteMessageDepuisPayloadWs,
} from '@/lib/api/tickets-api'
import type {
  Administrateur,
  CleApi,
  DemandeSuppressionCompte,
  LigneClientGestionApi,
  MessageSupport,
  Pack,
  ReponseApi,
  RoleAdmin,
  StatistiquesGlobales,
  TicketSupport,
  Transaction,
  Utilisateur,
} from '@/lib/types-admin'
import type { StatutDemande, StatutTransaction } from '@/lib/types-admin'

function extraireListe(corps: unknown): unknown[] {
  if (Array.isArray(corps)) return corps
  if (!corps || typeof corps !== 'object') return []
  const o = corps as Record<string, unknown>
  if (Array.isArray(o.data)) return o.data
  if (Array.isArray(o.tickets)) return o.tickets
  if (Array.isArray(o.users)) return o.users
  if (Array.isArray(o.content)) return o.content
  return []
}

function mapStatutDemande(s: string): StatutDemande {
  const u = s.toUpperCase()
  if (u === 'ACCEPTED' || u === 'APPROUVE' || u === 'APPROVED') return 'approuve'
  if (u === 'REJECTED' || u === 'REJETE') return 'rejete'
  return 'en-attente'
}

function mapTransactionAdmin(t: Record<string, unknown>): Transaction {
  const u = t.user as Record<string, unknown> | undefined
  const ui = u?.user_info as Record<string, unknown> | undefined
  const nomUser =
    u && typeof u === 'object'
      ? `${String(ui?.firstname ?? '')} ${String(ui?.lastname ?? u.username ?? '')}`.trim() ||
        String(u.username ?? '')
      : ''
  const emailUser = u && typeof u === 'object' ? String(u.email ?? '') : ''
  return {
    id: String(t.id ?? ''),
    reference: String(t.transaction_reference ?? t.id ?? ''),
    utilisateurId: String(t.user_id ?? u?.id ?? ''),
    utilisateurNom: nomUser || '—',
    utilisateurEmail: emailUser,
    montant: Number(t.amount ?? 0),
    devise: String(t.currency ?? 'XOF'),
    packNom: String(t.pack_id ?? '—'),
    dateTransaction: t.created_at ? new Date(String(t.created_at)) : new Date(),
    statut: mapStatutTransaction(String(t.status ?? '')),
    methodePaiement: String(t.payment_method ?? ''),
  }
}

function mapStatutTransaction(brut: string): StatutTransaction {
  const s = brut.toLowerCase()
  if (s.includes('success') || s.includes('paid') || s.includes('complete')) return 'succes'
  return 'echec'
}

function mapStatutTicketSupport(brut: unknown): TicketSupport['statut'] {
  const s = String(brut ?? '')
    .toLowerCase()
    .replace(/_/g, '-')
  if (
    s.includes('open') ||
    s.includes('pending') ||
    s.includes('nouveau') ||
    s === 'ouvert'
  ) {
    return 'ouvert'
  }
  if (
    s.includes('progress') ||
    s.includes('in_progress') ||
    s.includes('encours') ||
    s.includes('en-cours') ||
    s === 'assigned'
  ) {
    return 'en-cours'
  }
  if (s.includes('resolv') || s.includes('closed-success')) return 'resolu'
  if (s.includes('clos') || s.includes('ferm') || s.includes('cancel')) return 'ferme'
  return 'ouvert'
}

function mapUtilisateur(r: Record<string, unknown>): Utilisateur {
  const ui = r.user_info as Record<string, unknown> | undefined
  const quota = r.quota as Record<string, unknown> | undefined
  const prenom = String(ui?.firstname ?? '')
  const nom = String(ui?.lastname ?? r.username ?? '')
  return {
    id: String(r.id ?? ''),
    nom: nom || String(r.username ?? ''),
    prenom: prenom,
    email: String(r.email ?? ''),
    entreprise: String(r.username ?? ''),
    role: String(r.role ?? 'user'),
    telephone: String(r.phone_number ?? ''),
    dateInscription: r.created_at ? new Date(String(r.created_at)) : new Date(),
    derniereConnexion: r.updated_at ? new Date(String(r.updated_at)) : new Date(),
    statut: r.is_active === true || r.is_active === undefined ? 'actif' : 'inactif',
    quotaTotal: Number(quota?.total ?? 0),
    quotaUtilise: Number(quota?.used ?? 0),
  }
}

function messageErreurReponseApi(corps: unknown, statut: number): string {
  if (corps && typeof corps === 'object') {
    const m = (corps as Record<string, unknown>).message
    if (typeof m === 'string' && m.trim()) {
      return m
    }
  }
  return `Erreur ${statut}`
}

function extraireObjetRacineReponse(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== 'object') {
    return null
  }
  const o = json as Record<string, unknown>
  const d = o.data
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    return d as Record<string, unknown>
  }
  return o
}

function mapAdministrateurDepuisApi(r: Record<string, unknown>): Administrateur {
  const ui = r.user_info as Record<string, unknown> | undefined
  let prenom = String(ui?.firstname ?? r.first_name ?? r.firstname ?? r.firstName ?? r.prenom ?? '')
  let nom = String(ui?.lastname ?? r.last_name ?? r.lastname ?? r.lastName ?? r.nom ?? '')
  if (!prenom && !nom) {
    const nomComplet = String(
      ui?.full_name ?? ui?.fullName ?? r.full_name ?? r.name ?? r.display_name ?? r.username ?? '',
    ).trim()
    if (nomComplet) {
      const parts = separerPrenomNom(nomComplet)
      prenom = parts.prenom
      nom = parts.nom
    }
  }
  const email = String(r.email ?? r.mail ?? (typeof r.username === 'string' && r.username.includes('@') ? r.username : '') ?? '')
  const role = normaliserRoleAdmin(String(r.role ?? ''))
  const created = r.created_at ? new Date(String(r.created_at)) : new Date(0)
  const updated = r.updated_at
    ? new Date(String(r.updated_at))
    : r.last_login_at
      ? new Date(String(r.last_login_at))
      : r.last_active_at
        ? new Date(String(r.last_active_at))
        : created
  const actif =
    r.suspended === true
      ? false
      : r.is_active === false || r.active === false || r.enabled === false
        ? false
        : true
  return {
    id: String(r.id ?? r.user_id ?? ''),
    prenom: prenom || '—',
    nom: nom || (email ? email.split('@')[0] : '—'),
    email: email || String(r.username ?? ''),
    role,
    dateCreation: created.getTime() ? created : new Date(),
    derniereActivite: updated,
    estActif: actif,
  }
}

function roleVersApiChaine(role: RoleAdmin): string {
  if (role === 'super-admin') {
    return 'super_admin'
  }
  if (role === 'moderateur') {
    return 'moderator'
  }
  return 'admin'
}

export async function tryRecupererAdministrateurs(): Promise<ReponseApi<Administrateur[]> | null> {
  if (!estBackendAdminConfigure()) {
    return null
  }
  try {
    const reponse = await fetchAvecAuth(urlService('admin', '/users'))
    if (!reponse.ok) {
      return null
    }
    const json = (await reponse.json()) as unknown
    const brut = extraireListe(json)
    const donnees = (brut as Record<string, unknown>[])
      .map(mapAdministrateurDepuisApi)
      .filter((a) => a.id)
    return { succes: true, donnees, pagination: { page: 1, parPage: donnees.length, total: donnees.length } }
  } catch {
    return null
  }
}

export async function tryRecupererAdministrateurParId(id: string): Promise<ReponseApi<Administrateur> | null> {
  if (!estBackendAdminConfigure()) {
    return null
  }
  const liste = await tryRecupererAdministrateurs()
  if (liste?.donnees) {
    const trouve = liste.donnees.find((a) => a.id === id)
    if (trouve) {
      return { succes: true, donnees: trouve }
    }
  }
  try {
    const reponse = await fetchAvecAuth(urlService('admin', `/users/${encodeURIComponent(id)}`))
    if (!reponse.ok) {
      return null
    }
    const json = (await reponse.json()) as unknown
    const o = extraireObjetRacineReponse(json)
    if (o) {
      return { succes: true, donnees: mapAdministrateurDepuisApi(o) }
    }
  } catch {
    return null
  }
  return null
}

/** Corps aligné sur l’ancien portail Vite (`pagesAdmin/Admin.tsx`) : `lastname`, pas `last_name`. */
function nomCompletVersLastnameLegacy(prenom: string, nom: string): string {
  return [prenom, nom].map((s) => String(s).trim()).filter(Boolean).join(' ').trim()
}

export async function tryCreerAdministrateur(params: {
  prenom: string
  nom: string
  email: string
  role: RoleAdmin
}): Promise<ReponseApi<Administrateur> | null> {
  if (!estBackendAdminConfigure()) {
    return null
  }
  try {
    const lastname = nomCompletVersLastnameLegacy(params.prenom, params.nom)
    const reponse = await fetchAvecAuth(urlService('admin', '/users'), {
      method: 'POST',
      body: JSON.stringify({
        email: params.email,
        lastname: lastname || params.nom || params.prenom,
        role: roleVersApiChaine(params.role),
      }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { succes: false, erreur: messageErreurReponseApi(corps, reponse.status) }
    }
    const o = extraireObjetRacineReponse(corps) ?? (corps as Record<string, unknown>)
    if (o && typeof o === 'object' && o.id) {
      return { succes: true, donnees: mapAdministrateurDepuisApi(o) }
    }
    const recharge = await tryRecupererAdministrateurs()
    const emailLc = params.email.trim().toLowerCase()
    const parEmail = recharge?.donnees?.find((a) => a.email.trim().toLowerCase() === emailLc)
    if (parEmail) {
      return { succes: true, donnees: parEmail }
    }
    return { succes: false, erreur: 'Création réussie mais impossible de relire l’administrateur créé.' }
  } catch {
    return { succes: false, erreur: 'Erreur réseau.' }
  }
}

export async function tryModifierAdministrateur(
  id: string,
  donnees: { prenom: string; nom: string; email: string; role: RoleAdmin; estActif: boolean },
): Promise<ReponseApi<Administrateur> | null> {
  if (!estBackendAdminConfigure()) {
    return null
  }
  try {
    const lastname = nomCompletVersLastnameLegacy(donnees.prenom, donnees.nom)
    const reponse = await fetchAvecAuth(urlService('admin', `/users/${encodeURIComponent(id)}`), {
      method: 'PUT',
      body: JSON.stringify({
        email: donnees.email,
        lastname: lastname || donnees.nom || donnees.prenom,
        role: roleVersApiChaine(donnees.role),
        is_active: donnees.estActif,
      }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { succes: false, erreur: messageErreurReponseApi(corps, reponse.status) }
    }
    const o = extraireObjetRacineReponse(corps) ?? (corps as Record<string, unknown>)
    if (o && typeof o === 'object' && (o as Record<string, unknown>).id) {
      return { succes: true, donnees: mapAdministrateurDepuisApi(o as Record<string, unknown>) }
    }
    const recharged = await tryRecupererAdministrateurParId(id)
    if (recharged?.succes && recharged.donnees) {
      return recharged
    }
    return { succes: false, erreur: 'Mise à jour enregistrée, impossible de recharger l’enregistrement.' }
  } catch {
    return { succes: false, erreur: 'Erreur réseau.' }
  }
}

export async function trySupprimerAdministrateur(id: string): Promise<ReponseApi<void> | null> {
  if (!estBackendAdminConfigure()) {
    return null
  }
  try {
    const reponse = await fetchAvecAuth(urlService('admin', `/users/${encodeURIComponent(id)}`), {
      method: 'DELETE',
    })
    if (!reponse.ok) {
      const corps = (await reponse.json().catch(() => ({}))) as unknown
      return { succes: false, erreur: messageErreurReponseApi(corps, reponse.status) }
    }
    return { succes: true }
  } catch {
    return { succes: false, erreur: 'Erreur réseau.' }
  }
}

function masquerClePourTable(cle: string): string {
  const prefixe = cle.slice(0, 22)
  return cle.length > 22 ? `${prefixe}...` : `${cle}...`
}

const PLAFOND_DEMO = 250_000

function ligneDepuisUtilisateurApi(u: Record<string, unknown>): LigneClientGestionApi {
  const id = String(u.id ?? '')
  const ui = u.user_info as Record<string, unknown> | undefined
  const nomComplet =
    `${String(ui?.firstname ?? '')} ${String(ui?.lastname ?? '')}`.trim() ||
    String(u.username ?? id)
  const nomClient = nomComplet.split(/\s+/)[0] ?? nomComplet
  const quotaUsed = Number((u.quota as Record<string, unknown> | undefined)?.used ?? 0)
  const cle: CleApi = {
    id: `${id}_key`,
    utilisateurId: id,
    utilisateurNom: nomComplet,
    cle: String(u.api_key ?? ''),
    dateCreation: u.created_at ? new Date(String(u.created_at)) : new Date(),
    dateExpiration: new Date(Date.now() + 365 * 86400000),
    estActive: u.is_active !== false,
    permissions: ['lecture', 'soumission'],
    nombreRequetes: quotaUsed,
  }
  const pourcentage = Math.min(100, Math.round((quotaUsed / PLAFOND_DEMO) * 100))
  return {
    utilisateurId: id,
    nomClient,
    cleMasquee: masquerClePourTable(cle.cle || '—'),
    statutActif: cle.estActive,
    pourcentageUtilisation: pourcentage,
    nombreCles: 1,
    cles: [cle],
  }
}

export async function tryRecupererStatistiques(): Promise<ReponseApi<StatistiquesGlobales> | null> {
  if (!estBackendAdminConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('admin', '/ia-data/stats'))
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    const d = (json.data as Record<string, unknown>) ?? json
    const stats: StatistiquesGlobales = {
      totalUtilisateurs: Number(d.total_users ?? d.totalUtilisateurs ?? 0),
      utilisateursActifs: Number(d.active_users ?? d.utilisateursActifs ?? 0),
      nouveauxUtilisateursJour: Number(d.new_users_today ?? 0),
      variationUtilisateurs: 0,
      totalDocumentsTraites: Number(d.total_documents ?? d.totalDocumentsTraites ?? 0),
      documentsJour: Number(d.documents_today ?? 0),
      variationDocuments: 0,
      revenus30Jours: Number(d.revenue_30d ?? 0),
      variationRevenus: 0,
      tauxConversion: Number(d.conversion_rate ?? 0),
      variationTauxConversion: 0,
      tempsMoyenTraitement: Number(d.avg_processing_time_ms ?? 0) / 1000,
      precisionMoyenne: Number(d.success_rate ?? d.precisionMoyenne ?? 0),
      variationPrecision: 0,
      ticketsOuverts: Number(d.open_tickets ?? 0),
      variationTicketsOuverts: 0,
    }
    return { succes: true, donnees: stats }
  } catch {
    return null
  }
}

export async function tryRecupererUtilisateurs(
  page: number,
  parPage: number,
): Promise<ReponseApi<Utilisateur[]> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('user', '/users'))
    if (!reponse.ok) return null
    const json = (await reponse.json()) as unknown
    const brut = extraireListe(json)
    const tout = (brut as Record<string, unknown>[]).map(mapUtilisateur)
    const total = tout.length
    return {
      succes: true,
      donnees: tout,
      pagination: { page: 1, parPage: total, total },
    }
  } catch {
    return null
  }
}

/** Rôle affiché dans le formulaire admin → valeur attendue par l’API legacy (`Utilisateurs.tsx`). */
function rolePlateformeVersApi(roleUi: string): string {
  const r = String(roleUi).trim()
  const lower = r.toLowerCase()
  if (lower === 'utilisateur' || lower === 'user') return 'user'
  return r
}

/**
 * Création compte client — même contrat que l’ancien portail :
 * `POST …/users` avec `lastname` (nom affiché), `username` (compagnie).
 */
export async function tryCreerUtilisateur(params: {
  prenom: string
  nom: string
  email: string
  role: string
  entreprise: string
}): Promise<ReponseApi<Utilisateur> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const lastname = nomCompletVersLastnameLegacy(params.prenom, params.nom)
  try {
    const reponse = await fetchAvecAuth(urlService('user', '/users'), {
      method: 'POST',
      body: JSON.stringify({
        email: params.email,
        lastname: lastname || params.nom || params.prenom,
        role: rolePlateformeVersApi(params.role),
        username: params.entreprise,
      }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { succes: false, erreur: messageErreurReponseApi(corps, reponse.status) }
    }
    const o = extraireObjetRacineReponse(corps) ?? (corps as Record<string, unknown>)
    if (o && typeof o === 'object' && o.id) {
      return { succes: true, donnees: mapUtilisateur(o as Record<string, unknown>) }
    }
    const recharge = await tryRecupererUtilisateurs(1, 5000)
    const emailLc = params.email.trim().toLowerCase()
    const parEmail = recharge?.donnees?.find((u) => u.email.trim().toLowerCase() === emailLc)
    if (parEmail) return { succes: true, donnees: parEmail }
    return { succes: false, erreur: 'Création réussie mais impossible de relire l’utilisateur créé.' }
  } catch {
    return { succes: false, erreur: 'Erreur réseau.' }
  }
}

/** Mise à jour — aligné sur `PUT …/users/:id` de l’ancien `Utilisateurs.tsx` (`companyName`). */
export async function tryModifierUtilisateur(
  id: string,
  donnees: {
    prenom: string
    nom: string
    email: string
    role: string
    entreprise: string
  },
): Promise<ReponseApi<Utilisateur> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const lastname = nomCompletVersLastnameLegacy(donnees.prenom, donnees.nom)
  try {
    const reponse = await fetchAvecAuth(urlService('user', `/users/${encodeURIComponent(id)}`), {
      method: 'PUT',
      body: JSON.stringify({
        email: donnees.email,
        lastname: lastname || donnees.nom || donnees.prenom,
        role: rolePlateformeVersApi(donnees.role),
        companyName: donnees.entreprise,
      }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { succes: false, erreur: messageErreurReponseApi(corps, reponse.status) }
    }
    const o = extraireObjetRacineReponse(corps) ?? (corps as Record<string, unknown>)
    if (o && typeof o === 'object' && o.id) {
      return { succes: true, donnees: mapUtilisateur(o as Record<string, unknown>) }
    }
    const recharge = await tryRecupererUtilisateurs(1, 5000)
    const trouve = recharge?.donnees?.find((u) => u.id === id)
    if (trouve) return { succes: true, donnees: trouve }
    return { succes: false, erreur: 'Mise à jour enregistrée, impossible de recharger l’utilisateur.' }
  } catch {
    return { succes: false, erreur: 'Erreur réseau.' }
  }
}

export async function tryRecupererClientsGestionApi(
  page: number,
  parPage: number,
  recherche?: string,
): Promise<ReponseApi<LigneClientGestionApi[]> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  let lignes: LigneClientGestionApi[] = []
  try {
    const reponse = await fetchAvecAuth(urlService('user', '/users'))
    if (!reponse.ok) return null
    const json = (await reponse.json()) as unknown
    const liste = extraireListe(json) as Record<string, unknown>[]
    lignes = liste.map((u) => ligneDepuisUtilisateurApi(u))
  } catch {
    return null
  }
  const q = recherche?.trim().toLowerCase()
  if (q) {
    lignes = lignes.filter(
      (l) =>
        l.nomClient.toLowerCase().includes(q) ||
        l.utilisateurId.toLowerCase().includes(q) ||
        l.cleMasquee.toLowerCase().includes(q),
    )
  }
  const total = lignes.length
  const debut = (page - 1) * parPage
  return {
    succes: true,
    donnees: lignes.slice(debut, debut + parPage),
    pagination: { page, parPage, total },
  }
}

export async function tryRegenererCleApi(
  idCle: string,
  ocrUserId: number,
): Promise<ReponseApi<CleApi> | null> {
  if (!estBackendAdminConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(
      urlService('admin', `/ia-data/regenerate_api_key/${encodeURIComponent(String(ocrUserId))}`),
      { method: 'POST' },
    )
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    if (String(json.status) !== 'success') return null
    const baseUserId = idCle.replace(/_key$/, '')
    const rUsers = await fetchAvecAuth(urlService('user', '/users'))
    if (!rUsers.ok) return null
    const arr = extraireListe(await rUsers.json()) as Record<string, unknown>[]
    const u = arr.find((x) => String(x.id) === baseUserId)
    if (!u) return null
    const ligne = ligneDepuisUtilisateurApi(u)
    const cle = ligne.cles[0]
    if (!cle) return null
    return { succes: true, donnees: { ...cle } }
  } catch {
    return null
  }
}

/** Extrait ocr_user_id depuis la liste utilisateurs pour une clé id « …_key ». */
export async function tryResoudreOcrUserId(utilisateurId: string): Promise<number | null> {
  const baseId = utilisateurId.replace(/_key$/, '')
  if (!estBackendUtilisateurConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('user', '/users'))
    if (!reponse.ok) return null
    const arr = extraireListe(await reponse.json()) as Record<string, unknown>[]
    const u = arr.find((x) => String(x.id) === baseId)
    if (!u) return null
    const n = Number(u.ocr_user_id)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}

export async function tryMettreAJourPermissionsCleApi(
  idCle: string,
  ocrUserId: number,
  lecture: boolean,
  soumission: boolean,
): Promise<ReponseApi<CleApi> | null> {
  if (!estBackendAdminConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(
      urlService('admin', `/ia-data/update_permissions/${encodeURIComponent(String(ocrUserId))}`),
      {
        method: 'POST',
        body: JSON.stringify({ read: lecture, submit: soumission }),
      },
    )
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    if (String(json.status) !== 'success') return null
    const baseUserId = idCle.replace(/_key$/, '')
    const rUsers = await fetchAvecAuth(urlService('user', '/users'))
    if (!rUsers.ok) return null
    const arr = extraireListe(await rUsers.json()) as Record<string, unknown>[]
    const u = arr.find((x) => String(x.id) === baseUserId)
    const cle = u ? ligneDepuisUtilisateurApi(u).cles[0] : undefined
    if (!cle) return null
    cle.permissions = [
      ...(lecture ? ['lecture'] : []),
      ...(soumission ? ['soumission'] : []),
    ]
    return { succes: true, donnees: cle }
  } catch {
    return null
  }
}

export async function tryRecupererTransactions(
  page: number,
  parPage: number,
): Promise<ReponseApi<Transaction[]> | null> {
  if (!estBackendFacturationConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('billing', '/transactions'))
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    const arr = Array.isArray(json.data) ? json.data : extraireListe(json)
    const tout = (arr as Record<string, unknown>[]).map(mapTransactionAdmin)
    const total = tout.length
    return {
      succes: true,
      donnees: tout,
      pagination: { page: 1, parPage: total, total },
    }
  } catch {
    return null
  }
}

export async function tryRecupererPacks(
  page: number,
  parPage: number,
  recherche: string,
): Promise<ReponseApi<Pack[]> | null> {
  if (!estBackendFacturationConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('billing', '/packs'))
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    let arr: unknown[] = []
    if (Array.isArray(json)) arr = json
    else if (Array.isArray(json.data)) arr = json.data as unknown[]
    const packs: Pack[] = (arr as Record<string, unknown>[]).map((p) => ({
      id: String(p.id ?? ''),
      nom: String(p.name ?? p.nom ?? ''),
      description: String(p.description ?? ''),
      quotas: Number(p.quota_included ?? p.quota ?? 0),
      prix: Number(p.price ?? p.prix ?? 0),
      devise: 'XOF',
      dureeValidite: Number(p.validity ?? p.validite ?? 30),
      estActif: p.is_active === true || String(p.statut) === 'actif',
      dateCreation: new Date(),
      nombreAchats: 0,
    }))
    const q = recherche.trim().toLowerCase()
    const filtrees = q
      ? packs.filter(
          (p) =>
            p.nom.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q),
        )
      : packs
    const total = filtrees.length
    const debut = (page - 1) * parPage
    return {
      succes: true,
      donnees: filtrees.slice(debut, debut + parPage),
      pagination: { page, parPage, total },
    }
  } catch {
    return null
  }
}

export async function tryModifierPack(id: string, donnees: Partial<Pack>): Promise<ReponseApi<Pack> | null> {
  if (!estBackendFacturationConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('billing', `/packs/${encodeURIComponent(id)}`), {
      method: 'PUT',
      body: JSON.stringify({
        name: donnees.nom,
        quota_included: donnees.quotas,
        price: donnees.prix,
        validity: donnees.dureeValidite,
        is_active: donnees.estActif,
      }),
    })
    if (!reponse.ok) return null
    await reponse.json().catch(() => null)
    const liste = await tryRecupererPacks(1, 500, '')
    const trouve = liste?.donnees?.find((p) => p.id === id)
    if (trouve) return { succes: true, donnees: { ...trouve, ...donnees } }
    return { succes: true, donnees: donnees as Pack }
  } catch {
    return null
  }
}

export async function tryCreerPack(pack: Pack): Promise<ReponseApi<Pack> | null> {
  if (!estBackendFacturationConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('billing', '/packs'), {
      method: 'POST',
      body: JSON.stringify({
        name: pack.nom,
        quota_included: pack.quotas,
        price: pack.prix,
        validity: pack.dureeValidite,
        is_active: pack.estActif,
      }),
    })
    if (!reponse.ok) return null
    await reponse.json().catch(() => null)
    return { succes: true, donnees: pack }
  } catch {
    return null
  }
}

export async function trySupprimerPack(id: string): Promise<ReponseApi<void> | null> {
  if (!estBackendFacturationConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('billing', `/packs/${encodeURIComponent(id)}`), {
      method: 'DELETE',
    })
    if (!reponse.ok) return null
    return { succes: true }
  } catch {
    return null
  }
}

export async function tryRecupererDemandesSuppression(
  page: number,
  parPage: number,
): Promise<ReponseApi<DemandeSuppressionCompte[]> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('user', '/deletion-requests'))
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    const arr = Array.isArray(json.data) ? json.data : []
    const demandes: DemandeSuppressionCompte[] = (arr as Record<string, unknown>[]).map((d) => {
      const u = d.user as Record<string, unknown> | undefined
      return {
        id: String(d.id ?? ''),
        utilisateurId: String(d.user_id ?? ''),
        utilisateurNom: String(u?.username ?? '—'),
        utilisateurEmail: String(u?.email ?? '—'),
        datedemande: d.created_at ? new Date(String(d.created_at)) : new Date(),
        raison: String(d.reason ?? ''),
        statut: mapStatutDemande(String(d.status ?? 'PENDING')),
      }
    })
    const total = demandes.length
    return {
      succes: true,
      donnees: demandes,
      pagination: { page: 1, parPage: total, total },
    }
  } catch {
    return null
  }
}

export async function tryTraiterDemandeSuppression(
  id: string,
  decision: 'approuve' | 'rejete',
): Promise<ReponseApi<DemandeSuppressionCompte> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const suffix = decision === 'approuve' ? 'accepted' : 'rejected'
  try {
    const reponse = await fetchAvecAuth(
      urlService('user', `/deletion-requests/${encodeURIComponent(id)}/${suffix}`),
      { method: 'PUT' },
    )
    if (!reponse.ok) return null
    const liste = await tryRecupererDemandesSuppression(1, 500)
    const trouve = liste?.donnees?.find((d) => d.id === id)
    if (trouve) {
      return {
        succes: true,
        donnees: {
          ...trouve,
          statut: decision === 'approuve' ? 'approuve' : 'rejete',
          dateTraitement: new Date(),
        },
      }
    }
    return {
      succes: true,
      donnees: {
        id,
        utilisateurId: '',
        utilisateurNom: '',
        utilisateurEmail: '',
        datedemande: new Date(),
        raison: '',
        statut: decision === 'approuve' ? 'approuve' : 'rejete',
        dateTraitement: new Date(),
      },
    }
  } catch {
    return null
  }
}

export async function tryAssignerQuotaAdministrateur(
  utilisateurId: string,
  montant: number,
): Promise<ReponseApi<void> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const adminId = lireAdminIdStockage()
  if (!adminId) return { succes: false, erreur: 'Session admin incomplète.' }
  try {
    const reponse = await fetchAvecAuth(
      urlService('user', `/users/${encodeURIComponent(utilisateurId)}/quota`),
      {
        method: 'PUT',
        body: JSON.stringify({ admin_id: adminId, quota: montant }),
      },
    )
    if (!reponse.ok) return null
    return { succes: true }
  } catch {
    return null
  }
}

export async function trySupprimerUtilisateur(id: string): Promise<ReponseApi<void> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('user', `/users/${encodeURIComponent(id)}`), {
      method: 'DELETE',
    })
    if (!reponse.ok) {
      const corps = (await reponse.json().catch(() => ({}))) as unknown
      return { succes: false, erreur: messageErreurReponseApi(corps, reponse.status) }
    }
    return { succes: true }
  } catch {
    return { succes: false, erreur: 'Erreur réseau.' }
  }
}

export async function tryModifierStatutUtilisateur(
  id: string,
  statut: 'actif' | 'inactif' | 'suspendu',
): Promise<ReponseApi<Utilisateur> | null> {
  /** L’API legacy ne documentait pas ce point : on recharge la liste après mutation locale impossible. */
  void statut
  const r = await tryRecupererUtilisateurs(1, 500)
  const u = r?.donnees?.find((x) => x.id === id)
  if (u) return { succes: true, donnees: { ...u, statut } }
  return null
}

function nomAfficheDepuisObjetUtilisateurTicket(
  usr: Record<string, unknown> | undefined,
  fallbackUsername: string,
): string {
  if (!usr) return fallbackUsername || '—'
  const ui = usr.user_info as Record<string, unknown> | undefined
  const prenom = String(ui?.firstname ?? usr.firstname ?? usr.first_name ?? '')
  const nom = String(ui?.lastname ?? usr.lastname ?? usr.last_name ?? '')
  const compose = `${prenom} ${nom}`.trim()
  if (compose) return compose
  return String((usr.username ?? usr.email ?? fallbackUsername) || '—')
}

export async function tryRecupererTicketsSupport(): Promise<ReponseApi<TicketSupport[]> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('user', '/tickets'))
    if (!reponse.ok) return null
    const json = (await reponse.json()) as unknown
    const arr = extraireListe(json) as Record<string, unknown>[]
    const tickets: TicketSupport[] = arr.map((t) => {
      const usr = t.user as Record<string, unknown> | undefined
      const statutBrut = t.status ?? t.ticket_status ?? t.state
      const fallbackUser = String(t.user_id ?? usr?.id ?? '')
      const description = String(t.description ?? t.message ?? t.content ?? '').trim()
      return {
        id: String(t.id ?? ''),
        utilisateurId: String(t.user_id ?? usr?.id ?? ''),
        utilisateurNom: nomAfficheDepuisObjetUtilisateurTicket(usr, fallbackUser),
        utilisateurEmail: String(usr?.email ?? t.user_email ?? ''),
        sujet: String(t.title ?? t.sujet ?? ''),
        ...(description ? { description } : {}),
        dateCreation: t.created_at ? new Date(String(t.created_at)) : new Date(),
        dernierMessage: t.updated_at ? new Date(String(t.updated_at)) : new Date(),
        statut: mapStatutTicketSupport(statutBrut),
        priorite: 'normale',
        nombreMessages: Number(t.message_count ?? t.reply_count ?? 0),
      }
    })
    return { succes: true, donnees: tickets }
  } catch {
    return null
  }
}

export async function tryRecupererMessagesTicketSupport(
  ticketId: string,
  utilisateurIdTicket: string,
  utilisateurNomTicket?: string,
): Promise<ReponseApi<MessageSupport[]> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const adminId = lireAdminIdStockage()
  const profilAdmin = lireDonneesProfilAdminSession()
  const nomAgent =
    `${profilAdmin.prenom} ${profilAdmin.nom}`.trim() ||
    profilAdmin.email ||
    profilAdmin.username ||
    'Support'
  try {
    const reponse = await fetchAvecAuth(
      urlService('user', `/tickets/${encodeURIComponent(ticketId)}/messages`),
    )
    if (!reponse.ok) return null
    const json = (await reponse.json()) as unknown
    const lignes = lignesMessagesDepuisReponseApi(json)
    const nomClient = (utilisateurNomTicket ?? '').trim() || 'Utilisateur'
    const uidTicket = utilisateurIdTicket || null
    const messages: MessageSupport[] = []
    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i]
      const texte = texteMessageDepuisPayloadWs(l)
      if (!texte.trim()) continue
      const estMessageClient = estMessageAuteurUtilisateurApi(l, uidTicket)
      const sid = expediteurIdDepuisPayloadWs(l)
      messages.push({
        id: String(l.id ?? `msg_${i}_${ticketId}`),
        ticketId,
        auteurId: sid || (estMessageClient ? utilisateurIdTicket : adminId ?? 'support'),
        auteurNom: estMessageClient ? nomClient : nomAgent,
        estAdmin: !estMessageClient,
        contenu: texte,
        dateEnvoi: dateEnvoiDepuisLigneMessageApi(l),
      })
    }
    return { succes: true, donnees: messages }
  } catch {
    return null
  }
}

export async function tryEnvoyerMessageTicketSupport(
  ticketId: string,
  texte: string,
): Promise<ReponseApi<void> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const adminId = lireAdminIdStockage()
  try {
    const corps = {
      ticket_id: ticketId,
      ...(adminId ? { sender_id: adminId } : {}),
      message: texte,
      created_at: new Date().toISOString(),
      type: 'admin_message',
    }
    const reponse = await fetchAvecAuth(
      urlService('user', `/tickets/${encodeURIComponent(ticketId)}/messages`),
      { method: 'POST', body: JSON.stringify(corps) },
    )
    if (!reponse.ok) {
      const corpsErr = (await reponse.json().catch(() => ({}))) as unknown
      return { succes: false, erreur: messageErreurReponseApi(corpsErr, reponse.status) }
    }
    return { succes: true }
  } catch {
    return { succes: false, erreur: 'Erreur réseau.' }
  }
}
