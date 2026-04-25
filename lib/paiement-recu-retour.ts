/**
 * Lecture des paramètres de retour de passerelle de paiement (noms variables selon prestataires).
 */

const CLES_STATUT = [
  'status',
  'payment_status',
  'state',
  'statut',
  'result',
  'paymentStatus',
  'PaymentStatus',
] as const

const CLES_ID_TRANSACTION = [
  'transaction_id',
  'transactionId',
  'trx_id',
  'order_id',
  'orderId',
  'id',
] as const

const CLES_REFERENCE = ['reference', 'ref', 'transaction_reference', 'transactionReference'] as const

export type ParametresRetourPaiementUrl = {
  statutBrut: string | null
  idTransaction: string | null
  reference: string | null
}

export function extraireParametresRetourPaiement(sp: URLSearchParams): ParametresRetourPaiementUrl {
  let statutBrut: string | null = null
  for (const k of CLES_STATUT) {
    const v = sp.get(k)
    if (v != null && String(v).trim() !== '') {
      statutBrut = String(v).trim()
      break
    }
  }

  let idTransaction: string | null = null
  for (const k of CLES_ID_TRANSACTION) {
    const v = sp.get(k)
    if (v != null && String(v).trim() !== '') {
      idTransaction = String(v).trim()
      break
    }
  }

  let reference: string | null = null
  for (const k of CLES_REFERENCE) {
    const v = sp.get(k)
    if (v != null && String(v).trim() !== '') {
      reference = String(v).trim()
      break
    }
  }

  return { statutBrut, idTransaction, reference }
}

export type StatutRecuPaiement = 'succes' | 'echec' | 'en-attente' | 'inconnu'

export function statutDepuisParametreUrl(brut: string | null): StatutRecuPaiement {
  if (brut == null || brut === '') return 'inconnu'
  const s = brut.toLowerCase().replace(/\s+/g, '')
  if (
    [
      'success',
      'successful',
      'paid',
      'completed',
      'complete',
      'ok',
      'approved',
      'capture',
      'captured',
      '1',
      'true',
      'succes',
      'réussi',
      'reussi',
    ].includes(s)
  ) {
    return 'succes'
  }
  if (
    [
      'failed',
      'failure',
      'error',
      'cancelled',
      'canceled',
      'refused',
      'declined',
      '0',
      'false',
      'echec',
      'annulé',
      'annule',
    ].includes(s)
  ) {
    return 'echec'
  }
  if (['pending', 'processing', 'awaiting', 'initiated', 'en_attente', 'attente'].includes(s)) {
    return 'en-attente'
  }
  return 'inconnu'
}
