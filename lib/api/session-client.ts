/** Lecture / écriture du jeton et userinfo côté client (aligné sur l’ancien portail). */

import { separerPrenomNom } from '@/lib/utils/formatage'
import type { RoleAdmin } from '@/lib/types-admin'

export function lireJetonBearer(): string | null {
  if (typeof window === 'undefined') return null
  const brut = localStorage.getItem('token')
  if (!brut) return null
  try {
    const parse = JSON.parse(brut) as unknown
    if (typeof parse === 'string') return parse
    if (parse && typeof parse === 'object') {
      const o = parse as Record<string, unknown>
      const t = o.access_token ?? o.accessToken ?? o.token
      if (typeof t === 'string') return t
    }
  } catch {
    return brut
  }
  return null
}

export function ecrireJeton(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('token', JSON.stringify(token))
}

export function ecrireUserinfo(donnees: unknown): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('userinfo', JSON.stringify(donnees))
}

export function ecrireAdmininfo(donnees: unknown): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('admininfo', JSON.stringify(donnees))
}

export function lireAdminIdStockage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const brut = localStorage.getItem('admininfo')
    if (!brut) return null
    const j = JSON.parse(brut) as { id?: string }
    if (j?.id != null && String(j.id).length > 0) return String(j.id)
  } catch {
    return null
  }
  return null
}

export function lireIdUtilisateurStockage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const brut = localStorage.getItem('userinfo')
    if (!brut) return null
    const j = JSON.parse(brut) as Record<string, unknown>
    for (const cle of ['id', 'user_id', 'userId'] as const) {
      const v = j[cle]
      if (v != null && String(v).trim() !== '') return String(v)
    }
    const ui = j.user_info
    if (ui && typeof ui === 'object' && !Array.isArray(ui)) {
      const o = ui as Record<string, unknown>
      for (const cle of ['id', 'user_id', 'userId'] as const) {
        const v = o[cle]
        if (v != null && String(v).trim() !== '') return String(v)
      }
    }
  } catch {
    return null
  }
  return null
}

export function lireUserinfoBrut(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const brut = localStorage.getItem('userinfo')
    if (!brut) return null
    const j = JSON.parse(brut) as Record<string, unknown>
    return j && typeof j === 'object' ? j : null
  } catch {
    return null
  }
}

export function lireAdmininfoBrut(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const brut = localStorage.getItem('admininfo')
    if (!brut) return null
    const j = JSON.parse(brut) as Record<string, unknown>
    return j && typeof j === 'object' ? j : null
  } catch {
    return null
  }
}

/** Email (ou identifiant de connexion) depuis userinfo en localStorage. */
export function lireEmailUtilisateurStockage(): string | null {
  const u = lireUserinfoBrut()
  if (!u) return null
  for (const cle of ['email', 'user_email', 'mail'] as const) {
    const v = u[cle]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  const username = u.username
  if (typeof username === 'string' && username.includes('@')) return username.trim()
  return null
}

function chaineProfil(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

export type StatutProfilSession = 'actif' | 'inactif' | 'suspendu'

function statutProfilDepuisUserinfo(u: Record<string, unknown>): StatutProfilSession {
  const s = chaineProfil(u.status ?? u.account_status ?? u.user_status)
  if (s) {
    const up = s.toUpperCase()
    if (up.includes('SUSPEND')) return 'suspendu'
    if (up === 'INACTIVE' || up === 'DISABLED' || up === 'INACTIF') return 'inactif'
  }
  if (u.is_active === false || u.active === false || u.enabled === false) return 'inactif'
  if (u.suspended === true) return 'suspendu'
  return 'actif'
}

const CLES_2FA_USERINFO = [
  'two_factor_enabled',
  'twoFactorEnabled',
  'otp_enabled',
  'mfa_enabled',
  'totp_enabled',
] as const

function lireBooleen2FADepuisObjet(o: Record<string, unknown>): boolean | null {
  for (const cle of CLES_2FA_USERINFO) {
    const v = o[cle]
    if (v === true) return true
    if (v === false) return false
    if (v === 1 || v === '1' || v === 'true') return true
    if (v === 0 || v === '0' || v === 'false') return false
  }
  return null
}

/** true / false si l’API expose le champ ; null sinon (ex. préférence locale sur la page). */
function otpActifDepuisUserinfo(u: Record<string, unknown>): boolean | null {
  const racine = lireBooleen2FADepuisObjet(u)
  if (racine !== null) return racine
  const ui = u.user_info
  if (ui && typeof ui === 'object' && !Array.isArray(ui)) {
    return lireBooleen2FADepuisObjet(ui as Record<string, unknown>)
  }
  return null
}

function initialesAvatarDepuisProfil(
  prenom: string,
  nom: string,
  email: string,
  username: string,
): string {
  const p = prenom.trim()
  const n = nom.trim()
  if (p && n) return (p[0] + n[0]).toUpperCase()
  if (p.length >= 2) return p.slice(0, 2).toUpperCase()
  if (p) return (p[0] + (p[1] ?? p[0])).toUpperCase()
  if (n.length >= 2) return n.slice(0, 2).toUpperCase()
  if (n) return (n[0] + (n[1] ?? n[0])).toUpperCase()
  const un = username.trim()
  if (un.length >= 2 && !un.includes('@')) return un.slice(0, 2).toUpperCase()
  if (un) return (un[0] + un[0]).toUpperCase()
  const e = email.trim()
  if (e.length >= 2) return (e[0] + e[1]).toUpperCase()
  if (e) return (e[0] + e[0]).toUpperCase()
  return '?'
}

function lireObjetUserInfoEmbarque(u: Record<string, unknown>): Record<string, unknown> | null {
  const ui = u.user_info
  if (ui && typeof ui === 'object' && !Array.isArray(ui)) return ui as Record<string, unknown>
  return null
}

function lireEntrepriseDepuisUserinfo(
  u: Record<string, unknown>,
  ui: Record<string, unknown> | null,
): string {
  const cles = [
    'compagnie',
    'entreprise',
    'company',
    'company_name',
    'organization',
    'organisation',
    'organization_name',
    'org_name',
    'employer',
    'business_name',
    'employeur',
  ] as const
  for (const cle of cles) {
    if (ui) {
      const v = chaineProfil(ui[cle])
      if (v) return v
    }
  }
  for (const cle of cles) {
    const v = chaineProfil(u[cle])
    if (v) return v
  }
  return ''
}

function lireQuotaDepuisUserinfo(u: Record<string, unknown>): { total: number; used: number } | null {
  const q = u.quota
  if (!q || typeof q !== 'object' || Array.isArray(q)) return null
  const o = q as Record<string, unknown>
  const total = Number(o.total)
  const used = Number(o.used)
  if (!Number.isFinite(total)) return null
  return { total, used: Number.isFinite(used) ? used : 0 }
}

function booleenOuNullDepuisChamp(v: unknown): boolean | null {
  if (v === true || v === false) return v
  if (v === 1 || v === '1' || v === 'true') return true
  if (v === 0 || v === '0' || v === 'false') return false
  return null
}

export type DonneesProfilUtilisateurSession = {
  prenom: string
  nom: string
  email: string
  statut: StatutProfilSession
  twoFactorDepuisApi: boolean | null
  initialesAvatar: string
  username: string
  role: string
  quota: { total: number; used: number } | null
  telephone: string | null
  indicatifPays: string | null
  creeLe: string | null
  misAJourLe: string | null
  premiereConnexion: boolean | null
  emailVerifie: boolean | null
  bio: string | null
  localisation: string | null
  entreprise: string
}

/** Titre d’accueil (prénom, sinon nom, sinon nom d’utilisateur hors email). */
export function titreBienvenueDepuisUserinfo(): string {
  const d = lireDonneesProfilUtilisateurSession()
  const p = d.prenom.trim()
  if (p) return `Bonjour, ${p}`
  const n = d.nom.trim()
  if (n) return `Bonjour, ${n}`
  const un = d.username.trim()
  if (un && !un.includes('@')) return `Bonjour, ${un}`
  const e = d.email.trim()
  if (e) return `Bonjour, ${e.split('@')[0] || e}`
  return 'Bonjour'
}

/** Données affichables du profil depuis `userinfo` (rempli après `/auth/me` ou équivalent). */
export function lireDonneesProfilUtilisateurSession(): DonneesProfilUtilisateurSession {
  const u = lireUserinfoBrut()
  if (!u) {
    return {
      prenom: '',
      nom: '',
      email: '',
      statut: 'inactif',
      twoFactorDepuisApi: null,
      initialesAvatar: '?',
      username: '',
      role: '',
      quota: null,
      telephone: null,
      indicatifPays: null,
      creeLe: null,
      misAJourLe: null,
      premiereConnexion: null,
      emailVerifie: null,
      bio: null,
      localisation: null,
      entreprise: '',
    }
  }
  const ui = lireObjetUserInfoEmbarque(u)

  let prenom =
    (ui ? chaineProfil(ui.firstname) || chaineProfil(ui.first_name) || chaineProfil(ui.firstName) : '') ||
    chaineProfil(u.first_name) ||
    chaineProfil(u.firstName) ||
    chaineProfil(u.firstname) ||
    chaineProfil(u.given_name) ||
    chaineProfil(u.prenom)
  let nom =
    (ui ? chaineProfil(ui.lastname) || chaineProfil(ui.last_name) || chaineProfil(ui.lastName) : '') ||
    chaineProfil(u.last_name) ||
    chaineProfil(u.lastName) ||
    chaineProfil(u.lastname) ||
    chaineProfil(u.family_name) ||
    chaineProfil(u.nom)
  if (!prenom && !nom) {
    const nomComplet =
      (ui
        ? chaineProfil(ui.full_name) ||
          chaineProfil(ui.fullName) ||
          chaineProfil(ui.display_name) ||
          chaineProfil(ui.name)
        : '') ||
      chaineProfil(u.full_name) ||
      chaineProfil(u.fullName) ||
      chaineProfil(u.display_name) ||
      chaineProfil(u.displayName) ||
      chaineProfil(u.name)
    if (nomComplet) {
      const parts = separerPrenomNom(nomComplet)
      prenom = parts.prenom
      nom = parts.nom
    }
  }
  const email =
    (ui ? chaineProfil(ui.email) || chaineProfil(ui.mail) : '') ||
    lireEmailUtilisateurStockage() ||
    chaineProfil(u.email) ||
    chaineProfil(u.mail) ||
    chaineProfil(u.username)

  const telUi = ui ? chaineProfil(ui.phone_number) || chaineProfil(ui.phone) : ''
  const telRoot = chaineProfil(u.phone_number) || chaineProfil(u.phone)
  const telephoneBrut = telUi || telRoot || null

  const ccUi = ui ? chaineProfil(ui.country_code) : ''
  const ccRoot = chaineProfil(u.country_code)
  const indicatifPays = ccUi || ccRoot || null

  const statut = statutProfilDepuisUserinfo(u)
  const username = chaineProfil(u.username)
  const role = chaineProfil(u.role)
  const creeLe = chaineProfil(u.created_at) || null
  const misAJourLe = chaineProfil(u.updated_at) || null
  const entrepriseDepuisApi = lireEntrepriseDepuisUserinfo(u, ui)
  const entreprise = username || entrepriseDepuisApi

  return {
    prenom,
    nom,
    email,
    statut,
    twoFactorDepuisApi: otpActifDepuisUserinfo(u),
    initialesAvatar: initialesAvatarDepuisProfil(prenom, nom, email, username),
    username,
    role,
    quota: lireQuotaDepuisUserinfo(u),
    telephone: telephoneBrut,
    indicatifPays,
    creeLe,
    misAJourLe,
    premiereConnexion: booleenOuNullDepuisChamp(u.is_first_login),
    emailVerifie: ui ? booleenOuNullDepuisChamp(ui.email_verified) : null,
    bio: ui ? chaineProfil(ui.bio) || null : chaineProfil(u.bio) || null,
    localisation: ui ? chaineProfil(ui.location) || null : chaineProfil(u.location) || null,
    entreprise,
  }
}

export type CanalMfa = 'email' | 'sms' | 'push'

/** Canal 2FA renvoyé par l’API (`mfa_channel`, etc.) après `/auth/me`. */
function lireCanalMfaDepuisObjet(u: Record<string, unknown>): CanalMfa | null {
  const c = u.mfa_channel ?? u.mfaChannel ?? u.two_factor_channel ?? u.otp_channel
  if (c === 'email' || c === 'sms' || c === 'push') return c
  if (typeof c === 'string') {
    const x = c.trim().toLowerCase()
    if (x === 'email' || x === 'sms' || x === 'push') return x
  }
  return null
}

export function lireCanalMfaSession(service: 'user' | 'admin'): CanalMfa | null {
  const u = service === 'admin' ? lireAdmininfoBrut() : lireUserinfoBrut()
  if (!u) return null
  const d = lireCanalMfaDepuisObjet(u)
  if (d) return d
  const ui = u.user_info
  if (ui && typeof ui === 'object' && !Array.isArray(ui)) {
    return lireCanalMfaDepuisObjet(ui as Record<string, unknown>)
  }
  return null
}

export function lireOcrUserId(): number | null {
  const u = lireUserinfoBrut()
  if (!u) return null
  const v = u.ocr_user_id
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function lireEmailAdminDepuisCompte(u: Record<string, unknown>): string {
  for (const cle of ['email', 'user_email', 'mail'] as const) {
    const v = u[cle]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  const username = u.username
  if (typeof username === 'string' && username.includes('@')) return username.trim()
  return ''
}

/** Rôle (API `/auth/me` admin) mappé sur le modèle d’affichage du portail. */
export function normaliserRoleAdmin(v: string | undefined | null): RoleAdmin {
  const s = (typeof v === 'string' ? v : '').trim().toLowerCase().replace(/_/g, '-')
  if (!s) return 'admin'
  if (s === 'super-admin' || s === 'superadmin' || s.includes('super') && s.includes('admin')) {
    return 'super-admin'
  }
  if (s === 'moderateur' || s === 'moderator' || s === 'mod' || s.startsWith('moderat')) {
    return 'moderateur'
  }
  if (s === 'admin' || s === 'administrator' || s === 'administrateur') {
    return 'admin'
  }
  return 'admin'
}

export type DonneesProfilAdminSession = {
  prenom: string
  nom: string
  email: string
  initialesAvatar: string
  role: RoleAdmin
  telephone: string | null
  indicatifPays: string | null
  twoFactorDepuisApi: boolean | null
  username: string
}

/** Profil vide — aligné sur l’absence de `admininfo` (même rendu SSR et premier rendu client). */
export function donneesProfilAdminSessionVides(): DonneesProfilAdminSession {
  return {
    prenom: '',
    nom: '',
    email: '',
    initialesAvatar: '?',
    role: 'admin',
    telephone: null,
    indicatifPays: null,
    twoFactorDepuisApi: null,
    username: '',
  }
}

/**
 * Même principe que le profil utilisateur : champs `first_name`, `name`, `user_info`, etc.
 * remplis par `chargerProfilAdmin` à partir de `/auth/me`.
 */
export function lireDonneesProfilAdminSession(): DonneesProfilAdminSession {
  const u = lireAdmininfoBrut()
  if (!u) {
    return donneesProfilAdminSessionVides()
  }
  const ui = lireObjetUserInfoEmbarque(u)

  let prenom =
    (ui ? chaineProfil(ui.firstname) || chaineProfil(ui.first_name) || chaineProfil(ui.firstName) : '') ||
    chaineProfil(u.first_name) ||
    chaineProfil(u.firstName) ||
    chaineProfil(u.firstname) ||
    chaineProfil(u.given_name) ||
    chaineProfil(u.prenom)
  let nom =
    (ui ? chaineProfil(ui.lastname) || chaineProfil(ui.last_name) || chaineProfil(ui.lastName) : '') ||
    chaineProfil(u.last_name) ||
    chaineProfil(u.lastName) ||
    chaineProfil(u.lastname) ||
    chaineProfil(u.family_name) ||
    chaineProfil(u.nom)
  if (!prenom && !nom) {
    const nomComplet =
      (ui
        ? chaineProfil(ui.full_name) ||
          chaineProfil(ui.fullName) ||
          chaineProfil(ui.display_name) ||
          chaineProfil(ui.name)
        : '') ||
      chaineProfil(u.full_name) ||
      chaineProfil(u.fullName) ||
      chaineProfil(u.display_name) ||
      chaineProfil(u.displayName) ||
      chaineProfil(u.name)
    if (nomComplet) {
      const parts = separerPrenomNom(nomComplet)
      prenom = parts.prenom
      nom = parts.nom
    }
  }
  const email =
    (ui ? chaineProfil(ui.email) || chaineProfil(ui.mail) : '') || lireEmailAdminDepuisCompte(u)
  const telUi = ui ? chaineProfil(ui.phone_number) || chaineProfil(ui.phone) : ''
  const telRoot = chaineProfil(u.phone_number) || chaineProfil(u.phone)
  const telephoneBrut = telUi || telRoot || null
  const ccUi = ui ? chaineProfil(ui.country_code) : ''
  const ccRoot = chaineProfil(u.country_code)
  const indicatifPays = ccUi || ccRoot || null
  const username = chaineProfil(u.username)
  /** Dashboard admin : le champ « nom » affiche le login en priorité. */
  const nomAfficheAdmin = username || nom
  const roleBrut =
    chaineProfil(u.role) || (ui ? chaineProfil((ui as Record<string, unknown>).role) : '') || username

  return {
    prenom,
    nom: nomAfficheAdmin,
    email: email || username,
    initialesAvatar: initialesAvatarDepuisProfil(prenom, nomAfficheAdmin, email || username, username),
    role: normaliserRoleAdmin(roleBrut),
    telephone: telephoneBrut,
    indicatifPays,
    twoFactorDepuisApi: otpActifDepuisUserinfo(u),
    username,
  }
}

/** Titre d’en-tête ex. « Jean-Pierre D. » — aligné sur le menu déroulant admin. */
export function nomCompteCourtDepuisDonneesAdmin(d: DonneesProfilAdminSession): string {
  const p = d.prenom.trim()
  const n = d.nom.trim()
  if (p && n) {
    return `${p} ${n[0]}.`
  }
  if (p) {
    return p
  }
  if (n) {
    return n
  }
  if (d.username && !d.username.includes('@')) {
    return d.username
  }
  if (d.email) {
    const part = d.email.split('@')[0] ?? d.email
    if (part) {
      return part
    }
  }
  return 'Administrateur'
}

export function titreBienvenueDepuisDonneesAdmin(d: DonneesProfilAdminSession): string {
  const p = d.prenom.trim()
  if (p) {
    return `Bonjour, ${p}`
  }
  const n = d.nom.trim()
  if (n) {
    return `Bonjour, ${n}`
  }
  const un = d.username.trim()
  if (un && !un.includes('@')) {
    return `Bonjour, ${un}`
  }
  const e = d.email.trim()
  if (e) {
    return `Bonjour, ${e.split('@')[0] || e}`
  }
  return 'Bonjour'
}
