'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { StatutDemande, StatutTransaction } from '@/lib/types-admin'

type TypeBadge = 'succes' | 'erreur' | 'attention' | 'info' | 'neutre'

interface PropsBadgeStatut {
  type: TypeBadge
  children: React.ReactNode
  className?: string
}

const configStyles: Record<TypeBadge, string> = {
  succes: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  erreur: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  attention: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  info: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  neutre: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
}

export function BadgeStatut({ type, children, className }: PropsBadgeStatut) {
  return (
    <Badge variant="outline" className={cn('font-medium', configStyles[type], className)}>
      {children}
    </Badge>
  )
}

// Mappings spécifiques pour les statuts utilisés dans l'app
export function BadgeStatutUtilisateur({ statut }: { statut: 'actif' | 'inactif' | 'suspendu' }) {
  const config: Record<typeof statut, { type: TypeBadge; label: string }> = {
    actif: { type: 'succes', label: 'Actif' },
    inactif: { type: 'neutre', label: 'Inactif' },
    suspendu: { type: 'erreur', label: 'Suspendu' },
  }
  const { type, label } = config[statut]
  return <BadgeStatut type={type}>{label}</BadgeStatut>
}

export function BadgeStatutTransaction({ statut }: { statut: StatutTransaction }) {
  const config: Record<StatutTransaction, { type: TypeBadge; label: string }> = {
    succes: { type: 'succes', label: 'Succès' },
    echec: { type: 'erreur', label: 'Échec' },
  }
  const { type, label } = config[statut]
  return <BadgeStatut type={type}>{label}</BadgeStatut>
}

export function BadgeStatutDemandeSuppression({ statut }: { statut: StatutDemande }) {
  const config: Record<StatutDemande, { type: TypeBadge; label: string }> = {
    'en-attente': { type: 'attention', label: 'En attente' },
    approuve: { type: 'succes', label: 'Approuvé' },
    rejete: { type: 'neutre', label: 'Rejeté' },
  }
  const { type, label } = config[statut]
  return <BadgeStatut type={type}>{label}</BadgeStatut>
}

export function BadgeRole({ role }: { role: 'super-admin' | 'admin' | 'moderateur' }) {
  const config: Record<typeof role, { type: TypeBadge; label: string }> = {
    'super-admin': { type: 'erreur', label: 'Super Admin' },
    admin: { type: 'info', label: 'Admin' },
    moderateur: { type: 'neutre', label: 'Modérateur' },
  }
  const { type, label } = config[role]
  return <BadgeStatut type={type}>{label}</BadgeStatut>
}

export function BadgePriorite({ priorite }: { priorite: 'basse' | 'normale' | 'haute' | 'urgente' }) {
  const config: Record<typeof priorite, { type: TypeBadge; label: string }> = {
    basse: { type: 'neutre', label: 'Basse' },
    normale: { type: 'info', label: 'Normale' },
    haute: { type: 'attention', label: 'Haute' },
    urgente: { type: 'erreur', label: 'Urgente' },
  }
  const { type, label } = config[priorite]
  return <BadgeStatut type={type}>{label}</BadgeStatut>
}
