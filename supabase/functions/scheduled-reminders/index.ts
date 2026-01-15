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

interface AutomationResult {
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
): Promise<AutomationResult> {
  const result: AutomationResult = { processed: 0, sent: 0, errors: [] }

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

/**
 * Relance devis non répondus
 * Envoie une relance si le client n'a pas répondu après X jours
 */
async function processQuoteReminders(
  supabase: ReturnType<typeof createClient>,
  config: { days_after_sent: number; max_reminders: number }
): Promise<AutomationResult> {
  const result: AutomationResult = { processed: 0, sent: 0, errors: [] }
  const now = new Date()

  // Date limite : devis envoyés il y a plus de X jours
  const sentBefore = new Date(now.getTime() - config.days_after_sent * 24 * 60 * 60 * 1000)

  // Trouver les dossiers avec devis envoyés mais non acceptés
  const { data: dossiersToRemind, error: fetchError } = await supabase
    .from('dossiers')
    .select(`
      id,
      reference,
      client_name,
      client_email,
      departure,
      arrival,
      departure_date,
      passengers,
      country_code,
      quote_reminder_count,
      devis_sent_at,
      devis!inner (
        id,
        status
      )
    `)
    .eq('status', 'draft')
    .not('devis_sent_at', 'is', null)
    .lte('devis_sent_at', sentBefore.toISOString())
    .lt('quote_reminder_count', config.max_reminders)
    .gt('departure_date', now.toISOString())

  if (fetchError) {
    result.errors.push(`Erreur fetch dossiers: ${fetchError.message}`)
    return result
  }

  if (!dossiersToRemind || dossiersToRemind.length === 0) {
    return result
  }

  // Filtrer : garder seulement ceux qui ont au moins un devis 'sent' (pas accepté)
  const eligibleDossiers = dossiersToRemind.filter(d => {
    const devisList = d.devis as { id: string; status: string }[]
    return devisList.some(dev => dev.status === 'sent')
  })

  result.processed = eligibleDossiers.length

  for (const dossier of eligibleDossiers) {
    if (!dossier.client_email) continue

    const emailLanguage = (dossier.country_code || 'FR').toLowerCase()
    const baseUrl = Deno.env.get('APP_URL') || 'https://busmoov.com'
    const clientAccessUrl = `${baseUrl}/${emailLanguage}/espace-client?ref=${encodeURIComponent(dossier.reference)}&email=${encodeURIComponent(dossier.client_email)}`

    const nbDevis = (dossier.devis as { id: string; status: string }[]).filter(d => d.status === 'sent').length

    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'quote_reminder',
        to: dossier.client_email,
        data: {
          client_name: dossier.client_name,
          reference: dossier.reference,
          departure: dossier.departure,
          arrival: dossier.arrival,
          departure_date: formatDate(dossier.departure_date),
          passengers: String(dossier.passengers),
          nb_devis: String(nbDevis),
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

    // Mettre à jour le dossier
    const { error: updateError } = await supabase
      .from('dossiers')
      .update({
        quote_reminder_sent_at: now.toISOString(),
        quote_reminder_count: (dossier.quote_reminder_count || 0) + 1,
      })
      .eq('id', dossier.id)

    if (updateError) {
      result.errors.push(`Erreur update ${dossier.reference}: ${updateError.message}`)
      continue
    }

    await supabase.from('timeline').insert({
      dossier_id: dossier.id,
      type: 'email_sent',
      content: `Relance devis automatique envoyée (relance ${(dossier.quote_reminder_count || 0) + 1})`,
    })

    result.sent++
  }

  return result
}

/**
 * Relance paiement (acompte ou solde)
 * - Acompte : après signature du contrat sans paiement
 * - Solde : X jours avant le départ si acompte payé mais pas le solde
 */
async function processPaymentReminders(
  supabase: ReturnType<typeof createClient>,
  config: { days_after_signature: number; days_before_departure: number; max_reminders?: number }
): Promise<AutomationResult> {
  const result: AutomationResult = { processed: 0, sent: 0, errors: [] }
  const now = new Date()
  const maxReminders = config.max_reminders || 2

  // === RELANCE ACOMPTE ===
  // Dossiers avec contrat signé mais acompte non payé
  const signedBefore = new Date(now.getTime() - config.days_after_signature * 24 * 60 * 60 * 1000)

  const { data: acompteDossiers, error: acompteError } = await supabase
    .from('dossiers')
    .select(`
      id,
      reference,
      client_name,
      client_email,
      departure,
      arrival,
      departure_date,
      passengers,
      country_code,
      payment_reminder_count,
      signed_at,
      factures!inner (
        id,
        type,
        status,
        total_ttc
      )
    `)
    .eq('status', 'pending-payment')
    .not('signed_at', 'is', null)
    .lte('signed_at', signedBefore.toISOString())
    .lt('payment_reminder_count', maxReminders)
    .gt('departure_date', now.toISOString())

  if (acompteError) {
    result.errors.push(`Erreur fetch acompte: ${acompteError.message}`)
  } else if (acompteDossiers && acompteDossiers.length > 0) {
    // Filtrer ceux qui ont une facture acompte non payée
    const eligibleAcompte = acompteDossiers.filter(d => {
      const factures = d.factures as { type: string; status: string; total_ttc: number }[]
      return factures.some(f => f.type === 'acompte' && f.status !== 'paid')
    })

    result.processed += eligibleAcompte.length

    for (const dossier of eligibleAcompte) {
      if (!dossier.client_email) continue

      const factures = dossier.factures as { type: string; status: string; total_ttc: number }[]
      const acompteFacture = factures.find(f => f.type === 'acompte')

      const emailLanguage = (dossier.country_code || 'FR').toLowerCase()
      const baseUrl = Deno.env.get('APP_URL') || 'https://busmoov.com'
      const paymentUrl = `${baseUrl}/${emailLanguage}/recapitulatif/${dossier.id}`

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'payment_reminder',
          to: dossier.client_email,
          data: {
            client_name: dossier.client_name,
            reference: dossier.reference,
            departure: dossier.departure,
            arrival: dossier.arrival,
            departure_date: formatDate(dossier.departure_date),
            passengers: String(dossier.passengers),
            montant_acompte: acompteFacture?.total_ttc?.toFixed(2).replace('.', ',') || '',
            lien_paiement: paymentUrl,
            dossier_id: dossier.id,
            language: emailLanguage,
          },
        },
      })

      if (emailError) {
        result.errors.push(`Erreur email acompte ${dossier.reference}: ${emailError.message}`)
        continue
      }

      await supabase
        .from('dossiers')
        .update({
          payment_reminder_sent_at: now.toISOString(),
          payment_reminder_count: (dossier.payment_reminder_count || 0) + 1,
        })
        .eq('id', dossier.id)

      await supabase.from('timeline').insert({
        dossier_id: dossier.id,
        type: 'email_sent',
        content: `Relance acompte automatique envoyée`,
      })

      result.sent++
    }
  }

  // === RELANCE SOLDE ===
  // Dossiers avec acompte payé mais solde à régler, départ dans X jours
  const departureThreshold = new Date(now.getTime() + config.days_before_departure * 24 * 60 * 60 * 1000)

  const { data: soldeDossiers, error: soldeError } = await supabase
    .from('dossiers')
    .select(`
      id,
      reference,
      client_name,
      client_email,
      departure,
      arrival,
      departure_date,
      passengers,
      country_code,
      payment_reminder_count,
      factures (
        id,
        type,
        status,
        total_ttc
      )
    `)
    .in('status', ['pending-reservation', 'pending-info', 'pending-driver', 'confirmed'])
    .gt('departure_date', now.toISOString())
    .lte('departure_date', departureThreshold.toISOString())
    .lt('payment_reminder_count', maxReminders)

  if (soldeError) {
    result.errors.push(`Erreur fetch solde: ${soldeError.message}`)
  } else if (soldeDossiers && soldeDossiers.length > 0) {
    // Filtrer : acompte payé ET solde non payé
    const eligibleSolde = soldeDossiers.filter(d => {
      const factures = d.factures as { type: string; status: string; total_ttc: number }[] | null
      if (!factures) return false
      const acomptePaid = factures.some(f => f.type === 'acompte' && f.status === 'paid')
      const soldeUnpaid = factures.some(f => f.type === 'solde' && f.status !== 'paid')
      return acomptePaid && soldeUnpaid
    })

    result.processed += eligibleSolde.length

    for (const dossier of eligibleSolde) {
      if (!dossier.client_email) continue

      const factures = dossier.factures as { type: string; status: string; total_ttc: number }[]
      const soldeFacture = factures.find(f => f.type === 'solde')
      const daysUntilDeparture = Math.ceil((new Date(dossier.departure_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      const emailLanguage = (dossier.country_code || 'FR').toLowerCase()
      const baseUrl = Deno.env.get('APP_URL') || 'https://busmoov.com'
      const paymentUrl = `${baseUrl}/${emailLanguage}/recapitulatif/${dossier.id}`

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'rappel_solde',
          to: dossier.client_email,
          data: {
            client_name: dossier.client_name,
            reference: dossier.reference,
            departure: dossier.departure,
            arrival: dossier.arrival,
            departure_date: formatDate(dossier.departure_date),
            passengers: String(dossier.passengers),
            montant_solde: soldeFacture?.total_ttc?.toFixed(2).replace('.', ',') || '',
            jours_avant_depart: String(daysUntilDeparture),
            lien_paiement: paymentUrl,
            dossier_id: dossier.id,
            language: emailLanguage,
          },
        },
      })

      if (emailError) {
        result.errors.push(`Erreur email solde ${dossier.reference}: ${emailError.message}`)
        continue
      }

      await supabase
        .from('dossiers')
        .update({
          payment_reminder_sent_at: now.toISOString(),
          payment_reminder_count: (dossier.payment_reminder_count || 0) + 1,
        })
        .eq('id', dossier.id)

      await supabase.from('timeline').insert({
        dossier_id: dossier.id,
        type: 'email_sent',
        content: `Relance solde automatique envoyée (J-${daysUntilDeparture})`,
      })

      result.sent++
    }
  }

  return result
}

/**
 * Relance infos voyage
 * Envoie une relance si le client n'a pas fourni ses infos voyage X jours avant le départ
 */
async function processInfoVoyageReminders(
  supabase: ReturnType<typeof createClient>,
  config: { days_before_departure: number; max_reminders?: number }
): Promise<AutomationResult> {
  const result: AutomationResult = { processed: 0, sent: 0, errors: [] }
  const now = new Date()
  const maxReminders = config.max_reminders || 2

  // Dossiers en attente d'infos voyage avec départ dans X jours
  const departureThreshold = new Date(now.getTime() + config.days_before_departure * 24 * 60 * 60 * 1000)

  const { data: dossiers, error: fetchError } = await supabase
    .from('dossiers')
    .select(`
      id,
      reference,
      client_name,
      client_email,
      departure,
      arrival,
      departure_date,
      passengers,
      country_code,
      info_voyage_reminder_count,
      voyage_infos (
        id,
        validated_at
      )
    `)
    .eq('status', 'pending-info')
    .gt('departure_date', now.toISOString())
    .lte('departure_date', departureThreshold.toISOString())
    .lt('info_voyage_reminder_count', maxReminders)

  if (fetchError) {
    result.errors.push(`Erreur fetch dossiers: ${fetchError.message}`)
    return result
  }

  if (!dossiers || dossiers.length === 0) {
    return result
  }

  // Filtrer : garder ceux sans voyage_infos validés
  const eligibleDossiers = dossiers.filter(d => {
    const voyageInfos = d.voyage_infos as { validated_at: string | null }[] | null
    if (!voyageInfos || voyageInfos.length === 0) return true
    return !voyageInfos.some(v => v.validated_at)
  })

  result.processed = eligibleDossiers.length

  for (const dossier of eligibleDossiers) {
    if (!dossier.client_email) continue

    const daysUntilDeparture = Math.ceil((new Date(dossier.departure_date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    const emailLanguage = (dossier.country_code || 'FR').toLowerCase()
    const baseUrl = Deno.env.get('APP_URL') || 'https://busmoov.com'
    const infosVoyageUrl = `${baseUrl}/${emailLanguage}/infos-voyage/${dossier.id}`

    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'info_request',
        to: dossier.client_email,
        data: {
          client_name: dossier.client_name,
          reference: dossier.reference,
          departure: dossier.departure,
          arrival: dossier.arrival,
          departure_date: formatDate(dossier.departure_date),
          passengers: String(dossier.passengers),
          jours_avant_depart: String(daysUntilDeparture),
          lien_infos_voyage: infosVoyageUrl,
          dossier_id: dossier.id,
          language: emailLanguage,
        },
      },
    })

    if (emailError) {
      result.errors.push(`Erreur email ${dossier.reference}: ${emailError.message}`)
      continue
    }

    await supabase
      .from('dossiers')
      .update({
        info_voyage_reminder_sent_at: now.toISOString(),
        info_voyage_reminder_count: (dossier.info_voyage_reminder_count || 0) + 1,
      })
      .eq('id', dossier.id)

    await supabase.from('timeline').insert({
      dossier_id: dossier.id,
      type: 'email_sent',
      content: `Relance infos voyage automatique envoyée (J-${daysUntilDeparture})`,
    })

    result.sent++
  }

  return result
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

        case 'quote_reminder':
          results.quote_reminder = await processQuoteReminders(
            supabase,
            setting.config as { days_after_sent: number; max_reminders: number }
          )
          break

        case 'payment_reminder':
          results.payment_reminder = await processPaymentReminders(
            supabase,
            setting.config as { days_after_signature: number; days_before_departure: number; max_reminders?: number }
          )
          break

        case 'info_voyage_reminder':
          results.info_voyage_reminder = await processInfoVoyageReminders(
            supabase,
            setting.config as { days_before_departure: number; max_reminders?: number }
          )
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
