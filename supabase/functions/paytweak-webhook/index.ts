import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paytweak-signature',
}

// Verification de signature HMAC-SHA256
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Comparaison securisee (timing-safe)
    if (signature.length !== expectedSignature.length) return false
    let result = 0
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i)
    }
    return result === 0
  } catch (error) {
    console.error('Signature verification error:', error)
    return false
  }
}

// Validation UUID
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Seul POST est accepte
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const PAYTWEAK_WEBHOOK_SECRET = Deno.env.get('PAYTWEAK_WEBHOOK_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Lire le body une seule fois
    const body = await req.text()

    // Verifier la signature si le secret est configure
    const signature = req.headers.get('x-paytweak-signature')
    if (PAYTWEAK_WEBHOOK_SECRET) {
      if (!signature) {
        console.error('Missing webhook signature')
        return new Response(
          JSON.stringify({ error: 'Missing signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const isValid = await verifySignature(body, signature, PAYTWEAK_WEBHOOK_SECRET)
      if (!isValid) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.log('Webhook signature verified')
    } else {
      console.warn('PAYTWEAK_WEBHOOK_SECRET not configured - signature verification skipped')
    }

    // Parser le JSON
    let payload
    try {
      payload = JSON.parse(body)
    } catch (e) {
      console.error('Invalid JSON payload')
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('PayTweak webhook received:', JSON.stringify(payload).substring(0, 500))

    // PayTweak envoie differents types d'evenements
    const eventType = payload.event || payload.type || payload.status
    const paymentData = payload.data || payload.payment || payload

    // Extraire les metadonnees
    const metadata = paymentData.metadata || {}
    const dossierId = metadata.dossier_id
    const paymentType = metadata.type // 'acompte' ou 'solde'
    const reference = metadata.reference

    // Validation du dossier_id
    if (!dossierId) {
      console.error('No dossier_id in webhook metadata')
      return new Response(
        JSON.stringify({ error: 'Missing dossier_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidUUID(dossierId)) {
      console.error('Invalid dossier_id format:', dossierId)
      return new Response(
        JSON.stringify({ error: 'Invalid dossier_id format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SECURITE: Verifier que le dossier existe
    const { data: dossier, error: dossierCheckError } = await supabase
      .from('dossiers')
      .select('id, reference, status, price_ttc')
      .eq('id', dossierId)
      .single()

    if (dossierCheckError || !dossier) {
      console.error('Dossier not found for webhook:', dossierId)
      return new Response(
        JSON.stringify({ error: 'Dossier not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verifier la reference si fournie
    if (reference && dossier.reference !== reference) {
      console.error('Reference mismatch in webhook:', { expected: dossier.reference, received: reference })
      return new Response(
        JSON.stringify({ error: 'Reference mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Traiter selon le type d'evenement
    if (eventType === 'payment.completed' || eventType === 'payment_success' || eventType === 'paid' || eventType === 'completed') {
      console.log(`Payment completed for dossier ${dossierId}`)

      const providerPaymentId = paymentData.id || paymentData.payment_id

      // SECURITE: Verifier qu'on n'a pas deja traite ce paiement (idempotence)
      if (providerPaymentId) {
        const { data: existingPayment } = await supabase
          .from('paiements')
          .select('id')
          .eq('provider_payment_id', providerPaymentId)
          .single()

        if (existingPayment) {
          console.log('Payment already processed:', providerPaymentId)
          return new Response(
            JSON.stringify({ success: true, message: 'Payment already processed' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      const amountPaid = (paymentData.amount || paymentData.amount_paid || 0) / 100 // Convertir des centimes

      // Validation du montant
      if (amountPaid <= 0 || amountPaid > 100000) {
        console.error('Invalid amount in webhook:', amountPaid)
        return new Response(
          JSON.stringify({ error: 'Invalid amount' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // 1. Creer l'entree paiement
      const { data: paiement, error: paiementError } = await supabase
        .from('paiements')
        .insert({
          dossier_id: dossierId,
          amount: amountPaid,
          type: 'cb', // Carte bancaire via PayTweak
          payment_date: new Date().toISOString(),
          provider: 'paytweak',
          provider_payment_id: providerPaymentId,
          status: 'completed',
        })
        .select()
        .single()

      if (paiementError) {
        console.error('Error creating paiement:', paiementError)
        // Verifier si c'est une erreur de duplicat
        if (paiementError.code === '23505') {
          return new Response(
            JSON.stringify({ success: true, message: 'Payment already recorded' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        console.log('Paiement created:', paiement.id)
      }

      // 2. Mettre a jour le lien de paiement
      const linkId = paymentData.id || paymentData.link_id
      if (linkId) {
        await supabase
          .from('payment_links')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('dossier_id', dossierId)
          .eq('provider_link_id', linkId)
      }

      // 3. Mettre a jour la facture correspondante
      const factureType = paymentType === 'solde' ? 'solde' : 'acompte'
      const { error: factureError } = await supabase
        .from('factures')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('dossier_id', dossierId)
        .eq('type', factureType)
        .eq('status', 'pending')

      if (factureError) {
        console.error('Error updating facture:', factureError)
      }

      // 4. Charger le dossier pour mettre a jour le statut
      const { data: updatedDossier, error: dossierError } = await supabase
        .from('dossiers')
        .select('*, paiements(*)')
        .eq('id', dossierId)
        .single()

      if (!dossierError && updatedDossier) {
        // Calculer le total paye
        const totalPaye = updatedDossier.paiements?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0
        const prixTTC = updatedDossier.price_ttc || 0
        const resteAPayer = prixTTC - totalPaye

        // Determiner le nouveau statut du dossier
        let newStatus = updatedDossier.status
        if (resteAPayer <= 0) {
          // Tout est paye
          newStatus = 'pending-info' // En attente des infos voyage
        } else if (updatedDossier.status === 'pending-payment') {
          // Acompte paye, en attente de confirmation transporteur
          newStatus = 'pending-reservation'
        }

        // Mettre a jour le statut du dossier
        if (newStatus !== updatedDossier.status) {
          await supabase
            .from('dossiers')
            .update({ status: newStatus })
            .eq('id', dossierId)
          console.log('Dossier status updated to:', newStatus)
        }
      }

      // 5. Ajouter une entree timeline
      await supabase.from('timeline').insert({
        dossier_id: dossierId,
        type: 'payment_received',
        description: `Paiement ${paymentType || 'cb'} recu: ${amountPaid}€`,
        metadata: {
          provider: 'paytweak',
          payment_id: providerPaymentId,
          amount: amountPaid,
          type: paymentType,
        },
      })

      // 6. Declencher le workflow de confirmation
      try {
        const workflowResponse = await fetch(`${SUPABASE_URL}/functions/v1/process-workflow`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            trigger: 'payment_received',
            dossier_id: dossierId,
            payment_type: paymentType || 'acompte',
          }),
        })
        console.log('Workflow triggered, status:', workflowResponse.status)
      } catch (workflowError) {
        console.error('Error triggering workflow:', workflowError)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Payment processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (eventType === 'payment.failed' || eventType === 'payment_failed' || eventType === 'failed') {
      console.log(`Payment failed for dossier ${dossierId}`)

      const linkId = paymentData.id || paymentData.link_id
      if (linkId) {
        await supabase
          .from('payment_links')
          .update({ status: 'failed' })
          .eq('dossier_id', dossierId)
          .eq('provider_link_id', linkId)
      }

      // Ajouter une entree timeline
      await supabase.from('timeline').insert({
        dossier_id: dossierId,
        type: 'payment_failed',
        description: `Echec du paiement ${paymentType || ''}`,
        metadata: {
          provider: 'paytweak',
          payment_id: paymentData.id,
          error: paymentData.error || paymentData.failure_reason,
        },
      })

      return new Response(
        JSON.stringify({ success: true, message: 'Payment failure recorded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (eventType === 'payment.expired' || eventType === 'expired') {
      console.log(`Payment link expired for dossier ${dossierId}`)

      const linkId = paymentData.id || paymentData.link_id
      if (linkId) {
        await supabase
          .from('payment_links')
          .update({ status: 'expired' })
          .eq('dossier_id', dossierId)
          .eq('provider_link_id', linkId)
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Expiration recorded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Evenement non gere
    console.log('Unhandled event type:', eventType)
    return new Response(
      JSON.stringify({ success: true, message: 'Event received but not processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
