import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Domaines autorisés pour CORS
const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface AutomationSetting {
  key: string
  enabled: boolean
  config: Record<string, unknown>
}

interface PromoFlashResult {
  processed: number
  sent: number
  errors: string[]
}

/**
 * Traite les relances d'offres flash qui expirent bientôt
 */
async function processOffreFlashReminders(
  supabase: ReturnType<typeof createClient>,
  config: { hours_before_expiry: number; max_reminders: number }
): Promise<PromoFlashResult> {
  const result: PromoFlashResult = { processed: 0, sent: 0, errors: [] }

  const now = new Date()
  const expiryThreshold = new Date(now.getTime() + config.hours_before_expiry * 60 * 60 * 1000)

  // Trouver les devis avec offre flash qui expire bientôt
  const { data: devisToRemind, error: fetchError } = await supabase
    .from('devis')
    .select(`
      id,
      dossier_id,
      price_ttc,
      promo_original_price,
      promo_expires_at,
      promo_reminder_count,
      dossiers!inner (
        id,
        reference,
        client_name,
        client_email,
        departure,
        arrival,
        departure_date,
        passengers,
        country_code,
        status
      )
    `)
    .not('promo_expires_at', 'is', null)
    .gt('promo_expires_at', now.toISOString())
    .lte('promo_expires_at', expiryThreshold.toISOString())
    .lt('promo_reminder_count', config.max_reminders)
    .in('dossiers.status', ['pending-payment', 'draft'])

  if (fetchError) {
    result.errors.push(`Erreur fetch devis: ${fetchError.message}`)
    return result
  }

  if (!devisToRemind || devisToRemind.length === 0) {
    return result
  }

  result.processed = devisToRemind.length

  for (const devis of devisToRemind) {
    const dossier = devis.dossiers as unknown as {
      id: string
      reference: string
      client_name: string
      client_email: string
      departure: string
      arrival: string
      departure_date: string
      passengers: number
      country_code: string | null
      status: string
    }

    if (!dossier.client_email) continue

    // Calculer le temps restant
    const expiresAt = new Date(devis.promo_expires_at)
    const hoursRemaining = Math.max(0, Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)))

    const emailLanguage = (dossier.country_code || 'FR').toLowerCase()

    // Générer le lien espace client
    const baseUrl = Deno.env.get('APP_URL') || 'https://busmoov.com'
    const clientAccessUrl = `${baseUrl}/${emailLanguage}/espace-client?ref=${encodeURIComponent(dossier.reference)}&email=${encodeURIComponent(dossier.client_email)}`

    // Envoyer l'email de relance
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'offre_flash_reminder',
        to: dossier.client_email,
        data: {
          client_name: dossier.client_name,
          reference: dossier.reference,
          departure: dossier.departure,
          arrival: dossier.arrival,
          departure_date: formatDate(dossier.departure_date),
          passengers: String(dossier.passengers),
          prix_barre: devis.promo_original_price?.toFixed(2).replace('.', ',') || '',
          prix_ttc: devis.price_ttc?.toFixed(2).replace('.', ',') || '',
          heures_restantes: String(hoursRemaining),
          lien_espace_client: clientAccessUrl,
          dossier_id: dossier.id,
          language: emailLanguage,
        },
      },
    })

    if (emailError) {
      result.errors.push(`Erreur email ${dossier.reference}: ${emailError.message}`)
      continue
    }

    // Mettre à jour le devis
    const { error: updateError } = await supabase
      .from('devis')
      .update({
        promo_reminder_sent_at: now.toISOString(),
        promo_reminder_count: (devis.promo_reminder_count || 0) + 1,
      })
      .eq('id', devis.id)

    if (updateError) {
      result.errors.push(`Erreur update ${dossier.reference}: ${updateError.message}`)
      continue
    }

    // Ajouter une entrée timeline
    await supabase.from('timeline').insert({
      dossier_id: dossier.id,
      type: 'email_sent',
      content: `Relance offre flash automatique envoyée (expire dans ${hoursRemaining}h)`,
    })

    result.sent++
  }

  return result
}

/**
 * Formate une date en français
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer les paramètres optionnels
    let specificAutomation: string | null = null
    try {
      const body = await req.json()
      specificAutomation = body.automation || null
    } catch {
      // Pas de body, on traite toutes les automatisations actives
    }

    // Récupérer les settings d'automatisation
    const { data: settings, error: settingsError } = await supabase
      .from('automation_settings')
      .select('*')
      .eq('enabled', true)

    if (settingsError) {
      throw new Error(`Erreur récupération settings: ${settingsError.message}`)
    }

    const results: Record<string, unknown> = {}

    for (const setting of (settings || []) as AutomationSetting[]) {
      // Si une automatisation spécifique est demandée, ne traiter que celle-là
      if (specificAutomation && setting.key !== specificAutomation) continue

      switch (setting.key) {
        case 'offre_flash_reminder':
          results.offre_flash_reminder = await processOffreFlashReminders(
            supabase,
            setting.config as { hours_before_expiry: number; max_reminders: number }
          )
          break

        // Autres automatisations à implémenter plus tard
        case 'quote_reminder':
        case 'payment_reminder':
        case 'info_voyage_reminder':
          results[setting.key] = { status: 'not_implemented' }
          break
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erreur scheduled-reminders:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
