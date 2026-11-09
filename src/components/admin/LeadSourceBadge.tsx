import { Globe } from 'lucide-react'
import { parseLeadSource } from '@/lib/lead-source'
import { cn } from '@/lib/utils'

/**
 * Origine d'un lead (site d'entrée + canal), à partir de `demande.source`.
 * `compact` : une ligne pour les listes ; sinon le détail (page d'arrivée, référent).
 */
export function LeadSourceBadge({ source, compact = false, className }: { source: string | null | undefined; compact?: boolean; className?: string }) {
  const s = parseLeadSource(source)
  if (!s) {
    return compact ? null : <p className={cn('text-sm text-gray-400', className)}>Non renseignée</p>
  }
  const microsite = s.site !== 'busmoov.com'
  const sitePill = (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', microsite ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700')}>
      <Globe size={11} />
      {s.site}
    </span>
  )
  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-gray-500', className)} title={s.brut}>
        {sitePill}
        <span>{s.canal}</span>
      </div>
    )
  }
  return (
    <div className={cn('space-y-1', className)} title={s.brut}>
      <div className="flex flex-wrap items-center gap-2">
        {sitePill}
        <span className="font-medium">{s.canal}</span>
      </div>
      {s.landing && <p className="text-xs text-gray-500 truncate">Page d'arrivée : {s.landing}</p>}
      {s.referrer && <p className="text-xs text-gray-500 truncate">Référent : {s.referrer}</p>}
    </div>
  )
}
