/**
 * Hook React pour utiliser les règles de tarification
 * Gère le chargement des données depuis Supabase et les calculs
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  chargerGrillesTarifaires,
  chargerMajorationsRegions,
  chargerCoefficientsVehicules,
  calculerTarifComplet,
  calculerInfosTrajet,
  extraireDepartement,
  determinerAmplitudeGrille,
  optimizeVehicleCombination,
  calculateOptimalCars,
  type GrillesTarifaires,
  type MajorationRegion,
  type ServiceType,
  type AmplitudeType,
  type InfosTrajet,
  type CalculTarifResult,
  type VehicleOptimizationResult,
  TARIFS_HORS_GRILLE,
  VEHICLE_TYPES,
} from '@/lib/pricing-rules'

// =============================================
// HOOK POUR LE CALCUL DE ROUTE VIA GEOAPIFY
// =============================================

export interface RouteResult {
  distanceKm: number
  tempsConduiteMinutes: number
  tempsConduiteHeures: number
}

/**
 * Hook pour calculer la route entre deux villes via l'Edge Function calculate-route
 * Utilise Geoapify avec mode=bus pour un temps de trajet autocar précis
 */
export function useRouteCalculation(departure: string | null, arrival: string | null) {
  return useQuery({
    queryKey: ['route-calculation', departure, arrival],
    queryFn: async (): Promise<RouteResult | null> => {
      if (!departure || !arrival) return null

      const { data, error } = await supabase.functions.invoke('calculate-route', {
        body: { departure, arrival },
      })

      if (error) {
        console.error('Erreur calcul route:', error)
        return null
      }

      if (data?.success) {
        return {
          distanceKm: data.distanceKm,
          tempsConduiteMinutes: data.tempsConduiteMinutes,
          tempsConduiteHeures: data.tempsConduiteHeures,
        }
      }

      return null
    },
    enabled: !!departure && !!arrival,
    staleTime: 10 * 60 * 1000, // 10 minutes - les routes ne changent pas souvent
    retry: 1,
  })
}

// =============================================
// TYPES
// =============================================

export interface UsePricingRulesParams {
  distanceKm?: number
  typeService?: ServiceType
  amplitude?: AmplitudeType | null
  nbJours?: number
  vehiculeCode?: string
  nombreCars?: number
  villeDepartAvecCP?: string | null
  villeArriveeAvecCP?: string | null
  majorationRushManuelle?: number
  kmSupplementairesMAD?: number
  heureDepart?: string | null
  heureRetour?: string | null
  dateDepart?: string | null
  dateRetour?: string | null
}

export interface UsePricingRulesResult {
  // État de chargement
  isLoading: boolean
  isError: boolean

  // Données chargées
  grilles: GrillesTarifaires | null
  majorationsRegions: MajorationRegion[]
  coefficientsVehicules: { code: string; label: string; coefficient: number }[]

  // Résultats calculés
  tarifEstime: CalculTarifResult | null
  infosTrajet: InfosTrajet | null
  majorationRegion: {
    percent: number
    nom: string | null
    grandeCapaciteDispo: boolean
  } | null

  // Fonctions utilitaires
  recalculer: () => void
  getCoefficient: (vehiculeCode: string) => number
}

// =============================================
// HOOK PRINCIPAL
// =============================================

export function usePricingRules(params: UsePricingRulesParams = {}): UsePricingRulesResult {
  const {
    distanceKm = 0,
    typeService = 'aller_simple',
    amplitude = null,
    nbJours = 1,
    vehiculeCode = 'standard',
    nombreCars = 1,
    villeDepartAvecCP = null,
    majorationRushManuelle = 0,
    kmSupplementairesMAD = 0,
    heureDepart = null,
    heureRetour = null,
    dateDepart = null,
    dateRetour = null,
  } = params

  // Charger les grilles tarifaires
  const {
    data: grilles,
    isLoading: isLoadingGrilles,
    isError: isErrorGrilles,
  } = useQuery({
    queryKey: ['grilles-tarifaires'],
    queryFn: chargerGrillesTarifaires,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Charger les majorations régions
  const {
    data: majorationsRegions = [],
    isLoading: isLoadingMajorations,
    isError: isErrorMajorations,
  } = useQuery({
    queryKey: ['majorations-regions'],
    queryFn: chargerMajorationsRegions,
    staleTime: 5 * 60 * 1000,
  })

  // Charger les coefficients véhicules
  const {
    data: coefficientsVehicules = [],
    isLoading: isLoadingCoefficients,
    isError: isErrorCoefficients,
  } = useQuery({
    queryKey: ['coefficients-vehicules'],
    queryFn: chargerCoefficientsVehicules,
    staleTime: 5 * 60 * 1000,
  })

  // Calculer la majoration pour le département
  const majorationRegion = useMemo(() => {
    if (!villeDepartAvecCP) return null

    const dept = extraireDepartement(villeDepartAvecCP)
    if (!dept) return null

    const region = majorationsRegions.find(m => m.region_code === dept)
    if (region) {
      return {
        percent: region.majoration_percent,
        nom: region.region_nom,
        grandeCapaciteDispo: region.grande_capacite_dispo,
      }
    }

    return {
      percent: 0,
      nom: null,
      grandeCapaciteDispo: true,
    }
  }, [villeDepartAvecCP, majorationsRegions])

  // Obtenir le coefficient véhicule
  const getCoefficient = useCallback((code: string): number => {
    const vehicule = coefficientsVehicules.find(v => v.code === code)
    return vehicule?.coefficient || 1
  }, [coefficientsVehicules])

  // Calculer les infos trajet
  const infosTrajet = useMemo(() => {
    if (!distanceKm || distanceKm <= 0) return null

    return calculerInfosTrajet(
      distanceKm,
      heureDepart,
      heureRetour,
      dateDepart,
      dateRetour,
      typeService
    )
  }, [distanceKm, heureDepart, heureRetour, dateDepart, dateRetour, typeService])

  // Calculer le tarif estimé
  const tarifEstime = useMemo(() => {
    if (!grilles || !distanceKm || distanceKm <= 0) return null

    const coefficient = getCoefficient(vehiculeCode)

    // Déterminer l'amplitude automatiquement si AR 1 jour
    let amplitudeUtilisee = amplitude
    if (typeService === 'ar_1j' && !amplitude && infosTrajet?.amplitudeJournee) {
      amplitudeUtilisee = determinerAmplitudeGrille(infosTrajet.amplitudeJournee)
    }

    return calculerTarifComplet({
      distanceKm,
      typeService,
      amplitude: amplitudeUtilisee,
      nbJours,
      coefficientVehicule: coefficient,
      nombreCars,
      villeDepartAvecCP,
      majorationRushManuelle: majorationRushManuelle + (majorationRegion?.percent || 0) / 100,
      kmSupplementairesMAD,
      heureDepart,
      heureRetour,
      dateDepart,
      dateRetour,
      grilles,
    })
  }, [
    grilles,
    distanceKm,
    typeService,
    amplitude,
    nbJours,
    vehiculeCode,
    nombreCars,
    villeDepartAvecCP,
    majorationRushManuelle,
    majorationRegion,
    kmSupplementairesMAD,
    heureDepart,
    heureRetour,
    dateDepart,
    dateRetour,
    infosTrajet,
    getCoefficient,
  ])

  const [refreshKey, setRefreshKey] = useState(0)
  const recalculer = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return {
    isLoading: isLoadingGrilles || isLoadingMajorations || isLoadingCoefficients,
    isError: isErrorGrilles || isErrorMajorations || isErrorCoefficients,
    grilles: grilles || null,
    majorationsRegions,
    coefficientsVehicules,
    tarifEstime,
    infosTrajet,
    majorationRegion,
    recalculer,
    getCoefficient,
  }
}

// =============================================
// HOOK POUR LA DÉTECTION DÉPARTEMENT
// =============================================

export function useMajorationDepartement(villeDepartAvecCP: string | null | undefined) {
  const {
    data: majorationsRegions = [],
    isLoading,
  } = useQuery({
    queryKey: ['majorations-regions'],
    queryFn: chargerMajorationsRegions,
    staleTime: 5 * 60 * 1000,
  })

  return useMemo(() => {
    if (isLoading || !villeDepartAvecCP) {
      return {
        isLoading,
        departement: null,
        majorationPercent: 0,
        regionNom: null,
        grandeCapaciteDispo: true,
        isZoneDifficile: false,
      }
    }

    const dept = extraireDepartement(villeDepartAvecCP)
    if (!dept) {
      return {
        isLoading: false,
        departement: null,
        majorationPercent: 0,
        regionNom: null,
        grandeCapaciteDispo: true,
        isZoneDifficile: false,
      }
    }

    const region = majorationsRegions.find(m => m.region_code === dept)

    return {
      isLoading: false,
      departement: dept,
      majorationPercent: region?.majoration_percent || 0,
      regionNom: region?.region_nom || null,
      grandeCapaciteDispo: region?.grande_capacite_dispo ?? true,
      isZoneDifficile: (region?.majoration_percent || 0) > 0,
    }
  }, [villeDepartAvecCP, majorationsRegions, isLoading])
}

// =============================================
// HOOK POUR LE CALCUL CHAUFFEURS
// =============================================

export function useCalculChauffeurs(params: {
  distanceKm: number
  heureDepart?: string | null
  heureRetour?: string | null
  dateDepart?: string | null
  dateRetour?: string | null
  typeService?: ServiceType
  /** Temps de conduite aller en minutes (depuis Geoapify) - optionnel */
  tempsConduiteAllerMin?: number | null
}) {
  const {
    distanceKm,
    heureDepart = null,
    heureRetour = null,
    dateDepart = null,
    dateRetour = null,
    typeService = 'aller_simple',
    tempsConduiteAllerMin = null,
  } = params

  return useMemo(() => {
    if (!distanceKm || distanceKm <= 0) {
      return {
        nbChauffeurs: 1,
        raison: '',
        tempsConduiteAller: 0,
        tempsConduiteAR: 0,
        amplitudeJournee: null,
        tempsAttenteSurPlace: 0,
        pausesRequises: 0,
        reposCompletSurPlace: false,
        besoinCoupure3h: false,
      }
    }

    const infos = calculerInfosTrajet(
      distanceKm,
      heureDepart,
      heureRetour,
      dateDepart,
      dateRetour,
      typeService,
      tempsConduiteAllerMin, // Temps Geoapify en minutes
      null // Pas de temps retour séparé pour l'instant
    )

    return {
      nbChauffeurs: infos.nbChauffeurs,
      raison: infos.raisonDeuxChauffeurs,
      tempsConduiteAller: infos.tempsConduiteAller,
      tempsConduiteAR: infos.tempsConduiteAR,
      amplitudeJournee: infos.amplitudeJournee,
      tempsAttenteSurPlace: infos.tempsAttenteSurPlace,
      pausesRequises: infos.pausesAR,
      reposCompletSurPlace: infos.reposCompletSurPlace,
      besoinCoupure3h: infos.besoinCoupure3h,
    }
  }, [distanceKm, heureDepart, heureRetour, dateDepart, dateRetour, typeService, tempsConduiteAllerMin])
}

// =============================================
// HOOK COMBINÉ AVEC CALCUL DE ROUTE GEOAPIFY
// =============================================

export interface UsePricingRulesWithRouteParams extends Omit<UsePricingRulesParams, 'distanceKm'> {
  /** Si fourni, utilise cette distance au lieu de calculer via Geoapify */
  distanceKm?: number
}

export interface UsePricingRulesWithRouteResult extends UsePricingRulesResult {
  /** Données de route depuis Geoapify */
  routeData: RouteResult | null
  /** Chargement de la route en cours */
  isLoadingRoute: boolean
  /** Distance calculée (Geoapify ou fournie) */
  distanceCalculee: number
  /** Temps de conduite Geoapify en minutes (null si non disponible) */
  tempsConduiteGeoapifyMin: number | null
}

/**
 * Hook combiné qui calcule automatiquement la route via Geoapify
 * et utilise le temps de conduite réel pour les calculs réglementaires
 */
export function usePricingRulesWithRoute(params: UsePricingRulesWithRouteParams = {}): UsePricingRulesWithRouteResult {
  const {
    distanceKm: distanceFournie,
    villeDepartAvecCP = null,
    villeArriveeAvecCP = null,
    typeService = 'aller_simple',
    amplitude = null,
    nbJours = 1,
    vehiculeCode = 'standard',
    nombreCars = 1,
    majorationRushManuelle = 0,
    kmSupplementairesMAD = 0,
    heureDepart = null,
    heureRetour = null,
    dateDepart = null,
    dateRetour = null,
  } = params

  // Calculer la route via Geoapify si pas de distance fournie
  const {
    data: routeData,
    isLoading: isLoadingRoute,
  } = useRouteCalculation(
    distanceFournie ? null : villeDepartAvecCP,
    distanceFournie ? null : villeArriveeAvecCP
  )

  // Distance à utiliser (fournie ou calculée)
  const distanceCalculee = distanceFournie || routeData?.distanceKm || 0
  const tempsConduiteGeoapifyMin = routeData?.tempsConduiteMinutes || null

  // Utiliser le hook de base avec la distance calculée
  const baseResult = usePricingRules({
    distanceKm: distanceCalculee,
    typeService,
    amplitude,
    nbJours,
    vehiculeCode,
    nombreCars,
    villeDepartAvecCP,
    villeArriveeAvecCP,
    majorationRushManuelle,
    kmSupplementairesMAD,
    heureDepart,
    heureRetour,
    dateDepart,
    dateRetour,
  })

  // Recalculer les infos trajet avec le temps Geoapify si disponible
  const infosTrajetAvecGeoapify = useMemo(() => {
    if (!distanceCalculee || distanceCalculee <= 0) return null

    return calculerInfosTrajet(
      distanceCalculee,
      heureDepart,
      heureRetour,
      dateDepart,
      dateRetour,
      typeService,
      tempsConduiteGeoapifyMin,
      null
    )
  }, [distanceCalculee, heureDepart, heureRetour, dateDepart, dateRetour, typeService, tempsConduiteGeoapifyMin])

  return {
    ...baseResult,
    // Remplacer les infos trajet par celles avec Geoapify
    infosTrajet: infosTrajetAvecGeoapify || baseResult.infosTrajet,
    // Ajouter les données de route
    routeData: routeData || null,
    isLoadingRoute,
    distanceCalculee,
    tempsConduiteGeoapifyMin,
    // Ajuster isLoading pour inclure le chargement de la route
    isLoading: baseResult.isLoading || (isLoadingRoute && !distanceFournie),
  }
}

// =============================================
// CONSTANTES ET FONCTIONS EXPORTÉES
// =============================================

export { TARIFS_HORS_GRILLE, VEHICLE_TYPES, optimizeVehicleCombination, calculateOptimalCars }
export type { VehicleOptimizationResult }
