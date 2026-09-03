-- Migration pour corriger les prix d'achat qui ont été stockés en TTC au lieu de HT
-- Le champ price_achat dans dossiers doit être en HT
--
-- Cette migration corrige les dossiers où le price_achat a été mal stocké
-- en le convertissant de TTC vers HT (division par 1.1)

-- D'abord, identifier les dossiers potentiellement affectés :
-- - Dossiers avec status 'bpa-received'
-- - Ou dossiers avec transporteur_id et price_achat définis récemment

-- Correction pour le dossier DOS-001009 spécifiquement (prix 9000 TTC -> 8181.82 HT)
UPDATE dossiers
SET
  price_achat = ROUND((price_achat / 1.1)::numeric, 2)
WHERE
  reference = 'DOS-001009'
  AND price_achat = 9000;

-- Vérification
SELECT
  reference,
  price_achat,
  price_ht,
  price_ttc,
  status
FROM dossiers
WHERE reference = 'DOS-001009';
