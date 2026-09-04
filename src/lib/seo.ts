import { supportedLanguages, type SupportedLanguage } from '@/lib/i18n'
import { getSiteBaseUrl } from '@/lib/utils'

/**
 * Configuration SEO centralisée des pages publiques.
 *
 * Chaque page indexable a un titre (~55-60 caractères) et une description
 * (~150-160 caractères) par langue. Les titres placent le mot-clé principal
 * en premier, la marque en dernier.
 */

export type SeoPageKey =
  | 'home'
  | 'location-autocar'
  | 'location-minibus'
  | 'transfert-aeroport'
  | 'sorties-scolaires'
  | 'a-propos'
  | 'contact'
  | 'devenir-partenaire'
  | 'cgv'
  | 'mentions-legales'
  | 'confidentialite'

interface SeoPageMeta {
  title: string
  description: string
}

type SeoConfig = Record<SeoPageKey, Record<SupportedLanguage, SeoPageMeta>>

/** Chemin (sans préfixe de langue) de chaque page indexable. */
export const seoPaths: Record<SeoPageKey, string> = {
  'home': '/',
  'location-autocar': '/services/location-autocar',
  'location-minibus': '/services/location-minibus',
  'transfert-aeroport': '/services/transfert-aeroport',
  'sorties-scolaires': '/services/sorties-scolaires',
  'a-propos': '/a-propos',
  'contact': '/contact',
  'devenir-partenaire': '/devenir-partenaire',
  'cgv': '/cgv',
  'mentions-legales': '/mentions-legales',
  'confidentialite': '/confidentialite',
}

export const seoConfig: SeoConfig = {
  'home': {
    fr: {
      title: 'Location d\'autocar avec chauffeur — Devis gratuit | Busmoov',
      description: 'Louez un bus, autocar ou minibus avec chauffeur partout en France. Comparez plusieurs devis de transporteurs vérifiés en 24h et réservez en ligne au meilleur prix.',
    },
    es: {
      title: 'Alquiler de autocar con conductor — Presupuesto gratis | Busmoov',
      description: 'Alquile un autocar o minibús con conductor en toda España. Compare varios presupuestos de transportistas verificados en 24h y reserve online al mejor precio.',
    },
    de: {
      title: 'Busvermietung mit Fahrer — Kostenloses Angebot | Busmoov',
      description: 'Mieten Sie einen Reisebus oder Minibus mit Fahrer in ganz Deutschland. Vergleichen Sie geprüfte Angebote innerhalb von 24h und buchen Sie online zum besten Preis.',
    },
    en: {
      title: 'Coach Hire with Driver — Free Quote | Busmoov',
      description: 'Hire a coach or minibus with driver across the UK. Compare quotes from verified operators within 24h and book online at the best price.',
    },
  },
  'location-autocar': {
    fr: {
      title: 'Location d\'autocar avec chauffeur pour groupes | Busmoov',
      description: 'Location d\'autocar (bus grand tourisme) avec chauffeur de 20 à 90 places : mariages, séminaires, voyages scolaires, excursions. Devis gratuit sous 24h, transporteurs vérifiés.',
    },
    es: {
      title: 'Alquiler de autocar con conductor para grupos | Busmoov',
      description: 'Alquiler de autocares con conductor de 20 a 90 plazas: bodas, seminarios, viajes escolares, excursiones. Presupuesto gratis en 24h, transportistas verificados.',
    },
    de: {
      title: 'Reisebus mieten mit Fahrer für Gruppen | Busmoov',
      description: 'Reisebusse mit Fahrer von 20 bis 90 Plätzen: Hochzeiten, Seminare, Klassenfahrten, Ausflüge. Kostenloses Angebot in 24h, geprüfte Busunternehmen.',
    },
    en: {
      title: 'Coach Hire with Driver for Groups | Busmoov',
      description: 'Coach hire with driver from 20 to 90 seats: weddings, corporate events, school trips, excursions. Free quote within 24h from verified operators.',
    },
  },
  'location-minibus': {
    fr: {
      title: 'Location de minibus avec chauffeur (8-20 places) | Busmoov',
      description: 'Louez un minibus avec chauffeur de 8 à 20 places pour vos petits groupes : transferts, événements, excursions. Devis gratuit en 24h partout en France.',
    },
    es: {
      title: 'Alquiler de minibús con conductor (8-20 plazas) | Busmoov',
      description: 'Alquile un minibús con conductor de 8 a 20 plazas para grupos pequeños: traslados, eventos, excursiones. Presupuesto gratis en 24h en toda España.',
    },
    de: {
      title: 'Minibus mieten mit Fahrer (8-20 Plätze) | Busmoov',
      description: 'Mieten Sie einen Minibus mit Fahrer für 8 bis 20 Personen: Transfers, Events, Ausflüge. Kostenloses Angebot in 24h, deutschlandweit.',
    },
    en: {
      title: 'Minibus Hire with Driver (8-20 seats) | Busmoov',
      description: 'Hire a minibus with driver for 8 to 20 passengers: transfers, events, day trips. Free quote within 24h across the UK.',
    },
  },
  'transfert-aeroport': {
    fr: {
      title: 'Transfert aéroport en autocar pour groupes | Busmoov',
      description: 'Transfert aéroport en autocar ou minibus avec chauffeur : CDG, Orly, et tous les aéroports de France. Ponctualité garantie, devis gratuit en 24h.',
    },
    es: {
      title: 'Traslado al aeropuerto en autocar para grupos | Busmoov',
      description: 'Traslados al aeropuerto en autocar o minibús con conductor en toda España. Puntualidad garantizada, presupuesto gratuito en 24h.',
    },
    de: {
      title: 'Flughafentransfer mit dem Bus für Gruppen | Busmoov',
      description: 'Flughafentransfer mit Reisebus oder Minibus mit Fahrer in ganz Deutschland. Garantierte Pünktlichkeit, kostenloses Angebot in 24h.',
    },
    en: {
      title: 'Airport Transfer by Coach for Groups | Busmoov',
      description: 'Airport transfers by coach or minibus with driver across the UK. Guaranteed punctuality, free quote within 24h.',
    },
  },
  'sorties-scolaires': {
    fr: {
      title: 'Transport scolaire en autocar : sorties et voyages | Busmoov',
      description: 'Autocar avec chauffeur pour sorties scolaires et voyages de classe. Transporteurs agréés, véhicules aux normes, devis gratuit pour écoles et collèges.',
    },
    es: {
      title: 'Transporte escolar en autocar: excursiones y viajes | Busmoov',
      description: 'Autocar con conductor para excursiones escolares y viajes de estudios. Transportistas homologados, presupuesto gratuito para colegios e institutos.',
    },
    de: {
      title: 'Schülertransport & Klassenfahrten mit dem Bus | Busmoov',
      description: 'Reisebus mit Fahrer für Schulausflüge und Klassenfahrten. Zugelassene Busunternehmen, kostenloses Angebot für Schulen.',
    },
    en: {
      title: 'School Trip Coach Hire | Busmoov',
      description: 'Coach hire with driver for school trips and educational visits. Licensed operators, compliant vehicles, free quote for schools.',
    },
  },
  'a-propos': {
    fr: {
      title: 'À propos de Busmoov — Réservation d\'autocar simplifiée',
      description: 'Busmoov met en relation vos groupes avec des transporteurs d\'autocars vérifiés en France et en Europe. Découvrez notre histoire et nos engagements.',
    },
    es: {
      title: 'Sobre Busmoov — Reserva de autocar simplificada',
      description: 'Busmoov conecta a sus grupos con transportistas de autocares verificados en España y Europa. Descubra nuestra historia y compromisos.',
    },
    de: {
      title: 'Über Busmoov — Busbuchung leicht gemacht',
      description: 'Busmoov verbindet Ihre Gruppen mit geprüften Busunternehmen in Deutschland und Europa. Erfahren Sie mehr über uns.',
    },
    en: {
      title: 'About Busmoov — Coach Booking Made Simple',
      description: 'Busmoov connects your groups with verified coach operators in the UK and Europe. Learn about our story and commitments.',
    },
  },
  'contact': {
    fr: {
      title: 'Contact — Busmoov | Devis et renseignements autocar',
      description: 'Contactez l\'équipe Busmoov pour toute question sur votre location d\'autocar ou minibus avec chauffeur. Réponse rapide par email ou téléphone.',
    },
    es: {
      title: 'Contacto — Busmoov | Presupuestos e información',
      description: 'Contacte con el equipo de Busmoov para cualquier pregunta sobre su alquiler de autocar o minibús con conductor. Respuesta rápida.',
    },
    de: {
      title: 'Kontakt — Busmoov | Angebote und Informationen',
      description: 'Kontaktieren Sie das Busmoov-Team bei Fragen zu Ihrer Busvermietung mit Fahrer. Schnelle Antwort per E-Mail oder Telefon.',
    },
    en: {
      title: 'Contact — Busmoov | Coach Hire Quotes & Enquiries',
      description: 'Contact the Busmoov team with any questions about your coach or minibus hire with driver. Fast response by email or phone.',
    },
  },
  'devenir-partenaire': {
    fr: {
      title: 'Devenir transporteur partenaire | Busmoov',
      description: 'Transporteur d\'autocars ? Rejoignez le réseau Busmoov et recevez des demandes de groupes qualifiées dans votre région. Inscription gratuite.',
    },
    es: {
      title: 'Hágase transportista asociado | Busmoov',
      description: '¿Es transportista de autocares? Únase a la red Busmoov y reciba solicitudes de grupos cualificadas en su región. Inscripción gratuita.',
    },
    de: {
      title: 'Partner-Busunternehmen werden | Busmoov',
      description: 'Sie sind Busunternehmer? Werden Sie Teil des Busmoov-Netzwerks und erhalten Sie qualifizierte Gruppenanfragen aus Ihrer Region. Kostenlose Anmeldung.',
    },
    en: {
      title: 'Become a Partner Operator | Busmoov',
      description: 'Coach operator? Join the Busmoov network and receive qualified group enquiries in your area. Free registration.',
    },
  },
  'cgv': {
    fr: { title: 'Conditions Générales de Vente | Busmoov', description: 'Consultez les conditions générales de vente de Busmoov pour la réservation de transport en autocar et minibus avec chauffeur.' },
    es: { title: 'Condiciones Generales de Venta | Busmoov', description: 'Consulte las condiciones generales de venta de Busmoov para la reserva de transporte en autocar y minibús con conductor.' },
    de: { title: 'Allgemeine Geschäftsbedingungen | Busmoov', description: 'Lesen Sie die AGB von Busmoov für die Buchung von Bus- und Minibustransporten mit Fahrer.' },
    en: { title: 'Terms and Conditions | Busmoov', description: 'Read the Busmoov terms and conditions for booking coach and minibus transport with driver.' },
  },
  'mentions-legales': {
    fr: { title: 'Mentions légales | Busmoov', description: 'Mentions légales du site Busmoov : éditeur, hébergeur et informations réglementaires.' },
    es: { title: 'Aviso legal | Busmoov', description: 'Aviso legal del sitio Busmoov: editor, alojamiento e información reglamentaria.' },
    de: { title: 'Impressum | Busmoov', description: 'Impressum der Busmoov-Website: Herausgeber, Hosting und rechtliche Informationen.' },
    en: { title: 'Legal Notice | Busmoov', description: 'Legal notice of the Busmoov website: publisher, hosting and regulatory information.' },
  },
  'confidentialite': {
    fr: { title: 'Politique de confidentialité | Busmoov', description: 'Politique de confidentialité de Busmoov : collecte, utilisation et protection de vos données personnelles.' },
    es: { title: 'Política de privacidad | Busmoov', description: 'Política de privacidad de Busmoov: recogida, uso y protección de sus datos personales.' },
    de: { title: 'Datenschutzerklärung | Busmoov', description: 'Datenschutzerklärung von Busmoov: Erhebung, Nutzung und Schutz Ihrer personenbezogenen Daten.' },
    en: { title: 'Privacy Policy | Busmoov', description: 'Busmoov privacy policy: collection, use and protection of your personal data.' },
  },
}

/** Locale Open Graph par langue. */
export const ogLocales: Record<SupportedLanguage, string> = {
  fr: 'fr_FR',
  es: 'es_ES',
  de: 'de_DE',
  en: 'en_GB',
}

/** URL canonique d'une page dans une langue donnée. */
export function getCanonicalUrl(page: SeoPageKey, lang: SupportedLanguage): string {
  const base = getSiteBaseUrl()
  const path = seoPaths[page]
  return path === '/' ? `${base}/${lang}` : `${base}/${lang}${path}`
}

/** Alternates hreflang (toutes langues + x-default vers le français). */
export function getHreflangAlternates(page: SeoPageKey): Array<{ hreflang: string; href: string }> {
  const alternates = supportedLanguages.map((lang) => ({
    hreflang: lang === 'en' ? 'en-GB' : lang,
    href: getCanonicalUrl(page, lang),
  }))
  alternates.push({ hreflang: 'x-default', href: getCanonicalUrl(page, 'fr') })
  return alternates
}
