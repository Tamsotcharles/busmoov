import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Edge Function: gsc-sync
 *
 * Synchronise les statistiques Google Search Console (clics, impressions,
 * positions par requête et par page) dans la table seo_gsc_daily.
 *
 * Authentification Google : compte de service (secret GSC_SERVICE_ACCOUNT_KEY,
 * JSON complet téléchargé depuis Google Cloud). Le compte doit être ajouté
 * comme utilisateur de la propriété Search Console sc-domain:busmoov.com.
 *
 * Appelée par la page admin SEO (JWT authenticated requis) ; se contente
 * de répondre "fresh" si la dernière synchro date de moins de 6 heures.
 */

const SITE_URL = "sc-domain:busmoov.com"
const GSC_ENDPOINT = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`

const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'https://busmoov.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

/** Rôle porté par le JWT de l'appelant (anon / authenticated / service_role). */
function getJwtRole(req: Request): string | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const payload = JSON.parse(atob(auth.slice(7).split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role ?? null
  } catch {
    return null
  }
}

function base64url(data: Uint8Array): string {
  let s = ''
  for (const b of data) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Access token Google via JWT signé RS256 avec la clé du compte de service. */
async function getGoogleAccessToken(serviceAccount: { client_email: string; private_key: string }): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const claims = base64url(new TextEncoder().encode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })))
  const signingInput = `${header}.${claims}`

  const pem = serviceAccount.private_key.replace(/-----[A-Z ]+-----/g, '').replace(/\s/g, '')
  const keyData = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  const jwt = `${signingInput}.${base64url(new Uint8Array(signature))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`Échange de token Google refusé (${res.status}) : ${await res.text()}`)
  const json = await res.json()
  return json.access_token
}

interface GscRow { keys: string[]; clicks: number; impressions: number; position: number }

async function queryGsc(token: string, dimension: 'query' | 'page', startDate: string, endDate: string): Promise<GscRow[]> {
  const res = await fetch(GSC_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['date', dimension],
      rowLimit: 5000,
      dataState: 'all',
    }),
  })
  if (res.status === 403) {
    throw new Error('Accès refusé par Search Console : le compte de service n\'est pas encore ajouté comme utilisateur de la propriété busmoov.com (Search Console > Paramètres > Utilisateurs et autorisations).')
  }
  if (!res.ok) throw new Error(`API Search Console (${dimension}) : ${res.status} ${await res.text()}`)
  const json = await res.json()
  return json.rows ?? []
}

const isoDay = (d: Date) => d.toISOString().slice(0, 10)

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const role = getJwtRole(req)
  if (role !== 'authenticated' && role !== 'service_role') {
    return new Response(JSON.stringify({ error: 'Authentification requise' }), { status: 401, headers: cors })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // Fraîcheur : pas plus d'une synchro toutes les 6 heures.
    const { data: state } = await supabase.from('seo_sync_state').select('*').eq('id', 'gsc').maybeSingle()
    const force = (await req.json().catch(() => ({})))?.force === true
    if (!force && state?.last_sync_at && Date.now() - new Date(state.last_sync_at).getTime() < 6 * 3600 * 1000) {
      return new Response(JSON.stringify({ status: 'fresh', last_sync_at: state.last_sync_at }), { headers: cors })
    }

    const rawKey = Deno.env.get('GSC_SERVICE_ACCOUNT_KEY')
    if (!rawKey) {
      const msg = 'Secret GSC_SERVICE_ACCOUNT_KEY absent : créer un compte de service Google et enregistrer sa clé JSON (voir la page admin SEO).'
      await supabase.from('seo_sync_state').upsert({ id: 'gsc', last_error: msg })
      return new Response(JSON.stringify({ error: msg, code: 'missing_key' }), { status: 422, headers: cors })
    }
    const serviceAccount = JSON.parse(rawKey)

    // Première synchro : 28 jours ; ensuite : 5 jours glissants (les
    // données GSC arrivent avec ~2 jours de latence).
    const { count } = await supabase.from('seo_gsc_daily').select('*', { count: 'exact', head: true })
    const days = count ? 5 : 28
    const end = new Date()
    const start = new Date(Date.now() - days * 24 * 3600 * 1000)

    const token = await getGoogleAccessToken(serviceAccount)
    let upserted = 0
    for (const dimension of ['query', 'page'] as const) {
      const rows = await queryGsc(token, dimension, isoDay(start), isoDay(end))
      const records = rows.map((r) => ({
        date: r.keys[0],
        dimension,
        key: r.keys[1],
        clicks: r.clicks,
        impressions: r.impressions,
        position: Math.round(r.position * 100) / 100,
      }))
      for (let i = 0; i < records.length; i += 500) {
        const batch = records.slice(i, i + 500)
        const { error } = await supabase.from('seo_gsc_daily').upsert(batch, { onConflict: 'date,dimension,key' })
        if (error) throw new Error(`Écriture seo_gsc_daily : ${error.message}`)
        upserted += batch.length
      }
    }

    await supabase.from('seo_sync_state').upsert({ id: 'gsc', last_sync_at: new Date().toISOString(), last_error: null })
    return new Response(JSON.stringify({ status: 'synced', rows: upserted, days }), { headers: cors })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    await supabase.from('seo_sync_state').upsert({ id: 'gsc', last_error: msg })
    return new Response(JSON.stringify({ error: msg }), { status: 502, headers: cors })
  }
})
