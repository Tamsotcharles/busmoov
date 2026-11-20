-- Pièces jointes des emails envoyés (nom, type, taille, contenu base64) pour
-- les retrouver depuis Paramètres > Emails envoyés.
alter table public.email_logs add column if not exists attachments jsonb;
