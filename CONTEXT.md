# Contexte de la session - Busmoov

## Date de la session
25 décembre 2025

## Résumé des modifications effectuées

### 1. Page Statistiques (nouvelle)
Ajout d'une page complète de statistiques accessible via le menu "Statistiques".

#### Fonctionnalités :
- **Toggle Date signature / Date départ** : Permet de filtrer les stats par date de signature (par défaut) ou par date de départ du voyage
- **Filtres de période** : Mois, Trimestre, Année, Tout
- **Sélecteurs** : Année et mois

#### Cards de stats principales (cliquables pour voir les dossiers) :
- Signatures (nombre de contrats signés)
- CA TTC
- Marge HT (avec pourcentage)
- Achats HT

#### Cards de paiements :
- Encaissé clients
- Reste à encaisser
- Payé fournisseurs
- Reste à payer fournisseurs

#### Section Taux de conversion :
- Demandes reçues
- Devis envoyés
- Contrats signés
- Perdus / Annulés
- Barres de progression avec :
  - Taux d'envoi de devis
  - Taux de signature (sur devis envoyés)
  - Taux de conversion global

#### Graphique CA et Marge par mois :
- Barres horizontales pour CA et Marge
- Nombre de signatures par mois

#### Tableau Statistiques par transporteur :
- Transporteur (numéro + nom)
- Nombre de dossiers
- CA TTC
- Achats HT
- Marge HT
- % Marge (avec code couleur : vert ≥20%, jaune 10-20%, rouge <10%)
- Payé
- Reste à payer
- Bouton "Payer" (ouvre un modal de paiement fournisseur)
- Ligne de totaux

### 2. Paiements Fournisseurs

#### Nouvelle table Supabase : `paiements_fournisseurs`
```sql
CREATE TABLE paiements_fournisseurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dossier_id UUID REFERENCES dossiers(id) ON DELETE CASCADE,
  transporteur_id UUID REFERENCES transporteurs(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type VARCHAR(50) NOT NULL DEFAULT 'virement',
  reference VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Hooks ajoutés dans useSupabase.ts :
- `usePaiementsFournisseurs(dossierId?)` - Récupère les paiements fournisseurs
- `useCreatePaiementFournisseur()` - Crée un paiement
- `useDeletePaiementFournisseur()` - Supprime un paiement

#### Types ajoutés dans database.ts :
- Table `paiements_fournisseurs` avec Row, Insert, Update

### 3. Section Paiements Fournisseurs dans les Dossiers
Dans l'onglet "Paiements" de chaque dossier :
- Résumé : Total payé, Reste à payer, Prix achat HT
- Info du transporteur assigné
- Liste des paiements fournisseur avec suppression
- Bouton "Payer fournisseur" qui ouvre un modal

#### Modal de paiement fournisseur :
- Info transporteur
- Résumé (déjà payé / reste à payer)
- Type de paiement (virement, CB, chèque, espèces)
- Montant avec bouton "Payer le solde"
- Date, référence, notes
- Enregistrement dans la timeline

### 4. Améliorations de la page Dossiers (session précédente)
- Onglets en haut (Contrat, Paiements, Factures, Voyage)
- Suppression de l'adresse de facturation en double
- Onglet Voyage avec infos voyage, demande chauffeur, feuille de route
- Timeline déplacée après les devis
- Widget flottant avec raccourcis
- Dossiers signés mis en évidence (fond vert, badge "Signé")

## Fichiers modifiés

### Fichiers principaux :
- `src/pages/admin/AdminDashboard.tsx` - Page admin principale (>500KB, avertissement Babel)
- `src/hooks/useSupabase.ts` - Hooks React Query pour Supabase
- `src/types/database.ts` - Types TypeScript pour Supabase

### Navigation mise à jour :
```typescript
type Page = '...' | 'stats' | '...'

const navigation = [
  // ...
  { id: 'stats', label: 'Statistiques', icon: BarChart3 },
  // ...
]
```

## Points d'attention

### Fichier AdminDashboard.tsx volumineux
Le fichier dépasse 500KB et génère un avertissement Babel. À terme, il serait bon de le découper en composants séparés.

### Distinction HT/TTC
- **CA** : Affiché en TTC (price_ttc)
- **Marge** : Calculée en HT (price_ht - price_achat)
- **Achats** : En HT (price_achat)

### Calcul du % de marge
```typescript
margePercent = totalAchat > 0 ? (totalMarge / totalAchat) * 100 : 0
```
Le % de marge est calculé sur le prix d'achat (mark-up), pas sur le prix de vente.

## Serveur de développement
Le serveur Vite tourne sur : http://localhost:5173/

## Prochaines améliorations possibles
- Découper AdminDashboard.tsx en composants séparés
- Ajouter des graphiques plus avancés (Chart.js ou Recharts)
- Export des stats en CSV/Excel
- Filtres supplémentaires dans les stats
