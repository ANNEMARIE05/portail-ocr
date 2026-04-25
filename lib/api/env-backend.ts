/** Configuration des URLs backend (équivalent VITE_* de l’ancien portail Vite). */

export function urlBaseApi(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').trim().replace(/\/$/, '')
}

/** Assure un `/` en tête pour éviter des URL du type `https://hôte.préfixe/...` si la variable d’environnement oublie le slash. */
function normaliserPrefixeServiceChaine(raw: string): string {
  const s = raw.trim().replace(/\/$/, '')
  if (!s) return ''
  return s.startsWith('/') ? s : `/${s}`
}

export function prefixeServiceUtilisateur(): string {
  return normaliserPrefixeServiceChaine(process.env.NEXT_PUBLIC_API_USER_SERVICE ?? '')
}

export function prefixeServiceAdmin(): string {
  return normaliserPrefixeServiceChaine(process.env.NEXT_PUBLIC_API_ADMIN_SERVICE ?? '')
}

export function prefixeServiceFacturation(): string {
  return normaliserPrefixeServiceChaine(process.env.NEXT_PUBLIC_API_BILLING_SERVICE ?? '')
}

export function estBackendUtilisateurConfigure(): boolean {
  return Boolean(urlBaseApi() && prefixeServiceUtilisateur())
}

export function estBackendAdminConfigure(): boolean {
  return Boolean(urlBaseApi() && prefixeServiceAdmin())
}

export function estBackendFacturationConfigure(): boolean {
  return Boolean(urlBaseApi() && prefixeServiceFacturation())
}

/** Concatène base + préfixe service + chemin (chemin doit commencer par `/`). */
export function urlService(
  service: 'user' | 'admin' | 'billing',
  chemin: string,
): string {
  const base = urlBaseApi()
  const pref =
    service === 'user'
      ? prefixeServiceUtilisateur()
      : service === 'admin'
        ? prefixeServiceAdmin()
        : prefixeServiceFacturation()
  const path = chemin.startsWith('/') ? chemin : `/${chemin}`
  return `${base}${pref}${path}`
}
