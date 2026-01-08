import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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
      signataire_name,
      billing_info,
      payment_method,
      selected_options,
      client_ip,
      user_agent,
    } = body

    // Validation
    if (!dossier_id || !devis_id || !signataire_name) {
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

    // Récupérer le devis
    const { data: devis, error: devisError } = await supabaseAdmin
      .from('devis')
      .select('*')
      .eq('id', devis_id)
      .single()

    if (devisError || !devis) {
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
      })
      .eq('id', dossier_id)

    if (updateDossierError) {
      console.error('Erreur mise à jour dossier:', updateDossierError)
      throw updateDossierError
    }

    // 4. Ajouter à la timeline
    const paymentTypeLabel = isFullPaymentRequired ? 'paiement complet requis' : `acompte ${acomptePercent}%`
    await supabaseAdmin.from('timeline').insert({
      dossier_id: dossier_id,
      type: 'contract_signed',
      content: `📝 Contrat signé par ${signataire_name} - ${finalPriceTTC}€ TTC (${paymentTypeLabel}, ${payment_method === 'cb' ? 'CB' : 'Virement'})`,
    })

    // 5. Envoyer l'email de confirmation
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

      // Formater la date de départ
      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      }

      // Lien vers la page de paiement
      const baseUrl = 'https://busmoov.com'
      const lienPaiement = payment_method === 'cb'
        ? `${baseUrl}/paiement?ref=${dossier.reference}&email=${encodeURIComponent(dossier.client_email)}`
        : null

      const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
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
            montant_solde: `${calculatedSolde}€`,
            lien_espace_client: `${baseUrl}/mes-devis?ref=${dossier.reference}&email=${encodeURIComponent(dossier.client_email)}`,
            lien_paiement: lienPaiement || '',
            payment_method: payment_method === 'cb' ? 'Carte bancaire' : 'Virement bancaire',
            dossier_id: dossier_id,
          },
        }),
      })

      if (!emailResponse.ok) {
        const emailError = await emailResponse.text()
        console.error('Erreur envoi email confirmation:', emailError)
      } else {
        console.log('Email de confirmation envoyé à', dossier.client_email)
      }
    } catch (emailErr) {
      // Ne pas bloquer la signature si l'email échoue
      console.error('Erreur lors de l\'envoi de l\'email:', emailErr)
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
