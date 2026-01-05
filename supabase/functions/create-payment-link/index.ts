import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentLinkRequest {
  dossier_id: string
  amount: number
  type: 'acompte' | 'solde'
  client_email: string
  client_name: string
  reference: string
}

// Validation des donnees
function validateRequest(data: PaymentLinkRequest): string | null {
  if (!data.dossier_id || typeof data.dossier_id !== 'string') {
    return 'dossier_id invalide'
  }
  if (!data.amount || typeof data.amount !== 'number' || data.amount <= 0) {
    return 'Montant invalide (doit etre positif)'
  }
  if (data.amount > 100000) {
    return 'Montant trop eleve (max 100 000€)'
  }
  if (!data.type || !['acompte', 'solde'].includes(data.type)) {
    return 'Type invalide (acompte ou solde)'
  }
  if (!data.client_email || !data.client_email.includes('@')) {
    return 'Email invalide'
  }
  if (!data.reference || typeof data.reference !== 'string') {
    return 'Reference invalide'
  }
  // Validation UUID basique
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(data.dossier_id)) {
    return 'Format dossier_id invalide'
  }
  return null
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const PAYTWEAK_API_KEY = Deno.env.get('PAYTWEAK_API_KEY')
    const PAYTWEAK_API_URL = Deno.env.get('PAYTWEAK_API_URL') || 'https://api.paytweak.com'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const APP_URL = Deno.env.get('APP_URL') || 'https://busmoov.com'

    if (!PAYTWEAK_API_KEY) {
      throw new Error('PAYTWEAK_API_KEY not configured')
    }

    const requestData: PaymentLinkRequest = await req.json()

    // Validation des donnees
    const validationError = validateRequest(requestData)
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { dossier_id, amount, type, client_email, client_name, reference } = requestData

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // SECURITE: Verifier que le dossier existe et appartient bien a ce client
    const { data: dossier, error: dossierError } = await supabase
      .from('dossiers')
      .select('id, reference, client_email, price_ttc, status')
      .eq('id', dossier_id)
      .single()

    if (dossierError || !dossier) {
      console.error('Dossier not found:', dossier_id)
      return new Response(
        JSON.stringify({ error: 'Dossier non trouve' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verifier que l'email correspond
    if (dossier.client_email.toLowerCase() !== client_email.toLowerCase()) {
      console.error('Email mismatch:', { expected: dossier.client_email, received: client_email })
      return new Response(
        JSON.stringify({ error: 'Email ne correspond pas au dossier' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verifier que la reference correspond
    if (dossier.reference !== reference) {
      console.error('Reference mismatch:', { expected: dossier.reference, received: reference })
      return new Response(
        JSON.stringify({ error: 'Reference ne correspond pas' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verifier que le montant est coherent avec le prix du dossier
    if (dossier.price_ttc && amount > dossier.price_ttc) {
      console.error('Amount exceeds dossier price:', { amount, price_ttc: dossier.price_ttc })
      return new Response(
        JSON.stringify({ error: 'Montant superieur au prix du dossier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verifier qu'il n'y a pas deja un lien de paiement en attente pour ce type
    const { data: existingLink } = await supabase
      .from('payment_links')
      .select('id, payment_url, status')
      .eq('dossier_id', dossier_id)
      .eq('type', type)
      .eq('status', 'pending')
      .single()

    if (existingLink) {
      // Retourner le lien existant au lieu d'en creer un nouveau
      console.log('Returning existing payment link:', existingLink.id)
      return new Response(
        JSON.stringify({
          success: true,
          payment_url: existingLink.payment_url,
          link_id: existingLink.id,
          existing: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Creer le lien de paiement PayTweak
    const paymentData = {
      amount: Math.round(amount * 100), // PayTweak attend les centimes
      currency: 'EUR',
      description: `${type === 'acompte' ? 'Acompte' : 'Solde'} - Dossier ${reference}`,
      customer: {
        email: client_email,
        name: client_name || client_email.split('@')[0],
      },
      metadata: {
        dossier_id,
        type,
        reference,
      },
      success_url: `${APP_URL}/client/espace?ref=${encodeURIComponent(reference)}&email=${encodeURIComponent(client_email)}&payment=success`,
      cancel_url: `${APP_URL}/client/espace?ref=${encodeURIComponent(reference)}&email=${encodeURIComponent(client_email)}&payment=cancelled`,
      webhook_url: `${SUPABASE_URL}/functions/v1/paytweak-webhook`,
    }

    console.log('Creating PayTweak payment link for dossier:', dossier_id)

    const paymentResponse = await fetch(`${PAYTWEAK_API_URL}/v1/payment-links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYTWEAK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text()
      console.error('PayTweak API error:', errorText)
      throw new Error(`Erreur PayTweak: ${paymentResponse.status}`)
    }

    const paymentResult = await paymentResponse.json()
    console.log('PayTweak link created:', paymentResult.id)

    // Enregistrer le lien de paiement en base
    const { error: insertError } = await supabase
      .from('payment_links')
      .insert({
        dossier_id,
        provider: 'paytweak',
        provider_link_id: paymentResult.id,
        payment_url: paymentResult.url || paymentResult.payment_url,
        amount,
        type,
        status: 'pending',
        expires_at: paymentResult.expires_at || null,
      })

    if (insertError) {
      console.error('Error saving payment link:', insertError)
    }

    // Ajouter une entree timeline
    await supabase.from('timeline').insert({
      dossier_id,
      type: 'payment_link_created',
      description: `Lien de paiement ${type} cree (${amount}€)`,
      metadata: { provider: 'paytweak', link_id: paymentResult.id },
    })

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: paymentResult.url || paymentResult.payment_url,
        link_id: paymentResult.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating payment link:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur lors de la creation du lien de paiement' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
