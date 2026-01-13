import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Edge Function: quote-reminders
 *
 * Envoie automatiquement des relances aux clients après envoi des devis.
 * Les règles sont configurées dynamiquement via l'interface admin (workflow_rules)
 * avec le trigger_event = 'quote_reminder'
 *
 * Chaque règle définit:
 * - conditions.days_after_devis: nombre de jours après l'envoi des devis
 * - action_config.template: clé du template email à utiliser
 *
 * Conditions pour envoyer une relance:
 * - Le dossier a des devis envoyés (status = 'sent')
 * - Aucun devis n'a été accepté
 * - Le client n'a pas encore payé/signé
 * - La relance n'a pas déjà été envoyée (tracké dans quote_reminders)
 */

// Domaines autorisés pour CORS
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
  }
}

interface WorkflowRule {
  id: string
  name: string
  trigger_event: string
  conditions: {
    days_after_devis?: number
  } | null
  action_config: {
    template?: string
    subject?: string
  } | null
  is_active: boolean
}

interface Devis {
  id: string
  reference: string
  price_ttc: number
  transporteur_id: string | null
  transporteur?: {
    name: string
  }
  vehicle_type: string | null
  nombre_cars: number | null
  validity_days: number | null
  sent_at: string | null
}

interface Dossier {
  id: string
  reference: string
  client_email: string
  client_name: string
  departure: string
  arrival: string
  departure_date: string
  return_date: string | null
  passengers: number
  status: string
  language: string | null
  created_at: string
  devis: Devis[]
}

/**
 * Génère le HTML du récapitulatif des devis
 */
function generateDevisRecapHtml(devis: Devis[]): string {
  if (!devis.length) return '<p>Aucun devis disponible</p>'

  let html = '<table style="width: 100%; border-collapse: collapse;">'
  html += `
    <tr style="background: #f5f5f5;">
      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Transporteur</th>
      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Véhicule</th>
      <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Prix TTC</th>
    </tr>
  `

  // Trier par prix croissant
  const sortedDevis = [...devis].sort((a, b) => (a.price_ttc || 0) - (b.price_ttc || 0))

  sortedDevis.forEach((d, index) => {
    const transporteurName = d.transporteur?.name || 'Transporteur partenaire'
    const vehicleLabel = getVehicleLabel(d.vehicle_type, d.nombre_cars)
    const prixFormate = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(d.price_ttc)

    // Le moins cher en vert
    const rowStyle = index === 0
      ? 'background: #e8f5e9;'
      : ''
    const priceStyle = index === 0
      ? 'color: #2e7d32; font-weight: bold;'
      : 'font-weight: bold;'

    html += `
      <tr style="${rowStyle}">
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${transporteurName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${vehicleLabel}</td>
        <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee; ${priceStyle}">${prixFormate}</td>
      </tr>
    `
  })

  html += '</table>'

  // Ajouter un badge "meilleur prix" pour le premier
  if (sortedDevis.length > 1) {
    html += `
      <p style="margin-top: 10px; font-size: 13px; color: #2e7d32;">
        <strong>Meilleur prix !</strong> Économisez ${new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0
        }).format(sortedDevis[sortedDevis.length - 1].price_ttc - sortedDevis[0].price_ttc)} par rapport à l'offre la plus élevée.
      </p>
    `
  }

  return html
}

/**
 * Retourne un label lisible pour le type de véhicule
 */
function getVehicleLabel(vehicleType: string | null, nombreCars: number | null): string {
  const labels: Record<string, string> = {
    'minibus': 'Minibus',
    'standard': 'Autocar standard',
    '60-63': 'Autocar 60-63 places',
    '70': 'Grand autocar 70 places',
    '83-90': 'Autocar grande capacité',
    'autocar': 'Autocar',
  }

  let label = labels[vehicleType || 'autocar'] || 'Autocar'

  if (nombreCars && nombreCars > 1) {
    label = `${nombreCars} ${label.toLowerCase()}s`
  }

  return label
}

/**
 * Formate une date en français
 */
function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

/**
 * Envoie l'email de relance via l'Edge Function send-email
 */
async function sendReminderEmail(
  supabase: any,
  dossier: Dossier,
  templateKey: string,
  devisRecapHtml: string
): Promise<{ success: boolean; emailId?: string; error?: string }> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Générer le lien vers l'espace client
  const baseUrl = 'https://busmoov.com'
  const lang = dossier.language || 'fr'
  const lienEspaceClient = `${baseUrl}/${lang}/mes-devis?ref=${dossier.reference}&email=${encodeURIComponent(dossier.client_email)}`

  const emailData = {
    type: templateKey,
    to: dossier.client_email,
    data: {
      client_name: dossier.client_name || 'Client',
      reference: dossier.reference,
      departure: dossier.departure?.split('(')[0]?.trim() || dossier.departure,
      arrival: dossier.arrival?.split('(')[0]?.trim() || dossier.arrival,
      departure_date: formatDateFr(dossier.departure_date),
      passengers: String(dossier.passengers || 0),
      nb_devis: String(dossier.devis.length),
      devis_recap: devisRecapHtml,
      lien_espace_client: lienEspaceClient,
      language: lang,
      dossier_id: dossier.id,
    }
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(emailData),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Erreur envoi email' }
    }

    return { success: true, emailId: result.id }
  } catch (error) {
    console.error('Erreur appel send-email:', error)
    return { success: false, error: error.message }
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Paramètres optionnels
    let dryRun = false
    let forceDossierId: string | null = null

    try {
      const body = await req.json()
      dryRun = body?.dry_run || false
      forceDossierId = body?.dossier_id || null
    } catch {
      // Pas de body JSON
    }

    const results: any[] = []
    const now = new Date()

    // 1. Charger les règles de workflow actives pour les relances devis
    const { data: workflowRules, error: rulesError } = await supabase
      .from('workflow_rules')
      .select('id, name, trigger_event, conditions, action_config, is_active')
      .eq('trigger_event', 'quote_reminder')
      .eq('is_active', true)

    if (rulesError) {
      console.error('Erreur chargement workflow_rules:', rulesError)
      throw new Error(`Erreur chargement règles: ${rulesError.message}`)
    }

    if (!workflowRules || workflowRules.length === 0) {
      console.log('Aucune règle de relance devis active trouvée')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucune règle de relance devis active',
          processed: 0,
          results: [],
          timestamp: now.toISOString(),
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`${workflowRules.length} règle(s) de relance devis actives`)

    // 2. Récupérer les dossiers avec devis envoyés mais pas encore acceptés
    let query = supabase
      .from('dossiers')
      .select(`
        id,
        reference,
        client_email,
        client_name,
        departure,
        arrival,
        departure_date,
        return_date,
        passengers,
        status,
        language,
        created_at,
        devis!inner(
          id,
          reference,
          price_ttc,
          transporteur_id,
          vehicle_type,
          nombre_cars,
          validity_days,
          sent_at,
          status,
          transporteur:transporteurs(name)
        )
      `)
      // Seulement les dossiers en attente de réponse client
      .in('status', ['pending-client', 'new'])
      // Avec des devis envoyés
      .eq('devis.status', 'sent')

    if (forceDossierId) {
      query = query.eq('id', forceDossierId)
    }

    const { data: dossiers, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Erreur récupération dossiers: ${fetchError.message}`)
    }

    // Pour chaque dossier, vérifier si on doit envoyer une relance
    for (const dossier of dossiers || []) {
      // Filtrer pour n'avoir que les devis envoyés
      const devisSent = dossier.devis.filter((d: any) => d.status === 'sent')

      if (!devisSent.length) continue

      // Trouver la date d'envoi des devis (le plus ancien envoyé)
      const oldestSentAt = devisSent
        .map((d: any) => d.sent_at)
        .filter(Boolean)
        .sort()[0]

      if (!oldestSentAt) continue

      const sentDate = new Date(oldestSentAt)
      const daysSinceSent = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24))

      // Vérifier les relances déjà envoyées pour ce dossier
      const { data: existingReminders } = await supabase
        .from('quote_reminders')
        .select('reminder_type')
        .eq('dossier_id', dossier.id)

      const remindersSent = new Set((existingReminders || []).map((r: any) => r.reminder_type))

      // Pour chaque règle, vérifier si elle doit déclencher une relance
      for (const rule of workflowRules as WorkflowRule[]) {
        const daysAfterDevis = rule.conditions?.days_after_devis
        if (!daysAfterDevis) continue

        // Identifiant unique pour cette règle/délai
        const reminderType = `${daysAfterDevis}d`

        // Vérifier si cette relance a déjà été envoyée
        if (remindersSent.has(reminderType)) continue

        // Vérifier si le délai est atteint
        if (daysSinceSent < daysAfterDevis) continue

        // Template email à utiliser (défini dans la règle ou par défaut)
        const templateKey = rule.action_config?.template || `quote_reminder_${daysAfterDevis}d`

        console.log(`Dossier ${dossier.reference}: envoi relance J+${daysAfterDevis} via règle "${rule.name}"`)

        // Générer le récapitulatif des devis
        const devisRecapHtml = generateDevisRecapHtml(devisSent)

        if (dryRun) {
          results.push({
            dossier_id: dossier.id,
            reference: dossier.reference,
            client_email: dossier.client_email,
            rule_id: rule.id,
            rule_name: rule.name,
            reminder_type: reminderType,
            template: templateKey,
            days_since_sent: daysSinceSent,
            nb_devis: devisSent.length,
            status: 'dry_run',
          })
          continue
        }

        // Envoyer l'email
        const emailResult = await sendReminderEmail(
          supabase,
          { ...dossier, devis: devisSent },
          templateKey,
          devisRecapHtml
        )

        if (!emailResult.success) {
          console.error(`Erreur envoi relance J+${daysAfterDevis} pour ${dossier.reference}:`, emailResult.error)
          results.push({
            dossier_id: dossier.id,
            reference: dossier.reference,
            rule_name: rule.name,
            reminder_type: reminderType,
            status: 'error',
            error: emailResult.error,
          })
          continue
        }

        // Enregistrer la relance envoyée
        const { data: reminder, error: insertError } = await supabase
          .from('quote_reminders')
          .insert({
            dossier_id: dossier.id,
            reminder_type: reminderType,
            sent_at: now.toISOString(),
          })
          .select()
          .single()

        if (insertError) {
          console.error(`Erreur enregistrement relance:`, insertError)
        }

        // Ajouter à la timeline
        await supabase
          .from('timeline')
          .insert({
            dossier_id: dossier.id,
            type: 'email_sent',
            content: `Relance automatique J+${daysAfterDevis} envoyée (${rule.name})`,
          })

        results.push({
          dossier_id: dossier.id,
          reference: dossier.reference,
          client_email: dossier.client_email,
          rule_id: rule.id,
          rule_name: rule.name,
          reminder_type: reminderType,
          template: templateKey,
          days_since_sent: daysSinceSent,
          nb_devis: devisSent.length,
          status: 'sent',
          email_id: emailResult.emailId,
          reminder_id: reminder?.id,
        })

        // Marquer cette relance comme envoyée pour ne pas la renvoyer avec une autre règle
        remindersSent.add(reminderType)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        rules_count: workflowRules.length,
        processed: results.length,
        results,
        timestamp: now.toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erreur quote-reminders:', error)
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
