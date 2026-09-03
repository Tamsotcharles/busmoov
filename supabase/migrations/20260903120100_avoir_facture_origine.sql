-- ============================================================
-- Rattachement d'un avoir a la facture qu'il rectifie
-- ============================================================
--
-- Un avoir doit mentionner la facture d'origine : c'est une exigence de
-- forme en facturation française, et sans elle un avoir devient
-- inrattachable en comptabilite.
--
-- Le besoin est devenu criant avec la numerotation sequentielle
-- (migration 20260903_facture_numerotation_sequentielle.sql) : les
-- anciennes references encodaient le dossier (AV-DOS-XXXXXX-01), les
-- nouvelles sont des numeros neutres (1042-09-2026). Plus rien ne reliait
-- un avoir a son origine.
--
-- L'information etait deja connue du code au moment de la creation
-- (selectedFactureForAvoir), simplement jamais enregistree.

ALTER TABLE public.factures
  ADD COLUMN IF NOT EXISTS facture_origine_id uuid
    REFERENCES public.factures(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.factures.facture_origine_id IS
  'Pour un avoir (type = ''avoir''), la facture rectifiee. NULL pour les '
  'factures d''acompte et de solde, et pour les avoirs anterieurs a cette '
  'migration.';

-- Retrouver les avoirs d'une facture donnee doit rester immediat depuis
-- la fiche facture.
CREATE INDEX IF NOT EXISTS factures_facture_origine_id_idx
  ON public.factures (facture_origine_id)
  WHERE facture_origine_id IS NOT NULL;

-- Garde-fous : un avoir ne peut pas se rectifier lui-meme, et seule une
-- facture de type 'avoir' porte une origine.
ALTER TABLE public.factures
  DROP CONSTRAINT IF EXISTS factures_avoir_origine_coherente;

ALTER TABLE public.factures
  ADD CONSTRAINT factures_avoir_origine_coherente CHECK (
    facture_origine_id IS NULL
    OR (type = 'avoir' AND facture_origine_id <> id)
  );
