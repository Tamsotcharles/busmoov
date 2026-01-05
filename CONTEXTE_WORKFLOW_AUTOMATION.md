# Contexte Workflow & Automation - Busmoov

## Date de mise en place : 29 décembre 2024

---

## 1. SYSTÈME DE PAIEMENT

### Configuration (table `app_settings`, clé `payment_settings`)
```json
{
  "acompte_percent": 30,
  "solde_days_before_departure": 30,
  "full_payment_threshold_days": 30,
  "payment_reminder_days": [45, 30, 15, 7]
}
```

### Règles de paiement
- **Acompte** : 30% du montant total à la réservation
- **Solde** : À régler 30 jours avant le départ
- **Paiement total** : Si le départ est dans moins de 30 jours, paiement intégral requis

### Fichiers SQL
- `supabase/migrations/20241229_payment_settings.sql`
  - Table `app_settings` pour stocker les paramètres
  - Fonctions : `calculate_acompte_amount()`, `get_payment_settings()`, `update_payment_settings()`
  - Mise à jour du trigger `on_devis_accepted()` pour utiliser les paramètres dynamiques

---

## 2. EMAILS DE CONFIRMATION DE PAIEMENT

### Templates créés (table `email_templates`)

| Clé | Nom | Déclencheur |
|-----|-----|-------------|
| `confirmation_reservation` | Confirmation de réservation | Paiement acompte reçu |
| `confirmation_solde` | Confirmation paiement solde | Paiement solde reçu |

### Variables disponibles
- `{{client_name}}` - Nom du client
- `{{reference}}` - Référence du dossier
- `{{departure}}` - Ville de départ
- `{{arrival}}` - Ville d'arrivée
- `{{departure_date}}` - Date de départ
- `{{passengers}}` - Nombre de passagers
- `{{total_ttc}}` - Montant total TTC
- `{{montant_solde}}` - Montant du solde restant
- `{{lien_espace_client}}` - Lien vers l'espace client

### Fichiers SQL
- `supabase/migrations/20241229_fix_templates_simple.sql` (VERSION FINALE)
  - Création des templates avec colonne `body` (NOT NULL)
  - Workflow rules pour acompte et solde
  - Trigger `on_payment_received()` sur la table `factures`

---

## 3. WORKFLOW RULES (table `workflow_rules`)

### Règles actives

| Nom | Trigger Event | Condition | Action |
|-----|---------------|-----------|--------|
| Confirmation paiement acompte | `payment_received` | `payment_type = 'acompte'` | Email `confirmation_reservation` |
| Confirmation paiement solde | `payment_received` | `payment_type = 'solde'` | Email `confirmation_solde` |

### Règles supprimées (doublons nettoyés)
- ~~Confirmation réservation~~ (doublon de "Confirmation paiement acompte")
- ~~Demande chauffeur J-5~~ (remplacé par config dans Paramètres)

---

## 4. SYSTÈME DE DEMANDE CHAUFFEUR

### Configuration (table `app_settings`)
```json
// Clé: cron_chauffeur_auto
{
  "heure": "08:00",
  "enabled": true,
  "jours_avance": 1
}
```

### Template email
- `driver_info` - Infos chauffeur (envoyé au client avec les coordonnées du chauffeur)
- `demande_chauffeur` - Demande au transporteur

### Fonctionnement
- Le cron vérifie chaque jour à 8h00
- Envoie automatiquement les demandes d'infos chauffeur aux transporteurs
- Pour les dossiers dont le départ est dans X jours (configurable, défaut: 1 jour)

---

## 5. EDGE FUNCTION `process-workflow`

### Emplacement
`supabase/functions/process-workflow/index.ts`

### Fonctionnalités
1. **Détection automatique des triggers** via webhooks Supabase
2. **Gestion du type de paiement** (acompte vs solde)
3. **Conditions supportées** :
   - `days_before` - Jours avant départ
   - `status` - Statut du dossier
   - `payment_type` - Type de paiement (acompte/solde)
   - `infos_validated` - Infos voyage validées
   - `chauffeur_received` - Infos chauffeur reçues
   - `bpa_received` - BPA reçu du transporteur

### Déploiement
```bash
npx supabase functions deploy process-workflow --project-ref rsxfmokwmwujercgpnfu
```

---

## 6. TRIGGERS POSTGRESQL

### Trigger sur `factures`
```sql
CREATE TRIGGER trigger_payment_received
  AFTER UPDATE ON factures
  FOR EACH ROW
  EXECUTE FUNCTION on_payment_received();
```

**Comportement** : Quand une facture passe à `status = 'paid'`, déclenche le workflow avec le `payment_type` (acompte ou solde).

### Trigger sur `devis`
```sql
CREATE TRIGGER trigger_on_devis_accepted
  AFTER UPDATE ON devis
  FOR EACH ROW
  EXECUTE FUNCTION on_devis_accepted();
```

**Comportement** : Quand un devis est accepté, crée la facture d'acompte selon les paramètres configurés.

---

## 7. PLANIFICATEUR CRON (pg_cron)

### Configuration
- **Extension** : `pg_cron` (à activer dans Supabase > Database > Extensions)
- **Job** : `daily-departure-reminders`
- **Horaire** : `0 8 * * *` (tous les jours à 8h00 UTC = 9h00 heure française)

### Relances automatiques configurées

| Jour | Type | Condition | Action |
|------|------|-----------|--------|
| J-15 | Rappel solde | Solde non payé | Email rappel solde |
| J-10 | Infos voyage | Infos non validées | Email demande infos |
| J-5 | Demande chauffeur | BPA reçu, pas de chauffeur | Email au transporteur |
| J-2 | Feuille de route | Chauffeur reçu | Email au client |

### Fichiers SQL
- `supabase/migrations/20241229_pg_cron_relances.sql`
  - Table `relance_logs` pour l'historique
  - Fonction `check_departure_reminders()`
  - Fonctions RPC pour l'interface admin : `get_cron_jobs()`, `get_cron_job_history()`, `create_departure_reminder_cron()`, `delete_cron_job()`

---

## 8. INTERFACE ADMIN

### Page Workflow (`WorkflowPage.tsx`)
- **Onglet Règles** : Liste et gestion des workflow rules
- **Onglet Historique** : Historique des exécutions de workflow
- **Onglet Planificateur** :
  - Gestion des jobs cron
  - Bouton "Exécuter maintenant" pour test manuel
  - Historique des exécutions cron
  - Visualisation des relances configurées (J-15, J-10, J-5, J-2)

### Page Paramètres
- **Paramètres de paiement** : Pourcentage acompte, délais
- **Demande chauffeur automatique** : Heure, jours d'avance, activation

---

## 9. FLUX COMPLET D'UN PAIEMENT

```
1. Client paie l'acompte (Stripe webhook)
   ↓
2. Table factures mise à jour (status = 'paid', type = 'acompte')
   ↓
3. Trigger on_payment_received() déclenché
   ↓
4. Appel Edge Function process-workflow avec payment_type = 'acompte'
   ↓
5. Workflow rule "Confirmation paiement acompte" matche
   ↓
6. Email confirmation_reservation envoyé au client
   ↓
7. Statut dossier mis à jour (pending-reservation)
```

---

## 10. TABLES IMPORTANTES

| Table | Description |
|-------|-------------|
| `workflow_rules` | Règles de workflow automatiques |
| `workflow_executions` | Historique des exécutions |
| `email_templates` | Templates d'emails |
| `app_settings` | Paramètres applicatifs (paiement, chauffeur, etc.) |
| `relance_logs` | Historique des relances automatiques |
| `factures` | Factures (acompte, solde, avoir) |
| `dossiers` | Dossiers de réservation |

---

## 11. SECRETS SUPABASE REQUIS

- `SUPABASE_URL` - URL du projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Clé service role
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Email du compte de service Google
- `GOOGLE_PRIVATE_KEY` - Clé privée pour Gmail API
- `GMAIL_SENDER_EMAIL` - Email d'envoi (infos@busmoov.com)
- `PUBLIC_SITE_URL` - URL du site (https://busmoov.fr)

---

## 12. COMMANDES UTILES

### Déployer les Edge Functions
```bash
npx supabase functions deploy process-workflow --project-ref rsxfmokwmwujercgpnfu
npx supabase functions deploy send-email --project-ref rsxfmokwmwujercgpnfu
```

### Exécuter une migration SQL
Copier le contenu du fichier SQL dans : Supabase Dashboard > SQL Editor > New Query > Run

### Vérifier les templates
```sql
SELECT key, name, is_active FROM email_templates WHERE type = 'workflow';
```

### Vérifier les workflow rules
```sql
SELECT name, trigger_event, is_active FROM workflow_rules;
```

### Vérifier les paramètres
```sql
SELECT * FROM app_settings;
```

---

## 13. RÉSUMÉ DES FICHIERS CRÉÉS/MODIFIÉS

### Migrations SQL
- `20241229_payment_settings.sql` - Paramètres de paiement
- `20241229_fix_templates_simple.sql` - Templates email + workflow rules (VERSION FINALE)
- `20241229_pg_cron_relances.sql` - Système de relances automatiques

### Edge Functions
- `supabase/functions/process-workflow/index.ts` - Modifié pour gérer payment_type

### Composants React
- `src/components/admin/WorkflowPage.tsx` - Onglet Planificateur ajouté

---

*Document généré le 29 décembre 2024*
