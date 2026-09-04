-- Supprime 3 triggers/fonctions ETRANGERS a Busmoov, importes par erreur
-- depuis le schema d'une autre application multi-tenant. Ils referencent des
-- objets inexistants ici (folders, folder_notes, NEW.folder_id, NEW.tenant_id,
-- users) et faisaient echouer :
--   - la reception des infos chauffeur (UPDATE voyage_infos.chauffeur_info_recue_at)
--     -> ERROR: relation "folders" does not exist
--   - potentiellement la validation des infos client (voyage_infos)
--   - la creation de demande chauffeur (demandes_chauffeur)
-- La logique metier reelle (notes timeline, notifications_crm) est geree cote
-- application, pas par ces triggers.

DROP TRIGGER IF EXISTS trg_voyage_info_driver_received ON voyage_infos;
DROP TRIGGER IF EXISTS trg_voyage_info_client_submitted ON voyage_infos;
DROP TRIGGER IF EXISTS trg_demande_chauffeur_received ON demandes_chauffeur;

DROP FUNCTION IF EXISTS public.trg_voyage_info_driver_received();
DROP FUNCTION IF EXISTS public.trg_voyage_info_client_submitted();
DROP FUNCTION IF EXISTS public.trg_demande_chauffeur_received();
