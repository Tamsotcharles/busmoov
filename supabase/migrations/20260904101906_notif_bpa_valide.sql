-- Ajoute le type de notification CRM « bpa_valide » (validation d'un BPA
-- par le transporteur), en complément de « refus_fournisseur » deja present.
ALTER TABLE notifications_crm DROP CONSTRAINT IF EXISTS notifications_crm_type_check;
ALTER TABLE notifications_crm ADD CONSTRAINT notifications_crm_type_check
  CHECK (type = ANY (ARRAY[
    'infos_voyage'::text,
    'contact_chauffeur'::text,
    'tarif_fournisseur'::text,
    'refus_fournisseur'::text,
    'paiement_echoue'::text,
    'contrat_signe'::text,
    'nouveau_message'::text,
    'bpa_valide'::text
  ]));
