import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle, ExternalLink } from 'lucide-react'

/**
 * Page admin SEO — positions et trafic Google en automatique via
 * l'API Search Console (Edge Function gsc-sync, table seo_gsc_daily).
 */

// Mots-clés suivis (alignés sur le tableau de suivi partagé)
const TRACKED_KEYWORDS = [
  'location autocar avec chauffeur',
  'location autocar',
  'location bus avec chauffeur',
  'location de bus',
  'louer un bus',
  'location autocar pas cher',
  'devis autocar',
  'prix location autocar',
  'location minibus avec chauffeur',
  'location minibus 15 places',
  'transfert aéroport groupe',
  'autocar sortie scolaire',
  'location autocar mariage',
  'location autocar paris',
  'location autocar lyon',
  'location autocar marseille',
  'location autocar toulouse',
  'location autocar bordeaux',
  'location autocar lille',
  'location autocar nantes',
  'location autocar montpellier',
  'location autocar strasbourg',
  'location autocar grenoble',
]

interface GscRow {
  date: string
  dimension: 'query' | 'page'
  key: string
  clicks: number
  impressions: number
  position: number | null
}

interface SyncState {
  last_sync_at: string | null
  last_error: string | null
}

const dayMs = 24 * 3600 * 1000
const isoDay = (d: Date) => d.toISOString().slice(0, 10)

function aggregate(rows: GscRow[]) {
  let clicks = 0
  let impressions = 0
  let posWeighted = 0
  for (const r of rows) {
    clicks += r.clicks
    impressions += r.impressions
    if (r.position != null) posWeighted += r.position * r.impressions
  }
  return {
    clicks,
    impressions,
    ctr: impressions ? (clicks / impressions) * 100 : 0,
    position: impressions ? posWeighted / impressions : null,
  }
}

function Delta({ current, previous, invert = false }: { current: number | null; previous: number | null; invert?: boolean }) {
  if (current == null || previous == null || previous === 0) return null
  const diff = current - previous
  const better = invert ? diff < 0 : diff > 0
  if (Math.abs(diff) < 0.005) return <Minus className="w-3 h-3 inline text-gray-400" />
  const Icon = diff > 0 ? TrendingUp : TrendingDown
  return (
    <span className={`text-xs font-medium ${better ? 'text-green-600' : 'text-red-600'}`}>
      <Icon className="w-3 h-3 inline mr-0.5" />
      {diff > 0 ? '+' : ''}{Math.abs(diff) >= 10 ? Math.round(diff) : diff.toFixed(1)}
    </span>
  )
}

export function SeoPage() {
  const queryClient = useQueryClient()
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  // Déclenche la synchro (la fonction répond "fresh" si < 6h)
  const syncQuery = useQuery({
    queryKey: ['seo-gsc-sync'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('gsc-sync', { body: {} })
      if (error) throw error
      return data
    },
    staleTime: 30 * 60 * 1000,
    retry: false,
  })

  const stateQuery = useQuery({
    queryKey: ['seo-sync-state', syncQuery.dataUpdatedAt],
    queryFn: async (): Promise<SyncState | null> => {
      const { data } = await supabase.from('seo_sync_state').select('last_sync_at, last_error').eq('id', 'gsc').maybeSingle()
      return data
    },
  })

  const dataQuery = useQuery({
    queryKey: ['seo-gsc-daily', syncQuery.dataUpdatedAt],
    queryFn: async (): Promise<GscRow[]> => {
      const since = isoDay(new Date(Date.now() - 56 * dayMs))
      const { data, error } = await supabase
        .from('seo_gsc_daily')
        .select('date, dimension, key, clicks, impressions, position')
        .gte('date', since)
        .order('date', { ascending: true })
        .limit(20000)
      if (error) throw error
      return (data ?? []) as GscRow[]
    },
  })

  const forceSync = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const { data, error } = await supabase.functions.invoke('gsc-sync', { body: { force: true } })
      if (error) throw error
      setSyncMessage(data?.status === 'synced' ? `Synchronisé : ${data.rows} lignes.` : 'Données déjà à jour.')
      queryClient.invalidateQueries({ queryKey: ['seo-gsc-daily'] })
      queryClient.invalidateQueries({ queryKey: ['seo-sync-state'] })
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : 'Erreur de synchronisation')
    } finally {
      setSyncing(false)
    }
  }

  const rows = dataQuery.data ?? []
  const cutoff28 = isoDay(new Date(Date.now() - 28 * dayMs))
  const queryRows = rows.filter((r) => r.dimension === 'query')
  const pageRows = rows.filter((r) => r.dimension === 'page')
  const current = aggregate(queryRows.filter((r) => r.date >= cutoff28))
  const previous = aggregate(queryRows.filter((r) => r.date < cutoff28))

  // Clics par jour (28 derniers jours) pour le mini-graphique
  const clicksByDay = new Map<string, number>()
  for (const r of queryRows.filter((r) => r.date >= cutoff28)) {
    clicksByDay.set(r.date, (clicksByDay.get(r.date) ?? 0) + r.clicks)
  }
  const days: Array<{ date: string; clicks: number }> = []
  for (let i = 27; i >= 0; i--) {
    const d = isoDay(new Date(Date.now() - i * dayMs))
    days.push({ date: d, clicks: clicksByDay.get(d) ?? 0 })
  }
  const maxClicks = Math.max(1, ...days.map((d) => d.clicks))

  // Mots-clés suivis : position pondérée 7 derniers jours vs 7 précédents
  const cutoff7 = isoDay(new Date(Date.now() - 7 * dayMs))
  const cutoff14 = isoDay(new Date(Date.now() - 14 * dayMs))
  const tracked = TRACKED_KEYWORDS.map((kw) => {
    const match = (r: GscRow) => r.key.toLowerCase() === kw
    const last7 = aggregate(queryRows.filter((r) => r.date >= cutoff7 && match(r)))
    const prev7 = aggregate(queryRows.filter((r) => r.date >= cutoff14 && r.date < cutoff7 && match(r)))
    const total28 = aggregate(queryRows.filter((r) => r.date >= cutoff28 && match(r)))
    return { kw, last7, prev7, total28 }
  })

  // Top requêtes et top pages sur 28 jours
  const topBy = (source: GscRow[]) => {
    const byKey = new Map<string, GscRow[]>()
    for (const r of source.filter((r) => r.date >= cutoff28)) {
      byKey.set(r.key, [...(byKey.get(r.key) ?? []), r])
    }
    return [...byKey.entries()]
      .map(([key, rs]) => ({ key, ...aggregate(rs) }))
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
  }
  const topQueries = topBy(queryRows).slice(0, 20)
  const topPages = topBy(pageRows).slice(0, 15)

  const setupError = stateQuery.data?.last_error
  const hasData = rows.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">SEO — Google Search Console</h1>
          <p className="text-sm text-gray-500">
            {stateQuery.data?.last_sync_at
              ? `Dernière synchronisation : ${new Date(stateQuery.data.last_sync_at).toLocaleString('fr-FR')}`
              : 'Jamais synchronisé'}
            {' · les données Google arrivent avec ~2 jours de latence'}
          </p>
        </div>
        <button onClick={forceSync} disabled={syncing} className="btn btn-secondary inline-flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          Synchroniser
        </button>
      </div>

      {syncMessage && <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">{syncMessage}</div>}

      {setupError && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-none mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Connexion à Search Console non configurée</p>
            <p className="mb-2">{setupError}</p>
            <p>
              Configuration (une seule fois) : 1) console.cloud.google.com → créer un projet → activer l'API
              « Google Search Console API » → Comptes de service → créer un compte + clé JSON. 2) Search Console →
              Paramètres → Utilisateurs et autorisations → ajouter l'email du compte de service (accès complet).
              3) Enregistrer le contenu du JSON dans le secret Supabase <code className="bg-amber-100 px-1 rounded">GSC_SERVICE_ACCOUNT_KEY</code>.
            </p>
          </div>
        </div>
      )}

      {/* KPIs 28 jours */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Clics (28 j)</p>
          <p className="text-2xl font-bold">{current.clicks} <Delta current={current.clicks} previous={previous.clicks} /></p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Impressions (28 j)</p>
          <p className="text-2xl font-bold">{current.impressions} <Delta current={current.impressions} previous={previous.impressions} /></p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">CTR (28 j)</p>
          <p className="text-2xl font-bold">{current.ctr.toFixed(1).replace('.', ',')} %</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Position moyenne</p>
          <p className="text-2xl font-bold">
            {current.position != null && current.impressions > 0 ? current.position.toFixed(1).replace('.', ',') : '—'}
            {' '}<Delta current={current.position} previous={previous.position} invert />
          </p>
        </div>
      </div>

      {/* Clics par jour */}
      {hasData && (
        <div className="card">
          <h2 className="font-semibold mb-3">Clics par jour (28 derniers jours)</h2>
          <div className="flex items-end gap-1 h-24">
            {days.map((d) => (
              <div key={d.date} className="flex-1 bg-magenta/70 rounded-t hover:bg-magenta transition-colors" style={{ height: `${(d.clicks / maxClicks) * 100}%`, minHeight: d.clicks > 0 ? 4 : 1 }} title={`${d.date} : ${d.clicks} clic(s)`} />
            ))}
          </div>
        </div>
      )}

      {!hasData && !setupError && (
        <div className="card text-center text-gray-500 py-10">
          {dataQuery.isLoading || syncQuery.isLoading
            ? 'Chargement des données Search Console…'
            : 'Pas encore de données : Google commence à remonter des statistiques quelques jours après la validation de la propriété (créée le 4 septembre 2026). Reviens dans quelques jours.'}
        </div>
      )}

      {/* Mots-clés suivis */}
      <div className="card overflow-x-auto">
        <h2 className="font-semibold mb-3">Mots-clés suivis ({TRACKED_KEYWORDS.length})</h2>
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-400 border-b">
              <th className="py-2 pr-4">Mot-clé</th>
              <th className="py-2 pr-4">Position (7 j)</th>
              <th className="py-2 pr-4">Tendance</th>
              <th className="py-2 pr-4">Impressions (28 j)</th>
              <th className="py-2">Clics (28 j)</th>
            </tr>
          </thead>
          <tbody>
            {tracked.map(({ kw, last7, prev7, total28 }) => (
              <tr key={kw} className="border-b border-gray-50">
                <td className="py-2 pr-4 font-medium">{kw}</td>
                <td className="py-2 pr-4 tabular-nums">
                  {last7.position != null && last7.impressions > 0 ? last7.position.toFixed(1).replace('.', ',') : <span className="text-gray-400 italic">NR</span>}
                </td>
                <td className="py-2 pr-4"><Delta current={last7.position} previous={prev7.impressions > 0 ? prev7.position : null} invert /></td>
                <td className="py-2 pr-4 tabular-nums">{total28.impressions || '—'}</td>
                <td className="py-2 tabular-nums">{total28.clicks || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top requêtes / top pages */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card overflow-x-auto">
          <h2 className="font-semibold mb-3">Top requêtes (28 j)</h2>
          {topQueries.length === 0 ? <p className="text-sm text-gray-400">Aucune donnée pour l'instant.</p> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400 border-b">
                  <th className="py-2 pr-3">Requête</th><th className="py-2 pr-3">Clics</th><th className="py-2 pr-3">Impr.</th><th className="py-2">Pos.</th>
                </tr>
              </thead>
              <tbody>
                {topQueries.map((q) => (
                  <tr key={q.key} className="border-b border-gray-50">
                    <td className="py-1.5 pr-3">{q.key}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{q.clicks}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{q.impressions}</td>
                    <td className="py-1.5 tabular-nums">{q.position?.toFixed(1).replace('.', ',') ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card overflow-x-auto">
          <h2 className="font-semibold mb-3">Top pages (28 j)</h2>
          {topPages.length === 0 ? <p className="text-sm text-gray-400">Aucune donnée pour l'instant.</p> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-400 border-b">
                  <th className="py-2 pr-3">Page</th><th className="py-2 pr-3">Clics</th><th className="py-2 pr-3">Impr.</th><th className="py-2">Pos.</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p) => (
                  <tr key={p.key} className="border-b border-gray-50">
                    <td className="py-1.5 pr-3 max-w-[220px] truncate">
                      <a href={p.key} target="_blank" rel="noreferrer" className="text-magenta hover:underline inline-flex items-center gap-1">
                        {p.key.replace('https://www.busmoov.com', '')} <ExternalLink className="w-3 h-3 flex-none" />
                      </a>
                    </td>
                    <td className="py-1.5 pr-3 tabular-nums">{p.clicks}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{p.impressions}</td>
                    <td className="py-1.5 tabular-nums">{p.position?.toFixed(1).replace('.', ',') ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
