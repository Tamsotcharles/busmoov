-- Etat RLS de chaque table du schema public.
-- LECTURE SEULE. A coller tel quel dans Supabase > SQL Editor.

SELECT
  c.relname AS table_name,
  CASE WHEN c.relrowsecurity THEN 'oui' ELSE 'NON' END AS rls_active,
  COALESCE(p.nb, 0) AS nb_policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN (
  SELECT tablename, COUNT(*) AS nb
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY tablename
) p ON p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relrowsecurity ASC, COALESCE(p.nb, 0) ASC, c.relname;
