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
// Propriété GA4 Busmoov. Le compte de service GSC_SERVICE_ACCOUNT_KEY doit être
// Lecteur sur la propriété, sinon la section conversions est omise (message dans l'email).
const GA4_PROPERTY = '552782015'

interface Row { date: string; dimension: 'page' | 'query'; key: string; clicks: number; impressions: number; position: number }
interface Agg { clicks: number; impressions: number; position: number | null }
interface Ga4Channel { channel: string; sessions: number; keyEvents: number; prevSessions: number; prevKeyEvents: number }
interface Ga4Summary { channels: Ga4Channel[]; topPages: { page: string; keyEvents: number }[] }

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

function base64url(data: Uint8Array): string {
  let s = ''
  for (const b of data) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Access token Google (même compte de service que gsc-sync, scope Analytics). */
async function getGoogleAccessToken(serviceAccount: { client_email: string; private_key: string }, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const claims = base64url(new TextEncoder().encode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })))
  const signingInput = `${header}.${claims}`
  const pem = serviceAccount.private_key.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '')
  const keyData = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey('pkcs8', keyData, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  const jwt = `${signingInput}.${base64url(new Uint8Array(signature))}`
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  if (!res.ok) throw new Error(`Échange de token Google refusé (${res.status}) : ${await res.text()}`)
  return (await res.json()).access_token
}

/** Sessions + événements clés GA4 par canal (semaine vs précédente) et pages qui convertissent. */
async function fetchGa4Summary(curStart: string, curEnd: string, prevStart: string, prevEnd: string): Promise<Ga4Summary> {
  const rawKey = Deno.env.get('GSC_SERVICE_ACCOUNT_KEY')
  if (!rawKey) throw new Error('Secret GSC_SERVICE_ACCOUNT_KEY absent')
  const token = await getGoogleAccessToken(JSON.parse(rawKey), 'https://www.googleapis.com/auth/analytics.readonly')
  const run = async (body: unknown) => {
    const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`GA4 runReport ${res.status} : ${await res.text()}`)
    return res.json()
  }

  // Canaux : deux plages de dates dans la même requête (date_range_0 = semaine courante).
  const byChannel = await run({
    dateRanges: [
      { startDate: curStart, endDate: curEnd },
      { startDate: prevStart, endDate: prevEnd },
    ],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }, { name: 'keyEvents' }],
    limit: 20,
  })
  const channels = new Map<string, Ga4Channel>()
  for (const row of byChannel.rows ?? []) {
    const [channel, range] = row.dimensionValues.map((v: { value: string }) => v.value)
    const entry = channels.get(channel) ?? { channel, sessions: 0, keyEvents: 0, prevSessions: 0, prevKeyEvents: 0 }
    const sessions = Number(row.metricValues[0].value)
    const keyEvents = Number(row.metricValues[1].value)
    if (range === 'date_range_0' || range === undefined) { entry.sessions = sessions; entry.keyEvents = keyEvents }
    else { entry.prevSessions = sessions; entry.prevKeyEvents = keyEvents }
    channels.set(channel, entry)
  }

  const byPage = await run({
    dateRanges: [{ startDate: curStart, endDate: curEnd }],
    dimensions: [{ name: 'landingPage' }],
    metrics: [{ name: 'keyEvents' }],
    orderBys: [{ metric: { metricName: 'keyEvents' }, desc: true }],
    limit: 8,
  })
  const topPages = (byPage.rows ?? [])
    .map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => ({ page: row.dimensionValues[0].value, keyEvents: Number(row.metricValues[0].value) }))
    .filter((p: { keyEvents: number }) => p.keyEvents > 0)

  return { channels: [...channels.values()].sort((a, b) => b.sessions - a.sessions), topPages }
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

    // PostgREST plafonne chaque réponse à 1 000 lignes, même en service_role :
    // 14 jours de requêtes + pages approchent ce seuil, lecture par pages.
    const PAGE = 1000
    const rows: Row[] = []
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from('seo_gsc_daily')
        .select('date,dimension,key,clicks,impressions,position')
        .gte('date', isoDay(prevStart))
        .lte('date', isoDay(curEnd))
        .order('date', { ascending: true })
        .order('dimension', { ascending: true })
        .order('key', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) throw new Error(`Lecture seo_gsc_daily : ${error.message}`)
      const batch = (data ?? []) as Row[]
      rows.push(...batch)
      if (batch.length < PAGE) break
    }
    const inWindow = (r: Row, start: Date, end: Date) => r.date >= isoDay(start) && r.date <= isoDay(end)
    const cur = rows.filter((r) => inWindow(r, curStart, curEnd))
    const prev = rows.filter((r) => inWindow(r, prevStart, prevEnd))

    // 2 bis. Conversions GA4 (même fenêtre). Section omise si l'accès manque.
    let ga4: Ga4Summary | null = null
    let ga4Error = ''
    try {
      ga4 = await fetchGa4Summary(isoDay(curStart), isoDay(curEnd), isoDay(prevStart), isoDay(prevEnd))
    } catch (e) {
      ga4Error = e instanceof Error ? e.message : String(e)
      console.error('seo-weekly-report GA4:', ga4Error)
    }

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
    const plural = (n: number, mot: string) => `${fmtInt(n)} ${mot}${n > 1 ? 's' : ''}`
    const totalLeads = ga4 ? ga4.channels.reduce((s, c) => s + c.keyEvents, 0) : null
    const prevLeads = ga4 ? ga4.channels.reduce((s, c) => s + c.prevKeyEvents, 0) : 0
    const subject = `SEO Busmoov, semaine du ${periode} : ${plural(gCur.clicks, 'clic')}, ${plural(gCur.impressions, 'impression')}`
      + (totalLeads !== null ? `, ${plural(totalLeads, 'lead')}` : `, position ${fmtPos(gCur.position)}`)

    // Section conversions (GA4) : leads par canal + pages qui convertissent.
    let ga4Html = ''
    if (ga4) {
      const channelRows = ga4.channels
        .filter((c) => c.sessions > 0 || c.prevSessions > 0)
        .map((c) => `<tr>${td(esc(c.channel))}${td(fmtInt(c.sessions), 'right')}${td(delta(c.sessions, c.prevSessions), 'right')}${td(fmtInt(c.keyEvents), 'right')}${td(delta(c.keyEvents, c.prevKeyEvents), 'right')}</tr>`)
        .join('')
      const pageRows = ga4.topPages.length
        ? ga4.topPages.map((p) => `<tr>${td(`<a href="${BASE_URL}${esc(p.page)}" style="color:#7b2cbf">${esc(p.page)}</a>`)}${td(fmtInt(p.keyEvents), 'right')}</tr>`).join('')
        : `<tr>${td('Aucun lead attribué à une page cette semaine.')}</tr>`
      ga4Html = `
  <h3 style="color:#7b2cbf">Conversions (GA4) : ${plural(totalLeads ?? 0, 'lead')} ${delta(totalLeads ?? 0, prevLeads)}</h3>
  <table style="border-collapse:collapse;width:100%">
    <tr>${th('Canal')}${th('Sessions', 'right')}${th('Évol.', 'right')}${th('Leads', 'right')}${th('Évol.', 'right')}</tr>
    ${channelRows}
  </table>
  <h3 style="color:#7b2cbf">Pages qui convertissent</h3>
  <table style="border-collapse:collapse;width:100%">
    <tr>${th('Page d’arrivée')}${th('Leads', 'right')}</tr>
    ${pageRows}
  </table>`
    } else {
      ga4Html = `
  <p style="color:#c0392b;font-size:13px">Section conversions indisponible : ${esc(ga4Error)}. Ajouter ${esc('gsc-sync@busmoov-seo.iam.gserviceaccount.com')} en Lecteur sur la propriété GA4 Busmoov (Admin &gt; Gestion des accès à la propriété).</p>`
    }

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
  ${ga4Html}

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
      return new Response(JSON.stringify({ status: 'dry_run', to, subject, periode, clicks: gCur.clicks, impressions: gCur.impressions, position: gCur.position, leads: totalLeads, ga4_error: ga4Error || null, sync: syncInfo?.status ?? sync.status, sync_error: syncInfo?.error ?? null }), {
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
