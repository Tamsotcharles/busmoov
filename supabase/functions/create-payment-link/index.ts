import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Domaines autorisés pour CORS
const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'https://busmoov.fr',
  'https://www.busmoov.fr',
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
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const APP_URL = Deno.env.get('APP_URL') || 'https://busmoov.com'

    if (!MOLLIE_API_KEY) {
      throw new Error('MOLLIE_API_KEY not configured')
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

    // Creer le paiement Mollie
    const paymentData = {
      amount: {
        currency: 'EUR',
        value: amount.toFixed(2), // Mollie attend un string avec 2 decimales
      },
      description: `${type === 'acompte' ? 'Acompte' : 'Solde'} - Dossier ${reference}`,
      redirectUrl: `${APP_URL}/client/espace?ref=${encodeURIComponent(reference)}&email=${encodeURIComponent(client_email)}&payment=success`,
      cancelUrl: `${APP_URL}/client/espace?ref=${encodeURIComponent(reference)}&email=${encodeURIComponent(client_email)}&payment=cancelled`,
      webhookUrl: `${SUPABASE_URL}/functions/v1/mollie-webhook`,
      metadata: {
        dossier_id,
        type,
        reference,
        client_email,
      },
    }

    console.log('Creating Mollie payment for dossier:', dossier_id)

    const paymentResponse = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      console.error('Mollie API error:', errorData)
      throw new Error(`Erreur Mollie: ${errorData.detail || paymentResponse.status}`)
    }

    const paymentResult = await paymentResponse.json()
    console.log('Mollie payment created:', paymentResult.id)

    // Recuperer l'URL de checkout
    const checkoutUrl = paymentResult._links?.checkout?.href

    if (!checkoutUrl) {
      console.error('No checkout URL in Mollie response:', paymentResult)
      throw new Error('Pas de lien de paiement dans la reponse Mollie')
    }

    // Enregistrer le lien de paiement en base
    const { error: insertError } = await supabase
      .from('payment_links')
      .insert({
        dossier_id,
        provider: 'mollie',
        provider_link_id: paymentResult.id,
        payment_url: checkoutUrl,
        amount,
        type,
        status: 'pending',
        expires_at: paymentResult.expiresAt || null,
      })

    if (insertError) {
      console.error('Error saving payment link:', insertError)
    }

    // Ajouter une entree timeline
    await supabase.from('timeline').insert({
      dossier_id,
      type: 'payment_link_created',
      description: `Lien de paiement ${type} cree (${amount}€)`,
      metadata: { provider: 'mollie', payment_id: paymentResult.id },
    })

    return new Response(
      JSON.stringify({
        success: true,
        payment_url: checkoutUrl,
        payment_id: paymentResult.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error creating payment link:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la creation du lien de paiement' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
