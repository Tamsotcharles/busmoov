# Migrations archivées — NE PAS REJOUER

Ces 17 fichiers ont été appliqués **manuellement** sur la base de production
(SQL Editor de Supabase) entre décembre 2024 et janvier 2026. Ils sont
conservés à titre d'historique.

## Pourquoi ils sont sortis de `supabase/migrations/`

Deux raisons.

**Ils n'étaient pas suivis.** Le CLI Supabase attend un préfixe de version à
14 chiffres (`20260903120000_nom.sql`). Ces fichiers n'en portaient que 8
(`20241229_nom.sql`), ce qui provoquait des collisions — 7 fichiers
partageaient la version `20241229` — et empêchait tout suivi. Aucun n'était
enregistré dans l'historique de migration de la base.

**Les rejouer ferait des dégâts.** Un `supabase db push` les aurait tous
exécutés. Or plusieurs contiennent des instructions de modification de
données, pas seulement de schéma :

| Fichier | Instructions mutantes |
|---|---|
| `20260107_fix_all_email_templates.sql` | 14 |
| `20241229_fix_templates_simple.sql` | 9 |

Elles réécriraient les templates d'emails de production avec des versions
périmées.

## Règle

- **Ne jamais remettre ces fichiers dans `supabase/migrations/`.**
- **Ne jamais les exécuter** sur une base où ils ont déjà été appliqués.
- Toute nouvelle migration va dans `supabase/migrations/` avec un préfixe à
  14 chiffres, et doit être appliquée via le CLI pour être enregistrée dans
  l'historique.

## État de l'historique

La base porte environ 109 migrations qui ne sont pas dans ce dépôt : elles ont
été appliquées via l'interface Supabase. Le dépôt ne permet donc pas de
reconstruire la base à partir de zéro. C'est une dette connue ; elle n'est pas
dangereuse, contrairement au fait de rejouer les fichiers ci-dessus.
