/**
 * Système de réponses automatiques pour le chat client
 * Basé sur la FAQ Centrale Autocar et les informations du voyage
 */

interface VoyageInfo {
  chauffeur_aller_nom?: string | null
  chauffeur_aller_tel?: string | null
  chauffeur_aller_immatriculation?: string | null
  chauffeur_retour_nom?: string | null
  chauffeur_retour_tel?: string | null
  chauffeur_retour_immatriculation?: string | null
}

interface TransporteurInfo {
  astreinte_tel?: string | null
  nom?: string | null
}

interface AutoResponseResult {
  matched: boolean
  response: string | null
  category?: string
}

interface FaqPattern {
  keywords: string[]
  response: string | null
  dynamicKey?: 'chauffeur' | 'astreinte'
}

// Mots-clés et patterns pour détecter les questions
const FAQ_PATTERNS: Record<string, FaqPattern> = {
  bagages: {
    keywords: ['bagage', 'bagages', 'valise', 'valises', 'soute', 'sac', 'sacs', 'combien de bagage', 'poids bagage'],
    response: `📦 **Bagages autorisés**

Chaque passager peut emporter :
• 1 bagage en soute (max 23 kg)
• 1 bagage à main

⚠️ Les bagages hors gabarit (vélos, poussettes, équipements sportifs) doivent être signalés à l'avance pour s'assurer qu'ils peuvent être transportés.`
  },
  chauffeur: {
    keywords: ['chauffeur', 'conducteur', 'contacter le chauffeur', 'contact chauffeur', 'joindre le chauffeur', 'tel chauffeur', 'telephone chauffeur', 'appeler chauffeur', 'numero chauffeur'],
    response: null, // Réponse dynamique basée sur voyage_infos
    dynamicKey: 'chauffeur'
  },
  astreinte: {
    keywords: ['astreinte', 'urgence', 'numero urgence', 'numéro urgence', 'problème', 'probleme', 'retard bus', 'bus en retard', 'accident', 'panne'],
    response: null, // Réponse dynamique
    dynamicKey: 'astreinte'
  },
  siegeBebe: {
    keywords: ['siège bébé', 'siege bebe', 'siège enfant', 'siege enfant', 'rehausseur', 'bébé', 'bebe', 'enfant en bas age', 'enfant en bas âge'],
    response: `👶 **Sièges enfants**

Les autocars ne sont pas équipés de sièges bébé ou rehausseurs.

✅ Vous pouvez apporter votre propre siège auto/rehausseur et l'installer à bord.

⚠️ Prévenez-nous à l'avance afin que le transporteur puisse prévoir l'espace nécessaire.`
  },
  toilettes: {
    keywords: ['toilette', 'toilettes', 'wc', 'pipi', 'pause pipi', 'besoin pressant'],
    response: `🚽 **Toilettes à bord**

Cela dépend du type de véhicule :
• **Autocar Grand Tourisme** : généralement équipé de toilettes
• **Minibus / Autocar Standard** : pas de toilettes

💡 Des pauses régulières sont prévues sur les longs trajets (environ toutes les 2h).`
  },
  retard: {
    keywords: ['retard', 'en retard', 'bus pas là', 'bus pas la', 'attendre', "n'arrive pas", 'narrive pas'],
    response: `⏰ **En cas de retard**

1. Vérifiez l'heure et le lieu de rendez-vous sur votre feuille de route
2. Patientez 15 minutes - les conditions de circulation peuvent causer des retards
3. Contactez le chauffeur directement (numéro sur votre feuille de route)
4. Si le chauffeur est injoignable, appelez le numéro d'astreinte

💡 Demandez "numéro d'astreinte" ou "contact chauffeur" pour obtenir ces informations.`
  },
  pause: {
    keywords: ['pause', 'pauses', 'arrêt', 'arret', 'arrêts', 'arrets', 'fumer', 'cigarette', 'repos'],
    response: `☕ **Pauses pendant le trajet**

Le chauffeur effectue des pauses régulières conformément à la réglementation :
• Pause obligatoire de 45 min après 4h30 de conduite
• Sur les longs trajets : pause environ toutes les 2h

🚬 Il est strictement interdit de fumer dans le car.`
  },
  nourriture: {
    keywords: ['manger', 'nourriture', 'boire', 'boisson', 'pique-nique', 'pique nique', 'repas', 'sandwich', 'collation'],
    response: `🍽️ **Nourriture et boissons à bord**

✅ Autorisé :
• Boissons non alcoolisées en bouteille fermée
• Encas légers et non salissants

❌ Interdit :
• Alcool
• Repas chauds ou odorants
• Nourriture qui peut tacher

🧹 Merci de garder le car propre et de ramasser vos déchets.`
  },
  animaux: {
    keywords: ['animal', 'animaux', 'chien', 'chat', 'chiens', 'chats', 'pet', 'compagnon'],
    response: `🐕 **Animaux à bord**

Les animaux ne sont généralement **pas autorisés** à bord des autocars.

Exception : les chiens d'assistance pour personnes handicapées sont acceptés.

💡 Si vous avez besoin d'un transport avec animal, veuillez nous contacter à l'avance pour étudier les possibilités.`
  },
  degats: {
    keywords: ['dégât', 'degat', 'dégâts', 'degats', 'casse', 'cassé', 'abîmé', 'abime', 'responsabilité', 'responsabilite', 'dommage'],
    response: `⚠️ **Responsabilité et dommages**

Le transporteur est responsable des passagers pendant le voyage.

Pour les bagages :
• Signalez immédiatement tout dommage au chauffeur
• Prenez des photos si possible
• Les objets de valeur doivent être gardés avec vous

📝 Une déclaration écrite pourra être nécessaire pour toute réclamation.`
  },
  listePassagers: {
    keywords: ['liste passagers', 'liste des passagers', 'passagers', 'noms passagers', 'nom des passagers', 'fournir liste', 'liste nominative'],
    response: `📋 **Liste des passagers**

Une liste nominative peut être demandée pour :
• Les voyages avec mineurs
• Les voyages à l'étranger
• Les réservations de groupe

📝 Vous pouvez la transmettre via votre espace client dans la section "Informations voyage".`
  },
  chauffeurRepas: {
    keywords: ['repas chauffeur', 'nourrir chauffeur', 'chauffeur mange', 'déjeuner chauffeur', 'dejeuner chauffeur', 'restaurant chauffeur'],
    response: `🍴 **Repas du chauffeur**

Lors de voyages avec repas prévu pour le groupe :
• Le repas du chauffeur est généralement à votre charge
• Prévoyez le même repas que le groupe ou un équivalent

💡 Cette information est normalement précisée dans votre contrat de réservation.`
  },
  horaires: {
    keywords: ['heure', 'heures', 'horaire', 'horaires', 'départ', 'depart', 'arrivée', 'arrivee', 'rendez-vous', 'rendez vous', 'rdv'],
    response: `🕐 **Horaires de votre voyage**

Les horaires précis de votre voyage sont disponibles sur votre feuille de route.

📍 Informations incluses :
• Heure et lieu de prise en charge
• Heure d'arrivée estimée
• Points d'arrêt éventuels

💡 Consultez votre espace client ou demandez "feuille de route" pour plus de détails.`
  },
  feuilleRoute: {
    keywords: ['feuille de route', 'feuille route', 'itinéraire', 'itineraire', 'programme', 'planning voyage'],
    response: `📄 **Feuille de route**

Votre feuille de route contient toutes les informations de votre voyage :
• Horaires de départ et d'arrivée
• Adresses précises
• Contact du chauffeur (quand disponible)
• Numéro d'astreinte

📲 Vous pouvez la consulter et la télécharger depuis votre espace client.`
  }
}

/**
 * Normalise un texte pour la comparaison (minuscules, sans accents, sans ponctuation)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, ' ') // Remplace la ponctuation par des espaces
    .replace(/\s+/g, ' ') // Normalise les espaces multiples
    .trim()
}

/**
 * Vérifie si un message contient un des mots-clés
 */
function matchesKeywords(message: string, keywords: string[]): boolean {
  const normalizedMessage = normalizeText(message)

  return keywords.some(keyword => {
    const normalizedKeyword = normalizeText(keyword)
    // Vérifie si le mot-clé est présent comme mot entier ou partie significative
    return normalizedMessage.includes(normalizedKeyword)
  })
}

/**
 * Génère la réponse pour le contact chauffeur
 */
function getChauffeurResponse(voyageInfo: VoyageInfo | null): string {
  if (!voyageInfo) {
    return `📞 **Contact chauffeur**

Les informations du chauffeur ne sont pas encore disponibles.

Elles seront communiquées **48h avant le départ** sur votre feuille de route dans votre espace client.

💡 Vous recevrez une notification par email dès qu'elles seront disponibles.`
  }

  const hasAllerInfo = voyageInfo.chauffeur_aller_nom && voyageInfo.chauffeur_aller_tel
  const hasRetourInfo = voyageInfo.chauffeur_retour_nom && voyageInfo.chauffeur_retour_tel

  if (!hasAllerInfo && !hasRetourInfo) {
    return `📞 **Contact chauffeur**

Les informations du chauffeur ne sont pas encore disponibles.

Elles seront communiquées **48h avant le départ** sur votre feuille de route dans votre espace client.

💡 Vous recevrez une notification par email dès qu'elles seront disponibles.`
  }

  let response = `📞 **Contact chauffeur**\n\n`

  if (hasAllerInfo) {
    response += `**Aller :**\n`
    response += `• Chauffeur : ${voyageInfo.chauffeur_aller_nom}\n`
    response += `• Téléphone : ${voyageInfo.chauffeur_aller_tel}\n`
    if (voyageInfo.chauffeur_aller_immatriculation) {
      response += `• Immatriculation : ${voyageInfo.chauffeur_aller_immatriculation}\n`
    }
    response += `\n`
  }

  if (hasRetourInfo) {
    response += `**Retour :**\n`
    response += `• Chauffeur : ${voyageInfo.chauffeur_retour_nom}\n`
    response += `• Téléphone : ${voyageInfo.chauffeur_retour_tel}\n`
    if (voyageInfo.chauffeur_retour_immatriculation) {
      response += `• Immatriculation : ${voyageInfo.chauffeur_retour_immatriculation}\n`
    }
  }

  response += `\n💡 Ces informations sont également disponibles sur votre feuille de route.`

  return response
}

/**
 * Génère la réponse pour le numéro d'astreinte
 */
function getAstreinteResponse(transporteur: TransporteurInfo | null): string {
  const astreinteNumber = transporteur?.astreinte_tel

  if (!astreinteNumber) {
    return `🚨 **Numéro d'astreinte**

Le numéro d'astreinte n'est pas encore disponible.

Il sera communiqué sur votre feuille de route avant le départ.

⚠️ Pour les questions non urgentes, merci d'utiliser ce chat ou votre espace client.`
  }

  const transporteurName = transporteur?.nom ? ` (${transporteur.nom})` : ''

  return `🚨 **Numéro d'astreinte**${transporteurName}

En cas d'urgence le jour du voyage (retard, problème, accident) :

📞 **${astreinteNumber}**

Ce numéro est disponible uniquement le jour de votre voyage.

⚠️ Pour les questions non urgentes, merci d'utiliser ce chat ou votre espace client.`
}

/**
 * Fonction principale : détecte si un message est une question FAQ et retourne la réponse appropriée
 */
export function getAutoResponse(
  message: string,
  voyageInfo: VoyageInfo | null = null,
  transporteur: TransporteurInfo | null = null
): AutoResponseResult {
  // Vérifier chaque catégorie de FAQ
  for (const [category, config] of Object.entries(FAQ_PATTERNS)) {
    if (matchesKeywords(message, config.keywords)) {
      let response: string

      // Réponses dynamiques
      if (config.dynamicKey === 'chauffeur') {
        response = getChauffeurResponse(voyageInfo)
      } else if (config.dynamicKey === 'astreinte') {
        response = getAstreinteResponse(transporteur)
      } else {
        response = config.response!
      }

      return {
        matched: true,
        response,
        category
      }
    }
  }

  return {
    matched: false,
    response: null
  }
}

/**
 * Liste des suggestions de questions fréquentes à afficher dans le chat
 */
export const FAQ_SUGGESTIONS = [
  { label: '📦 Bagages autorisés', message: 'Combien de bagages puis-je emporter ?' },
  { label: '📞 Contact chauffeur', message: 'Comment contacter le chauffeur ?' },
  { label: '🚨 Numéro d\'astreinte', message: 'Quel est le numéro d\'astreinte ?' },
  { label: '👶 Sièges enfants', message: 'Y a-t-il des sièges bébé ?' },
  { label: '🚽 Toilettes', message: 'Y a-t-il des toilettes dans le bus ?' },
  { label: '☕ Pauses', message: 'Y a-t-il des pauses pendant le trajet ?' },
]

/**
 * Vérifie si un message ressemble à une salutation simple
 */
export function isGreeting(message: string): boolean {
  const greetings = ['bonjour', 'bonsoir', 'salut', 'hello', 'hi', 'coucou', 'hey']
  const normalized = normalizeText(message)
  return greetings.some(g => normalized === g || normalized.startsWith(g + ' '))
}

/**
 * Retourne une réponse de salutation
 */
export function getGreetingResponse(): string {
  return `👋 Bonjour !

Je suis l'assistant Busmoov. Je peux répondre à vos questions fréquentes sur votre voyage.

**Questions fréquentes :**
• Bagages autorisés
• Contact chauffeur
• Numéro d'astreinte
• Toilettes / Pauses
• Et plus...

💬 Posez votre question ou sélectionnez un sujet ci-dessous !`
}
