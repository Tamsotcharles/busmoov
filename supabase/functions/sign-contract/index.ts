import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Domaines autorisés pour CORS
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

// Helper pour obtenir le préfixe de langue à partir du code pays
function getLanguageFromCountry(countryCode: string | null | undefined): string {
  switch (countryCode?.toUpperCase()) {
    case 'ES': return 'es'
    case 'DE': return 'de'
    case 'GB': return 'en'
    case 'FR':
    default: return 'fr'
  }
}

// Helper pour générer une URL localisée
function generateLocalizedUrl(baseUrl: string, path: string, countryCode: string | null | undefined, params: Record<string, string>): string {
  const lang = getLanguageFromCountry(countryCode)
  const queryString = new URLSearchParams(params).toString()
  return `${baseUrl}/${lang}${path}?${queryString}`
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const {
      dossier_id,
      devis_id,
      client_email,
      signataire_name,
      billing_info,
      e_invoice_info,
      payment_method,
      selected_options,
      client_ip,
      user_agent,
    } = body

    // Validation
    if (!dossier_id || !devis_id || !signataire_name || !client_email) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer le dossier
    const { data: dossier, error: dossierError } = await supabaseAdmin
      .from('dossiers')
      .select('*')
      .eq('id', dossier_id)
      .single()

    if (dossierError || !dossier) {
      return new Response(
        JSON.stringify({ error: 'Dossier non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GARDE 1 — Preuve de possession du dossier.
    // Cette fonction tourne en service_role et contourne donc la RLS : sans
    // cette verification, connaitre l'UUID du dossier (il circule dans les
    // URLs et les emails) suffirait a signer a la place du client.
    // Meme niveau de preuve que le reste de l'espace client (reference + email).
    if (
      (dossier.client_email ?? '').trim().toLowerCase() !==
      String(client_email).trim().toLowerCase()
    ) {
      console.warn(`Signature refusee : email non concordant pour le dossier ${dossier_id}`)
      return new Response(
        JSON.stringify({ error: 'Accès non autorisé à ce dossier' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GARDE 2 — Idempotence.
    // Sans cela, rejouer la requete cree PRO-xxx-2, -3... et reecrit a chaque
    // fois le prix et le statut du dossier.
    if (dossier.contract_signed_at) {
      console.warn(`Signature refusee : dossier ${dossier_id} deja signe le ${dossier.contract_signed_at}`)
      return new Response(
        JSON.stringify({
          error: 'Ce dossier a déjà été signé',
          already_signed: true,
          signed_at: dossier.contract_signed_at,
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer le devis
    // GARDE 3 — le devis doit appartenir au dossier signe. Sans le filtre
    // dossier_id, on pouvait signer un dossier en passant l'id d'un devis
    // moins cher appartenant a un autre dossier : le prix de CE devis etait
    // alors ecrit dans le dossier et le contrat.
    const { data: devis, error: devisError } = await supabaseAdmin
      .from('devis')
      .select('*')
      .eq('id', devis_id)
      .eq('dossier_id', dossier_id)
      .single()

    if (devisError || !devis) {
      console.warn(`Signature refusee : devis ${devis_id} introuvable ou non rattache au dossier ${dossier_id}`)
      return new Response(
        JSON.stringify({ error: 'Devis non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const signedAt = new Date().toISOString()

    // Compter les contrats existants pour générer une ref unique
    const { count: existingContratsCount } = await supabaseAdmin
      .from('contrats')
      .select('*', { count: 'exact', head: true })
      .eq('dossier_id', dossier_id)

    const proformaReference = existingContratsCount && existingContratsCount > 0
      ? `PRO-${dossier.reference}-${existingContratsCount + 1}`
      : `PRO-${dossier.reference}`

    // Vérifier si l'offre flash est expirée
    const promoExpiresAt = devis.promo_expires_at
    const promoOriginalPrice = devis.promo_original_price
    const isPromoExpired = promoExpiresAt && promoOriginalPrice && new Date(promoExpiresAt) <= new Date()

    // Prix de base du devis
    const basePriceTTC = isPromoExpired ? promoOriginalPrice : devis.price_ttc
    const tvaRate = devis.tva_rate || 10

    // Calculer le montant des options sélectionnées
    const optionsDetails = devis.options_details || {}
    const nbChauffeurs = devis.nombre_chauffeurs || 1
    const nbNuits = optionsDetails.hebergement?.nuits || 0

    // Calculer le nombre de jours pour les repas
    let dureeJours = devis.duree_jours || 1
    if (!devis.duree_jours && dossier.return_date && dossier.departure_date) {
      const depDate = new Date(dossier.departure_date)
      const retDate = new Date(dossier.return_date)
      dureeJours = Math.max(1, Math.ceil((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    }
    const nbRepas = dureeJours * 2

    let optionsTotal = 0
    const optionsSelected: { label: string; montant: number }[] = []

    if (selected_options?.peages && optionsDetails.peages?.status === 'non_inclus') {
      const montant = optionsDetails.peages.montant || 0
      optionsTotal += montant
      optionsSelected.push({ label: 'Péages', montant })
    }
    if (selected_options?.repas_chauffeur && optionsDetails.repas_chauffeur?.status === 'non_inclus') {
      const montant = (optionsDetails.repas_chauffeur.montant || 0) * nbRepas * nbChauffeurs
      optionsTotal += montant
      optionsSelected.push({ label: `Repas chauffeur (${nbRepas} repas × ${nbChauffeurs} chauff.)`, montant })
    }
    if (selected_options?.parking && optionsDetails.parking?.status === 'non_inclus') {
      const montant = optionsDetails.parking.montant || 0
      optionsTotal += montant
      optionsSelected.push({ label: 'Parking', montant })
    }
    if (selected_options?.hebergement && optionsDetails.hebergement?.status === 'non_inclus') {
      const montant = (optionsDetails.hebergement.montant || 0) * nbNuits * nbChauffeurs
      optionsTotal += montant
      optionsSelected.push({ label: `Hébergement (${nbNuits} nuits × ${nbChauffeurs} chauff.)`, montant })
    }

    // Prix final
    const finalPriceTTC = basePriceTTC + optionsTotal
    const finalPriceHT = Math.round((finalPriceTTC / (1 + tvaRate / 100)) * 100) / 100

    // Charger les paramètres de paiement
    const { data: paymentSettingsData } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'payment_settings')
      .single()

    const paymentSettings = paymentSettingsData?.value || {
      acompte_percent: 30,
      full_payment_threshold_days: 30,
    }

    // Calculer le délai avant départ
    const departureDate = new Date(dossier.departure_date)
    const today = new Date()
    const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    // Si départ proche, demander paiement complet
    const isFullPaymentRequired = daysUntilDeparture <= paymentSettings.full_payment_threshold_days
    const acomptePercent = isFullPaymentRequired ? 100 : paymentSettings.acompte_percent
    const calculatedAcompte = Math.round(finalPriceTTC * (acomptePercent / 100))
    const calculatedSolde = Math.round(finalPriceTTC - calculatedAcompte)

    // 1. Mettre à jour le devis
    const { error: updateDevisError } = await supabaseAdmin
      .from('devis')
      .update({ status: 'accepted', accepted_at: signedAt })
      .eq('id', devis_id)

    if (updateDevisError) {
      console.error('Erreur mise à jour devis:', updateDevisError)
      throw updateDevisError
    }

    // 2. Créer le contrat
    const { error: contratError } = await supabaseAdmin.from('contrats').insert({
      dossier_id: dossier_id,
      reference: proformaReference,
      price_ttc: finalPriceTTC,
      acompte_amount: calculatedAcompte,
      solde_amount: calculatedSolde,
      signed_at: signedAt,
      signed_by_client: true,
      signed_by_admin: true,
      client_ip: client_ip || null,
      user_agent: user_agent || null,
      client_name: signataire_name,
      client_email: dossier.client_email,
      billing_address: billing_info?.address || null,
      billing_zip: billing_info?.zip || null,
      billing_city: billing_info?.city || null,
      billing_country: billing_info?.country || 'France',
      status: 'active',
    })

    if (contratError) {
      console.error('Erreur création contrat:', contratError)
      throw contratError
    }

    // 3. Mettre à jour le dossier
    const { error: updateDossierError } = await supabaseAdmin
      .from('dossiers')
      .update({
        contract_signed_at: signedAt,
        status: 'pending-payment',
        price_ht: finalPriceHT,
        price_ttc: finalPriceTTC,
        acompte_amount: calculatedAcompte,
        solde_amount: calculatedSolde,
        vehicle_type: devis.vehicle_type,
        billing_address: billing_info?.address || null,
        billing_zip: billing_info?.zip || null,
        billing_city: billing_info?.city || null,
        billing_country: billing_info?.country || 'France',
        payment_method: payment_method,
        signer_name: signataire_name,
        // Champs e-invoice (facturation électronique B2B/B2G)
        client_vat_number: e_invoice_info?.vat_number || null,
        client_order_reference: e_invoice_info?.order_reference || null,
        client_leitweg_id: e_invoice_info?.leitweg_id || null,
        client_dir3_code: e_invoice_info?.dir3_code || null,
      })
      .eq('id', dossier_id)

    if (updateDossierError) {
      console.error('Erreur mise à jour dossier:', updateDossierError)
      throw updateDossierError
    }

    // 4. Désactiver l'auto-devis pour ce dossier (le contrat est signé)
    const { error: autoDevisError } = await supabaseAdmin
      .from('dossier_auto_devis')
      .update({ is_active: false, deactivated_at: signedAt })
      .eq('dossier_id', dossier_id)
      .eq('is_active', true)

    if (autoDevisError) {
      // Ne pas bloquer si l'auto-devis n'existe pas ou échoue
      console.log('Note: Auto-devis désactivation:', autoDevisError.message)
    } else {
      console.log('Auto-devis désactivé pour le dossier', dossier_id)
    }

    // 5. Ajouter à la timeline
    const paymentTypeLabel = isFullPaymentRequired ? 'paiement complet requis' : `acompte ${acomptePercent}%`
    await supabaseAdmin.from('timeline').insert({
      dossier_id: dossier_id,
      type: 'contract_signed',
      content: `📝 Contrat signé par ${signataire_name} - ${finalPriceTTC}€ TTC (${paymentTypeLabel}, ${payment_method === 'cb' ? 'CB' : 'Virement'})`,
    })

    // 5b. Créer une notification CRM pour le contrat signé
    try {
      await supabaseAdmin.from('notifications_crm').insert({
        dossier_id: dossier_id,
        dossier_reference: dossier.reference,
        type: 'contrat_signe',
        title: 'Contrat signé',
        description: `${signataire_name} a signé le contrat pour ${dossier.departure} → ${dossier.arrival} - ${finalPriceTTC}€ TTC`,
        source_type: 'client',
        source_name: signataire_name,
        is_read: false,
        metadata: {
          price_ttc: finalPriceTTC,
          acompte: calculatedAcompte,
          payment_method: payment_method,
        },
      })
      console.log('Notification CRM créée pour contrat signé')
    } catch (notifError) {
      // Ne pas bloquer si la notification échoue
      console.error('Erreur création notification CRM:', notifError)
    }

    // 6. Envoyer l'email de confirmation
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

      console.log('=== ENVOI EMAIL CONFIRMATION ===')
      console.log('supabaseUrl:', supabaseUrl ? 'OK' : 'MANQUANT')
      console.log('supabaseAnonKey:', supabaseAnonKey ? 'OK (length: ' + supabaseAnonKey.length + ')' : 'MANQUANT')
      console.log('Email destinataire:', dossier.client_email)

      // Formater la date de départ
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      }

      // Liens localisés vers les pages client
      const baseUrl = 'https://busmoov.com'
      const countryCode = dossier.country_code
      const lienEspaceClient = generateLocalizedUrl(baseUrl, '/mes-devis', countryCode, { ref: dossier.reference, email: dossier.client_email })
      const lienPaiement = payment_method === 'cb'
        ? generateLocalizedUrl(baseUrl, '/paiement', countryCode, { ref: dossier.reference, email: dossier.client_email })
        : null

      const emailPayload = {
        type: 'confirmation_reservation',
        to: dossier.client_email,
        data: {
          client_name: signataire_name,
          reference: dossier.reference,
          departure: dossier.departure,
          arrival: dossier.arrival,
          departure_date: formatDate(dossier.departure_date),
          passengers: String(dossier.passengers),
          total_ttc: `${finalPriceTTC}€`,
          montant_acompte: `${calculatedAcompte}€`,
          montant_solde: calculatedSolde > 0 ? `${calculatedSolde}€` : '',
          lien_espace_client: lienEspaceClient,
          lien_paiement: lienPaiement || '',
          payment_method: payment_method === 'cb' ? 'Carte bancaire' : 'Virement bancaire',
          is_virement: payment_method === 'virement' ? 'true' : '',
          dossier_id: dossier_id,
          language: getLanguageFromCountry(countryCode),
        },
      }

      console.log('Payload email:', JSON.stringify(emailPayload, null, 2))

      const emailUrl = `${supabaseUrl}/functions/v1/send-email`
      console.log('URL appel:', emailUrl)

      const emailResponse = await fetch(emailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(emailPayload),
      })

      console.log('Réponse email - Status:', emailResponse.status)

      const emailResponseText = await emailResponse.text()
      console.log('Réponse email - Body:', emailResponseText)

      if (!emailResponse.ok) {
        console.error('Erreur envoi email confirmation:', emailResponseText)
      } else {
        console.log('Email de confirmation envoyé avec succès à', dossier.client_email)
      }
    } catch (emailErr) {
      // Ne pas bloquer la signature si l'email échoue
      console.error('Exception lors de l\'envoi de l\'email:', emailErr)
    }

    // Retourner les données pour la génération du PDF côté client
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          proforma_reference: proformaReference,
          price_ttc: finalPriceTTC,
          base_price_ttc: basePriceTTC,
          options_lignes: optionsSelected.length > 0 ? optionsSelected : null,
          acompte_amount: calculatedAcompte,
          solde_amount: calculatedSolde,
          acompte_percent: acomptePercent,
          is_full_payment: isFullPaymentRequired,
          signed_at: signedAt,
          tva_rate: tvaRate,
          nombre_chauffeurs: nbChauffeurs,
          nombre_cars: devis.nombre_cars || 1,
          service_type: devis.service_type || dossier.trip_mode,
          duree_jours: dureeJours > 1 ? dureeJours : null,
          detail_mad: devis.detail_mad,
          dossier: {
            reference: dossier.reference,
            client_name: signataire_name,
            client_email: dossier.client_email,
            client_phone: dossier.client_phone,
            departure: dossier.departure,
            arrival: dossier.arrival,
            departure_date: dossier.departure_date,
            departure_time: dossier.departure_time,
            return_date: dossier.return_date,
            return_time: dossier.return_time,
            passengers: dossier.passengers,
            vehicle_type: devis.vehicle_type,
            trip_mode: dossier.trip_mode,
            transporteur: devis.transporteur,
            country_code: dossier.country_code || 'FR',
          },
          billing_info: {
            address: billing_info?.address,
            zip: billing_info?.zip,
            city: billing_info?.city,
            country: billing_info?.country || 'France',
          },
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in sign-contract:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur lors de la signature' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
