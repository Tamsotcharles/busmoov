-- RLS étape 1 : fermer ce que le public n'utilise pas, sans toucher aux
-- parcours client (dossiers / devis / voyage_infos / demandes restent lisibles
-- en anonyme, c'est l'étape 2).
--
-- Vérifié le 12 oct. 2026 avec la clé anon : dossiers, transporteurs (1 141),
-- app_settings (clé Geoapify), grilles tarifaires et timeline étaient lisibles
-- par n'importe qui, et `dossiers`, `voyage_infos`, `transporteurs`,
-- `app_settings`, `workflow_rules`, `email_templates` modifiables.
--
-- Parcours anonymes préservés : formulaire de demande (insert demandes /
-- dossiers / dossiers_auto_devis + lecture du workflow par défaut), infos
-- voyage client, proposition de prix fournisseur (Edge Function), validation
-- BPA fournisseur (jeton en en-tête x-validation-token), infos chauffeur.
-- Les Edge Functions et crons utilisent service_role : non concernés.

-- ---------------------------------------------------------------------------
-- 1. Grilles tarifaires et référentiels : lecture équipe uniquement
--    (le calcul public passe par l'Edge Function calculate-price).
-- ---------------------------------------------------------------------------
drop policy if exists "Allow public read tarifs_aller_simple" on public.tarifs_aller_simple;
drop policy if exists "Tarifs lisibles par tous" on public.tarifs_aller_simple;
drop policy if exists "Allow public read tarifs_ar_1j" on public.tarifs_ar_1j;
drop policy if exists "Tarifs AR 1J lisibles par tous" on public.tarifs_ar_1j;
drop policy if exists "Allow public read tarifs_ar_mad" on public.tarifs_ar_mad;
drop policy if exists "Tarifs AR MAD lisibles par tous" on public.tarifs_ar_mad;
drop policy if exists "tarifs_ar_mad_read" on public.tarifs_ar_mad;
drop policy if exists "Allow public read tarifs_ar_sans_mad" on public.tarifs_ar_sans_mad;
drop policy if exists "Tarifs AR Sans MAD lisibles par tous" on public.tarifs_ar_sans_mad;
drop policy if exists "tarifs_ar_sans_mad_read" on public.tarifs_ar_sans_mad;
drop policy if exists "Allow public read coefficients_vehicules" on public.coefficients_vehicules;
drop policy if exists "Coefficients lisibles par tous" on public.coefficients_vehicules;
drop policy if exists "capacites_vehicules_read" on public.capacites_vehicules;
drop policy if exists "majorations_regions_read" on public.majorations_regions;
drop policy if exists "disponibilite_vehicules_regions_read" on public.disponibilite_vehicules_regions;

create policy "tarifs_aller_simple_team_read" on public.tarifs_aller_simple for select to authenticated using (public.is_admin());
create policy "tarifs_ar_1j_team_read" on public.tarifs_ar_1j for select to authenticated using (public.is_admin());
create policy "tarifs_ar_mad_team_read" on public.tarifs_ar_mad for select to authenticated using (public.is_admin());
create policy "tarifs_ar_sans_mad_team_read" on public.tarifs_ar_sans_mad for select to authenticated using (public.is_admin());
create policy "coefficients_vehicules_team_read" on public.coefficients_vehicules for select to authenticated using (public.is_admin());
create policy "capacites_vehicules_team_read" on public.capacites_vehicules for select to authenticated using (public.is_admin());
create policy "majorations_regions_team_read" on public.majorations_regions for select to authenticated using (public.is_admin());
create policy "disponibilite_vehicules_regions_team_read" on public.disponibilite_vehicules_regions for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Paramètres : équipe seulement, sauf les règles d'acompte lues par
--    l'espace client (clé payment_settings). La clé Geoapify n'est plus lisible.
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can manage app_settings" on public.app_settings;
drop policy if exists "Allow anonymous select on app_settings" on public.app_settings;
create policy "app_settings_admin" on public.app_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "app_settings_public_payment" on public.app_settings for select to anon, authenticated
  using (key = 'payment_settings');

alter table public.automation_settings enable row level security;
drop policy if exists "automation_settings_admin" on public.automation_settings;
create policy "automation_settings_admin" on public.automation_settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Templates, workflows, logs, rappels, notifications, paiements fournisseurs
-- ---------------------------------------------------------------------------
drop policy if exists "Public access to email_templates" on public.email_templates;
drop policy if exists "Allow anonymous select on email_templates" on public.email_templates;
-- reste : "Email templates admin only" (ALL, is_admin())

drop policy if exists "Public access to workflow_rules" on public.workflow_rules;
-- reste : "Allow all for authenticated users"

drop policy if exists "Allow anonymous select on workflow_devis_auto" on public.workflow_devis_auto;
drop policy if exists "Allow public read workflow_devis_auto" on public.workflow_devis_auto;
drop policy if exists "Workflow lisible par tous" on public.workflow_devis_auto;
drop policy if exists "Workflow modifiable" on public.workflow_devis_auto;
-- Le formulaire public lit le workflow par défaut pour programmer l'auto-devis.
create policy "workflow_devis_auto_default_public" on public.workflow_devis_auto for select to anon
  using (is_default = true and is_active = true);
-- reste : "Allow authenticated full access workflow_devis_auto"

drop policy if exists "Admins can manage workflow_executions" on public.workflow_executions;
create policy "workflow_executions_admin" on public.workflow_executions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin can manage emails" on public.emails;
create policy "emails_admin" on public.emails for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage relance_logs" on public.relance_logs;
create policy "relance_logs_admin" on public.relance_logs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Allow all operations on rappels" on public.rappels;
create policy "rappels_admin" on public.rappels for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Allow all operations on paiements_fournisseurs" on public.paiements_fournisseurs;
create policy "paiements_fournisseurs_admin" on public.paiements_fournisseurs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payment_links_insert" on public.payment_links;
drop policy if exists "payment_links_select" on public.payment_links;
drop policy if exists "payment_links_update" on public.payment_links;
create policy "payment_links_admin" on public.payment_links for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- (create-payment-link et mollie-webhook sont en service_role)

-- Les pages client et fournisseur créent des notifications pour l'équipe ;
-- elles ne doivent ni les lire ni les modifier.
drop policy if exists "Admins can manage notifications" on public.notifications_crm;
create policy "notifications_crm_admin" on public.notifications_crm for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "notifications_crm_public_insert" on public.notifications_crm for insert to anon
  with check (true);

-- ---------------------------------------------------------------------------
-- 4. Auto-devis : le formulaire public insère, l'équipe gère, personne d'autre ne lit.
-- ---------------------------------------------------------------------------
drop policy if exists "Dossiers auto modifiables" on public.dossiers_auto_devis;
drop policy if exists "Allow public read dossiers_auto_devis" on public.dossiers_auto_devis;
drop policy if exists "Dossiers auto lisibles par tous" on public.dossiers_auto_devis;
-- restent : "Allow anonymous insert on dossiers_auto_devis", "Allow authenticated full access dossiers_auto_devis"

-- ---------------------------------------------------------------------------
-- 5. Dossiers et timeline : plus de suppression ni d'accès total anonyme.
--    (lecture / mise à jour anonymes conservées pour l'espace client : étape 2)
-- ---------------------------------------------------------------------------
drop policy if exists "Allow all access to dossiers" on public.dossiers;
drop policy if exists "Dossiers anon read by ref email" on public.dossiers; -- USING (false), inerte

drop policy if exists "Allow all access to timeline" on public.timeline;
create policy "timeline_admin_all" on public.timeline for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- restent : "Allow anonymous insert on timeline" (pages client/fournisseur), "Timeline lecture"

-- ---------------------------------------------------------------------------
-- 6. Fournisseurs : chauffeurs / véhicules / demandes chauffeur
-- ---------------------------------------------------------------------------
drop policy if exists "Allow all access to chauffeurs_vehicule" on public.chauffeurs_vehicule;
drop policy if exists "Allow all access to vehicules_trajet" on public.vehicules_trajet;
-- restent : policies "authenticated"

drop policy if exists "Allow all access to demandes_chauffeur" on public.demandes_chauffeur;
-- La page infos chauffeur (anonyme, lien à jeton) lit puis met à jour sa demande.
create policy "demandes_chauffeur_anon_update" on public.demandes_chauffeur for update to anon
  using (token is not null) with check (true);
-- restent : "anon_select_by_token", "demandes_chauffeur_authenticated"

-- Validation BPA fournisseur : la page envoie le jeton dans l'en-tête
-- x-validation-token (même mécanisme que la lecture déjà en place).
drop policy if exists "demandes_fournisseurs_update_by_token" on public.demandes_fournisseurs;
create policy "demandes_fournisseurs_update_by_token" on public.demandes_fournisseurs for update to anon
  using (
    validation_token is not null
    and validation_token = ((current_setting('request.headers', true))::json ->> 'x-validation-token')
  )
  with check (true);

-- ---------------------------------------------------------------------------
-- 7. Transporteurs : plus de lecture publique. Les pages fournisseur (lien à
--    jeton) ne voient que le transporteur concerné par leur demande.
-- ---------------------------------------------------------------------------
drop policy if exists "Allow all access to transporteurs" on public.transporteurs;
drop policy if exists "Transporteurs lecture publique" on public.transporteurs;
create policy "transporteurs_anon_for_requests" on public.transporteurs for select to anon
  using (
    exists (select 1 from public.demandes_chauffeur dc where dc.transporteur_id = transporteurs.id)
    or exists (
      select 1 from public.demandes_fournisseurs df
      where df.transporteur_id = transporteurs.id
        and df.validation_token is not null
        and df.validation_token = ((current_setting('request.headers', true))::json ->> 'x-validation-token')
    )
  );
-- restent : "Transporteurs admin full access", "Transporteurs authenticated read"
