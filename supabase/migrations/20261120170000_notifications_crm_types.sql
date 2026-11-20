-- Types de notifications CRM : la contrainte refusait 'tarif_recu' (écrit par
-- proposition-tarif) et il n'existait pas de type pour un paiement CB réussi.
-- Conséquence : aucune notification « Tarif reçu » n'était enregistrée (insert
-- rejeté en silence), et seuls les paiements échoués avaient un type.
alter table public.notifications_crm drop constraint if exists notifications_crm_type_check;
alter table public.notifications_crm add constraint notifications_crm_type_check check (type = any (array[
  'infos_voyage', 'contact_chauffeur', 'tarif_fournisseur', 'tarif_recu', 'refus_fournisseur',
  'paiement_echoue', 'paiement_recu', 'contrat_signe', 'nouveau_message', 'bpa_valide'
]));

-- Rattrapage : les tarifs reçus aujourd'hui dont la notification a été rejetée.
insert into public.notifications_crm (dossier_id, dossier_reference, type, title, description, source_type, source_name, source_id, created_at)
select df.dossier_id, d.reference, 'tarif_recu',
       'Tarif reçu de ' || t.name,
       t.name || ' propose ' || to_char(df.prix_propose, 'FM999G999D00') || ' € TTC pour ' || d.departure || ' → ' || d.arrival,
       'transporteur', t.name, t.id, coalesce(df.updated_at, now())
from public.demandes_fournisseurs df
join public.dossiers d on d.id = df.dossier_id
join public.transporteurs t on t.id = df.transporteur_id
where df.status = 'tarif_recu' and df.prix_propose is not null and df.updated_at >= '2026-11-20'
  and not exists (select 1 from public.notifications_crm n where n.dossier_id = df.dossier_id and n.type = 'tarif_recu' and n.source_id = t.id);
