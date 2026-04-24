import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formaterNombre(valeur: number): string {
  return new Intl.NumberFormat('fr-FR').format(valeur)
}

/**
 * Formate un nombre avec notation abrégée (K, M)
 */
export function formaterNombreAbrege(valeur: number): string {
  if (valeur >= 1000000) {
    return `${(valeur / 1000000).toFixed(1).replace('.0', '')}M`
  }
  if (valeur >= 1000) {
    return `${(valeur / 1000).toFixed(1).replace('.0', '')}K`
  }
  return formaterNombre(valeur)
}

/**
 * Formate un montant en devise
 */
export function formaterMontant(montant: number, devise: string = 'XOF'): string {
  const code = devise ?? 'XOF'
  const estFcfa = code.toUpperCase() === 'XOF'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: code,
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: estFcfa ? 0 : 2,
  }).format(montant)
}

/** Parité officielle BCEAO : 1 EUR = 655,957 F CFA (XOF) */
const TAUX_EUR_VERS_XOF = 655.957

/**
 * Convertit un montant vers le franc CFA (XOF). Si la devise est déjà XOF, retourne le montant arrondi.
 */
export function convertirMontantEnFcfa(montant: number, devise: string = 'XOF'): number {
  const d = devise.toUpperCase()
  if (d === 'XOF') return Math.round(montant)
  if (d === 'EUR') return Math.round(montant * TAUX_EUR_VERS_XOF)
  return Math.round(montant * TAUX_EUR_VERS_XOF)
}

/**
 * Affiche un montant en XOF (format monétaire fr-FR, sans décimales, code ISO affiché).
 */
export function formaterMontantFcfa(montantFcfa: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montantFcfa)
}

/**
 * Formate une date au format court (ex: 15 jan. 2024)
 */
export function formaterDateCourte(date: Date): string {
  if (!estDateValide(date)) return '—'
  return format(date, 'd MMM yyyy', { locale: fr })
}

/**
 * Formate une date au format long (ex: 15 janvier 2024 à 14:30)
 */
export function formaterDateLongue(date: Date): string {
  if (!estDateValide(date)) return '—'
  return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr })
}

function estDateValide(date: Date): boolean {
  return date instanceof Date && !Number.isNaN(date.getTime())
}

/**
 * Date et heure compactes pour tableaux (ex: 23/04/2026 15:42)
 */
export function formaterDateHeure(date: Date): string {
  if (!estDateValide(date)) return '—'
  return format(date, 'dd/MM/yyyy HH:mm', { locale: fr })
}

/** Ex. 23/04/2026 15:49:11 */
export function formaterDateHeureAvecSecondes(date: Date): string {
  if (!estDateValide(date)) return '—'
  return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: fr })
}

/**
 * Formate une date relative (ex: il y a 2 heures)
 */
export function formaterDateRelative(date: Date): string {
  if (!estDateValide(date)) return '—'
  if (isToday(date)) {
    return `Aujourd'hui à ${format(date, 'HH:mm')}`
  }
  if (isYesterday(date)) {
    return `Hier à ${format(date, 'HH:mm')}`
  }
  return formatDistanceToNow(date, { addSuffix: true, locale: fr })
}

/**
 * Formate un pourcentage
 */
export function formaterPourcentage(valeur: number, decimales: number = 1): string {
  return `${valeur.toFixed(decimales).replace('.', ',')}%`
}

/**
 * Formate une variation avec signe
 */
export function formaterVariation(valeur: number): string {
  const signe = valeur >= 0 ? '+' : ''
  return `${signe}${valeur.toFixed(1).replace('.', ',')}%`
}

/**
 * Tronque un texte avec ellipse
 */
export function tronquerTexte(texte: string, longueurMax: number): string {
  if (texte.length <= longueurMax) return texte
  return `${texte.slice(0, longueurMax)}...`
}

/**
 * Génère les initiales d'un nom
 */
/** Découpe « Prénom Nom » : un seul mot → tout dans prenom, nom vide. */
export function separerPrenomNom(chaine: string): { prenom: string; nom: string } {
  const t = chaine.trim().replace(/\s+/g, ' ')
  if (!t) return { prenom: '', nom: '' }
  const i = t.indexOf(' ')
  if (i === -1) return { prenom: t, nom: '' }
  return { prenom: t.slice(0, i), nom: t.slice(i + 1).trim() }
}

export function genererInitiales(prenom: string, nom: string): string {
  const p = (prenom || '').trim()
  const n = (nom || '').trim()
  if (p && n) return `${p.charAt(0)}${n.charAt(0)}`.toUpperCase()
  if (n.length >= 2) return `${n.charAt(0)}${n.charAt(1)}`.toUpperCase()
  const seul = p || n
  if (seul.length >= 1) return `${seul.charAt(0)}${seul.charAt(1) || seul.charAt(0)}`.toUpperCase()
  return '?'
}

/**
 * Formate un numéro de téléphone français
 */
export function formaterTelephone(telephone: string): string {
  const cleaned = telephone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  }
  return telephone
}
