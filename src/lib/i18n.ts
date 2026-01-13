import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Traductions françaises
import frCommon from '@/locales/fr/common.json'
import frPdf from '@/locales/fr/pdf.json'
import frForms from '@/locales/fr/forms.json'

// Traductions espagnoles
import esCommon from '@/locales/es/common.json'
import esPdf from '@/locales/es/pdf.json'
import esForms from '@/locales/es/forms.json'

// Traductions allemandes
import deCommon from '@/locales/de/common.json'
import dePdf from '@/locales/de/pdf.json'
import deForms from '@/locales/de/forms.json'

// Traductions anglaises
import enCommon from '@/locales/en/common.json'
import enPdf from '@/locales/en/pdf.json'
import enForms from '@/locales/en/forms.json'

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

// Ressources de traduction
const resources = {
  fr: {
    common: frCommon,
    pdf: frPdf,
    forms: frForms,
  },
  es: {
    common: esCommon,
    pdf: esPdf,
    forms: esForms,
  },
  de: {
    common: deCommon,
    pdf: dePdf,
    forms: deForms,
  },
  en: {
    common: enCommon,
    pdf: enPdf,
    forms: enForms,
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
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: defaultLanguage,
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
