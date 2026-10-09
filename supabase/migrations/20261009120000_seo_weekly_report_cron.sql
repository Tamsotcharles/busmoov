-- Rapport SEO hebdomadaire : appel de l'Edge Function seo-weekly-report
-- chaque lundi à 06:00 UTC (08:00 Paris en été, 07:00 en hiver).
--
-- Authentification : jeton dédié stocké dans vault (seo_report_cron_token),
-- identique au secret SEO_REPORT_CRON_TOKEN de la fonction. Pas de clé
-- service_role dans la table cron.job.
--
-- Prérequis (faits à la main, hors migration) :
--   select vault.create_secret('<jeton>', 'seo_report_cron_token', '...');
--   npx supabase secrets set SEO_REPORT_CRON_TOKEN=<jeton>
--   npx supabase functions deploy seo-weekly-report --no-verify-jwt

select cron.unschedule('seo-weekly-report')
where exists (select 1 from cron.job where jobname = 'seo-weekly-report');

select cron.schedule(
  'seo-weekly-report',
  '0 6 * * 1',
  $$
  select net.http_post(
    url := 'https://rsxfmokwmwujercgpnfu.supabase.co/functions/v1/seo-weekly-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'seo_report_cron_token')
    ),
    body := '{}'::jsonb
  );
  $$
);
