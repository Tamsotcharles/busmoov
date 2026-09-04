import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { fr, es, de, enGB } from 'date-fns/locale'
import { supabase } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Générer une référence de devis au format uniforme
 * Format: DEV-YYYYMM-XXXXXX (ex: DEV-202601-ABC123)
 */
export function generateDevisReference(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `DEV-${year}${month}-${random}`
}

// Mapping langue -> locale date-fns
const dateLocales: Record<string, typeof fr> = {
  fr: fr,
  es: es,
  de: de,
  en: enGB,
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd MMM yyyy', { locale: fr })
}

// Version localisée pour les PDFs
export function formatDateLocalized(date: string | Date | null | undefined, lang: string = 'fr'): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  const locale = dateLocales[lang] || fr
  // Format adapté à la langue
  if (lang === 'de') {
    return format(d, 'd. MMMM yyyy', { locale })
  }
  return format(d, 'd MMMM yyyy', { locale })
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'd MMM yyyy HH:mm', { locale: fr })
}

// Version localisée pour les PDFs
export function formatDateTimeLocalized(date: string | Date | null | undefined, lang: string = 'fr'): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  const locale = dateLocales[lang] || fr
  return format(d, 'd MMM yyyy HH:mm', { locale })
}

export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm', { locale: fr })
}

export function formatPrice(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Attribue le prochain numéro de facture au format NUMERO-MOIS-ANNEE
 * (ex. `1000-09-2026`).
 *
 * Le numéro est délivré par la base via une séquence Postgres, jamais
 * calculé ici. Deux raisons :
 *
 * 1. Atomicité — deux admins qui facturent en même temps doivent obtenir
 *    deux numéros distincts. Un compteur côté client ne peut pas le
 *    garantir, et l'ancienne version tirait 3 chiffres au hasard : au-delà
 *    d'une trentaine de factures dans le mois, la collision devenait
 *    probable.
 * 2. Conformité — l'article 242 nonies A de l'annexe II au CGI impose une
 *    séquence chronologique continue, sans rupture.
 *
 * En cas d'échec on lève : mieux vaut refuser d'émettre la facture que de
 * lui donner un numéro douteux.
 */
export async function generateFactureReference(): Promise<string> {
  const { data, error } = await supabase.rpc('next_facture_reference')

  if (error || !data) {
    throw new Error(
      `Impossible d'attribuer un numéro de facture : ${error?.message ?? 'réponse vide'}`
    )
  }
  return data
}

// NOTE : formatPricePDF a été supprimée ici. Elle n'était plus appelée et son
// remplacement d'espaces était cassé : il ne ciblait que U+00A0 alors qu'Intl
// produit U+202F (espace fine insécable) comme séparateur de milliers en fr-FR.
// Le formatage des montants dans les PDF passe par formatAmount() dans pdf.ts,
// qui traite correctement les deux caractères.

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-'
  // Format français: 06 12 34 56 78
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  }
  return phone
}

export function getStatusConfig(status: string) {
  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    new: { label: '📥 Nouveau', color: '#3B82F6', bg: '#DBEAFE' },
    sent: { label: '📤 Envoyé', color: '#3B82F6', bg: '#DBEAFE' },
    'quotes_sent': { label: '📤 Devisé', color: '#8B5CF6', bg: '#EDE9FE' },
    'pending-client': { label: '⏳ Att. retour client', color: '#F97316', bg: '#FFEDD5' },
    'pending-payment': { label: '💳 Att. paiement', color: '#F59E0B', bg: '#FEF3C7' },
    'pending-reservation': { label: '🔒 Att. réservation', color: '#8B5CF6', bg: '#EDE9FE' },
    'bpa-received': { label: '✅ BPA reçu', color: '#10B981', bg: '#D1FAE5' },
    'pending-supplier': { label: '📋 Att. résa', color: '#F97316', bg: '#FFEDD5' },
    'pending-info': { label: '📝 Att. infos', color: '#06B6D4', bg: '#CFFAFE' },
    'pending-info-received': { label: '📋 Info VO reçue', color: '#0891B2', bg: '#CFFAFE' },
    'pending-info-confirm': { label: '🔄 Att. confirm client', color: '#F97316', bg: '#FFEDD5' },
    'pending-balance': { label: '💰 Voir solde', color: '#92400E', bg: '#FEF3C7' },
    'pending-driver': { label: '👨‍✈️ Att. chauffeur', color: '#7C3AED', bg: '#DDD6FE' },
    confirmed: { label: '✅ Confirmé', color: '#10B981', bg: '#D1FAE5' },
    completed: { label: '✅ Terminé', color: '#10B981', bg: '#D1FAE5' },
    cancelled: { label: '❌ Abandonné', color: '#EF4444', bg: '#FEE2E2' },
    accepted: { label: '✅ Accepté', color: '#10B981', bg: '#D1FAE5' },
    refused: { label: '❌ Refusé', color: '#EF4444', bg: '#FEE2E2' },
    expired: { label: '⏰ Expiré', color: '#6B7280', bg: '#F3F4F6' },
    pending: { label: '⏳ En attente', color: '#F59E0B', bg: '#FEF3C7' },
    paid: { label: '✅ Payé', color: '#10B981', bg: '#D1FAE5' },
  }
  return statusMap[status] || { label: status, color: '#6B7280', bg: '#F3F4F6' }
}

export function getVehicleTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Autocar'
  const types: Record<string, string> = {
    minibus: 'Minibus',
    'autocar-standard': 'Autocar Standard',
    'autocar_standard': 'Autocar Standard',
    'autocar-gt': 'Autocar Grand Tourisme',
    'autocar_gt': 'Autocar Grand Tourisme',
    'autocar_grand_tourisme': 'Autocar Grand Tourisme',
    'autocar-grand-tourisme': 'Autocar Grand Tourisme',
    'midibus': 'Midibus',
    'double_decker': 'Autocar à étage',
    'double-decker': 'Autocar à étage',
  }
  return types[type] || type.replace(/_/g, ' ').replace(/-/g, ' ')
}

export function getVoyageTypeLabel(type: string | null | undefined): string {
  if (!type) return '-'
  const types: Record<string, string> = {
    scolaire: 'Sortie scolaire',
    entreprise: 'Séminaire entreprise',
    mariage: 'Mariage / Événement',
    sportif: 'Déplacement sportif',
    touristique: 'Voyage touristique',
    autre: 'Autre',
  }
  return types[type] || type
}

export function getTripModeLabel(tripMode: string | null | undefined): string {
  if (!tripMode) return '-'
  const modes: Record<string, string> = {
    // Anciennes valeurs
    'aller_simple': '➡️ Aller simple',
    'one-way': '➡️ Aller simple',
    'aller_retour': '↔️ Aller-Retour',
    'round-trip': '↔️ Aller-Retour',
    'circuit': '🔄 Circuit',
    // Nouvelles valeurs
    'Aller simple': '➡️ Aller simple',
    'Aller-Retour 1 jour': '↔️ Aller-Retour 1 jour',
    'Aller-Retour sans mise à disposition': '↔️ AR sans mise à dispo',
    'Aller-Retour avec mise à disposition': '🔄 AR + Mise à disposition',
  }
  return modes[tripMode] || tripMode
}

export function calculateTTC(priceHT: number, tvaRate: number): number {
  return Math.round(priceHT * (1 + tvaRate / 100))
}

/**
 * Statut d'affichage effectif d'un dossier, dérivé de son état réel.
 *
 * Le champ `status` en base est mono-dimension et ne suit pas toujours
 * l'avancement (ex. un dossier signé restait affiché « Att. retour
 * client »). Cette fonction calcule le PROCHAIN jalon à franchir, pour
 * que le badge reflète où en est vraiment le dossier — dans la liste, la
 * fiche dossier et l'exploitation.
 *
 * Avant signature, le statut brut est conservé (new, quotes_sent,
 * pending-client...). Après signature, l'ordre de priorité du badge suit
 * le workflow : paiement → réservation (BPA) → infos client → validation
 * des infos → chauffeur. Les dimensions sont parallèles (cf. cards du
 * dashboard) ; le badge unique montre l'action la plus prioritaire.
 */
export function getStatutEffectif(params: {
  status: string | null | undefined
  contractSignedAt: string | null | undefined
  montantPaye: number
  acompteRequis: number
  hasBpaConfirme: boolean
  hasInfosClient: boolean
  infosValidees: boolean
  chauffeurRecu: boolean
}): string {
  const {
    status, contractSignedAt, montantPaye, acompteRequis,
    hasBpaConfirme, hasInfosClient, infosValidees, chauffeurRecu,
  } = params

  // Etats terminaux ou annules : intouchables.
  if (status === 'completed' || status === 'cancelled') return status
  // Avant signature : on garde le statut amont tel quel.
  if (!contractSignedAt) return status || 'new'

  if (montantPaye < acompteRequis) return 'pending-payment'
  if (!hasBpaConfirme) return 'pending-reservation'
  if (!hasInfosClient) return 'pending-info'
  if (!infosValidees) return 'pending-info-received'
  if (!chauffeurRecu) return 'pending-driver'
  return status === 'confirmed' ? 'confirmed' : 'pending-driver'
}

/**
 * Calcule le statut effectif d'un dossier à partir de ses objets liés
 * (paiements, demandes fournisseurs, infos voyage). Wrapper pratique
 * autour de getStatutEffectif pour les vues admin.
 */
export function computeStatutEffectif(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dossier: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  demandesFournisseurs: any[],
  voyageEntry: { hasInfos?: boolean; validated?: boolean; chauffeurRecu?: boolean } | undefined,
): string {
  const prixTTC = dossier.price_ttc || 0
  const montantPaye = (dossier.paiements || []).reduce(
    (s: number, p: any) => s + (p.amount || 0), 0, // eslint-disable-line @typescript-eslint/no-explicit-any
  )
  const contrat = (dossier.contrats || [])[0]
  const acompteRequis = contrat?.acompte_amount ?? dossier.acompte_amount ?? Math.round(prixTTC * 0.3)
  const hasBpaConfirme = (demandesFournisseurs || []).some(
    (df: any) => df.dossier_id === dossier.id && (df.bpa_received_at || df.status === 'bpa_received'), // eslint-disable-line @typescript-eslint/no-explicit-any
  )
  return getStatutEffectif({
    status: dossier.status,
    contractSignedAt: dossier.contract_signed_at,
    montantPaye,
    acompteRequis,
    hasBpaConfirme,
    hasInfosClient: !!voyageEntry?.hasInfos,
    infosValidees: !!voyageEntry?.validated,
    chauffeurRecu: !!voyageEntry?.chauffeurRecu || !!dossier.chauffeur_name,
  })
}

/**
 * Retourne l'URL de base du site (production ou localhost en dev)
 * Utilise VITE_SITE_URL si défini, sinon détecte automatiquement
 */
export function getSiteBaseUrl(): string {
  // Variable d'environnement prioritaire si définie
  const envUrl = import.meta.env.VITE_SITE_URL
  if (envUrl) return envUrl

  // En production sur Vercel, utiliser l'URL de production
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    // Si on est en production (pas localhost), utiliser l'origin
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return origin
    }
  }

  // URL par défaut en production.
  // Pas busmoov.fr : le certificat de ce domaine est en erreur (constate
  // le 3 sept. 2026), un lien d'email construit dessus serait mort.
  return 'https://www.busmoov.com'
}

export function calculateTVA(priceHT: number, tvaRate: number): number {
  return Math.round(priceHT * tvaRate / 100)
}

export function calculateAcompte(priceTTC: number, percentage: number = 30): number {
  return Math.round(priceTTC * percentage / 100)
}

/**
 * Calcule l'amplitude horaire à partir des heures de départ et retour
 * @param departureTime Heure de départ (format HH:mm)
 * @param returnTime Heure de retour (format HH:mm)
 * @returns L'amplitude correspondante ('8h', '10h', '12h', '9h_coupure') ou null
 */
export function calculateAmplitudeFromTimes(
  departureTime: string | null | undefined,
  returnTime: string | null | undefined
): '8h' | '10h' | '12h' | '9h_coupure' | null {
  if (!departureTime || !returnTime) return null

  try {
    const [depHours, depMinutes] = departureTime.split(':').map(Number)
    const [retHours, retMinutes] = returnTime.split(':').map(Number)

    if (isNaN(depHours) || isNaN(depMinutes) || isNaN(retHours) || isNaN(retMinutes)) {
      return null
    }

    // Calculer la durée en minutes
    let durationMinutes = (retHours * 60 + retMinutes) - (depHours * 60 + depMinutes)

    // Si retour le lendemain ou même jour avec heure retour < départ, ajouter 24h
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60
    }

    const durationHours = durationMinutes / 60

    // Déterminer l'amplitude selon la durée
    // <= 8h = 8h, <= 10h = 10h, <= 12h = 12h, > 12h = 12h (max)
    if (durationHours <= 8) return '8h'
    if (durationHours <= 10) return '10h'
    return '12h'
  } catch {
    return null
  }
}

/**
 * Retourne le préfixe de langue à utiliser dans les URLs en fonction du code pays
 * FR -> fr, ES -> es, DE -> de, GB -> en
 */
export function getLanguageFromCountry(countryCode: string | null | undefined): string {
  switch (countryCode?.toUpperCase()) {
    case 'ES': return 'es'
    case 'DE': return 'de'
    case 'GB': return 'en'
    case 'FR':
    default: return 'fr'
  }
}

/**
 * Génère une URL localisée avec le préfixe de langue approprié
 * @param path Le chemin sans le préfixe de langue (ex: /mes-devis)
 * @param countryCode Le code pays (FR, ES, DE, GB)
 * @param queryParams Les paramètres de query string optionnels
 */
export function generateLocalizedUrl(
  path: string,
  countryCode: string | null | undefined,
  queryParams?: Record<string, string>
): string {
  const baseUrl = getSiteBaseUrl()
  const lang = getLanguageFromCountry(countryCode)

  let url = `${baseUrl}/${lang}${path.startsWith('/') ? path : '/' + path}`

  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(queryParams)) {
      if (value) params.append(key, value)
    }
    url += `?${params.toString()}`
  }

  return url
}

/**
 * Génère l'URL d'accès à l'espace client (mes-devis)
 */
export function generateClientAccessUrl(reference: string, email: string, countryCode?: string | null): string {
  return generateLocalizedUrl('/mes-devis', countryCode, { ref: reference, email: email })
}

/**
 * Génère l'URL de la page de paiement
 */
export function generatePaymentUrl(reference: string, email: string, countryCode?: string | null, type?: 'solde'): string {
  const params: Record<string, string> = { ref: reference, email: email }
  if (type) params.type = type
  return generateLocalizedUrl('/paiement', countryCode, params)
}

/**
 * Génère l'URL de la page infos voyage
 */
export function generateInfosVoyageUrl(reference: string, email: string, countryCode?: string | null): string {
  return generateLocalizedUrl('/infos-voyage', countryCode, { ref: reference, email: email })
}

// Génère un lien mailto pour la validation de commande fournisseur
export interface ValidationFournisseurParams {
  transporteurEmail: string
  transporteurName: string
  transporteurCountryCode?: string | null // Pour déterminer la langue de l'email
  dossierReference: string
  departureCity?: string | null
  arrivalCity?: string | null
  departureDate?: string | Date | null
  returnDate?: string | Date | null
  departureTime?: string | null
  returnTime?: string | null
  passengers?: number | null
  prixAchat?: number | null
  serviceType?: string | null
  nbCars?: number | null
  nbChauffeurs?: number | null
  // Paramètres pour la mise à disposition
  detailMad?: string | null
  dureeJours?: number | null
  amplitude?: string | null
  // Nouveaux paramètres pour le lien de validation
  demandeId?: string
  validationToken?: string
}

export function generateValidationFournisseurMailto(params: ValidationFournisseurParams): string {
  const {
    transporteurEmail,
    dossierReference,
    departureCity,
    arrivalCity,
    departureDate,
    departureTime,
    returnDate,
    returnTime,
    passengers,
    prixAchat,
    serviceType,
    nbCars,
    nbChauffeurs,
  } = params

  // Formater les dates
  const formatDateSimple = (date: string | Date | null | undefined): string => {
    if (!date) return ''
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'EEEE d MMMM yyyy', { locale: fr })
  }

  // Déterminer le type de trajet
  const getServiceTypeLabel = (type: string | null | undefined): string => {
    if (type === 'aller_simple') return 'Aller simple'
    if (type === 'aller_retour') return 'Aller-Retour'
    if (type === 'circuit' || type === 'mise_disposition' || type === 'ar_mad') return 'Mise à disposition'
    return returnDate ? 'Aller-Retour' : 'Aller simple'
  }

  const isMiseADispo = serviceType === 'circuit' || serviceType === 'mise_disposition' || serviceType === 'ar_mad'

  const subject = `Confirmation de commande - ${dossierReference}`

  let body = `Bonjour,

Suite à votre proposition, nous vous confirmons la réservation suivante :

Référence dossier : ${dossierReference}
Type de prestation : ${getServiceTypeLabel(serviceType)}
`

  if (departureCity || arrivalCity) {
    body += `Trajet : ${departureCity || ''} → ${arrivalCity || ''}\n`
  }

  if (departureDate) {
    const dateLabel = isMiseADispo ? 'Date début' : 'Date aller'
    body += `${dateLabel} : ${formatDateSimple(departureDate)}${departureTime ? ` à ${departureTime}` : ''}\n`
  }

  if (returnDate) {
    const dateLabel = isMiseADispo ? 'Date fin' : 'Date retour'
    body += `${dateLabel} : ${formatDateSimple(returnDate)}${returnTime ? ` à ${returnTime}` : ''}\n`
  }

  if (passengers) {
    body += `Nombre de passagers : ${passengers}\n`
  }

  if (nbCars && nbCars > 0) {
    body += `Nombre de véhicules : ${nbCars}\n`
  }

  if (nbChauffeurs && nbChauffeurs > 0) {
    body += `Nombre de chauffeurs : ${nbChauffeurs}\n`
  }

  if (prixAchat) {
    const prixTTC = prixAchat * 1.1
    body += `\nMontant convenu : ${prixTTC.toFixed(2).replace('.', ',')} EUR TTC\n`
  }

  body += `
Merci de nous retourner le Bon Pour Accord (BPA) signé afin de finaliser cette réservation.

Cordialement,
L'équipe Busmoov`

  return `mailto:${encodeURIComponent(transporteurEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// Génère les données d'email pour la validation de commande fournisseur
// VERSION SYNCHRONE (fallback) - utilisé si le template n'est pas chargé
export function generateValidationFournisseurEmail(params: ValidationFournisseurParams): { to: string; subject: string; body: string } {
  const {
    transporteurEmail,
    dossierReference,
    departureCity,
    arrivalCity,
    departureDate,
    departureTime,
    returnDate,
    returnTime,
    passengers,
    prixAchat,
    serviceType,
    nbCars,
    nbChauffeurs,
    demandeId,
    validationToken,
  } = params

  // Formater les dates
  const formatDateSimple = (date: string | Date | null | undefined): string => {
    if (!date) return ''
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'EEEE d MMMM yyyy', { locale: fr })
  }

  // Déterminer le type de trajet
  const getServiceTypeLabel = (type: string | null | undefined): string => {
    if (type === 'aller_simple') return 'Aller simple'
    if (type === 'aller_retour') return 'Aller-Retour'
    if (type === 'circuit' || type === 'mise_disposition' || type === 'ar_mad') return 'Mise à disposition'
    return returnDate ? 'Aller-Retour' : 'Aller simple'
  }

  const isMiseADispo = serviceType === 'circuit' || serviceType === 'mise_disposition' || serviceType === 'ar_mad'

  const subject = `Confirmation de commande - ${dossierReference}`

  let body = `Bonjour,

Suite à votre proposition, nous vous confirmons la réservation suivante :

Référence dossier : ${dossierReference}
Type de prestation : ${getServiceTypeLabel(serviceType)}
`

  if (departureCity || arrivalCity) {
    body += `Trajet : ${departureCity || ''} → ${arrivalCity || ''}\n`
  }

  if (departureDate) {
    const dateLabel = isMiseADispo ? 'Date début' : 'Date aller'
    body += `${dateLabel} : ${formatDateSimple(departureDate)}${departureTime ? ` à ${departureTime}` : ''}\n`
  }

  if (returnDate) {
    const dateLabel = isMiseADispo ? 'Date fin' : 'Date retour'
    body += `${dateLabel} : ${formatDateSimple(returnDate)}${returnTime ? ` à ${returnTime}` : ''}\n`
  }

  if (passengers) {
    body += `Nombre de passagers : ${passengers}\n`
  }

  if (nbCars && nbCars > 0) {
    body += `Nombre de véhicules : ${nbCars}\n`
  }

  if (nbChauffeurs && nbChauffeurs > 0) {
    body += `Nombre de chauffeurs : ${nbChauffeurs}\n`
  }

  if (prixAchat) {
    const prixTTC = prixAchat * 1.1
    body += `\nMontant convenu : ${prixTTC.toFixed(2).replace('.', ',')} EUR TTC\n`
  }

  // Ajouter le lien de validation si disponible
  if (demandeId && validationToken) {
    const baseUrl = getSiteBaseUrl() // jamais l'origin brut : localhost en dev partirait dans l'email
    const validationUrl = `${baseUrl}/validation-bpa?demande=${demandeId}&token=${validationToken}`
    body += `

Pour valider cette commande, cliquez sur le lien suivant :
${validationUrl}

Ce lien vous permet de confirmer la commande en un clic, sans avoir à nous renvoyer de document.
`
  } else {
    body += `
Merci de nous retourner le Bon Pour Accord (BPA) signé afin de finaliser cette réservation.
`
  }

  body += `
Cordialement,
L'équipe Busmoov`

  return { to: transporteurEmail, subject, body }
}

// Traductions pour les templates d'email fournisseurs
export const TEMPLATE_TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    // Demande de disponibilité
    availabilityRequest: 'Demande de disponibilité',
    hello: 'Bonjour',
    availabilityRequestIntro: 'Pouvez-vous me faire une proposition pour la prestation suivante :',
    reference: 'Référence',
    route: 'Trajet',
    departureDate: 'Date départ',
    returnDate: 'Date retour',
    passengers: 'Passagers',
    serviceType: 'Type de service',
    pleaseSendQuote: 'Merci de me faire parvenir votre meilleur tarif.',
    submitProposal: 'Soumettre une proposition',
    bestRegards: 'Cordialement',
    theTeam: "L'équipe Busmoov",
    at: 'à',
    // Confirmation de commande (validation fournisseur)
    orderConfirmation: 'Confirmation de commande',
    orderConfirmationIntro: 'Suite à votre proposition, nous vous confirmons la réservation suivante :',
    duration: 'Durée',
    days: 'jour(s)',
    madDetail: 'Détail mise à disposition',
    numberOfVehicles: 'Nombre de véhicules',
    numberOfDrivers: 'Nombre de chauffeurs',
    agreedAmount: 'Montant convenu',
    validateOrder: 'Valider la commande',
    validationLinkIntro: 'Pour valider cette commande, cliquez sur le lien suivant :',
    validationLinkNote: 'Ce lien vous permet de confirmer la commande en un clic, sans avoir à nous renvoyer de document.',
    returnBpaRequest: 'Merci de nous retourner le Bon Pour Accord (BPA) signé afin de finaliser cette réservation.',
  },
  de: {
    // Verfügbarkeitsanfrage
    availabilityRequest: 'Verfügbarkeitsanfrage',
    hello: 'Guten Tag',
    availabilityRequestIntro: 'Können Sie uns ein Angebot für folgende Leistung unterbreiten:',
    reference: 'Referenz',
    route: 'Strecke',
    departureDate: 'Abfahrtsdatum',
    returnDate: 'Rückfahrtsdatum',
    passengers: 'Passagiere',
    serviceType: 'Serviceart',
    pleaseSendQuote: 'Bitte senden Sie uns Ihr bestes Angebot.',
    submitProposal: 'Angebot abgeben',
    bestRegards: 'Mit freundlichen Grüßen',
    theTeam: 'Das Busmoov Team',
    at: 'um',
    // Bestellbestätigung (Lieferantenvalidierung)
    orderConfirmation: 'Bestellbestätigung',
    orderConfirmationIntro: 'Nach Ihrem Angebot bestätigen wir Ihnen folgende Buchung:',
    duration: 'Dauer',
    days: 'Tag(e)',
    madDetail: 'Dispositionsdetails',
    numberOfVehicles: 'Anzahl Fahrzeuge',
    numberOfDrivers: 'Anzahl Fahrer',
    agreedAmount: 'Vereinbarter Betrag',
    validateOrder: 'Bestellung bestätigen',
    validationLinkIntro: 'Um diese Bestellung zu bestätigen, klicken Sie auf den folgenden Link:',
    validationLinkNote: 'Mit diesem Link können Sie die Bestellung mit einem Klick bestätigen, ohne uns Dokumente zurücksenden zu müssen.',
    returnBpaRequest: 'Bitte senden Sie uns die unterschriebene Auftragsbestätigung zurück, um diese Reservierung abzuschließen.',
  },
  es: {
    // Solicitud de disponibilidad
    availabilityRequest: 'Solicitud de disponibilidad',
    hello: 'Buenos días',
    availabilityRequestIntro: '¿Podría hacernos una propuesta para el siguiente servicio?',
    reference: 'Referencia',
    route: 'Trayecto',
    departureDate: 'Fecha de salida',
    returnDate: 'Fecha de regreso',
    passengers: 'Pasajeros',
    serviceType: 'Tipo de servicio',
    pleaseSendQuote: 'Por favor, envíenos su mejor tarifa.',
    submitProposal: 'Enviar propuesta',
    bestRegards: 'Atentamente',
    theTeam: 'El equipo de Busmoov',
    at: 'a las',
    // Confirmación de pedido (validación proveedor)
    orderConfirmation: 'Confirmación de pedido',
    orderConfirmationIntro: 'Tras su propuesta, le confirmamos la siguiente reserva:',
    duration: 'Duración',
    days: 'día(s)',
    madDetail: 'Detalle de disposición',
    numberOfVehicles: 'Número de vehículos',
    numberOfDrivers: 'Número de conductores',
    agreedAmount: 'Importe acordado',
    validateOrder: 'Validar pedido',
    validationLinkIntro: 'Para validar este pedido, haga clic en el siguiente enlace:',
    validationLinkNote: 'Este enlace le permite confirmar el pedido con un clic, sin necesidad de enviarnos documentos.',
    returnBpaRequest: 'Por favor, envíenos el Acuerdo de Reserva firmado para finalizar esta reserva.',
  },
  en: {
    // Availability request
    availabilityRequest: 'Availability Request',
    hello: 'Hello',
    availabilityRequestIntro: 'Could you please provide a quote for the following service:',
    reference: 'Reference',
    route: 'Route',
    departureDate: 'Departure date',
    returnDate: 'Return date',
    passengers: 'Passengers',
    serviceType: 'Service type',
    pleaseSendQuote: 'Please send us your best quote.',
    submitProposal: 'Submit proposal',
    bestRegards: 'Best regards',
    theTeam: 'The Busmoov Team',
    at: 'at',
    // Order confirmation (supplier validation)
    orderConfirmation: 'Order Confirmation',
    orderConfirmationIntro: 'Following your proposal, we confirm the following booking:',
    duration: 'Duration',
    days: 'day(s)',
    madDetail: 'Disposition details',
    numberOfVehicles: 'Number of vehicles',
    numberOfDrivers: 'Number of drivers',
    agreedAmount: 'Agreed amount',
    validateOrder: 'Validate order',
    validationLinkIntro: 'To validate this order, click on the following link:',
    validationLinkNote: 'This link allows you to confirm the order in one click, without having to send us any documents.',
    returnBpaRequest: 'Please return the signed Purchase Order Agreement to finalize this reservation.',
  },
}

// Fonction pour substituer les variables dans un template
function substituteTemplateVariables(
  template: string,
  variables: Record<string, string | number | null | undefined>,
  language: string = 'fr'
): string {
  // Normaliser les fins de ligne (Windows CRLF -> LF)
  let result = template.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // 1. Gérer les traductions {{t:key}} AVANT les conditionnels
  const translations = TEMPLATE_TRANSLATIONS[language] || TEMPLATE_TRANSLATIONS['fr']
  result = result.replace(/{{t:(\w+)}}/g, (_match, key) => {
    return translations[key] || key
  })

  // 2. Gestion des conditionnels {{#if variable}}...{{else}}...{{/if}} (avec else optionnel)
  // On doit traiter les conditionnels AVANT les variables simples pour éviter les conflits
  // Utiliser une boucle pour gérer les conditionnels imbriqués (du plus interne au plus externe)
  let previousResult = ''
  let iterations = 0
  const maxIterations = 10 // Protection contre les boucles infinies

  while (previousResult !== result && iterations < maxIterations) {
    previousResult = result
    iterations++

    // Pattern pour {{#if var}}content{{else}}altContent{{/if}}
    result = result.replace(
      /{{#if\s+(\w+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g,
      (_match, varName, ifContent, elseContent) => {
        const value = variables[varName]
        if (value != null && value !== '') {
          return ifContent
        }
        return elseContent
      }
    )

    // Pattern pour {{#if var}}content{{/if}} (sans else)
    result = result.replace(
      /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g,
      (_match, varName, content) => {
        const value = variables[varName]
        if (value != null && value !== '') {
          return content
        }
        return ''
      }
    )
  }

  // 3. Substitution des variables simples {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value != null ? String(value) : '')
  }

  // Nettoyer les lignes vides multiples résultant des conditionnels supprimés
  result = result.replace(/\n{3,}/g, '\n\n')

  return result.trim()
}

// VERSION ASYNCHRONE - charge le template depuis la base de données
export async function generateValidationFournisseurEmailFromTemplate(
  params: ValidationFournisseurParams
): Promise<{ to: string; subject: string; body: string; html?: string }> {
  const {
    transporteurEmail,
    transporteurName,
    transporteurCountryCode,
    dossierReference,
    departureCity,
    arrivalCity,
    departureDate,
    returnDate,
    departureTime,
    returnTime,
    passengers,
    prixAchat,
    serviceType,
    nbCars,
    nbChauffeurs,
    detailMad,
    dureeJours,
    amplitude,
    demandeId,
    validationToken,
  } = params

  // Déterminer la langue du transporteur
  const language = getLanguageFromCountry(transporteurCountryCode)

  // Locale pour le formatage des dates selon la langue
  const dateLocales: Record<string, typeof fr> = { fr, es, de, en: enGB }
  const dateLocale = dateLocales[language] || fr

  // Formater les dates dans la langue du transporteur
  const formatDateSimple = (date: string | Date | null | undefined): string => {
    if (!date) return ''
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'EEEE d MMMM yyyy', { locale: dateLocale })
  }

  // Labels traduits pour le type de prestation
  const serviceTypeLabels: Record<string, Record<string, string>> = {
    fr: { aller_simple: 'Aller simple', aller_retour: 'Aller-Retour', mad: 'Mise à disposition' },
    de: { aller_simple: 'Einfache Fahrt', aller_retour: 'Hin- und Rückfahrt', mad: 'Disposition' },
    es: { aller_simple: 'Solo ida', aller_retour: 'Ida y vuelta', mad: 'Disposición' },
    en: { aller_simple: 'One way', aller_retour: 'Round trip', mad: 'Disposition' },
  }

  // Déterminer le type de prestation avec traduction
  const getServiceTypeLabel = (type: string | null | undefined): string => {
    const labels = serviceTypeLabels[language] || serviceTypeLabels['fr']
    if (type === 'aller_simple') return labels.aller_simple
    if (type === 'aller_retour') return labels.aller_retour
    if (type === 'circuit' || type === 'mise_disposition' || type === 'ar_mad') return labels.mad
    return returnDate ? labels.aller_retour : labels.aller_simple
  }

  const isMiseADispo = serviceType === 'circuit' || serviceType === 'mise_disposition' || serviceType === 'ar_mad'

  // Générer le lien de validation
  const baseUrl = getSiteBaseUrl() // jamais l'origin brut : localhost en dev partirait dans l'email
  const lienValidation = demandeId && validationToken
    ? `${baseUrl}/validation-bpa?demande=${demandeId}&token=${validationToken}`
    : null

  // Le prix d'achat est le prix fournisseur (déjà en TTC)
  const prixAchatFormate = prixAchat ? prixAchat.toFixed(2).replace('.', ',') : null

  // Labels dynamiques selon le type de trajet (traduits)
  const dateLabels: Record<string, { depart: string; retour: string; debut: string; fin: string }> = {
    fr: { depart: 'Date aller', retour: 'Date retour', debut: 'Date début', fin: 'Date fin' },
    de: { depart: 'Hinfahrtsdatum', retour: 'Rückfahrtsdatum', debut: 'Startdatum', fin: 'Enddatum' },
    es: { depart: 'Fecha de ida', retour: 'Fecha de vuelta', debut: 'Fecha de inicio', fin: 'Fecha de fin' },
    en: { depart: 'Outbound date', retour: 'Return date', debut: 'Start date', fin: 'End date' },
  }
  const labels = dateLabels[language] || dateLabels['fr']
  const labelDateDepart = isMiseADispo ? labels.debut : labels.depart
  const labelDateRetour = isMiseADispo ? labels.fin : labels.retour

  // Variables pour le template - toutes les infos disponibles
  const variables: Record<string, string | number | null | undefined> = {
    reference: dossierReference,
    type_prestation: getServiceTypeLabel(serviceType),
    is_mad: isMiseADispo ? 'true' : null,
    label_date_depart: labelDateDepart,
    label_date_retour: labelDateRetour,
    departure: departureCity,
    arrival: arrivalCity,
    departure_date: formatDateSimple(departureDate),
    return_date: returnDate ? formatDateSimple(returnDate) : null,
    heure_depart: departureTime,
    heure_retour: returnTime,
    passengers: passengers,
    nb_cars: nbCars,
    nb_chauffeurs: nbChauffeurs,
    detail_mad: detailMad,
    duree_jours: dureeJours,
    amplitude: amplitude,
    prix_achat: prixAchatFormate,
    lien_validation: lienValidation,
    transporteur_name: transporteurName,
  }

  try {
    // Charger le template depuis la base de données
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: template } = await (supabase as any)
      .from('email_templates')
      .select('subject, body, html_content')
      .eq('key', 'demande_fournisseur')
      .eq('is_active', true)
      .single()

    if (template) {
      const subject = substituteTemplateVariables(template.subject || '', variables, language)
      const body = substituteTemplateVariables(template.body || '', variables, language)
      const html = template.html_content
        ? substituteTemplateVariables(template.html_content, variables, language)
        : undefined

      return { to: transporteurEmail, subject, body, html }
    }
  } catch (error) {
    console.warn('Template demande_fournisseur non trouvé, utilisation du fallback:', error)
  }

  // Fallback sur la version en dur si le template n'existe pas
  return generateValidationFournisseurEmail(params)
}

// Génère un token de validation unique (cryptographiquement sûr).
// Ce token est la SEULE protection des pages fournisseur (validation BPA,
// infos chauffeur) : Math.random() est predictible et permettait d'enumerer
// les liens. 32 octets d'entropie, rendus en 64 caracteres hexadecimaux.
export function generateValidationToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// ============================================
// EXTRACTION DES DÉTAILS MAD/CIRCUIT
// ============================================

export function extractMadDetails(specialRequests: string | null | undefined): string | null {
  if (!specialRequests) return null
  const madMatch = specialRequests.match(/=== DÉTAIL MISE À DISPOSITION ===\n([\s\S]*?)\n==============================/)
  if (madMatch) {
    return madMatch[1].trim()
  }
  return null
}

// ============================================
// DEMANDE DE PRIX FOURNISSEUR
// ============================================

export interface DemandePrixParams {
  transporteurEmail: string
  transporteurName?: string
  dossierReference: string
  departureCity?: string | null
  arrivalCity?: string | null
  departureDate?: string | Date | null
  returnDate?: string | Date | null
  departureTime?: string | null
  returnTime?: string | null
  tripMode?: string | null
  passengers?: number | null
  vehicleType?: string | null
  departureAddress?: string | null
  arrivalAddress?: string | null
  specialRequests?: string | null
  luggageType?: string | null
  madDetails?: string | null
  language?: string // Code langue: 'fr', 'de', 'es', 'en'
}

// Traductions pour les emails de demande de prix aux fournisseurs
const DEMANDE_PRIX_TRANSLATIONS: Record<string, Record<string, string>> = {
  fr: {
    greeting: 'Bonjour',
    requestIntro: 'Pouvez-vous me faire une proposition pour la prestation suivante :',
    route: 'Trajet',
    departureDate: 'Date départ',
    returnDate: 'Date retour',
    type: 'Type',
    passengers: 'Passagers',
    numberOfBuses: 'Nombre de cars',
    vehicleType: 'Type de véhicule',
    departureAddress: 'Adresse départ',
    arrivalAddress: 'Adresse arrivée',
    luggage: 'Bagages',
    madSection: 'MISE À DISPOSITION',
    remarks: 'Remarques',
    closingRequest: 'Merci de me faire parvenir votre meilleur tarif.',
    closing: 'Cordialement,',
    signature: "L'équipe Busmoov",
    subject: 'Demande de disponibilité',
    at: 'à',
    // Trip modes
    oneWay: 'Aller simple',
    roundTrip: 'Aller-Retour',
    roundTrip1Day: 'Aller-Retour 1 jour',
    roundTripNoMad: 'Aller-Retour sans mise à disposition',
    roundTripWithMad: 'Aller-Retour avec mise à disposition',
    circuit: 'Circuit',
    disposal: 'Mise à disposition',
  },
  de: {
    greeting: 'Guten Tag',
    requestIntro: 'Können Sie uns ein Angebot für folgende Leistung unterbreiten:',
    route: 'Strecke',
    departureDate: 'Abfahrtsdatum',
    returnDate: 'Rückfahrtsdatum',
    type: 'Art',
    passengers: 'Passagiere',
    numberOfBuses: 'Anzahl Busse',
    vehicleType: 'Fahrzeugtyp',
    departureAddress: 'Abfahrtsadresse',
    arrivalAddress: 'Ankunftsadresse',
    luggage: 'Gepäck',
    madSection: 'DISPOSITION',
    remarks: 'Bemerkungen',
    closingRequest: 'Bitte senden Sie uns Ihr bestes Angebot.',
    closing: 'Mit freundlichen Grüßen,',
    signature: 'Das Busmoov Team',
    subject: 'Verfügbarkeitsanfrage',
    at: 'um',
    // Trip modes
    oneWay: 'Einfache Fahrt',
    roundTrip: 'Hin- und Rückfahrt',
    roundTrip1Day: 'Hin- und Rückfahrt (1 Tag)',
    roundTripNoMad: 'Hin- und Rückfahrt ohne Disposition',
    roundTripWithMad: 'Hin- und Rückfahrt mit Disposition',
    circuit: 'Rundfahrt',
    disposal: 'Disposition',
  },
  es: {
    greeting: 'Buenos días',
    requestIntro: '¿Podría hacernos una propuesta para el siguiente servicio?',
    route: 'Trayecto',
    departureDate: 'Fecha de salida',
    returnDate: 'Fecha de regreso',
    type: 'Tipo',
    passengers: 'Pasajeros',
    numberOfBuses: 'Número de autocares',
    vehicleType: 'Tipo de vehículo',
    departureAddress: 'Dirección de salida',
    arrivalAddress: 'Dirección de llegada',
    luggage: 'Equipaje',
    madSection: 'DISPOSICIÓN',
    remarks: 'Observaciones',
    closingRequest: 'Por favor, envíenos su mejor tarifa.',
    closing: 'Atentamente,',
    signature: 'El equipo de Busmoov',
    subject: 'Solicitud de disponibilidad',
    at: 'a las',
    // Trip modes
    oneWay: 'Solo ida',
    roundTrip: 'Ida y vuelta',
    roundTrip1Day: 'Ida y vuelta (1 día)',
    roundTripNoMad: 'Ida y vuelta sin disposición',
    roundTripWithMad: 'Ida y vuelta con disposición',
    circuit: 'Circuito',
    disposal: 'Disposición',
  },
  en: {
    greeting: 'Hello',
    requestIntro: 'Could you please provide a quote for the following service:',
    route: 'Route',
    departureDate: 'Departure date',
    returnDate: 'Return date',
    type: 'Type',
    passengers: 'Passengers',
    numberOfBuses: 'Number of coaches',
    vehicleType: 'Vehicle type',
    departureAddress: 'Departure address',
    arrivalAddress: 'Arrival address',
    luggage: 'Luggage',
    madSection: 'DISPOSAL',
    remarks: 'Remarks',
    closingRequest: 'Please send us your best rate.',
    closing: 'Best regards,',
    signature: 'The Busmoov Team',
    subject: 'Availability request',
    at: 'at',
    // Trip modes
    oneWay: 'One way',
    roundTrip: 'Round trip',
    roundTrip1Day: 'Round trip (1 day)',
    roundTripNoMad: 'Round trip without disposal',
    roundTripWithMad: 'Round trip with disposal',
    circuit: 'Circuit',
    disposal: 'Disposal',
  },
}

// Helper pour obtenir les traductions de demande prix
function getDemandePrixTranslations(lang: string): Record<string, string> {
  return DEMANDE_PRIX_TRANSLATIONS[lang] || DEMANDE_PRIX_TRANSLATIONS['fr']
}

// Formater une date selon la langue
function formatDateForLanguage(date: string | Date | null | undefined, lang: string): string {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date

  // Utiliser toLocaleDateString pour le formatage localisé
  const localeMap: Record<string, string> = {
    'fr': 'fr-FR',
    'de': 'de-DE',
    'es': 'es-ES',
    'en': 'en-GB',
  }
  const locale = localeMap[lang] || 'fr-FR'

  return d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

// Obtenir le label du mode de trajet selon la langue (pour emails fournisseurs)
function getTripModeLabelForEmail(tripMode: string, lang: string): string {
  const t = getDemandePrixTranslations(lang)

  const tripModeMapping: Record<string, string> = {
    'aller-simple': 'oneWay',
    'aller_simple': 'oneWay',
    'one-way': 'oneWay',
    'aller-retour': 'roundTrip',
    'aller_retour': 'roundTrip',
    'round-trip': 'roundTrip',
    'mise-a-dispo': 'disposal',
    'mise_a_dispo': 'disposal',
    'circuit': 'circuit',
    'Aller simple': 'oneWay',
    'Aller-Retour 1 jour': 'roundTrip1Day',
    'Aller-Retour sans mise à disposition': 'roundTripNoMad',
    'Aller-Retour avec mise à disposition': 'roundTripWithMad',
  }

  const translationKey = tripModeMapping[tripMode]
  return translationKey ? t[translationKey] : tripMode
}

// VERSION SYNCHRONE (fallback) - utilisé si le template n'est pas chargé
export function generateDemandePrixEmail(params: DemandePrixParams): { to: string; subject: string; body: string } {
  const {
    transporteurEmail,
    dossierReference,
    departureCity,
    arrivalCity,
    departureDate,
    returnDate,
    departureTime,
    returnTime,
    tripMode,
    passengers,
    vehicleType,
    departureAddress,
    arrivalAddress,
    specialRequests,
    luggageType,
    madDetails,
    language = 'fr',
  } = params

  const t = getDemandePrixTranslations(language)

  const subject = `${t.subject} - ${dossierReference}`

  let body = `${t.greeting},

${t.requestIntro}

${t.route} : ${departureCity || ''} - ${arrivalCity || ''}
${t.departureDate} : ${formatDateForLanguage(departureDate, language)}${departureTime ? ` ${t.at} ${departureTime}` : ''}
`

  if (returnDate) {
    body += `${t.returnDate} : ${formatDateForLanguage(returnDate, language)}${returnTime ? ` ${t.at} ${returnTime}` : ''}\n`
  }

  if (tripMode) {
    body += `${t.type} : ${getTripModeLabelForEmail(tripMode, language)}\n`
  }

  if (passengers) {
    body += `${t.passengers} : ${passengers}\n`
    // Calculer le nombre de cars
    const nbCars = calculateNumberOfCars(passengers, vehicleType || 'standard')
    body += `${t.numberOfBuses} : ${nbCars}\n`
  }

  if (vehicleType) {
    body += `${t.vehicleType} : ${getVehicleTypeLabel(vehicleType)}\n`
  }

  if (departureAddress) {
    body += `\n${t.departureAddress} : ${departureAddress}\n`
  }

  if (arrivalAddress) {
    body += `${t.arrivalAddress} : ${arrivalAddress}\n`
  }

  if (luggageType) {
    body += `\n${t.luggage} : ${luggageType}\n`
  }

  // Détails de mise à disposition (MAD)
  if (madDetails) {
    body += `\n=== ${t.madSection} ===\n${madDetails}\n==========================\n`
  }

  if (specialRequests) {
    body += `\n${t.remarks} : ${specialRequests}\n`
  }

  body += `
${t.closingRequest}

${t.closing}
${t.signature}`

  return { to: transporteurEmail, subject, body }
}

// VERSION ASYNCHRONE - charge le template depuis la base de données
export async function generateDemandePrixEmailFromTemplate(
  params: DemandePrixParams
): Promise<{ to: string; subject: string; body: string; html?: string }> {
  const {
    transporteurEmail,
    transporteurName,
    dossierReference,
    departureCity,
    arrivalCity,
    departureDate,
    returnDate,
    departureTime,
    returnTime,
    tripMode,
    passengers,
    vehicleType,
    departureAddress,
    arrivalAddress,
    specialRequests,
    luggageType,
    madDetails,
    language = 'fr',
  } = params

  const t = getDemandePrixTranslations(language)

  // Calculer le nombre de cars
  const nbCars = passengers ? calculateNumberOfCars(passengers, vehicleType || 'standard') : 1

  // Variables pour le template (avec traductions)
  const variables: Record<string, string | number | null | undefined> = {
    reference: dossierReference,
    departure: departureCity,
    arrival: arrivalCity,
    departure_date: formatDateForLanguage(departureDate, language),
    return_date: returnDate ? formatDateForLanguage(returnDate, language) : null,
    heure_depart: departureTime,
    heure_retour: returnTime,
    trip_mode: tripMode ? getTripModeLabelForEmail(tripMode, language) : null,
    passengers: passengers,
    nombre_cars: nbCars,
    vehicle_type: vehicleType ? getVehicleTypeLabel(vehicleType) : null,
    departure_address: departureAddress,
    arrival_address: arrivalAddress,
    special_requests: specialRequests,
    transporteur_name: transporteurName,
    luggage_type: luggageType,
    mad_details: madDetails,
    // Labels traduits pour le template HTML
    label_route: t.route,
    label_departure_date: t.departureDate,
    label_return_date: t.returnDate,
    label_type: t.type,
    label_passengers: t.passengers,
    label_nb_cars: t.numberOfBuses,
    label_vehicle_type: t.vehicleType,
    label_departure_address: t.departureAddress,
    label_arrival_address: t.arrivalAddress,
    label_luggage: t.luggage,
    label_remarks: t.remarks,
    at: t.at,
  }

  try {
    // Charger le template depuis la base de données
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: template } = await (supabase as any)
      .from('email_templates')
      .select('subject, body, html_content')
      .eq('key', 'demande_prix_fournisseur')
      .eq('is_active', true)
      .single()

    if (template) {
      const subject = substituteTemplateVariables(template.subject || '', variables, language)
      const body = substituteTemplateVariables(template.body || '', variables, language)
      const html = template.html_content
        ? substituteTemplateVariables(template.html_content, variables, language)
        : undefined

      return { to: transporteurEmail, subject, body, html }
    }
  } catch (error) {
    console.warn('Template demande_prix_fournisseur non trouvé, utilisation du fallback:', error)
  }

  // Fallback sur la version en dur si le template n'existe pas
  return generateDemandePrixEmail(params)
}

// ============================================
// Estimation de distance entre villes
// ============================================

// Coordonnées GPS des principales villes françaises
const VILLES_COORDS: Record<string, { lat: number; lng: number }> = {
  // Grandes métropoles
  'paris': { lat: 48.8566, lng: 2.3522 },
  'marseille': { lat: 43.2965, lng: 5.3698 },
  'lyon': { lat: 45.7640, lng: 4.8357 },
  'toulouse': { lat: 43.6047, lng: 1.4442 },
  'nice': { lat: 43.7102, lng: 7.2620 },
  'nantes': { lat: 47.2184, lng: -1.5536 },
  'montpellier': { lat: 43.6108, lng: 3.8767 },
  'strasbourg': { lat: 48.5734, lng: 7.7521 },
  'bordeaux': { lat: 44.8378, lng: -0.5792 },
  'lille': { lat: 50.6292, lng: 3.0573 },
  'rennes': { lat: 48.1173, lng: -1.6778 },
  'reims': { lat: 49.2583, lng: 4.0317 },
  'saint-etienne': { lat: 45.4397, lng: 4.3872 },
  'le havre': { lat: 49.4944, lng: 0.1079 },
  'toulon': { lat: 43.1242, lng: 5.9280 },
  'grenoble': { lat: 45.1885, lng: 5.7245 },
  'dijon': { lat: 47.3220, lng: 5.0415 },
  'angers': { lat: 47.4784, lng: -0.5632 },
  'nimes': { lat: 43.8367, lng: 4.3601 },
  'aix-en-provence': { lat: 43.5297, lng: 5.4474 },
  'clermont-ferrand': { lat: 45.7772, lng: 3.0870 },
  'le mans': { lat: 48.0061, lng: 0.1996 },
  'brest': { lat: 48.3904, lng: -4.4861 },
  'tours': { lat: 47.3941, lng: 0.6848 },
  'amiens': { lat: 49.8941, lng: 2.2958 },
  'limoges': { lat: 45.8336, lng: 1.2611 },
  'perpignan': { lat: 42.6986, lng: 2.8954 },
  'metz': { lat: 49.1193, lng: 6.1757 },
  'besancon': { lat: 47.2380, lng: 6.0243 },
  'orleans': { lat: 47.9029, lng: 1.9092 },
  'mulhouse': { lat: 47.7508, lng: 7.3359 },
  'rouen': { lat: 49.4432, lng: 1.0993 },
  'caen': { lat: 49.1829, lng: -0.3707 },
  'nancy': { lat: 48.6921, lng: 6.1844 },
  'argenteuil': { lat: 48.9472, lng: 2.2467 },
  'saint-denis': { lat: 48.9362, lng: 2.3574 },
  'roubaix': { lat: 50.6942, lng: 3.1746 },
  'tourcoing': { lat: 50.7240, lng: 3.1612 },
  'avignon': { lat: 43.9493, lng: 4.8055 },
  'poitiers': { lat: 46.5802, lng: 0.3404 },
  'pau': { lat: 43.2951, lng: -0.3708 },
  'calais': { lat: 50.9481, lng: 1.8564 },
  'dunkerque': { lat: 51.0343, lng: 2.3768 },
  'la rochelle': { lat: 46.1603, lng: -1.1511 },
  'valence': { lat: 44.9334, lng: 4.8924 },
  'troyes': { lat: 48.2973, lng: 4.0744 },
  'cannes': { lat: 43.5528, lng: 7.0174 },
  'saint-malo': { lat: 48.6493, lng: -1.9890 },
  'annecy': { lat: 45.8992, lng: 6.1294 },
  'chambery': { lat: 45.5646, lng: 5.9178 },
  'ajaccio': { lat: 41.9192, lng: 8.7386 },
  'bastia': { lat: 42.6973, lng: 9.4509 },
  'lorient': { lat: 47.7485, lng: -3.3670 },
  'quimper': { lat: 47.9960, lng: -4.0999 },
  'vannes': { lat: 47.6586, lng: -2.7599 },
  'bayonne': { lat: 43.4929, lng: -1.4748 },
  'biarritz': { lat: 43.4832, lng: -1.5586 },
  'angouleme': { lat: 45.6500, lng: 0.1500 },
  'niort': { lat: 46.3239, lng: -0.4600 },
  'bourges': { lat: 47.0810, lng: 2.3988 },
  'auxerre': { lat: 47.7986, lng: 3.5673 },
  'chartres': { lat: 48.4438, lng: 1.4892 },
  'laval': { lat: 48.0784, lng: -0.7669 },
  'rodez': { lat: 44.3500, lng: 2.5750 },
  'albi': { lat: 43.9292, lng: 2.1480 },
  'carcassonne': { lat: 43.2130, lng: 2.3491 },
  'beziers': { lat: 43.3442, lng: 3.2150 },
  'sete': { lat: 43.4036, lng: 3.6972 },
  'arles': { lat: 43.6766, lng: 4.6277 },
  'frejus': { lat: 43.4330, lng: 6.7370 },
  'antibes': { lat: 43.5808, lng: 7.1239 },
  'monaco': { lat: 43.7384, lng: 7.4246 },
  'menton': { lat: 43.7747, lng: 7.4972 },
  'colmar': { lat: 48.0794, lng: 7.3558 },
  'epinal': { lat: 48.1724, lng: 6.4508 },
  'cherbourg': { lat: 49.6337, lng: -1.6222 },
  'saint-brieuc': { lat: 48.5141, lng: -2.7600 },
  'lannion': { lat: 48.7323, lng: -3.4597 },
  'morlaix': { lat: 48.5777, lng: -3.8270 },
  'saint-nazaire': { lat: 47.2733, lng: -2.2139 },
  'cholet': { lat: 47.0600, lng: -0.8800 },
  'saumur': { lat: 47.2600, lng: -0.0800 },
  'blois': { lat: 47.5861, lng: 1.3359 },
  'vichy': { lat: 46.1167, lng: 3.4167 },
  'montlucon': { lat: 46.3400, lng: 2.6000 },
  'moulins': { lat: 46.5667, lng: 3.3333 },
  'aurillac': { lat: 44.9333, lng: 2.4333 },
  'le puy-en-velay': { lat: 45.0428, lng: 3.8853 },
  'saint-flour': { lat: 45.0333, lng: 3.1000 },
  'tarbes': { lat: 43.2333, lng: 0.0833 },
  'lourdes': { lat: 43.0942, lng: -0.0461 },
  'agen': { lat: 44.2033, lng: 0.6167 },
  'cahors': { lat: 44.4500, lng: 1.4333 },
  'montauban': { lat: 44.0167, lng: 1.3500 },
  'auch': { lat: 43.6450, lng: 0.5850 },
  'dax': { lat: 43.7100, lng: -1.0500 },
  'mont-de-marsan': { lat: 43.8900, lng: -0.5000 },
  'perigueux': { lat: 45.1833, lng: 0.7167 },
  'bergerac': { lat: 44.8500, lng: 0.4833 },
  'brive-la-gaillarde': { lat: 45.1500, lng: 1.5333 },
  'tulle': { lat: 45.2667, lng: 1.7667 },
  'gueret': { lat: 46.1667, lng: 1.8667 },
  'chateauroux': { lat: 46.8103, lng: 1.6906 },
  'nevers': { lat: 46.9897, lng: 3.1592 },
  'macon': { lat: 46.3061, lng: 4.8283 },
  'chalon-sur-saone': { lat: 46.7803, lng: 4.8569 },
  'bourg-en-bresse': { lat: 46.2056, lng: 5.2256 },
  'belfort': { lat: 47.6400, lng: 6.8600 },
  'lons-le-saunier': { lat: 46.6750, lng: 5.5528 },
  'vesoul': { lat: 47.6192, lng: 6.1539 },
  'bar-le-duc': { lat: 48.7736, lng: 5.1606 },
  'verdun': { lat: 49.1600, lng: 5.3800 },
  'charleville-mezieres': { lat: 49.7619, lng: 4.7167 },
  'sedan': { lat: 49.7019, lng: 4.9400 },
  'saint-quentin': { lat: 49.8486, lng: 3.2875 },
  'laon': { lat: 49.5639, lng: 3.6244 },
  'soissons': { lat: 49.3817, lng: 3.3239 },
  'compiegne': { lat: 49.4175, lng: 2.8261 },
  'beauvais': { lat: 49.4297, lng: 2.0833 },
  'senlis': { lat: 49.2061, lng: 2.5856 },
  'meaux': { lat: 48.9603, lng: 2.8883 },
  'melun': { lat: 48.5394, lng: 2.6553 },
  'fontainebleau': { lat: 48.4042, lng: 2.7028 },
  'provins': { lat: 48.5594, lng: 3.3000 },
  'sens': { lat: 48.1975, lng: 3.2833 },
  'evreux': { lat: 49.0244, lng: 1.1508 },
  'lisieux': { lat: 49.1456, lng: 0.2256 },
  'deauville': { lat: 49.3578, lng: 0.0742 },
  'honfleur': { lat: 49.4181, lng: 0.2331 },
  'alencon': { lat: 48.4333, lng: 0.0833 },
  'flers': { lat: 48.7500, lng: -0.5667 },
  'granville': { lat: 48.8381, lng: -1.5972 },
  'saint-lo': { lat: 49.1147, lng: -1.0869 },
  'coutances': { lat: 49.0306, lng: -1.4433 },
  'avranches': { lat: 48.6858, lng: -1.3567 },
  'dinan': { lat: 48.4550, lng: -2.0519 },
  'saint-cast-le-guildo': { lat: 48.6303, lng: -2.2572 },
  'dinard': { lat: 48.6342, lng: -2.0689 },
  'paimpol': { lat: 48.7803, lng: -3.0428 },
  'carhaix-plouguer': { lat: 48.2758, lng: -3.5722 },
  'douarnenez': { lat: 48.0922, lng: -4.3300 },
  'concarneau': { lat: 47.8753, lng: -3.9139 },
  'pont-aven': { lat: 47.8550, lng: -3.7456 },
  'auray': { lat: 47.6683, lng: -2.9833 },
  'carnac': { lat: 47.5833, lng: -3.0833 },
  'locmariaquer': { lat: 47.5714, lng: -2.9458 },
  'sarzeau': { lat: 47.5261, lng: -2.7689 },
  'guerande': { lat: 47.3275, lng: -2.4281 },
  'pornic': { lat: 47.1139, lng: -2.1017 },
  'noirmoutier-en-l-ile': { lat: 47.0008, lng: -2.2492 },
  'les sables-d-olonne': { lat: 46.4972, lng: -1.7833 },
  'royan': { lat: 45.6200, lng: -1.0300 },
  'rochefort': { lat: 45.9417, lng: -0.9617 },
  'saintes': { lat: 45.7458, lng: -0.6314 },
  'cognac': { lat: 45.6958, lng: -0.3286 },
  'arcachon': { lat: 44.6589, lng: -1.1644 },
  'cap-ferret': { lat: 44.6325, lng: -1.2461 },
  'hossegor': { lat: 43.6689, lng: -1.3997 },
  'capbreton': { lat: 43.6397, lng: -1.4289 },
  'saint-jean-de-luz': { lat: 43.3881, lng: -1.6578 },
  'hendaye': { lat: 43.3608, lng: -1.7733 },
  'foix': { lat: 42.9658, lng: 1.6050 },
  'ax-les-thermes': { lat: 42.7197, lng: 1.8383 },
  'font-romeu-odeillo-via': { lat: 42.5033, lng: 2.0372 },
  'thuir': { lat: 42.6294, lng: 2.7567 },
  'argeles-sur-mer': { lat: 42.5461, lng: 3.0222 },
  'collioure': { lat: 42.5269, lng: 3.0836 },
  'narbonne': { lat: 43.1842, lng: 3.0033 },
  'agde': { lat: 43.3108, lng: 3.4756 },
  'la grande-motte': { lat: 43.5619, lng: 4.0844 },
  'saintes-maries-de-la-mer': { lat: 43.4517, lng: 4.4283 },
  'aigues-mortes': { lat: 43.5667, lng: 4.1931 },
  'uzes': { lat: 44.0128, lng: 4.4203 },
  'orange': { lat: 44.1386, lng: 4.8075 },
  'carpentras': { lat: 44.0550, lng: 5.0486 },
  'apt': { lat: 43.8767, lng: 5.3978 },
  'forcalquier': { lat: 43.9608, lng: 5.7797 },
  'digne-les-bains': { lat: 44.0925, lng: 6.2356 },
  'sisteron': { lat: 44.1972, lng: 5.9422 },
  'gap': { lat: 44.5594, lng: 6.0781 },
  'briancon': { lat: 44.8958, lng: 6.6344 },
  'embrun': { lat: 44.5647, lng: 6.4983 },
  'barcelonnette': { lat: 44.3872, lng: 6.6522 },
  'manosque': { lat: 43.8283, lng: 5.7867 },
  'draguignan': { lat: 43.5375, lng: 6.4647 },
  'brignoles': { lat: 43.4058, lng: 6.0617 },
  'hyeres': { lat: 43.1200, lng: 6.1286 },
  'saint-tropez': { lat: 43.2725, lng: 6.6386 },
  'sainte-maxime': { lat: 43.3086, lng: 6.6383 },
  'grasse': { lat: 43.6589, lng: 6.9231 },
  'vence': { lat: 43.7222, lng: 7.1111 },
  'saint-paul-de-vence': { lat: 43.6964, lng: 7.1211 },
  'cagnes-sur-mer': { lat: 43.6642, lng: 7.1481 },
  'villefranche-sur-mer': { lat: 43.7044, lng: 7.3117 },
  'eze': { lat: 43.7283, lng: 7.3608 },
  'roquebrune-cap-martin': { lat: 43.7603, lng: 7.4669 },
  'albertville': { lat: 45.6753, lng: 6.3928 },
  'megeve': { lat: 45.8569, lng: 6.6178 },
  'chamonix-mont-blanc': { lat: 45.9237, lng: 6.8694 },
  'saint-gervais-les-bains': { lat: 45.8906, lng: 6.7114 },
  'morzine': { lat: 46.1794, lng: 6.7092 },
  'avoriaz': { lat: 46.1906, lng: 6.7744 },
  'les gets': { lat: 46.1572, lng: 6.6703 },
  'thonon-les-bains': { lat: 46.3706, lng: 6.4797 },
  'evian-les-bains': { lat: 46.4008, lng: 6.5906 },
  'aix-les-bains': { lat: 45.6889, lng: 5.9158 },
  'val-d-isere': { lat: 45.4478, lng: 6.9797 },
  'tignes': { lat: 45.4681, lng: 6.9056 },
  'courchevel': { lat: 45.4153, lng: 6.6347 },
  'meribel': { lat: 45.4003, lng: 6.5653 },
  'les arcs': { lat: 45.5714, lng: 6.8317 },
  'la plagne': { lat: 45.5064, lng: 6.7014 },
  'les deux alpes': { lat: 45.0167, lng: 6.1217 },
  'alpe-d-huez': { lat: 45.0889, lng: 6.0686 },
  'villard-de-lans': { lat: 45.0700, lng: 5.5514 },
  'lans-en-vercors': { lat: 45.1267, lng: 5.5828 },
  'correncon-en-vercors': { lat: 45.0306, lng: 5.5231 },
  'autrans-meaudre-en-vercors': { lat: 45.1750, lng: 5.5422 },
  'voiron': { lat: 45.3647, lng: 5.5911 },
  'bourgoin-jallieu': { lat: 45.5856, lng: 5.2739 },
  'vienne': { lat: 45.5256, lng: 4.8758 },
  'villefontaine': { lat: 45.6139, lng: 5.1492 },
  'l-isle-d-abeau': { lat: 45.6217, lng: 5.2253 },
  'villeurbanne': { lat: 45.7667, lng: 4.8800 },
  'venissieux': { lat: 45.6969, lng: 4.8861 },
  'saint-priest': { lat: 45.6958, lng: 4.9417 },
  'bron': { lat: 45.7386, lng: 4.9083 },
  'caluire-et-cuire': { lat: 45.7950, lng: 4.8475 },
  'oullins': { lat: 45.7142, lng: 4.8086 },
  'tassin-la-demi-lune': { lat: 45.7636, lng: 4.7631 },
  'ecully': { lat: 45.7750, lng: 4.7775 },
  'saint-chamond': { lat: 45.4744, lng: 4.5158 },
  'firminy': { lat: 45.3883, lng: 4.2878 },
  'roanne': { lat: 46.0367, lng: 4.0689 },
  'montbrison': { lat: 45.6067, lng: 4.0642 },
  'feurs': { lat: 45.7328, lng: 4.2247 },
  'saint-just-saint-rambert': { lat: 45.5011, lng: 4.2417 },
  'andrezieux-boutheon': { lat: 45.5267, lng: 4.2608 },
  // Aéroports
  'aeroport cdg': { lat: 49.0097, lng: 2.5479 },
  'aeroport charles de gaulle': { lat: 49.0097, lng: 2.5479 },
  'aeroport roissy': { lat: 49.0097, lng: 2.5479 },
  'roissy': { lat: 49.0097, lng: 2.5479 },
  'cdg': { lat: 49.0097, lng: 2.5479 },
  'aeroport orly': { lat: 48.7262, lng: 2.3652 },
  'orly': { lat: 48.7262, lng: 2.3652 },
  'aeroport lyon saint-exupery': { lat: 45.7256, lng: 5.0811 },
  'aeroport nice cote d-azur': { lat: 43.6584, lng: 7.2159 },
  'aeroport marseille provence': { lat: 43.4393, lng: 5.2214 },
  'aeroport toulouse blagnac': { lat: 43.6293, lng: 1.3678 },
  'aeroport bordeaux merignac': { lat: 44.8283, lng: -0.7156 },
  'aeroport nantes atlantique': { lat: 47.1532, lng: -1.6108 },
  'eurodisney': { lat: 48.8673, lng: 2.7836 },
  'disneyland paris': { lat: 48.8673, lng: 2.7836 },
  'parc asterix': { lat: 49.1347, lng: 2.5722 },
  'futuroscope': { lat: 46.6692, lng: 0.3678 },
  'puy du fou': { lat: 46.8922, lng: -0.9275 },
}

// Normalise le nom de ville pour la recherche
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garde lettres, chiffres, espaces et tirets
    .replace(/\s+/g, '-') // Espaces en tirets
    .replace(/-+/g, '-') // Multiple tirets en un seul
    .trim()
}

// Recherche les coordonnées d'une ville (avec correspondance partielle)
function findCityCoords(city: string): { lat: number; lng: number } | null {
  const normalized = normalizeCity(city)

  // Recherche exacte d'abord
  if (VILLES_COORDS[normalized]) {
    return VILLES_COORDS[normalized]
  }

  // Recherche par correspondance partielle
  for (const [villeKey, coords] of Object.entries(VILLES_COORDS)) {
    // La ville recherchée contient le nom de la ville connue
    if (normalized.includes(villeKey) || villeKey.includes(normalized)) {
      return coords
    }
  }

  // Essayer avec juste le premier mot (ex: "Lyon Part Dieu" -> "Lyon")
  const firstWord = normalized.split('-')[0]
  if (firstWord && firstWord.length > 2 && VILLES_COORDS[firstWord]) {
    return VILLES_COORDS[firstWord]
  }

  return null
}

// Calcul de distance à vol d'oiseau (formule de Haversine)
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Estime la distance routière entre deux villes
 * @param departure Ville de départ
 * @param arrival Ville d'arrivée
 * @returns Distance estimée en km (arrondie à 10km), ou null si impossible
 */
export function estimateDistance(departure: string, arrival: string): number | null {
  if (!departure || !arrival) return null

  const coordsDep = findCityCoords(departure)
  const coordsArr = findCityCoords(arrival)

  if (!coordsDep || !coordsArr) return null

  // Distance à vol d'oiseau
  const distanceVolOiseau = haversineDistance(
    coordsDep.lat, coordsDep.lng,
    coordsArr.lat, coordsArr.lng
  )

  // Coefficient de correction pour passer à la distance routière
  // En France, la distance routière est généralement 20-40% plus longue que le vol d'oiseau
  // On prend un coefficient moyen de 1.3
  const coefficientRoute = 1.3

  // Distance routière estimée, arrondie à 10 km
  const distanceRoute = Math.round(distanceVolOiseau * coefficientRoute / 10) * 10

  return distanceRoute
}

/**
 * Vérifie si une ville est connue dans la base
 * @param city Nom de la ville
 * @returns true si la ville est reconnue
 */
export function isCityKnown(city: string): boolean {
  return findCityCoords(city) !== null
}

// ============================================
// Calcul de distance via API Geoapify
// ============================================

// Cache for the API key to avoid repeated DB calls
let cachedGeoapifyKey: string | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get Geoapify API key from database or fallback to env variable
 */
async function getGeoapifyApiKey(): Promise<string> {
  // Check cache first
  if (cachedGeoapifyKey && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedGeoapifyKey
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'geoapify_api_key')
      .single()

    if (data && !error && data.value) {
      const value = data.value as { key?: string }
      if (value.key) {
        cachedGeoapifyKey = value.key
        cacheTimestamp = Date.now()
        return value.key
      }
    }
  } catch (e) {
    console.warn('Failed to get Geoapify key from DB, using env fallback')
  }

  // Fallback to env variable
  const envKey = import.meta.env.VITE_GEOAPIFY_API_KEY || ''
  cachedGeoapifyKey = envKey
  cacheTimestamp = Date.now()
  return envKey
}

interface GeocodeResult {
  lat: number
  lon: number
  city?: string
  formatted?: string
}

/**
 * Géocode une ville pour obtenir ses coordonnées
 * @param city Nom de la ville
 * @param countryCode Code pays (ex: 'fr', 'es', 'de') - par défaut 'fr'
 * @param lang Langue pour les résultats - par défaut 'fr'
 * @returns Coordonnées ou null si non trouvé
 */
async function geocodeCity(city: string, countryCode: string = 'fr', lang: string = 'fr'): Promise<GeocodeResult | null> {
  if (!city) return null

  const apiKey = await getGeoapifyApiKey()
  if (!apiKey) return null

  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)}&lang=${lang}&limit=1&filter=countrycode:${countryCode}&apiKey=${apiKey}`
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      return {
        lat: feature.properties.lat,
        lon: feature.properties.lon,
        city: feature.properties.city,
        formatted: feature.properties.formatted,
      }
    }
    return null
  } catch (error) {
    console.error('Erreur géocodage:', error)
    return null
  }
}

/**
 * Calcule la distance routière entre deux villes via l'API Geoapify Routing
 * @param departure Ville de départ
 * @param arrival Ville d'arrivée
 * @param countryCode Code pays pour le géocodage (ex: 'fr', 'es', 'de') - par défaut 'fr'
 * @returns Distance en km ou null si échec
 */
export async function calculateRouteDistance(departure: string, arrival: string, countryCode: string = 'fr'): Promise<number | null> {
  if (!departure || !arrival) {
    return estimateDistance(departure, arrival)
  }

  const apiKey = await getGeoapifyApiKey()
  if (!apiKey) {
    // Fallback sur l'estimation locale si pas d'API key
    return estimateDistance(departure, arrival)
  }

  try {
    // Géocoder les deux villes avec le code pays
    const [depCoords, arrCoords] = await Promise.all([
      geocodeCity(departure, countryCode, countryCode),
      geocodeCity(arrival, countryCode, countryCode),
    ])

    if (!depCoords || !arrCoords) {
      // Fallback sur l'estimation locale
      return estimateDistance(departure, arrival)
    }

    // Appel API Routing
    const response = await fetch(
      `https://api.geoapify.com/v1/routing?waypoints=${depCoords.lat},${depCoords.lon}|${arrCoords.lat},${arrCoords.lon}&mode=drive&apiKey=${apiKey}`
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const route = data.features[0]
      // Distance en mètres -> convertir en km et arrondir à 10 km
      const distanceKm = route.properties.distance / 1000
      return Math.round(distanceKm / 10) * 10
    }

    // Fallback sur l'estimation locale
    return estimateDistance(departure, arrival)
  } catch (error) {
    console.error('Erreur calcul distance route:', error)
    // Fallback sur l'estimation locale
    return estimateDistance(departure, arrival)
  }
}

/**
 * Version avec cache pour éviter les appels API répétés
 */
const distanceCache = new Map<string, number>()

export async function getDistanceWithCache(departure: string, arrival: string): Promise<number | null> {
  const cacheKey = `${departure.toLowerCase().trim()}|${arrival.toLowerCase().trim()}`

  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey) ?? null
  }

  const distance = await calculateRouteDistance(departure, arrival)

  if (distance !== null) {
    distanceCache.set(cacheKey, distance)
  }

  return distance
}

/**
 * Calcule la distance ET le temps de trajet entre deux villes via Geoapify
 * Le temps est calculé pour un autocar (vitesse moyenne ~70 km/h)
 * @param departure Ville de départ
 * @param arrival Ville d'arrivée
 * @returns {distance: km, duration: minutes} ou null si échec
 */
export interface RouteInfo {
  distance: number // en km
  duration: number // en minutes
  durationFormatted: string // format "Xh Ymin"
}

const routeInfoCache = new Map<string, RouteInfo>()

export async function calculateRouteInfo(departure: string, arrival: string, countryCode: string = 'fr'): Promise<RouteInfo | null> {
  if (!departure || !arrival) return null

  const cacheKey = `${departure.toLowerCase().trim()}|${arrival.toLowerCase().trim()}|${countryCode}`

  if (routeInfoCache.has(cacheKey)) {
    return routeInfoCache.get(cacheKey) ?? null
  }

  const apiKey = await getGeoapifyApiKey()

  try {
    // Géocoder les deux villes avec le code pays
    const [depCoords, arrCoords] = await Promise.all([
      geocodeCity(departure, countryCode, countryCode),
      geocodeCity(arrival, countryCode, countryCode),
    ])

    if (!depCoords || !arrCoords || !apiKey) {
      // Estimation basée sur la distance estimée
      const estimatedDist = estimateDistance(departure, arrival)
      if (estimatedDist) {
        // Vitesse moyenne autocar : 70 km/h
        const durationMin = Math.round((estimatedDist / 70) * 60)
        const result: RouteInfo = {
          distance: estimatedDist,
          duration: durationMin,
          durationFormatted: formatDuration(durationMin),
        }
        routeInfoCache.set(cacheKey, result)
        return result
      }
      return null
    }

    // Appel API Routing avec mode truck (plus proche de l'autocar)
    const response = await fetch(
      `https://api.geoapify.com/v1/routing?waypoints=${depCoords.lat},${depCoords.lon}|${arrCoords.lat},${arrCoords.lon}&mode=truck&apiKey=${apiKey}`
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const route = data.features[0]
      const distanceKm = Math.round(route.properties.distance / 1000)
      // Durée en secondes -> minutes, avec majoration de 20% pour autocar
      const durationMin = Math.round((route.properties.time / 60) * 1.2)

      const result: RouteInfo = {
        distance: distanceKm,
        duration: durationMin,
        durationFormatted: formatDuration(durationMin),
      }
      routeInfoCache.set(cacheKey, result)
      return result
    }

    return null
  } catch (error) {
    console.error('Erreur calcul route info:', error)
    return null
  }
}

/**
 * Formate une durée en minutes en "Xh Ymin"
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

/**
 * Calcule le nombre de cars nécessaires selon le nombre de passagers
 *
 * RÈGLES IMPORTANTES:
 * - Pour ≤ 53 passagers : 1 car standard de 53 places
 * - Pour 54-90 passagers : selon le type de véhicule choisi (60-63, 70 ou 83-90)
 * - Pour > 90 passagers : OBLIGATOIREMENT plusieurs cars de 50 places
 *   (pas de car > 90 places, donc on divise en plusieurs véhicules)
 *
 * @returns { cars: number, capacity: number, vehicleType: string }
 */
export function calculateNumberOfCars(
  passengers: number,
  vehicleType?: string,
  grandeCapaciteDispo: boolean = true
): number {
  // Pour les groupes > 90 passagers, utiliser l'optimisation avec combinaisons mixtes
  if (passengers > 90) {
    const optimized = optimizeVehicleCombination(passengers, grandeCapaciteDispo)
    return optimized.nombreCars
  }

  // Capacités par type de véhicule pour les groupes ≤ 90 passagers
  const capacities: Record<string, number> = {
    minibus: 20,
    standard: 59, // places_max de capacites_vehicules — 53 sous-facturait un 2e car des 54 pax,
    '60-63': 63,
    '70': 70,
    '83-90': 90,
    autocar: 59, // par défaut
  }

  // Si grande capacité non dispo et véhicule > 57 places demandé, forcer standard
  let effectiveType = vehicleType || 'autocar'
  if (!grandeCapaciteDispo && ['60-63', '70', '83-90'].includes(effectiveType)) {
    effectiveType = 'standard'
  }

  const capacity = capacities[effectiveType] || 53
  return Math.ceil(passengers / capacity)
}

/**
 * Coefficients par type de véhicule (doit correspondre à la table capacites_vehicules)
 */
const VEHICLE_COEFFICIENTS: Record<string, number> = {
  minibus: 0.65,
  standard: 1.00,
  '60-63': 1.15,
  '70': 1.35,
  '83-90': 1.70,
}

/**
 * Capacités par type de véhicule
 */
const VEHICLE_CAPACITIES: Record<string, number> = {
  minibus: 20,
  standard: 59, // places_max de capacites_vehicules — 53 sous-facturait un 2e car des 54 pax,
  '60-63': 63,
  '70': 70,
  '83-90': 90,
}

/**
 * Génère toutes les combinaisons de n véhicules parmi les types disponibles
 * (combinaisons avec répétition, ordonnées)
 */
function generateVehicleCombinations<T>(types: T[], n: number): T[][] {
  if (n === 0) return [[]]
  if (n === 1) return types.map(t => [t])

  const result: T[][] = []
  for (let i = 0; i < types.length; i++) {
    const subCombinations = generateVehicleCombinations(types.slice(i), n - 1)
    for (const sub of subCombinations) {
      result.push([types[i], ...sub])
    }
  }
  return result
}

/**
 * Pour > 90 passagers, trouve la combinaison optimale de véhicules
 * qui minimise le coût total (somme des coefficients)
 *
 * Supporte les COMBINAISONS MIXTES (ex: 1×63 + 1×53 pour 110 pax = coût 2.15)
 *
 * @param grandeCapaciteDispo - Si false, limite aux véhicules standard (53 places)
 *
 * Types de véhicules disponibles (si grande capacité dispo) :
 * - standard (53 places, coef 1.00)
 * - 60-63 (63 places, coef 1.15)
 * - 70 (70 places, coef 1.35)
 * - 83-90 (90 places, coef 1.70)
 */
export function optimizeVehicleCombination(passengers: number, grandeCapaciteDispo: boolean = true): {
  nombreCars: number
  vehicleType: string
  capaciteParCar: number
  coefficient: number
  placesTotal: number
  coutRelatif: number
  explication: string
  detail: string
} {
  // Types de véhicules disponibles (triés par capacité décroissante pour l'algo)
  const vehicleTypes = grandeCapaciteDispo
    ? [
        { type: '83-90', capacity: 90, coef: 1.70 },
        { type: '70', capacity: 70, coef: 1.35 },
        { type: '60-63', capacity: 63, coef: 1.15 },
        { type: 'standard', capacity: 53, coef: 1.00 },
      ]
    : [
        { type: 'standard', capacity: 53, coef: 1.00 },
      ]

  // Résultat par défaut: tous en standard
  const defaultNbCars = Math.ceil(passengers / 53)
  let bestResult = {
    nombreCars: defaultNbCars,
    vehicleType: 'standard',
    capaciteParCar: 53,
    coefficient: 1.00,
    placesTotal: defaultNbCars * 53,
    coutRelatif: defaultNbCars * 1.00,
    explication: '',
    detail: `${defaultNbCars}× standard (53 pl.)`
  }

  // Tester toutes les combinaisons possibles (max 5 cars pour limiter la complexité)
  const maxCars = Math.min(defaultNbCars, 5)

  for (let nbCars = 1; nbCars <= maxCars; nbCars++) {
    // Générer toutes les combinaisons de nbCars véhicules (avec mixtes)
    const combinations = generateVehicleCombinations(vehicleTypes, nbCars)

    for (const combo of combinations) {
      const totalCapacity = combo.reduce((sum, v) => sum + v.capacity, 0)

      // Vérifier que la capacité totale suffit
      if (totalCapacity >= passengers) {
        const coutTotal = combo.reduce((sum, v) => sum + v.coef, 0)

        if (coutTotal < bestResult.coutRelatif) {
          // Compter les véhicules par type pour le détail
          const countByType: Record<string, number> = {}
          for (const v of combo) {
            countByType[v.type] = (countByType[v.type] || 0) + 1
          }

          // Construire le détail
          const detailParts: string[] = []
          for (const [type, count] of Object.entries(countByType)) {
            const cap = vehicleTypes.find(v => v.type === type)?.capacity || 53
            detailParts.push(`${count}× ${type} (${cap} pl.)`)
          }

          // Type principal = celui avec le plus de cars, sinon le plus grand
          let mainType = 'standard'
          let maxCount = 0
          for (const [type, count] of Object.entries(countByType)) {
            if (count > maxCount) {
              maxCount = count
              mainType = type
            }
          }

          const mainVehicle = vehicleTypes.find(v => v.type === mainType) || vehicleTypes[vehicleTypes.length - 1]

          bestResult = {
            nombreCars: nbCars,
            vehicleType: mainType,
            capaciteParCar: mainVehicle.capacity,
            coefficient: coutTotal / nbCars, // Coefficient moyen
            placesTotal: totalCapacity,
            coutRelatif: coutTotal,
            explication: '',
            detail: detailParts.join(' + ')
          }
        }
      }
    }
  }

  bestResult.explication = `${passengers} pax → ${bestResult.detail} (coût ${bestResult.coutRelatif.toFixed(2)})`

  return bestResult
}

/**
 * Calcule le nombre de cars avec détails complets
 * Utilisé pour l'affichage et les devis
 *
 * @param grandeCapaciteDispo - Si false, limite aux véhicules standard (53 places)
 */
export function calculateCarsDetails(
  passengers: number,
  vehicleType?: string,
  grandeCapaciteDispo: boolean = true
): {
  nombreCars: number
  capaciteParCar: number
  vehicleTypeEffectif: string
  explication: string
  detail?: string
} {
  // Pour les groupes > 90 passagers, optimiser la combinaison (avec mixtes)
  if (passengers > 90) {
    const optimized = optimizeVehicleCombination(passengers, grandeCapaciteDispo)
    return {
      nombreCars: optimized.nombreCars,
      capaciteParCar: optimized.capaciteParCar,
      vehicleTypeEffectif: optimized.vehicleType,
      explication: optimized.explication,
      detail: optimized.detail
    }
  }

  // Capacités par type de véhicule pour les groupes ≤ 90 passagers
  const capacities: Record<string, number> = {
    minibus: 20,
    standard: 59, // places_max de capacites_vehicules — 53 sous-facturait un 2e car des 54 pax,
    '60-63': 63,
    '70': 70,
    '83-90': 90,
    autocar: 59,
  }

  // Si grande capacité non dispo et véhicule > 57 places demandé, forcer standard
  let vehicleTypeEffectif = vehicleType || 'autocar'
  if (!grandeCapaciteDispo && ['60-63', '70', '83-90'].includes(vehicleTypeEffectif)) {
    vehicleTypeEffectif = 'standard'
  }

  const capacity = capacities[vehicleTypeEffectif] || 53
  const nombreCars = Math.ceil(passengers / capacity)

  return {
    nombreCars,
    capaciteParCar: capacity,
    vehicleTypeEffectif,
    explication: `${passengers} passagers → ${nombreCars} car(s) de ${capacity} places`,
    detail: `${nombreCars}× ${vehicleTypeEffectif} (${capacity} pl.)`
  }
}

/**
 * Calcule le nombre de chauffeurs nécessaires selon les règles légales
 *
 * RÈGLES IMPORTANTES:
 * - Temps de conduite max: 9h/jour (10h max 2x/semaine)
 * - Amplitude max 1 chauffeur: 12h (14h avec coupure ≥ 3h)
 * - Repos ≥ 9h sur place = compteur remis à zéro (2 journées distinctes)
 * - Pause obligatoire: 45 min après 4h30 de conduite
 * - Coût relais chauffeur: 500€ par transfert
 * - MINIMUM 1 chauffeur par car (si plusieurs cars)
 *
 * @param durationMinutes Durée du trajet ALLER en minutes (pas l'AR total)
 * @param isSameDay Si c'est un AR le même jour (amplitude = aller + retour + attente)
 * @param waitingHours Heures d'attente sur place (seulement si same day)
 * @param nombreCars Nombre de cars (1 chauffeur minimum par car)
 * @returns Nombre de chauffeurs recommandés avec raison détaillée
 */
export function calculateNumberOfDrivers(
  durationMinutes: number,
  isSameDay: boolean = false,
  waitingHours: number = 0,
  nombreCars: number = 1
): { drivers: number; reason: string } {
  // Constantes réglementaires
  const CONDUITE_MAX_JOUR = 9 // heures
  const CONDUITE_MAX_EXTENSION = 10 // heures (2x/semaine)
  const AMPLITUDE_MAX_1_CHAUFFEUR = 12 // heures
  const AMPLITUDE_MAX_AVEC_COUPURE = 14 // heures (si coupure ≥ 3h)
  const REPOS_MIN_COMPTEUR_RAZ = 9 // heures (repos complet = compteur RAZ)
  const COUPURE_MIN_POUR_14H = 3 // heures

  // Temps de conduite aller en heures
  const tempsConduiteAller = durationMinutes / 60

  // Fonction helper pour calculer le nombre total de chauffeurs
  // (chauffeurs par car × nombre de cars)
  const calcDrivers = (driversPerCar: number) => driversPerCar * nombreCars
  const carsInfo = (total: number) => nombreCars > 1 ? ` (${total} chauffeurs pour ${nombreCars} cars)` : ''

  // Si repos ≥ 9h sur place, le compteur est remis à zéro
  // On vérifie chaque trajet séparément
  if (waitingHours >= REPOS_MIN_COMPTEUR_RAZ) {
    // Chaque trajet est vérifié indépendamment
    if (tempsConduiteAller > CONDUITE_MAX_EXTENSION) {
      const total = calcDrivers(2)
      return {
        drivers: total,
        reason: `Conduite ${tempsConduiteAller.toFixed(1)}h > 10h max/trajet (repos ${waitingHours}h entre)${carsInfo(total)}`
      }
    }
    const total = calcDrivers(1)
    return {
      drivers: total,
      reason: `Repos ${waitingHours}h ≥ 9h = compteur RAZ (trajets séparés)${carsInfo(total)}`
    }
  }

  // Calcul de l'amplitude pour AR même jour
  if (isSameDay) {
    const tempsConduiteAR = tempsConduiteAller * 2
    const amplitudeJournee = tempsConduiteAR + waitingHours

    // Vérifier temps de conduite total
    if (tempsConduiteAR > CONDUITE_MAX_EXTENSION) {
      const total = calcDrivers(2)
      return {
        drivers: total,
        reason: `Conduite ${tempsConduiteAR.toFixed(1)}h > 10h max/jour${carsInfo(total)}`
      }
    }

    // Vérifier amplitude
    if (amplitudeJournee > AMPLITUDE_MAX_AVEC_COUPURE) {
      const total = calcDrivers(2)
      return {
        drivers: total,
        reason: `Amplitude ${amplitudeJournee.toFixed(1)}h > 14h max${carsInfo(total)}`
      }
    }

    if (amplitudeJournee > AMPLITUDE_MAX_1_CHAUFFEUR) {
      if (waitingHours >= COUPURE_MIN_POUR_14H) {
        const total = calcDrivers(1)
        return {
          drivers: total,
          reason: `Amplitude ${amplitudeJournee.toFixed(1)}h avec coupure ${waitingHours}h ≥ 3h ✓${carsInfo(total)}`
        }
      }
      const total = calcDrivers(2)
      return {
        drivers: total,
        reason: `Amplitude ${amplitudeJournee.toFixed(1)}h et coupure ${waitingHours}h < 3h${carsInfo(total)}`
      }
    }

    if (amplitudeJournee <= CONDUITE_MAX_JOUR) {
      const total = calcDrivers(1)
      return { drivers: total, reason: `Amplitude ${amplitudeJournee.toFixed(1)}h ≤ 9h${carsInfo(total)}` }
    }

    if (tempsConduiteAR > CONDUITE_MAX_JOUR) {
      const total = calcDrivers(1)
      return {
        drivers: total,
        reason: `Conduite ${tempsConduiteAR.toFixed(1)}h (extension 10h utilisée)${carsInfo(total)}`
      }
    }

    const total = calcDrivers(1)
    return { drivers: total, reason: `Amplitude ${amplitudeJournee.toFixed(1)}h ≤ 12h${carsInfo(total)}` }
  }

  // AR sur plusieurs jours - vérifier seulement le trajet aller
  if (tempsConduiteAller > CONDUITE_MAX_EXTENSION) {
    // 2 chauffeurs par car si amplitude trop longue
    const driversPerCar = 2
    const totalDrivers = driversPerCar * nombreCars
    return {
      drivers: totalDrivers,
      reason: `Conduite ${tempsConduiteAller.toFixed(1)}h > 10h max/jour${nombreCars > 1 ? ` (${totalDrivers} chauffeurs pour ${nombreCars} cars)` : ''}`
    }
  }

  if (tempsConduiteAller > CONDUITE_MAX_JOUR) {
    // 1 chauffeur par car avec extension horaire
    const totalDrivers = nombreCars
    return {
      drivers: totalDrivers,
      reason: `Conduite ${tempsConduiteAller.toFixed(1)}h (extension 10h 2x/sem)${nombreCars > 1 ? ` - ${nombreCars} chauffeurs pour ${nombreCars} cars` : ''}`
    }
  }

  // Minimum 1 chauffeur par car
  const totalDrivers = nombreCars
  return {
    drivers: totalDrivers,
    reason: `Conduite ${tempsConduiteAller.toFixed(1)}h ≤ 9h${nombreCars > 1 ? ` - ${nombreCars} chauffeurs pour ${nombreCars} cars` : ''}`
  }
}
