import i18n from 'i18next'
import type { BackendModule, ReadCallback } from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Seul le français (langue par défaut, ~95 % du trafic) est embarqué dans le
// bundle d'entrée. Les autres langues sont des chunks séparés chargés à la
// demande par le backend ci-dessous (~68 Ko gzip économisés par visiteur FR).
import frCommon from '@/locales/fr/common.json'
import frPdf from '@/locales/fr/pdf.json'
import frForms from '@/locales/fr/forms.json'

const lazyLocales: Record<string, Record<string, () => Promise<{ default: object }>>> = {
  es: {
    common: () => import('@/locales/es/common.json'),
    pdf: () => import('@/locales/es/pdf.json'),
    forms: () => import('@/locales/es/forms.json'),
  },
  de: {
    common: () => import('@/locales/de/common.json'),
    pdf: () => import('@/locales/de/pdf.json'),
    forms: () => import('@/locales/de/forms.json'),
  },
  en: {
    common: () => import('@/locales/en/common.json'),
    pdf: () => import('@/locales/en/pdf.json'),
    forms: () => import('@/locales/en/forms.json'),
  },
  // Landing /zh : traduction partielle (en-tête, pied de page), le reste en anglais.
  zh: {
    common: () => import('@/locales/zh/common.json'),
  },
}

const lazyBackend: BackendModule = {
  type: 'backend',
  init() {},
  read(lng: string, ns: string, callback: ReadCallback) {
    const loader = lazyLocales[lng]?.[ns]
    if (!loader) {
      // Langue ou namespace non fourni (ex. zh/pdf) : bundle vide, le fallback prend le relais.
      callback(null, {})
      return
    }
    loader().then((m) => callback(null, m.default)).catch((e) => callback(e as Error, false))
  },
}

// Configuration des pays avec TVA
export const countries = {
  fr: {
    code: 'FR',
    name: 'France',
    language: 'fr',
    currency: 'EUR',
    currencySymbol: '€',
    vatRate: 10, // TVA transport 10%
    vatLabel: 'TVA',
    dateFormat: 'dd/MM/yyyy',
    timezone: 'Europe/Paris',
  },
  es: {
    code: 'ES',
    name: 'España',
    language: 'es',
    currency: 'EUR',
    currencySymbol: '€',
    vatRate: 10, // IVA transport 10%
    vatLabel: 'IVA',
    dateFormat: 'dd/MM/yyyy',
    timezone: 'Europe/Madrid',
  },
  de: {
    code: 'DE',
    name: 'Deutschland',
    language: 'de',
    currency: 'EUR',
    currencySymbol: '€',
    vatRate: 7, // MwSt transport 7%
    vatLabel: 'MwSt',
    dateFormat: 'dd.MM.yyyy',
    timezone: 'Europe/Berlin',
  },
  en: {
    code: 'GB',
    name: 'United Kingdom',
    language: 'en',
    currency: 'GBP',
    currencySymbol: '£',
    vatRate: 0, // VAT transport 0%
    vatLabel: 'VAT',
    dateFormat: 'dd/MM/yyyy',
    timezone: 'Europe/London',
  },
} as const

export type CountryCode = keyof typeof countries
export type Country = typeof countries[CountryCode]

// Langues supportées
export const supportedLanguages = ['fr', 'es', 'de', 'en'] as const
export type SupportedLanguage = typeof supportedLanguages[number]

// Langue par défaut
export const defaultLanguage: SupportedLanguage = 'fr'

// Ressources embarquées : français uniquement (voir lazyLocales plus haut).
const resources = {
  fr: {
    common: frCommon,
    pdf: frPdf,
    forms: frForms,
  },
}

// Détection de la langue depuis l'URL (path)
const getLanguageFromPath = (): string | null => {
  const path = window.location.pathname
  const langMatch = path.match(/^\/(fr|es|de|en)(\/|$)/)
  return langMatch ? langMatch[1] : null
}

// Initialisation i18n
i18n
  .use(lazyBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Le fr est embarqué, les autres langues passent par le backend.
    partialBundledLanguages: true,
    // Sur /zh, ce qui n'est pas traduit s'affiche en anglais, la langue de suivi des clients sinophones.
    fallbackLng: { zh: ['en'], default: [defaultLanguage] },
    defaultNS: 'common',
    ns: ['common', 'pdf', 'forms'],

    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React déjà sécurisé
    },

    react: {
      useSuspense: false,
    },
  })

// Définir la langue depuis le path si disponible
const pathLang = getLanguageFromPath()
if (pathLang && supportedLanguages.includes(pathLang as SupportedLanguage)) {
  i18n.changeLanguage(pathLang)
}

// Helper pour obtenir le pays actuel
export const getCurrentCountry = (): Country => {
  const lang = i18n.language as SupportedLanguage
  return countries[lang] || countries[defaultLanguage]
}

// Helper pour formater un prix selon la locale
export const formatPrice = (amount: number, lang?: SupportedLanguage): string => {
  const language = lang || (i18n.language as SupportedLanguage)
  const country = countries[language] || countries[defaultLanguage]

  return new Intl.NumberFormat(language, {
    style: 'currency',
    currency: country.currency,
  }).format(amount)
}

// Helper pour formater une date selon la locale
export const formatDate = (date: Date | string, lang?: SupportedLanguage): string => {
  const language = lang || (i18n.language as SupportedLanguage)
  const d = typeof date === 'string' ? new Date(date) : date

  return new Intl.DateTimeFormat(language, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

// Helper pour calculer la TVA
export const calculateVAT = (amountHT: number, lang?: SupportedLanguage): {
  ht: number
  vat: number
  ttc: number
  vatRate: number
  vatLabel: string
} => {
  const language = lang || (i18n.language as SupportedLanguage)
  const country = countries[language] || countries[defaultLanguage]

  const vat = amountHT * (country.vatRate / 100)

  return {
    ht: amountHT,
    vat,
    ttc: amountHT + vat,
    vatRate: country.vatRate,
    vatLabel: country.vatLabel,
  }
}

export default i18n
