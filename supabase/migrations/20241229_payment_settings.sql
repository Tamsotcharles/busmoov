-- ============================================
-- PARAMÈTRES DE PAIEMENT CONFIGURABLES
-- Permet de gérer les délais de paiement depuis l'admin
-- ============================================

-- S'assurer que la table app_settings existe
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS pour app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage app_settings" ON app_settings;
CREATE POLICY "Admins can manage app_settings" ON app_settings
  FOR ALL USING (true);

GRANT ALL ON app_settings TO anon;
GRANT ALL ON app_settings TO authenticated;

-- Insérer les paramètres de paiement par défaut
INSERT INTO app_settings (key, value, description)
VALUES (
  'payment_settings',
  '{
    "acompte_percent": 30,
    "solde_days_before_departure": 30,
    "full_payment_threshold_days": 30,
    "payment_reminder_days": [45, 30, 15, 7]
  }'::jsonb,
  'Configuration des délais et pourcentages de paiement'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- FONCTION: Calculer le montant acompte selon les paramètres
-- ============================================
CREATE OR REPLACE FUNCTION calculate_acompte_amount(price_ttc NUMERIC, departure_date DATE DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE
  settings JSONB;
  acompte_percent NUMERIC;
  full_payment_threshold INTEGER;
  days_until_departure INTEGER;
BEGIN
  -- Récupérer les paramètres
  SELECT value INTO settings FROM app_settings WHERE key = 'payment_settings';

  -- Valeurs par défaut si pas de paramètres
  IF settings IS NULL THEN
    acompte_percent := 30;
    full_payment_threshold := 30;
  ELSE
    acompte_percent := COALESCE((settings->>'acompte_percent')::NUMERIC, 30);
    full_payment_threshold := COALESCE((settings->>'full_payment_threshold_days')::INTEGER, 30);
  END IF;

  -- Si date de départ fournie, vérifier si paiement total requis
  IF departure_date IS NOT NULL THEN
    days_until_departure := departure_date - CURRENT_DATE;

    -- Si départ à moins de X jours, paiement total requis
    IF days_until_departure <= full_payment_threshold THEN
      RETURN price_ttc;
    END IF;
  END IF;

  -- Sinon, retourner le pourcentage d'acompte
  RETURN ROUND(price_ttc * acompte_percent / 100, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FONCTION: Obtenir les paramètres de paiement
-- ============================================
CREATE OR REPLACE FUNCTION get_payment_settings()
RETURNS JSONB AS $$
DECLARE
  settings JSONB;
BEGIN
  SELECT value INTO settings FROM app_settings WHERE key = 'payment_settings';

  -- Valeurs par défaut
  IF settings IS NULL THEN
    RETURN '{
      "acompte_percent": 30,
      "solde_days_before_departure": 30,
      "full_payment_threshold_days": 30,
      "payment_reminder_days": [45, 30, 15, 7]
    }'::jsonb;
  END IF;

  RETURN settings;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FONCTION: Mettre à jour les paramètres de paiement
-- ============================================
CREATE OR REPLACE FUNCTION update_payment_settings(new_settings JSONB)
RETURNS JSONB AS $$
BEGIN
  INSERT INTO app_settings (key, value, updated_at)
  VALUES ('payment_settings', new_settings, NOW())
  ON CONFLICT (key) DO UPDATE
  SET value = new_settings, updated_at = NOW();

  RETURN new_settings;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MISE À JOUR DU TRIGGER DEVIS ACCEPTÉ
-- Pour utiliser les paramètres dynamiques
-- ============================================
CREATE OR REPLACE FUNCTION on_devis_accepted()
RETURNS TRIGGER AS $$
DECLARE
  dossier_record RECORD;
  acompte_amount NUMERIC;
  existing_facture UUID;
  payment_settings JSONB;
  acompte_percent NUMERIC;
  full_payment_threshold INTEGER;
  days_until_departure INTEGER;
BEGIN
  -- Vérifier si le devis passe en "accepted"
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN

    -- Récupérer les infos du dossier
    SELECT * INTO dossier_record FROM dossiers WHERE id = NEW.dossier_id;

    IF dossier_record IS NOT NULL THEN
      -- Récupérer les paramètres de paiement
      SELECT value INTO payment_settings FROM app_settings WHERE key = 'payment_settings';

      acompte_percent := COALESCE((payment_settings->>'acompte_percent')::NUMERIC, 30);
      full_payment_threshold := COALESCE((payment_settings->>'full_payment_threshold_days')::INTEGER, 30);

      -- Calculer les jours avant départ
      IF dossier_record.departure_date IS NOT NULL THEN
        days_until_departure := dossier_record.departure_date::date - CURRENT_DATE;
      ELSE
        days_until_departure := 999; -- Valeur élevée si pas de date
      END IF;

      -- Si départ proche, paiement total requis
      IF days_until_departure <= full_payment_threshold THEN
        acompte_amount := NEW.total_ttc;
      ELSE
        -- Calculer l'acompte selon le pourcentage configuré
        acompte_amount := ROUND(NEW.total_ttc * acompte_percent / 100, 2);
      END IF;

      -- Mettre à jour le statut du dossier
      UPDATE dossiers
      SET status = 'pending-payment',
          price_ttc = NEW.total_ttc,
          updated_at = NOW()
      WHERE id = NEW.dossier_id;

      -- Vérifier si une facture acompte existe déjà
      SELECT id INTO existing_facture
      FROM factures
      WHERE dossier_id = NEW.dossier_id AND type = 'acompte'
      LIMIT 1;

      -- Créer la facture acompte si elle n'existe pas
      IF existing_facture IS NULL THEN
        INSERT INTO factures (
          dossier_id,
          type,
          amount,
          status,
          created_at
        ) VALUES (
          NEW.dossier_id,
          'acompte',
          acompte_amount,
          'pending',
          NOW()
        );

        -- Mettre à jour le montant acompte dans le dossier
        UPDATE dossiers
        SET acompte_amount = acompte_amount
        WHERE id = NEW.dossier_id;
      END IF;

      -- Log dans timeline avec info si paiement total
      IF days_until_departure <= full_payment_threshold THEN
        INSERT INTO timeline_entries (dossier_id, type, content, created_at)
        VALUES (NEW.dossier_id, 'status_change',
          'Devis accepté - Paiement total requis (départ dans moins de ' || full_payment_threshold || ' jours)',
          NOW());
      ELSE
        INSERT INTO timeline_entries (dossier_id, type, content, created_at)
        VALUES (NEW.dossier_id, 'status_change', 'Devis accepté - En attente de paiement acompte (' || acompte_percent || '%)', NOW());
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- RÉSUMÉ DES PARAMÈTRES
-- ============================================
--
-- PARAMÈTRE                     | DÉFAUT | DESCRIPTION
-- ------------------------------|--------|------------------------------------
-- acompte_percent               | 30     | Pourcentage d'acompte à la réservation
-- solde_days_before_departure   | 30     | Jours avant départ pour payer le solde
-- full_payment_threshold_days   | 30     | Si départ < X jours, paiement total requis
-- payment_reminder_days         | [45,30,15,7] | Jours avant départ pour les rappels
--
-- ============================================
