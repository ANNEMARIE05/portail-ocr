/**
 * Appels REST alignés sur l’ancien portail (Vite) pour l’espace utilisateur.
 * Retourne null si le backend n’est pas configuré ou si l’appel échoue.
 */

import {
  estBackendFacturationConfigure,
  estBackendUtilisateurConfigure,
  urlService,
} from '@/lib/api/env-backend'
import { fetchAvecAuth } from '@/lib/api/fetch-auth'
import {
  lireIdUtilisateurStockage,
  lireOcrUserId,
  lireUserinfoBrut,
} from '@/lib/api/session-client'
import type {
  CleApiUser,
  DocumentOCR,
  HistoriqueAppel,
  PackDisponible,
  ReponseApiUser,
  ResultatDemandeSuppressionCompte,
  StatistiquesUser,
  TransactionUser,
} from '@/lib/types-user'
import type { StatutTransaction } from '@/lib/types-admin'

function extraireData(corps: unknown): unknown {
  if (!corps || typeof corps !== 'object') return corps
  const o = corps as Record<string, unknown>
  return o.data !== undefined ? o.data : corps
}

const CLES_URL_PAIEMENT = [
  'payment_url',
  'checkout_url',
  'redirect_url',
  'payment_link',
  'paymentUrl',
  'checkoutUrl',
  'redirectUrl',
  'url',
  'lien_paiement',
  'payment_redirect',
] as const

function estUrlRedirection(v: string): boolean {
  const t = v.trim()
  return (
    t.startsWith('http://') ||
    t.startsWith('https://') ||
    (t.startsWith('/') && t.length > 1)
  )
}

function normaliserUrlRedirection(v: string): string {
  const t = v.trim()
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  if (typeof window !== 'undefined' && t.startsWith('/')) {
    return `${window.location.origin}${t}`
  }
  return t
}

/**
 * Lien de redirection vers le prestataire de paiement (nom de champ variable selon l’API).
 */
function extraireUrlPaiementDepuisReponse(
  jsonRacine: Record<string, unknown>,
  coucheData: Record<string, unknown>,
): string | undefined {
  function scanner(o: Record<string, unknown>): string | undefined {
    for (const cle of CLES_URL_PAIEMENT) {
      const v = o[cle]
      if (typeof v === 'string' && estUrlRedirection(v)) {
        return normaliserUrlRedirection(v)
      }
    }
    return undefined
  }

  const ordre = [coucheData, jsonRacine]
  for (const o of ordre) {
    const direct = scanner(o)
    if (direct) return direct
  }
  for (const o of ordre) {
    for (const v of Object.values(o)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const imbrique = scanner(v as Record<string, unknown>)
        if (imbrique) return imbrique
      }
    }
  }
  return undefined
}

function mapStatutTransaction(brut: string): StatutTransaction {
  const s = (brut || '').toLowerCase()
  if (s.includes('success') || s.includes('paid') || s.includes('complete')) return 'succes'
  return 'echec'
}

export async function tryRecupererStatistiquesUser(): Promise<ReponseApiUser<StatistiquesUser> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const uid = lireIdUtilisateurStockage()
  if (!uid) return null
  try {
    const [rStats, rConso] = await Promise.all([
      fetchAvecAuth(urlService('user', `/ia-data/stats/${encodeURIComponent(uid)}`)),
      fetchAvecAuth(urlService('user', `/ia-data/consumption/${encodeURIComponent(uid)}`)),
    ])
    if (!rStats.ok || !rConso.ok) return null
    const jStats = (await rStats.json()) as Record<string, unknown>
    const jConso = (await rConso.json()) as Record<string, unknown>
    const dStats = (extraireData(jStats) as Record<string, unknown>) ?? {}
    const dConso = (extraireData(jConso) as Record<string, unknown>) ?? {}
    const limite =
      Number(
        dConso.monthly_limit ??
          dConso.quota ??
          dConso.limit ??
          dConso.total ??
          0,
      ) || 0
    const utilise =
      Number(dConso.current_usage ?? dConso.used ?? dConso.usage ?? dConso.consumed ?? 0) || 0
    const restant = Math.max(0, limite - utilise)
    const stats: StatistiquesUser = {
      creditsRestants: restant,
      creditsUtilises: utilise,
      creditsTotal: limite,
      documentsTraites: utilise,
      documentsJour: 0,
      variationDocuments: 0,
      precisionMoyenne: Number(dStats.success_rate ?? 0),
      tempsMoyenTraitement: Number(dStats.avg_processing_time_ms ?? 0) / 1000,
      appelApiMois: utilise,
    }
    return { succes: true, donnees: stats }
  } catch {
    return null
  }
}

export async function tryRecupererHistoriqueAppels(
  page: number,
  parPage: number,
): Promise<ReponseApiUser<HistoriqueAppel[]> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const ocrId = lireOcrUserId()
  if (ocrId == null) return null
  try {
    const reponse = await fetchAvecAuth(
      urlService('user', `/ia-data/logs/${encodeURIComponent(String(ocrId))}`),
    )
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    const couche = extraireData(json) as Record<string, unknown> | unknown
    const liste =
      couche &&
      typeof couche === 'object' &&
      Array.isArray((couche as Record<string, unknown>).data)
        ? ((couche as Record<string, unknown>).data as unknown[])
        : []
    const lignes: HistoriqueAppel[] = (liste as Record<string, unknown>[]).map((item, i) => ({
      id: String(item.id ?? `log_${i}`),
      endpoint: String(item.endpoint ?? ''),
      methode: 'POST',
      dateAppel: item.timestamp ? new Date(String(item.timestamp)) : new Date(),
      statut: Number(item.status ?? 0),
      latence: Number(item.latency_ms ?? 0),
      creditsUtilises: 1,
      erreur: item.error != null ? String(item.error) : undefined,
    }))
    const total = lignes.length
    const debut = (page - 1) * parPage
    return {
      succes: true,
      donnees: lignes.slice(debut, debut + parPage),
      pagination: { page, parPage, total },
    }
  } catch {
    return null
  }
}

export async function tryRecupererTransactionsUser(
  page: number,
  parPage: number,
): Promise<ReponseApiUser<TransactionUser[]> | null> {
  if (!estBackendFacturationConfigure() || !estBackendUtilisateurConfigure()) return null
  const uid = lireIdUtilisateurStockage()
  if (!uid) return null
  try {
    const reponse = await fetchAvecAuth(
      urlService('billing', `/users/${encodeURIComponent(uid)}/transactions`),
    )
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    const arr = Array.isArray(json.data) ? json.data : []
    const tout: TransactionUser[] = (arr as Record<string, unknown>[]).map((t) => ({
      id: String(t.id ?? ''),
      reference: String(t.transaction_reference ?? t.id ?? ''),
      packNom: String(t.pack_id ?? 'Pack'),
      montant: Number(t.amount ?? 0),
      devise: String(t.currency ?? 'XOF'),
      credits: 0,
      dateTransaction: t.created_at ? new Date(String(t.created_at)) : new Date(),
      statut: mapStatutTransaction(String(t.status ?? '')),
      methodePaiement: String(t.payment_method ?? ''),
    }))
    const total = tout.length
    const debut = (page - 1) * parPage
    return {
      succes: true,
      donnees: tout.slice(debut, debut + parPage),
      pagination: { page, parPage, total },
    }
  } catch {
    return null
  }
}

export async function tryRecupererPacksDisponibles(): Promise<ReponseApiUser<PackDisponible[]> | null> {
  if (!estBackendFacturationConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('billing', '/packs/list/active'))
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    const arr = Array.isArray(json.data) ? json.data : []
    const packs: PackDisponible[] = (arr as Record<string, unknown>[]).map((p) => ({
      id: String(p.id ?? ''),
      nom: String(p.name ?? p.nom ?? 'Pack'),
      description: String(p.description ?? ''),
      credits: Number(p.quota_included ?? p.quota ?? 0),
      prix: Number(p.price ?? p.prix ?? 0),
      devise: 'XOF',
      caracteristiques: [],
    }))
    return { succes: true, donnees: packs }
  } catch {
    return null
  }
}

export async function tryAcheterPack(
  packId: string,
): Promise<ReponseApiUser<TransactionUser> & { urlPaiement?: string } | null> {
  if (!estBackendFacturationConfigure() || !estBackendUtilisateurConfigure()) return null
  const uid = lireIdUtilisateurStockage()
  if (!uid) return null
  try {
    const reponse = await fetchAvecAuth(urlService('billing', '/transactions'), {
      method: 'POST',
      body: JSON.stringify({
        user_id: uid,
        pack_id: packId,
        payment_method: 'MOBILE_MONEY',
      }),
    })
    const json = (await reponse.json().catch(() => ({}))) as Record<string, unknown>
    if (!reponse.ok) {
      return {
        succes: false,
        erreur: String(json.message ?? `Erreur ${reponse.status}`),
      }
    }
    const data = (extraireData(json) as Record<string, unknown>) ?? {}
    const urlPaiement = extraireUrlPaiementDepuisReponse(json, data)
    const trx: TransactionUser = {
      id: String(data.id ?? `trx_${Date.now()}`),
      reference: String(data.transaction_reference ?? ''),
      packNom: String(data.pack_id ?? packId),
      montant: Number(data.amount ?? 0),
      devise: String(data.currency ?? 'XOF'),
      credits: 0,
      dateTransaction: new Date(),
      statut: 'succes',
      methodePaiement: 'MOBILE_MONEY',
    }
    return { succes: true, donnees: trx, urlPaiement }
  } catch {
    return null
  }
}

export async function tryRecupererClesApiUser(): Promise<ReponseApiUser<CleApiUser[]> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const u = lireUserinfoBrut()
  if (!u) return null
  const ocrRaw = u.ocr_user_id
  const ocrId =
    typeof ocrRaw === 'number'
      ? ocrRaw
      : typeof ocrRaw === 'string'
        ? Number(ocrRaw)
        : NaN
  if (!Number.isFinite(ocrId)) return null
  try {
    const reponse = await fetchAvecAuth(
      urlService('user', `/ia-data/client/${encodeURIComponent(String(ocrId))}`),
    )
    let permissions: string[] = ['lecture', 'soumission']
    let quotaLim = Number(u.quota && typeof u.quota === 'object' ? (u.quota as { total?: number }).total : 0) || 100
    let quotaUtil = Number(u.quota && typeof u.quota === 'object' ? (u.quota as { used?: number }).used : 0) || 0
    let actif = u.is_active === true

    if (reponse.ok) {
      const json = (await reponse.json()) as Record<string, unknown>
      const status = String(json.status ?? '')
      const enveloppe = json.data as Record<string, unknown> | undefined
      const apiData =
        enveloppe && typeof enveloppe.data === 'object'
          ? (enveloppe.data as Record<string, unknown>)
          : enveloppe
      if (status === 'success' && apiData && typeof apiData === 'object') {
        const perms = apiData.permissions as Record<string, unknown> | undefined
        permissions = []
        if (perms?.read) permissions.push('lecture')
        if (perms?.submit) permissions.push('soumission')
        quotaUtil = Number(apiData.current_usage ?? quotaUtil)
        quotaLim = Number(apiData.quota ?? quotaLim)
        actif = String(apiData.status ?? '').toLowerCase() === 'active'
      }
    }

    const cleApi = String(u.api_key ?? '')
    const idCle = String(u.id ?? 'principal')
    const username = String(u.username ?? 'API')
    const created = u.created_at ? new Date(String(u.created_at)) : new Date()

    const cle: CleApiUser = {
      id: idCle,
      cle: cleApi,
      nom: `API ${username}`,
      dateCreation: created,
      dateExpiration: new Date(Date.now() + 365 * 86400000),
      estActive: actif,
      permissions,
      nombreRequetes: quotaUtil,
    }
    return { succes: true, donnees: [cle] }
  } catch {
    return null
  }
}

export async function tryRegenererCleApiUser(
  idCle: string,
): Promise<ReponseApiUser<CleApiUser> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const uid = lireIdUtilisateurStockage()
  if (!uid) return null
  try {
    const reponse = await fetchAvecAuth(
      urlService('user', `/ia-data/regenerate_api_key/${encodeURIComponent(uid)}`),
      { method: 'POST' },
    )
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    const status = String(json.status ?? '')
    const data = (extraireData(json) as Record<string, unknown>) ?? {}
    const nouvelleCle = String(data.api_key ?? '')
    if (status !== 'success' || !nouvelleCle) {
      return { succes: false, erreur: 'Réponse API invalide.' }
    }
    const u = lireUserinfoBrut()
    if (u && typeof window !== 'undefined') {
      const maj = { ...u, api_key: nouvelleCle }
      localStorage.setItem('userinfo', JSON.stringify(maj))
    }
    const existant = await tryRecupererClesApiUser()
    const base = existant?.donnees?.find((c) => c.id === idCle) ?? existant?.donnees?.[0]
    const cle: CleApiUser = {
      ...(base ?? {
        id: idCle,
        nom: 'API',
        dateCreation: new Date(),
        dateExpiration: new Date(),
        estActive: true,
        permissions: [],
        nombreRequetes: 0,
      }),
      cle: nouvelleCle,
    }
    return { succes: true, donnees: cle }
  } catch {
    return null
  }
}

export async function tryDemanderSuppressionCompte(
  motif: string,
): Promise<ReponseApiUser<ResultatDemandeSuppressionCompte> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  try {
    const reponse = await fetchAvecAuth(urlService('user', '/deletion-requests'), {
      method: 'POST',
      body: JSON.stringify({ reason: motif }),
    })
    const json = (await reponse.json().catch(() => ({}))) as Record<string, unknown>
    if (!reponse.ok) {
      return { succes: false, erreur: String(json.message ?? `Erreur ${reponse.status}`) }
    }
    const data = (extraireData(json) as Record<string, unknown>) ?? {}
    return {
      succes: true,
      donnees: {
        idDemande: String(data.id ?? `suppr_${Date.now()}`),
        dateEnregistrement: new Date(),
      },
    }
  } catch {
    return null
  }
}

export async function trySoumettreDocument(
  fichiers: File[],
): Promise<ReponseApiUser<DocumentOCR> | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const uid = lireIdUtilisateurStockage()
  if (!uid || fichiers.length === 0) return null
  const formData = new FormData()
  fichiers.forEach((fichier, index) => {
    if (index === 0) formData.append('file_recto', fichier)
    else if (index === 1) formData.append('file_verso', fichier)
  })
  try {
    const jeton = (await import('@/lib/api/session-client')).lireJetonBearer()
    const reponse = await fetch(
      urlService('user', `/ia-data/process_document/${encodeURIComponent(uid)}`),
      {
        method: 'POST',
        headers: jeton ? { Authorization: `Bearer ${jeton}` } : undefined,
        body: formData,
      },
    )
    const json = (await reponse.json().catch(() => ({}))) as Record<string, unknown>
    if (!reponse.ok) {
      return {
        succes: false,
        erreur: String(json.message ?? json.error ?? `Erreur ${reponse.status}`),
      }
    }
    if (String(json.status) !== 'success' || !json.data) {
      return { succes: false, erreur: String(json.message ?? 'Réponse inattendue') }
    }
    const data = json.data as Record<string, unknown>
    const fichier = fichiers[0]!
    const extrait =
      data.extracted_data && typeof data.extracted_data === 'object'
        ? (data.extracted_data as Record<string, unknown>)
        : {}
    const feedback = data.feedback as Record<string, unknown> | undefined
    const messagesBrut = feedback?.messages
    const messagesFeedback = Array.isArray(messagesBrut)
      ? messagesBrut.map((m) => String(m))
      : []
    const doc: DocumentOCR = {
      id: `doc_${Date.now()}`,
      nomFichier: fichier.name,
      typeFichier: fichier.type.includes('pdf') ? 'pdf' : 'image',
      tailleFichier: fichier.size,
      dateTraitement: new Date(),
      statut: 'termine',
      messageTraitement: typeof json.message === 'string' ? json.message : undefined,
      typeDocumentDetecte:
        typeof data.detected_type === 'string' ? data.detected_type : undefined,
      donneesExtraites: extrait,
      messagesFeedback: messagesFeedback.length > 0 ? messagesFeedback : undefined,
      nomFichierRectoApi:
        data.filename_recto !== undefined && data.filename_recto !== null
          ? String(data.filename_recto)
          : data.filename_recto === null
            ? null
            : undefined,
      nomFichierVersoApi:
        data.filename_verso !== undefined && data.filename_verso !== null
          ? String(data.filename_verso)
          : data.filename_verso === null
            ? null
            : undefined,
      statutReponseApi: typeof data.status === 'string' ? data.status : undefined,
      texteExtrait: JSON.stringify(extrait, null, 2),
      nombrePages: 1,
      tempsTraitement: 0,
      precision: 98,
    }
    return { succes: true, donnees: doc }
  } catch {
    return null
  }
}

export async function tryRecupererQuotaConsommation(): Promise<{
  limite: number
  restant: number
} | null> {
  if (!estBackendUtilisateurConfigure()) return null
  const uid = lireIdUtilisateurStockage()
  if (!uid) return null
  try {
    const reponse = await fetchAvecAuth(
      urlService('user', `/ia-data/consumption/${encodeURIComponent(uid)}`),
    )
    if (!reponse.ok) return null
    const json = (await reponse.json()) as Record<string, unknown>
    const d = (extraireData(json) as Record<string, unknown>) ?? {}
    const limite = Number(d.monthly_limit ?? d.quota ?? d.limit ?? d.total ?? 0) || 0
    const utilise = Number(d.current_usage ?? d.used ?? d.usage ?? d.consumed ?? 0) || 0
    return { limite, restant: Math.max(0, limite - utilise) }
  } catch {
    return null
  }
}
