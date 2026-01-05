# Rapport d'Audit Complet - Busmoov CRM

**Date:** 30 décembre 2025
**Version:** 1.0
**Projet:** Busmoov - Plateforme de réservation de transport en autocar

---

## Table des matières

1. [Résumé Exécutif](#résumé-exécutif)
2. [Bugs et Problèmes de Stabilité](#bugs-et-problèmes-de-stabilité)
3. [Vulnérabilités de Sécurité](#vulnérabilités-de-sécurité)
4. [Scripts de Test](#scripts-de-test)
5. [Plan de Remédiation](#plan-de-remédiation)

---

## Résumé Exécutif

### Vue d'ensemble

| Catégorie | Critique | Haute | Moyenne | Basse |
|-----------|----------|-------|---------|-------|
| **Bugs de stabilité** | 4 | 4 | 9 | 3 |
| **Sécurité** | 2 | 4 | 4 | 0 |
| **TOTAL** | **6** | **8** | **13** | **3** |

### Actions Immédiates Requises

1. **URGENT** - Régénérer les clés API exposées (Supabase, Geoapify)
2. **URGENT** - Corriger les adresses de retour inversées dans InfosVoyagePage
3. **HAUTE** - Implémenter la sanitization HTML (DOMPurify)
4. **HAUTE** - Corriger les race conditions dans MesDevisPage

---

## Bugs et Problèmes de Stabilité

### Sévérité CRITIQUE (4)

#### 1. Race condition dans loadData
**Fichier:** `src/pages/client/MesDevisPage.tsx:150-235`

```typescript
// PROBLÈME: Plusieurs appels loadData() peuvent être en cours
const loadData = async () => {
  if (!reference || !email) return
  setLoading(true)
  // ... fait plusieurs requêtes successives
}

useEffect(() => {
  loadData() // Pas d'AbortController
}, [reference, email])
```

**Fix:** Implémenter un AbortController

```typescript
useEffect(() => {
  const controller = new AbortController()
  loadData(controller.signal)
  return () => controller.abort()
}, [reference, email])
```

#### 2. Pas de vérification d'erreur sur suppression paiement
**Fichier:** `src/hooks/useSupabase.ts:765-776`

```typescript
// PROBLÈME: Erreur ignorée sur première suppression
await supabase.from('paiements').delete().eq('contrat_id', contratId)
// Pas de vérification d'erreur!
```

**Fix:**
```typescript
const { error: paymentError } = await supabase.from('paiements').delete()...
if (paymentError) throw paymentError
```

#### 3. Adresses de retour inversées
**Fichier:** `src/pages/client/InfosVoyagePage.tsx:79-80`

```typescript
// PROBLÈME: arrival et departure sont inversés!
const retourAdresseDepart = ... || typedDossier.arrival  // ERREUR!
const retourAdresseArrivee = ... || typedDossier.departure  // ERREUR!
```

**Fix:**
```typescript
const retourAdresseDepart = ... || typedDossier.departure  // départ du retour
const retourAdresseArrivee = ... || typedDossier.arrival  // arrivée du retour
```

#### 4. Logique de flux paiement incohérente
**Fichier:** `src/pages/client/PaymentPage.tsx:136-146`

La logique pour déterminer le montant à payer est confuse et peut mener à des montants incorrects.

### Sévérité HAUTE (4)

#### 1. Cast dangereux avec `any`
**Fichier:** `src/components/admin/MessagesPage.tsx:89, 111`

```typescript
allMessages?.forEach((msg: any) => {  // Typage perdu
  const dossierGroup = groupsMap.get(dossierId)!  // Non-null assertion
```

#### 2. Non-null assertion dangereux
**Fichier:** `src/hooks/useSupabase.ts:796`

```typescript
.eq('contrat_id', contratId!)  // Peut causer une erreur runtime
```

#### 3. Pas de validation XSS dans messages
**Fichier:** `src/components/admin/MessagesPage.tsx:145-151`

Le contenu des messages est affiché sans échappement.

#### 4. Pas d'invalidation des paiements après suppression
**Fichier:** `src/hooks/useSupabase.ts:765-785`

### Sévérité MOYENNE (9)

1. Appels Supabase sans vérification d'erreur (PaymentPage, MesDevisPage, InfosVoyagePage)
2. Split nom/prénom incorrect (InfosVoyagePage:92-93)
3. Pas de validation des dates retour > aller
4. Cast `as any` (PaymentPage:224)
5. Double casting `as unknown as Type` (InfosVoyagePage)
6. useEffect avec dépendances incorrectes (InfosVoyagePage)
7. Pas de validation des paramètres URL
8. Promise sans catch (useAuth)
9. Fetch sans vérification HTTP status

### Sévérité BASSE (3)

1. Timeout non nettoyé dans copyToClipboard
2. Pas de feedback utilisateur sur erreur email
3. Commentaires de dépendances manquants dans useEffect

---

## Vulnérabilités de Sécurité

### CRITIQUE

#### 1. Exposition de clés API
**Fichiers:** `src/lib/supabase.ts`, `.env`

```typescript
// Clé exposée en dur avec fallback!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIs...'
```

**Impact:** Accès à la base Supabase, contournement RLS potentiel

**Remédiation:**
1. Régénérer TOUTES les clés
2. Supprimer les fallbacks
3. Ajouter `.env` au `.gitignore`
4. Purger l'historique git

#### 2. Authentification client faible
**Fichiers:** Pages client (MesDevisPage, PaymentPage, etc.)

```typescript
// Accès avec seulement email + référence
const { data } = await supabase.from('dossiers')
  .eq('reference', reference)
  .eq('client_email', email)
```

**Impact:** Énumération de clients, accès non autorisé

**Remédiation:**
1. Tokens d'accès sécurisés avec expiration
2. Rate limiting
3. OTP (One-Time Password) par email

### HAUTE

#### 3. XSS via dangerouslySetInnerHTML
**Fichiers:** CGVPage.tsx, RecapitulatifPage.tsx

```typescript
dangerouslySetInnerHTML={{
  __html: renderMarkdown(cgv.content)  // Pas de sanitization!
}}
```

**Fix:**
```typescript
import DOMPurify from 'dompurify'
dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(renderMarkdown(cgv.content))
}}
```

#### 4. Tokens de validation faibles
**Fichier:** `src/hooks/useSupabase.ts:2032-2039`

```typescript
// Math.random() n'est pas cryptographique!
token += chars.charAt(Math.floor(Math.random() * chars.length))
```

**Fix:**
```typescript
const buffer = crypto.getRandomValues(new Uint8Array(32))
return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('')
```

#### 5. CORS trop permissif
**Fichiers:** Toutes les Edge Functions

```typescript
'Access-Control-Allow-Origin': '*'  // Trop ouvert!
```

**Fix:**
```typescript
'Access-Control-Allow-Origin': 'https://busmoov.fr'
```

#### 6. Stockage sensible en localStorage
**Fichiers:** ab-testing.ts, pages client

```typescript
sessionStorage.setItem('client_dossier', JSON.stringify({
  id, reference, email  // Données sensibles exposées
}))
```

### MOYENNE

1. Authentification admin sans 2FA
2. RLS non vérifiées côté client
3. Paramètres sensibles en URL (email, référence)
4. Injection potentielle dans templates email

---

## Scripts de Test

### Fichiers créés

1. **`scripts/generate-test-data.sql`** - Génère des données de test réalistes
   - 5 clients
   - 3 demandes
   - 7 dossiers (tous statuts)
   - Devis, contrats, factures, paiements
   - Timeline, messages, voyage_infos

2. **`scripts/test-e2e.ts`** - Tests E2E automatisés
   - Tests pages publiques
   - Tests API Supabase
   - Tests flux client
   - Tests flux admin
   - Tests flux fournisseur
   - Tests validation données
   - Tests performance

### Exécution

```bash
# Générer les données de test
# Copier le SQL dans Supabase SQL Editor et exécuter

# Exécuter les tests E2E
npm install -D tsx
npx tsx scripts/test-e2e.ts

# Avec variables d'environnement
VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npx tsx scripts/test-e2e.ts
```

---

## Plan de Remédiation

### Priorité 1 - Immédiat (24-48h)

| Action | Fichier | Complexité |
|--------|---------|------------|
| Régénérer clés Supabase | Supabase Dashboard | Faible |
| Régénérer clé Geoapify | Geoapify Dashboard | Faible |
| Supprimer fallback clés | src/lib/supabase.ts | Faible |
| Corriger adresses inversées | InfosVoyagePage.tsx:79-80 | Faible |
| Ajouter .env au .gitignore | .gitignore | Faible |

### Priorité 2 - Court terme (1 semaine)

| Action | Fichier | Complexité |
|--------|---------|------------|
| Installer DOMPurify | package.json | Faible |
| Sanitizer HTML | CGVPage, RecapitulatifPage | Moyenne |
| Ajouter AbortController | MesDevisPage.tsx | Moyenne |
| Vérifier erreurs Supabase | useSupabase.ts, pages | Moyenne |
| Corriger tokens cryptographiques | useSupabase.ts | Moyenne |

### Priorité 3 - Moyen terme (2-4 semaines)

| Action | Fichier | Complexité |
|--------|---------|------------|
| Implémenter auth tokens client | Nouveau système | Haute |
| Rate limiting authentification | Edge Function / Supabase | Moyenne |
| Corriger CORS Edge Functions | supabase/functions/* | Faible |
| Ajouter 2FA admin | Supabase Auth | Moyenne |
| Auditer et tester RLS | Supabase Dashboard | Haute |

### Priorité 4 - Long terme (1-2 mois)

| Action | Fichier | Complexité |
|--------|---------|------------|
| Tests unitaires complets | Nouveau | Haute |
| Tests E2E Playwright | Nouveau | Haute |
| Monitoring/Alerting | Sentry, etc. | Moyenne |
| Code review obligatoire | Process | Faible |
| Documentation sécurité | Docs | Moyenne |

---

## Recommandations Générales

### Architecture

1. **Ajouter une layer de validation** - Utiliser `zod` pour valider tous les inputs
2. **Centraliser la gestion d'erreur** - Pattern global pour les erreurs API
3. **Implémenter retry/backoff** - Pour les appels critiques

### Sécurité

1. **Content Security Policy** - Ajouter CSP headers
2. **Rate Limiting** - Sur toutes les routes sensibles
3. **Logging/Monitoring** - Avec Sentry ou équivalent
4. **Audit régulier** - Tests de pénétration trimestriels

### Qualité

1. **Tests automatisés** - Minimum 80% de couverture
2. **Code review** - Obligatoire avant merge
3. **Linting strict** - eslint avec règles de sécurité
4. **TypeScript strict** - Désactiver `any` implicite

---

## Conclusion

Ce rapport identifie **30 problèmes** dont **6 critiques** nécessitant une action immédiate. Les vulnérabilités les plus graves concernent l'exposition de clés API et l'authentification client faible.

La remédiation des problèmes critiques devrait être prioritaire avant toute mise en production.

---

*Rapport généré automatiquement par l'audit de code Busmoov*
