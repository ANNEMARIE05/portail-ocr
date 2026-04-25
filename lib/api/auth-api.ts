import {
  estBackendAdminConfigure,
  estBackendUtilisateurConfigure,
  urlService,
} from '@/lib/api/env-backend'
import { fetchAvecAuth } from '@/lib/api/fetch-auth'
import {
  ecrireAdmininfo,
  ecrireJeton,
  ecrireUserinfo,
  lireAdminIdStockage,
  lireIdUtilisateurStockage,
  lireJetonBearer,
} from '@/lib/api/session-client'

export type ResultatConnexion =
  | { type: 'otp_2fa'; userId: string }
  | { type: 'session'; token: string }
  | { type: 'erreur'; message: string }

function extraireMessageErreur(corps: unknown, statut: number): string {
  if (corps && typeof corps === 'object') {
    const m = (corps as Record<string, unknown>).message
    if (typeof m === 'string' && m.trim()) return m
  }
  return `Erreur ${statut}`
}

function extraireDonnees(corps: unknown): Record<string, unknown> {
  if (!corps || typeof corps !== 'object') return {}
  const o = corps as Record<string, unknown>
  const d = o.data
  if (d && typeof d === 'object') return d as Record<string, unknown>
  return o
}

export type ResultatMiseAJourPreferencesSecurite = {
  ok: boolean
  /** true si un appel HTTP a été tenté (backend configuré + jeton présent). */
  viaApi: boolean
  erreur?: string
}

function corpsHttpPreferencesSecurite(params: {
  otpEnabled?: boolean
  emailNotifications?: boolean
  pushNotifications?: boolean
  loginNotifications?: boolean
  transactionNotifications?: boolean
  quotaNotifications?: boolean
}): Record<string, unknown> {
  const o: Record<string, unknown> = {}
  if (params.otpEnabled !== undefined) {
    o.otp_enabled = params.otpEnabled
    o.two_factor_enabled = params.otpEnabled
    o.mfa_enabled = params.otpEnabled
  }
  if (params.emailNotifications !== undefined) {
    o.email_notifications = params.emailNotifications
    o.notify_email = params.emailNotifications
    o.notifications_email = params.emailNotifications
  }
  if (params.pushNotifications !== undefined) {
    o.push_notifications = params.pushNotifications
    o.notify_push = params.pushNotifications
    o.notifications_push = params.pushNotifications
  }
  if (params.loginNotifications !== undefined) {
    o.login_notifications = params.loginNotifications
    o.notify_new_login = params.loginNotifications
    o.notify_login = params.loginNotifications
  }
  if (params.transactionNotifications !== undefined) {
    o.transaction_notifications = params.transactionNotifications
    o.notify_failed_payments = params.transactionNotifications
    o.notify_transactions = params.transactionNotifications
  }
  if (params.quotaNotifications !== undefined) {
    o.quota_notifications = params.quotaNotifications
    o.notify_quota = params.quotaNotifications
    o.quota_alerts = params.quotaNotifications
  }
  return o
}

async function synchroniserProfilDepuisAuthMe(service: 'user' | 'admin'): Promise<void> {
  const url = urlService(service, '/auth/me')
  const getMe = await fetchAvecAuth(url, { method: 'GET' })
  if (!getMe.ok) return
  const json = (await getMe.json().catch(() => ({}))) as unknown
  const data = extraireDonnees(json)
  if (Object.keys(data).length === 0) return
  if (service === 'user') {
    ecrireUserinfo(data)
  } else {
    ecrireAdmininfo(data)
  }
}

/** Recharge `userinfo` / `admininfo` depuis le backend (ex. `mfa_enabled` après changement ailleurs). */
export async function rafraichirProfilConnecteDepuisMe(
  service: 'user' | 'admin',
): Promise<{ ok: boolean }> {
  const backendOk =
    service === 'admin' ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()
  if (!backendOk || !lireJetonBearer()) {
    return { ok: false }
  }
  const url = urlService(service, '/auth/me')
  try {
    const getMe = await fetchAvecAuth(url, { method: 'GET' })
    if (!getMe.ok) return { ok: false }
    const json = (await getMe.json().catch(() => ({}))) as unknown
    const data = extraireDonnees(json)
    if (Object.keys(data).length === 0) return { ok: false }
    if (service === 'user') {
      ecrireUserinfo(data)
    } else {
      ecrireAdmininfo(data)
    }
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

/**
 * Met à jour les préférences de sécurité / notifications du compte connecté.
 * Tente PATCH puis PUT sur `/auth/me`, puis recharge le profil via GET pour
 * aligner `userinfo` / `admininfo`.
 */
export async function mettreAJourPreferencesSecuriteConnecte(params: {
  service: 'user' | 'admin'
  otpEnabled?: boolean
  emailNotifications?: boolean
  pushNotifications?: boolean
  loginNotifications?: boolean
  transactionNotifications?: boolean
  quotaNotifications?: boolean
}): Promise<ResultatMiseAJourPreferencesSecurite> {
  const {
    service,
    otpEnabled,
    emailNotifications,
    pushNotifications,
    loginNotifications,
    transactionNotifications,
    quotaNotifications,
  } = params
  const backendOk = service === 'admin' ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()
  if (!backendOk) {
    return { ok: true, viaApi: false }
  }
  if (!lireJetonBearer()) {
    return { ok: false, viaApi: false, erreur: 'Session expirée. Reconnectez-vous.' }
  }
  const corps = corpsHttpPreferencesSecurite({
    otpEnabled,
    emailNotifications,
    pushNotifications,
    loginNotifications,
    transactionNotifications,
    quotaNotifications,
  })
  if (Object.keys(corps).length === 0) {
    return { ok: true, viaApi: true }
  }

  const url = urlService(service, '/auth/me')
  for (const method of ['PATCH', 'PUT'] as const) {
    const reponse = await fetchAvecAuth(url, { method, body: JSON.stringify(corps) })
    if (reponse.ok) {
      await synchroniserProfilDepuisAuthMe(service)
      return { ok: true, viaApi: true }
    }
    if (reponse.status !== 405 && reponse.status !== 404) {
      const errCorps = (await reponse.json().catch(() => ({}))) as unknown
      return {
        ok: false,
        viaApi: true,
        erreur: extraireMessageErreur(errCorps, reponse.status),
      }
    }
  }

  return {
    ok: false,
    viaApi: true,
    erreur: 'Le serveur ne permet pas la mise à jour de ces préférences sur ce point d’accès.',
  }
}

export type CanalMfaApi = 'email' | 'sms' | 'push'

/**
 * Active ou désactive le 2FA comme l’ancien portail Vite : `PUT /users/{id}/mfa_enabled`
 * puis synchronisation via `GET /auth/me`. Si l’endpoint n’existe pas (404/405), retombe sur
 * `mettreAJourPreferencesSecuriteConnecte` (PATCH/PUT `/auth/me`).
 */
export async function mettreAJourMfaEnabledLegacy(params: {
  service: 'user' | 'admin'
  mfaEnabled: boolean
  /** Canal d’envoi des OTP (ancien portail utilisateur). Ignoré à la désactivation (corps `email`). */
  channel?: CanalMfaApi
}): Promise<ResultatMiseAJourPreferencesSecurite> {
  const { service, mfaEnabled } = params
  const backendOk =
    service === 'admin' ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()
  if (!backendOk) {
    return { ok: true, viaApi: false }
  }
  if (!lireJetonBearer()) {
    return { ok: false, viaApi: false, erreur: 'Session expirée. Reconnectez-vous.' }
  }
  const userId = service === 'admin' ? lireAdminIdStockage() : lireIdUtilisateurStockage()
  if (!userId) {
    return mettreAJourPreferencesSecuriteConnecte({ service, otpEnabled: mfaEnabled })
  }

  const channelEff: CanalMfaApi = mfaEnabled ? params.channel ?? 'email' : 'email'

  const urlMfa = urlService(service, `/users/${userId}/mfa_enabled`)
  const reponse = await fetchAvecAuth(urlMfa, {
    method: 'PUT',
    body: JSON.stringify({
      channel: channelEff,
      mfa_enabled: mfaEnabled,
    }),
  })

  if (reponse.ok) {
    await synchroniserProfilDepuisAuthMe(service)
    return { ok: true, viaApi: true }
  }

  if (reponse.status === 404 || reponse.status === 405) {
    return mettreAJourPreferencesSecuriteConnecte({
      service,
      otpEnabled: mfaEnabled,
    })
  }

  const errCorps = (await reponse.json().catch(() => ({}))) as unknown
  return {
    ok: false,
    viaApi: true,
    erreur: extraireMessageErreur(errCorps, reponse.status),
  }
}

/** Identifiant renvoyé par l’API quand la connexion est en attente de 2FA (plusieurs formes possibles). */
function extraireUserIdEtape2FA(data: Record<string, unknown>): string | null {
  // Comme le portail Vite : si `user_id` est renvoyé, étape OTP — avant `access_token`.
  for (const cle of ['user_id', 'userId', 'pending_user_id', 'pendingUserId'] as const) {
    const v = data[cle]
    if (v != null && String(v).trim() !== '') {
      return String(v)
    }
  }
  const flags2fa = [data.requires_2fa, data.requires_otp, data.otp_required, data.two_factor_required]
  const veut2fa = flags2fa.some((f) => f === true || f === 'true' || f === 1)
  if (veut2fa) {
    const id = data.id
    if (id != null && String(id).trim() !== '') return String(id)
  }
  const token = data.access_token
  if (typeof token === 'string' && token.trim()) {
    return null
  }
  return null
}

export async function connexionUtilisateur(
  email: string,
  motDePasse: string,
): Promise<ResultatConnexion> {
  if (!estBackendUtilisateurConfigure()) {
    return { type: 'erreur', message: 'API non configurée (NEXT_PUBLIC_API_*).' }
  }
  try {
    const reponse = await fetch(urlService('user', '/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password: motDePasse }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { type: 'erreur', message: extraireMessageErreur(corps, reponse.status) }
    }
    const data = extraireDonnees(corps)
    const userId2fa = extraireUserIdEtape2FA(data)
    if (userId2fa) {
      return { type: 'otp_2fa', userId: userId2fa }
    }
    const token = data.access_token
    if (typeof token !== 'string' || !token) {
      return { type: 'erreur', message: 'Réponse de connexion inattendue.' }
    }
    return { type: 'session', token }
  } catch {
    return { type: 'erreur', message: 'Erreur réseau. Vérifiez votre connexion.' }
  }
}

export async function chargerProfilUtilisateur(token: string): Promise<{ ok: boolean; erreur?: string }> {
  if (!estBackendUtilisateurConfigure()) {
    return { ok: false, erreur: 'API non configurée.' }
  }
  try {
    const reponse = await fetch(urlService('user', '/auth/me'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { ok: false, erreur: extraireMessageErreur(corps, reponse.status) }
    }
    const data = extraireDonnees(corps)
    ecrireJeton(token)
    ecrireUserinfo(data)
    return { ok: true }
  } catch {
    return { ok: false, erreur: 'Erreur réseau.' }
  }
}

export async function connexionAdministrateur(
  email: string,
  motDePasse: string,
): Promise<ResultatConnexion> {
  if (!estBackendAdminConfigure()) {
    return { type: 'erreur', message: 'API admin non configurée (NEXT_PUBLIC_API_*).' }
  }
  try {
    const reponse = await fetch(urlService('admin', '/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password: motDePasse }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { type: 'erreur', message: extraireMessageErreur(corps, reponse.status) }
    }
    const data = extraireDonnees(corps)
    const userId2fa = extraireUserIdEtape2FA(data)
    if (userId2fa) {
      return { type: 'otp_2fa', userId: userId2fa }
    }
    const token = data.access_token
    if (typeof token !== 'string' || !token) {
      return { type: 'erreur', message: 'Réponse de connexion inattendue.' }
    }
    return { type: 'session', token }
  } catch {
    return { type: 'erreur', message: 'Erreur réseau. Vérifiez votre connexion.' }
  }
}

export async function chargerProfilAdmin(token: string): Promise<{ ok: boolean; erreur?: string }> {
  if (!estBackendAdminConfigure()) {
    return { ok: false, erreur: 'API admin non configurée.' }
  }
  try {
    const reponse = await fetch(urlService('admin', '/auth/me'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { ok: false, erreur: extraireMessageErreur(corps, reponse.status) }
    }
    const data = extraireDonnees(corps)
    ecrireJeton(token)
    ecrireAdmininfo(data)
    return { ok: true }
  } catch {
    return { ok: false, erreur: 'Erreur réseau.' }
  }
}

export async function demanderOtpReinitialisation(
  email: string,
  service: 'user' | 'admin',
): Promise<{ ok: boolean; erreur?: string }> {
  const ok =
    service === 'admin' ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()
  if (!ok) return { ok: false, erreur: 'API non configurée.' }
  try {
    const reponse = await fetch(urlService(service, '/auth/request-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, purpose: 'password reset' }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      if (reponse.status === 404) {
        return { ok: false, erreur: 'Aucun compte trouvé avec cette adresse email.' }
      }
      return { ok: false, erreur: extraireMessageErreur(corps, reponse.status) }
    }
    return { ok: true }
  } catch {
    return { ok: false, erreur: 'Erreur réseau.' }
  }
}

export async function verifierOtpConnexionOuReset(params: {
  service: 'user' | 'admin'
  email: string
  code: string
  purpose: string
}): Promise<{ ok: boolean; erreur?: string; token?: string }> {
  const { service, email, code, purpose } = params
  const ok =
    service === 'admin' ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()
  if (!ok) return { ok: false, erreur: 'API non configurée.' }
  try {
    const reponse = await fetch(urlService(service, '/auth/verify-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, code, purpose }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { ok: false, erreur: extraireMessageErreur(corps, reponse.status) }
    }
    const data = extraireDonnees(corps)
    const token = data.access_token
    if (typeof token === 'string' && token) {
      return { ok: true, token }
    }
    return { ok: true }
  } catch {
    return { ok: false, erreur: 'Erreur réseau.' }
  }
}

function extraireAccessTokenReponseOtp(corps: unknown): string | null {
  const data = extraireDonnees(corps)
  const t = data.access_token
  if (typeof t === 'string' && t.trim()) return t
  const nested = data.data
  if (nested && typeof nested === 'object' && 'access_token' in nested) {
    const t2 = (nested as Record<string, unknown>).access_token
    if (typeof t2 === 'string' && t2.trim()) return t2
  }
  return null
}

export async function verifier2FA(params: {
  service: 'user' | 'admin'
  userId: string
  code: string
}): Promise<{ ok: boolean; token?: string; erreur?: string }> {
  const { service, userId, code } = params
  const ok =
    service === 'admin' ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()
  if (!ok) return { ok: false, erreur: 'API non configurée.' }
  try {
    const reponse = await fetch(urlService(service, '/auth/verify-2fa-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, code }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { ok: false, erreur: extraireMessageErreur(corps, reponse.status) }
    }
    const token = extraireAccessTokenReponseOtp(corps)
    if (!token) {
      return { ok: false, erreur: 'Réponse OTP invalide.' }
    }
    return { ok: true, token }
  } catch {
    return { ok: false, erreur: 'Erreur réseau.' }
  }
}

export async function renvoyerOtp(params: {
  service: 'user' | 'admin'
  email: string
  purpose: string
}): Promise<{ ok: boolean; erreur?: string }> {
  const { service, email, purpose } = params
  const ok =
    service === 'admin' ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()
  if (!ok) return { ok: false, erreur: 'API non configurée.' }
  try {
    const reponse = await fetch(urlService(service, '/auth/request-otp'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, purpose }),
    })
    if (!reponse.ok) {
      const corps = (await reponse.json().catch(() => ({}))) as unknown
      return { ok: false, erreur: extraireMessageErreur(corps, reponse.status) }
    }
    return { ok: true }
  } catch {
    return { ok: false, erreur: 'Erreur réseau.' }
  }
}

/** Changement de mot de passe pour un utilisateur déjà connecté (Bearer). */
export async function changerMotDePasseUtilisateurConnecte(params: {
  motDePasseActuel: string
  nouveauMotDePasse: string
  confirmerMotDePasse: string
}): Promise<{ ok: boolean; erreur?: string }> {
  if (!estBackendUtilisateurConfigure()) {
    return { ok: false, erreur: 'API non configurée.' }
  }
  if (!lireJetonBearer()) {
    return { ok: false, erreur: 'Session expirée. Reconnectez-vous.' }
  }
  const userId = lireIdUtilisateurStockage()
  const corpsLegacy = {
    old_password: params.motDePasseActuel,
    new_password: params.nouveauMotDePasse,
    confirm_password: params.confirmerMotDePasse,
  }
  try {
    if (userId) {
      const reponseLegacy = await fetchAvecAuth(
        urlService('user', `/users/${userId}/password`),
        {
          method: 'PUT',
          body: JSON.stringify(corpsLegacy),
        },
      )
      if (reponseLegacy.ok) {
        return { ok: true }
      }
      if (reponseLegacy.status !== 404 && reponseLegacy.status !== 405) {
        const corps = (await reponseLegacy.json().catch(() => ({}))) as unknown
        return { ok: false, erreur: extraireMessageErreur(corps, reponseLegacy.status) }
      }
    }

    const reponse = await fetchAvecAuth(urlService('user', '/auth/change-password'), {
      method: 'PUT',
      body: JSON.stringify({
        current_password: params.motDePasseActuel,
        new_password: params.nouveauMotDePasse,
        confirm_password: params.confirmerMotDePasse,
      }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { ok: false, erreur: extraireMessageErreur(corps, reponse.status) }
    }
    return { ok: true }
  } catch {
    return { ok: false, erreur: 'Erreur réseau.' }
  }
}

/** Changement de mot de passe administrateur (même logique que l’ancien portail : `PUT /users/{id}/password`). */
export async function changerMotDePasseAdminConnecte(params: {
  motDePasseActuel: string
  nouveauMotDePasse: string
  confirmerMotDePasse: string
}): Promise<{ ok: boolean; erreur?: string }> {
  if (!estBackendAdminConfigure()) {
    return { ok: false, erreur: 'API admin non configurée.' }
  }
  if (!lireJetonBearer()) {
    return { ok: false, erreur: 'Session expirée. Reconnectez-vous.' }
  }
  const adminId = lireAdminIdStockage()
  const corpsLegacy = {
    old_password: params.motDePasseActuel,
    new_password: params.nouveauMotDePasse,
    confirm_password: params.confirmerMotDePasse,
  }
  try {
    if (adminId) {
      const reponseLegacy = await fetchAvecAuth(
        urlService('admin', `/users/${adminId}/password`),
        {
          method: 'PUT',
          body: JSON.stringify(corpsLegacy),
        },
      )
      if (reponseLegacy.ok) {
        return { ok: true }
      }
      if (reponseLegacy.status !== 404 && reponseLegacy.status !== 405) {
        const corps = (await reponseLegacy.json().catch(() => ({}))) as unknown
        return { ok: false, erreur: extraireMessageErreur(corps, reponseLegacy.status) }
      }
    }

    const reponse = await fetchAvecAuth(urlService('admin', '/auth/change-password'), {
      method: 'PUT',
      body: JSON.stringify({
        current_password: params.motDePasseActuel,
        new_password: params.nouveauMotDePasse,
        confirm_password: params.confirmerMotDePasse,
      }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { ok: false, erreur: extraireMessageErreur(corps, reponse.status) }
    }
    return { ok: true }
  } catch {
    return { ok: false, erreur: 'Erreur réseau.' }
  }
}

export async function reinitialiserMotDePasse(params: {
  service: 'user' | 'admin'
  email: string
  motDePasse: string
  confirmerMotDePasse: string
}): Promise<{ ok: boolean; erreur?: string }> {
  const { service, email, motDePasse, confirmerMotDePasse } = params
  const ok =
    service === 'admin' ? estBackendAdminConfigure() : estBackendUtilisateurConfigure()
  if (!ok) return { ok: false, erreur: 'API non configurée.' }
  try {
    const reponse = await fetch(urlService(service, '/auth/reset-password'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: email,
        password: motDePasse,
        confirm_password: confirmerMotDePasse,
      }),
    })
    const corps = (await reponse.json().catch(() => ({}))) as unknown
    if (!reponse.ok) {
      return { ok: false, erreur: extraireMessageErreur(corps, reponse.status) }
    }
    return { ok: true }
  } catch {
    return { ok: false, erreur: 'Erreur réseau.' }
  }
}
