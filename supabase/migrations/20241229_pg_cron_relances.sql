-- ============================================
-- CONFIGURATION PG_CRON POUR LES RELANCES AUTOMATIQUES
-- Ce cron vérifie quotidiennement les dossiers et déclenche
-- les workflows de type "departure_reminder" (J-15, J-10, J-5, J-2)
-- ============================================

-- Activer l'extension pg_cron (si pas déjà active)
-- Note: pg_cron doit être activé depuis le dashboard Supabase
-- Database > Extensions > pg_cron

-- ============================================
-- FONCTION: Vérifier et déclencher les relances
-- ============================================
CREATE OR REPLACE FUNCTION check_departure_reminders()
RETURNS void AS $$
DECLARE
  dossier_record RECORD;
  days_until_departure INTEGER;
  supabase_url TEXT := 'https://rsxfmokwmwujercgpnfu.supabase.co';
  anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeGZtb2t3bXd1amVyY2dwbmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NjU5NTIsImV4cCI6MjA4MjA0MTk1Mn0.OTUBLLy1l92HURVsnk_j6EEb_8UQuH3lSSE3xUGHM1g';
BEGIN
  -- Parcourir tous les dossiers actifs avec une date de départ future
  FOR dossier_record IN
    SELECT
      d.id,
      d.status,
      d.departure_date,
      d.solde_paid_at,
      vi.validated_at AS voyage_validated,
      vi.chauffeur_info_recue_at,
      (d.departure_date::date - CURRENT_DATE) AS days_remaining
    FROM dossiers d
    LEFT JOIN voyage_infos vi ON vi.dossier_id = d.id
    WHERE d.departure_date IS NOT NULL
      AND d.departure_date::date >= CURRENT_DATE
      AND d.status NOT IN ('completed', 'cancelled', 'pending-payment')
    ORDER BY d.departure_date
  LOOP
    days_until_departure := dossier_record.days_remaining;

    -- J-15 : Rappel solde (si solde non payé)
    IF days_until_departure = 15 AND dossier_record.solde_paid_at IS NULL THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/process-workflow',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object(
          'trigger_event', 'departure_reminder',
          'dossier_id', dossier_record.id,
          'days_before', 15,
          'reminder_type', 'solde'
        )
      );

      -- Log
      INSERT INTO timeline_entries (dossier_id, type, content, created_at)
      VALUES (dossier_record.id, 'reminder', 'Rappel automatique J-15 : solde', NOW());
    END IF;

    -- J-10 : Demande infos voyage (si non validées)
    IF days_until_departure = 10 AND dossier_record.voyage_validated IS NULL THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/process-workflow',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object(
          'trigger_event', 'departure_reminder',
          'dossier_id', dossier_record.id,
          'days_before', 10,
          'reminder_type', 'infos_voyage'
        )
      );

      INSERT INTO timeline_entries (dossier_id, type, content, created_at)
      VALUES (dossier_record.id, 'reminder', 'Rappel automatique J-10 : infos voyage', NOW());
    END IF;

    -- J-5 : Demande chauffeur (si BPA reçu mais pas de chauffeur)
    IF days_until_departure = 5 AND dossier_record.chauffeur_info_recue_at IS NULL THEN
      -- Vérifier si BPA reçu
      IF EXISTS (
        SELECT 1 FROM demandes_fournisseurs
        WHERE dossier_id = dossier_record.id
        AND (bpa_received_at IS NOT NULL OR status = 'bpa_received')
      ) THEN
        PERFORM net.http_post(
          url := supabase_url || '/functions/v1/process-workflow',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || anon_key
          ),
          body := jsonb_build_object(
            'trigger_event', 'departure_reminder',
            'dossier_id', dossier_record.id,
            'days_before', 5,
            'reminder_type', 'chauffeur'
          )
        );

        INSERT INTO timeline_entries (dossier_id, type, content, created_at)
        VALUES (dossier_record.id, 'reminder', 'Rappel automatique J-5 : demande chauffeur', NOW());
      END IF;
    END IF;

    -- J-2 : Feuille de route (si chauffeur reçu)
    IF days_until_departure = 2 AND dossier_record.chauffeur_info_recue_at IS NOT NULL THEN
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/process-workflow',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || anon_key
        ),
        body := jsonb_build_object(
          'trigger_event', 'departure_reminder',
          'dossier_id', dossier_record.id,
          'days_before', 2,
          'reminder_type', 'feuille_route'
        )
      );

      INSERT INTO timeline_entries (dossier_id, type, content, created_at)
      VALUES (dossier_record.id, 'reminder', 'Envoi automatique J-2 : feuille de route', NOW());
    END IF;

  END LOOP;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'check_departure_reminders failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PLANIFICATION DU CRON (à exécuter manuellement dans Supabase)
-- ============================================
--
-- Pour activer le cron, exécutez ces commandes dans le SQL Editor de Supabase :
--
-- 1. D'abord, activez pg_cron depuis Database > Extensions
--
-- 2. Puis créez le job cron :
--
-- SELECT cron.schedule(
--   'daily-departure-reminders',  -- nom du job
--   '0 8 * * *',                  -- tous les jours à 8h00 UTC
--   'SELECT check_departure_reminders()'
-- );
--
-- Pour voir les jobs programmés :
-- SELECT * FROM cron.job;
--
-- Pour supprimer un job :
-- SELECT cron.unschedule('daily-departure-reminders');
--
-- ============================================

-- ============================================
-- TABLE DE LOG DES RELANCES (optionnel, pour traçabilité)
-- ============================================
CREATE TABLE IF NOT EXISTS relance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'solde', 'infos_voyage', 'chauffeur', 'feuille_route'
  days_before INTEGER,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  workflow_rule_id UUID REFERENCES workflow_rules(id),
  email_sent BOOLEAN DEFAULT false,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_relance_logs_dossier ON relance_logs(dossier_id);
CREATE INDEX IF NOT EXISTS idx_relance_logs_triggered ON relance_logs(triggered_at);

-- RLS pour relance_logs
ALTER TABLE relance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage relance_logs" ON relance_logs;
CREATE POLICY "Admins can manage relance_logs" ON relance_logs
  FOR ALL USING (true);

GRANT ALL ON relance_logs TO anon;
GRANT ALL ON relance_logs TO authenticated;

-- ============================================
-- FONCTIONS RPC POUR L'INTERFACE ADMIN
-- Ces fonctions permettent de gérer pg_cron depuis l'interface
-- ============================================

-- Fonction pour récupérer les jobs cron
CREATE OR REPLACE FUNCTION get_cron_jobs()
RETURNS TABLE (
  jobid bigint,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean
) AS $$
BEGIN
  -- Vérifier si l'extension pg_cron est installée
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN QUERY SELECT
      j.jobid,
      j.schedule,
      j.command,
      j.nodename,
      j.nodeport,
      j.database,
      j.username,
      j.active
    FROM cron.job j;
  ELSE
    -- Retourner une table vide si pg_cron n'est pas installé
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer l'historique des exécutions cron
CREATE OR REPLACE FUNCTION get_cron_job_history()
RETURNS TABLE (
  runid bigint,
  jobid bigint,
  job_pid integer,
  database text,
  username text,
  command text,
  status text,
  return_message text,
  start_time timestamptz,
  end_time timestamptz
) AS $$
BEGIN
  -- Vérifier si l'extension pg_cron est installée
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN QUERY SELECT
      r.runid,
      r.jobid,
      r.job_pid,
      r.database,
      r.username,
      r.command,
      r.status,
      r.return_message,
      r.start_time,
      r.end_time
    FROM cron.job_run_details r
    ORDER BY r.start_time DESC
    LIMIT 50;
  ELSE
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer le job de relances automatiques
CREATE OR REPLACE FUNCTION create_departure_reminder_cron()
RETURNS void AS $$
BEGIN
  -- Vérifier si l'extension pg_cron est installée
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'L''extension pg_cron n''est pas installée. Activez-la depuis Database > Extensions.';
  END IF;

  -- Supprimer l'ancien job s'il existe
  PERFORM cron.unschedule('daily-departure-reminders');

  -- Créer le nouveau job (8h00 UTC = 9h00 heure française en hiver)
  PERFORM cron.schedule(
    'daily-departure-reminders',
    '0 8 * * *',
    'SELECT check_departure_reminders()'
  );

EXCEPTION WHEN OTHERS THEN
  -- Si unschedule échoue (job n'existe pas), continuer
  IF SQLERRM LIKE '%does not exist%' THEN
    PERFORM cron.schedule(
      'daily-departure-reminders',
      '0 8 * * *',
      'SELECT check_departure_reminders()'
    );
  ELSE
    RAISE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer un job cron
CREATE OR REPLACE FUNCTION delete_cron_job(job_name text)
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE EXCEPTION 'L''extension pg_cron n''est pas installée.';
  END IF;

  PERFORM cron.unschedule(job_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RÉSUMÉ DES RELANCES AUTOMATIQUES
-- ============================================
--
-- JOUR    | TYPE              | CONDITION                    | ACTION
-- --------|-------------------|------------------------------|------------------
-- J-15    | Rappel solde      | Solde non payé               | Email rappel solde
-- J-10    | Infos voyage      | Infos non validées           | Email demande infos
-- J-5     | Demande chauffeur | BPA reçu, pas de chauffeur   | Email au transporteur
-- J-2     | Feuille de route  | Chauffeur reçu               | Email feuille de route
--
-- ============================================
