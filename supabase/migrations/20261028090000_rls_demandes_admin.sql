-- L'étape 2 des RLS (20261012190000) a retiré la lecture anonyme de
-- `demandes`, mais aucune policy n'autorisait l'équipe connectée à la lire :
-- seules restaient « lecture par email » (JWT email = client_email, jamais
-- vrai pour un admin) et l'UPDATE is_admin(). Conséquence côté admin :
-- la jointure demande:demandes(*) de useDossier revenait vide (bloc
-- « Informations complètes de la demande » à « - ») et toute modification
-- de la demande échouait. Les tables voisines (dossiers, voyage_infos,
-- demandes_fournisseurs) ont déjà une policy admin complète.

drop policy if exists demandes_admin_all on public.demandes;
create policy demandes_admin_all on public.demandes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
