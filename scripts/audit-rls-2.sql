-- Quelles policies laissent passer le role anon (cle publique) ?
-- LECTURE SEULE. A coller tel quel dans Supabase > SQL Editor.
--
-- exposition = OUVERTE  -> aucune condition : acces total pour n'importe qui
-- exposition = filtree   -> anon passe mais une condition s'applique

SELECT
  tablename,
  cmd AS operation,
  policyname,
  CASE
    WHEN COALESCE(qual, 'true') = 'true' AND COALESCE(with_check, 'true') = 'true'
      THEN 'OUVERTE'
    ELSE 'filtree'
  END AS exposition,
  COALESCE(qual, '-')       AS condition_lecture,
  COALESCE(with_check, '-') AS condition_ecriture
FROM pg_policies
WHERE schemaname = 'public'
  AND (roles && ARRAY['anon', 'public']::name[])
ORDER BY
  CASE WHEN COALESCE(qual, 'true') = 'true'
            AND COALESCE(with_check, 'true') = 'true' THEN 0 ELSE 1 END,
  CASE cmd WHEN 'ALL' THEN 0 WHEN 'DELETE' THEN 1 WHEN 'UPDATE' THEN 2
           WHEN 'INSERT' THEN 3 ELSE 4 END,
  tablename;
