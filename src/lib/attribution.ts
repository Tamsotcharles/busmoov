/**
 * Origine des demandes de devis (attribution first-party).
 *
 * La Search Console ne compte que les clics sur les résultats web de Google ;
 * les clics depuis la fiche Google Business Profile, Bing, les assistants IA,
 * les emails ou les accès directs n'y apparaissent pas. On mémorise donc, au
 * premier chargement de la session, d'où vient le visiteur, et on l'écrit
 * dans `demandes.source` à l'envoi du formulaire.
 *
 * Format stocké (texte, lisible dans l'admin) :
 *   "<canal> | landing:<chemin> | ref:<hôte référent ou ->"
 * ex. "google organic | landing:/fr/location-bus | ref:www.google.com"
 *     "google gbp | landing:/fr | ref:-"            (lien de la fiche Google, utm_medium=gbp)
 *     "direct | landing:/fr/devis-autocar | ref:-"
 */
const KEY = 'busmoov:attribution'

interface Attribution {
  canal: string
  landing: string
  referrer: string
}

function canalDepuis(params: URLSearchParams, referrerHost: string): string {
  const source = params.get('utm_source')
  const medium = params.get('utm_medium')
  if (source) return [source.toLowerCase(), medium?.toLowerCase()].filter(Boolean).join(' ')
  if (params.get('gclid')) return 'google ads'
  if (!referrerHost) return 'direct'
  const h = referrerHost.toLowerCase()
  if (/(^|\.)google\./.test(h)) return 'google organic'
  if (/(^|\.)bing\.com$/.test(h)) return 'bing organic'
  if (/duckduckgo|qwant|ecosia|yahoo/.test(h)) return 'autre moteur'
  if (/chatgpt|openai|perplexity|claude\.ai|gemini\.google|copilot/.test(h)) return 'assistant ia'
  if (/facebook|instagram|linkedin|tiktok|x\.com|twitter/.test(h)) return 'reseaux sociaux'
  if (/busmoov\./.test(h)) return 'interne'
  return 'referral'
}

/** À appeler une fois au démarrage de l'application. Ne fait rien si déjà mémorisé. */
export function captureAttribution(): void {
  try {
    if (sessionStorage.getItem(KEY)) return
    const params = new URLSearchParams(window.location.search)
    let referrerHost = ''
    try { referrerHost = document.referrer ? new URL(document.referrer).host : '' } catch { referrerHost = '' }
    if (/busmoov\./.test(referrerHost)) referrerHost = '' // navigation interne, pas une origine
    const attribution: Attribution = {
      canal: canalDepuis(params, referrerHost),
      landing: window.location.pathname.slice(0, 80),
      referrer: referrerHost.slice(0, 60),
    }
    sessionStorage.setItem(KEY, JSON.stringify(attribution))
  } catch {
    // sessionStorage indisponible (navigation privée stricte) : on vivra sans.
  }
}

/** Chaîne à enregistrer dans `demandes.source`. */
export function getLeadSource(): string {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return 'inconnu'
    const a = JSON.parse(raw) as Attribution
    return `${a.canal} | landing:${a.landing} | ref:${a.referrer || '-'}`
  } catch {
    return 'inconnu'
  }
}
