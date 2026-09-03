#!/usr/bin/env bash
#
# Bloque le commit si un secret est detecte dans les fichiers indexes.
# Le depot Busmoov est PUBLIC : tout secret commite est considere comme fuite.
#
# Installation : npm run hooks:install
# Contournement ponctuel (a eviter) : git commit --no-verify
#
set -uo pipefail

# Motifs de secrets. Format : "libelle|regex_eregrep"
PATTERNS=(
  "Supabase personal access token (sbp_)|sbp_(v0_)?[a-f0-9]{40,}"
  "Supabase service_role / JWT signe|eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}"
  "Cle API Resend|re_[A-Za-z0-9]{20,}"
  "Cle API Mollie (live ou test)|(live|test)_[A-Za-z0-9]{25,}"
  "Cle privee (PEM)|-----BEGIN [A-Z ]*PRIVATE KEY-----"
  "Token GitHub|gh[pousr]_[A-Za-z0-9]{30,}"
  "Cle API Google|AIza[A-Za-z0-9_-]{30,}"
  "Cle AWS|AKIA[0-9A-Z]{16}"
)

# Fichiers exclus : ce script (il contient les motifs) et les exemples.
is_excluded() {
  case "$1" in
    scripts/check-secrets.sh|*.example|*.md) return 0 ;;
    *) return 1 ;;
  esac
}

staged=$(git diff --cached --name-only --diff-filter=ACM)
[ -z "$staged" ] && exit 0

found=0
while IFS= read -r file; do
  [ -f "$file" ] || continue
  is_excluded "$file" && continue

  # Ne scanner que les lignes ajoutees, pas le fichier entier.
  added=$(git diff --cached -U0 -- "$file" | grep '^+' | grep -v '^+++')
  [ -z "$added" ] && continue

  for entry in "${PATTERNS[@]}"; do
    label="${entry%%|*}"
    regex="${entry#*|}"
    # -e est indispensable : certains motifs commencent par "-" (ex. cle PEM)
    # et seraient sinon interpretes comme des options par grep.
    if match=$(printf '%s' "$added" | grep -Eo -e "$regex" | head -1); then
      if [ -n "$match" ]; then
        [ $found -eq 0 ] && printf '\n\033[31m=== COMMIT BLOQUE : secret detecte ===\033[0m\n\n'
        found=1
        printf '  \033[31m%s\033[0m\n' "$file"
        printf '    type    : %s\n' "$label"
        printf '    extrait : %s...\n\n' "$(printf '%s' "$match" | cut -c1-16)"
      fi
    fi
  done
done <<< "$staged"

if [ $found -eq 1 ]; then
  cat <<'EOF'
Le depot busmoov est PUBLIC : ne commitez jamais de secret.

A faire :
  1. Retirer le secret du fichier (passer par une variable d'environnement).
  2. git reset HEAD <fichier> puis re-indexer la version nettoyee.
  3. Si le secret a deja ete pousse : le REVOQUER, le remplacer ne suffit pas.

Faux positif ? Ajustez scripts/check-secrets.sh plutot que d'utiliser --no-verify.
EOF
  exit 1
fi

exit 0
