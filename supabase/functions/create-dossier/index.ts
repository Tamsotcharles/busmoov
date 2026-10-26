// Création d'une demande de devis depuis le site public (formulaire d'accueil)
// et depuis l'admin : demande + dossier + activation de l'auto-devis + email de
// confirmation, en service_role. Remplace les insertions anonymes directes
// (policies RLS « Allow anonymous insert » supprimées le 12 oct. 2026).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { checkRequiresManualReview } from '../_shared/manual-review.ts'

const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'https://busmoov.fr',
  'https://www.busmoov.fr',
  'https://busmoov.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-ref, x-client-email, x-validation-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

// Colonnes acceptées depuis le formulaire (tout le reste est ignoré).
const DEMANDE_FIELDS = [
  'client_name', 'client_email', 'client_phone', 'client_company',
  'trip_type', 'trip_mode', 'departure_city', 'arrival_city',
  'departure_date', 'return_date', 'departure_time', 'return_time',
  'departure_address', 'arrival_address', 'return_departure_address', 'return_arrival_address',
  'passengers', 'voyage_type', 'vehicle_type', 'luggage_type', 'special_requests',
  'accessibility', 'wifi', 'wc', 'source', 'nombre_cars', 'nombre_chauffeurs', 'country_code',
] as const

const TVA_RATES: Record<string, number> = { FR: 10, ES: 10, DE: 7, GB: 0, EN: 0 }
const LANG_BY_COUNTRY: Record<string, string> = { FR: 'fr', ES: 'es', DE: 'de', GB: 'en', EN: 'en' }


function formatDateForEmail(value: string | null | undefined): string {
  if (!value) return 'Non définie'
  try {
    return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return String(value)
  }
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const appUrl = (Deno.env.get('APP_URL') || 'https://www.busmoov.com').replace(/\/$/, '')
    const supabase = createClient(supabaseUrl, serviceKey)

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return reply(400, { error: 'Corps invalide' })

    const demande: Record<string, unknown> = {}
    for (const f of DEMANDE_FIELDS) if (body[f] !== undefined) demande[f] = body[f]
    const email = String(demande.client_email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { error: 'Email invalide' })
    demande.client_email = email
    if (!demande.departure_city || !demande.arrival_city) return reply(400, { error: 'Villes de départ et d\'arrivée requises' })
    if (!demande.departure_date) return reply(400, { error: 'Date de départ requise' })
    if (typeof demande.special_requests === 'string' && demande.special_requests.length > 5000) {
      demande.special_requests = demande.special_requests.slice(0, 5000)
    }

    // 1. Demande (la référence DEM- est générée en base)
    const { data: demandeData, error: demandeError } = await supabase
      .from('demandes')
      .insert(demande)
      .select()
      .single()
    if (demandeError) throw demandeError

    // 2. Dossier lié
    const countryCode = String(demandeData.country_code || 'FR').toUpperCase()
    const tripType = demandeData.trip_type
    const { data: dossierData, error: dossierError } = await supabase
      .from('dossiers')
      .insert({
        reference: String(demandeData.reference).replace('DEM-', 'DOS-'),
        demande_id: demandeData.id,
        client_name: demandeData.client_name || 'Client',
        client_email: demandeData.client_email,
        client_phone: demandeData.client_phone,
        client_company: demandeData.client_company || null,
        departure: demandeData.departure_city || '',
        arrival: demandeData.arrival_city || '',
        departure_date: demandeData.departure_date,
        return_date: demandeData.return_date,
        departure_time: demandeData.departure_time || null,
        return_time: demandeData.return_time || null,
        passengers: parseInt(String(demandeData.passengers)) || 1,
        trip_mode: tripType === 'one-way' ? 'one-way' : tripType === 'circuit' ? 'circuit' : 'round-trip',
        voyage_type: demandeData.voyage_type,
        special_requests: demandeData.special_requests,
        luggage_type: demandeData.luggage_type || null,
        vehicle_type: demandeData.vehicle_type || null,
        wifi: demandeData.wifi ?? null,
        wc: demandeData.wc ?? null,
        accessibility: demandeData.accessibility ?? null,
        departure_address: demandeData.departure_address || null,
        arrival_address: demandeData.arrival_address || null,
        return_departure_address: demandeData.return_departure_address || null,
        return_arrival_address: demandeData.return_arrival_address || null,
        status: 'new',
        country_code: countryCode,
        tva_rate: TVA_RATES[countryCode] ?? TVA_RATES.FR,
      })
      .select()
      .single()
    if (dossierError) {
      console.error('create-dossier: dossier non créé', dossierError)
      return reply(200, { demande: demandeData, dossier: null, warning: 'Dossier non créé' })
    }

    // 3. Cotation manuelle ou auto-devis
    const manualReason = checkRequiresManualReview({
      departure: dossierData.departure,
      arrival: dossierData.arrival,
      special_requests: dossierData.special_requests,
      trip_mode: dossierData.trip_mode,
    })
    if (manualReason) {
      await supabase
        .from('dossiers')
        .update({ requires_manual_review: true, manual_review_reason: manualReason })
        .eq('id', dossierData.id)
    } else {
      const { data: workflow } = await supabase
        .from('workflow_devis_auto')
        .select('id, steps')
        .eq('is_default', true)
        .eq('is_active', true)
        .single()
      if (workflow) {
        const steps = (workflow.steps as { delay_hours?: number }[]) || []
        const firstDelay = steps[0]?.delay_hours || 0
        const { error: autoError } = await supabase.from('dossiers_auto_devis').insert({
          dossier_id: dossierData.id,
          workflow_id: workflow.id,
          is_active: true,
          current_step: 0,
          next_devis_at: new Date(Date.now() + firstDelay * 3600 * 1000).toISOString(),
          devis_generes: [],
          started_at: new Date().toISOString(),
        })
        if (autoError) console.error('create-dossier: auto-devis non activé', autoError)
      }
    }

    // 4. Email de confirmation (en arrière-plan, sans bloquer la réponse)
    const language = LANG_BY_COUNTRY[countryCode] || 'fr'
    const lienEspaceClient = `${appUrl}/${language}/mes-devis?ref=${encodeURIComponent(dossierData.reference)}&email=${encodeURIComponent(email)}`
    fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
      body: JSON.stringify({
        type: 'confirmation_demande',
        to: email,
        data: {
          client_name: demandeData.client_name,
          reference: dossierData.reference,
          dossier_reference: dossierData.reference,
          demande_reference: demandeData.reference,
          departure: demandeData.departure_city,
          arrival: demandeData.arrival_city,
          departure_date: formatDateForEmail(demandeData.departure_date),
          passengers: String(demandeData.passengers),
          client_email: email,
          lien_espace_client: lienEspaceClient,
          language,
        },
      }),
    }).catch((e) => console.error('create-dossier: email de confirmation non envoyé', e))

    return reply(200, { demande: demandeData, dossier: dossierData })
  } catch (error) {
    console.error('create-dossier:', error)
    return reply(500, { error: error instanceof Error ? error.message : 'Erreur interne' })
  }
})
