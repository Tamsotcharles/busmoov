-- Migration pour enrichir la table workflow_rules existante
-- Ajout des nouvelles colonnes pour le système d'automatisation avancé

-- Ajouter les nouvelles colonnes si elles n'existent pas
DO $$
BEGIN
  -- Ajouter description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'workflow_rules' AND column_name = 'description') THEN
    ALTER TABLE workflow_rules ADD COLUMN description TEXT;
  END IF;

  -- Ajouter action_type (extrait des actions existantes)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'workflow_rules' AND column_name = 'action_type') THEN
    ALTER TABLE workflow_rules ADD COLUMN action_type TEXT DEFAULT 'send_email';
  END IF;

  -- Ajouter action_config
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'workflow_rules' AND column_name = 'action_config') THEN
    ALTER TABLE workflow_rules ADD COLUMN action_config JSONB DEFAULT '{}';
  END IF;

  -- Ajouter delay_hours
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'workflow_rules' AND column_name = 'delay_hours') THEN
    ALTER TABLE workflow_rules ADD COLUMN delay_hours INTEGER DEFAULT 0;
  END IF;

  -- Ajouter repeat_interval_hours
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'workflow_rules' AND column_name = 'repeat_interval_hours') THEN
    ALTER TABLE workflow_rules ADD COLUMN repeat_interval_hours INTEGER;
  END IF;

  -- Ajouter max_repeats
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'workflow_rules' AND column_name = 'max_repeats') THEN
    ALTER TABLE workflow_rules ADD COLUMN max_repeats INTEGER DEFAULT 1;
  END IF;
END $$;

-- Table pour tracker l'exécution des règles (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES workflow_rules(id) ON DELETE CASCADE,
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  next_execution_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'executed', 'stopped', 'completed'
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_workflow_executions_next ON workflow_executions(next_execution_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_workflow_executions_dossier ON workflow_executions(dossier_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_trigger ON workflow_rules(trigger_event) WHERE is_active = true;

-- Insérer les règles par défaut si la table est vide
INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, repeat_interval_hours, max_repeats, is_active)
SELECT
  'Relance après édition de devis',
  'Envoie un email au client 24h après l''envoi des devis s''il n''a pas répondu',
  'devis_sent',
  '{"statut_devis": "sent", "no_response": true}',
  '[{"type": "send_email", "params": {"template": "quote_sent"}}]',
  'send_email',
  '{"template": "quote_sent", "subject": "Vos devis Busmoov vous attendent"}',
  24,
  48,
  3,
  true
WHERE NOT EXISTS (SELECT 1 FROM workflow_rules WHERE trigger_event = 'devis_sent');

INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, repeat_interval_hours, max_repeats, is_active)
SELECT
  'Rappel acompte',
  'Rappelle le client de régler son acompte 48h après signature du contrat',
  'contrat_signed',
  '{"payment_status": "pending"}',
  '[{"type": "send_email", "params": {"template": "payment_reminder"}}]',
  'send_email',
  '{"template": "payment_reminder", "subject": "Rappel : Acompte à régler pour votre réservation"}',
  48,
  72,
  2,
  true
WHERE NOT EXISTS (SELECT 1 FROM workflow_rules WHERE trigger_event = 'contrat_signed');

INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, repeat_interval_hours, max_repeats, is_active)
SELECT
  'Rappel solde J-15',
  'Rappelle le client de régler le solde 15 jours avant le départ',
  'departure_reminder',
  '{"days_before": 15, "solde_pending": true}',
  '[{"type": "send_email", "params": {"template": "rappel_solde"}}]',
  'send_email',
  '{"template": "rappel_solde", "subject": "Rappel : Solde à régler pour votre voyage"}',
  0,
  72,
  3,
  true
WHERE NOT EXISTS (SELECT 1 FROM workflow_rules WHERE trigger_event = 'departure_reminder' AND name LIKE '%solde%');

INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, repeat_interval_hours, max_repeats, is_active)
SELECT
  'Demande infos voyage J-10',
  'Demande les infos voyage au client 10 jours avant le départ',
  'departure_reminder',
  '{"days_before": 10, "infos_missing": true}',
  '[{"type": "send_email", "params": {"template": "info_request"}}]',
  'send_email',
  '{"template": "info_request", "subject": "Informations nécessaires pour votre voyage"}',
  0,
  48,
  2,
  true
WHERE NOT EXISTS (SELECT 1 FROM workflow_rules WHERE trigger_event = 'departure_reminder' AND name LIKE '%infos%');

INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, repeat_interval_hours, max_repeats, is_active)
SELECT
  'Demande chauffeur J-5',
  'Demande les infos chauffeur au transporteur 5 jours avant le départ',
  'departure_reminder',
  '{"days_before": 5, "chauffeur_missing": true, "bpa_received": true}',
  '[{"type": "send_email", "params": {"template": "demande_chauffeur"}}]',
  'send_email',
  '{"template": "demande_chauffeur", "subject": "Demande coordonnées chauffeur"}',
  0,
  24,
  3,
  true
WHERE NOT EXISTS (SELECT 1 FROM workflow_rules WHERE trigger_event = 'departure_reminder' AND name LIKE '%chauffeur%');

INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, repeat_interval_hours, max_repeats, is_active)
SELECT
  'Confirmation réservation',
  'Envoie la confirmation au client après réception du paiement acompte',
  'payment_received',
  '{"payment_type": "acompte"}',
  '[{"type": "send_email", "params": {"template": "confirmation_reservation"}}]',
  'send_email',
  '{"template": "confirmation_reservation", "subject": "Confirmation de votre réservation Busmoov"}',
  0,
  NULL,
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM workflow_rules WHERE trigger_event = 'payment_received');

INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, repeat_interval_hours, max_repeats, is_active)
SELECT
  'Envoi feuille de route J-2',
  'Envoie la feuille de route au client 2 jours avant le départ',
  'departure_reminder',
  '{"days_before": 2, "chauffeur_received": true}',
  '[{"type": "send_email", "params": {"template": "driver_info"}}]',
  'send_email',
  '{"template": "driver_info", "subject": "Votre feuille de route - Départ imminent"}',
  0,
  NULL,
  1,
  true
WHERE NOT EXISTS (SELECT 1 FROM workflow_rules WHERE trigger_event = 'departure_reminder' AND name LIKE '%feuille%');

-- RLS policies pour workflow_executions
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can manage workflow_executions" ON workflow_executions;

-- Politique pour les admins (lecture/écriture totale)
CREATE POLICY "Admins can manage workflow_executions" ON workflow_executions
  FOR ALL USING (true);

-- Accorder les permissions
GRANT ALL ON workflow_executions TO anon;
GRANT ALL ON workflow_executions TO authenticated;
