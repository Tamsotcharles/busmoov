# CLAUDE.md - Contexte du projet Busmoov

## Description du projet

Busmoov est une plateforme de réservation de transport en autocar (bus) multi-pays (France, Espagne, Allemagne, Royaume-Uni). L'application gère le cycle complet d'une réservation : demande de devis, comparaison de fournisseurs, signature de contrat, paiement, gestion des informations de voyage et coordination avec les transporteurs.

## Stack technique

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Base de données**: Supabase (PostgreSQL)
- **State management**: TanStack React Query
- **Routing**: React Router v6
- **PDF**: jsPDF + html2canvas
- **Icons**: Lucide React
- **Internationalisation**: i18next + react-i18next

## Structure du projet

```
src/
├── components/
│   ├── admin/           # Pages du dashboard admin
│   │   ├── ServiceClientelePage.tsx  # Gestion des relances clients
│   │   ├── MessagesPage.tsx          # Chat intermedié admin
│   │   └── ...
│   ├── chat/            # Widget de chat
│   ├── ui/              # Composants réutilisables (Modal, etc.)
│   └── ...
├── hooks/
│   ├── useSupabase.ts   # Hooks React Query pour Supabase
│   ├── useAuth.ts       # Authentification
│   └── useNotifications.ts
├── lib/
│   ├── supabase.ts      # Client Supabase
│   ├── pdf.ts           # Génération de PDFs (devis, contrat, facture, feuille de route)
│   └── utils.ts         # Utilitaires (formatDate, formatPrice, cn, etc.)
├── pages/
│   ├── admin/           # Pages admin (login, dashboard)
│   ├── client/          # Pages client (espace client, devis, paiement, infos voyage)
│   └── fournisseur/     # Pages fournisseur (validation BPA, infos chauffeur)
└── types/
    └── database.ts      # Types TypeScript générés depuis Supabase
```

## Entités principales

### Dossier
Le dossier est l'entité centrale, représentant une demande de transport complète.

**Statuts possibles:**
- `pending-payment` - En attente d'acompte
- `pending-reservation` - En attente de confirmation transporteur
- `pending-info` - En attente des infos voyage du client
- `pending-driver` - En attente des infos chauffeur
- `confirmed` - Confirmé
- `completed` - Terminé

### Devis
Propositions de prix des transporteurs pour une demande.

**Statuts:** `draft`, `sent`, `accepted`, `rejected`

### Factures
- **Types:** `acompte` (30%), `solde`, `avoir`
- **Statuts:** `generated`, `pending`, `paid`

### Demandes Fournisseurs
Demandes envoyées aux transporteurs pour obtenir un BPA (Bon Pour Accord).

### Demandes Chauffeur
Demandes d'informations chauffeur envoyées aux transporteurs avant le départ.

### Voyage Infos
Informations détaillées du voyage (adresses, horaires, contacts, infos chauffeur).

## Workflows principaux

### 1. Cycle de vie d'un dossier
```
Demande client → Devis multiples → Signature contrat → Paiement acompte
→ Réservation transporteur → Infos voyage client → Demande chauffeur
→ Réception infos chauffeur → Feuille de route → Voyage
```

### 2. Service Clientèle (relances)
La page `ServiceClientelePage.tsx` permet de :
- Filtrer les dossiers selon des critères (statut, jours avant départ, solde, etc.)
- Utiliser des requêtes prédéfinies (infos voyage urgentes, solde urgent, etc.)
- Envoyer des relances email individuelles ou en masse
- Demander les infos chauffeur aux transporteurs

### 3. Demande chauffeur
Conditions pour envoyer une demande chauffeur :
1. BPA reçu du transporteur (`bpa_received_at` ou `status = 'bpa_received'`)
2. Infos voyage validées par le client (`validated_at` dans `voyage_infos`)
3. Pas d'infos chauffeur déjà reçues
4. Pas de demande en attente

## Système d'emails automatiques

### Architecture
- **Edge Function `send-email`** : Envoi d'emails via Gmail API (Google Workspace)
- **Edge Function `process-auto-devis`** : Génération automatique de devis + notification client
- **Table `email_templates`** : Templates HTML éditables depuis l'admin
- **Page admin `EmailTemplatesPage`** : Interface de gestion des templates (Paramètres > Emails)

### Templates disponibles (table `email_templates`)
| Clé | Description |
|-----|-------------|
| `quote_sent` | Devis prêts - notification au client |
| `offre_flash` | Offre promotionnelle limitée |
| `payment_reminder` | Rappel acompte |
| `rappel_solde` | Rappel solde à régler |
| `confirmation_reservation` | Confirmation après paiement |
| `info_request` | Demande infos voyage |
| `driver_info` | Envoi coordonnées chauffeur |

### Variables disponibles dans les templates
Syntaxe : `{{variable}}`

| Variable | Description |
|----------|-------------|
| `client_name` | Nom du client |
| `reference` | Référence du dossier |
| `departure` | Ville de départ |
| `arrival` | Ville d'arrivée |
| `departure_date` | Date du voyage |
| `passengers` | Nombre de passagers |
| `nb_devis` | Nombre de devis |
| `total_ttc` | Montant total TTC |
| `reste_a_regler` | Reste à régler |
| `montant_acompte` | Montant de l'acompte |
| `montant_solde` | Montant du solde |
| `lien_espace_client` | Lien vers l'espace client |
| `lien_paiement` | Lien vers la page de paiement |
| `lien_infos_voyage` | Lien vers le formulaire infos voyage |
| `chauffeur_name` | Nom du chauffeur |
| `chauffeur_phone` | Téléphone du chauffeur |
| `transporteur` | Nom du transporteur |
| `is_virement` | Booléen - true si paiement par virement |

### Syntaxe conditionnelle Handlebars
Les templates supportent la syntaxe Handlebars pour les conditions :
```html
{{#if is_virement}}
  <p>Contenu affiché si virement</p>
{{else}}
  <p>Contenu affiché sinon</p>
{{/if}}
```

### Configuration Gmail API
Secrets Supabase requis :
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` : Email du compte de service
- `GOOGLE_PRIVATE_KEY` : Clé privée du compte de service
- `GMAIL_SENDER_EMAIL` : Email d'envoi (infos@busmoov.com)

### Templates manuels (ServiceClientelePage)
Pour les relances manuelles depuis le Service Clientèle :
- `infos_voyage` - Relance pour infos voyage
- `demande_chauffeur` - Demande au transporteur
- `solde` - Rappel de solde
- `acompte` - Rappel d'acompte
- `confirmation` - Confirmation de réservation

## Génération de PDFs

Fonctions dans `src/lib/pdf.ts` :
- `generateDevisPDF()` - Devis client
- `generateContratPDF()` - Contrat de réservation
- `generateFacturePDF()` - Facture (acompte, solde, avoir)
- `generateFeuilleRoutePDF()` - Feuille de route avec infos chauffeur (une colonne pour aller simple)
- `generateBpaPDF()` - Bon pour accord transporteur
- `generateInfosVoyagePDFBase64()` - PDF infos voyage pour envoi au transporteur

## Edge Functions Supabase

Dans `supabase/functions/` :

| Fonction | Description |
|----------|-------------|
| `send-email` | Envoi d'emails via Gmail API avec support Handlebars |
| `sign-contract` | Signature de contrat (contourne RLS) |
| `calculate-price` | Calcul de prix côté serveur |
| `process-auto-devis` | Génération automatique de devis |
| `resend-webhook` | Webhook pour tracking emails Resend |

### Déploiement Edge Functions
```bash
npx supabase functions deploy send-email --project-ref rsxfmokwmwujercgpnfu
npx supabase functions deploy sign-contract --project-ref rsxfmokwmwujercgpnfu
```

## Conventions de code

### Nommage
- Composants React : PascalCase (`ServiceClientelePage`)
- Hooks : camelCase avec préfixe `use` (`useSupabase`, `useDemandesChauffeur`)
- Fichiers : kebab-case ou PascalCase selon le contexte

### Hooks Supabase
Tous les hooks de données sont dans `useSupabase.ts` et suivent le pattern :
- `useXxx()` - Query pour récupérer des données
- `useCreateXxx()` - Mutation pour créer
- `useUpdateXxx()` - Mutation pour mettre à jour
- `useDeleteXxx()` - Mutation pour supprimer

### Styles
- Utilisation de Tailwind CSS avec classes utilitaires
- Couleurs personnalisées : `magenta`, `purple-dark`, `purple-light`
- Classes réutilisables : `card`, `btn`, `btn-primary`, `btn-secondary`, `input`, `label`
- Fonction `cn()` pour fusionner les classes conditionnellement

## Points d'attention

1. **Typage nullable** : Beaucoup de champs Supabase sont nullable, toujours vérifier avec `?.` ou des guards
2. **Invalidation des queries** : Après une mutation, invalider les queries pertinentes avec `queryClient.invalidateQueries()`
3. **Génération de tokens** : Utiliser `generateChauffeurToken()` pour les liens sécurisés
4. **Timeline** : Enregistrer les actions importantes dans la table `timeline` pour l'historique
5. **Email infos voyage** : Utiliser UNIQUEMENT les données `voyageInfo` validées par le client, jamais les données du dossier/devis original
6. **Signature contrat** : Utiliser l'Edge Function `sign-contract` pour contourner les restrictions RLS
7. **Acompte dynamique** : Le pourcentage d'acompte varie selon la date de départ (30% standard, 50% si < 30 jours, 100% si < 15 jours)

## Commandes

```bash
npm run dev      # Démarrage en développement
npm run build    # Build de production
npm run preview  # Prévisualisation du build
```

## Dernières fonctionnalités ajoutées

- **Système d'emails automatiques** : Edge Functions pour envoi d'emails via Gmail API
- **Templates d'emails éditables** : Interface admin pour personnaliser les emails (Paramètres > Emails)
- **Syntaxe Handlebars dans templates** : Support des conditions `{{#if}}...{{else}}...{{/if}}`
- **Notification devis prêts** : Email automatique au client quand ses devis sont générés
- **Pages publiques** : CGV, À propos, Contact, Devenir Partenaire
- **Service Clientèle** : Page complète de gestion des relances avec filtres personnalisés et requêtes prédéfinies
- **Demande chauffeur** : Workflow de demande d'infos chauffeur aux transporteurs
- **Feuille de route** : Affichage dans l'espace client et génération PDF (une colonne pour aller simple)
- **Statistiques cliquables** : Les cards de stats dans Service Clientèle appliquent des filtres au clic
- **Synchronisation paiement/facture** : Mise à jour automatique du statut facture lors d'un paiement
- **Auto-refresh dossier** : Le dossier se met à jour automatiquement après mutations (paiements, etc.)
- **Timeline paiements** : Entrées automatiques dans l'historique lors d'un paiement/remboursement
- **Onglet Historique** : Dans Paramètres, chronologie complète de toutes les actions (filtres date/type/recherche)
- **Liens cliquables Exploitation** : Le numéro de dossier ouvre le dossier dans un nouvel onglet
- **Deep linking dossiers** : URL `/admin?dossierId=xxx` ouvre directement un dossier spécifique
- **Signature contrat via Edge Function** : Contourne les restrictions RLS pour la signature client
- **Paiements Mollie** : Intégration Mollie pour les paiements en ligne (remplace PayTweak)
- **Références devis uniformes** : Format `DEV-YYYYMM-XXXXXX` pour tous les devis (auto et manuels)
- **Mobile responsive amélioré** : Grilles adaptatives sur InfosVoyagePage et RecapitulatifPage
- **Logo scroll-to-top** : Clic sur le logo scroll vers le haut sur la homepage
- **CGV multilingues** : Chargement des CGV selon pays et langue avec fallback

## Pages publiques

- `/` - Page d'accueil avec formulaire de demande de devis
- `/cgv` - Conditions Générales de Vente (chargées depuis la table `cgv`)
- `/a-propos` - Page À propos de Busmoov
- `/contact` - Page de contact avec formulaire
- `/devenir-partenaire` - Formulaire pour les transporteurs souhaitant rejoindre le réseau

## Internationalisation (i18n)

### Langues supportées
| Code | Pays | Devise | TVA Transport |
|------|------|--------|---------------|
| `fr` | France | EUR (€) | 10% |
| `es` | Espagne | EUR (€) | 10% |
| `de` | Allemagne | EUR (€) | 7% |
| `en` | Royaume-Uni (GB) | GBP (£) | 0% |

### Structure des fichiers de traduction
```
src/locales/
├── fr/
│   ├── common.json    # Traductions générales (nav, formulaires, pages)
│   ├── pdf.json       # Traductions pour les PDFs
│   └── forms.json     # Traductions formulaires
├── es/
├── de/
└── en/
```

### Configuration i18n
- **Fichier principal** : `src/lib/i18n.ts`
- **Composants** : `src/components/i18n/LanguageRouter.tsx`
- **Hook pays** : `src/hooks/useCountrySettings.ts`

### URLs avec préfixe de langue
Les URLs publiques incluent un préfixe de langue : `/fr/`, `/es/`, `/de/`, `/en/`
Redirection automatique vers la langue du navigateur si pas de préfixe.

### Templates d'emails multilingues
- **Table** : `email_templates` avec colonne `language` (fr, es, de, en)
- **Contrainte unique** : `(key, language)` - permet le même template en plusieurs langues
- **Fallback** : Si template non trouvé dans la langue demandée, utilise le français avec traduction automatique via `EMAIL_TRANSLATIONS`

### Templates client (par langue)
- `quote_sent`, `confirmation_reservation`, `payment_reminder`, `rappel_solde`
- `info_request`, `driver_info`, `confirmation_signature_cb/virement`
- `review_request`, `confirmation_solde`, `confirmation_demande`, `offre_flash`

### Templates fournisseur (par langue)
Les fournisseurs sont locaux à chaque pays (transporteurs espagnols en Espagne, etc.)
- `demande_chauffeur` - Demande d'infos chauffeur
- `demande_fournisseur` - Confirmation de commande (BPA)
- `demande_prix_fournisseur` - Demande de prix
- `demande_tarif_fournisseur` - Demande de tarif

### Configuration pays (table `countries`)
Chaque pays a sa propre configuration :
- Informations entreprise (nom, SIRET/CIF/Company No., TVA intra)
- Coordonnées bancaires (IBAN, BIC)
- Téléphone et email de contact
- Préfixes factures et proformas
- Contenu légal (CGV, mentions légales, confidentialité)

### Pages admin multi-pays
- **Paramètres > Pays** : Configuration de chaque pays (CountrySettingsPage)
- **Transporteurs** : Filtre par pays (FR, ES, DE, GB)
- **Nouveau dossier** : Sélection du pays client

## Système de références

### Types de références
| Préfixe | Description | Exemple | Visible par |
|---------|-------------|---------|-------------|
| `DEM-` | Demande interne | DEM-XXXXXX | Admin uniquement |
| `DOS-` | Dossier client | DOS-XXXXXX | Client + Admin |
| `DEV-` | Devis | DEV-YYYYMM-XXXXXX | Client + Admin |

### Génération des références de devis
Fonction utilitaire `generateDevisReference()` dans `src/lib/utils.ts` :
- Format uniforme : `DEV-YYYYMM-XXXXXX` (ex: DEV-202601-ABC123)
- Utilisée pour TOUS les devis (auto-générés ET manuels)
- Le client ne peut PAS distinguer un devis auto d'un devis manuel

### Transparence client
Le client ne voit jamais :
- Le champ `is_auto_generated` (uniquement côté admin)
- La différence entre devis auto et manuel
- Les références DEM- (demandes internes)

## Paiements (Mollie)

### Configuration
Secrets Supabase requis :
- `MOLLIE_API_KEY` : Clé API Mollie (live_xxx ou test_xxx)
- `APP_URL` : URL de l'application (pour les redirections)

### Flux de paiement
1. Client accède à RecapitulatifPage
2. Redirection vers Mollie pour paiement
3. Webhook Mollie met à jour le statut
4. Client redirigé vers page de confirmation

## Hooks pays (`useCountrySettings.ts`)

### Hooks disponibles
- `useCountrySettings()` : Liste tous les pays configurés
- `useCurrentCountry()` : Retourne le pays actuel (basé sur la langue)
- `useCurrentCountryCode()` : Retourne le code pays (FR, ES, DE, GB)
- `useCurrentCountryContent(type)` : Contenu légal du pays (mentions légales, confidentialité)

### Tables de contenu par pays
- `cgv` : Conditions Générales de Vente
- `mentions_legales` : Mentions légales
- `politique_confidentialite` : Politique de confidentialité

Chaque table a les colonnes : `country_code`, `language`, `is_active`, `title`, `content`

## Mobile responsive

### Breakpoints Tailwind
- `sm:` : 640px+ (petits écrans)
- `md:` : 768px+ (tablettes)
- `lg:` : 1024px+ (desktop)

### Grilles adaptatives
Utiliser `grid-cols-1 sm:grid-cols-2` pour les formulaires avec 2 colonnes sur desktop et 1 sur mobile.

### iOS fixes (index.css)
- `appearance-none` et `-webkit-appearance: none` sur les inputs
- `font-size: 16px` pour éviter le zoom automatique
- `min-height: 48px` sur les inputs date/time

## Règles de tarification (IMPORTANT)

### Principe fondamental
**⚠️ TOUS LES PRIX DES GRILLES SONT TTC, PAS HT !**

Les tables `tarifs_aller_simple`, `tarifs_ar_1j`, `tarifs_ar_mad`, `tarifs_ar_sans_mad` contiennent des prix TTC.

### Types de service
1. **Aller simple** : Trajet unique dans un sens
2. **AR 1 jour** : Aller-retour le même jour
3. **AR avec MAD** : Aller-retour sur plusieurs jours, le car RESTE sur place (Mise À Disposition)
4. **AR sans MAD** : Aller-retour sur plusieurs jours, le car REPART entre les trajets

**⚠️ Ne JAMAIS supposer une MAD sauf si explicitement mentionné par le client !**

### Règles de sélection du type de service

#### AR sans MAD < 100 km → 2 × aller simple
Pour les AR sans MAD avec distance < 100 km, utiliser **2 × tarif aller simple** (la grille AR sans MAD commence à 100 km).

#### AR avec MAD minimum 70 km
La grille AR MAD commence à 70 km. En dessous, utiliser le tarif journée.

#### Petits km AR 1 jour (≤ 50 km)
- Base : **690 € TTC**
- Si amplitude > 5h ET distance ≤ 20 km : **790 € TTC**
- Si amplitude > 5h ET distance > 20 km : **830 € TTC**

### Coefficients véhicules (depuis table `capacites_vehicules`)
| Code | Capacité | Coefficient |
|------|----------|-------------|
| minibus | 8-20 pax | 0.90 |
| standard | 21-59 pax | 1.00 |
| 60-63 | 60-63 pax | 1.15 |
| 70 | 64-70 pax | 1.30 |
| 83-90 | 71-90 pax | 1.70 |

### Majorations régionales (depuis table `majorations_regions`)
- **0%** : IDF (75, 77, 78, 91-95), 06, 13, 31, 33, 34, 44, 57, 59, 62, 66, 67, 69, 73, 74, 76
- **5%** : 30, 83, 84
- **10%** : 01, 02, 04, 05, 10, 14, 25-28, 32, 35, 37-40, 42, 45, 47, 50, 51, 53, 54, 60, 61, 64, 65, 68, 70, 72, 89
- **15%** : 22, 29, 49, 56 (Bretagne)

### Km hors grille
- Prix par km supplémentaire : **3 € × 2** (aller-retour) = **6 € TTC/km**
- Supplément jour MAD (> 6 jours) : **800 € TTC/jour**
- Supplément jour sans MAD (> 6 jours) : **600 € TTC/jour**

### Calcul de l'amplitude horaire (AR 1 jour)

**Amplitude = (Heure départ retour + Temps trajet retour) - Heure départ aller**

C'est le temps de travail total du chauffeur, du départ du dépôt jusqu'au retour au dépôt.

Exemple :
- Départ aller 09:00
- Trajet aller 1h → Arrivée destination 10:00
- Départ retour 16:30
- Trajet retour 1h → Retour dépôt 17:30
- **Amplitude = 17:30 - 09:00 = 8h30** → Grille **≤10h**

### Temps de conduite (règles chauffeur)

**Temps de conduite = Durée réelle du trajet** (somme des temps de conduite aller + retour)

| Calcul | Formule | Utilisation |
|--------|---------|-------------|
| Amplitude horaire | (Heure départ retour + Temps trajet retour) - Heure départ aller | Choix grille (8h/10h/12h) |
| Temps de conduite | Somme des temps de trajet réels | Règles chauffeur, pauses |

### Règles chauffeurs
| Paramètre | Valeur |
|-----------|--------|
| Conduite continue max | 4h30 (jour) / 4h (nuit 22h-6h) |
| Conduite max/jour | 9h (extension 10h max 2×/semaine) |
| Amplitude max 1 chauffeur | 12h |
| Amplitude max avec coupure ≥ 3h | 14h |
| Coût 2ème chauffeur | **500 € TTC** par transfert |

### Calcul type d'un devis
1. Déterminer le type de service (aller simple, AR 1J, AR MAD, AR sans MAD)
2. Vérifier si < seuil minimum → appliquer règle alternative (ex: 2×AS pour AR sans MAD < 100km)
3. Trouver la tranche kilométrique dans la grille
4. Appliquer le coefficient véhicule
5. Ajouter la majoration régionale si applicable
6. Ajouter les km hors grille si distance > max grille
7. Ajouter coût 2ème chauffeur si amplitude/conduite dépasse les seuils
8. **Le résultat est TTC**

### TVA par pays
| Pays | TVA Transport |
|------|---------------|
| France (FR) | 10% |
| Espagne (ES) | 10% |
| Allemagne (DE) | 7% |
| Royaume-Uni (GB) | 0% |
