// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // Récupérer les dossiers SIGNÉS (avec contrat) dont la date de voyage est passée
    // On utilise return_date si disponible, sinon departure_date
    // Seuls les dossiers avec un contrat signé peuvent être marqués comme terminés
    const { data: dossiersToComplete, error: fetchError } = await supabaseClient
      .from('dossiers')
      .select(`
        id, reference, client_name, client_email, departure_date, return_date, status, country_code,
        contrats!inner(signed_at)
      `)
      .in('status', ['confirmed', 'pending-driver', 'pending-info', 'pending-info-received', 'pending-info-confirm'])
      .not('contrats.signed_at', 'is', null)
      .or(`return_date.lt.${todayStr},and(return_date.is.null,departure_date.lt.${todayStr})`)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${dossiersToComplete?.length || 0} dossiers to complete`)

    const results = {
      completed: [] as string[],
      reviewEmailsSent: [] as string[],
      errors: [] as string[],
    }

    for (const dossier of dossiersToComplete || []) {
      try {
        // 1. Marquer le dossier comme terminé
        const { error: updateError } = await supabaseClient
          .from('dossiers')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', dossier.id)

        if (updateError) {
          results.errors.push(`Failed to complete ${dossier.reference}: ${updateError.message}`)
          continue
        }

        results.completed.push(dossier.reference)

        // 2. Ajouter une entrée dans la timeline
        await supabaseClient.from('timeline').insert({
          dossier_id: dossier.id,
          type: 'status_change',
          content: 'Dossier automatiquement marqué comme terminé (date de voyage passée)',
        })

        // 3. Créer un token pour l'avis (si pas déjà existant)
        const reviewToken = generateToken()

        // Vérifier si un avis existe déjà
        const { data: existingReview } = await supabaseClient
          .from('reviews')
          .select('id')
          .eq('dossier_id', dossier.id)
          .single()

        if (!existingReview) {
          // Créer une entrée review en attente
          await supabaseClient.from('reviews').insert({
            dossier_id: dossier.id,
            token: reviewToken,
            status: 'pending',
          })

          // 4. Envoyer l'email de demande d'avis
          const emailSent = await sendReviewRequestEmail(
            supabaseClient,
            dossier,
            reviewToken
          )

          if (emailSent) {
            results.reviewEmailsSent.push(dossier.reference)
          }
        }

      } catch (err) {
        console.error(`Error processing dossier ${dossier.reference}:`, err)
        results.errors.push(`Error processing ${dossier.reference}: ${err.message}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Completed ${results.completed.length} dossiers, sent ${results.reviewEmailsSent.length} review emails`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in auto-complete-dossiers:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

async function sendReviewRequestEmail(
  supabase: any,
  dossier: any,
  reviewToken: string
): Promise<boolean> {
  try {
    // Déterminer la langue à partir du country_code du dossier
    const language = (dossier.country_code || 'FR').toLowerCase()

    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://busmoov.com'
    const reviewUrl = `${baseUrl}/avis?token=${reviewToken}`

    // Envoyer via la fonction send-email qui gère la traduction automatique
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'review_request',
        to: dossier.client_email,
        data: {
          client_name: dossier.client_name || '',
          reference: dossier.reference || '',
          lien_avis: reviewUrl,
          review_url: reviewUrl,
          language: language,
        },
      },
    })

    if (error) {
      console.error('Error sending review email:', error)
      return false
    }

    console.log(`Review email sent to ${dossier.client_email} (lang: ${language})`)
    return true
  } catch (err) {
    console.error('Error in sendReviewRequestEmail:', err)
    return false
  }
}
