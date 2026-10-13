-- RLS étape 2 : parcours client et fournisseur sans règle ouverte.
--
-- Avant : dossiers, demandes, devis, messages lisibles par tout anonyme, et
-- dossiers modifiables (USING true / EXISTS toujours vrai). Après : un visiteur
-- anonyme ne voit que le dossier dont il présente la référence ET l'email
-- (en-têtes x-client-ref / x-client-email, posés par useClientAccess côté
-- front), ou la demande fournisseur / chauffeur dont il présente le jeton
-- (en-tête x-validation-token). Les créations depuis le formulaire public
-- passent par l'Edge Function create-dossier (service_role).

-- ---------------------------------------------------------------------------
-- 0. Fonctions d'accès
-- ---------------------------------------------------------------------------
create or replace function public.rls_header(p_name text)
returns text language sql stable as $$
  select nullif((current_setting('request.headers', true))::json ->> p_name, '')
$$;

-- Référence : DEM-xxx et DOS-xxx désignent la même demande.
create or replace function public.rls_ref_match(p_ref text)
returns boolean language sql stable as $$
  select p_ref is not null
     and public.rls_header('x-client-ref') is not null
     and replace(upper(p_ref), 'DEM-', 'DOS-') = replace(upper(public.rls_header('x-client-ref')), 'DEM-', 'DOS-')
$$;

create or replace function public.rls_email_match(p_email text)
returns boolean language sql stable as $$
  select p_email is not null
     and public.rls_header('x-client-email') is not null
     and lower(p_email) = lower(public.rls_header('x-client-email'))
$$;

-- Accès à un dossier : client (référence + email) ou fournisseur (jeton d'une
-- demande fournisseur / chauffeur du dossier). SECURITY DEFINER pour lire les
-- tables sans dépendre de leurs propres policies.
create or replace function public.rls_dossier_access(p_dossier_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_dossier_id is not null and exists (
    select 1 from public.dossiers d
    where d.id = p_dossier_id
      and (
        (public.rls_ref_match(d.reference) and public.rls_email_match(d.client_email))
        or exists (
          select 1 from public.demandes_fournisseurs df
          where df.dossier_id = d.id and df.validation_token is not null
            and df.validation_token = public.rls_header('x-validation-token'))
        or exists (
          select 1 from public.demandes_chauffeur dc
          where dc.dossier_id = d.id and dc.token is not null
            and dc.token = public.rls_header('x-validation-token'))
      )
  )
$$;

-- Accès client uniquement (référence + email) : devis, paiements, contrats,
-- factures, messages ne doivent pas être visibles d'un fournisseur à jeton.
create or replace function public.rls_dossier_client(p_dossier_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_dossier_id is not null and exists (
    select 1 from public.dossiers d
    where d.id = p_dossier_id
      and public.rls_ref_match(d.reference) and public.rls_email_match(d.client_email)
  )
$$;

-- ---------------------------------------------------------------------------
-- 1. Dossiers
-- ---------------------------------------------------------------------------
drop policy if exists "Allow anonymous select on dossiers" on public.dossiers;
drop policy if exists "Allow anonymous update on dossiers" on public.dossiers;
drop policy if exists "Allow anonymous insert on dossiers" on public.dossiers;
create policy "dossiers_anon_select" on public.dossiers for select to anon
  using (public.rls_dossier_access(id));
create policy "dossiers_anon_update" on public.dossiers for update to anon
  using (public.rls_dossier_access(id)) with check (public.rls_dossier_access(id));

-- ---------------------------------------------------------------------------
-- 2. Demandes (lecture par référence + email ; création via create-dossier)
-- ---------------------------------------------------------------------------
drop policy if exists "Allow anonymous insert on demandes" on public.demandes;
drop policy if exists "Allow anonymous select on demandes" on public.demandes;
drop policy if exists "Demandes création anonyme" on public.demandes;
drop policy if exists "Demandes lookup by ref and email" on public.demandes;
create policy "demandes_anon_select" on public.demandes for select to anon
  using (public.rls_ref_match(reference) and public.rls_email_match(client_email));

-- ---------------------------------------------------------------------------
-- 3. Devis, paiements, contrats, factures, timeline : lecture par le client
-- ---------------------------------------------------------------------------
drop policy if exists "Devis lecture publique via demande" on public.devis;
drop policy if exists "Devis lecture publique via dossier" on public.devis;
create policy "devis_anon_select" on public.devis for select to anon
  using (
    public.rls_dossier_client(dossier_id)
    or exists (select 1 from public.demandes dm
               where dm.id = devis.demande_id
                 and public.rls_ref_match(dm.reference) and public.rls_email_match(dm.client_email))
  );

create policy "paiements_anon_select" on public.paiements for select to anon
  using (public.rls_dossier_client(dossier_id));
create policy "contrats_anon_select" on public.contrats for select to anon
  using (public.rls_dossier_client(dossier_id));
create policy "factures_anon_select" on public.factures for select to anon
  using (public.rls_dossier_client(dossier_id));

drop policy if exists "Allow anonymous insert on timeline" on public.timeline;
create policy "timeline_anon_insert" on public.timeline for insert to anon
  with check (public.rls_dossier_access(dossier_id));

-- ---------------------------------------------------------------------------
-- 4. Messages (chat client)
-- ---------------------------------------------------------------------------
drop policy if exists "Messages lecture anon" on public.messages;
drop policy if exists "Messages insert anon client" on public.messages;
drop policy if exists "Messages insert client" on public.messages;
create policy "messages_anon_select" on public.messages for select to anon
  using (public.rls_dossier_client(dossier_id));
create policy "messages_anon_insert" on public.messages for insert to anon
  with check (sender = 'client' and public.rls_dossier_client(dossier_id));

-- ---------------------------------------------------------------------------
-- 5. Infos voyage (client : saisie ; chauffeur : complément via jeton)
-- ---------------------------------------------------------------------------
drop policy if exists "Allow all access to voyage_infos" on public.voyage_infos;
drop policy if exists "voyage_infos_full_access" on public.voyage_infos;
create policy "voyage_infos_admin" on public.voyage_infos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "voyage_infos_anon_select" on public.voyage_infos for select to anon
  using (public.rls_dossier_access(dossier_id));
create policy "voyage_infos_anon_insert" on public.voyage_infos for insert to anon
  with check (public.rls_dossier_access(dossier_id));
create policy "voyage_infos_anon_update" on public.voyage_infos for update to anon
  using (public.rls_dossier_access(dossier_id)) with check (public.rls_dossier_access(dossier_id));

-- ---------------------------------------------------------------------------
-- 6. Notifications équipe, acceptations CGV : création liée à un dossier accessible
-- ---------------------------------------------------------------------------
drop policy if exists "notifications_crm_public_insert" on public.notifications_crm;
create policy "notifications_crm_public_insert" on public.notifications_crm for insert to anon
  with check (public.rls_dossier_access(dossier_id));

drop policy if exists "cgv_acceptations_insert_public" on public.cgv_acceptations;
create policy "cgv_acceptations_anon_insert" on public.cgv_acceptations for insert to anon
  with check (public.rls_dossier_client(dossier_id));
create policy "cgv_acceptations_admin_insert" on public.cgv_acceptations for insert to authenticated
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Avis clients (lien à jeton) et demandes chauffeur (lien à jeton)
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can read review by token" on public.reviews;
drop policy if exists "Anyone can update pending review" on public.reviews;
create policy "reviews_token_select" on public.reviews for select to anon, authenticated
  using (token is not null and token = public.rls_header('x-validation-token'));
create policy "reviews_token_update" on public.reviews for update to anon, authenticated
  using (status = 'pending' and token is not null and token = public.rls_header('x-validation-token'))
  with check (token = public.rls_header('x-validation-token'));
-- restent : "Public can read approved public reviews", "Admins can manage reviews"

drop policy if exists "anon_select_by_token" on public.demandes_chauffeur;
drop policy if exists "demandes_chauffeur_anon_update" on public.demandes_chauffeur;
create policy "demandes_chauffeur_token_select" on public.demandes_chauffeur for select to anon
  using (token is not null and token = public.rls_header('x-validation-token'));
create policy "demandes_chauffeur_token_update" on public.demandes_chauffeur for update to anon
  using (token is not null and token = public.rls_header('x-validation-token'))
  with check (token = public.rls_header('x-validation-token'));

-- Transporteur visible par le fournisseur porteur d'un jeton (chauffeur ou BPA)
drop policy if exists "transporteurs_anon_for_requests" on public.transporteurs;
create policy "transporteurs_anon_for_requests" on public.transporteurs for select to anon
  using (
    exists (select 1 from public.demandes_chauffeur dc
            where dc.transporteur_id = transporteurs.id and dc.token is not null
              and dc.token = public.rls_header('x-validation-token'))
    or exists (select 1 from public.demandes_fournisseurs df
               where df.transporteur_id = transporteurs.id and df.validation_token is not null
                 and df.validation_token = public.rls_header('x-validation-token'))
  );

-- ---------------------------------------------------------------------------
-- 8. Création publique : plus d'insertion anonyme (Edge Function create-dossier)
-- ---------------------------------------------------------------------------
drop policy if exists "Allow anonymous insert on dossiers_auto_devis" on public.dossiers_auto_devis;
drop policy if exists "workflow_devis_auto_default_public" on public.workflow_devis_auto;
