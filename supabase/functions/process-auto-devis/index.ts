import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Domaines autorisés pour CORS
const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'https://busmoov.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

// Clé API depuis les secrets Supabase
const GEOAPIFY_API_KEY = Deno.env.get('GEOAPIFY_API_KEY') || ''

// Transporteurs auto pour les devis générés automatiquement
// Chaque étape du workflow utilise un transporteur différent
const TRANSPORTEURS_AUTO = [
  '8ff14e8a-3be7-489b-99bd-4f4497aba6fd', // Transport Envoi Auto 1
  '99a6bff2-cd4c-4bcf-a195-f488b7590b12', // Transport Envoi Auto 2
  'e0c60ce4-0258-4fa7-8fe4-690a871a9811', // Transport Envoi Auto 3
  'cfcf14df-56ab-49dc-8b19-b89116bed08f', // Transport Envoi Auto 4
]

interface WorkflowStep {
  delay_hours: number
  marge_percent: number
  label: string
}

// Taux de TVA par pays (transport de voyageurs)
const TVA_RATES: Record<string, number> = {
  FR: 10, // France
  ES: 10, // Espagne (IVA transporte de viajeros)
  DE: 7,  // Allemagne (ermäßigter Steuersatz für Personenbeförderung)
  GB: 0,  // Royaume-Uni (VAT 0% for passenger transport)
  EN: 0,  // Alias pour GB (langue EN)
}

/**
 * Obtient le taux de TVA selon le pays
 */
function getTvaRate(countryCode: string | null | undefined): number {
  if (!countryCode) return TVA_RATES.FR
  return TVA_RATES[countryCode] || TVA_RATES.FR
}

interface TarifAllerSimple {
  km_min: number
  km_max: number
  prix_public: number
}

interface TarifAR1J {
  km_min: number
  km_max: number
  prix_8h: number | null
  prix_10h: number | null
  prix_12h: number | null
  prix_9h_coupure: number | null
}

interface TarifARMAD {
  km_min: number
  km_max: number
  prix_2j: number | null
  prix_3j: number | null
  prix_4j: number | null
  prix_5j: number | null
  prix_6j: number | null
  supplement_jour: number | null
}

interface TarifARSansMAD {
  km_min: number
  km_max: number
  prix_2j: number | null
  prix_3j: number | null
  prix_4j: number | null
  prix_5j: number | null
  prix_6j: number | null
  supplement_jour: number | null
}

interface CapaciteVehicule {
  code: string
  coefficient: number
  places_min?: number
  places_max?: number
}

/**
 * Détermine automatiquement le type de véhicule selon le nombre de passagers
 */
function determinerTypeVehicule(passengers: number, capacites: CapaciteVehicule[]): string {
  // Si on a les capacités avec places_min/places_max, utiliser ça
  for (const cap of capacites) {
    if (cap.places_min !== undefined && cap.places_max !== undefined) {
      if (passengers >= cap.places_min && passengers <= cap.places_max) {
        return cap.code
      }
    }
  }

  // Fallback basé sur les seuils connus
  if (passengers <= 20) return 'minibus'
  if (passengers <= 59) return 'standard'
  if (passengers <= 63) return '60-63'
  if (passengers <= 70) return '70'
  return '83-90'
}

/**
 * Calcule le nombre de cars nécessaires selon le nombre de passagers
 *
 * RÈGLES IMPORTANTES:
 * - Pour ≤ 90 passagers : selon le type de véhicule
 * - Pour > 90 passagers : OBLIGATOIREMENT plusieurs cars de 50 places
 *   (il n'existe pas de car > 90 places en France)
 */
function calculateNumberOfCars(passengers: number, vehicleType: string): {
  nombreCars: number
  capaciteParCar: number
  vehicleTypeEffectif: string
} {
  // Pour les groupes > 90 passagers, TOUJOURS plusieurs cars de 53 places
  // (il n'existe pas de car > 90 places en France)
  if (passengers > 90) {
    const CAPACITE_CAR_MULTI = 53
    const nombreCars = Math.ceil(passengers / CAPACITE_CAR_MULTI)
    return {
      nombreCars,
      capaciteParCar: CAPACITE_CAR_MULTI,
      vehicleTypeEffectif: 'standard'
    }
  }

  // Capacités par type de véhicule pour les groupes ≤ 90 passagers
  const capacities: Record<string, number> = {
    minibus: 20,
    standard: 53,
    '60-63': 63,
    '70': 70,
    '83-90': 90,
    autocar: 53,
  }

  const capacity = capacities[vehicleType] || 53
  const nombreCars = Math.ceil(passengers / capacity)

  return {
    nombreCars,
    capaciteParCar: capacity,
    vehicleTypeEffectif: vehicleType
  }
}

interface GeoCoords {
  lat: number
  lon: number
}

// =============================================
// RÈGLES RÉGLEMENTAIRES CHAUFFEUR (COMPLÈTES)
// =============================================

const REGLES_CHAUFFEUR = {
  // Temps de conduite
  CONDUITE_CONTINUE_MAX_JOUR: 4.5,    // heures (pause obligatoire après)
  CONDUITE_CONTINUE_MAX_NUIT: 4,      // heures (22h-6h)
  CONDUITE_MAX_JOUR: 9,               // heures par jour
  CONDUITE_MAX_JOUR_EXTENSION: 10,    // heures (max 2x/semaine)

  // Amplitude (temps de travail total)
  AMPLITUDE_MAX_1_CHAUFFEUR: 12,      // heures
  AMPLITUDE_MAX_AVEC_COUPURE: 14,     // heures (si coupure ≥ 3h)
  AMPLITUDE_MAX_2_CHAUFFEURS: 18,     // heures

  // Repos et pauses
  REPOS_QUOTIDIEN_MIN: 11,            // heures (9h si repos réduit)
  REPOS_REDUIT_MIN: 9,                // heures (3x max par semaine)
  PAUSE_OBLIGATOIRE: 45,              // minutes après 4h30 de conduite
  COUPURE_MIN_POUR_14H: 3,            // heures de coupure pour amplitude 14h

  // Coûts
  COUT_RELAIS_CHAUFFEUR: 500,         // € par transfert

  // Vitesse
  VITESSE_MOYENNE_AUTOCAR: 70,        // km/h (estimation avec pauses)
  COEF_TEMPS_AUTOCAR: 1.20,           // Coefficient temps réel vs distance
} as const

// =============================================
// TARIFS HORS GRILLE
// =============================================

const TARIFS_HORS_GRILLE = {
  // Prix par km supplémentaire au-delà de la grille
  PRIX_KM_SUPPLEMENTAIRE: 3,          // € par km

  // Petits km AR 1 jour (≤50 km)
  PETIT_KM_SEUIL: 50,                 // km
  PETIT_KM_BASE: 690,                 // € prix de base
  PETIT_KM_AMPLITUDE_5H_PLUS: 790,    // € si amplitude > 5h et ≤ 20km
  PETIT_KM_AMPLITUDE_5H_PLUS_50: 830, // € si amplitude > 5h et > 20km

  // Limites des grilles
  GRILLE_ALLER_SIMPLE_MAX: 400,       // km
  GRILLE_AR_1J_MAX: 500,              // km
  GRILLE_AR_MAD_MIN: 70,              // km minimum
  GRILLE_AR_MAD_MAX: 600,             // km
  GRILLE_AR_SANS_MAD_MIN: 100,        // km minimum
  GRILLE_AR_SANS_MAD_MAX: 500,        // km

  // Suppléments jours > 6
  SUPPLEMENT_JOUR_MAD: 800,           // € par jour supplémentaire
  SUPPLEMENT_JOUR_SANS_MAD: 600,      // € par jour supplémentaire
} as const

// =============================================
// TYPES INFOS TRAJET
// =============================================

type ServiceType = 'aller_simple' | 'ar_1j' | 'ar_mad' | 'ar_sans_mad'
type AmplitudeType = '8h' | '10h' | '12h' | '9h_coupure'

interface InfosTrajet {
  tempsConduiteAller: number
  tempsConduiteRetour: number
  tempsConduiteAR: number
  tempsTotalAller: number
  tempsTotalRetour: number
  pausesAller: number
  pausesRetour: number
  pausesAR: number
  amplitudeJournee: number | null
  tempsAttenteSurPlace: number
  estMemeJour: boolean
  nbJoursVoyage: number
  conduiteNuit: boolean
  dureeConduiteNuit: number
  pauseNuitRequise: boolean
  nbChauffeurs: number
  raisonDeuxChauffeurs: string
  besoinCoupure3h: boolean
  reposCompletSurPlace: boolean
  coutRelaisChauffeur: number
}

/**
 * Calcule toutes les informations du trajet selon la réglementation complète
 * @param tempsConduiteAllerApi - Temps de conduite aller fourni par Geoapify (mode bus), en heures
 * @param nombreCars - Nombre de cars (minimum 1 chauffeur par car)
 */
function calculerInfosTrajet(
  distanceKm: number,
  heureDepart: string | null,
  heureRetour: string | null = null,
  dateDepart: string | null = null,
  dateRetour: string | null = null,
  typeService: ServiceType = 'aller_simple',
  tempsConduiteAllerApi: number | null = null,
  nombreCars: number = 1
): InfosTrajet {
  const R = REGLES_CHAUFFEUR

  // Temps de conduite en heures - utiliser l'API Geoapify si disponible, sinon calcul manuel
  const tempsConduiteAller = tempsConduiteAllerApi ?? (distanceKm / R.VITESSE_MOYENNE_AUTOCAR) * R.COEF_TEMPS_AUTOCAR
  const tempsConduiteRetour = tempsConduiteAller // On suppose le même temps pour le retour
  const tempsConduiteAR = tempsConduiteAller + tempsConduiteRetour

  // Pauses (45 min toutes les 4h30)
  const pausesAller = Math.floor(tempsConduiteAller / R.CONDUITE_CONTINUE_MAX_JOUR)
  const pausesRetour = Math.floor(tempsConduiteRetour / R.CONDUITE_CONTINUE_MAX_JOUR)
  const pausesAR = pausesAller + pausesRetour

  // Temps total avec pauses
  const tempsTotalAller = tempsConduiteAller + (pausesAller * R.PAUSE_OBLIGATOIRE / 60)
  const tempsTotalRetour = tempsConduiteRetour + (pausesRetour * R.PAUSE_OBLIGATOIRE / 60)

  // Nombre de jours
  let nbJoursVoyage = 1
  let estMemeJour = true
  if (dateDepart && dateRetour) {
    const d1 = new Date(dateDepart)
    const d2 = new Date(dateRetour)
    nbJoursVoyage = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1
    estMemeJour = d1.getTime() === d2.getTime()
  }

  // Amplitude et temps d'attente
  let amplitudeJournee: number | null = null
  let tempsAttenteSurPlace = 0
  let minutesArriveeDestination = 0

  if (heureDepart) {
    const [h, m] = heureDepart.split(':').map(Number)
    const minutesDepart = h * 60 + m
    minutesArriveeDestination = minutesDepart + Math.round(tempsTotalAller * 60)
  }

  if (heureDepart && heureRetour) {
    const [hDep, mDep] = heureDepart.split(':').map(Number)
    const [hRet, mRet] = heureRetour.split(':').map(Number)
    const minutesDepartMatin = hDep * 60 + mDep
    let minutesDepartRetour = hRet * 60 + mRet

    if (!estMemeJour && dateDepart && dateRetour) {
      const d1 = new Date(dateDepart)
      const d2 = new Date(dateRetour)
      const diffJours = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
      minutesDepartRetour += diffJours * 24 * 60
    }

    const minutesRetourDepot = minutesDepartRetour + Math.round(tempsTotalRetour * 60)

    tempsAttenteSurPlace = (minutesDepartRetour - minutesArriveeDestination) / 60
    if (tempsAttenteSurPlace < 0) tempsAttenteSurPlace = 0

    if (typeService === 'ar_1j' || estMemeJour) {
      amplitudeJournee = (minutesRetourDepot - minutesDepartMatin) / 60
    }
  }

  // Conduite de nuit
  let conduiteNuit = false
  let dureeConduiteNuit = 0
  if (heureDepart) {
    const [h] = heureDepart.split(':').map(Number)
    if (h >= 22 || h < 6) {
      conduiteNuit = true
      if (h >= 22) dureeConduiteNuit = Math.min(tempsConduiteAller, 6 + (24 - h))
      else dureeConduiteNuit = Math.min(tempsConduiteAller, 6 - h)
    }
  }

  // Calcul nombre de chauffeurs
  let nbChauffeurs = 1
  let raisonDeuxChauffeurs = ''
  let besoinCoupure3h = false
  let reposCompletSurPlace = false

  // Repos ≥ 9h = compteur RAZ
  if (tempsAttenteSurPlace >= R.REPOS_REDUIT_MIN) {
    reposCompletSurPlace = true
    const amplitudeAller = tempsTotalAller
    const amplitudeRetour = tempsTotalRetour

    if (amplitudeAller > R.AMPLITUDE_MAX_1_CHAUFFEUR || amplitudeRetour > R.AMPLITUDE_MAX_1_CHAUFFEUR) {
      nbChauffeurs = 2
      raisonDeuxChauffeurs = `Un trajet dépasse 12h d'amplitude`
    } else if (tempsConduiteAller > R.CONDUITE_MAX_JOUR_EXTENSION || tempsConduiteRetour > R.CONDUITE_MAX_JOUR_EXTENSION) {
      nbChauffeurs = 2
      const maxConduite = Math.max(tempsConduiteAller, tempsConduiteRetour)
      raisonDeuxChauffeurs = `Conduite ${maxConduite.toFixed(1)}h > 10h max par trajet`
    }
  } else {
    // Pas de repos complet
    if (amplitudeJournee) {
      if (amplitudeJournee > R.AMPLITUDE_MAX_AVEC_COUPURE) {
        nbChauffeurs = 2
        raisonDeuxChauffeurs = `Amplitude ${amplitudeJournee.toFixed(1)}h > 14h max`
      } else if (amplitudeJournee > R.AMPLITUDE_MAX_1_CHAUFFEUR) {
        if (tempsAttenteSurPlace >= R.COUPURE_MIN_POUR_14H) {
          besoinCoupure3h = true
          raisonDeuxChauffeurs = `Amplitude ${amplitudeJournee.toFixed(1)}h — Coupure ${tempsAttenteSurPlace.toFixed(1)}h sur place ✓`
        } else {
          nbChauffeurs = 2
          raisonDeuxChauffeurs = `Amplitude ${amplitudeJournee.toFixed(1)}h et coupure ${tempsAttenteSurPlace.toFixed(1)}h < 3h`
        }
      }
    }

    // Vérifier temps de conduite
    if (typeService === 'ar_1j' || estMemeJour) {
      if (tempsConduiteAR > R.CONDUITE_MAX_JOUR_EXTENSION) {
        nbChauffeurs = 2
        raisonDeuxChauffeurs = `Conduite ${tempsConduiteAR.toFixed(1)}h > 10h max/jour`
      } else if (tempsConduiteAR > R.CONDUITE_MAX_JOUR && nbChauffeurs === 1 && !raisonDeuxChauffeurs) {
        raisonDeuxChauffeurs = `Conduite ${tempsConduiteAR.toFixed(1)}h (extension 10h utilisée)`
      }
    }
  }

  // Pour aller simple ou AR multi-jours sans horaires
  if (!heureDepart && !heureRetour) {
    if (typeService === 'aller_simple') {
      if (tempsConduiteAller > R.CONDUITE_MAX_JOUR_EXTENSION) {
        nbChauffeurs = 2
        raisonDeuxChauffeurs = `Conduite ${tempsConduiteAller.toFixed(1)}h > 10h max`
      }
    } else if (typeService === 'ar_1j') {
      if (tempsConduiteAR > R.CONDUITE_MAX_JOUR_EXTENSION) {
        nbChauffeurs = 2
        raisonDeuxChauffeurs = `Conduite AR ${tempsConduiteAR.toFixed(1)}h > 10h max`
      }
    } else {
      // AR multi-jours
      if (tempsConduiteAller > R.CONDUITE_MAX_JOUR_EXTENSION) {
        nbChauffeurs = 2
        raisonDeuxChauffeurs = `Conduite aller ${tempsConduiteAller.toFixed(1)}h > 10h max par jour`
      }
    }
  }

  const pauseNuitRequise = conduiteNuit && dureeConduiteNuit > 3

  // Multiplier par le nombre de cars
  // nbChauffeurs représente le nombre de chauffeurs PAR CAR
  // Le total est nbChauffeurs * nombreCars
  const nbChauffeursParCar = nbChauffeurs
  const nbChauffeursTotaux = nbChauffeursParCar * nombreCars

  // Mettre à jour la raison si plusieurs cars
  if (nombreCars > 1) {
    if (raisonDeuxChauffeurs) {
      raisonDeuxChauffeurs = `${raisonDeuxChauffeurs} (${nbChauffeursTotaux} chauffeurs pour ${nombreCars} cars)`
    } else {
      raisonDeuxChauffeurs = `${nbChauffeursTotaux} chauffeurs pour ${nombreCars} cars`
    }
  }

  // Coût relais chauffeur (par car, si 2 chauffeurs par car)
  let coutRelaisChauffeur = 0
  let nbTransferts = 0
  if (nbChauffeursParCar === 2) {
    if (typeService === 'aller_simple' || typeService === 'ar_1j') {
      nbTransferts = 1 * nombreCars
    } else {
      nbTransferts = 2 * nombreCars
    }
    coutRelaisChauffeur = nbTransferts * R.COUT_RELAIS_CHAUFFEUR
  }

  return {
    tempsConduiteAller,
    tempsConduiteRetour,
    tempsConduiteAR,
    tempsTotalAller,
    tempsTotalRetour,
    pausesAller,
    pausesRetour,
    pausesAR,
    amplitudeJournee,
    tempsAttenteSurPlace,
    estMemeJour,
    nbJoursVoyage,
    conduiteNuit,
    dureeConduiteNuit,
    pauseNuitRequise,
    nbChauffeurs: nbChauffeursTotaux, // Total pour tous les cars
    raisonDeuxChauffeurs,
    besoinCoupure3h,
    reposCompletSurPlace,
    coutRelaisChauffeur,
  }
}

/**
 * Détermine la colonne de grille AR 1J à utiliser selon l'amplitude
 */
function determinerAmplitudeGrille(amplitudeHeures: number): AmplitudeType {
  if (amplitudeHeures <= 8) return '8h'
  if (amplitudeHeures <= 10) return '10h'
  if (amplitudeHeures <= 12) return '12h'
  return '9h_coupure'
}

// =============================================
// FONCTIONS DÉPARTEMENT ET MAJORATIONS
// =============================================

interface MajorationRegion {
  region_code: string
  region_nom: string
  majoration_percent: number
  grande_capacite_dispo: boolean
}

/**
 * Extrait le département d'une ville avec code postal
 * Format attendu: "Paris (75001)" ou "Lyon (69001)"
 */
function extraireDepartement(villeAvecCP: string | null | undefined): string | null {
  if (!villeAvecCP) return null

  const match = villeAvecCP.match(/\((\d{2,5})\)/)
  if (match) {
    const cp = match[1]
    if (cp.length === 5) {
      const dept = cp.substring(0, 2)
      // Cas spéciaux Corse
      if (dept === '20') {
        return cp.substring(0, 3) === '201' ? '2A' : '2B'
      }
      return dept
    }
    return cp.substring(0, 2)
  }
  return null
}

/**
 * Charge les majorations régionales depuis la DB
 */
async function chargerMajorationsRegions(supabase: any): Promise<MajorationRegion[]> {
  try {
    const { data, error } = await supabase
      .from('majorations_regions')
      .select('region_code, region_nom, majoration_percent, grande_capacite_dispo')
      .eq('is_active', true)

    if (error) {
      console.error('Erreur chargement majorations régions:', error)
      return []
    }

    return (data || []).map((d: any) => ({
      region_code: d.region_code,
      region_nom: d.region_nom,
      majoration_percent: parseFloat(String(d.majoration_percent)) || 0,
      grande_capacite_dispo: d.grande_capacite_dispo ?? true,
    }))
  } catch (err) {
    console.error('Erreur chargement majorations régions:', err)
    return []
  }
}

/**
 * Obtient la majoration pour un département donné
 */
function getMajorationPourDepartement(
  dept: string | null,
  majorations: MajorationRegion[]
): { majorationPercent: number; regionNom: string | null } {
  if (!dept) return { majorationPercent: 0, regionNom: null }

  const region = majorations.find(m => m.region_code === dept)
  if (region) {
    return {
      majorationPercent: region.majoration_percent,
      regionNom: region.region_nom,
    }
  }

  return { majorationPercent: 0, regionNom: null }
}

// =============================================
// FONCTIONS GEOAPIFY
// =============================================

/**
 * Géocode une ville/adresse via Geoapify
 * @param city Nom de la ville
 * @param countryCode Code pays pour filtrer (ex: 'fr', 'es', 'de') - par défaut 'fr'
 * @param lang Langue pour les résultats - par défaut 'fr'
 */
async function geocodeCity(city: string, countryCode: string = 'fr', lang: string = 'fr'): Promise<GeoCoords | null> {
  if (!city) return null

  try {
    // Construire l'URL avec filtre de pays si spécifié
    const filterParam = countryCode ? `&filter=countrycode:${countryCode}` : ''
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)}&lang=${lang}&limit=1${filterParam}&apiKey=${GEOAPIFY_API_KEY}`
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const coords = data.features[0].geometry.coordinates
      return { lat: coords[1], lon: coords[0] }
    }
    return null
  } catch (error) {
    console.error('Erreur géocodage:', error)
    return null
  }
}

interface RouteResult {
  distanceKm: number
  tempsConduiteHeures: number
}

/**
 * Calcule la distance et le temps de trajet entre deux villes via Geoapify Routing API (mode bus)
 * @param departure Ville de départ
 * @param arrival Ville d'arrivée
 * @param countryCode Code pays pour le géocodage (ex: 'fr', 'es', 'de') - par défaut 'fr'
 */
async function calculateRoute(departure: string, arrival: string, countryCode: string = 'fr'): Promise<RouteResult | null> {
  if (!departure || !arrival) return null

  try {
    // Géocoder les deux villes avec le code pays
    const [depCoords, arrCoords] = await Promise.all([
      geocodeCity(departure, countryCode, countryCode),
      geocodeCity(arrival, countryCode, countryCode),
    ])

    if (!depCoords || !arrCoords) {
      console.log(`Impossible de géocoder: ${departure} ou ${arrival}`)
      return null
    }

    // Appel API Routing avec mode bus (autocar)
    const response = await fetch(
      `https://api.geoapify.com/v1/routing?waypoints=${depCoords.lat},${depCoords.lon}|${arrCoords.lat},${arrCoords.lon}&mode=bus&apiKey=${GEOAPIFY_API_KEY}`
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const route = data.features[0]
      // Distance en mètres -> convertir en km
      const distanceKm = Math.round(route.properties.distance / 1000)
      // Temps en secondes -> convertir en heures
      const tempsConduiteHeures = route.properties.time / 3600

      console.log(`Route Geoapify (mode bus): ${distanceKm} km, ${tempsConduiteHeures.toFixed(2)}h`)

      return { distanceKm, tempsConduiteHeures }
    }

    return null
  } catch (error) {
    console.error('Erreur calcul route:', error)
    return null
  }
}

// =============================================
// FONCTIONS TARIFICATION
// =============================================

/**
 * Calculer le prix depuis les grilles tarifaires
 * Retourne le prix TTC final ou null si pas de tarif trouvé
 */
function calculatePriceFromGrid(
  km: number,
  serviceType: string,
  amplitude: string | null,
  dureeJours: number,
  vehicleType: string,
  nombreCars: number,
  tarifs: {
    allerSimple: TarifAllerSimple[]
    ar1j: TarifAR1J[]
    arMad: TarifARMAD[]
    arSansMad: TarifARSansMAD[]
  },
  capacites: CapaciteVehicule[]
): number | null {
  if (km <= 0) return null

  // Coefficient véhicule
  const coeff = capacites.find(c => c.code === vehicleType)?.coefficient || 1

  let prixBase = 0

  if (serviceType === 'aller_simple') {
    const tarif = tarifs.allerSimple.find(t => km >= t.km_min && km <= t.km_max)
    if (tarif) prixBase = Number(tarif.prix_public)
  } else if (serviceType === 'ar_1j') {
    const tarif = tarifs.ar1j.find(t => km >= t.km_min && km <= t.km_max)
    if (tarif) {
      const amplitudeKey = `prix_${amplitude || '12h'}` as keyof TarifAR1J
      prixBase = Number(tarif[amplitudeKey]) || Number(tarif.prix_12h) || Number(tarif.prix_8h) || 0
    }
  } else if (serviceType === 'ar_mad') {
    const tarif = tarifs.arMad.find(t => km >= t.km_min && km <= t.km_max)
    if (tarif) {
      const supplementParJour = Number(tarif.supplement_jour) || 800

      if (dureeJours > 6) {
        prixBase = (Number(tarif.prix_6j) || 0) + (dureeJours - 6) * supplementParJour
      } else {
        // Chercher le prix pour ce nombre de jours
        const prixDirects: Record<number, number> = {
          2: Number(tarif.prix_2j) || 0,
          3: Number(tarif.prix_3j) || 0,
          4: Number(tarif.prix_4j) || 0,
          5: Number(tarif.prix_5j) || 0,
          6: Number(tarif.prix_6j) || 0,
        }
        prixBase = prixDirects[dureeJours] || 0

        // Si pas de prix pour ce nombre de jours, chercher le dernier prix disponible et ajouter les suppléments
        if (!prixBase) {
          let dernierJourDispo = 0
          let dernierPrix = 0
          for (let j = dureeJours - 1; j >= 2; j--) {
            if (prixDirects[j] > 0) {
              dernierJourDispo = j
              dernierPrix = prixDirects[j]
              break
            }
          }
          if (dernierPrix > 0) {
            prixBase = dernierPrix + (dureeJours - dernierJourDispo) * supplementParJour
          }
        }
      }
    }
  } else if (serviceType === 'ar_sans_mad') {
    // RÈGLE: Si distance < 100 km, calculer sur base tarif aller simple × 2
    // Mais générer UN SEUL devis AR sans MAD (le client ne voit pas le calcul interne)
    const SEUIL_AR_SANS_MAD = 100
    if (km < SEUIL_AR_SANS_MAD) {
      // Chercher le prix aller simple dans la grille et multiplier par 2
      const tarifAS = tarifs.allerSimple.find(t => km >= t.km_min && km <= t.km_max)
      if (tarifAS) {
        // Prix = tarif aller simple × 2 (mais UN SEUL devis pour le client)
        prixBase = Number(tarifAS.prix_public) * 2
        console.log(`AR sans MAD < 100km: tarif aller simple ${tarifAS.prix_public}€ × 2 = ${prixBase}€`)
      } else {
        // Fallback: si pas de tarif aller simple, retourner null
        console.log(`AR sans MAD < 100km: pas de tarif aller simple trouvé pour ${km}km`)
        return null
      }
    } else {
      const tarif = tarifs.arSansMad.find(t => km >= t.km_min && km <= t.km_max)
      if (tarif) {
        const supplementParJour = Number(tarif.supplement_jour) || 600

        if (dureeJours > 6) {
          prixBase = (Number(tarif.prix_6j) || 0) + (dureeJours - 6) * supplementParJour
        } else {
          // Chercher le prix pour ce nombre de jours
          const prixDirects: Record<number, number> = {
            2: Number(tarif.prix_2j) || 0,
            3: Number(tarif.prix_3j) || 0,
            4: Number(tarif.prix_4j) || 0,
            5: Number(tarif.prix_5j) || 0,
            6: Number(tarif.prix_6j) || 0,
          }
          prixBase = prixDirects[dureeJours] || 0

          // Si pas de prix pour ce nombre de jours, chercher le dernier prix disponible et ajouter les suppléments
          if (!prixBase) {
            let dernierJourDispo = 0
            let dernierPrix = 0
            for (let j = dureeJours - 1; j >= 2; j--) {
              if (prixDirects[j] > 0) {
                dernierJourDispo = j
                dernierPrix = prixDirects[j]
                break
              }
            }
            if (dernierPrix > 0) {
              prixBase = dernierPrix + (dureeJours - dernierJourDispo) * supplementParJour
            }
          }
        }
      }
    }
  }

  if (prixBase <= 0) return null

  // Prix TTC final (grille contient TTC)
  return Math.round(prixBase * coeff * nombreCars)
}

/**
 * Détecter le type de service depuis le dossier
 */
function detectServiceType(dossier: any): string {
  const tripMode = dossier.trip_mode
  if (tripMode === 'one-way') return 'aller_simple'
  if (tripMode === 'circuit') return 'ar_mad'

  if (dossier.return_date && dossier.departure_date) {
    const depDate = new Date(dossier.departure_date)
    const retDate = new Date(dossier.return_date)
    const diffDays = Math.ceil((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'ar_1j'
    return 'ar_sans_mad'
  }

  return 'ar_1j'
}

/**
 * Calculer la durée en jours
 */
function calculateDureeJours(dossier: any): number {
  if (!dossier.return_date || !dossier.departure_date) return 1
  const depDate = new Date(dossier.departure_date)
  const retDate = new Date(dossier.return_date)
  const diffDays = Math.ceil((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays + 1)
}

/**
 * Générer une référence de devis
 */
function generateDevisReference(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `DEV-${year}${month}-${random}`
}

/**
 * Vérifie si le dossier nécessite une révision manuelle
 * Retourne null si OK, sinon la raison
 */
function checkRequiresManualReview(dossier: any): string | null {
  const departure = (dossier.departure || '').toLowerCase()
  const arrival = (dossier.arrival || '').toLowerCase()
  const specialRequests = (dossier.special_requests || '').toLowerCase()
  const notes = (dossier.notes || '').toLowerCase()
  const tripMode = dossier.trip_mode

  // 1. Même ville de départ et d'arrivée (rotations/navettes intra-ville)
  if (departure && arrival) {
    // Extraire le nom de ville (avant la virgule ou le code postal)
    const depCity = departure.split(',')[0].split('(')[0].trim()
    const arrCity = arrival.split(',')[0].split('(')[0].trim()
    if (depCity === arrCity) {
      return 'Même ville départ/arrivée - Rotations ou navettes intra-ville'
    }
  }

  // 2. Mots-clés indiquant des rotations ou MAD complexe
  const keywords = ['rotation', 'navette', 'shuttle', 'mise à disposition', 'mise a disposition',
                    'mad', 'transfert multiple', 'plusieurs trajets', 'aller-retour multiple',
                    'circuit', 'tournée', 'plusieurs arrêts', 'etapes', 'étapes']

  const textToCheck = `${specialRequests} ${notes}`
  for (const keyword of keywords) {
    if (textToCheck.includes(keyword)) {
      return `Mots-clés détectés: "${keyword}" - Prestation complexe`
    }
  }

  // 3. Mode circuit avec plusieurs jours
  if (tripMode === 'circuit') {
    return 'Mode circuit - Mise à disposition avec itinéraire personnalisé'
  }

  return null
}

// =============================================
// HANDLER PRINCIPAL
// =============================================

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier que la clé API est configurée
    if (!GEOAPIFY_API_KEY) {
      console.error('GEOAPIFY_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Service non configuré' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Récupérer les paramètres (optionnel: forcer un dossier spécifique)
    let forceDossierId: string | null = null
    let dryRun = false

    try {
      const body = await req.json()
      forceDossierId = body?.dossier_id || null
      dryRun = body?.dry_run || false
    } catch {
      // Pas de body JSON
    }

    // Charger les grilles tarifaires et majorations régionales
    const [resAS, resAR1J, resARMAD, resARSansMAD, resCapacites, majorationsRegions] = await Promise.all([
      supabase.from('tarifs_aller_simple').select('*').order('km_min'),
      supabase.from('tarifs_ar_1j').select('*').order('km_min'),
      supabase.from('tarifs_ar_mad').select('*').order('km_min'),
      supabase.from('tarifs_ar_sans_mad').select('*').order('km_min'),
      supabase.from('capacites_vehicules').select('code, coefficient, places_min, places_max'),
      chargerMajorationsRegions(supabase),
    ])

    const tarifs = {
      allerSimple: resAS.data || [],
      ar1j: resAR1J.data || [],
      arMad: resARMAD.data || [],
      arSansMad: resARSansMAD.data || [],
    }
    const capacites = resCapacites.data || []

    console.log(`Majorations régionales chargées: ${majorationsRegions.length} départements`)

    // Récupérer les dossiers avec auto-devis actifs et prêts
    let query = supabase
      .from('dossiers_auto_devis')
      .select(`
        *,
        workflow:workflow_devis_auto(*),
        dossier:dossiers(*)
      `)
      .eq('is_active', true)
      .lte('next_devis_at', new Date().toISOString())

    if (forceDossierId) {
      query = query.eq('dossier_id', forceDossierId)
    }

    const { data: autoDevisList, error: fetchError } = await query

    if (fetchError) {
      throw new Error(`Erreur récupération auto-devis: ${fetchError.message}`)
    }

    const results: any[] = []

    for (const autoDevis of autoDevisList || []) {
      const workflow = autoDevis.workflow
      const dossier = autoDevis.dossier
      const steps = (workflow?.steps as WorkflowStep[]) || []
      const currentStep = autoDevis.current_step || 0

      if (!dossier || !workflow || currentStep >= steps.length) {
        // Workflow terminé ou données manquantes
        if (currentStep >= steps.length && !dryRun) {
          await supabase
            .from('dossiers_auto_devis')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', autoDevis.id)
        }
        continue
      }

      const step = steps[currentStep]
      const margePercent = step.marge_percent

      // Vérifier si le dossier nécessite une révision manuelle
      const manualReviewReason = checkRequiresManualReview(dossier)
      if (manualReviewReason) {
        console.log(`Dossier ${dossier.reference}: nécessite révision manuelle - ${manualReviewReason}`)

        // Flagger le dossier pour révision manuelle
        if (!dryRun) {
          await supabase
            .from('dossiers')
            .update({
              requires_manual_review: true,
              manual_review_reason: manualReviewReason,
            })
            .eq('id', dossier.id)

          // Désactiver l'auto-devis pour ce dossier
          await supabase
            .from('dossiers_auto_devis')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', autoDevis.id)
        }

        results.push({
          dossier_id: dossier.id,
          reference: dossier.reference,
          status: 'flagged_manual',
          reason: manualReviewReason,
        })
        continue
      }

      // Récupérer les villes de départ et d'arrivée
      const departure = dossier.departure || ''
      const arrival = dossier.arrival || ''

      if (!departure || !arrival) {
        console.log(`Dossier ${dossier.reference}: villes manquantes (départ: ${departure}, arrivée: ${arrival})`)

        // Flagger aussi pour révision manuelle
        if (!dryRun) {
          await supabase
            .from('dossiers')
            .update({
              requires_manual_review: true,
              manual_review_reason: 'Villes de départ ou arrivée manquantes',
            })
            .eq('id', dossier.id)
        }

        results.push({
          dossier_id: dossier.id,
          reference: dossier.reference,
          status: 'flagged_manual',
          reason: 'missing_cities',
        })
        continue
      }

      // Calculer la distance et le temps via Geoapify (mode bus)
      console.log(`Calcul route: ${departure} -> ${arrival}`)
      const routeResult = await calculateRoute(departure, arrival)

      if (!routeResult || routeResult.distanceKm <= 0) {
        console.log(`Pas de route calculée pour dossier ${dossier.reference}`)

        // Flagger pour révision manuelle
        if (!dryRun) {
          await supabase
            .from('dossiers')
            .update({
              requires_manual_review: true,
              manual_review_reason: `Distance non calculable: ${departure} → ${arrival}`,
            })
            .eq('id', dossier.id)
        }

        results.push({
          dossier_id: dossier.id,
          reference: dossier.reference,
          status: 'flagged_manual',
          reason: 'distance_calculation_failed',
          departure,
          arrival,
        })
        continue
      }

      // Extraire distance et temps de conduite du résultat Geoapify
      const km = routeResult.distanceKm
      const tempsConduiteGeoapify = routeResult.tempsConduiteHeures

      console.log(`Route calculée: ${km} km, temps conduite: ${tempsConduiteGeoapify.toFixed(2)}h`)

      const serviceType = detectServiceType(dossier) as ServiceType
      const dureeJours = calculateDureeJours(dossier)
      // Déterminer le type de véhicule automatiquement selon le nombre de passagers
      const passengers = dossier.passengers || 50
      const vehicleTypeInitial = dossier.vehicle_type || determinerTypeVehicule(passengers, capacites)

      // CALCUL DYNAMIQUE DU NOMBRE DE CARS
      // Pour > 90 passagers : obligatoirement plusieurs cars de 50 places
      const carsInfo = calculateNumberOfCars(passengers, vehicleTypeInitial)
      const nombreCars = carsInfo.nombreCars
      const vehicleType = carsInfo.vehicleTypeEffectif // Peut changer si > 90 pax

      // Récupérer les horaires du dossier (si disponibles)
      const heureDepart = dossier.departure_time || null
      const heureRetour = dossier.return_time || null
      const dateDepart = dossier.departure_date || null
      const dateRetour = dossier.return_date || null

      // Calculer les infos trajet complètes selon la réglementation
      // Utilise le temps de conduite Geoapify (mode bus) au lieu du calcul manuel
      // PASSE LE NOMBRE DE CARS pour adapter le nombre de chauffeurs
      const infosTrajet = calculerInfosTrajet(
        km,
        heureDepart,
        heureRetour,
        dateDepart,
        dateRetour,
        serviceType,
        tempsConduiteGeoapify,
        nombreCars // NOUVEAU: passe le nombre de cars
      )

      const nbChauffeurs = infosTrajet.nbChauffeurs
      const coutRelaisChauffeur = infosTrajet.coutRelaisChauffeur

      // Déterminer l'amplitude pour la grille AR 1J
      let amplitude: AmplitudeType = '12h'
      if (serviceType === 'ar_1j' && infosTrajet.amplitudeJournee) {
        amplitude = determinerAmplitudeGrille(infosTrajet.amplitudeJournee)
      }

      // Calculer la majoration régionale
      const departement = extraireDepartement(dossier.departure)
      const majorationInfo = getMajorationPourDepartement(departement, majorationsRegions)
      const majorationRegionDecimal = majorationInfo.majorationPercent / 100

      console.log(`Service: ${serviceType}, Durée: ${dureeJours}j, Véhicule: ${vehicleType}, Passagers: ${passengers}, Cars: ${nombreCars}, Chauffeurs: ${nbChauffeurs}`)
      if (infosTrajet.amplitudeJournee) {
        console.log(`  -> Amplitude journée: ${infosTrajet.amplitudeJournee.toFixed(1)}h, Grille: ${amplitude}`)
      }
      if (nbChauffeurs > 1 || nombreCars > 1) {
        console.log(`  -> ${nbChauffeurs} chauffeur(s): ${infosTrajet.raisonDeuxChauffeurs || `${nbChauffeurs} chauffeurs pour ${nombreCars} car(s)`}, coût relais: ${coutRelaisChauffeur}€`)
      }
      if (majorationInfo.majorationPercent > 0) {
        console.log(`  -> Majoration région ${majorationInfo.regionNom}: +${majorationInfo.majorationPercent}%`)
      }

      const priceResult = calculatePriceFromGrid(
        km,
        serviceType,
        amplitude,
        dureeJours,
        vehicleType,
        nombreCars,
        tarifs,
        capacites
      )

      if (!priceResult) {
        console.log(`Pas de prix trouvé pour dossier ${dossier.reference} (km: ${km}, service: ${serviceType}, jours: ${dureeJours})`)

        // Flagger pour révision manuelle
        if (!dryRun) {
          await supabase
            .from('dossiers')
            .update({
              requires_manual_review: true,
              manual_review_reason: `Prix non trouvé: ${km}km, ${serviceType}, ${dureeJours}j`,
            })
            .eq('id', dossier.id)
        }

        results.push({
          dossier_id: dossier.id,
          reference: dossier.reference,
          status: 'flagged_manual',
          reason: 'no_price_found',
          km,
          serviceType,
          dureeJours,
        })
        continue
      }

      // priceResult est maintenant directement le prix TTC (number)
      // Pour AR sans MAD < 100km, le prix est déjà calculé comme aller simple × 2
      const prixTTC = priceResult

      // Calculer le prix d'achat (retirer la marge de 30% incluse dans le prix public)
      const MARGE_GRILLE = 0.30 // 30% de marge dans le prix public
      const prixAchatTTC = Math.round(prixTTC / (1 + MARGE_GRILLE))

      // Ajouter le coût du relais chauffeur au prix d'achat (si 2 chauffeurs)
      const prixAchatAvecChauffeurs = prixAchatTTC + coutRelaisChauffeur

      // Appliquer la marge du workflow sur le prix d'achat (avec coût chauffeurs)
      const prixAvantMajoration = Math.round(prixAchatAvecChauffeurs * (1 + margePercent / 100))

      // Appliquer la majoration régionale
      const prixTTCAvecMarge = Math.round(prixAvantMajoration * (1 + majorationRegionDecimal))

      // Calculer le prix HT selon le taux TVA du pays
      const tvaRate = getTvaRate(dossier.country_code)
      const prixHT = Math.round(prixTTCAvecMarge / (1 + tvaRate / 100) * 100) / 100

      console.log(`Prix grille: ${prixTTC}€, Prix achat: ${prixAchatTTC}€, Relais chauffeur: ${coutRelaisChauffeur}€, Marge ${margePercent}%: ${prixAvantMajoration}€`)
      console.log(`  -> TVA ${tvaRate}% (pays: ${dossier.country_code || 'FR'}), Prix HT: ${prixHT}€, Prix TTC: ${prixTTCAvecMarge}€`)
      if (majorationRegionDecimal > 0) {
        console.log(`  -> Avec majoration région +${majorationInfo.majorationPercent}%: ${prixTTCAvecMarge}€ TTC`)
      }

      if (dryRun) {
        results.push({
          dossier_id: dossier.id,
          reference: dossier.reference,
          status: 'dry_run',
          step: currentStep + 1,
          marge: margePercent,
          km,
          passengers,
          serviceType,
          dureeJours,
          amplitude_journee: infosTrajet.amplitudeJournee,
          amplitude_grille: amplitude,
          nombre_cars: nombreCars,
          nb_chauffeurs: nbChauffeurs,
          cout_relais_chauffeur: coutRelaisChauffeur,
          raison_chauffeurs: infosTrajet.raisonDeuxChauffeurs || null,
          majoration_region_percent: majorationInfo.majorationPercent,
          majoration_region_nom: majorationInfo.regionNom,
          prix_grille_ttc: prixTTC,
          prix_achat_ttc: prixAchatTTC,
          prix_achat_avec_chauffeurs: prixAchatAvecChauffeurs,
          prix_avant_majoration: prixAvantMajoration,
          prix_final_ttc: prixTTCAvecMarge,
          prix_final_ht: prixHT,
          tva_rate: tvaRate,
          country_code: dossier.country_code || 'FR',
        })
        continue
      }

      // Créer UN SEUL devis (même pour AR sans MAD < 100km, le prix est calculé en interne comme aller simple × 2)
      const transporteurId = TRANSPORTEURS_AUTO[currentStep % TRANSPORTEURS_AUTO.length]
      const devisGeneres = autoDevis.devis_generes || []

      const devisRef = generateDevisReference()

      const { data: newDevis, error: devisError } = await supabase
        .from('devis')
        .insert({
          reference: devisRef,
          dossier_id: dossier.id,
          transporteur_id: transporteurId,
          price_ht: prixHT,
          price_ttc: prixTTCAvecMarge,
          price_achat_ttc: prixAchatTTC,
          tva_rate: tvaRate,
          km: km.toString(),
          vehicle_type: vehicleType,
          nombre_cars: nombreCars,
          nombre_chauffeurs: nbChauffeurs,
          service_type: serviceType,
          amplitude: amplitude,
          duree_jours: dureeJours,
          status: 'sent',
          sent_at: new Date().toISOString(),
          is_auto_generated: true,
          auto_workflow_id: workflow.id,
          workflow_step: currentStep + 1,
          validity_days: 7,
          notes: `Devis auto-généré - Étape ${currentStep + 1}/${steps.length} - Marge ${margePercent}%${nombreCars > 1 ? ` - ${nombreCars} cars` : ''}${nbChauffeurs > 1 ? ` - ${nbChauffeurs} chauffeurs` : ''}`,
        })
        .select()
        .single()

      if (devisError) {
        console.error(`Erreur création devis pour ${dossier.reference}:`, devisError)
        results.push({
          dossier_id: dossier.id,
          reference: dossier.reference,
          status: 'error',
          error: devisError.message,
        })
        continue
      }

      devisGeneres.push({
        devis_id: newDevis.id,
        step: currentStep + 1,
        marge: margePercent,
        km,
        created_at: new Date().toISOString(),
      })

      // Timeline
      await supabase
        .from('timeline')
        .insert({
          dossier_id: dossier.id,
          type: 'devis_sent',
          content: `Devis auto ${devisRef} envoyé (${km} km, étape ${currentStep + 1}/${steps.length}, marge ${margePercent}%)`,
        })

      // Calculer la prochaine étape
      const nextStep = currentStep + 1
      let nextDevisAt: string | null = null

      if (nextStep < steps.length) {
        const nextStepData = steps[nextStep]
        nextDevisAt = new Date(Date.now() + nextStepData.delay_hours * 60 * 60 * 1000).toISOString()
      }

      // Mettre à jour l'auto-devis
      await supabase
        .from('dossiers_auto_devis')
        .update({
          current_step: nextStep,
          next_devis_at: nextDevisAt,
          devis_generes: devisGeneres,
          is_active: nextStep < steps.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', autoDevis.id)

      // Mettre à jour le statut du dossier vers "pending-client" (attente retour client)
      await supabase
        .from('dossiers')
        .update({
          status: 'pending-client',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dossier.id)

      results.push({
        dossier_id: dossier.id,
        reference: dossier.reference,
        devis_id: newDevis.id,
        devis_reference: devisRef,
        status: 'created',
        step: currentStep + 1,
        total_steps: steps.length,
        marge: margePercent,
        km,
        serviceType,
        dureeJours,
        prix_grille_ttc: prixTTC,
        prix_achat_ttc: prixAchatTTC,
        prix_final_ttc: prixTTCAvecMarge,
        prix_final_ht: prixHT,
        next_devis_at: nextDevisAt,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erreur process-auto-devis:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
