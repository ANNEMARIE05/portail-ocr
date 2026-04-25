import type { MessageTicket, TicketSupportUser } from '@/lib/types-user'
import { estBackendUtilisateurConfigure, urlBaseApi, urlService } from '@/lib/api/env-backend'
import { fetchAvecAuth } from '@/lib/api/fetch-auth'
import { lireIdUtilisateurStockage } from '@/lib/api/session-client'

export { lireIdUtilisateurStockage } from '@/lib/api/session-client'

/** Même règle que le reste du portail (NEXT_PUBLIC_API_BASE_URL + préfixe utilisateur). */
export function estApiTicketsRestActive(): boolean {
  return estBackendUtilisateurConfigure()
}

function messageErreurReponseHttp(reponse: Response, texte: string): string {
  const trim = texte?.trim() ?? ''
  if (trim.startsWith('{') || trim.startsWith('[')) {
    try {
      const j = JSON.parse(trim) as Record<string, unknown>
      const m = j.message ?? j.error ?? j.detail
      if (typeof m === 'string' && m.trim()) return `${m.trim()} (${reponse.status})`
    } catch {
      /* ignore */
    }
  }
  if (trim && trim.length < 800) return `${trim} (${reponse.status})`
  return `Échec de la requête (${reponse.status})`
}

function extraireIdDepuisEnTeteLocation(reponse: Response): string {
  const loc = reponse.headers.get('Location') ?? reponse.headers.get('Content-Location') ?? ''
  const m = /\/tickets\/?([^/?#]+)\/?$/.exec(loc) ?? /tickets\/?([^/?#]+)\/?$/.exec(loc)
  if (m?.[1]) return decodeURIComponent(m[1])
  return ''
}

function idUtilisateurPourApiBackend(uid: string): string | number {
  if (/^\d{1,20}$/.test(uid)) return Number.parseInt(uid, 10)
  return uid
}

/** URL de base WebSocket sans slash final ; ex. ws://hôte:18002 */
export function urlWebSocketTicketUtilisateur(ticketId: string): string | null {
  const base = process.env.NEXT_PUBLIC_WS_TICKETS_URL?.trim().replace(/\/$/, '')
  if (!base) return null
  return `${base}/ws/tickets/${encodeURIComponent(ticketId)}/user`
}

/** WebSocket côté agent (même base `NEXT_PUBLIC_WS_TICKETS_URL` que l’utilisateur). */
export function urlWebSocketTicketAdmin(ticketId: string): string | null {
  const base = process.env.NEXT_PUBLIC_WS_TICKETS_URL?.trim().replace(/\/$/, '')
  if (!base) return null
  return `${base}/ws/tickets/${encodeURIComponent(ticketId)}/admin`
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

function commeLignesObjets(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return []
  return v.filter(
    (x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x),
  )
}

export function texteMessageDepuisPayloadWs(payload: Record<string, unknown>): string {
  return String(
    payload.message ??
      payload.texte ??
      payload.content ??
      payload.text ??
      payload.body ??
      '',
  )
}

export function expediteurIdDepuisPayloadWs(payload: Record<string, unknown>): string {
  const s =
    payload.sender_id ?? payload.senderId ?? payload.user_id ?? payload.userId ?? payload.from_id
  return s != null ? String(s) : ''
}

function ligneMessageApiSembleRemplie(l: Record<string, unknown>): boolean {
  return (
    texteMessageDepuisPayloadWs(l).trim() !== '' || expediteurIdDepuisPayloadWs(l) !== ''
  )
}

/**
 * Lignes message depuis la réponse GET `…/tickets/{ticket_id}/messages`
 * (souvent `{ status, message, data: Message[] }`).
 */
export function lignesMessagesDepuisReponseApi(corps: unknown): Record<string, unknown>[] {
  if (Array.isArray(corps)) return commeLignesObjets(corps)
  if (!corps || typeof corps !== 'object') return []
  const o = corps as Record<string, unknown>

  const data = o.data
  if (data === null || data === undefined) {
    for (const cle of ['messages', 'content', 'results', 'items'] as const) {
      const lignes = commeLignesObjets(o[cle])
      if (lignes.length) return lignes
    }
    return []
  }
  if (Array.isArray(data)) return commeLignesObjets(data)
  if (typeof data === 'object' && !Array.isArray(data)) {
    const rec = data as Record<string, unknown>
    for (const cle of ['messages', 'items', 'content', 'results'] as const) {
      const lignes = commeLignesObjets(rec[cle])
      if (lignes.length) return lignes
    }
    if (ligneMessageApiSembleRemplie(rec)) return [rec]
    return []
  }

  for (const cle of ['messages', 'content'] as const) {
    const lignes = commeLignesObjets(o[cle])
    if (lignes.length) return lignes
  }
  return []
}

export function dateEnvoiDepuisLigneMessageApi(l: Record<string, unknown>): Date {
  const v =
    l.created_at ??
    l.updated_at ??
    l.timestamp ??
    l.sent_at ??
    l.date ??
    l.createdAt ??
    l.message_at
  if (v != null && String(v).trim() !== '') {
    const d = new Date(String(v))
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date()
}

/** Indique si le message est côté utilisateur (sender_id ou champ `type`). */
export function estMessageAuteurUtilisateurApi(
  l: Record<string, unknown>,
  expediteurIdUtilisateur: string | null,
): boolean {
  const sid = expediteurIdDepuisPayloadWs(l)
  if (expediteurIdUtilisateur && sid === expediteurIdUtilisateur) return true
  if (expediteurIdUtilisateur && sid) return false
  const t = String(l.type ?? l.message_type ?? l.role ?? '').toLowerCase()
  if (
    t.includes('user_message') ||
    t === 'user' ||
    t === 'customer' ||
    t === 'client' ||
    t.includes('customer_message')
  ) {
    return true
  }
  if (
    t.includes('admin_message') ||
    t.includes('agent') ||
    t.includes('support') ||
    t.includes('staff') ||
    t.includes('operator')
  ) {
    return false
  }
  return false
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
  const dernier = brut.dernierMessage ?? brut.last_message ?? brut.updated_at ?? brut.lastMessageAt
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

export async function ticketsApiListerPourUtilisateur(): Promise<{
  ok: boolean
  tickets?: TicketSupportUser[]
  erreur?: string
}> {
  const uid = lireIdUtilisateurStockage()
  try {
    if (uid) {
      /** Même ordre que le portail Vite : liste par utilisateur, repli sur /tickets. */
      let reponse = await fetchAvecAuth(
        urlService('user', `/users/${encodeURIComponent(uid)}/tickets`),
        { method: 'GET' },
      )
      if (
        !reponse.ok &&
        (reponse.status === 404 || reponse.status === 405 || reponse.status === 400)
      ) {
        reponse = await fetchAvecAuth(urlService('user', '/tickets'), { method: 'GET' })
      }
      if (!reponse.ok) {
        if (reponse.status === 401) {
          return { ok: false, erreur: 'Session expirée ou non autorisée.' }
        }
        return { ok: false, erreur: `Erreur ${reponse.status} lors du chargement des tickets.` }
      }
      const corps = (await reponse.json()) as unknown
      const lignes = extraireTableau<Record<string, unknown>>(corps, ['data', 'tickets', 'content'])
      const tickets = lignes.map((l) => mapperTicketDepuisApi(l))
      return { ok: true, tickets }
    }
    return {
      ok: false,
      erreur:
        'Identifiant utilisateur introuvable (userinfo.id). Reconnectez-vous ou consultez l’URL des tickets côté API.',
    }
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
  const uid = lireIdUtilisateurStockage()
  if (!uid) {
    return { ok: false, erreur: 'Session incomplète : userinfo.id manquant pour créer le ticket.' }
  }
  const corps = {
    title: titre,
    description,
    priority: 'MEDIUM',
    status: 'OPEN',
    user_id: idUtilisateurPourApiBackend(uid),
  }
  try {
    const reponse = await fetchAvecAuth(urlService('user', '/tickets'), {
      method: 'POST',
      body: JSON.stringify(corps),
    })
    if (!reponse.ok) {
      const texte = await reponse.text()
      return { ok: false, erreur: messageErreurReponseHttp(reponse, texte) }
    }
    const idEntete = extraireIdDepuisEnTeteLocation(reponse)
    const texteBrut = await reponse.text()
    let parse: unknown = {}
    if (texteBrut.trim()) {
      try {
        parse = JSON.parse(texteBrut) as unknown
      } catch {
        parse = {}
      }
    }
    const obj =
      parse && typeof parse === 'object'
        ? ((parse as Record<string, unknown>).data as Record<string, unknown> | undefined) ??
          (parse as Record<string, unknown>)
        : {}
    let ticket = mapperTicketDepuisApi((obj ?? {}) as Record<string, unknown>)
    if (!ticket.id && idEntete) {
      ticket = { ...ticket, id: idEntete }
    }
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
  try {
    const reponse = await fetchAvecAuth(
      urlService('user', `/tickets/${encodeURIComponent(ticketId)}/messages`),
      { method: 'GET' },
    )
    if (!reponse.ok) {
      return { ok: false, erreur: `Erreur ${reponse.status}` }
    }
    const corps = (await reponse.json()) as unknown
    const lignes = lignesMessagesDepuisReponseApi(corps)
    const messages: MessageTicket[] = []
    for (let i = 0; i < lignes.length; i++) {
      const l = lignes[i]
      const texte = texteMessageDepuisPayloadWs(l)
      if (!texte.trim()) continue
      const estUtilisateur = estMessageAuteurUtilisateurApi(l, expediteurIdUtilisateur)
      messages.push({
        id: String(l.id ?? `msg_${i}_${ticketId}`),
        ticketId,
        auteur: estUtilisateur ? 'utilisateur' : 'support',
        contenu: texte,
        dateEnvoi: dateEnvoiDepuisLigneMessageApi(l),
      })
    }
    return { ok: true, messages }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau'
    return { ok: false, erreur: msg }
  }
}

export async function ticketsApiFermer(ticketId: string): Promise<{ ok: boolean; erreur?: string }> {
  const base = urlBaseApi()
  /** Portail legacy : clôture côté gateway customer-service, pas sous le préfixe user-service. */
  const cheminCustomerService = `${base}/customer-service/api/v1/tickets/${encodeURIComponent(ticketId)}/close`
  const cheminUserService = urlService('user', `/tickets/${encodeURIComponent(ticketId)}/close`)

  async function tenterFermeture(url: string): Promise<Response> {
    let reponse = await fetchAvecAuth(url, { method: 'PUT' })
    if (!reponse.ok && (reponse.status === 404 || reponse.status === 405)) {
      reponse = await fetchAvecAuth(url, { method: 'POST' })
    }
    return reponse
  }

  try {
    let reponse = await tenterFermeture(cheminCustomerService)
    if (!reponse.ok && (reponse.status === 404 || reponse.status === 405 || reponse.status === 400)) {
      reponse = await tenterFermeture(cheminUserService)
    }
    if (!reponse.ok) {
      return { ok: false, erreur: `Clôture impossible (${reponse.status})` }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau'
    return { ok: false, erreur: msg }
  }
}

/** Message utilisateur ou agent via REST (repli si WebSocket indisponible). */
export async function ticketsApiEnvoyerMessage(
  ticketId: string,
  texte: string,
  params?: { expediteurId?: string; typeMessage?: string },
): Promise<{ ok: boolean; erreur?: string }> {
  const expediteur = params?.expediteurId ?? lireIdUtilisateurStockage()
  const corps = {
    ticket_id: ticketId,
    ...(expediteur ? { sender_id: expediteur } : {}),
    message: texte,
    created_at: new Date().toISOString(),
    type: params?.typeMessage ?? 'user_message',
  }
  try {
    const reponse = await fetchAvecAuth(
      urlService('user', `/tickets/${encodeURIComponent(ticketId)}/messages`),
      {
        method: 'POST',
        body: JSON.stringify(corps),
      },
    )
    if (!reponse.ok) {
      const t = await reponse.text()
      return { ok: false, erreur: messageErreurReponseHttp(reponse, t) }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau'
    return { ok: false, erreur: msg }
  }
}

export type TypeMessageWebSocketTicket = 'user_message' | 'admin_message'

/**
 * Corps JSON attendu par le service WebSocket tickets (aligné portail Vite : ticket_id, type, created_at).
 * Sans `ticketId`, envoie la forme minimale pour compatibilité.
 */
export function serialiserMessageWebSocketTicket(
  expediteurId: string,
  texte: string,
  opts?: { ticketId?: string; typeMessage?: TypeMessageWebSocketTicket; createdAtIso?: string },
): string {
  const created = opts?.createdAtIso ?? new Date().toISOString()
  if (opts?.ticketId) {
    return JSON.stringify({
      ticket_id: opts.ticketId,
      sender_id: expediteurId,
      message: texte,
      created_at: created,
      type: opts.typeMessage ?? 'user_message',
    })
  }
  return JSON.stringify({
    sender_id: expediteurId,
    message: texte,
  })
}

function estObjetMessageWs(o: Record<string, unknown>): boolean {
  return (
    o.message != null ||
    o.texte != null ||
    o.content != null ||
    o.text != null ||
    o.body != null ||
    o.sender_id != null ||
    o.senderId != null
  )
}

/**
 * Découpe un frame WebSocket en un ou plusieurs objets message (tableaux, enveloppes `data` / `payload`, etc.).
 */
export function payloadsMessagesDepuisEvenementWebSocket(donneesBrutes: string): Record<string, unknown>[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(donneesBrutes)
  } catch {
    return []
  }

  const commeLignes = (v: unknown): Record<string, unknown>[] => {
    if (!Array.isArray(v)) return []
    return v.filter(
      (x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x),
    )
  }

  if (Array.isArray(parsed)) {
    return commeLignes(parsed)
  }

  if (parsed && typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>
    for (const cle of ['messages', 'items', 'results'] as const) {
      const lignes = commeLignes(o[cle])
      if (lignes.length) return lignes
    }
    if (Array.isArray(o.data)) {
      const lignes = commeLignes(o.data)
      if (lignes.length) return lignes
    }
    if (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) {
      const rec = o.data as Record<string, unknown>
      if (estObjetMessageWs(rec)) return [rec]
    }
    if (o.payload && typeof o.payload === 'object' && !Array.isArray(o.payload)) {
      const rec = o.payload as Record<string, unknown>
      if (estObjetMessageWs(rec)) return [rec]
    }
    return [o]
  }

  return []
}

/**
 * Envoie sur un WebSocket déjà ouvert ; si la socket est encore en CONNECTING, envoie dès l’événement `open`.
 * Retourne false si la socket est absente ou déjà fermée / en fermeture.
 */
export function envoyerSurWebSocketTicket(ws: WebSocket | null, corps: string): boolean {
  if (!ws) return false
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(corps)
    return true
  }
  if (ws.readyState === WebSocket.CONNECTING) {
    const envoyer = () => {
      if (ws.readyState === WebSocket.OPEN) ws.send(corps)
      ws.removeEventListener('open', envoyer)
    }
    ws.addEventListener('open', envoyer)
    return true
  }
  return false
}
