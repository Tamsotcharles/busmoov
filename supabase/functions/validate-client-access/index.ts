import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, reference } = await req.json()

    if (!email || !reference) {
      return new Response(
        JSON.stringify({ error: 'Email et référence requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Rechercher le dossier avec service_role (bypass RLS)
    const { data: dossier, error: dossierError } = await supabase
      .from('dossiers')
      .select('id, reference, client_email, client_name, status, departure, arrival, departure_date, return_date, passengers, price_ttc')
      .eq('reference', reference.toUpperCase())
      .eq('client_email', email.toLowerCase())
      .single()

    if (dossierError || !dossier) {
      return new Response(
        JSON.stringify({ error: 'Aucun dossier trouvé avec ces informations' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Générer un token de session temporaire
    const sessionToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 heures

    return new Response(
      JSON.stringify({
        success: true,
        dossier: {
          id: dossier.id,
          reference: dossier.reference,
          email: dossier.client_email,
          client_name: dossier.client_name,
          status: dossier.status,
          departure: dossier.departure,
          arrival: dossier.arrival,
          departure_date: dossier.departure_date,
          return_date: dossier.return_date,
          passengers: dossier.passengers,
          price_ttc: dossier.price_ttc
        },
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})