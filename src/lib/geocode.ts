/**
 * Choix du meilleur résultat de géocodage Geoapify.
 *
 * Geoapify classe parfois une zone administrative en tête : « Val d isère »
 * (sans apostrophe) renvoyait d'abord le département de l'Isère (centre à
 * 74 km de l'aéroport de Lyon) et Val-d'Isère seulement en 2e position.
 * Un centre de région, de département ou de pays n'est jamais un point
 * de prise en charge : on l'écarte dès qu'un lieu précis existe dans le
 * pays demandé.
 *
 * Copie identique dans supabase/functions/_shared/geocode.ts (Deno).
 */

export interface GeocodeFeatureLike {
  properties: {
    result_type?: string
    country_code?: string
  }
}

const ZONES_ADMINISTRATIVES = new Set(['country', 'state', 'county'])

export function pickBestGeocodeFeature<T extends GeocodeFeatureLike>(
  features: T[],
  countryCode?: string,
): T | null {
  if (!features || features.length === 0) return null
  const pays = (countryCode || '').toLowerCase()
  const precis = features.filter((f) => {
    const p = f.properties || {}
    if (ZONES_ADMINISTRATIVES.has(p.result_type || '')) return false
    return !pays || (p.country_code || '').toLowerCase() === pays
  })
  return precis[0] ?? features[0]
}
