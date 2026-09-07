/**
 * Système de réponses automatiques pour le chat client
 * Basé sur la FAQ métier et les informations du voyage
 * Supporte plusieurs langues (FR, DE, ES, EN)
 */

import { getChatTranslations, type ChatLanguage, type ChatTranslations } from './chatTranslations'

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

type FaqCategory = 'baggage' | 'driver' | 'emergency' | 'babySeat' | 'toilets' | 'delay' | 'breaks' | 'food' | 'animals' | 'damages' | 'passengerList' | 'driverMeal' | 'schedule' | 'roadmap'

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
function getChauffeurResponse(voyageInfo: VoyageInfo | null, t: ChatTranslations): string {
  if (!voyageInfo) {
    return t.responses.driverNotAvailable
  }

  const hasAllerInfo = voyageInfo.chauffeur_aller_nom && voyageInfo.chauffeur_aller_tel
  const hasRetourInfo = voyageInfo.chauffeur_retour_nom && voyageInfo.chauffeur_retour_tel

  if (!hasAllerInfo && !hasRetourInfo) {
    return t.responses.driverNotAvailable
  }

  let response = `${t.responses.driverInfo}\n\n`

  if (hasAllerInfo) {
    response += `**${t.keywords.schedule.includes('aller') ? 'Aller' : 'Outbound'}:**\n`
    response += `• ${voyageInfo.chauffeur_aller_nom}\n`
    response += `• ${voyageInfo.chauffeur_aller_tel}\n`
    if (voyageInfo.chauffeur_aller_immatriculation) {
      response += `• ${voyageInfo.chauffeur_aller_immatriculation}\n`
    }
    response += `\n`
  }

  if (hasRetourInfo) {
    response += `**${t.keywords.schedule.includes('retour') ? 'Retour' : 'Return'}:**\n`
    response += `• ${voyageInfo.chauffeur_retour_nom}\n`
    response += `• ${voyageInfo.chauffeur_retour_tel}\n`
    if (voyageInfo.chauffeur_retour_immatriculation) {
      response += `• ${voyageInfo.chauffeur_retour_immatriculation}\n`
    }
  }

  return response.trim()
}

/**
 * Génère la réponse pour le numéro d'astreinte
 */
function getAstreinteResponse(transporteur: TransporteurInfo | null, t: ChatTranslations): string {
  const astreinteNumber = transporteur?.astreinte_tel

  if (!astreinteNumber) {
    return t.responses.emergencyNotAvailable
  }

  const transporteurName = transporteur?.nom ? ` (${transporteur.nom})` : ''

  return `${t.responses.emergencyInfo}${transporteurName}

📞 **${astreinteNumber}**`
}

/**
 * Fonction principale : détecte si un message est une question FAQ et retourne la réponse appropriée
 */
export function getAutoResponse(
  message: string,
  voyageInfo: VoyageInfo | null = null,
  transporteur: TransporteurInfo | null = null,
  language: ChatLanguage = 'fr'
): AutoResponseResult {
  const t = getChatTranslations(language)

  // Liste des catégories à vérifier
  const categories: FaqCategory[] = [
    'baggage', 'driver', 'emergency', 'babySeat', 'toilets', 'delay',
    'breaks', 'food', 'animals', 'damages', 'passengerList', 'driverMeal',
    'schedule', 'roadmap'
  ]

  // Vérifier chaque catégorie de FAQ
  for (const category of categories) {
    const keywords = t.keywords[category]
    if (matchesKeywords(message, keywords)) {
      let response: string

      // Réponses dynamiques
      if (category === 'driver') {
        response = getChauffeurResponse(voyageInfo, t)
      } else if (category === 'emergency') {
        response = getAstreinteResponse(transporteur, t)
      } else {
        // Mapping des catégories aux réponses
        const responseMap: Record<FaqCategory, keyof typeof t.responses> = {
          baggage: 'baggage',
          driver: 'driverInfo',
          emergency: 'emergencyInfo',
          babySeat: 'babySeat',
          toilets: 'toilets',
          delay: 'delay',
          breaks: 'breaks',
          food: 'food',
          animals: 'animals',
          damages: 'damages',
          passengerList: 'passengerList',
          driverMeal: 'driverMeal',
          schedule: 'schedule',
          roadmap: 'roadmap',
        }
        response = t.responses[responseMap[category]]
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
 * Retourne la liste des suggestions FAQ pour une langue donnée
 */
export function getFaqSuggestions(language: ChatLanguage = 'fr') {
  const t = getChatTranslations(language)
  return [
    { label: t.faqBaggage, message: t.faqBaggageQuestion },
    { label: t.faqDriver, message: t.faqDriverQuestion },
    { label: t.faqEmergency, message: t.faqEmergencyQuestion },
    { label: t.faqBabySeat, message: t.faqBabySeatQuestion },
    { label: t.faqToilets, message: t.faqToiletsQuestion },
    { label: t.faqBreaks, message: t.faqBreaksQuestion },
  ]
}

// Export pour rétrocompatibilité (utilise le français par défaut)
export const FAQ_SUGGESTIONS = getFaqSuggestions('fr')

/**
 * Vérifie si un message ressemble à une salutation simple
 */
export function isGreeting(message: string, language: ChatLanguage = 'fr'): boolean {
  const t = getChatTranslations(language)
  const normalized = normalizeText(message)
  return t.greetingWords.some(g => normalized === g || normalized.startsWith(g + ' '))
}

/**
 * Retourne une réponse de salutation traduite
 */
export function getGreetingResponse(language: ChatLanguage = 'fr'): string {
  const t = getChatTranslations(language)
  return `${t.greetingHello}

${t.greetingIntro}

${t.greetingFaq}

${t.greetingPrompt}`
}
