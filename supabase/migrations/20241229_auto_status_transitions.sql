-- ============================================
-- AUTOMATISATION DES CHANGEMENTS DE STATUT
-- Ces triggers changent automatiquement le statut des dossiers
-- ============================================

-- ============================================
-- 1. DEVIS ACCEPTÉ → Dossier passe en "pending-payment"
--    + Génère automatiquement la facture proforma (acompte)
-- ============================================
CREATE OR REPLACE FUNCTION on_devis_accepted()
RETURNS TRIGGER AS $$
DECLARE
  dossier_record RECORD;
  acompte_amount NUMERIC;
  existing_facture UUID;
BEGIN
  -- Vérifier si le devis passe en "accepted"
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN

    -- Récupérer les infos du dossier
    SELECT * INTO dossier_record FROM dossiers WHERE id = NEW.dossier_id;

    IF dossier_record IS NOT NULL THEN
      -- Mettre à jour le statut du dossier
      UPDATE dossiers
      SET status = 'pending-payment',
          price_ttc = NEW.total_ttc,
          updated_at = NOW()
      WHERE id = NEW.dossier_id;

      -- Calculer l'acompte (30%)
      acompte_amount := ROUND(NEW.total_ttc * 0.30, 2);

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

      -- Log dans timeline
      INSERT INTO timeline_entries (dossier_id, type, content, created_at)
      VALUES (NEW.dossier_id, 'status_change', 'Devis accepté - En attente de paiement acompte', NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_devis_accepted ON devis;
CREATE TRIGGER trigger_devis_accepted
  AFTER UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION on_devis_accepted();

-- ============================================
-- 2. PAIEMENT ACOMPTE REÇU → Dossier passe en "pending-reservation"
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

      -- Log dans timeline
      INSERT INTO timeline_entries (dossier_id, type, content, created_at)
      VALUES (NEW.dossier_id, 'payment', 'Acompte reçu - En attente de réservation transporteur', NOW());

    -- Si c'est le solde
    ELSIF facture_type = 'solde' THEN
      UPDATE dossiers
      SET solde_paid_at = NOW(),
          updated_at = NOW()
      WHERE id = NEW.dossier_id;

      -- Log dans timeline
      INSERT INTO timeline_entries (dossier_id, type, content, created_at)
      VALUES (NEW.dossier_id, 'payment', 'Solde reçu - Paiement complet', NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_acompte_paid ON factures;
CREATE TRIGGER trigger_acompte_paid
  AFTER UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION on_acompte_paid();

-- ============================================
-- 3. BPA REÇU DU FOURNISSEUR → Dossier passe en "pending-info"
-- ============================================
CREATE OR REPLACE FUNCTION on_bpa_received_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le BPA est reçu
  IF (NEW.bpa_received_at IS NOT NULL AND OLD.bpa_received_at IS NULL)
     OR (NEW.status = 'bpa_received' AND OLD.status != 'bpa_received') THEN

    -- Mettre à jour le statut du dossier
    UPDATE dossiers
    SET status = 'pending-info',
        updated_at = NOW()
    WHERE id = NEW.dossier_id
      AND status = 'pending-reservation'; -- Seulement si en attente de résa

    -- Log dans timeline
    INSERT INTO timeline_entries (dossier_id, type, content, created_at)
    VALUES (NEW.dossier_id, 'status_change', 'BPA reçu - En attente des infos voyage client', NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_bpa_received_status ON demandes_fournisseurs;
CREATE TRIGGER trigger_bpa_received_status
  AFTER UPDATE ON demandes_fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION on_bpa_received_status();

-- ============================================
-- 4. INFOS VOYAGE VALIDÉES → Dossier passe en "pending-driver"
-- ============================================
CREATE OR REPLACE FUNCTION on_voyage_infos_validated_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si les infos sont validées
  IF NEW.validated_at IS NOT NULL AND OLD.validated_at IS NULL THEN

    -- Mettre à jour le statut du dossier
    UPDATE dossiers
    SET status = 'pending-driver',
        updated_at = NOW()
    WHERE id = NEW.dossier_id
      AND status = 'pending-info'; -- Seulement si en attente d'infos

    -- Log dans timeline
    INSERT INTO timeline_entries (dossier_id, type, content, created_at)
    VALUES (NEW.dossier_id, 'status_change', 'Infos voyage validées - En attente infos chauffeur', NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_voyage_infos_validated_status ON voyage_infos;
CREATE TRIGGER trigger_voyage_infos_validated_status
  AFTER UPDATE ON voyage_infos
  FOR EACH ROW
  EXECUTE FUNCTION on_voyage_infos_validated_status();

-- ============================================
-- 5. INFOS CHAUFFEUR REÇUES → Dossier passe en "confirmed"
-- ============================================
CREATE OR REPLACE FUNCTION on_chauffeur_info_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si les infos chauffeur sont reçues
  IF NEW.chauffeur_info_recue_at IS NOT NULL AND OLD.chauffeur_info_recue_at IS NULL THEN

    -- Mettre à jour le statut du dossier
    UPDATE dossiers
    SET status = 'confirmed',
        updated_at = NOW()
    WHERE id = NEW.dossier_id
      AND status = 'pending-driver'; -- Seulement si en attente de chauffeur

    -- Log dans timeline
    INSERT INTO timeline_entries (dossier_id, type, content, created_at)
    VALUES (NEW.dossier_id, 'status_change', 'Infos chauffeur reçues - Dossier confirmé', NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_chauffeur_info_received ON voyage_infos;
CREATE TRIGGER trigger_chauffeur_info_received
  AFTER UPDATE ON voyage_infos
  FOR EACH ROW
  EXECUTE FUNCTION on_chauffeur_info_received();

-- ============================================
-- 6. CONTRAT SIGNÉ → Mettre à jour le dossier
-- ============================================
CREATE OR REPLACE FUNCTION on_contrat_signed_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le contrat est signé
  IF NEW.signed_at IS NOT NULL AND OLD.signed_at IS NULL THEN

    -- Log dans timeline
    INSERT INTO timeline_entries (dossier_id, type, content, created_at)
    VALUES (NEW.dossier_id, 'contract', 'Contrat signé par le client', NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_contrat_signed_status ON contrats;
CREATE TRIGGER trigger_contrat_signed_status
  AFTER UPDATE ON contrats
  FOR EACH ROW
  EXECUTE FUNCTION on_contrat_signed_status();

-- ============================================
-- RÉSUMÉ DES TRANSITIONS AUTOMATIQUES
-- ============================================
--
-- ÉVÉNEMENT                    | NOUVEAU STATUT        | ACTION SUPPLÉMENTAIRE
-- -----------------------------|----------------------|----------------------
-- Devis accepté                | pending-payment      | Génère facture acompte
-- Acompte payé                 | pending-reservation  | -
-- BPA reçu                     | pending-info         | -
-- Infos voyage validées        | pending-driver       | -
-- Infos chauffeur reçues       | confirmed            | -
--
-- ============================================
