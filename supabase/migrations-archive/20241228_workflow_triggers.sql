-- Triggers pour déclencher automatiquement les workflows
-- Ces triggers appellent l'Edge Function process-workflow à chaque événement

-- Extension pour appeler des webhooks (si pas déjà installée)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fonction générique pour déclencher un workflow
CREATE OR REPLACE FUNCTION trigger_workflow(trigger_event TEXT, dossier_id UUID)
RETURNS void AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
BEGIN
  -- Récupérer l'URL Supabase depuis les variables d'environnement
  supabase_url := current_setting('app.settings.supabase_url', true);

  -- Si l'URL n'est pas configurée, utiliser la valeur par défaut
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://rsxfmokwmwujercgpnfu.supabase.co';
  END IF;

  -- Appeler l'Edge Function via pg_net
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/process-workflow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeGZtb2t3bXd1amVyY2dwbmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NjU5NTIsImV4cCI6MjA4MjA0MTk1Mn0.OTUBLLy1l92HURVsnk_j6EEb_8UQuH3lSSE3xUGHM1g'
    ),
    body := jsonb_build_object(
      'trigger_event', trigger_event,
      'dossier_id', dossier_id
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Log l'erreur mais ne pas bloquer l'opération principale
  RAISE WARNING 'Workflow trigger failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Quand un devis passe en "sent"
-- ============================================
CREATE OR REPLACE FUNCTION on_devis_sent()
RETURNS TRIGGER AS $$
BEGIN
  -- Déclencher si le statut passe à 'sent'
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    PERFORM trigger_workflow('devis_sent', NEW.dossier_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_devis_sent ON devis;
CREATE TRIGGER trigger_devis_sent
  AFTER INSERT OR UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION on_devis_sent();

-- ============================================
-- TRIGGER: Quand un contrat est signé
-- ============================================
CREATE OR REPLACE FUNCTION on_contrat_signed()
RETURNS TRIGGER AS $$
BEGIN
  -- Déclencher si signed_at vient d'être rempli
  IF NEW.signed_at IS NOT NULL AND OLD.signed_at IS NULL THEN
    PERFORM trigger_workflow('contrat_signed', NEW.dossier_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_contrat_signed ON contrats;
CREATE TRIGGER trigger_contrat_signed
  AFTER UPDATE ON contrats
  FOR EACH ROW
  EXECUTE FUNCTION on_contrat_signed();

-- ============================================
-- TRIGGER: Quand un paiement est reçu
-- ============================================
CREATE OR REPLACE FUNCTION on_payment_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Déclencher si le statut passe à 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    PERFORM trigger_workflow('payment_received', NEW.dossier_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_payment_received ON factures;
CREATE TRIGGER trigger_payment_received
  AFTER UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION on_payment_received();

-- ============================================
-- TRIGGER: Quand les infos voyage sont validées
-- ============================================
CREATE OR REPLACE FUNCTION on_voyage_infos_validated()
RETURNS TRIGGER AS $$
BEGIN
  -- Déclencher si validated_at vient d'être rempli
  IF NEW.validated_at IS NOT NULL AND OLD.validated_at IS NULL THEN
    PERFORM trigger_workflow('info_submitted', NEW.dossier_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_voyage_infos_validated ON voyage_infos;
CREATE TRIGGER trigger_voyage_infos_validated
  AFTER UPDATE ON voyage_infos
  FOR EACH ROW
  EXECUTE FUNCTION on_voyage_infos_validated();

-- ============================================
-- TRIGGER: Quand un BPA est reçu
-- ============================================
CREATE OR REPLACE FUNCTION on_bpa_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Déclencher si bpa_received_at vient d'être rempli ou status = 'bpa_received'
  IF (NEW.bpa_received_at IS NOT NULL AND OLD.bpa_received_at IS NULL)
     OR (NEW.status = 'bpa_received' AND OLD.status != 'bpa_received') THEN
    PERFORM trigger_workflow('bpa_received', NEW.dossier_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_bpa_received ON demandes_fournisseurs;
CREATE TRIGGER trigger_bpa_received
  AFTER UPDATE ON demandes_fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION on_bpa_received();

-- ============================================
-- Note: Pour les triggers "departure_reminder" (J-15, J-10, J-5, J-2),
-- un CRON job reste nécessaire car ils dépendent du temps qui passe,
-- pas d'une action utilisateur.
-- ============================================
