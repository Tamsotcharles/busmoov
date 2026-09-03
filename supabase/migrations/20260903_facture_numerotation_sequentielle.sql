-- ============================================================
-- Numerotation sequentielle des factures : NUMERO-MOIS-ANNEE
-- Exemple : 1000-09-2026
-- ============================================================
--
-- L'ancien format FA/FS/AV-YYMM-XXX tirait les 3 derniers chiffres au
-- hasard : 1 000 valeurs possibles par mois. Au-dela d'une trentaine de
-- factures dans le mois, une collision devient probable (paradoxe des
-- anniversaires), et deux factures ne doivent jamais porter le meme
-- numero. La numerotation etait par ailleurs non conforme : l'article
-- 242 nonies A de l'annexe II au CGI impose une sequence chronologique
-- continue, sans rupture.
--
-- Une sequence Postgres est atomique : deux admins qui facturent en
-- meme temps obtiennent deux numeros distincts, ce qu'un calcul cote
-- client ne peut pas garantir.

-- 1) La sequence. Le point de depart s'adapte a l'existant : on ne
--    renumerote jamais une facture deja emise, et on ne reutilise
--    jamais un numero deja pris.
DO $$
DECLARE
  depart bigint := 1000;
  max_existant bigint;
BEGIN
  -- Recupere le plus grand numero deja emis au nouveau format.
  SELECT COALESCE(MAX((regexp_match(reference, '^(\d+)-\d{2}-\d{4}$'))[1]::bigint), 0)
  INTO max_existant
  FROM public.factures
  WHERE reference ~ '^\d+-\d{2}-\d{4}$';

  IF max_existant >= depart THEN
    depart := max_existant + 1;
  END IF;

  EXECUTE format(
    'CREATE SEQUENCE IF NOT EXISTS public.facture_numero_seq START WITH %s INCREMENT BY 1 NO CYCLE',
    depart
  );
END $$;

-- 2) La fonction d'attribution. SECURITY DEFINER pour que la sequence
--    reste hors de portee directe des clients : on n'expose que
--    l'attribution, pas la manipulation du compteur.
CREATE OR REPLACE FUNCTION public.next_facture_reference()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  numero bigint;
BEGIN
  numero := nextval('public.facture_numero_seq');
  -- Mois et annee du moment de l'emission, en heure de Paris : une
  -- facture emise le 1er a 00h30 doit porter le bon mois.
  RETURN numero
    || '-' || to_char(now() AT TIME ZONE 'Europe/Paris', 'MM')
    || '-' || to_char(now() AT TIME ZONE 'Europe/Paris', 'YYYY');
END $$;

COMMENT ON FUNCTION public.next_facture_reference() IS
  'Attribue le prochain numero de facture au format NUMERO-MOIS-ANNEE '
  '(ex. 1000-09-2026). Sequence continue et atomique : ne jamais '
  'construire un numero de facture cote client.';

-- 3) Seuls les comptes authentifies (equipe) peuvent facturer.
--    anon n'a aucune raison de consommer des numeros : chaque appel
--    incremente le compteur et creerait des trous dans la sequence.
REVOKE ALL ON FUNCTION public.next_facture_reference() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_facture_reference() TO authenticated, service_role;

-- 4) Garantir l'unicite au niveau du schema, pas seulement du code.
--    Un index partiel : les anciennes references (FA-2601-042...)
--    restent en place et ne sont pas renumerotees.
CREATE UNIQUE INDEX IF NOT EXISTS factures_reference_unique
  ON public.factures (reference);
