-- Migration pour corriger les références à timeline_entries vers timeline
-- La table s'appelle "timeline" et non "timeline_entries"

-- ============================================
-- 1. Corriger la fonction on_devis_accepted
-- ============================================
CREATE OR REPLACE FUNCTION on_devis_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand un devis passe en "accepted", mettre à jour le dossier
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Vérifier que le dossier est en attente de paiement ou nouveau
    IF EXISTS (
      SELECT 1 FROM dossiers
      WHERE id = NEW.dossier_id
      AND (status = 'new' OR status = 'pending-payment' OR status IS NULL)
    ) THEN
      -- Mettre à jour le dossier avec le devis accepté
      UPDATE dossiers
      SET status = 'pending-payment',
          transporteur_id = NEW.transporteur_id,
          total_ttc = NEW.price_ttc,
          price_achat_ht = NEW.prix_achat_ht,
          price_achat_ttc = NEW.prix_achat_ttc,
          updated_at = NOW()
      WHERE id = NEW.dossier_id;

      -- Log dans timeline (corrigé: timeline au lieu de timeline_entries)
      INSERT INTO timeline (dossier_id, type, content, created_at)
      VALUES (NEW.dossier_id, 'status_change', 'Devis accepté - En attente de paiement acompte', NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. Corriger la fonction on_acompte_paid
-- ============================================
CREATE OR REPLACE FUNCTION on_acompte_paid()
RETURNS TRIGGER AS $$
DECLARE
  facture_type TEXT;
  dossier_status TEXT;
BEGIN
  -- Vérifier si la facture passe en "paid"
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN

    -- Récupérer le type de facture
    SELECT type INTO facture_type FROM factures WHERE id = NEW.id;

    -- Si c'est un acompte
    IF facture_type = 'acompte' THEN
      -- Récupérer le statut actuel du dossier
      SELECT status INTO dossier_status FROM dossiers WHERE id = NEW.dossier_id;

      -- Mettre à jour le dossier
      UPDATE dossiers
      SET status = 'pending-reservation',
          acompte_paid_at = NOW(),
          updated_at = NOW()
      WHERE id = NEW.dossier_id;

      -- Log dans timeline (corrigé)
      INSERT INTO timeline (dossier_id, type, content, created_at)
      VALUES (NEW.dossier_id, 'payment', 'Acompte reçu - En attente de réservation transporteur', NOW());

    -- Si c'est le solde
    ELSIF facture_type = 'solde' THEN
      UPDATE dossiers
      SET solde_paid_at = NOW(),
          updated_at = NOW()
      WHERE id = NEW.dossier_id;

      -- Log dans timeline (corrigé)
      INSERT INTO timeline (dossier_id, type, content, created_at)
      VALUES (NEW.dossier_id, 'payment', 'Solde reçu - Paiement complet', NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Corriger la fonction on_bpa_received
-- ============================================
CREATE OR REPLACE FUNCTION on_bpa_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand un BPA est reçu (bpa_received_at passe de NULL à une valeur)
  IF NEW.bpa_received_at IS NOT NULL AND OLD.bpa_received_at IS NULL THEN
    -- Vérifier que le dossier est en attente de réservation
    IF EXISTS (
      SELECT 1 FROM dossiers
      WHERE id = NEW.dossier_id
      AND status = 'pending-reservation'
    ) THEN
      -- Mettre à jour le dossier
      UPDATE dossiers
      SET status = 'pending-info',
          updated_at = NOW()
      WHERE id = NEW.dossier_id;

      -- Log dans timeline (corrigé)
      INSERT INTO timeline (dossier_id, type, content, created_at)
      VALUES (NEW.dossier_id, 'status_change', 'BPA reçu du transporteur - En attente des infos voyage', NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Corriger la fonction on_voyage_info_validated
-- ============================================
CREATE OR REPLACE FUNCTION on_voyage_info_validated()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand les infos voyage sont validées (validated_at passe de NULL à une valeur)
  IF NEW.validated_at IS NOT NULL AND (OLD.validated_at IS NULL OR OLD.validated_at != NEW.validated_at) THEN
    -- Vérifier que le dossier est en attente d'infos
    IF EXISTS (
      SELECT 1 FROM dossiers
      WHERE id = NEW.dossier_id
      AND status = 'pending-info'
    ) THEN
      -- Mettre à jour le dossier
      UPDATE dossiers
      SET status = 'pending-driver',
          updated_at = NOW()
      WHERE id = NEW.dossier_id;

      -- Log dans timeline (corrigé)
      INSERT INTO timeline (dossier_id, type, content, created_at)
      VALUES (NEW.dossier_id, 'status_change', 'Infos voyage validées - En attente des infos chauffeur', NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Corriger la fonction on_chauffeur_info_received
-- ============================================
CREATE OR REPLACE FUNCTION on_chauffeur_info_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand les infos chauffeur sont reçues
  IF NEW.chauffeur_aller_nom IS NOT NULL AND OLD.chauffeur_aller_nom IS NULL THEN
    -- Vérifier que le dossier est en attente chauffeur
    IF EXISTS (
      SELECT 1 FROM dossiers
      WHERE id = NEW.dossier_id
      AND status = 'pending-driver'
    ) THEN
      -- Mettre à jour le dossier
      UPDATE dossiers
      SET status = 'confirmed',
          updated_at = NOW()
      WHERE id = NEW.dossier_id;

      -- Log dans timeline (corrigé)
      INSERT INTO timeline (dossier_id, type, content, created_at)
      VALUES (NEW.dossier_id, 'status_change', 'Infos chauffeur reçues - Dossier confirmé', NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Corriger la fonction on_departure_date_passed
-- ============================================
CREATE OR REPLACE FUNCTION on_departure_date_passed()
RETURNS TRIGGER AS $$
BEGIN
  -- Quand la date de départ est passée et que le dossier est confirmé
  IF NEW.departure_date < CURRENT_DATE AND OLD.departure_date >= CURRENT_DATE THEN
    IF NEW.status = 'confirmed' THEN
      UPDATE dossiers
      SET status = 'completed',
          updated_at = NOW()
      WHERE id = NEW.id;

      -- Log dans timeline (corrigé)
      INSERT INTO timeline (dossier_id, type, content, created_at)
      VALUES (NEW.id, 'status_change', 'Voyage effectué - Dossier terminé', NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
