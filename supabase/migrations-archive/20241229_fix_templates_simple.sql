-- ============================================
-- TEMPLATES EMAIL ET WORKFLOW RULES - VERSION SIMPLE
-- Exécuter dans l'éditeur SQL Supabase
-- ============================================

-- 1. Template: Confirmation réservation (acompte payé)
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'confirmation_reservation',
  'Confirmation de réservation',
  'Email envoyé après paiement acompte',
  'Confirmation de votre réservation Busmoov - Dossier {{reference}}',
  'Bonjour {{client_name}}, Nous confirmons votre réservation. Référence: {{reference}}.',
  '<html><body style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#E91E63,#9C27B0);padding:30px;text-align:center;border-radius:10px 10px 0 0;"><h1 style="color:white;margin:0;">Réservation confirmée!</h1></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;"><p>Bonjour <strong>{{client_name}}</strong>,</p><p>Nous avons bien reçu votre paiement et confirmons votre réservation.</p><div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #E91E63;"><h3 style="margin-top:0;color:#4A1A6B;">Récapitulatif</h3><p><strong>Référence:</strong> {{reference}}<br><strong>Trajet:</strong> {{departure}} → {{arrival}}<br><strong>Date:</strong> {{departure_date}}<br><strong>Passagers:</strong> {{passengers}}<br><strong>Total:</strong> {{total_ttc}}</p></div><div style="background:#E8F5E9;padding:15px;border-radius:8px;"><p style="margin:0;color:#2E7D32;"><strong>Acompte reçu</strong> - Votre réservation est confirmée!</p></div><h3>Prochaines étapes</h3><ol><li>Nous vous contacterons pour les détails du voyage</li><li>Solde de {{montant_solde}} à régler 30 jours avant le départ</li><li>Vous recevrez les coordonnées du chauffeur avant le départ</li></ol><p style="text-align:center;margin:30px 0;"><a href="{{lien_espace_client}}" style="background:linear-gradient(135deg,#E91E63,#9C27B0);color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Accéder à mon espace client</a></p><hr style="border:none;border-top:1px solid #ddd;margin:30px 0;"><p style="color:#666;font-size:14px;">Une question? 01 87 21 14 76 - infos@busmoov.com</p><p>Merci de votre confiance!<br><strong>L équipe Busmoov</strong></p></div></body></html>',
  '[{"name":"client_name","description":"Nom du client"},{"name":"reference","description":"Référence du dossier"},{"name":"departure","description":"Ville de départ"},{"name":"arrival","description":"Ville arrivée"},{"name":"departure_date","description":"Date de départ"},{"name":"passengers","description":"Nombre de passagers"},{"name":"total_ttc","description":"Montant total TTC"},{"name":"montant_solde","description":"Montant du solde"},{"name":"lien_espace_client","description":"Lien espace client"}]'::jsonb,
  true,
  'workflow'
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- 2. Template: Confirmation solde payé
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'confirmation_solde',
  'Confirmation paiement solde',
  'Email envoyé après paiement du solde',
  'Paiement complet reçu - Dossier {{reference}}',
  'Bonjour {{client_name}}, Votre dossier est entièrement réglé. Référence: {{reference}}.',
  '<html><body style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px;"><div style="background:linear-gradient(135deg,#4CAF50,#2E7D32);padding:30px;text-align:center;border-radius:10px 10px 0 0;"><h1 style="color:white;margin:0;">Paiement complet reçu!</h1></div><div style="background:#f9f9f9;padding:30px;border-radius:0 0 10px 10px;"><p>Bonjour <strong>{{client_name}}</strong>,</p><p>Nous avons bien reçu le solde. Votre dossier est entièrement réglé.</p><div style="background:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #4CAF50;"><h3 style="margin-top:0;color:#4A1A6B;">Récapitulatif</h3><p><strong>Référence:</strong> {{reference}}<br><strong>Trajet:</strong> {{departure}} → {{arrival}}<br><strong>Date:</strong> {{departure_date}}<br><strong>Montant réglé:</strong> <span style="color:#4CAF50;font-weight:bold;">{{total_ttc}}</span></p></div><div style="background:#E8F5E9;padding:15px;border-radius:8px;"><p style="margin:0;color:#2E7D32;"><strong>Paiement complet</strong> - Acompte + Solde = {{total_ttc}}</p></div><p>Vous recevrez les coordonnées du chauffeur quelques jours avant le départ.</p><p style="text-align:center;margin:30px 0;"><a href="{{lien_espace_client}}" style="background:linear-gradient(135deg,#E91E63,#9C27B0);color:white;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:bold;">Accéder à mon espace client</a></p><hr style="border:none;border-top:1px solid #ddd;margin:30px 0;"><p style="color:#666;font-size:14px;">Une question? 01 87 21 14 76 - infos@busmoov.com</p><p>Merci de votre confiance!<br><strong>L équipe Busmoov</strong></p></div></body></html>',
  '[{"name":"client_name","description":"Nom du client"},{"name":"reference","description":"Référence du dossier"},{"name":"departure","description":"Ville de départ"},{"name":"arrival","description":"Ville arrivée"},{"name":"departure_date","description":"Date de départ"},{"name":"total_ttc","description":"Montant total TTC"},{"name":"lien_espace_client","description":"Lien espace client"}]'::jsonb,
  true,
  'workflow'
)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  body = EXCLUDED.body,
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- 3. Workflow rule: Confirmation acompte
DELETE FROM workflow_rules WHERE name = 'Confirmation paiement acompte';
INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, max_repeats, is_active)
VALUES (
  'Confirmation paiement acompte',
  'Envoie la confirmation après paiement acompte',
  'payment_received',
  '{"payment_type": "acompte"}'::jsonb,
  '[{"type": "send_email", "params": {"template": "confirmation_reservation"}}]'::jsonb,
  'send_email',
  '{"template": "confirmation_reservation"}'::jsonb,
  0,
  1,
  true
);

-- 4. Workflow rule: Confirmation solde
DELETE FROM workflow_rules WHERE name = 'Confirmation paiement solde';
INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, max_repeats, is_active)
VALUES (
  'Confirmation paiement solde',
  'Envoie la confirmation après paiement solde',
  'payment_received',
  '{"payment_type": "solde"}'::jsonb,
  '[{"type": "send_email", "params": {"template": "confirmation_solde"}}]'::jsonb,
  'send_email',
  '{"template": "confirmation_solde"}'::jsonb,
  0,
  1,
  true
);

-- 5. Fonction trigger pour paiement
CREATE OR REPLACE FUNCTION trigger_workflow_with_data(p_trigger_event TEXT, p_dossier_id UUID, p_additional_data JSONB DEFAULT '{}'::jsonb)
RETURNS void AS $$
DECLARE
  request_body JSONB;
BEGIN
  request_body := jsonb_build_object(
    'trigger_event', p_trigger_event,
    'dossier_id', p_dossier_id
  ) || p_additional_data;

  PERFORM net.http_post(
    url := 'https://rsxfmokwmwujercgpnfu.supabase.co/functions/v1/process-workflow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeGZtb2t3bXd1amVyY2dwbmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NjU5NTIsImV4cCI6MjA4MjA0MTk1Mn0.OTUBLLy1l92HURVsnk_j6EEb_8UQuH3lSSE3xUGHM1g'
    ),
    body := request_body
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Workflow trigger failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger sur factures
CREATE OR REPLACE FUNCTION on_payment_received()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    PERFORM trigger_workflow_with_data(
      'payment_received',
      NEW.dossier_id,
      jsonb_build_object('payment_type', NEW.type)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_payment_received ON factures;
CREATE TRIGGER trigger_payment_received
  AFTER UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION on_payment_received();

-- Vérification
SELECT 'Templates:' as check, count(*) as total FROM email_templates WHERE key IN ('confirmation_reservation', 'confirmation_solde');
SELECT 'Rules:' as check, count(*) as total FROM workflow_rules WHERE trigger_event = 'payment_received';
