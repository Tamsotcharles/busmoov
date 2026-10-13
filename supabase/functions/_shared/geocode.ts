/**
 * Choix du meilleur résultat de géocodage Geoapify.
 *
 * Geoapify classe parfois en tête un résultat qui n'est pas celui demandé :
 * - « Val d isère » (sans apostrophe) renvoyait d'abord le département de
 *   l'Isère (centre à 74 km de l'aéroport de Lyon), Val-d'Isère en 2e ;
 * - « Aéroport Lyon Saint-Exupéry, France » renvoyait d'abord le village de
 *   Saint-Exupéry en Gironde, l'aéroport en 2e.
 *
 * Règles, dans l'ordre :
 * 1. un centre de pays, région ou département n'est jamais un point de prise
 *    en charge : écarté dès qu'un lieu précis existe ;
 * 2. le résultat qui reprend le plus de mots de la saisie l'emporte
 *    (« aéroport », « lyon », « saint », « exupéry » : 5 mots sur 5 pour
 *    l'aéroport, 3 pour le village) ;
 * 3. à égalité, le pays demandé puis l'ordre Geoapify.
 *
 * Copie identique dans supabase/functions/_shared/geocode.ts (Deno).
 */

export interface GeocodeFeatureLike {
  properties: {
    result_type?: string
    country_code?: string
    formatted?: string
    name?: string
  }
}

const ZONES_ADMINISTRATIVES = new Set(['country', 'state', 'county'])

/** Minuscules, sans accents, découpé en mots d'au moins 2 caractères. */
export function geocodeTokens(text: string | null | undefined): string[] {
  if (!text) return []
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2)
}

function coverage(feature: GeocodeFeatureLike, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0
  const p = feature.properties || {}
  const hay = geocodeTokens(`${p.formatted || ''} ${p.name || ''}`)
  if (hay.length === 0) return 0
  let n = 0
  for (const t of queryTokens) if (hay.includes(t)) n++
  return n
}

export function pickBestGeocodeFeature<T extends GeocodeFeatureLike>(
  features: T[],
  countryCode?: string,
  query?: string,
): T | null {
  if (!features || features.length === 0) return null
  const pays = (countryCode || '').toLowerCase()
  const precis = features.filter((f) => !ZONES_ADMINISTRATIVES.has((f.properties || {}).result_type || ''))
  const candidats = precis.length > 0 ? precis : features
  const tokens = geocodeTokens(query)

  const classes = candidats
    .map((f, index) => ({
      f,
      index,
      score: coverage(f, tokens),
      memePays: !pays || ((f.properties || {}).country_code || '').toLowerCase() === pays ? 1 : 0,
    }))
    .sort((a, b) => b.score - a.score || b.memePays - a.memePays || a.index - b.index)

  return classes[0]?.f ?? null
}
