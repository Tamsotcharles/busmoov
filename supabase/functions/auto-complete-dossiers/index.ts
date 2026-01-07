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
        id, reference, client_name, client_email, departure_date, return_date, status,
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
    // Charger le template d'email
    const { data: template } = await supabase
      .from('email_templates')
      .select('subject, html_content, body')
      .eq('key', 'review_request')
      .eq('is_active', true)
      .single()

    if (!template) {
      console.log('No review_request template found, using default')
    }

    const baseUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://busmoov.com'
    const reviewUrl = `${baseUrl}/avis?token=${reviewToken}`

    const defaultSubject = 'Comment s\'est passé votre voyage avec Busmoov ?'
    const defaultBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #7c3aed, #ec4899); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Busmoov</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #1f2937;">Bonjour ${dossier.client_name},</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Nous espérons que votre voyage s'est bien passé !
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            Votre avis compte beaucoup pour nous et nous aide à améliorer nos services.
            Pourriez-vous prendre quelques instants pour partager votre expérience ?
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}"
               style="background: linear-gradient(135deg, #7c3aed, #ec4899);
                      color: white;
                      padding: 15px 30px;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: bold;
                      display: inline-block;">
              Donner mon avis
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px;">
            Référence de votre dossier : ${dossier.reference}
          </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
          © 2025 Busmoov - Groupe Centrale Autocar
        </div>
      </div>
    `

    const subject = template?.subject || defaultSubject
    let htmlContent = template?.html_content || template?.body || defaultBody

    // Remplacer les variables
    htmlContent = htmlContent
      .replace(/\{\{client_name\}\}/g, dossier.client_name || '')
      .replace(/\{\{reference\}\}/g, dossier.reference || '')
      .replace(/\{\{lien_avis\}\}/g, reviewUrl)
      .replace(/\{\{review_url\}\}/g, reviewUrl)

    // Envoyer via la fonction send-email
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        type: 'custom',
        to: dossier.client_email,
        subject: subject.replace(/\{\{reference\}\}/g, dossier.reference),
        html_content: htmlContent,
      },
    })

    if (error) {
      console.error('Error sending review email:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error in sendReviewRequestEmail:', err)
    return false
  }
}
