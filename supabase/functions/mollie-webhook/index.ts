import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Mollie envoie les webhooks en POST sans CORS
serve(async (req) => {
  // Mollie envoie uniquement des POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!MOLLIE_API_KEY) {
      throw new Error('MOLLIE_API_KEY not configured')
    }

    // Mollie envoie le payment ID dans le body (form-urlencoded)
    const formData = await req.formData()
    const paymentId = formData.get('id') as string

    if (!paymentId) {
      console.error('No payment ID in webhook')
      return new Response('Missing payment ID', { status: 400 })
    }

    console.log('Mollie webhook received for payment:', paymentId)

    // Recuperer les details du paiement depuis Mollie
    const paymentResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
      },
    })

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text()
      console.error('Mollie API error:', errorText)
      throw new Error(`Erreur Mollie API: ${paymentResponse.status}`)
    }

    const payment = await paymentResponse.json()
    console.log('Mollie payment status:', payment.status, 'metadata:', payment.metadata)

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Extraire les metadata
    const { dossier_id, type, reference, client_email } = payment.metadata || {}

    if (!dossier_id) {
      console.error('No dossier_id in payment metadata')
      return new Response('Missing dossier_id', { status: 400 })
    }

    // Verifier idempotence - ne pas traiter deux fois le meme paiement
    const { data: existingPayment } = await supabase
      .from('paiements')
      .select('id')
      .eq('provider_payment_id', paymentId)
      .single()

    if (existingPayment) {
      console.log('Payment already processed:', paymentId)
      return new Response('OK', { status: 200 })
    }

    // Traiter selon le statut Mollie
    // Statuts Mollie: open, canceled, pending, authorized, expired, failed, paid
    if (payment.status === 'paid') {
      console.log('Payment successful, processing...')

      const amount = parseFloat(payment.amount.value)

      // 1. Creer l'entree paiement
      // Note: type doit etre 'cb' pour carte bancaire (contrainte CHECK)
      const { error: paiementError } = await supabase
        .from('paiements')
        .insert({
          dossier_id,
          amount,
          type: 'cb', // Paiement par carte via Mollie
          payment_date: new Date().toISOString(),
          reference: `MOLLIE-${paymentId}`,
          provider: 'mollie',
          provider_payment_id: paymentId,
          notes: `Paiement ${type || 'acompte'} via Mollie`,
        })

      if (paiementError) {
        console.error('Error creating paiement:', paiementError)
      }

      // 2. Mettre a jour le payment_link
      const { error: linkError } = await supabase
        .from('payment_links')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('provider_link_id', paymentId)

      if (linkError) {
        console.error('Error updating payment_link:', linkError)
      }

      // 3. Mettre a jour la facture correspondante
      const { error: factureError } = await supabase
        .from('factures')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('dossier_id', dossier_id)
        .eq('type', type || 'acompte')
        .eq('status', 'pending')

      if (factureError) {
        console.error('Error updating facture:', factureError)
      }

      // 4. Mettre a jour le statut du dossier
      const { data: dossier } = await supabase
        .from('dossiers')
        .select('price_ttc, status')
        .eq('id', dossier_id)
        .single()

      // Calculer le total paye
      const { data: paiements } = await supabase
        .from('paiements')
        .select('amount')
        .eq('dossier_id', dossier_id)
        .eq('status', 'completed')

      const totalPaid = paiements?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0

      let newStatus = dossier?.status
      if (dossier?.price_ttc && totalPaid >= dossier.price_ttc) {
        // Solde complet paye -> attente infos voyage
        newStatus = 'pending-info'
      } else if (type === 'acompte') {
        // Acompte paye -> attente reservation transporteur
        newStatus = 'pending-reservation'
      }

      if (newStatus && newStatus !== dossier?.status) {
        await supabase
          .from('dossiers')
          .update({ status: newStatus })
          .eq('id', dossier_id)
      }

      // 5. Ajouter entree timeline
      await supabase.from('timeline').insert({
        dossier_id,
        type: 'payment_received',
        description: `Paiement ${type || 'acompte'} recu: ${amount}€ via Mollie`,
        metadata: { provider: 'mollie', payment_id: paymentId, amount },
      })

      // 6. Declencher le workflow (email de confirmation)
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/process-workflow`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            trigger_event: 'payment_received',
            dossier_id,
            payment_type: type || 'acompte',
          }),
        })
      } catch (workflowError) {
        console.error('Error triggering workflow:', workflowError)
      }

      console.log('Payment processed successfully')

    } else if (['canceled', 'expired', 'failed'].includes(payment.status)) {
      console.log('Payment failed/canceled/expired:', payment.status)

      // Mettre a jour le payment_link
      await supabase
        .from('payment_links')
        .update({ status: payment.status })
        .eq('provider_link_id', paymentId)

      // Ajouter entree timeline
      await supabase.from('timeline').insert({
        dossier_id,
        type: 'payment_failed',
        description: `Paiement ${type || ''} echoue (${payment.status})`,
        metadata: { provider: 'mollie', payment_id: paymentId, status: payment.status },
      })

      // Recuperer les infos du dossier pour la notification
      const { data: dossierInfo } = await supabase
        .from('dossiers')
        .select('reference, client_name, departure, arrival')
        .eq('id', dossier_id)
        .single()

      // Creer une notification CRM pour alerter l'admin
      const statusLabels: Record<string, string> = {
        canceled: 'annulé',
        expired: 'expiré',
        failed: 'échoué',
      }
      const statusLabel = statusLabels[payment.status] || payment.status
      const amount = parseFloat(payment.amount?.value || '0')

      await supabase.from('notifications_crm').insert({
        dossier_id,
        dossier_reference: dossierInfo?.reference || reference,
        type: 'paiement_echoue',
        title: `Paiement CB ${statusLabel} - ${amount}€`,
        description: `Le paiement ${type || 'acompte'} de ${dossierInfo?.client_name || 'Client'} a ${statusLabel}. Dossier: ${dossierInfo?.departure || ''} → ${dossierInfo?.arrival || ''}`,
        source_type: 'system',
        source_name: 'Mollie',
        metadata: {
          payment_status: payment.status,
          amount,
          payment_type: type || 'acompte',
          payment_id: paymentId,
        },
      })

    } else {
      // Statuts intermediaires (open, pending, authorized)
      console.log('Payment in intermediate status:', payment.status)
    }

    // Mollie attend une reponse 200 OK
    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Webhook error:', error)
    // Retourner 200 quand meme pour eviter les retries infinies
    // Les erreurs sont loggees pour debug
    return new Response('OK', { status: 200 })
  }
})
