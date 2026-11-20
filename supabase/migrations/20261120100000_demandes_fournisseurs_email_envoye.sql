-- Sépare le texte du mail envoyé au transporteur (email_envoye) de la note interne
-- (note_interne), qui recevait jusqu'ici le corps du mail à la création de la demande.
alter table public.demandes_fournisseurs add column if not exists email_envoye text;
comment on column public.demandes_fournisseurs.email_envoye is 'Texte du mail de demande de prix envoyé au transporteur (affiché via « Voir le mail »)';
comment on column public.demandes_fournisseurs.note_interne is 'Note libre de l''équipe sur cette demande (page Exploitation)';
-- Les anciennes notes qui contenaient le mail (« Bonjour, ... ») basculent dans email_envoye.
update public.demandes_fournisseurs
set email_envoye = note_interne, note_interne = null
where email_envoye is null and note_interne is not null and note_interne ~* '^\s*bonjour';
