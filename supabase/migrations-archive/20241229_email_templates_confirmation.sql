-- ============================================
-- TEMPLATES D'EMAIL POUR CONFIRMATION DE PAIEMENT
-- ============================================

-- S'assurer que la table email_templates existe
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  body TEXT,
  content TEXT,
  html_content TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage email_templates" ON email_templates;
CREATE POLICY "Admins can manage email_templates" ON email_templates
  FOR ALL USING (true);

GRANT ALL ON email_templates TO anon;
GRANT ALL ON email_templates TO authenticated;

-- Template: Confirmation de réservation (après paiement acompte)
INSERT INTO email_templates (key, name, description, subject, html_content, variables, is_active, type)
VALUES (
  'confirmation_reservation',
  'Confirmation de réservation',
  'Email envoyé au client après réception du paiement de l''acompte',
  'Confirmation de votre réservation Busmoov - Dossier {{reference}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #E91E63 0%, #9C27B0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Réservation confirmée !</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour <strong>{{client_name}}</strong>,</p>

    <p>Nous avons bien reçu votre paiement et nous vous confirmons votre réservation de transport.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E91E63;">
      <h3 style="margin-top: 0; color: #4A1A6B;">📋 Récapitulatif de votre voyage</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Référence :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} → {{arrival}}</td>
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
        ✅ <strong>Acompte reçu</strong> - Votre réservation est confirmée !
      </p>
    </div>

    <h3 style="color: #4A1A6B;">📝 Prochaines étapes</h3>
    <ol style="color: #666;">
      <li style="margin-bottom: 10px;"><strong>Informations voyage :</strong> Nous vous contacterons prochainement pour recueillir les détails de votre voyage (adresses exactes, horaires, contacts).</li>
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
      📞 <a href="tel:+33187211476" style="color: #E91E63;">01 87 21 14 76</a><br>
      ✉️ <a href="mailto:infos@busmoov.com" style="color: #E91E63;">infos@busmoov.com</a>
    </p>

    <p style="margin-top: 30px;">
      Merci de votre confiance !<br>
      <strong>L''équipe Busmoov</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>Busmoov SAS - 41 Rue Barrault, 75013 Paris</p>
    <p>SIRET: 123 456 789 00000 - TVA: FR12345678900</p>
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
  html_content = EXCLUDED.html_content,
  variables = EXCLUDED.variables,
  updated_at = NOW();

-- Template: Confirmation de paiement solde
INSERT INTO email_templates (key, name, description, subject, html_content, variables, is_active, type)
VALUES (
  'confirmation_solde',
  'Confirmation paiement solde',
  'Email envoyé au client après réception du paiement du solde',
  'Paiement complet reçu - Dossier {{reference}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">✅ Paiement complet reçu !</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Bonjour <strong>{{client_name}}</strong>,</p>

    <p>Nous avons bien reçu le solde de votre réservation. Votre dossier est maintenant entièrement réglé.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
      <h3 style="margin-top: 0; color: #4A1A6B;">📋 Récapitulatif</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Référence :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{reference}}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Trajet :</td>
          <td style="padding: 8px 0; font-weight: bold;">{{departure}} → {{arrival}}</td>
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
        💳 <strong>Paiement complet</strong> - Acompte + Solde = {{total_ttc}}
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
      📞 <a href="tel:+33187211476" style="color: #E91E63;">01 87 21 14 76</a><br>
      ✉️ <a href="mailto:infos@busmoov.com" style="color: #E91E63;">infos@busmoov.com</a>
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
ON CONFLICT (key) DO NOTHING;

-- Ajouter une règle workflow pour confirmation solde
INSERT INTO workflow_rules (name, description, trigger_event, conditions, actions, action_type, action_config, delay_hours, repeat_interval_hours, max_repeats, is_active)
SELECT
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
WHERE NOT EXISTS (SELECT 1 FROM workflow_rules WHERE trigger_event = 'payment_received' AND name LIKE '%solde%');

-- ============================================
-- MISE À JOUR DU TRIGGER PAYMENT_RECEIVED POUR INCLURE LE TYPE
-- ============================================

-- Fonction améliorée pour déclencher un workflow avec données additionnelles
CREATE OR REPLACE FUNCTION trigger_workflow_with_data(trigger_event TEXT, dossier_id UUID, additional_data JSONB DEFAULT '{}'::jsonb)
RETURNS void AS $$
DECLARE
  supabase_url TEXT;
  request_body JSONB;
BEGIN
  -- Récupérer l'URL Supabase depuis les variables d'environnement
  supabase_url := current_setting('app.settings.supabase_url', true);

  -- Si l'URL n'est pas configurée, utiliser la valeur par défaut
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://rsxfmokwmwujercgpnfu.supabase.co';
  END IF;

  -- Construire le body avec les données additionnelles
  request_body := jsonb_build_object(
    'trigger_event', trigger_event,
    'dossier_id', dossier_id
  ) || additional_data;

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
  -- Log l'erreur mais ne pas bloquer l'opération principale
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

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_payment_received ON factures;
CREATE TRIGGER trigger_payment_received
  AFTER UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION on_payment_received();
