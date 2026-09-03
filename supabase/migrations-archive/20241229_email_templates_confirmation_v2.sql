-- ============================================
-- TEMPLATES D'EMAIL POUR CONFIRMATION DE PAIEMENT
-- Version simplifiée avec les deux workflow rules
-- ============================================

-- Template: Confirmation de réservation (après paiement acompte)
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'confirmation_reservation',
  'Confirmation de réservation',
  'Email envoyé au client après réception du paiement de l''acompte',
  'Confirmation de votre réservation Busmoov - Dossier {{reference}}',
  'Bonjour {{client_name}}, Nous avons bien reçu votre paiement et confirmons votre réservation. Référence: {{reference}}. Trajet: {{departure}} - {{arrival}}. Date: {{departure_date}}.',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Réservation confirmée !</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour <strong>{{client_name}}</strong>,</p>

    <p>Nous avons bien reçu votre paiement et nous vous confirmons votre réservation de transport.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E91E63;">
      <h3 style="margin-top: 0; color: #4A1A6B;">Récapitulatif de votre voyage</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Référence :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} - {{arrival}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date de départ :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Passagers :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{passengers}} personnes</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Montant total :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{total_ttc}}</td>
        </tr>
      </table>
    </div>

    <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #2E7D32;">
        <strong>Acompte reçu</strong> - Votre réservation est confirmée !
      </p>
    </div>

    <h3 style="color: #4A1A6B;">Prochaines étapes</h3>
    <ol style="color: #666;">
      <li style="margin-bottom: 10px;"><strong>Informations voyage :</strong> Nous vous contacterons prochainement pour recueillir les détails de votre voyage.</li>
      <li style="margin-bottom: 10px;"><strong>Solde à régler :</strong> Le solde de {{montant_solde}} devra être réglé au plus tard 30 jours avant le départ.</li>
      <li style="margin-bottom: 10px;"><strong>Feuille de route :</strong> Vous recevrez les coordonnées du chauffeur quelques jours avant le départ.</li>
    </ol>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{lien_espace_client}}" style="display: inline-block; background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Accéder à mon espace client
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Une question ? Notre équipe est à votre disposition :<br>
      Tel: <a href="tel:+33187211476" style="color: #E91E63;">01 87 21 14 76</a><br>
      Email: <a href="mailto:infos@busmoov.com" style="color: #E91E63;">infos@busmoov.com</a>
    </p>

    <p style="margin-top: 30px;">
      Merci de votre confiance !<br>
      <strong>L''équipe Busmoov</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Busmoov SAS - 41 Rue Barrault, 75013 Paris</p>
  </div>
</body>
</html>',
  '[
    {"name": "client_name", "description": "Nom du client"},
    {"name": "reference", "description": "Référence du dossier"},
    {"name": "departure", "description": "Ville de départ"},
    {"name": "arrival", "description": "Ville d''arrivée"},
    {"name": "departure_date", "description": "Date de départ"},
    {"name": "passengers", "description": "Nombre de passagers"},
    {"name": "total_ttc", "description": "Montant total TTC"},
    {"name": "montant_acompte", "description": "Montant de l''acompte"},
    {"name": "montant_solde", "description": "Montant du solde"},
    {"name": "lien_espace_client", "description": "Lien vers l''espace client"}
  ]'::jsonb,
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

-- Template: Confirmation de paiement solde
INSERT INTO email_templates (key, name, description, subject, body, html_content, variables, is_active, type)
VALUES (
  'confirmation_solde',
  'Confirmation paiement solde',
  'Email envoyé au client après réception du paiement du solde',
  'Paiement complet reçu - Dossier {{reference}}',
  'Bonjour {{client_name}}, Nous avons bien reçu le solde de votre réservation. Votre dossier est entièrement réglé. Référence: {{reference}}. Montant total: {{total_ttc}}.',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Paiement complet reçu !</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour <strong>{{client_name}}</strong>,</p>

    <p>Nous avons bien reçu le solde de votre réservation. Votre dossier est maintenant entièrement réglé.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
      <h3 style="margin-top: 0; color: #4A1A6B;">Récapitulatif</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Référence :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} - {{arrival}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Date de départ :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure_date}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Montant total réglé :</td>
          <td style="padding: 8px 0; font-weight: bold; color: #4CAF50;">{{total_ttc}}</td>
        </tr>
      </table>
    </div>

    <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; color: #2E7D32;">
        <strong>Paiement complet</strong> - Acompte + Solde = {{total_ttc}}
      </p>
    </div>

    <p>Vous recevrez les coordonnées du chauffeur et votre feuille de route quelques jours avant le départ.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{lien_espace_client}}" style="display: inline-block; background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
        Accéder à mon espace client
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="color: #666; font-size: 14px;">
      Une question ? Notre équipe est à votre disposition :<br>
      Tel: <a href="tel:+33187211476" style="color: #E91E63;">01 87 21 14 76</a><br>
      Email: <a href="mailto:infos@busmoov.com" style="color: #E91E63;">infos@busmoov.com</a>
    </p>

    <p style="margin-top: 30px;">
      Merci de votre confiance !<br>
      <strong>L''équipe Busmoov</strong>
    </p>
  </div>
</body>
</html>',
  '[
    {"name": "client_name", "description": "Nom du client"},
    {"name": "reference", "description": "Référence du dossier"},
    {"name": "departure", "description": "Ville de départ"},
    {"name": "arrival", "description": "Ville d''arrivée"},
    {"name": "departure_date", "description": "Date de départ"},
    {"name": "total_ttc", "description": "Montant total TTC"},
    {"name": "lien_espace_client", "description": "Lien vers l''espace client"}
  ]'::jsonb,
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

-- ============================================
-- WORKFLOW RULES POUR LES CONFIRMATIONS DE PAIEMENT
-- ============================================

-- Rule: Confirmation paiement acompte
INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, repeat_interval_hours, max_repeats, is_active)
VALUES (
  'Confirmation paiement acompte',
  'Envoie la confirmation au client après réception du paiement de l''acompte',
  'payment_received',
  '{"payment_type": "acompte"}',
  '[{"type": "send_email", "params": {"template": "confirmation_reservation"}}]',
  'send_email',
  '{"template": "confirmation_reservation", "subject": "Confirmation de votre réservation Busmoov"}',
  0,
  NULL,
  1,
  true
)
ON CONFLICT DO NOTHING;

-- Rule: Confirmation paiement solde
INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, repeat_interval_hours, max_repeats, is_active)
VALUES (
  'Confirmation paiement solde',
  'Envoie la confirmation au client après réception du paiement du solde',
  'payment_received',
  '{"payment_type": "solde"}',
  '[{"type": "send_email", "params": {"template": "confirmation_solde"}}]',
  'send_email',
  '{"template": "confirmation_solde", "subject": "Paiement complet reçu - Dossier confirmé"}',
  0,
  NULL,
  1,
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- FONCTION ET TRIGGER POUR PAYMENT_RECEIVED
-- ============================================

-- Fonction améliorée pour déclencher un workflow avec données additionnelles
CREATE OR REPLACE FUNCTION trigger_workflow_with_data(p_trigger_event TEXT, p_dossier_id UUID, p_additional_data JSONB DEFAULT '{}'::jsonb)
RETURNS void AS $$
DECLARE
  supabase_url TEXT;
  request_body JSONB;
BEGIN
  supabase_url := 'https://rsxfmokwmwujercgpnfu.supabase.co';

  -- Construire le body avec les données additionnelles
  request_body := jsonb_build_object(
    'trigger_event', p_trigger_event,
    'dossier_id', p_dossier_id
  ) || p_additional_data;

  -- Appeler l'Edge Function via pg_net
  PERFORM net.http_post(
    url := supabase_url || '/functions/v1/process-workflow',
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

-- Mise à jour du trigger payment_received pour inclure le type de facture
CREATE OR REPLACE FUNCTION on_payment_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Déclencher si le statut passe à 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Envoyer le type de facture (acompte ou solde) avec le trigger
    PERFORM trigger_workflow_with_data(
      'payment_received',
      NEW.dossier_id,
      jsonb_build_object('payment_type', NEW.type)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger sur la table factures
DROP TRIGGER IF EXISTS trigger_payment_received ON factures;
CREATE TRIGGER trigger_payment_received
  AFTER UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION on_payment_received();

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Templates créés:' as info, count(*) as total FROM email_templates WHERE key IN ('confirmation_reservation', 'confirmation_solde');
SELECT 'Workflow rules créées:' as info, count(*) as total FROM workflow_rules WHERE trigger_event = 'payment_received';
