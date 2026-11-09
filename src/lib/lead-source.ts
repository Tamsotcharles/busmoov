/**
 * Lecture de `demandes.source`, écrit par `getLeadSource()` (src/lib/attribution.ts) :
 *   "[site:<hôte> | ]<canal> | landing:<chemin> | ref:<hôte référent ou ->"
 * Les valeurs anciennes ("inconnu", "website", "admin", "site:busmoovlyon.fr")
 * sont tolérées : ce qui n'est pas reconnu est rendu tel quel.
 */
export interface LeadSource {
  /** Domaine du site d'entrée : busmoovlyon.fr pour un microsite, busmoov.com sinon. */
  site: string
  /** Canal lisible : Google (organique), ChatGPT, Accès direct… */
  canal: string
  /** Chemin de la première page vue, ex. /fr/location-autocar-bde. */
  landing: string | null
  /** Hôte référent, ex. www.google.com. */
  referrer: string | null
  /** Chaîne brute, pour l'infobulle. */
  brut: string
}

const CANAUX: Record<string, string> = {
  'google organic': 'Google (organique)',
  'google gbp': 'Fiche Google',
  'google ads': 'Google Ads',
  'bing organic': 'Bing',
  'autre moteur': 'Autre moteur',
  'assistant ia': 'Assistant IA',
  'reseaux sociaux': 'Réseaux sociaux',
  direct: 'Accès direct',
  referral: 'Site référent',
  interne: 'Interne',
  inconnu: 'Inconnue',
  website: 'Site web',
  admin: 'Saisie admin',
}

function libelleCanal(raw: string): string {
  const k = raw.trim().toLowerCase()
  if (CANAUX[k]) return CANAUX[k]
  if (/chatgpt|openai/.test(k)) return 'ChatGPT'
  if (/perplexity/.test(k)) return 'Perplexity'
  if (/claude/.test(k)) return 'Claude'
  if (/gemini/.test(k)) return 'Gemini'
  if (/copilot/.test(k)) return 'Copilot'
  return raw.trim()
}

export function parseLeadSource(source: string | null | undefined): LeadSource | null {
  if (!source || !source.trim()) return null
  const brut = source.trim()
  let site = 'busmoov.com'
  let canal = ''
  let landing: string | null = null
  let referrer: string | null = null
  for (const part of brut.split('|').map((p) => p.trim()).filter(Boolean)) {
    if (part.startsWith('site:')) site = part.slice(5).trim().replace(/^www\./, '')
    else if (part.startsWith('landing:')) landing = part.slice(8).trim() || null
    else if (part.startsWith('ref:')) { const r = part.slice(4).trim(); referrer = r && r !== '-' ? r : null }
    else if (!canal) canal = part
  }
  return { site, canal: canal ? libelleCanal(canal) : 'Inconnue', landing, referrer, brut }
}

/** Résumé court pour les listes : « busmoovlyon.fr · ChatGPT ». */
export function resumeLeadSource(source: string | null | undefined): string | null {
  const s = parseLeadSource(source)
  if (!s) return null
  return s.site === 'busmoov.com' ? s.canal : `${s.site} · ${s.canal}`
}
