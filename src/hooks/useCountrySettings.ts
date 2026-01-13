import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'

export interface CountrySettings {
  code: string
  name: string
  language: string
  currency: string
  currencySymbol: string
  vatRate: number
  vatLabel: string
  dateFormat: string
  timezone: string
  phone: string
  phoneDisplay: string
  email: string
  address: string
  city: string
  companyName: string
  siret: string
  tvaIntra: string
  bankName: string
  bankIban: string
  bankBic: string
  bankBeneficiary: string
}

// Mapping langue -> code pays
const LANGUAGE_TO_COUNTRY: Record<string, string> = {
  fr: 'FR',
  es: 'ES',
  de: 'DE',
  en: 'GB',
}

/**
 * Hook pour récupérer les paramètres du pays actuel
 * basé sur la langue sélectionnée
 */
export function useCurrentCountry() {
  const { i18n } = useTranslation()
  const countryCode = LANGUAGE_TO_COUNTRY[i18n.language] || 'FR'

  return useQuery({
    queryKey: ['current-country', countryCode],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('countries')
        .select('*')
        .eq('code', countryCode)
        .single()

      if (error) {
        console.warn('Could not load country settings:', error)
        // Retourner des valeurs par défaut
        return getDefaultCountrySettings(countryCode)
      }

      return {
        code: data.code,
        name: data.name,
        language: data.language,
        currency: data.currency,
        currencySymbol: data.currency_symbol,
        vatRate: parseFloat(data.vat_rate) || 10,
        vatLabel: data.vat_label || 'TVA',
        dateFormat: data.date_format,
        timezone: data.timezone,
        phone: data.phone || '',
        phoneDisplay: data.phone_display || '',
        email: data.email || '',
        address: data.address || '',
        city: data.city || '',
        companyName: data.company_name || 'Busmoov',
        siret: data.siret || '',
        tvaIntra: data.tva_intra || '',
        bankName: data.bank_name || '',
        bankIban: data.bank_iban || '',
        bankBic: data.bank_bic || '',
        bankBeneficiary: data.bank_beneficiary || '',
      } as CountrySettings
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  })
}

// Valeurs par défaut par pays
function getDefaultCountrySettings(countryCode: string): CountrySettings {
  const defaults: Record<string, CountrySettings> = {
    FR: {
      code: 'FR',
      name: 'France',
      language: 'fr',
      currency: 'EUR',
      currencySymbol: '€',
      vatRate: 10,
      vatLabel: 'TVA',
      dateFormat: 'dd/MM/yyyy',
      timezone: 'Europe/Paris',
      phone: '+33176311283',
      phoneDisplay: '01 76 31 12 83',
      email: 'infos@busmoov.com',
      address: '41 Rue Barrault',
      city: '75013 Paris',
      companyName: 'Busmoov',
      siret: '853 867 703 00029',
      tvaIntra: 'FR58853867703',
      bankName: 'BNP Paribas',
      bankIban: 'FR76 3000 4015 9600 0101 0820 195',
      bankBic: 'BNPAFRPPXXX',
      bankBeneficiary: 'BUSMOOV SAS',
    },
    ES: {
      code: 'ES',
      name: 'España',
      language: 'es',
      currency: 'EUR',
      currencySymbol: '€',
      vatRate: 10,
      vatLabel: 'IVA',
      dateFormat: 'dd/MM/yyyy',
      timezone: 'Europe/Madrid',
      phone: '+34912345678',
      phoneDisplay: '912 345 678',
      email: 'info@busmoov.es',
      address: 'Calle del Transporte 123',
      city: '28001 Madrid',
      companyName: 'Busmoov España',
      siret: 'B12345678',
      tvaIntra: 'ESB12345678',
      bankName: 'Banco Santander',
      bankIban: 'ES12 1234 5678 9012 3456 7890',
      bankBic: 'BSCHESMM',
      bankBeneficiary: 'BUSMOOV ESPAÑA SL',
    },
    DE: {
      code: 'DE',
      name: 'Deutschland',
      language: 'de',
      currency: 'EUR',
      currencySymbol: '€',
      vatRate: 7,
      vatLabel: 'MwSt',
      dateFormat: 'dd.MM.yyyy',
      timezone: 'Europe/Berlin',
      phone: '+4930123456789',
      phoneDisplay: '030 1234 5678',
      email: 'info@busmoov.de',
      address: 'Transportstraße 123',
      city: '10115 Berlin',
      companyName: 'Busmoov Deutschland',
      siret: 'HRB 12345678',
      tvaIntra: 'DE123456789',
      bankName: 'Deutsche Bank',
      bankIban: 'DE89 1234 5678 9012 3456 78',
      bankBic: 'DEUTDEFF',
      bankBeneficiary: 'BUSMOOV DEUTSCHLAND GMBH',
    },
    GB: {
      code: 'GB',
      name: 'United Kingdom',
      language: 'en',
      currency: 'GBP',
      currencySymbol: '£',
      vatRate: 0,
      vatLabel: 'VAT',
      dateFormat: 'dd/MM/yyyy',
      timezone: 'Europe/London',
      phone: '+442012345678',
      phoneDisplay: '020 1234 5678',
      email: 'info@busmoov.co.uk',
      address: '123 Transport Street',
      city: 'London EC1A 1BB',
      companyName: 'Busmoov UK',
      siret: '12345678',
      tvaIntra: 'GB123456789',
      bankName: 'Barclays',
      bankIban: 'GB82 WEST 1234 5698 7654 32',
      bankBic: 'BUKBGB22',
      bankBeneficiary: 'BUSMOOV UK LTD',
    },
  }

  return defaults[countryCode] || defaults.FR
}

/**
 * Hook pour récupérer le code pays actuel basé sur la langue
 */
export function useCurrentCountryCode() {
  const { i18n } = useTranslation()
  return LANGUAGE_TO_COUNTRY[i18n.language] || 'FR'
}

/**
 * Hook pour récupérer le contenu spécifique au pays actuel
 * (mentions légales, politique de confidentialité, etc.)
 */
export function useCurrentCountryContent(contentType: string) {
  const countryCode = useCurrentCountryCode()

  return useQuery({
    queryKey: ['country-content', countryCode, contentType],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('country_content')
        .select('*')
        .eq('country_code', countryCode)
        .eq('content_type', contentType)
        .single()

      if (error) {
        console.warn('Could not load country content:', error)
        return null
      }

      return {
        id: data.id,
        countryCode: data.country_code,
        contentType: data.content_type,
        title: data.title,
        content: data.content,
        updatedAt: data.updated_at,
      }
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  })
}
