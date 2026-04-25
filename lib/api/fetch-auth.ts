import { lireJetonBearer } from '@/lib/api/session-client'

function estCheminAdmin(): boolean {
  if (typeof window === 'undefined') return false
  const p = window.location.pathname
  return p.startsWith('/admin') && !p.startsWith('/adminlogin')
}

/**
 * fetch authentifié (Bearer), Content-Type JSON par défaut.
 * Sur 401 : nettoyage session et redirection login ou adminlogin.
 */
export async function fetchAvecAuth(url: string, init: RequestInit = {}): Promise<Response> {
  const jeton = lireJetonBearer()
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (jeton) headers.set('Authorization', `Bearer ${jeton}`)

  const reponse = await fetch(url, { ...init, headers })

  if (reponse.status === 401) {
    try {
      localStorage.removeItem('token')
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined') {
      window.location.href = estCheminAdmin() ? '/adminlogin' : '/login'
    }
  }
  return reponse
}
