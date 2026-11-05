/**
 * Microsites par ville : un domaine dédié (busmoovlyon.fr) sert une page
 * unique, avec son propre contenu, dont le formulaire crée les demandes chez
 * Busmoov comme le site principal. Détection par nom d'hôte côté client ;
 * côté Vercel, des rewrites conditionnés à l'hôte servent le HTML prérendu
 * (voir vercel.json et scripts/prerender.mjs).
 */

export const MAIN_SITE_URL = 'https://www.busmoov.com'

export const MICROSITES: Record<string, 'lyon'> = {
  'busmoovlyon.fr': 'lyon',
  'www.busmoovlyon.fr': 'lyon',
}

export type MicrositeKey = (typeof MICROSITES)[string]

export function detectMicrosite(hostname: string = typeof window !== 'undefined' ? window.location.hostname : ''): MicrositeKey | null {
  return MICROSITES[hostname.toLowerCase()] ?? null
}

export const isMicrositeHost = () => detectMicrosite() !== null

/** Chemin du site principal → URL absolue quand on est sur un microsite. */
export function mainSiteHref(path: string): string {
  return isMicrositeHost() ? `${MAIN_SITE_URL}${path}` : path
}
