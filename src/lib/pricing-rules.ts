/**
 * Module de calcul des règles tarifaires et réglementaires pour le transport en autocar
 * Basé sur les règles légales françaises et la grille tarifaire Autocar Location
 *
 * Ce module gère :
 * - Les règles de temps de conduite vs amplitude (temps de travail)
 * - Les calculs de pauses obligatoires
 * - Le nombre de chauffeurs nécessaires
 * - Les majorations par région/département
 * - Les km hors grille (petits km et dépassements)
 * - La disponibilité des véhicules grande capacité par région
 */

import { supabase } from './supabase'

// =============================================
// CONSTANTES RÉGLEMENTAIRES
// =============================================

export const REGLES_CHAUFFEUR = {
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
// DÉPARTEMENTS PROBLÉMATIQUES (+5% rush auto)
// =============================================

export const DEPARTEMENTS_PROBLEMATIQUES = [
  // Autour Paris
  '27', '28', '60', '02', '51', '10', '89', '45',
  // Nord problématique
  '14', '50', '35', '76',
  // Bretagne très compliqué
  '29', '22', '56',
  // Nord Est compliqué
  '54', '68', '53', '72', '61', '37',
  // Centre Ouest impossible
  '49',
  // Centre Est problématique
  '39', '25', '70', '01',
  // Midi Est compliqué
  '38', '26', '42',
  // Sud Ouest compliqué
  '64', '65', '40', '47', '32',
  // Sud problématique
  '09', '11',
  // Sud Est moyen/problématique
  '30', '83', '84', '04', '05'
] as const

// =============================================
// DÉPARTEMENTS AVEC DOUBLE ÉTAGE DISPONIBLE
// =============================================

export const DEPARTEMENTS_DOUBLE_ETAGE = [
  // Nord
  '59', '62', '80',
  // Île-de-France et autour
  '75', '77', '78', '91', '92', '93', '94', '95',
  // Nord-Est
  '51', '54', '57', '67', '68',
  // Centre
  '37', '45',
  // Ouest
  '44',
  // Centre-Est / Rhône-Alpes
  '01', '38', '42', '63', '69', '73', '74',
  // Sud-Est
  '13', '26', '30', '34', '84',
  // Sud-Ouest
  '31', '33',
  // Autres
  '19'
] as const

// =============================================
// TARIFS HORS GRILLE
// =============================================

export const TARIFS_HORS_GRILLE = {
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
// TYPES
// =============================================

export type ServiceType = 'aller_simple' | 'ar_1j' | 'ar_mad' | 'ar_sans_mad'
export type AmplitudeType = '8h' | '10h' | '12h' | '9h_coupure'

export interface InfosTrajet {
  // Temps de conduite (en heures)
  tempsConduiteAller: number
  tempsConduiteRetour: number
  tempsConduiteAR: number

  // Temps total avec pauses (en heures)
  tempsTotalAller: number
  tempsTotalRetour: number

  // Pauses
  pausesAller: number
  pausesRetour: number
  pausesAR: number

  // Horaires estimés
  heureArrivee: string | null
  heureRetourArrivee: string | null

  // Amplitude
  amplitudeJournee: number | null
  tempsAttenteSurPlace: number

  // Jours
  estMemeJour: boolean
  nbJoursVoyage: number

  // Conduite de nuit
  conduiteNuit: boolean
  dureeConduiteNuit: number
  pauseNuitRequise: boolean

  // Chauffeurs
  nbChauffeurs: number
  raisonDeuxChauffeurs: string
  besoinCoupure3h: boolean
  reposCompletSurPlace: boolean
  coutRelaisChauffeur: number
}

export interface CalculTarifResult {
  // Prix
  prixBase: number
  prixBaseAvecHorsCadre: number
  prixVehicule: number
  prixFinal: number

  // Détails
  kmHorsCadre: number
  supplementHorsCadre: number
  supplementJours: number
  joursSupplementaires: number
  majorationAutoRegion: number
  majorationRushManuelle: number
  majorationTotale: number
  coutRelaisChauffeur: number

  // Infos
  coefficient: number
  nombreCars: number
  detailType: string
  amplitude: AmplitudeType | null
  maxGrille: number

  // Warnings
  warningTranche: {
    kmRestants: number
    trancheSuivante: string
    prixSuivant: number
  } | null

  // Erreur
  erreur: string | null

  // Infos chauffeur
  infosTrajet: InfosTrajet | null
}

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

/**
 * Extrait le département d'une ville avec code postal
 * Format attendu: "Paris (75001)" ou "Lyon (69001)"
 */
export function extraireDepartement(villeAvecCP: string | null | undefined): string | null {
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
 * Vérifie si le département est problématique (+5% auto)
 */
export function estDepartementProblematique(dept: string | null): boolean {
  if (!dept) return false
  return (DEPARTEMENTS_PROBLEMATIQUES as readonly string[]).includes(dept)
}

/**
 * Vérifie si le double étage est disponible dans ce département
 */
export function aDoubleEtageDispo(dept: string | null): boolean {
  if (!dept) return false
  return (DEPARTEMENTS_DOUBLE_ETAGE as readonly string[]).includes(dept)
}

// =============================================
// CALCUL DES INFOS TRAJET
// =============================================

/**
 * Calcule toutes les informations du trajet (temps, pauses, chauffeurs, etc.)
 */
export function calculerInfosTrajet(
  distanceKm: number,
  heureDepart: string | null,
  heureRetour: string | null = null,
  dateDepart: string | null = null,
  dateRetour: string | null = null,
  typeService: ServiceType = 'aller_simple',
  dureeReelleAllerMin: number | null = null,
  dureeReelleRetourMin: number | null = null
): InfosTrajet {
  const { REGLES_CHAUFFEUR: R } = { REGLES_CHAUFFEUR }

  // Temps de conduite en heures
  let tempsConduiteAller: number
  if (dureeReelleAllerMin !== null && dureeReelleAllerMin > 0) {
    const dureeHeures = dureeReelleAllerMin / 60
    const pausesEstimees = Math.floor(dureeHeures / 5.25)
    tempsConduiteAller = dureeHeures - (pausesEstimees * 0.75)
    if (tempsConduiteAller < dureeHeures * 0.8) tempsConduiteAller = dureeHeures * 0.85
  } else {
    tempsConduiteAller = (distanceKm / R.VITESSE_MOYENNE_AUTOCAR) * R.COEF_TEMPS_AUTOCAR
  }

  let tempsConduiteRetour: number
  if (dureeReelleRetourMin !== null && dureeReelleRetourMin > 0) {
    const dureeHeures = dureeReelleRetourMin / 60
    const pausesEstimees = Math.floor(dureeHeures / 5.25)
    tempsConduiteRetour = dureeHeures - (pausesEstimees * 0.75)
    if (tempsConduiteRetour < dureeHeures * 0.8) tempsConduiteRetour = dureeHeures * 0.85
  } else {
    tempsConduiteRetour = tempsConduiteAller
  }

  const tempsConduiteAR = tempsConduiteAller + tempsConduiteRetour

  // Pauses (45 min toutes les 4h30)
  const pausesAller = Math.floor(tempsConduiteAller / R.CONDUITE_CONTINUE_MAX_JOUR)
  const pausesRetour = Math.floor(tempsConduiteRetour / R.CONDUITE_CONTINUE_MAX_JOUR)
  const pausesAR = pausesAller + pausesRetour

  // Temps total avec pauses
  const tempsTotalAller = tempsConduiteAller + (pausesAller * R.PAUSE_OBLIGATOIRE / 60)
  const tempsTotalRetour = tempsConduiteRetour + (pausesRetour * R.PAUSE_OBLIGATOIRE / 60)

  // Calcul heure d'arrivée
  let heureArrivee: string | null = null
  let minutesArriveeDestination = 0
  if (heureDepart) {
    const [h, m] = heureDepart.split(':').map(Number)
    const minutesDepart = h * 60 + m
    minutesArriveeDestination = minutesDepart + Math.round(tempsTotalAller * 60)
    const hArrivee = Math.floor(minutesArriveeDestination / 60) % 24
    const mArrivee = minutesArriveeDestination % 60
    heureArrivee = `${hArrivee.toString().padStart(2, '0')}:${mArrivee.toString().padStart(2, '0')}`
    if (minutesArriveeDestination >= 24 * 60) heureArrivee += ' (J+1)'
  }

  // Nombre de jours - utiliser substring(0,10) pour gérer les formats ISO et PostgreSQL
  let nbJoursVoyage = 1
  let estMemeJour = true
  if (dateDepart && dateRetour) {
    // Extraire uniquement YYYY-MM-DD pour éviter les problèmes de timezone
    const depDateStr = dateDepart.substring(0, 10)
    const retDateStr = dateRetour.substring(0, 10)
    const [depYear, depMonth, depDay] = depDateStr.split('-').map(Number)
    const [retYear, retMonth, retDay] = retDateStr.split('-').map(Number)
    const d1 = new Date(Date.UTC(depYear, depMonth - 1, depDay))
    const d2 = new Date(Date.UTC(retYear, retMonth - 1, retDay))
    nbJoursVoyage = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1
    estMemeJour = d1.getTime() === d2.getTime()
  }

  // Amplitude et temps d'attente
  let amplitudeJournee: number | null = null
  let heureRetourArrivee: string | null = null
  let tempsAttenteSurPlace = 0

  if (heureDepart && heureRetour) {
    const [hDep, mDep] = heureDepart.split(':').map(Number)
    const [hRet, mRet] = heureRetour.split(':').map(Number)
    const minutesDepartMatin = hDep * 60 + mDep
    let minutesDepartRetour = hRet * 60 + mRet

    if (!estMemeJour && dateDepart && dateRetour) {
      // Réutiliser le calcul déjà fait pour nbJoursVoyage
      const diffJours = nbJoursVoyage - 1
      minutesDepartRetour += diffJours * 24 * 60
    }

    const minutesRetourDepot = minutesDepartRetour + Math.round(tempsTotalRetour * 60)
    const hRetArr = Math.floor(minutesRetourDepot / 60) % 24
    const mRetArr = minutesRetourDepot % 60
    heureRetourArrivee = `${hRetArr.toString().padStart(2, '0')}:${mRetArr.toString().padStart(2, '0')}`

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

  const pauseNuitRequise = conduiteNuit && dureeConduiteNuit > 3

  // Coût relais chauffeur
  let coutRelaisChauffeur = 0
  let nbTransferts = 0
  if (nbChauffeurs === 2) {
    if (typeService === 'aller_simple' || typeService === 'ar_1j') {
      nbTransferts = 1
    } else {
      nbTransferts = 2
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
    heureArrivee,
    heureRetourArrivee,
    amplitudeJournee,
    tempsAttenteSurPlace,
    estMemeJour,
    nbJoursVoyage,
    conduiteNuit,
    dureeConduiteNuit,
    pauseNuitRequise,
    nbChauffeurs,
    raisonDeuxChauffeurs,
    besoinCoupure3h,
    reposCompletSurPlace,
    coutRelaisChauffeur,
  }
}

// =============================================
// DÉTERMINATION DE L'AMPLITUDE GRILLE
// =============================================

/**
 * Détermine la colonne de grille AR 1J à utiliser selon l'amplitude
 */
export function determinerAmplitudeGrille(amplitudeHeures: number): AmplitudeType {
  if (amplitudeHeures <= 8) return '8h'
  if (amplitudeHeures <= 10) return '10h'
  if (amplitudeHeures <= 12) return '12h'
  return '9h_coupure'
}

/**
 * Calcule l'amplitude en heures à partir des horaires
 */
export function calculerAmplitudeHeures(
  heureDepart: string | null,
  heureRetour: string | null
): number | null {
  if (!heureDepart || !heureRetour) return null

  try {
    const [depHours, depMinutes] = heureDepart.split(':').map(Number)
    const [retHours, retMinutes] = heureRetour.split(':').map(Number)

    if (isNaN(depHours) || isNaN(depMinutes) || isNaN(retHours) || isNaN(retMinutes)) {
      return null
    }

    let durationMinutes = (retHours * 60 + retMinutes) - (depHours * 60 + depMinutes)
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60
    }

    return durationMinutes / 60
  } catch {
    return null
  }
}

// =============================================
// INTERFACES GRILLES TARIFAIRES
// =============================================

export interface TarifAllerSimple {
  km_min: number
  km_max: number
  prix_public: number
}

export interface TarifAR1J {
  km_min: number
  km_max: number
  prix_8h: number | null
  prix_10h: number | null
  prix_12h: number | null
  prix_9h_coupure: number | null
}

export interface TarifARMAD {
  km_min: number
  km_max: number
  prix_2j: number | null
  prix_3j: number | null
  prix_4j: number | null
  prix_5j: number | null
  prix_6j: number | null
  supplement_jour: number | null
}

export interface TarifARSansMAD {
  km_min: number
  km_max: number
  prix_2j: number | null
  prix_3j: number | null
  prix_4j: number | null
  prix_5j: number | null
  prix_6j: number | null
  supplement_jour: number | null
}

export interface GrillesTarifaires {
  tarifsAllerSimple: TarifAllerSimple[]
  tarifsAR1J: TarifAR1J[]
  tarifsARMAD: TarifARMAD[]
  tarifsARSansMAD: TarifARSansMAD[]
}

// =============================================
// CALCUL DU TARIF COMPLET
// =============================================

export interface CalculTarifParams {
  distanceKm: number
  typeService: ServiceType
  amplitude?: AmplitudeType | null
  nbJours?: number
  vehiculeCode?: string
  coefficientVehicule?: number
  nombreCars?: number
  villeDepartAvecCP?: string | null
  majorationRushManuelle?: number
  kmSupplementairesMAD?: number
  heureDepart?: string | null
  heureRetour?: string | null
  dateDepart?: string | null
  dateRetour?: string | null
  grilles: GrillesTarifaires
}

/**
 * Calcule le tarif complet avec toutes les règles
 */
export function calculerTarifComplet(params: CalculTarifParams): CalculTarifResult {
  const {
    distanceKm,
    typeService,
    amplitude,
    nbJours = 1,
    coefficientVehicule = 1,
    nombreCars = 1,
    villeDepartAvecCP,
    majorationRushManuelle = 0,
    kmSupplementairesMAD = 0,
    heureDepart,
    heureRetour,
    dateDepart,
    dateRetour,
    grilles,
  } = params

  const T = TARIFS_HORS_GRILLE

  // Résultat par défaut
  const result: CalculTarifResult = {
    prixBase: 0,
    prixBaseAvecHorsCadre: 0,
    prixVehicule: 0,
    prixFinal: 0,
    kmHorsCadre: 0,
    supplementHorsCadre: 0,
    supplementJours: 0,
    joursSupplementaires: 0,
    majorationAutoRegion: 0,
    majorationRushManuelle,
    majorationTotale: 0,
    coutRelaisChauffeur: 0,
    coefficient: coefficientVehicule,
    nombreCars,
    detailType: '',
    amplitude: null,
    maxGrille: 0,
    warningTranche: null,
    erreur: null,
    infosTrajet: null,
  }

  // Vérification distance
  if (!distanceKm || distanceKm <= 0) {
    result.erreur = 'Veuillez entrer une distance valide'
    return result
  }

  // Calcul infos trajet
  const infosTrajet = calculerInfosTrajet(
    distanceKm,
    heureDepart || null,
    heureRetour || null,
    dateDepart || null,
    dateRetour || null,
    typeService
  )
  result.infosTrajet = infosTrajet
  result.coutRelaisChauffeur = infosTrajet.coutRelaisChauffeur

  // Majoration département problématique
  const departement = extraireDepartement(villeDepartAvecCP)
  if (departement && estDepartementProblematique(departement)) {
    result.majorationAutoRegion = 0.05
  }

  // Calcul selon type de service
  let prixBase = 0
  let maxGrille = 0
  let kmHorsCadre = 0
  let supplementHorsCadre = 0
  let detailType = ''
  let amplitudeUtilisee: AmplitudeType | null = null
  let joursSupplementaires = 0
  let supplementJours = 0

  // ============ ALLER SIMPLE ============
  if (typeService === 'aller_simple') {
    const grille = grilles.tarifsAllerSimple
    maxGrille = T.GRILLE_ALLER_SIMPLE_MAX

    let tranche = grille.find(t => distanceKm > t.km_min && distanceKm <= t.km_max)

    if (distanceKm > maxGrille) {
      tranche = grille[grille.length - 1]
      kmHorsCadre = distanceKm - maxGrille
      supplementHorsCadre = kmHorsCadre * T.PRIX_KM_SUPPLEMENTAIRE * 2
    }

    if (!tranche && grille.length > 0) {
      tranche = grille[0]
    }

    prixBase = tranche ? Number(tranche.prix_public) : 0
    detailType = 'Aller simple'
  }

  // ============ AR 1 JOUR ============
  else if (typeService === 'ar_1j') {
    const grille = grilles.tarifsAR1J
    maxGrille = T.GRILLE_AR_1J_MAX

    // Petit km
    if (distanceKm <= T.PETIT_KM_SEUIL) {
      prixBase = T.PETIT_KM_BASE
      if (infosTrajet.amplitudeJournee && infosTrajet.amplitudeJournee > 5) {
        prixBase = distanceKm <= 20 ? T.PETIT_KM_AMPLITUDE_5H_PLUS : T.PETIT_KM_AMPLITUDE_5H_PLUS_50
      }
      const ampLabel = infosTrajet.amplitudeJournee ? `${infosTrajet.amplitudeJournee.toFixed(1)}h` : 'N/A'
      detailType = `AR 1 jour (petit km, amp. ${ampLabel})`
    } else {
      // Déterminer amplitude
      amplitudeUtilisee = amplitude || (infosTrajet.amplitudeJournee
        ? determinerAmplitudeGrille(infosTrajet.amplitudeJournee)
        : '12h')

      let tranche = grille.find(t => distanceKm > t.km_min && distanceKm <= t.km_max)

      if (distanceKm > maxGrille) {
        tranche = grille[grille.length - 1]
        kmHorsCadre = distanceKm - maxGrille
        supplementHorsCadre = kmHorsCadre * T.PRIX_KM_SUPPLEMENTAIRE * 2
      }

      if (tranche) {
        const amplitudeKey = `prix_${amplitudeUtilisee.replace('h', 'h')}` as keyof TarifAR1J
        prixBase = Number(tranche[amplitudeKey]) || 0

        // Si pas de prix pour cette amplitude, chercher une autre
        if (!prixBase) {
          const amplitudes: (keyof TarifAR1J)[] = ['prix_8h', 'prix_10h', 'prix_12h', 'prix_9h_coupure']
          for (const amp of amplitudes) {
            if (tranche[amp]) {
              prixBase = Number(tranche[amp])
              amplitudeUtilisee = amp.replace('prix_', '').replace('h', 'h') as AmplitudeType
              break
            }
          }
        }
      }

      if (!prixBase) {
        result.erreur = 'Cette distance nécessite une amplitude non disponible'
        return result
      }

      const ampLabels: Record<AmplitudeType, string> = {
        '8h': '≤8h',
        '10h': '≤10h',
        '12h': '≤12h',
        '9h_coupure': 'avec coupure'
      }
      const ampReel = infosTrajet.amplitudeJournee ? `${infosTrajet.amplitudeJournee.toFixed(1)}h` : 'N/A'
      detailType = `AR 1 jour (${ampLabels[amplitudeUtilisee]}, réel: ${ampReel})`
    }
  }

  // ============ AR MAD ============
  else if (typeService === 'ar_mad') {
    const grille = grilles.tarifsARMAD
    maxGrille = T.GRILLE_AR_MAD_MAX

    if (distanceKm < T.GRILLE_AR_MAD_MIN) {
      result.erreur = `Pour moins de ${T.GRILLE_AR_MAD_MIN} km avec MAD, utiliser le tarif à la journée`
      return result
    }

    let tranche = grille.find(t => distanceKm > t.km_min && distanceKm <= t.km_max)

    if (distanceKm > maxGrille) {
      tranche = grille[grille.length - 1]
      kmHorsCadre = distanceKm - maxGrille
      supplementHorsCadre = kmHorsCadre * T.PRIX_KM_SUPPLEMENTAIRE * 2
    }

    if (tranche) {
      const supplementParJour = Number(tranche.supplement_jour) || T.SUPPLEMENT_JOUR_MAD

      if (nbJours > 6) {
        joursSupplementaires = nbJours - 6
        supplementJours = joursSupplementaires * supplementParJour
        prixBase = Number(tranche.prix_6j) || 0
      } else {
        // Chercher le prix pour ce nombre de jours
        const joursKey = `prix_${nbJours}j` as keyof TarifARMAD
        prixBase = Number(tranche[joursKey]) || 0

        // Si pas de prix pour ce nombre de jours, chercher le dernier prix disponible et ajouter les suppléments
        if (!prixBase) {
          let dernierJourDispo = 0
          let dernierPrix = 0
          for (let j = nbJours - 1; j >= 2; j--) {
            const key = `prix_${j}j` as keyof TarifARMAD
            const prix = Number(tranche[key]) || 0
            if (prix > 0) {
              dernierJourDispo = j
              dernierPrix = prix
              break
            }
          }

          if (dernierPrix > 0) {
            prixBase = dernierPrix
            joursSupplementaires = nbJours - dernierJourDispo
            supplementJours = joursSupplementaires * supplementParJour
          }
        }
      }
    }

    detailType = `AR ${nbJours} jours avec MAD`
  }

  // ============ AR SANS MAD ============
  else if (typeService === 'ar_sans_mad') {
    const grille = grilles.tarifsARSansMAD
    maxGrille = T.GRILLE_AR_SANS_MAD_MAX

    if (distanceKm < T.GRILLE_AR_SANS_MAD_MIN) {
      result.erreur = `Pour moins de ${T.GRILLE_AR_SANS_MAD_MIN} km sans MAD, utiliser le transfert`
      return result
    }

    let tranche = grille.find(t => distanceKm > t.km_min && distanceKm <= t.km_max)

    if (distanceKm > maxGrille) {
      tranche = grille[grille.length - 1]
      kmHorsCadre = distanceKm - maxGrille
      supplementHorsCadre = kmHorsCadre * T.PRIX_KM_SUPPLEMENTAIRE * 2
    }

    if (tranche) {
      const supplementParJour = Number(tranche.supplement_jour) || T.SUPPLEMENT_JOUR_SANS_MAD

      // DEBUG: Log des valeurs
      console.log('🔴 DEBUG calculerTarifComplet AR_SANS_MAD:', {
        nbJours,
        distanceKm,
        tranche_km: `${tranche.km_min}-${tranche.km_max}`,
        prix_2j: tranche.prix_2j,
        prix_3j: tranche.prix_3j,
        prix_4j: tranche.prix_4j,
        keyRecherche: `prix_${nbJours}j`,
        valeurTrouvee: (tranche as any)[`prix_${nbJours}j`],
        supplementParJour,
      })

      if (nbJours > 6) {
        joursSupplementaires = nbJours - 6
        supplementJours = joursSupplementaires * supplementParJour
        prixBase = Number(tranche.prix_6j) || 0
      } else {
        // Chercher le prix pour ce nombre de jours
        const joursKey = `prix_${nbJours}j` as keyof TarifARSansMAD
        prixBase = Number(tranche[joursKey]) || 0

        // Si pas de prix pour ce nombre de jours, chercher le dernier prix disponible et ajouter les suppléments
        if (!prixBase) {
          // Chercher le plus grand nombre de jours disponible
          let dernierJourDispo = 0
          let dernierPrix = 0
          for (let j = nbJours - 1; j >= 2; j--) {
            const key = `prix_${j}j` as keyof TarifARSansMAD
            const prix = Number(tranche[key]) || 0
            if (prix > 0) {
              dernierJourDispo = j
              dernierPrix = prix
              break
            }
          }

          if (dernierPrix > 0) {
            prixBase = dernierPrix
            joursSupplementaires = nbJours - dernierJourDispo
            supplementJours = joursSupplementaires * supplementParJour
          }
        }
      }

      if (!prixBase) {
        result.erreur = "Cette durée n'est pas disponible pour cette distance"
        return result
      }

      // DEBUG: Log du résultat
      console.log('🔴 DEBUG calculerTarifComplet RESULT:', {
        prixBase,
        joursSupplementaires,
        supplementJours,
      })
    }

    detailType = `AR ${nbJours} jours sans MAD`
  }

  // Calculs finaux
  const prixBaseAvecHorsCadre = prixBase + supplementHorsCadre
  const prixVehicule = Math.round(prixBaseAvecHorsCadre * coefficientVehicule)
  const supplementJoursAvecCoef = Math.round(supplementJours * coefficientVehicule)

  // Km supplémentaires MAD
  let supplementMad = 0
  if (typeService === 'ar_mad' && kmSupplementairesMAD > 0) {
    supplementMad = kmSupplementairesMAD * T.PRIX_KM_SUPPLEMENTAIRE
  }

  const prixAvantRush = prixVehicule + supplementJoursAvecCoef + supplementMad + infosTrajet.coutRelaisChauffeur
  const majorationTotale = majorationRushManuelle + result.majorationAutoRegion
  const prixFinal = Math.round(prixAvantRush * (1 + majorationTotale))

  // Warning tranche proche
  let warningTranche: CalculTarifResult['warningTranche'] = null
  const SEUIL_WARNING = 20

  function checkProcheTranche<T extends { km_min: number; km_max: number }>(
    grille: T[],
    distance: number,
    getPrix: (t: T) => number | null
  ): CalculTarifResult['warningTranche'] {
    const trancheActuelle = grille.find(t => distance > t.km_min && distance <= t.km_max)
    if (!trancheActuelle) return null

    const indexActuel = grille.indexOf(trancheActuelle)
    const prochaineTranche = grille[indexActuel + 1]

    if (prochaineTranche && (trancheActuelle.km_max - distance) < SEUIL_WARNING) {
      const prixSuivant = getPrix(prochaineTranche)
      if (prixSuivant) {
        return {
          kmRestants: Math.round(trancheActuelle.km_max - distance),
          trancheSuivante: `${prochaineTranche.km_min}-${prochaineTranche.km_max} km`,
          prixSuivant,
        }
      }
    }
    return null
  }

  if (kmHorsCadre === 0) {
    if (typeService === 'aller_simple') {
      warningTranche = checkProcheTranche(grilles.tarifsAllerSimple, distanceKm, t => t.prix_public)
    } else if (typeService === 'ar_1j' && distanceKm > T.PETIT_KM_SEUIL && amplitudeUtilisee) {
      warningTranche = checkProcheTranche(grilles.tarifsAR1J, distanceKm, t => {
        const key = `prix_${amplitudeUtilisee}` as keyof TarifAR1J
        return Number(t[key]) || null
      })
    } else if (typeService === 'ar_mad') {
      warningTranche = checkProcheTranche(grilles.tarifsARMAD, distanceKm, t => {
        const key = `prix_${Math.min(nbJours, 6)}j` as keyof TarifARMAD
        return Number(t[key]) || null
      })
    } else if (typeService === 'ar_sans_mad') {
      warningTranche = checkProcheTranche(grilles.tarifsARSansMAD, distanceKm, t => {
        const key = `prix_${Math.min(nbJours, 6)}j` as keyof TarifARSansMAD
        return Number(t[key]) || null
      })
    }
  }

  // Résultat final
  return {
    ...result,
    prixBase,
    prixBaseAvecHorsCadre,
    prixVehicule,
    prixFinal,
    kmHorsCadre,
    supplementHorsCadre,
    supplementJours: supplementJoursAvecCoef,
    joursSupplementaires,
    majorationTotale,
    detailType,
    amplitude: amplitudeUtilisee,
    maxGrille,
    warningTranche,
  }
}

// =============================================
// FORMATAGE
// =============================================

/**
 * Formate un prix en euros
 */
export function formatEuros(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

/**
 * Formate une durée en heures et minutes
 */
export function formatDuree(heures: number): string {
  const h = Math.floor(heures)
  const m = Math.round((heures - h) * 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}

// =============================================
// CHARGEMENT DYNAMIQUE DES MAJORATIONS REGIONS
// =============================================

export interface MajorationRegion {
  region_code: string
  region_nom: string
  majoration_percent: number
  grande_capacite_dispo: boolean
  is_active: boolean
}

// Cache pour les majorations régions
let majorationsCache: MajorationRegion[] | null = null
let majorationsCacheTimestamp = 0
const MAJORATIONS_CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Charge les majorations par région depuis la base de données
 */
export async function chargerMajorationsRegions(): Promise<MajorationRegion[]> {
  // Vérifier le cache
  if (majorationsCache && Date.now() - majorationsCacheTimestamp < MAJORATIONS_CACHE_DURATION) {
    return majorationsCache
  }

  try {
    const { data, error } = await supabase
      .from('majorations_regions')
      .select('region_code, region_nom, majoration_percent, grande_capacite_dispo, is_active')
      .eq('is_active', true)
      .order('region_code')

    if (error) {
      console.error('Erreur chargement majorations régions:', error)
      return majorationsCache || []
    }

    majorationsCache = (data || []).map(d => ({
      region_code: d.region_code,
      region_nom: d.region_nom,
      majoration_percent: parseFloat(String(d.majoration_percent)) || 0,
      grande_capacite_dispo: d.grande_capacite_dispo ?? false,
      is_active: d.is_active ?? true,
    }))
    majorationsCacheTimestamp = Date.now()

    return majorationsCache
  } catch (err) {
    console.error('Erreur chargement majorations régions:', err)
    return majorationsCache || []
  }
}

/**
 * Obtient la majoration pour un département donné (depuis la DB)
 */
export async function getMajorationRegion(dept: string | null): Promise<{
  majoration_percent: number
  grande_capacite_dispo: boolean
  region_nom: string | null
}> {
  if (!dept) {
    return { majoration_percent: 0, grande_capacite_dispo: true, region_nom: null }
  }

  const majorations = await chargerMajorationsRegions()
  const region = majorations.find(m => m.region_code === dept)

  if (region) {
    return {
      majoration_percent: region.majoration_percent,
      grande_capacite_dispo: region.grande_capacite_dispo,
      region_nom: region.region_nom,
    }
  }

  // Si département non trouvé, pas de majoration
  return { majoration_percent: 0, grande_capacite_dispo: true, region_nom: null }
}

/**
 * Vérifie si le département a une majoration (version synchrone avec fallback)
 * Utilise les constantes hardcodées si le cache n'est pas disponible
 */
export function getMajorationRegionSync(dept: string | null): {
  majoration_percent: number
  grande_capacite_dispo: boolean
} {
  if (!dept) {
    return { majoration_percent: 0, grande_capacite_dispo: true }
  }

  // Si le cache est disponible, l'utiliser
  if (majorationsCache) {
    const region = majorationsCache.find(m => m.region_code === dept)
    if (region) {
      return {
        majoration_percent: region.majoration_percent,
        grande_capacite_dispo: region.grande_capacite_dispo,
      }
    }
  }

  // Fallback sur les constantes hardcodées (5% pour zones problématiques)
  const isProblematique = (DEPARTEMENTS_PROBLEMATIQUES as readonly string[]).includes(dept)
  const hasDoubleEtage = (DEPARTEMENTS_DOUBLE_ETAGE as readonly string[]).includes(dept)

  return {
    majoration_percent: isProblematique ? 5 : 0,
    grande_capacite_dispo: hasDoubleEtage,
  }
}

// =============================================
// VERSION AMÉLIORÉE DU CALCUL TARIF
// =============================================

export interface CalculTarifParamsV2 extends CalculTarifParams {
  useDatabaseMajorations?: boolean
}

/**
 * Calcule le tarif complet avec chargement asynchrone des majorations
 */
export async function calculerTarifCompletAsync(params: CalculTarifParamsV2): Promise<CalculTarifResult> {
  const {
    villeDepartAvecCP,
    useDatabaseMajorations = true,
  } = params

  // Charger les majorations depuis la DB si demandé
  let majorationInfo = { majoration_percent: 0, grande_capacite_dispo: true, region_nom: null as string | null }

  if (useDatabaseMajorations && villeDepartAvecCP) {
    const dept = extraireDepartement(villeDepartAvecCP)
    if (dept) {
      majorationInfo = await getMajorationRegion(dept)
    }
  }

  // Calculer avec la majoration de la DB (convertie en décimal)
  const paramsWithMajoration: CalculTarifParams = {
    ...params,
    // La majoration de la DB est en pourcentage (ex: 10 pour 10%), on la convertit en décimal (0.10)
    majorationRushManuelle: (params.majorationRushManuelle || 0) + (majorationInfo.majoration_percent / 100),
  }

  // Appeler la fonction synchrone
  const result = calculerTarifComplet(paramsWithMajoration)

  // Ajouter les infos de majoration
  result.majorationAutoRegion = majorationInfo.majoration_percent / 100

  return result
}

// =============================================
// CHARGEMENT DES GRILLES TARIFAIRES
// =============================================

/**
 * Charge toutes les grilles tarifaires depuis Supabase
 */
export async function chargerGrillesTarifaires(): Promise<GrillesTarifaires> {
  const [resAS, resAR1J, resARMAD, resARSansMAD] = await Promise.all([
    supabase.from('tarifs_aller_simple').select('*').order('km_min'),
    supabase.from('tarifs_ar_1j').select('*').order('km_min'),
    supabase.from('tarifs_ar_mad').select('*').order('km_min'),
    supabase.from('tarifs_ar_sans_mad').select('*').order('km_min'),
  ])

  // Helper pour convertir en nombre
  const toNum = (val: unknown): number => parseFloat(String(val)) || 0
  const toNumOrNull = (val: unknown): number | null => val != null ? parseFloat(String(val)) || null : null

  return {
    tarifsAllerSimple: (resAS.data || []).map(t => ({
      km_min: t.km_min,
      km_max: t.km_max,
      prix_public: toNum(t.prix_public),
    })),
    tarifsAR1J: (resAR1J.data || []).map(t => ({
      km_min: t.km_min,
      km_max: t.km_max,
      prix_8h: toNumOrNull(t.prix_8h),
      prix_10h: toNumOrNull(t.prix_10h),
      prix_12h: toNumOrNull(t.prix_12h),
      prix_9h_coupure: toNumOrNull(t.prix_9h_coupure),
    })),
    tarifsARMAD: (resARMAD.data || []).map(t => ({
      km_min: t.km_min,
      km_max: t.km_max,
      prix_2j: toNumOrNull(t.prix_2j),
      prix_3j: toNumOrNull(t.prix_3j),
      prix_4j: toNumOrNull(t.prix_4j),
      prix_5j: toNumOrNull(t.prix_5j),
      prix_6j: toNumOrNull(t.prix_6j),
      supplement_jour: toNumOrNull(t.supplement_jour),
    })),
    tarifsARSansMAD: (resARSansMAD.data || []).map(t => ({
      km_min: t.km_min,
      km_max: t.km_max,
      prix_2j: toNumOrNull(t.prix_2j),
      prix_3j: toNumOrNull(t.prix_3j),
      prix_4j: toNumOrNull(t.prix_4j),
      prix_5j: toNumOrNull(t.prix_5j),
      prix_6j: toNumOrNull(t.prix_6j),
      supplement_jour: toNumOrNull(t.supplement_jour),
    })),
  }
}

/**
 * Charge les coefficients véhicules depuis Supabase
 */
export async function chargerCoefficientsVehicules(): Promise<{ code: string; label: string; coefficient: number }[]> {
  const { data, error } = await supabase
    .from('capacites_vehicules')
    .select('code, label, coefficient')
    .order('places_min')

  if (error) {
    console.error('Erreur chargement coefficients véhicules:', error)
    return []
  }

  return (data || []).map(v => ({
    code: v.code,
    label: v.label,
    coefficient: parseFloat(String(v.coefficient)) || 1,
  }))
}
