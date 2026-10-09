import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Edge Function: seo-weekly-report
 *
 * Rapport SEO hebdomadaire envoyé par email : clics, impressions, position
 * moyenne de la semaine écoulée vs la précédente, pages clés, meilleures
 * requêtes, pages nouvelles sans impression. Les données viennent de la
 * table seo_gsc_daily (alimentée par gsc-sync, que cette fonction force
 * avant de calculer, pour ne pas rapporter des chiffres périmés).
 *
 * Déclenchement : pg_cron chaque lundi (migration 20261009120000), avec le
 * Bearer service_role. Accepte aussi un appel manuel en service_role.
 *
 * Destinataire : secret SEO_REPORT_TO (défaut infos@busmoov.com).
 * Fenêtre : 7 jours complets se terminant 3 jours avant aujourd'hui
 * (latence Search Console), comparés aux 7 jours précédents.
 */

const KEY_PAGES: { label: string; path: string }[] = [
  { label: 'Accueil', path: '/fr' },
  { label: 'Devis autocar', path: '/fr/devis-autocar' },
  { label: 'Location de bus', path: '/fr/location-bus' },
  { label: 'Service location autocar', path: '/fr/services/location-autocar' },
  { label: 'Service location minibus', path: '/fr/services/location-minibus' },
  { label: 'Guide prix', path: '/fr/blog/prix-location-autocar' },
  { label: 'Bus 50 places', path: '/fr/location-bus-50-places' },
  { label: 'Minibus 20 places', path: '/fr/location-minibus-20-places' },
  { label: 'Grande capacité', path: '/fr/location-autocar-grande-capacite' },
  { label: 'Navette CDG', path: '/fr/navette-aeroport-cdg' },
  { label: 'Paris', path: '/fr/location-autocar/paris' },
  { label: 'Bordeaux', path: '/fr/location-autocar/bordeaux' },
  { label: 'Toulouse', path: '/fr/location-autocar/toulouse' },
  { label: 'Lyon', path: '/fr/location-autocar/lyon' },
]
const BASE_URL = 'https://www.busmoov.com'

interface Row { date: string; dimension: 'page' | 'query'; key: string; clicks: number; impressions: number; position: number }
interface Agg { clicks: number; impressions: number; position: number | null }

/**
 * Appelant autorisé : la clé service_role (appel interne), un JWT
 * service_role, ou le jeton dédié SEO_REPORT_CRON_TOKEN (pg_cron, stocké
 * dans vault sous le nom seo_report_cron_token — la fonction est déployée
 * avec --no-verify-jwt, l'authentification se fait ici).
 */
function isServiceRole(req: Request): boolean {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return false
  const token = auth.slice(7)
  if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) return true
  const cronToken = Deno.env.get('SEO_REPORT_CRON_TOKEN')
  if (cronToken && cronToken.length >= 32 && token === cronToken) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10)
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 24 * 3600 * 1000)
const fmtDateFr = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
const fmtInt = (n: number) => n.toLocaleString('fr-FR')
const fmtPos = (p: number | null) => (p === null ? '—' : p.toFixed(1).replace('.', ','))

function aggregate(rows: Row[]): Agg {
  let clicks = 0, impressions = 0, weighted = 0
  for (const r of rows) {
    clicks += r.clicks
    impressions += r.impressions
    weighted += r.position * r.impressions
  }
  return { clicks, impressions, position: impressions > 0 ? weighted / impressions : null }
}

function delta(cur: number, prev: number): string {
  if (prev === 0) return cur > 0 ? '<span style="color:#27ae60">nouveau</span>' : '='
  const pct = Math.round(((cur - prev) / prev) * 100)
  const color = pct > 0 ? '#27ae60' : pct < 0 ? '#c0392b' : '#7f8c8d'
  return `<span style="color:${color}">${pct > 0 ? '+' : ''}${pct} %</span>`
}

function deltaPos(cur: number | null, prev: number | null): string {
  if (cur === null || prev === null) return ''
  const diff = Math.round((prev - cur) * 10) / 10 // gain = position qui baisse
  if (diff === 0) return ''
  const color = diff > 0 ? '#27ae60' : '#c0392b'
  return ` <span style="color:${color}">(${diff > 0 ? '+' : ''}${diff.toFixed(1).replace('.', ',')})</span>`
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const td = (s: string, align: 'left' | 'right' = 'left') => `<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:${align}">${s}</td>`
const th = (s: string, align: 'left' | 'right' = 'left') => `<th style="padding:6px 10px;border-bottom:2px solid #ddd;text-align:${align};background:#f5f3fa">${s}</th>`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')
  if (!isServiceRole(req)) {
    return new Response(JSON.stringify({ error: 'service_role requis' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    // dry_run: calcule et renvoie le résumé sans envoyer d'email (tests).
    const dryRun = (await req.json().catch(() => ({})))?.dry_run === true

    // 1. Rafraîchir les données GSC (force, pour ignorer la fenêtre de 6 h).
    const sync = await fetch(`${supabaseUrl}/functions/v1/gsc-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ force: true }),
    })
    const syncInfo = await sync.json().catch(() => ({}))
    const syncWarning = sync.ok ? '' : `<p style="color:#c0392b">Synchro Search Console en échec : ${esc(String(syncInfo?.error ?? sync.status))}. Chiffres calculés sur les données déjà en base.</p>`

    // 2. Fenêtres : 7 jours complets terminés il y a 3 jours, et les 7 précédents.
    const today = new Date(isoDay(new Date()))
    const curEnd = addDays(today, -3)
    const curStart = addDays(curEnd, -6)
    const prevEnd = addDays(curStart, -1)
    const prevStart = addDays(prevEnd, -6)

    const { data, error } = await supabase
      .from('seo_gsc_daily')
      .select('date,dimension,key,clicks,impressions,position')
      .gte('date', isoDay(prevStart))
      .lte('date', isoDay(curEnd))
    if (error) throw new Error(`Lecture seo_gsc_daily : ${error.message}`)
    const rows = (data ?? []) as Row[]
    const inWindow = (r: Row, start: Date, end: Date) => r.date >= isoDay(start) && r.date <= isoDay(end)
    const cur = rows.filter((r) => inWindow(r, curStart, curEnd))
    const prev = rows.filter((r) => inWindow(r, prevStart, prevEnd))

    // 3. Global (dimension page : chaque impression comptée une fois).
    const gCur = aggregate(cur.filter((r) => r.dimension === 'page'))
    const gPrev = aggregate(prev.filter((r) => r.dimension === 'page'))
    const nbPagesCur = new Set(cur.filter((r) => r.dimension === 'page').map((r) => r.key)).size
    const nbQueriesCur = new Set(cur.filter((r) => r.dimension === 'query').map((r) => r.key)).size

    // 4. Pages clés.
    const byPage = (list: Row[], path: string) => aggregate(list.filter((r) => r.dimension === 'page' && r.key === `${BASE_URL}${path}`))
    const keyRows = KEY_PAGES.map(({ label, path }) => {
      const c = byPage(cur, path), p = byPage(prev, path)
      return `<tr>${td(`<a href="${BASE_URL}${path}" style="color:#7b2cbf">${esc(label)}</a>`)}${td(fmtInt(c.impressions), 'right')}${td(delta(c.impressions, p.impressions), 'right')}${td(fmtInt(c.clicks), 'right')}${td(fmtPos(c.position) + deltaPos(c.position, p.position), 'right')}</tr>`
    }).join('')

    // 5. Top requêtes et top pages de la semaine.
    const top = (list: Row[], dimension: 'page' | 'query', n: number) => {
      const map = new Map<string, Row[]>()
      for (const r of list) if (r.dimension === dimension) map.set(r.key, [...(map.get(r.key) ?? []), r])
      return [...map.entries()].map(([key, rs]) => ({ key, ...aggregate(rs) })).sort((a, b) => b.impressions - a.impressions).slice(0, n)
    }
    const topQueries = top(cur, 'query', 10).map((q) => `<tr>${td(esc(q.key))}${td(fmtInt(q.impressions), 'right')}${td(fmtInt(q.clicks), 'right')}${td(fmtPos(q.position), 'right')}</tr>`).join('')
    const topPages = top(cur, 'page', 10).map((pg) => `<tr>${td(`<a href="${pg.key}" style="color:#7b2cbf">${esc(pg.key.replace(BASE_URL, ''))}</a>`)}${td(fmtInt(pg.impressions), 'right')}${td(fmtInt(pg.clicks), 'right')}${td(fmtPos(pg.position), 'right')}</tr>`).join('')

    // 6. Requêtes qui approchent du top 10 (position 11-20, ≥ 5 impressions).
    const nearTop = top(cur, 'query', 500).filter((q) => q.position !== null && q.position <= 20 && q.position > 10 && q.impressions >= 5).slice(0, 8)
    const nearTopRows = nearTop.length
      ? nearTop.map((q) => `<tr>${td(esc(q.key))}${td(fmtInt(q.impressions), 'right')}${td(fmtPos(q.position), 'right')}</tr>`).join('')
      : `<tr>${td('Aucune requête entre les positions 11 et 20 cette semaine.')}</tr>`

    const periode = `${fmtDateFr(isoDay(curStart))} au ${fmtDateFr(isoDay(curEnd))}`
    const subject = `SEO Busmoov, semaine du ${periode} : ${fmtInt(gCur.clicks)} clics, ${fmtInt(gCur.impressions)} impressions, position ${fmtPos(gCur.position)}`

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;max-width:760px">
  <h2 style="color:#7b2cbf;margin-bottom:4px">Rapport SEO Busmoov</h2>
  <p style="margin-top:0;color:#666">Semaine du ${periode}, comparée aux 7 jours précédents. Source : Search Console (${fmtInt(nbPagesCur)} pages et ${fmtInt(nbQueriesCur)} requêtes avec impressions).</p>
  ${syncWarning}
  <table style="border-collapse:collapse;margin:12px 0">
    <tr>${th('Indicateur')}${th('Semaine', 'right')}${th('Évolution', 'right')}</tr>
    <tr>${td('Clics')}${td(fmtInt(gCur.clicks), 'right')}${td(delta(gCur.clicks, gPrev.clicks), 'right')}</tr>
    <tr>${td('Impressions')}${td(fmtInt(gCur.impressions), 'right')}${td(delta(gCur.impressions, gPrev.impressions), 'right')}</tr>
    <tr>${td('Position moyenne')}${td(fmtPos(gCur.position), 'right')}${td(deltaPos(gCur.position, gPrev.position) || '=', 'right')}</tr>
  </table>

  <h3 style="color:#7b2cbf">Pages clés</h3>
  <table style="border-collapse:collapse;width:100%">
    <tr>${th('Page')}${th('Impressions', 'right')}${th('Évol.', 'right')}${th('Clics', 'right')}${th('Position', 'right')}</tr>
    ${keyRows}
  </table>

  <h3 style="color:#7b2cbf">Requêtes proches du top 10</h3>
  <table style="border-collapse:collapse;width:100%">
    <tr>${th('Requête')}${th('Impressions', 'right')}${th('Position', 'right')}</tr>
    ${nearTopRows}
  </table>

  <h3 style="color:#7b2cbf">Top 10 requêtes de la semaine</h3>
  <table style="border-collapse:collapse;width:100%">
    <tr>${th('Requête')}${th('Impressions', 'right')}${th('Clics', 'right')}${th('Position', 'right')}</tr>
    ${topQueries}
  </table>

  <h3 style="color:#7b2cbf">Top 10 pages de la semaine</h3>
  <table style="border-collapse:collapse;width:100%">
    <tr>${th('Page')}${th('Impressions', 'right')}${th('Clics', 'right')}${th('Position', 'right')}</tr>
    ${topPages}
  </table>

  <p style="color:#888;font-size:12px;margin-top:20px">Rapport automatique (Edge Function seo-weekly-report). Détail dans l'admin Busmoov, menu SEO. Les positions sont pondérées par les impressions ; une position qui baisse est un gain.</p>
</div>`

    // 7. Envoi via send-email (service_role, type custom).
    const to = Deno.env.get('SEO_REPORT_TO') || 'infos@busmoov.com'
    if (dryRun) {
      return new Response(JSON.stringify({ status: 'dry_run', to, subject, periode, clicks: gCur.clicks, impressions: gCur.impressions, position: gCur.position, sync: syncInfo?.status ?? sync.status, sync_error: syncInfo?.error ?? null }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    const resp = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ type: 'custom', to, subject, html_content: html, data: { template_key: 'seo_weekly_report' } }),
    })
    if (!resp.ok) throw new Error(`send-email ${resp.status} : ${await resp.text()}`)

    return new Response(JSON.stringify({ status: 'sent', to, periode, clicks: gCur.clicks, impressions: gCur.impressions, position: gCur.position, sync: syncInfo?.status ?? sync.status }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('seo-weekly-report:', msg)
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})
