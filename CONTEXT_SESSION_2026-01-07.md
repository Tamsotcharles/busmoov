# Contexte Session - 7 Janvier 2026

## Bug corrigé : Calcul de durée et tarification

### Problème initial
- **Dossier test** : Paris → Lille, 224 km, dates 16/01/2026 au 18/01/2026
- **Symptôme** : Prix affiché 3390€ TTC au lieu de 2790€ TTC attendu
- **Cause** : Durée calculée à 4 jours au lieu de 3 jours, entraînant un supplément de 600€ incorrect

### Cause racine
Les dates PostgreSQL/Supabase arrivent au format `"2026-01-16 08:00:00+00"` (avec espace) et non au format ISO `"2026-01-16T08:00:00+00:00"` (avec T).

Le code utilisait `.split('T')[0]` qui ne fonctionnait pas avec le format PostgreSQL, retournant la chaîne entière au lieu de `"2026-01-16"`.

### Corrections appliquées

#### 1. EditDevisModal.tsx
- Fonction `calculateDureeJours` : utilisation de `.substring(0, 10)` au lieu de `.split('T')[0]`
- Fonction `detectServiceType` : même correction
- Parsing des dates avec `Date.UTC()` pour éviter les problèmes de timezone

```typescript
// Avant (incorrect)
const depDateStr = dos.departure_date.split('T')[0]

// Après (correct)
const depDateStr = dos.departure_date.substring(0, 10)
const [depYear, depMonth, depDay] = depDateStr.split('-').map(Number)
const depDate = new Date(Date.UTC(depYear, depMonth - 1, depDay))
```

#### 2. AdminDashboard.tsx
- Le `useMemo` pour `dureeJours` (lignes ~9493-9505) avait le même problème
- Corrigé avec `Date.UTC` et `substring(0, 10)`

```typescript
const dureeJours = useMemo(() => {
  if (!dossier?.return_date || !dossier?.departure_date) return 1
  const depDateStr = dossier.departure_date.substring(0, 10)
  const retDateStr = dossier.return_date.substring(0, 10)
  const [depYear, depMonth, depDay] = depDateStr.split('-').map(Number)
  const [retYear, retMonth, retDay] = retDateStr.split('-').map(Number)
  const depDate = new Date(Date.UTC(depYear, depMonth - 1, depDay))
  const retDate = new Date(Date.UTC(retYear, retMonth - 1, retDay))
  const diffDays = Math.round((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1)
}, [dossier?.departure_date, dossier?.return_date])
```

#### 3. pricing-rules.ts
- Fonction `calculerInfosTrajet` : même correction pour le calcul de `nbJoursVoyage`

#### 4. Conversion types Supabase
Les types `numeric` de Supabase arrivent comme strings. Conversion nécessaire :
```typescript
prix_3j: t.prix_3j != null ? parseFloat(String(t.prix_3j)) : null
```

### Commits
- `83ad46b` : Fix calcul durée jours et affichage supplément jours
- `2bd84bb` : Suppression des logs de debug du calcul tarif

---

## Edge Functions - CORS sécurisé

Toutes les Edge Functions ont été mises à jour avec un CORS restrictif :

```typescript
const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}
```

### Functions modifiées
- `calculate-route/index.ts`
- `create-payment-link/index.ts`
- `paytweak-webhook/index.ts` (inclut aussi `x-paytweak-signature` dans les headers)
- `process-auto-devis/index.ts`
- `send-email/index.ts`

### Secret Supabase
- `GEOAPIFY_API_KEY` : utilisé par `calculate-route` et `process-auto-devis`

---

## Autres corrections récentes

### Menu mobile
- `Header.tsx` : Fermeture automatique du menu mobile lors du changement de route
- `EspaceClientPage.tsx` : Menu mobile fonctionnel avec fermeture au clic

### Formulaire multi-étapes
- `MultiStepQuoteForm.tsx` : Scroll vers le haut du formulaire lors du changement d'étape

---

## Fichiers clés modifiés

| Fichier | Description |
|---------|-------------|
| `src/components/admin/EditDevisModal.tsx` | Modal d'édition de devis avec calcul tarif |
| `src/pages/admin/AdminDashboard.tsx` | Dashboard admin avec calcul tarif |
| `src/lib/pricing-rules.ts` | Règles de calcul tarifaire |
| `supabase/functions/*/index.ts` | Edge Functions avec CORS sécurisé |

---

## Points d'attention pour le futur

1. **Dates PostgreSQL** : Toujours utiliser `.substring(0, 10)` pour extraire YYYY-MM-DD
2. **Timezone** : Utiliser `Date.UTC()` pour les calculs de dates
3. **Types Supabase** : Les `numeric` arrivent comme strings, convertir avec `parseFloat(String(val))`
4. **Calcul durée** : 16 jan → 18 jan = 3 jours (pas 4), formule : `diffDays + 1`
