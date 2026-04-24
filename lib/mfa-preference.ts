/**
 * Préférences 2FA côté client (démo — à remplacer par l’API en production).
 * Si jamais enregistré : 2FA exigé (comportement historique).
 */
const CLE_2FA_UTILISATEUR = 'portail-ocr-mfa-utilisateur'
const CLE_2FA_ADMIN_EXIGE = 'portail-ocr-mfa-admin-exige'

function lireBoolVideSignifieVrai(cle: string): boolean {
  if (typeof window === 'undefined') return true
  const v = localStorage.getItem(cle)
  if (v === null) return true
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
  return lireBoolVideSignifieVrai(CLE_2FA_UTILISATEUR)
}

export function enregistrer2faRequisUtilisateur(requis: boolean) {
  ecrireBool(CLE_2FA_UTILISATEUR, requis)
}

/** Paramètre admin : exiger le 2FA pour l’espace d’administration. */
export function lire2faRequisAdmin(): boolean {
  return lireBoolVideSignifieVrai(CLE_2FA_ADMIN_EXIGE)
}

export function enregistrer2faRequisAdmin(requis: boolean) {
  ecrireBool(CLE_2FA_ADMIN_EXIGE, requis)
}
