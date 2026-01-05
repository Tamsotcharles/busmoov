# CLAUDE.md - Contexte du projet Busmoov

## Description du projet

Busmoov est une plateforme de réservation de transport en autocar (bus) en France. L'application gère le cycle complet d'une réservation : demande de devis, comparaison de fournisseurs, signature de contrat, paiement, gestion des informations de voyage et coordination avec les transporteurs.

## Stack technique

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Base de données**: Supabase (PostgreSQL)
- **State management**: TanStack React Query
- **Routing**: React Router v6
- **PDF**: jsPDF + html2canvas
- **Icons**: Lucide React

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
- `generateFeuilleRoutePDF()` - Feuille de route avec infos chauffeur
- `generateBpaPDF()` - Bon pour accord transporteur

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

## Commandes

```bash
npm run dev      # Démarrage en développement
npm run build    # Build de production
npm run preview  # Prévisualisation du build
```

## Dernières fonctionnalités ajoutées

- **Système d'emails automatiques** : Edge Functions pour envoi d'emails via Gmail API
- **Templates d'emails éditables** : Interface admin pour personnaliser les emails (Paramètres > Emails)
- **Notification devis prêts** : Email automatique au client quand ses devis sont générés
- **Pages publiques** : CGV, À propos, Contact, Devenir Partenaire
- **Service Clientèle** : Page complète de gestion des relances avec filtres personnalisés et requêtes prédéfinies
- **Demande chauffeur** : Workflow de demande d'infos chauffeur aux transporteurs
- **Feuille de route** : Affichage dans l'espace client et génération PDF
- **Statistiques cliquables** : Les cards de stats dans Service Clientèle appliquent des filtres au clic
- **Synchronisation paiement/facture** : Mise à jour automatique du statut facture lors d'un paiement

## Pages publiques

- `/` - Page d'accueil avec formulaire de demande de devis
- `/cgv` - Conditions Générales de Vente (chargées depuis la table `cgv`)
- `/a-propos` - Page À propos de Busmoov
- `/contact` - Page de contact avec formulaire
- `/devenir-partenaire` - Formulaire pour les transporteurs souhaitant rejoindre le réseau
