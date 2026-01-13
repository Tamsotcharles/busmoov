import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Helper pour obtenir le préfixe de langue à partir du code pays
function getLanguageFromCountry(countryCode: string | null | undefined): string {
  switch (countryCode?.toUpperCase()) {
    case 'ES': return 'es';
    case 'DE': return 'de';
    case 'GB': return 'en';
    case 'FR':
    default: return 'fr';
  }
}

// Helper pour générer une URL localisée
function generateLocalizedUrl(baseUrl: string, path: string, countryCode: string | null | undefined, params: Record<string, string>): string {
  const lang = getLanguageFromCountry(countryCode);
  const queryString = new URLSearchParams(params).toString();
  return `${baseUrl}/${lang}${path}?${queryString}`;
}

interface WorkflowRule {
  id: string;
  name: string;
  description: string | null;
  trigger_event: string;
  conditions: Record<string, unknown> | null;
  actions: Array<{ type: string; params?: Record<string, unknown> }> | null;
  action_type: string | null;
  action_config: Record<string, unknown> | null;
  delay_hours: number | null;
  repeat_interval_hours: number | null;
  max_repeats: number | null;
  is_active: boolean | null;
}

interface WorkflowExecution {
  id: string;
  rule_id: string;
  dossier_id: string;
  execution_count: number;
  last_executed_at: string | null;
  next_execution_at: string | null;
  status: string;
}

interface Dossier {
  id: string;
  reference: string;
  client_name: string;
  client_email: string;
  departure: string;
  arrival: string;
  departure_date: string;
  return_date: string | null;
  passengers: number;
  status: string;
  price_ttc: number | null;
  acompte_amount: number | null;
  acompte_paid_at: string | null;
  solde_paid_at: string | null;
  payment_method: string | null;
  country_code: string | null;
  created_at: string;
}

// Fonction pour envoyer un email via la fonction send-email centralisée
// Cette fonction gère automatiquement la traduction selon la langue
async function sendEmailViaCentralFunction(
  templateKey: string,
  to: string,
  data: Record<string, string>,
  language: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        type: templateKey,
        to: to,
        data: {
          ...data,
          language: language,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending email via central function:", error);
    return { success: false, error: error.message };
  }
}

// Vérifier si un dossier satisfait les conditions d'une règle
function checkConditions(
  dossier: Dossier,
  conditions: Record<string, unknown>,
  context: {
    devisCount?: number;
    hasAcceptedDevis?: boolean;
    hasSignedContract?: boolean;
    infosValidated?: boolean;
    chauffeurReceived?: boolean;
    daysBefore?: number;
    paymentType?: string | null; // Type de paiement (acompte ou solde)
  }
): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    switch (key) {
      case "days_before":
        if (context.daysBefore === undefined) return false;
        if (context.daysBefore > (value as number)) return false;
        break;
      case "solde_pending":
        if (value === true && dossier.solde_paid_at) return false;
        break;
      case "payment_status":
        if (value === "pending" && dossier.acompte_paid_at) return false;
        break;
      case "infos_missing":
        if (value === true && context.infosValidated) return false;
        break;
      case "chauffeur_missing":
        if (value === true && context.chauffeurReceived) return false;
        break;
      case "chauffeur_received":
        if (value === true && !context.chauffeurReceived) return false;
        break;
      case "bpa_received":
        // This would require checking demandes_fournisseurs
        break;
      case "no_response":
        if (value === true && context.hasAcceptedDevis) return false;
        break;
      case "payment_type":
        // Vérifier si le type de paiement correspond
        if (context.paymentType && value !== context.paymentType) {
          return false;
        }
        break;
      case "payment_method":
        // Vérifier si la méthode de paiement correspond (virement, cb)
        if (dossier.payment_method !== value) {
          return false;
        }
        break;
    }
  }
  return true;
}

// Fonction pour déterminer le trigger_event à partir d'un webhook Supabase
function detectTriggerEventFromWebhook(
  table: string,
  _type: string,
  record: Record<string, unknown>,
  oldRecord: Record<string, unknown> | null
): { triggerEvent: string | null; dossierId: string | null } {
  let triggerEvent: string | null = null;
  let dossierId: string | null = null;

  switch (table) {
    case "devis":
      // Déclencheur: devis passe en "sent"
      if (record.status === "sent" && oldRecord?.status !== "sent") {
        triggerEvent = "devis_sent";
        dossierId = record.dossier_id as string;
      }
      break;

    case "contrats":
      // Déclencheur: contrat signé (signed_at rempli)
      if (record.signed_at && !oldRecord?.signed_at) {
        triggerEvent = "contrat_signed";
        dossierId = record.dossier_id as string;
      }
      break;

    case "factures":
      // Déclencheur: paiement reçu (status passe à "paid")
      if (record.status === "paid" && oldRecord?.status !== "paid") {
        triggerEvent = "payment_received";
        dossierId = record.dossier_id as string;
      }
      break;

    case "voyage_infos":
      // Déclencheur: infos voyage validées
      if (record.validated_at && !oldRecord?.validated_at) {
        triggerEvent = "info_submitted";
        dossierId = record.dossier_id as string;
      }
      // Déclencheur: infos chauffeur reçues
      if (record.chauffeur_info_recue_at && !oldRecord?.chauffeur_info_recue_at) {
        triggerEvent = "chauffeur_received";
        dossierId = record.dossier_id as string;
      }
      break;

    case "demandes_fournisseurs":
      // Déclencheur: BPA reçu
      if (
        (record.bpa_received_at && !oldRecord?.bpa_received_at) ||
        (record.status === "bpa_received" && oldRecord?.status !== "bpa_received")
      ) {
        triggerEvent = "bpa_received";
        dossierId = record.dossier_id as string;
      }
      break;

    case "dossiers":
      // Déclencheur: dossier passe en "completed" (voyage terminé)
      if (record.status === "completed" && oldRecord?.status !== "completed") {
        triggerEvent = "voyage_completed";
        dossierId = record.id as string;
      }
      break;
  }

  return { triggerEvent, dossierId };
}

// Générer un token unique pour les avis
function generateReviewToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://busmoov.fr";

    // Parse request body
    let triggerFilter: string | null = null;
    let specificDossierId: string | null = null;
    let paymentType: string | null = null; // Pour différencier acompte/solde

    try {
      const body = await req.json();

      // Détecter si c'est un webhook Supabase (format spécifique)
      if (body?.type && body?.table && body?.record) {
        console.log(`Webhook received: ${body.type} on ${body.table}`);

        const { triggerEvent, dossierId } = detectTriggerEventFromWebhook(
          body.table,
          body.type,
          body.record,
          body.old_record || null
        );

        if (triggerEvent) {
          triggerFilter = triggerEvent;
          specificDossierId = dossierId;
          console.log(`Detected trigger: ${triggerEvent} for dossier: ${dossierId}`);
        } else {
          // Pas d'action nécessaire pour ce changement
          return new Response(
            JSON.stringify({
              success: true,
              message: "No workflow trigger for this change",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Appel manuel ou cron (ancien format)
        triggerFilter = body?.trigger_event || null;
        specificDossierId = body?.dossier_id || null;
        // Récupérer le type de paiement si fourni (acompte ou solde)
        paymentType = body?.payment_type || null;

        if (paymentType) {
          console.log(`Payment type received: ${paymentType}`);
        }
      }
    } catch {
      // No body or invalid JSON, process all pending
    }

    console.log(
      `Processing workflows - trigger: ${triggerFilter || "all"}, dossier: ${
        specificDossierId || "all"
      }`
    );

    // Get active workflow rules
    let rulesQuery = supabase
      .from("workflow_rules")
      .select("*")
      .eq("is_active", true);

    if (triggerFilter) {
      rulesQuery = rulesQuery.eq("trigger_event", triggerFilter);
    }

    const { data: rules, error: rulesError } = await rulesQuery;

    if (rulesError) throw rulesError;
    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active workflow rules found",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${rules.length} active rules`);

    const results: { rule: string; executions: number; errors: string[] }[] =
      [];

    // Process each rule
    for (const rule of rules as WorkflowRule[]) {
      const ruleResults = { rule: rule.name, executions: 0, errors: [] as string[] };

      // Find eligible dossiers based on trigger type
      let dossiersQuery = supabase.from("dossiers").select("*");

      if (specificDossierId) {
        dossiersQuery = dossiersQuery.eq("id", specificDossierId);
      }

      // Filter dossiers based on trigger type
      switch (rule.trigger_event) {
        case "devis_sent":
          // Dossiers with sent devis that haven't been accepted
          dossiersQuery = dossiersQuery.in("status", [
            "pending-devis",
            "pending-payment",
          ]);
          break;
        case "contrat_signed":
        case "contract_signed":
          // Dossiers pending payment after contract
          dossiersQuery = dossiersQuery.eq("status", "pending-payment");
          break;
        case "departure_reminder":
          // Dossiers with upcoming departure
          const today = new Date();
          const futureDate = new Date();
          futureDate.setDate(today.getDate() + 30); // Check next 30 days
          dossiersQuery = dossiersQuery
            .gte("departure_date", today.toISOString().split("T")[0])
            .lte("departure_date", futureDate.toISOString().split("T")[0])
            .not("status", "eq", "completed")
            .not("status", "eq", "cancelled");
          break;
        case "payment_received":
          // Recent payments - would be triggered directly
          continue; // Skip for scheduled processing
        case "voyage_completed":
          // Dossiers qui viennent de passer en "completed"
          dossiersQuery = dossiersQuery.eq("status", "completed");
          break;
        case "chauffeur_received":
          // Dossiers confirmés avec infos chauffeur reçues
          dossiersQuery = dossiersQuery.in("status", ["confirmed", "pending-driver"]);
          break;
        default:
          continue;
      }

      const { data: dossiers, error: dossiersError } = await dossiersQuery;
      if (dossiersError) {
        ruleResults.errors.push(dossiersError.message);
        results.push(ruleResults);
        continue;
      }

      if (!dossiers || dossiers.length === 0) {
        results.push(ruleResults);
        continue;
      }

      console.log(
        `Rule "${rule.name}": checking ${dossiers.length} dossiers`
      );

      // Check existing executions for these dossiers
      const dossierIds = dossiers.map((d) => d.id);
      const { data: existingExecs } = await supabase
        .from("workflow_executions")
        .select("*")
        .eq("rule_id", rule.id)
        .in("dossier_id", dossierIds);

      const execMap = new Map<string, WorkflowExecution>();
      for (const exec of (existingExecs || []) as WorkflowExecution[]) {
        execMap.set(exec.dossier_id, exec);
      }

      // Get additional context for each dossier
      const { data: voyageInfos } = await supabase
        .from("voyage_infos")
        .select("dossier_id, validated_at, chauffeur_info_recue_at")
        .in("dossier_id", dossierIds);

      const voyageMap = new Map<
        string,
        { validated: boolean; chauffeurReceived: boolean }
      >();
      for (const vi of voyageInfos || []) {
        voyageMap.set(vi.dossier_id, {
          validated: !!vi.validated_at,
          chauffeurReceived: !!vi.chauffeur_info_recue_at,
        });
      }

      // Get email template key (le template sera chargé par send-email)
      const templateKey =
        (rule.action_config as { template?: string })?.template ||
        (rule.actions?.[0]?.params as { template?: string })?.template;

      // Process each dossier
      for (const dossier of dossiers as Dossier[]) {
        const existingExec = execMap.get(dossier.id);

        // Check if we should skip this dossier
        if (existingExec) {
          // Already completed max repeats?
          const maxRepeats = rule.max_repeats || 1;
          if (existingExec.execution_count >= maxRepeats) {
            continue;
          }

          // Check if it's time for next execution
          if (existingExec.next_execution_at) {
            const nextExec = new Date(existingExec.next_execution_at);
            if (nextExec > new Date()) {
              continue; // Not time yet
            }
          }

          // If status is 'stopped' or 'completed', skip
          if (["stopped", "completed"].includes(existingExec.status)) {
            continue;
          }
        } else {
          // New execution - check delay_hours
          const delayHours = rule.delay_hours || 0;
          if (delayHours > 0) {
            const dossierCreated = new Date(dossier.created_at);
            const delayMs = delayHours * 60 * 60 * 1000;
            if (Date.now() - dossierCreated.getTime() < delayMs) {
              continue; // Delay not passed yet
            }
          }
        }

        // Check conditions
        const daysBefore = rule.trigger_event === "departure_reminder"
          ? Math.ceil(
              (new Date(dossier.departure_date).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : undefined;

        const context = {
          infosValidated: voyageMap.get(dossier.id)?.validated || false,
          chauffeurReceived:
            voyageMap.get(dossier.id)?.chauffeurReceived || false,
          daysBefore,
          paymentType, // Passer le type de paiement au contexte
        };

        if (
          rule.conditions &&
          !checkConditions(dossier, rule.conditions as Record<string, unknown>, context)
        ) {
          continue;
        }

        // Execute the action
        const actionType =
          rule.action_type || rule.actions?.[0]?.type || "send_email";

        if (actionType === "send_email" && templateKey) {
          // Déterminer la langue du dossier
          const language = getLanguageFromCountry(dossier.country_code);

          // Calculer le montant du solde (total - acompte)
          const soldeAmount = dossier.price_ttc && dossier.acompte_amount
            ? dossier.price_ttc - dossier.acompte_amount
            : dossier.price_ttc || 0;

          const formatCurrency = (amount: number | null | undefined): string => {
            if (!amount) return "";
            return new Intl.NumberFormat("fr-FR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(amount);
          };

          // Préparer les données pour le template
          const emailData: Record<string, string> = {
            client_name: dossier.client_name || "",
            reference: dossier.reference || "",
            departure: dossier.departure || "",
            arrival: dossier.arrival || "",
            departure_date: dossier.departure_date
              ? new Date(dossier.departure_date).toLocaleDateString("fr-FR")
              : "",
            passengers: String(dossier.passengers || 0),
            total_ttc: formatCurrency(dossier.price_ttc),
            montant_acompte: formatCurrency(dossier.acompte_amount),
            montant_solde: formatCurrency(soldeAmount),
            lien_espace_client: generateLocalizedUrl(baseUrl, '/mes-devis', dossier.country_code, { ref: dossier.reference, email: dossier.client_email || "" }),
            lien_paiement: generateLocalizedUrl(baseUrl, '/paiement', dossier.country_code, { ref: dossier.reference, email: dossier.client_email || "" }),
            lien_infos_voyage: generateLocalizedUrl(baseUrl, '/infos-voyage', dossier.country_code, { ref: dossier.reference, email: dossier.client_email || "" }),
            dossier_id: dossier.id,
          };

          // Pour le trigger voyage_completed, créer le review token et le lien
          if (rule.trigger_event === "voyage_completed") {
            // Vérifier si un avis existe déjà pour ce dossier
            const { data: existingReview } = await supabase
              .from("reviews")
              .select("id, token")
              .eq("dossier_id", dossier.id)
              .single();

            let reviewToken: string;
            if (existingReview) {
              // Utiliser le token existant
              reviewToken = existingReview.token;
            } else {
              // Créer un nouveau review avec token
              reviewToken = generateReviewToken();
              await supabase.from("reviews").insert({
                dossier_id: dossier.id,
                token: reviewToken,
                status: "pending",
              });
            }

            const reviewUrl = `${baseUrl}/avis?token=${reviewToken}`;
            emailData.lien_avis = reviewUrl;
            emailData.review_url = reviewUrl;
          }

          // Envoyer l'email via la fonction centralisée (gère la traduction automatiquement)
          const emailResult = await sendEmailViaCentralFunction(
            templateKey,
            dossier.client_email,
            emailData,
            language
          );

          if (!emailResult.success) {
            ruleResults.errors.push(
              `Email failed for ${dossier.reference}: ${emailResult.error}`
            );
            continue;
          }

          // Log to timeline
          await supabase.from("timeline").insert({
            dossier_id: dossier.id,
            type: "email_sent",
            content: `Email automatique envoyé: ${rule.name}`,
          });
        }

        // Update or create execution record
        const now = new Date().toISOString();
        const nextExecTime = rule.repeat_interval_hours
          ? new Date(
              Date.now() + (rule.repeat_interval_hours || 24) * 60 * 60 * 1000
            ).toISOString()
          : null;

        const newCount = (existingExec?.execution_count || 0) + 1;
        const newStatus =
          newCount >= (rule.max_repeats || 1) ? "completed" : "pending";

        if (existingExec) {
          await supabase
            .from("workflow_executions")
            .update({
              execution_count: newCount,
              last_executed_at: now,
              next_execution_at: nextExecTime,
              status: newStatus,
              result: { last_action: actionType, success: true },
            })
            .eq("id", existingExec.id);
        } else {
          await supabase.from("workflow_executions").insert({
            rule_id: rule.id,
            dossier_id: dossier.id,
            execution_count: 1,
            last_executed_at: now,
            next_execution_at: nextExecTime,
            status: newStatus,
            result: { last_action: actionType, success: true },
          });
        }

        ruleResults.executions++;
      }

      results.push(ruleResults);
    }

    const totalExecutions = results.reduce((sum, r) => sum + r.executions, 0);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${rules.length} rules, ${totalExecutions} executions`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in process-workflow:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
