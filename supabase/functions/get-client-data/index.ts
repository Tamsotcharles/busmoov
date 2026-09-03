import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Domaines autorisés pour CORS (meme allowlist que les autres fonctions).
const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'https://busmoov.fr',
  'https://www.busmoov.fr',
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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, reference, type } = await req.json()

    if (!email || !reference) {
      return new Response(
        JSON.stringify({ error: 'Email et référence requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Vérifier que le dossier appartient bien au client
    const { data: dossier, error: dossierError } = await supabase
      .from('dossiers')
      .select('id')
      .eq('reference', reference.toUpperCase())
      .eq('client_email', email.toLowerCase())
      .single()

    if (dossierError || !dossier) {
      return new Response(
        JSON.stringify({ error: 'Accès non autorisé' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const dossierId = dossier.id
    let result: any = {}

    // Récupérer les données selon le type demandé
    switch (type) {
      case 'dossier':
        const { data: fullDossier } = await supabase
          .from('dossiers')
          .select('*')
          .eq('id', dossierId)
          .single()
        result = { dossier: fullDossier }
        break

      case 'devis':
        const { data: devis } = await supabase
          .from('devis')
          .select('*, transporteur:transporteurs(name, rating)')
          .eq('dossier_id', dossierId)
          .order('created_at', { ascending: false })
        result = { devis }
        break

      case 'paiements':
        const { data: paiements } = await supabase
          .from('paiements')
          .select('*')
          .eq('dossier_id', dossierId)
          .order('payment_date', { ascending: false })
        result = { paiements }
        break

      case 'factures':
        const { data: factures } = await supabase
          .from('factures')
          // facture_origine : pour un avoir, la facture rectifiee, qui doit
          // figurer sur le document remis au client.
          .select('*, facture_origine:factures!facture_origine_id(reference)')
          .eq('dossier_id', dossierId)
          .order('created_at', { ascending: false })
        result = { factures }
        break

      case 'voyage_infos':
        const { data: voyageInfos } = await supabase
          .from('voyage_infos')
          .select('*')
          .eq('dossier_id', dossierId)
          .single()
        result = { voyage_infos: voyageInfos }
        break

      case 'contrat':
        const { data: contrat } = await supabase
          .from('contrats')
          .select('*')
          .eq('dossier_id', dossierId)
          .single()
        result = { contrat }
        break

      case 'messages':
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('dossier_id', dossierId)
          .order('created_at', { ascending: true })
        result = { messages }
        break

      case 'timeline':
        const { data: timeline } = await supabase
          .from('timeline')
          .select('*')
          .eq('dossier_id', dossierId)
          .order('created_at', { ascending: false })
        result = { timeline }
        break

      case 'all':
      default:
        const [dossierData, devisData, paiementsData, facturesData, voyageData, contratData] = await Promise.all([
          supabase.from('dossiers').select('*').eq('id', dossierId).single(),
          supabase.from('devis').select('*, transporteur:transporteurs(name, rating)').eq('dossier_id', dossierId),
          supabase.from('paiements').select('*').eq('dossier_id', dossierId),
          supabase.from('factures').select('*, facture_origine:factures!facture_origine_id(reference)').eq('dossier_id', dossierId),
          supabase.from('voyage_infos').select('*').eq('dossier_id', dossierId).single(),
          supabase.from('contrats').select('*').eq('dossier_id', dossierId).single()
        ])
        result = {
          dossier: dossierData.data,
          devis: devisData.data || [],
          paiements: paiementsData.data || [],
          factures: facturesData.data || [],
          voyage_infos: voyageData.data,
          contrat: contratData.data
        }
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
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