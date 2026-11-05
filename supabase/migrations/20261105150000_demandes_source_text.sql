-- demandes.source était un varchar(50). L'origine des leads écrite par le
-- front (src/lib/attribution.ts, commit 6bafdb7 du 12 oct. 2026) dépasse
-- souvent 50 caractères (« google organic | landing:/fr/location-bus |
-- ref:www.google.com » = 62) : l'insert levait une erreur, create-dossier
-- répondait 500 et le formulaire public affichait « Une erreur est survenue ».
-- Toute demande dont l'origine dépassait 50 caractères a été perdue entre le
-- 12 oct. et le 5 nov. 2026.
alter table public.demandes alter column source type text;
