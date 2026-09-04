-- Stats Google Search Console synchronisées quotidiennement par la
-- Edge Function gsc-sync. Lecture : équipe authentifiée. Écriture :
-- service_role uniquement (la fonction).

CREATE TABLE IF NOT EXISTS public.seo_gsc_daily (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date date NOT NULL,
  dimension text NOT NULL CHECK (dimension IN ('query', 'page')),
  key text NOT NULL,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  position numeric(6,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, dimension, key)
);

CREATE INDEX IF NOT EXISTS seo_gsc_daily_dim_date_idx ON public.seo_gsc_daily (dimension, date DESC);

ALTER TABLE public.seo_gsc_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seo_gsc_daily_read_authenticated ON public.seo_gsc_daily;
CREATE POLICY seo_gsc_daily_read_authenticated
  ON public.seo_gsc_daily FOR SELECT TO authenticated USING (true);

-- Piège privilèges par défaut : anon/authenticated reçoivent tous les
-- droits automatiquement, on révoque nommément.
REVOKE ALL ON TABLE public.seo_gsc_daily FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.seo_gsc_daily FROM authenticated;

-- État de la dernière synchronisation (une ligne id='gsc').
CREATE TABLE IF NOT EXISTS public.seo_sync_state (
  id text PRIMARY KEY,
  last_sync_at timestamptz,
  last_error text
);

ALTER TABLE public.seo_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seo_sync_state_read_authenticated ON public.seo_sync_state;
CREATE POLICY seo_sync_state_read_authenticated
  ON public.seo_sync_state FOR SELECT TO authenticated USING (true);

REVOKE ALL ON TABLE public.seo_sync_state FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.seo_sync_state FROM authenticated;
