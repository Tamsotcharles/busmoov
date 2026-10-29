/**
 * Libellés du type de prestation d'un devis (service_type) et résumé du
 * trajet propre à un devis : un dossier peut porter plusieurs devis de
 * prestations différentes (un aller simple ET un aller-retour), le client
 * doit voir pour chacun ce qu'il couvre, pas seulement la formule du dossier.
 */

export type ServiceTypeCode = 'aller_simple' | 'ar_1j' | 'ar_mad' | 'ar_sans_mad'
export type UiLang = 'fr' | 'es' | 'de' | 'en'

const LABELS: Record<UiLang, Record<ServiceTypeCode, string>> = {
  fr: {
    aller_simple: 'Aller simple',
    ar_1j: 'Aller-retour dans la journée',
    ar_mad: 'Aller-retour avec car sur place',
    ar_sans_mad: 'Aller-retour sur plusieurs jours',
  },
  es: {
    aller_simple: 'Solo ida',
    ar_1j: 'Ida y vuelta en el día',
    ar_mad: 'Ida y vuelta con autocar a disposición',
    ar_sans_mad: 'Ida y vuelta en varios días',
  },
  de: {
    aller_simple: 'Einfache Fahrt',
    ar_1j: 'Hin- und Rückfahrt am selben Tag',
    ar_mad: 'Hin- und Rückfahrt mit Bus vor Ort',
    ar_sans_mad: 'Hin- und Rückfahrt über mehrere Tage',
  },
  en: {
    aller_simple: 'One way',
    ar_1j: 'Same-day return',
    ar_mad: 'Return trip with coach on site',
    ar_sans_mad: 'Return trip over several days',
  },
}

export function getServiceTypeLabel(type: string | null | undefined, lang: string = 'fr'): string | null {
  if (!type) return null
  const l = (['fr', 'es', 'de', 'en'].includes(lang) ? lang : 'fr') as UiLang
  return LABELS[l][type as ServiceTypeCode] ?? type
}

export const isAllerSimple = (type: string | null | undefined) => type === 'aller_simple'

interface DevisLike {
  service_type?: string | null
  departure_override?: string | null
  arrival_override?: string | null
  departure_date_override?: string | null
  return_date_override?: string | null
  departure_time_override?: string | null
  return_time_override?: string | null
}
interface DossierLike {
  departure?: string | null
  arrival?: string | null
  departure_date?: string | null
  return_date?: string | null
  departure_time?: string | null
  return_time?: string | null
}

/** Trajet et dates réellement couverts par un devis (surcharges du devis, sinon dossier). */
export function devisTrajet(devis: DevisLike, dossier: DossierLike | null | undefined) {
  const allerSimple = isAllerSimple(devis.service_type)
  return {
    depart: devis.departure_override || dossier?.departure || '',
    arrivee: devis.arrival_override || dossier?.arrival || '',
    dateDepart: devis.departure_date_override || dossier?.departure_date || null,
    heureDepart: devis.departure_time_override || dossier?.departure_time || null,
    dateRetour: allerSimple ? null : (devis.return_date_override || dossier?.return_date || null),
    heureRetour: allerSimple ? null : (devis.return_time_override || dossier?.return_time || null),
    allerSimple,
  }
}
