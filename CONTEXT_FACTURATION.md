# Contexte Facturation - Session du 30/12/2024

## Modifications effectuées

### 1. Correction du calcul "À ENCAISSER" (page Factures)

**Problème** : Le montant "À encaisser" affichait 716€ au lieu de 501€ car il incluait les factures annulées et ne gérait pas correctement les avoirs.

**Solution** :
- Exclure les factures avec `status = 'cancelled'` du calcul
- Exclure les avoirs (`type = 'avoir'`) du calcul "À encaisser"
- Ajouter `Math.max(0, facturesNonPayees)` pour ne jamais afficher de valeur négative

```typescript
// Stats
const totalFactures = factures.length
const totalAcomptes = factures.filter(f => f.type === 'acompte' && f.status !== 'cancelled').reduce((sum, f) => sum + (f.amount_ttc || 0), 0)
const totalSoldes = factures.filter(f => f.type === 'solde' && f.status !== 'cancelled').reduce((sum, f) => sum + (f.amount_ttc || 0), 0)
const totalAvoirs = factures.filter(f => f.type === 'avoir').reduce((sum, f) => sum + (f.amount_ttc || 0), 0)
// À encaisser = factures non payées et non annulées (minimum 0, jamais négatif)
const facturesNonPayees = factures.filter(f => f.status !== 'paid' && f.status !== 'cancelled' && f.type !== 'avoir').reduce((sum, f) => sum + (f.amount_ttc || 0), 0)
const totalNonPayees = Math.max(0, facturesNonPayees)
```

### 2. Affichage des statuts de facture

**Problème** : Les factures payées affichaient "En attente" et les factures annulées n'avaient pas de statut visible.

**Solution** : Ajout du statut "Annulée" avec badge rouge :
```typescript
{facture.status === 'paid' ? (
  <span className="... bg-green-100 text-green-700">Payée</span>
) : facture.status === 'cancelled' ? (
  <span className="... bg-red-100 text-red-700">Annulée</span>
) : facture.type === 'avoir' ? (
  <span className="... bg-gray-100 text-gray-600">Émis</span>
) : (
  <span className="... bg-orange-100 text-orange-700">En attente</span>
)}
```

### 3. Mise à jour automatique du statut facture lors d'un paiement

**Problème** : Quand un paiement était enregistré, la facture correspondante restait "En attente".

**Solution** : Dans `handleAddPaiement`, rechercher une facture correspondant au montant et la marquer comme payée :
```typescript
// Chercher une facture non payée correspondant au montant pour la marquer comme payée
if (newAmount > 0 && factures) {
  const factureCorrespondante = factures.find(
    (f: any) => f.status !== 'paid' && f.status !== 'cancelled' && f.type !== 'avoir' && Math.abs(f.amount_ttc - newAmount) < 0.01
  )
  if (factureCorrespondante) {
    await supabase
      .from('factures')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', factureCorrespondante.id)
    queryClient.invalidateQueries({ queryKey: ['factures', 'dossier', dossier.id] })
  }
}
```

### 4. Changement des labels "Acompte prévu" / "Solde prévu"

**Ancien** : "Acompte prévu" et "Solde prévu"
**Nouveau** : "Montant déjà facturé" et "Reste à facturer"

**Logique de calcul** :
- **Montant déjà facturé** = somme des factures valides (non annulées, non avoirs)
- **Reste à facturer** = prix total du dossier - montant déjà facturé

```typescript
const montantFacture = factures
  .filter((f: any) => f.type !== 'avoir' && f.status !== 'cancelled')
  .reduce((sum: number, f: any) => sum + (f.amount_ttc || 0), 0)
const prixTotalDossier = dossier.price_ttc || contrat.price_ttc || 0
const resteAFacturer = Math.max(0, prixTotalDossier - montantFacture)
```

### 5. Correction de l'onglet "Facturations partielles"

**Problème** : Les dossiers avec un reste à facturer > 0 n'apparaissaient pas.

**Causes et solutions** :
1. La logique vérifiait `factures.length === 0` au lieu de calculer le reste à facturer
2. Le statut `confirmed` manquait dans le filtre de requête

**Requête corrigée** :
```typescript
.in('status', ['pending-payment', 'pending-reservation', 'pending-info', 'pending-info-received', 'pending-driver', 'confirmed', 'completed'])
```

**Calcul corrigé** :
```typescript
const dossiersAvecReste = dossiers.map((d: any) => {
  const montantFacture = dossierFactures
    .filter((f: any) => f.type !== 'avoir' && f.status !== 'cancelled')
    .reduce((sum: number, f: any) => sum + (f.amount_ttc || 0), 0)
  const resteAFacturer = Math.max(0, prixTotal - montantFacture)
  return { ...d, montantFacture, resteAFacturer }
})

const aFacturer = dossiersAvecReste.filter((d: any) => d.contrat?.status === 'active' && d.resteAFacturer > 0)
const partiels = aFacturer.filter((d: any) => d.montantFacture > 0) // Déjà facturé quelque chose
const sansFacture = aFacturer.filter((d: any) => d.montantFacture === 0) // Rien facturé
```

### 6. Modal "Compléter" pour facturations partielles

**Nouvelle UI** :
- Affiche le "Reste à facturer" en évidence (box orange)
- Deux boutons d'action :
  - "Facturer le reste" (facture solde du montant restant)
  - "Générer un avoir" (ouvre le formulaire d'avoir)
- Le montant personnalisé est limité au reste à facturer (max validation)

```typescript
{selectedDossier.isPartiel ? (
  <div className="grid grid-cols-2 gap-3">
    <button onClick={() => setFactureForm({ type: 'solde', amount_ttc: resteAFacturer })}>
      Facturer le reste
    </button>
    <button onClick={() => setFactureForm({ type: 'avoir' })}>
      Générer un avoir
    </button>
  </div>
) : (
  // Mode normal : Acompte / Solde / Avoir
)}
```

### 7. Pré-remplissage des données de facturation depuis le contrat

**Problème** : Les données de facturation n'étaient pas pré-remplies avec les infos de la signature.

**Solution** :
1. Ajout des champs dans la requête contrats :
```typescript
contrats(
  id, reference, status, price_ttc, acompte_amount, solde_amount,
  client_name, billing_address, billing_zip, billing_city
)
```

2. Priorité au contrat dans `openFactureModal` :
```typescript
setFactureForm({
  client_name: contrat?.client_name || dossier.client_name || '',
  client_address: contrat?.billing_address || dossier.billing_address || '',
  client_zip: contrat?.billing_zip || dossier.billing_zip || '',
  client_city: contrat?.billing_city || dossier.billing_city || '',
})
```

---

## Règles métier importantes

### Avoirs
- Un avoir a un montant **négatif** en base de données
- Un avoir d'un montant égal à une facture doit marquer cette facture comme `cancelled`
- Les avoirs ne réduisent pas le "montant déjà facturé" (ils sont comptabilisés séparément)
- Les avoirs n'impactent pas le "À encaisser"

### Statuts de facture
- `generated` : Facture générée, en attente de paiement
- `paid` : Facture payée
- `cancelled` : Facture annulée (suite à un avoir total)

### Calculs
- **À encaisser** = factures non payées et non annulées (hors avoirs), minimum 0
- **Montant facturé** = somme des factures valides (non annulées, non avoirs)
- **Reste à facturer** = prix dossier - montant facturé

---

## Fichiers modifiés

- `src/pages/admin/AdminDashboard.tsx` : Toutes les modifications de facturation
- `supabase/migrations/20241230_fix_timeline_table_name.sql` : Correction des triggers (timeline_entries → timeline)
- `supabase/functions/process-auto-devis/index.ts` : Mise à jour statut dossier vers `pending-client`

---

## Statuts de dossier

| Statut | Description |
|--------|-------------|
| `new` | Nouveau dossier |
| `pending-client` | En attente retour client (devis envoyés) |
| `pending-payment` | En attente d'acompte |
| `pending-reservation` | En attente confirmation transporteur |
| `pending-info` | En attente infos voyage client |
| `pending-info-received` | Infos voyage reçues |
| `pending-driver` | En attente infos chauffeur |
| `confirmed` | Dossier confirmé |
| `completed` | Voyage terminé |
| `cancelled` | Dossier annulé |

---

## Edge Functions modifiées

### process-auto-devis
- Génère automatiquement des devis selon un planning (steps)
- Met à jour le statut du dossier vers `pending-client` après envoi des devis
- Ajoute une entrée timeline avec les détails du devis

### send-email
- Envoi d'emails via Gmail API (Google Workspace)
- Support des pièces jointes
- Templates chargés depuis la table `email_templates`
