// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Types pour les webhooks Resend
interface ResendWebhookPayload {
  type: string
  created_at: string
  data: {
    email_id: string
    from: string
    to: string[]
    subject: string
    created_at: string
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse webhook payload
    const payload: ResendWebhookPayload = await req.json()
    console.log('Resend webhook received:', payload.type, payload.data?.email_id)

    const emailId = payload.data?.email_id
    if (!emailId) {
      console.error('No email_id in payload')
      return new Response(JSON.stringify({ error: 'No email_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Déterminer le nouveau statut et le champ timestamp à mettre à jour
    let newStatus: string
    let timestampField: string

    switch (payload.type) {
      case 'email.sent':
        newStatus = 'sent'
        timestampField = 'sent_at'
        break
      case 'email.delivered':
        newStatus = 'delivered'
        timestampField = 'delivered_at'
        break
      case 'email.opened':
        newStatus = 'opened'
        timestampField = 'opened_at'
        break
      case 'email.clicked':
        newStatus = 'clicked'
        timestampField = 'clicked_at'
        break
      case 'email.bounced':
        newStatus = 'bounced'
        timestampField = 'bounced_at'
        break
      case 'email.complained':
        newStatus = 'complained'
        timestampField = 'complained_at'
        break
      case 'email.delivery_delayed':
        newStatus = 'delivery_delayed'
        timestampField = 'sent_at'
        break
      default:
        console.log('Unknown event type:', payload.type)
        return new Response(JSON.stringify({ success: true, message: 'Unknown event type ignored' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
    }

    // Vérifier si l'email existe déjà
    const { data: existingLog } = await supabase
      .from('email_logs')
      .select('id, status')
      .eq('resend_id', emailId)
      .single()

    if (existingLog) {
      // Mettre à jour le log existant
      const updateData: Record<string, unknown> = {
        status: newStatus,
        [timestampField]: payload.created_at,
      }

      const { error: updateError } = await supabase
        .from('email_logs')
        .update(updateData)
        .eq('resend_id', emailId)

      if (updateError) {
        console.error('Error updating email log:', updateError)
        throw updateError
      }

      console.log(`Updated email ${emailId} to status ${newStatus}`)
    } else {
      // Créer un nouveau log (cas où l'email a été envoyé sans passer par notre send-email)
      const insertData: Record<string, unknown> = {
        resend_id: emailId,
        recipient: payload.data.to?.[0] || 'unknown',
        sender: payload.data.from || 'infos@busmoov.com',
        subject: payload.data.subject || 'Sans sujet',
        status: newStatus,
        [timestampField]: payload.created_at,
        created_at: payload.data.created_at,
      }

      const { error: insertError } = await supabase
        .from('email_logs')
        .insert(insertData)

      if (insertError) {
        console.error('Error inserting email log:', insertError)
        throw insertError
      }

      console.log(`Created new email log for ${emailId} with status ${newStatus}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Webhook processing failed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
