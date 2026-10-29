/**
 * Langue et formats de date des emails, déduits du pays du dossier.
 * Les templates email existent en fr/es/de/en ; `GB` doit donner `en`
 * (un `.toLowerCase()` naïf donnait `gb`, langue inconnue → tout en français).
 * Les fonctions acceptent une langue `string` quelconque et retombent sur
 * le français si elle est inconnue.
 */
export type EmailLang = 'fr' | 'es' | 'de' | 'en'

const asLang = (lang: string | null | undefined): EmailLang =>
  (['fr', 'es', 'de', 'en'].includes(lang || '') ? (lang as EmailLang) : 'fr')

export function countryToLang(countryCode: string | null | undefined): EmailLang {
  switch ((countryCode || 'FR').toUpperCase()) {
    case 'ES': return 'es'
    case 'DE': case 'AT': case 'CH': return 'de'
    case 'GB': case 'UK': case 'EN': case 'IE': return 'en'
    default: return 'fr'
  }
}

export const DATE_LOCALES: Record<EmailLang, string> = {
  fr: 'fr-FR',
  es: 'es-ES',
  de: 'de-DE',
  en: 'en-GB',
}

/** « lundi 9 octobre 2026 » / « Monday 9 October 2026 ». */
export function formatDateLong(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(DATE_LOCALES[asLang(lang)], { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

/** « 9 octobre 2026 » / « 9 October 2026 ». */
export function formatDateMedium(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(DATE_LOCALES[asLang(lang)], { day: 'numeric', month: 'long', year: 'numeric' })
}

/** « 09/10/2026 » selon la locale. */
export function formatDateShort(dateStr: string, lang: string): string {
  return new Date(dateStr).toLocaleDateString(DATE_LOCALES[asLang(lang)])
}

export function formatCurrencyFor(amount: number, lang: string, minimumFractionDigits = 0): string {
  return new Intl.NumberFormat(DATE_LOCALES[asLang(lang)], { style: 'currency', currency: 'EUR', minimumFractionDigits }).format(amount)
}

/** Libellés utilisés dans les fragments HTML générés par les fonctions. */
export const EMAIL_LABELS: Record<EmailLang, Record<string, string>> = {
  fr: {
    service: 'Prestation', st_aller_simple: 'Aller simple', st_ar_1j: 'Aller-retour dans la journée', st_ar_mad: 'Aller-retour avec car sur place', st_ar_sans_mad: 'Aller-retour sur plusieurs jours',
    carrier: 'Transporteur', vehicle: 'Véhicule', priceIncl: 'Prix TTC', partnerCarrier: 'Transporteur partenaire',
    noQuote: 'Aucun devis disponible', bestPrice: 'Meilleur prix !', save: 'Économisez', vsHighest: 'par rapport à l\'offre la plus élevée.',
    minibus: 'Minibus', standard: 'Autocar standard', c60: 'Autocar 60-63 places', c70: 'Grand autocar 70 places', c83: 'Autocar grande capacité', coach: 'Autocar',
  },
  es: {
    service: 'Servicio', st_aller_simple: 'Solo ida', st_ar_1j: 'Ida y vuelta en el día', st_ar_mad: 'Ida y vuelta con autocar a disposición', st_ar_sans_mad: 'Ida y vuelta en varios días',
    carrier: 'Transportista', vehicle: 'Vehículo', priceIncl: 'Precio IVA incl.', partnerCarrier: 'Transportista asociado',
    noQuote: 'Ningún presupuesto disponible', bestPrice: '¡Mejor precio!', save: 'Ahorre', vsHighest: 'respecto a la oferta más alta.',
    minibus: 'Minibús', standard: 'Autocar estándar', c60: 'Autocar 60-63 plazas', c70: 'Gran autocar 70 plazas', c83: 'Autocar gran capacidad', coach: 'Autocar',
  },
  de: {
    service: 'Leistung', st_aller_simple: 'Einfache Fahrt', st_ar_1j: 'Hin- und Rückfahrt am selben Tag', st_ar_mad: 'Hin- und Rückfahrt mit Bus vor Ort', st_ar_sans_mad: 'Hin- und Rückfahrt über mehrere Tage',
    carrier: 'Busunternehmen', vehicle: 'Fahrzeug', priceIncl: 'Preis inkl. MwSt.', partnerCarrier: 'Partnerunternehmen',
    noQuote: 'Kein Angebot verfügbar', bestPrice: 'Bester Preis!', save: 'Sparen Sie', vsHighest: 'gegenüber dem höchsten Angebot.',
    minibus: 'Kleinbus', standard: 'Standard-Reisebus', c60: 'Reisebus 60-63 Plätze', c70: 'Großer Reisebus 70 Plätze', c83: 'Reisebus mit großer Kapazität', coach: 'Reisebus',
  },
  en: {
    service: 'Service', st_aller_simple: 'One way', st_ar_1j: 'Same-day return', st_ar_mad: 'Return trip with coach on site', st_ar_sans_mad: 'Return trip over several days',
    carrier: 'Operator', vehicle: 'Vehicle', priceIncl: 'Price incl. VAT', partnerCarrier: 'Partner operator',
    noQuote: 'No quote available', bestPrice: 'Best price!', save: 'Save', vsHighest: 'compared with the highest offer.',
    minibus: 'Minibus', standard: 'Standard coach', c60: '60-63 seat coach', c70: 'Large 70 seat coach', c83: 'High-capacity coach', coach: 'Coach',
  },
}

export function labelsFor(lang: string): Record<string, string> {
  return EMAIL_LABELS[asLang(lang)]
}
