import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Domaines autorisés pour CORS (meme allowlist que les autres fonctions).
const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'https://www.busmoovlyon.fr', // microsite Lyon (formulaire de devis)
  'https://busmoovlyon.fr',
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
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-client-ref, x-client-email, x-validation-token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

/**
 * Page fournisseur « proposition de tarif ».
 *
 * La page faisait toutes ses lectures/ecritures directement avec la cle
 * anon : la RLS de demandes_fournisseurs les bloquait, si bien que le
 * lien envoye aux transporteurs n'a jamais pu aboutir. Comme pour
 * l'espace client (validate-client-access / get-client-data), l'acces
 * passe desormais par le serveur : le token est verifie ici, en
 * service_role, et seules les operations prevues sont possibles.
 *
 * Operations :
 *   get    -> donnees de la demande (dossier, devis, transporteur)
 *   submit -> enregistre le prix propose
 *   refuse -> marque le transporteur non disponible
 */

/**
 * Alerte email à l'équipe quand un transporteur répond (tarif ou refus).
 * Destinataire : app_settings.notifications_fournisseurs.email (sinon
 * ADMIN_NOTIFY_EMAIL, sinon infos@busmoov.com). Jamais bloquant.
 */
async function notifyAdminByEmail(
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any,
  params: { subject: string; html: string; dossierId: string },
) {
  try {
    let to = Deno.env.get('ADMIN_NOTIFY_EMAIL') || 'infos@busmoov.com'
    const { data: setting } = await supabaseAdmin
      .from('app_settings')
      .select('value')
      .eq('key', 'notifications_fournisseurs')
      .maybeSingle()
    const cfg = setting?.value as { email?: string; enabled?: boolean } | null
    if (cfg?.enabled === false) return
    if (cfg?.email) to = cfg.email

    const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        type: 'custom',
        to,
        subject: params.subject,
        html_content: params.html,
        data: { dossier_id: params.dossierId, language: 'fr' },
      }),
    })
    if (!res.ok) console.error('Alerte admin non envoyée:', res.status, await res.text())
  } catch (e) {
    console.error('Alerte admin: erreur', e)
  }
}

const esc = (v: unknown) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const { action, demande_id, token, prix } = await req.json()

    if (!demande_id || !token) {
      return json({ error: 'Lien invalide' }, 400)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Le token EST l'authentification : toute operation commence par la.
    const { data: demande, error: demandeError } = await supabaseAdmin
      .from('demandes_fournisseurs')
      .select(`
        id,
        status,
        prix_propose,
        validation_token,
        transporteur_id,
        dossier:dossiers (
          id, reference, client_name, departure, arrival, departure_date, departure_time,
          return_date, return_time, passengers, trip_mode, special_requests,
          vehicle_type, nombre_cars, nombre_chauffeurs, wifi, wc,
          accessibility, luggage_type, country_code, tva_rate,
          devis ( service_type, nombre_cars, nombre_chauffeurs, duree_jours,
                  vehicle_type, km, status )
        ),
        transporteur:transporteurs ( id, name )
      `)
      .eq('id', demande_id)
      .single()

    if (demandeError || !demande || demande.validation_token !== token) {
      // Meme reponse que la demande soit inconnue ou le token faux :
      // ne pas servir d'oracle d'enumeration.
      return json({ error: 'Lien invalide ou expiré' }, 403)
    }

    const dossier = demande.dossier as Record<string, unknown> | null
    const transporteur = demande.transporteur as { id: string; name: string } | null

    if (action === 'get' || !action) {
      // Ne jamais renvoyer le token au navigateur.
      const safe: Record<string, unknown> = { ...demande }
      delete safe.validation_token
      return json({ success: true, demande: safe })
    }

    if (action === 'submit') {
      const prixNumber = Number(prix)
      if (!Number.isFinite(prixNumber) || prixNumber <= 0) {
        return json({ error: 'Prix invalide' }, 400)
      }

      const { error: updateError } = await supabaseAdmin
        .from('demandes_fournisseurs')
        .update({
          prix_propose: prixNumber,
          status: 'tarif_recu',
          tarif_received_at: new Date().toISOString(),
        })
        .eq('id', demande_id)
        .eq('validation_token', token)

      if (updateError) throw updateError

      if (dossier && transporteur) {
        const tvaRate = (dossier.tva_rate as number) ?? 10
        const prixHT = Math.round((prixNumber / (1 + tvaRate / 100)) * 100) / 100
        const fmt = (n: number) =>
          new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

        await supabaseAdmin.from('timeline').insert({
          dossier_id: dossier.id,
          type: 'note',
          content: `Proposition tarifaire reçue de ${transporteur.name} : ${fmt(prixNumber)} TTC (${fmt(prixHT)} HT)`,
        })

        await supabaseAdmin.from('notifications_crm').insert({
          dossier_id: dossier.id,
          dossier_reference: dossier.reference,
          type: 'tarif_recu',
          title: `Tarif reçu de ${transporteur.name}`,
          description: `${transporteur.name} propose ${fmt(prixNumber)} TTC pour ${dossier.departure} → ${dossier.arrival}`,
          source_type: 'transporteur',
          source_name: transporteur.name,
          source_id: transporteur.id,
        })

        const adminUrl = `https://www.busmoov.com/admin?dossierId=${dossier.id}`
        await notifyAdminByEmail(supabaseAdmin, {
          dossierId: dossier.id,
          subject: `💰 Tarif reçu : ${fmt(prixNumber)} TTC — ${dossier.reference} (${transporteur.name})`,
          html: `
            <p><strong>${esc(transporteur.name)}</strong> vient de répondre à la demande de prix du dossier <strong>${esc(dossier.reference)}</strong>.</p>
            <table style="border-collapse:collapse">
              <tr><td style="padding:4px 12px 4px 0;color:#666">Trajet</td><td style="padding:4px 0"><strong>${esc(dossier.departure)} → ${esc(dossier.arrival)}</strong></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666">Prix proposé</td><td style="padding:4px 0"><strong>${fmt(prixNumber)} TTC</strong> (${fmt(prixHT)} HT)</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#666">Client</td><td style="padding:4px 0">${esc(dossier.client_name)}</td></tr>
            </table>
            <p style="margin-top:16px"><a href="${adminUrl}" style="display:inline-block;padding:10px 18px;background-color:#E6007E;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Ouvrir le dossier et valider la commande</a></p>
          `,
        })
      }

      return json({ success: true })
    }

    if (action === 'refuse') {
      const { error: updateError } = await supabaseAdmin
        .from('demandes_fournisseurs')
        .update({
          status: 'non_disponible',
          refused_at: new Date().toISOString(),
        })
        .eq('id', demande_id)
        .eq('validation_token', token)

      if (updateError) throw updateError

      if (dossier && transporteur) {
        await supabaseAdmin.from('timeline').insert({
          dossier_id: dossier.id,
          type: 'note',
          content: `${transporteur.name} a décliné la demande de tarif (non disponible)`,
        })

        await supabaseAdmin.from('notifications_crm').insert({
          dossier_id: dossier.id,
          dossier_reference: dossier.reference,
          type: 'refus_fournisseur',
          title: `Refus de ${transporteur.name}`,
          description: `${transporteur.name} n'est pas disponible pour le trajet ${dossier.departure} → ${dossier.arrival}`,
          source_type: 'transporteur',
          source_name: transporteur.name,
          source_id: transporteur.id,
        })

        await notifyAdminByEmail(supabaseAdmin, {
          dossierId: dossier.id,
          subject: `⛔ Refus fournisseur — ${dossier.reference} (${transporteur.name})`,
          html: `
            <p><strong>${esc(transporteur.name)}</strong> n'est pas disponible pour le dossier <strong>${esc(dossier.reference)}</strong> (${esc(dossier.departure)} → ${esc(dossier.arrival)}).</p>
            <p><a href="https://www.busmoov.com/admin?dossierId=${dossier.id}">Ouvrir le dossier</a> pour solliciter d'autres transporteurs.</p>
          `,
        })
      }

      return json({ success: true })
    }

    return json({ error: 'Action inconnue' }, 400)
  } catch (error) {
    console.error('Erreur proposition-tarif:', error)
    return json({ error: 'Erreur serveur' }, 500)
  }
})
