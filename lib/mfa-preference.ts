/**
 * Préférences 2FA côté client (démo sans API uniquement).
 * Si jamais enregistré : pas de 2FA — comme avec l’API quand le compte n’a pas le 2FA activé.
 */
const CLE_2FA_UTILISATEUR = 'portail-ocr-mfa-utilisateur'
const CLE_2FA_ADMIN_EXIGE = 'portail-ocr-mfa-admin-exige'

function lireBool2faLocal(cle: string): boolean {
  if (typeof window === 'undefined') return false
  const v = localStorage.getItem(cle)
  if (v === null) return false
  return v === '1'
}

function ecrireBool(cle: string, actif: boolean) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(cle, actif ? '1' : '0')
  } catch {
    /* quota / navigation privée */
  }
}

export function lire2faRequisUtilisateur(): boolean {
  return lireBool2faLocal(CLE_2FA_UTILISATEUR)
}

export function enregistrer2faRequisUtilisateur(requis: boolean) {
  ecrireBool(CLE_2FA_UTILISATEUR, requis)
}

/** Paramètre admin : exiger le 2FA pour l’espace d’administration. */
export function lire2faRequisAdmin(): boolean {
  return lireBool2faLocal(CLE_2FA_ADMIN_EXIGE)
}

export function enregistrer2faRequisAdmin(requis: boolean) {
  ecrireBool(CLE_2FA_ADMIN_EXIGE, requis)
}

/** Préférences notifications (fallback si l’API ne gère pas encore ces champs). */
export type PreferencesNotificationsCompte = {
  email: boolean
  push: boolean
  connexion: boolean
  transaction: boolean
  quota: boolean
}

/**
 * Même contenu que le fallback sans localStorage (SSR / premier rendu).
 * À utiliser pour l’état initial des formulaires afin d’éviter les mismatches d’hydratation.
 */
export const PREFERENCES_NOTIFICATIONS_DEFAUT: PreferencesNotificationsCompte = {
  email: true,
  push: false,
  connexion: true,
  transaction: true,
  quota: true,
}

const CLE_NOTIF_USER = 'portail-ocr-notifications-user'
const CLE_NOTIF_ADMIN = 'portail-ocr-notifications-admin'

function lireNotifDepuisCle(cle: string): PreferencesNotificationsCompte {
  if (typeof window === 'undefined') return { ...PREFERENCES_NOTIFICATIONS_DEFAUT }
  try {
    const brut = localStorage.getItem(cle)
    if (!brut) return { ...PREFERENCES_NOTIFICATIONS_DEFAUT }
    const o = JSON.parse(brut) as Record<string, unknown>
    return {
      email: typeof o.email === 'boolean' ? o.email : PREFERENCES_NOTIFICATIONS_DEFAUT.email,
      push: typeof o.push === 'boolean' ? o.push : PREFERENCES_NOTIFICATIONS_DEFAUT.push,
      connexion:
        typeof o.connexion === 'boolean' ? o.connexion : PREFERENCES_NOTIFICATIONS_DEFAUT.connexion,
      transaction:
        typeof o.transaction === 'boolean' ? o.transaction : PREFERENCES_NOTIFICATIONS_DEFAUT.transaction,
      quota: typeof o.quota === 'boolean' ? o.quota : PREFERENCES_NOTIFICATIONS_DEFAUT.quota,
    }
  } catch {
    return { ...PREFERENCES_NOTIFICATIONS_DEFAUT }
  }
}

function ecrireNotifCle(cle: string, prefs: PreferencesNotificationsCompte) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(cle, JSON.stringify(prefs))
  } catch {
    /* ignore */
  }
}

export function lirePreferencesNotificationsUtilisateur(): PreferencesNotificationsCompte {
  return lireNotifDepuisCle(CLE_NOTIF_USER)
}

export function enregistrerPreferencesNotificationsUtilisateur(
  partiel: Partial<PreferencesNotificationsCompte>,
) {
  const actuel = lirePreferencesNotificationsUtilisateur()
  ecrireNotifCle(CLE_NOTIF_USER, { ...actuel, ...partiel })
}

export function lirePreferencesNotificationsAdmin(): PreferencesNotificationsCompte {
  return lireNotifDepuisCle(CLE_NOTIF_ADMIN)
}

export function enregistrerPreferencesNotificationsAdmin(partiel: Partial<PreferencesNotificationsCompte>) {
  const actuel = lirePreferencesNotificationsAdmin()
  ecrireNotifCle(CLE_NOTIF_ADMIN, { ...actuel, ...partiel })
}
