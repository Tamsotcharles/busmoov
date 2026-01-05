-- Migration pour mettre à jour les dossiers qui ont des devis envoyés
-- mais qui sont encore en statut "new" → passer en "pending-client"

-- Mettre à jour les dossiers qui ont au moins un devis avec status='sent'
-- et qui sont encore en statut 'new'
UPDATE dossiers
SET status = 'pending-client',
    updated_at = NOW()
WHERE status = 'new'
  AND id IN (
    SELECT DISTINCT dossier_id
    FROM devis
    WHERE status = 'sent'
  );

-- Ajouter une entrée timeline pour tracer la migration
INSERT INTO timeline (dossier_id, type, content, created_at)
SELECT
  d.id,
  'status_change',
  'Statut mis à jour: Devis envoyés → En attente retour client',
  NOW()
FROM dossiers d
WHERE d.status = 'pending-client'
  AND d.id IN (
    SELECT DISTINCT dossier_id
    FROM devis
    WHERE status = 'sent'
  )
  AND NOT EXISTS (
    SELECT 1 FROM timeline t
    WHERE t.dossier_id = d.id
      AND t.content = 'Statut mis à jour: Devis envoyés → En attente retour client'
  );
