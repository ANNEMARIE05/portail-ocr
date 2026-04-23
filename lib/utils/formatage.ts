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
export function formaterMontant(montant: number, devise: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: devise,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(montant)
}

/**
 * Formate une date au format court (ex: 15 jan. 2024)
 */
export function formaterDateCourte(date: Date): string {
  return format(date, 'd MMM yyyy', { locale: fr })
}

/**
 * Formate une date au format long (ex: 15 janvier 2024 à 14:30)
 */
export function formaterDateLongue(date: Date): string {
  return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr })
}

/**
 * Formate une date relative (ex: il y a 2 heures)
 */
export function formaterDateRelative(date: Date): string {
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
export function genererInitiales(prenom: string, nom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
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
