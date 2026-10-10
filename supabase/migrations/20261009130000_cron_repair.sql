-- Réparation de la couche planifiée (pg_cron → Edge Functions).
--
-- Constat du 9 oct. 2026 : aucune relance, aucun rappel, aucune demande
-- d'avis envoyés depuis des mois.
--   - process-workflows : en-tête placé dans les *params* (appel positionnel
--     de net.http_post) et clé placeholder « VOTRE_ANON_KEY » → 401 ;
--   - scheduled-reminders : appelait extensions.http_post, fonction inexistante
--     → erreur SQL à chaque heure ;
--   - process-auto-devis / quote-reminders : clé JWT en dur dans cron.job,
--     timeout pg_net de 5 s dépassé à chaque exécution ;
--   - daily-chauffeur-request et auto-complete-dossiers : jamais planifiées ;
--   - trigger_workflow_with_data : clé JWT en dur dans la fonction.
--
-- Mécanisme unique : jeton `cron_token` dans vault (= secret CRON_TOKEN des
-- fonctions, vérifié par supabase/functions/_shared/cron-auth.ts). Les
-- fonctions sont déployées avec --no-verify-jwt. Plus aucune clé dans cron.job.
--
-- Prérequis (hors migration) :
--   select vault.create_secret('<jeton>', 'cron_token', '...');
--   npx supabase secrets set CRON_TOKEN=<jeton>
--   npx supabase functions deploy <fn> --no-verify-jwt   (les 6 fonctions)

create or replace function public.cron_call_edge(p_function text, p_body jsonb default '{}'::jsonb, p_timeout_ms integer default 60000)
returns bigint
language sql
security definer
set search_path = ''
as $$
  select net.http_post(
    url := 'https://rsxfmokwmwujercgpnfu.supabase.co/functions/v1/' || p_function,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_token')
    ),
    body := p_body,
    timeout_milliseconds := p_timeout_ms
  );
$$;

revoke all on function public.cron_call_edge(text, jsonb, integer) from public, anon, authenticated;

-- Déclencheurs d'événements (devis envoyé, dossier terminé, chauffeur reçu).
create or replace function public.trigger_workflow_with_data(p_trigger_event text, p_dossier_id uuid, p_additional_data jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.cron_call_edge(
    'process-workflow',
    jsonb_build_object('trigger_event', p_trigger_event, 'dossier_id', p_dossier_id) || p_additional_data,
    60000
  );
exception when others then
  raise warning 'Workflow trigger failed: %', sqlerrm;
end;
$$;

-- Crons : on remplace les 4 jobs existants et on ajoute les 2 manquants.
do $$
declare j text;
begin
  foreach j in array array['process-auto-devis', 'process-workflows', 'quote-reminders-daily', 'scheduled-reminders-hourly',
                           'daily-chauffeur-request', 'auto-complete-dossiers'] loop
    if exists (select 1 from cron.job where jobname = j) then
      perform cron.unschedule(j);
    end if;
  end loop;
end $$;

select cron.schedule('process-auto-devis',         '*/30 * * * *', $$ select public.cron_call_edge('process-auto-devis', '{}'::jsonb, 120000); $$);
select cron.schedule('process-workflows',          '0 8 * * *',    $$ select public.cron_call_edge('process-workflow'); $$);
select cron.schedule('quote-reminders-daily',      '0 9 * * *',    $$ select public.cron_call_edge('quote-reminders'); $$);
select cron.schedule('scheduled-reminders-hourly', '0 * * * *',    $$ select public.cron_call_edge('scheduled-reminders'); $$);
select cron.schedule('daily-chauffeur-request',    '0 7 * * *',    $$ select public.cron_call_edge('daily-chauffeur-request'); $$);
select cron.schedule('auto-complete-dossiers',     '0 5 * * *',    $$ select public.cron_call_edge('auto-complete-dossiers'); $$);
