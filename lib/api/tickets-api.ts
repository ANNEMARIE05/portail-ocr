import type { MessageTicket, TicketSupportUser } from '@/lib/types-user'

function origineApi(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''
}

function prefixeUserService(): string {
  return process.env.NEXT_PUBLIC_API_USER_SERVICE?.replace(/\/$/, '') ?? ''
}

/** Active les appels REST documentés (base + préfixe service utilisateur). */
export function estApiTicketsRestActive(): boolean {
  return Boolean(origineApi().trim() && prefixeUserService().trim())
}

/** URL de base WebSocket sans slash final ; ex. ws://hôte:18002 */
export function urlWebSocketTicketUtilisateur(ticketId: string): string | null {
  const base = process.env.NEXT_PUBLIC_WS_TICKETS_URL?.trim().replace(/\/$/, '')
  if (!base) return null
  return `${base}/ws/tickets/${encodeURIComponent(ticketId)}/user`
}

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

export function lireIdUtilisateurStockage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const brut = localStorage.getItem('userinfo')
    if (!brut) return null
    const j = JSON.parse(brut) as { id?: string }
    if (j?.id != null && String(j.id).length > 0) return String(j.id)
  } catch {
    return null
  }
  return null
}

function extraireTableau<T>(corps: unknown, clesRacine: string[]): T[] {
  if (Array.isArray(corps)) return corps as T[]
  if (corps && typeof corps === 'object') {
    const o = corps as Record<string, unknown>
    for (const cle of clesRacine) {
      const v = o[cle]
      if (Array.isArray(v)) return v as T[]
    }
  }
  return []
}

function mapperPrioriteApi(v: unknown): TicketSupportUser['priorite'] {
  const p = String(v ?? 'MEDIUM').toUpperCase()
  if (p === 'LOW' || p === 'BASSE') return 'basse'
  if (p === 'HIGH' || p === 'HAUTE') return 'haute'
  return 'normale'
}

function mapperStatutApi(v: unknown): { statut: TicketSupportUser['statut']; brut: string } {
  const s = String(v ?? 'OPEN').toUpperCase()
  if (s === 'CLOSED' || s === 'CLOSE' || s === 'RESOLVED' || s === 'RESOLU') {
    return { statut: 'resolu', brut: s === 'CLOSED' || s === 'CLOSE' ? 'CLOSED' : s }
  }
  if (s === 'IN_PROGRESS' || s === 'PENDING') return { statut: 'en-cours', brut: s }
  if (s === 'OPEN') return { statut: 'ouvert', brut: 'OPEN' }
  return { statut: 'ouvert', brut: s }
}

function mapperTicketDepuisApi(brut: Record<string, unknown>): TicketSupportUser {
  const id = String(brut.id ?? brut.ticket_id ?? '')
  const sujet = String(brut.title ?? brut.sujet ?? brut.subject ?? 'Sans titre')
  const message = String(brut.description ?? brut.message ?? brut.content ?? '')
  const statutBrut = String(brut.status ?? brut.statut ?? 'OPEN').toUpperCase()
  const { statut } = mapperStatutApi(statutBrut)
  const dateCreation = brut.created_at
    ? new Date(String(brut.created_at))
    : brut.dateCreation
      ? new Date(String(brut.dateCreation))
      : new Date()
  const dernier =
    brut.dernierMessage ?? brut.last_message ?? brut.updated_at ?? brut.lastMessageAt
  const derniereReponse = dernier ? new Date(String(dernier)) : undefined
  const nombreReponses =
    typeof brut.nombreReponses === 'number'
      ? brut.nombreReponses
      : typeof brut.reply_count === 'number'
        ? brut.reply_count
        : typeof brut.message_count === 'number'
          ? brut.message_count
          : 0

  return {
    id,
    sujet,
    message,
    dateCreation,
    statut,
    priorite: mapperPrioriteApi(brut.priority ?? brut.priorite),
    nombreReponses,
    derniereReponse,
    statutBrutApi: statutBrut,
  }
}

async function fetchAvecAuth(cheminRelatif: string, init: RequestInit = {}): Promise<Response> {
  const base = origineApi()
  const jeton = lireJetonBearer()
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (jeton) headers.set('Authorization', `Bearer ${jeton}`)
  const reponse = await fetch(`${base}${cheminRelatif}`, { ...init, headers })
  if (reponse.status === 401) {
    try {
      localStorage.removeItem('token')
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined') window.location.href = '/login'
  }
  return reponse
}

export async function ticketsApiListerPourUtilisateur(): Promise<{
  ok: boolean
  tickets?: TicketSupportUser[]
  erreur?: string
}> {
  const pref = prefixeUserService()
  const uid = lireIdUtilisateurStockage()
  if (!uid) {
    return {
      ok: false,
      erreur:
        'Identifiant utilisateur introuvable. Connectez-vous de nouveau ou renseignez userinfo dans le stockage local.',
    }
  }
  try {
    const reponse = await fetchAvecAuth(`${pref}/users/${encodeURIComponent(uid)}/tickets`)
    if (!reponse.ok) {
      return { ok: false, erreur: `Erreur ${reponse.status} lors du chargement des tickets.` }
    }
    const corps = (await reponse.json()) as unknown
    const lignes = extraireTableau<Record<string, unknown>>(corps, ['data', 'tickets', 'content'])
    const tickets = lignes.map((l) => mapperTicketDepuisApi(l))
    return { ok: true, tickets }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau'
    return { ok: false, erreur: msg }
  }
}

export async function ticketsApiCreer(titre: string, description: string): Promise<{
  ok: boolean
  ticket?: TicketSupportUser
  erreur?: string
}> {
  const pref = prefixeUserService()
  const uid = lireIdUtilisateurStockage()
  if (!uid) {
    return { ok: false, erreur: 'Session incomplète : userinfo.id manquant pour créer le ticket.' }
  }
  const corps = {
    title: titre,
    description,
    priority: 'MEDIUM',
    status: 'OPEN',
    user_id: uid,
  }
  try {
    const reponse = await fetchAvecAuth(`${pref}/tickets`, {
      method: 'POST',
      body: JSON.stringify(corps),
    })
    if (!reponse.ok) {
      const texte = await reponse.text()
      return {
        ok: false,
        erreur: texte ? `Échec création (${reponse.status})` : `Échec création (${reponse.status})`,
      }
    }
    let parse: unknown
    try {
      parse = await reponse.json()
    } catch {
      parse = {}
    }
    const obj =
      parse && typeof parse === 'object'
        ? ((parse as Record<string, unknown>).data as Record<string, unknown> | undefined) ??
          (parse as Record<string, unknown>)
        : {}
    let ticket = mapperTicketDepuisApi((obj ?? {}) as Record<string, unknown>)
    if (!ticket.id) {
      ticket = { ...ticket, id: `ticket_${Date.now()}` }
    }
    if (!ticket.sujet?.trim()) {
      ticket = { ...ticket, sujet: titre, message: description || ticket.message }
    }
    return { ok: true, ticket }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau'
    return { ok: false, erreur: msg }
  }
}

export async function ticketsApiListerMessages(
  ticketId: string,
  expediteurIdUtilisateur: string | null,
): Promise<{ ok: boolean; messages?: MessageTicket[]; erreur?: string }> {
  const pref = prefixeUserService()
  try {
    const reponse = await fetchAvecAuth(`${pref}/tickets/${encodeURIComponent(ticketId)}/messages`)
    if (!reponse.ok) {
      return { ok: false, erreur: `Erreur ${reponse.status}` }
    }
    const corps = (await reponse.json()) as unknown
    const lignes = extraireTableau<Record<string, unknown>>(corps, ['data', 'messages'])
    const messages: MessageTicket[] = lignes.map((l, i) => {
      const sid = l.sender_id != null ? String(l.sender_id) : ''
      const texte = String(l.message ?? l.texte ?? l.content ?? '')
      const dateEnvoi = l.created_at ? new Date(String(l.created_at)) : new Date()
      const estUtilisateur =
        expediteurIdUtilisateur != null ? sid === expediteurIdUtilisateur : false
      return {
        id: String(l.id ?? `msg_${i}_${ticketId}`),
        ticketId,
        auteur: estUtilisateur ? 'utilisateur' : 'support',
        contenu: texte,
        dateEnvoi,
      }
    })
    return { ok: true, messages }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau'
    return { ok: false, erreur: msg }
  }
}

export async function ticketsApiFermer(ticketId: string): Promise<{ ok: boolean; erreur?: string }> {
  const chemin = `/customer-service/api/v1/tickets/${encodeURIComponent(ticketId)}/close`
  try {
    const reponse = await fetchAvecAuth(chemin, { method: 'PUT' })
    if (!reponse.ok) {
      return { ok: false, erreur: `Clôture impossible (${reponse.status})` }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau'
    return { ok: false, erreur: msg }
  }
}

export function texteMessageDepuisPayloadWs(payload: Record<string, unknown>): string {
  return String(payload.message ?? payload.texte ?? payload.content ?? '')
}

export function expediteurIdDepuisPayloadWs(payload: Record<string, unknown>): string {
  return payload.sender_id != null ? String(payload.sender_id) : ''
}
