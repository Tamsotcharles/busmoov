/**
 * Règle unique « cotation manuelle ou auto-devis ».
 *
 * Utilisée par le formulaire admin (useSupabase.ts), l'Edge Function
 * create-dossier (formulaire public) et process-auto-devis. Copie identique
 * dans supabase/functions/_shared/manual-review.ts (Deno) : modifier les deux.
 *
 * Le formulaire public préfixe lui-même le texte libre par « Étapes: » et
 * « Équipements: » : ces libellés sont retirés avant l'analyse, sinon toute
 * demande avec une précision (« Pause toilette ») partait en cotation
 * manuelle. Les mots-clés sont comparés sans accents et en mots entiers
 * (« mad » ne doit pas matcher « Madrid » ni « madame »).
 */

export interface ManualReviewInput {
  departure?: string | null
  arrival?: string | null
  special_requests?: string | null
  notes?: string | null
  trip_mode?: string | null
}

const MOTS_CLES_COMPLEXES = [
  'rotation', 'navette', 'shuttle', 'mise a disposition', 'mad',
  'transfert multiple', 'plusieurs trajets', 'aller-retour multiple',
  'circuit', 'tournee', 'plusieurs arrets', 'etapes',
]

const normaliser = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const sansLibellesFormulaire = (s: string) => s.replace(/^\s*(etapes|equipements)\s*:/gm, ' ')
const echapper = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Retourne null si le dossier peut partir en auto-devis, sinon la raison. */
export function checkRequiresManualReview(d: ManualReviewInput): string | null {
  const departure = (d.departure || '').toLowerCase()
  const arrival = (d.arrival || '').toLowerCase()

  // 1. Même ville de départ et d'arrivée (rotations / navettes intra-ville)
  if (departure && arrival) {
    const depCity = departure.split(',')[0].split('(')[0].trim()
    const arrCity = arrival.split(',')[0].split('(')[0].trim()
    if (depCity === arrCity) return 'Même ville départ/arrivée - Rotations ou navettes intra-ville'
  }

  // 2. Mots-clés indiquant des rotations ou une mise à disposition complexe
  const texte = sansLibellesFormulaire(normaliser(`${d.special_requests || ''}\n${d.notes || ''}`))
  for (const mot of MOTS_CLES_COMPLEXES) {
    const motEntier = new RegExp(`(^|[^a-z0-9])${echapper(mot)}([^a-z0-9]|$)`)
    if (motEntier.test(texte)) return `Mots-clés détectés: "${mot}" - Prestation complexe`
  }

  // 3. Mode circuit (mise à disposition avec itinéraire personnalisé)
  if (d.trip_mode === 'circuit') return 'Mode circuit - Mise à disposition avec itinéraire personnalisé'

  return null
}
