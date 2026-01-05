-- Migration pour corriger le trigger on_devis_accepted
-- Le trigger essayait d'accéder à des champs prix_achat_ht et prix_achat_ttc
-- qui n'existent pas dans la table devis

-- ============================================
-- Corriger la fonction on_devis_accepted
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
      AND (status = 'new' OR status = 'pending-payment' OR status = 'pending-client' OR status IS NULL)
    ) THEN
      -- Mettre à jour le dossier avec le devis accepté
      -- Note: On ne met plus à jour price_achat_ht/ttc car ces champs n'existent pas dans devis
      UPDATE dossiers
      SET status = 'pending-payment',
          transporteur_id = NEW.transporteur_id,
          total_ttc = NEW.price_ttc,
          updated_at = NOW()
      WHERE id = NEW.dossier_id;

      -- Log dans timeline
      INSERT INTO timeline (dossier_id, type, content, created_at)
      VALUES (NEW.dossier_id, 'status_change', 'Devis accepté - En attente de paiement acompte', NOW());
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
