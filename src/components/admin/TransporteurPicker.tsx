import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn, isTransporteurFictif } from '@/lib/utils'

type TransporteurOption = {
  id: string
  number?: string | null
  name?: string | null
  city?: string | null
  country_code?: string | null
  tags?: string[] | null
}

const MAX_RESULTS = 40

/**
 * Sélecteur de transporteur : les fictifs (tag `fictif`) sont proposés en
 * boutons au-dessus du champ (un clic = devis sans fournisseur), et les
 * vrais transporteurs se cherchent par nom, numéro ou ville dans un champ
 * texte au lieu d'une liste déroulante de plus de mille lignes.
 */
export function TransporteurPicker({
  value,
  onChange,
  transporteurs,
  placeholder = 'Rechercher un transporteur (nom, n°, ville)…',
  allowEmpty = true,
}: {
  value: string | null | undefined
  onChange: (id: string) => void
  transporteurs: TransporteurOption[]
  placeholder?: string
  allowEmpty?: boolean
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const fictifs = useMemo(() => transporteurs.filter(isTransporteurFictif), [transporteurs])
  const selected = useMemo(() => transporteurs.find((t) => t.id === value) || null, [transporteurs, value])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const reels = transporteurs.filter((t) => !isTransporteurFictif(t))
    if (!q) return reels.slice(0, MAX_RESULTS)
    const terms = q.split(/\s+/)
    return reels
      .filter((t) => {
        const hay = `${t.number || ''} ${t.name || ''} ${t.city || ''}`.toLowerCase()
        return terms.every((term) => hay.includes(term))
      })
      .slice(0, MAX_RESULTS)
  }, [transporteurs, query])

  // Fermer la liste au clic en dehors
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const label = (t: TransporteurOption) =>
    `${t.number} - ${t.name}${t.city ? ` (${t.city})` : ''}`

  const pick = (id: string) => {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="space-y-2">
      {/* Fictifs : un clic suffit */}
      {fictifs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">🎭 Sans fournisseur :</span>
          {fictifs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => pick(t.id)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                value === t.id
                  ? 'bg-purple text-white border-purple'
                  : 'bg-purple-50 text-purple border-purple-200 hover:bg-purple-100',
              )}
              title={`${t.number} - ${t.name} (transporteur fictif)`}
            >
              {t.number}
            </button>
          ))}
        </div>
      )}

      {/* Sélection courante */}
      {selected ? (
        <div className="flex items-center justify-between gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
          <span className="text-sm font-medium truncate">
            {label(selected)}
            {isTransporteurFictif(selected) && <span className="ml-2 text-xs text-purple">[fictif]</span>}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="text-xs text-purple hover:underline"
              onClick={() => { setOpen(true); setQuery('') }}
            >
              Changer
            </button>
            {allowEmpty && (
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-red-500"
                onClick={() => onChange('')}
                title="Retirer le transporteur"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Recherche */}
      {(!selected || open) && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder={placeholder}
            value={query}
            autoFocus={open && !!selected}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
          />
          {open && (
            <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
              {results.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">Aucun transporteur trouvé</div>
              ) : (
                results.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => pick(t.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-purple-50',
                      value === t.id && 'bg-purple-50 font-medium',
                    )}
                  >
                    <span className="text-gray-500 mr-2">{t.number}</span>
                    {t.name}
                    {t.city && <span className="text-gray-400 ml-2">({t.city})</span>}
                    {t.country_code && t.country_code !== 'FR' && (
                      <span className="text-gray-400 ml-2 text-xs">{t.country_code}</span>
                    )}
                  </button>
                ))
              )}
              {!query && results.length === MAX_RESULTS && (
                <div className="px-3 py-1.5 text-xs text-gray-400 border-t">Tapez pour affiner ({transporteurs.length} transporteurs)</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
