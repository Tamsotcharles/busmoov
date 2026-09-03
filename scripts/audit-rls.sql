-- ============================================================
-- AUDIT RLS — Busmoov (LECTURE SEULE, ne modifie rien)
-- A executer dans Supabase > SQL Editor, puis coller le resultat.
-- ============================================================

-- 1) Etat RLS de chaque table du schema public + nombre de policies
--    /!\ Lignes "RLS DESACTIVEE" = table lisible par n'importe qui
--        avec la cle anon (publique par nature).
SELECT
  c.relname                                   AS table_name,
  CASE WHEN c.relrowsecurity THEN 'oui' ELSE '### NON ###' END AS rls_active,
  CASE WHEN c.relforcerowsecurity THEN 'oui' ELSE '-' END      AS rls_forcee,
  COALESCE(p.nb, 0)                           AS nb_policies,
  CASE
    WHEN NOT c.relrowsecurity                 THEN 'CRITIQUE : RLS desactivee'
    WHEN COALESCE(p.nb, 0) = 0                THEN 'OK-ish : RLS active, 0 policy => tout bloque'
    ELSE 'a revoir : ' || COALESCE(p.roles, '')
  END                                         AS verdict
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN (
  SELECT
    schemaname, tablename,
    COUNT(*)                                       AS nb,
    string_agg(DISTINCT array_to_string(roles, ','), ' | ') AS roles
  FROM pg_policies
  WHERE schemaname = 'public'
  GROUP BY schemaname, tablename
) p ON p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY c.relrowsecurity ASC, COALESCE(p.nb, 0) ASC, c.relname;


-- 2) Detail des policies : lesquelles sont ouvertes au role anon ?
--    Une policy anon avec qualification "true" = table entierement publique.
SELECT
  tablename,
  policyname,
  cmd                                AS operation,
  array_to_string(roles, ',')        AS roles,
  COALESCE(qual, '(aucune)')         AS condition_lecture,
  COALESCE(with_check, '(aucune)')   AS condition_ecriture,
  CASE
    WHEN 'anon' = ANY(roles) AND COALESCE(qual, 'true') = 'true'
      THEN '### OUVERTE A TOUS ###'
    WHEN 'public' = ANY(roles) AND COALESCE(qual, 'true') = 'true'
      THEN '### OUVERTE A TOUS ###'
    WHEN 'anon' = ANY(roles) OR 'public' = ANY(roles)
      THEN 'anon, conditionnee'
    ELSE 'authentifie'
  END                                AS exposition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY
  (('anon' = ANY(roles) OR 'public' = ANY(roles)) AND COALESCE(qual, 'true') = 'true') DESC,
  tablename, cmd;


-- 3) Vues SECURITY DEFINER dans public : elles contournent la RLS
--    des tables sous-jacentes si exposees via l'API REST.
SELECT
  c.relname AS vue,
  CASE WHEN c.reloptions::text LIKE '%security_invoker=true%'
       THEN 'security_invoker (ok)'
       ELSE '### SECURITY DEFINER — contourne la RLS ###'
  END AS mode
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'v'
ORDER BY 2 DESC, 1;


-- 4) Droits bruts accordes a anon / authenticated au niveau GRANT.
--    Une table sans RLS mais sans GRANT n'est pas atteignable ;
--    une table avec GRANT et sans RLS est totalement exposee.
SELECT
  table_name,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) AS droits
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
GROUP BY table_name, grantee
ORDER BY
  CASE WHEN grantee = 'anon' THEN 0 ELSE 1 END,
  table_name;
