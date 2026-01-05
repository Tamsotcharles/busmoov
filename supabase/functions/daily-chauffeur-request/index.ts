import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Generate a unique token for chauffeur request
function generateChauffeurToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Get departure dates to check based on day of week
function getDepartureDates(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

  const dates: Date[] = [];

  if (dayOfWeek === 5) {
    // Friday: get Sat, Sun, Mon (J+1, J+2, J+3)
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
  } else if (dayOfWeek === 6 || dayOfWeek === 0) {
    // Saturday or Sunday: skip (already handled Friday)
    return [];
  } else {
    // Mon-Thu: get next day (J+1)
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    dates.push(date);
  }

  return dates;
}

// Format date to YYYY-MM-DD for database query
function formatDateForQuery(date: Date): string {
  return date.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get base URL for generating links
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://busmoov.fr";

    // Get departure dates to check
    const departureDates = getDepartureDates();

    if (departureDates.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No requests needed today (weekend)"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    // Format dates for query
    const dateStrings = departureDates.map(formatDateForQuery);

    console.log(`Checking for departures on: ${dateStrings.join(', ')}`);

    // Find dossiers with departure dates in range that:
    // - Have a transporteur assigned
    // - Contract is signed (pending-reservation, pending-info, or pending-driver)
    // - Don't already have chauffeur info received
    const { data: dossiers, error: dossiersError } = await supabase
      .from('dossiers')
      .select(`
        id,
        reference,
        client_name,
        client_email,
        departure,
        arrival,
        departure_date,
        return_date,
        passengers,
        transporteur_id,
        transporteur:transporteurs (
          id,
          name,
          email,
          astreinte_tel
        )
      `)
      .in('departure_date', dateStrings)
      .not('transporteur_id', 'is', null)
      .in('status', ['pending-reservation', 'pending-info', 'pending-driver']);

    if (dossiersError) {
      throw dossiersError;
    }

    if (!dossiers || dossiers.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No dossiers found for upcoming departures"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    console.log(`Found ${dossiers.length} dossiers for upcoming departures`);

    // Check which dossiers already have chauffeur info or pending requests
    const dossierIds = dossiers.map(d => d.id);

    // Get voyage_infos to check:
    // - If chauffeur info already received
    // - If infos voyages are validated (validated_at IS NOT NULL)
    const { data: voyageInfos } = await supabase
      .from('voyage_infos')
      .select('dossier_id, chauffeur_info_recue_at, validated_at')
      .in('dossier_id', dossierIds);

    const dossiersWithChauffeurInfo = new Set(
      (voyageInfos || [])
        .filter(vi => vi.chauffeur_info_recue_at)
        .map(vi => vi.dossier_id)
    );

    // Only dossiers with validated voyage infos are eligible
    const dossiersWithValidatedInfos = new Set(
      (voyageInfos || [])
        .filter(vi => vi.validated_at)
        .map(vi => vi.dossier_id)
    );

    // Get demandes_fournisseurs to check if BPA is received (via bpa_received_at OR status = 'bpa_received')
    const { data: demandesFournisseurs } = await supabase
      .from('demandes_fournisseurs')
      .select('dossier_id, bpa_received_at, status')
      .in('dossier_id', dossierIds);

    const dossiersWithBpaReceived = new Set(
      (demandesFournisseurs || [])
        .filter(df => df.bpa_received_at || df.status === 'bpa_received')
        .map(df => df.dossier_id)
    );

    // Get existing pending demandes
    const { data: existingDemandes } = await supabase
      .from('demandes_chauffeur')
      .select('dossier_id')
      .in('dossier_id', dossierIds)
      .eq('status', 'pending');

    const dossiersWithPendingDemandes = new Set(
      (existingDemandes || []).map(d => d.dossier_id)
    );

    // Filter dossiers that need chauffeur requests
    // Conditions:
    // 1. No chauffeur info already received
    // 2. No pending demande
    // 3. Has transporteur assigned
    // 4. BPA received (validated by transporteur)
    // 5. Voyage infos validated (sent to client)
    const dossiersToRequest = dossiers.filter(d =>
      !dossiersWithChauffeurInfo.has(d.id) &&
      !dossiersWithPendingDemandes.has(d.id) &&
      d.transporteur_id &&
      dossiersWithBpaReceived.has(d.id) &&
      dossiersWithValidatedInfos.has(d.id)
    );

    console.log(`Eligible dossiers after filtering: ${dossiersToRequest.length}`);

    if (dossiersToRequest.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "All dossiers already have chauffeur info or pending requests"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    console.log(`Creating requests for ${dossiersToRequest.length} dossiers`);

    // Group dossiers by transporteur for grouped requests
    const byTransporteur = new Map<string, typeof dossiersToRequest>();
    for (const dossier of dossiersToRequest) {
      const transporteurId = dossier.transporteur_id;
      if (!byTransporteur.has(transporteurId)) {
        byTransporteur.set(transporteurId, []);
      }
      byTransporteur.get(transporteurId)!.push(dossier);
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Create demandes for each transporteur
    for (const [transporteurId, transporteurDossiers] of byTransporteur) {
      const transporteur = (transporteurDossiers[0].transporteur as any);

      // Create individual demandes for each dossier
      for (const dossier of transporteurDossiers) {
        const token = generateChauffeurToken();
        const hasRetour = !!dossier.return_date;
        const type = hasRetour ? 'aller_retour' : 'aller';

        const { data: demande, error: demandeError } = await supabase
          .from('demandes_chauffeur')
          .insert({
            dossier_id: dossier.id,
            transporteur_id: transporteurId,
            type: type,
            mode: 'individuel',
            token: token,
            status: 'pending',
            sent_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          })
          .select()
          .single();

        if (demandeError) {
          console.error(`Error creating demande for dossier ${dossier.reference}:`, demandeError);
          errors.push({
            dossier: dossier.reference,
            error: demandeError.message
          });
          continue;
        }

        // Add timeline entry
        await supabase
          .from('timeline_entries')
          .insert({
            dossier_id: dossier.id,
            type: 'email_sent',
            content: `Demande de contact chauffeur envoyee automatiquement (depart ${formatDateForQuery(new Date(dossier.departure_date))})`,
          });

        const link = `${baseUrl}/fournisseur/chauffeur?token=${token}`;

        results.push({
          dossier: dossier.reference,
          transporteur: transporteur?.name || 'Unknown',
          link: link,
          type: type
        });
      }
    }

    // Return summary
    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${results.length} chauffeur requests`,
        results: results,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("Error in daily-chauffeur-request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
