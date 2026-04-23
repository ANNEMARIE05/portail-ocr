'use client'

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PropsChampRecherche {
  placeholder?: string
  valeur?: string
  onChange: (valeur: string) => void
  delaiDebounce?: number
  className?: string
}

export function ChampRecherche({
  placeholder = 'Rechercher...',
  valeur: valeurExterne,
  onChange,
  delaiDebounce = 300,
  className,
}: PropsChampRecherche) {
  const [valeurInterne, setValeurInterne] = useState(valeurExterne || '')

  useEffect(() => {
    if (valeurExterne !== undefined) {
      setValeurInterne(valeurExterne)
    }
  }, [valeurExterne])

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(valeurInterne)
    }, delaiDebounce)

    return () => clearTimeout(timer)
  }, [valeurInterne, delaiDebounce, onChange])

  const effacer = () => {
    setValeurInterne('')
    onChange('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={valeurInterne}
        onChange={(e) => setValeurInterne(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 text-sm',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'transition-colors'
        )}
      />
      {valeurInterne && (
        <button
          onClick={effacer}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Effacer la recherche</span>
        </button>
      )}
    </div>
  )
}
