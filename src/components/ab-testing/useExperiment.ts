/**
 * useExperiment - Hook pour utiliser les tests A/B dans les composants
 *
 * Ce hook simplifie l'accès aux variantes et le tracking des événements
 * pour une page ou un composant spécifique.
 */

import { useCallback, useEffect, useRef } from 'react'
import { useABTest } from './ABTestProvider'
import type { TargetPage, Variant, EventType } from '@/lib/ab-testing'

// ============================================
// Types
// ============================================

interface UseExperimentOptions {
  // Tracker automatiquement la vue au montage
  autoTrackView?: boolean
  // Tracker automatiquement le temps passé au démontage
  autoTrackTimeOnPage?: boolean
}

interface UseExperimentResult {
  // État
  isLoading: boolean

  // Pour un test spécifique (si un seul test actif sur la page)
  variant: Variant
  config: Record<string, unknown>
  experimentId: string | null

  // Pour plusieurs tests sur la même page
  experiments: Array<{
    id: string
    name: string
    variant: Variant
    config: Record<string, unknown>
  }>

  // Actions
  trackEvent: (eventType: EventType | string, value?: number, metadata?: Record<string, unknown>) => void
  trackPageView: () => void

  // Helpers pour vérifier la variante
  isControl: boolean
  isVariantA: boolean
  isVariantB: boolean

  // Helper pour obtenir une valeur de config avec fallback
  getConfig: <T>(key: string, defaultValue: T) => T
}

// ============================================
// Hook principal
// ============================================

export function useExperiment(
  targetPage: TargetPage,
  options: UseExperimentOptions = {}
): UseExperimentResult {
  const { autoTrackView = true, autoTrackTimeOnPage = false } = options

  const {
    isLoading,
    getExperimentsForPage,
    trackEvent: contextTrackEvent,
    trackPageView: contextTrackPageView
  } = useABTest()

  const pageViewTrackedRef = useRef(false)
  const mountTimeRef = useRef<number>(Date.now())

  // Récupérer les expériences pour cette page
  const pageExperiments = getExperimentsForPage(targetPage)

  // Premier test (ou null si aucun)
  const primaryExperiment = pageExperiments[0] || null

  // Tracker la vue automatiquement
  useEffect(() => {
    if (!autoTrackView || isLoading || pageViewTrackedRef.current) return

    if (primaryExperiment) {
      contextTrackPageView(primaryExperiment.experiment.id)
      pageViewTrackedRef.current = true
    }
  }, [autoTrackView, isLoading, primaryExperiment, contextTrackPageView])

  // Tracker le temps passé au démontage
  useEffect(() => {
    if (!autoTrackTimeOnPage) return

    mountTimeRef.current = Date.now()

    return () => {
      if (primaryExperiment) {
        const duration = Math.round((Date.now() - mountTimeRef.current) / 1000)
        if (duration > 0) {
          contextTrackEvent(
            primaryExperiment.experiment.id,
            'time_on_page',
            duration
          )
        }
      }
    }
  }, [autoTrackTimeOnPage, primaryExperiment, contextTrackEvent])

  // Tracker un événement pour tous les tests de la page
  const trackEvent = useCallback((
    eventType: EventType | string,
    value?: number,
    metadata?: Record<string, unknown>
  ) => {
    pageExperiments.forEach(exp => {
      contextTrackEvent(exp.experiment.id, eventType, value, metadata)
    })
  }, [pageExperiments, contextTrackEvent])

  // Tracker une vue de page pour tous les tests
  const trackPageView = useCallback(() => {
    pageExperiments.forEach(exp => {
      contextTrackPageView(exp.experiment.id)
    })
  }, [pageExperiments, contextTrackPageView])

  // Helper pour obtenir une valeur de config
  const getConfig = useCallback(<T>(key: string, defaultValue: T): T => {
    if (!primaryExperiment?.config) return defaultValue
    const value = primaryExperiment.config[key]
    return (value !== undefined ? value : defaultValue) as T
  }, [primaryExperiment])

  // Variante du test principal
  const variant = primaryExperiment?.variant || 'control'

  return {
    isLoading,
    variant,
    config: primaryExperiment?.config || {},
    experimentId: primaryExperiment?.experiment.id || null,
    experiments: pageExperiments.map(exp => ({
      id: exp.experiment.id,
      name: exp.experiment.name,
      variant: exp.variant,
      config: exp.config
    })),
    trackEvent,
    trackPageView,
    isControl: variant === 'control',
    isVariantA: variant === 'variant_a',
    isVariantB: variant === 'variant_b',
    getConfig
  }
}

// ============================================
// Hook simplifié pour un test spécifique par ID
// ============================================

interface UseSpecificExperimentResult {
  isLoading: boolean
  variant: Variant
  config: Record<string, unknown>
  trackEvent: (eventType: EventType | string, value?: number, metadata?: Record<string, unknown>) => void
  isControl: boolean
  isVariantA: boolean
  isVariantB: boolean
  getConfig: <T>(key: string, defaultValue: T) => T
}

export function useSpecificExperiment(
  experimentId: string,
  options: UseExperimentOptions = {}
): UseSpecificExperimentResult {
  const { autoTrackView = true } = options

  const {
    isLoading,
    getExperiment,
    trackEvent: contextTrackEvent,
    trackPageView: contextTrackPageView
  } = useABTest()

  const pageViewTrackedRef = useRef(false)

  const experiment = getExperiment(experimentId)

  // Tracker la vue automatiquement
  useEffect(() => {
    if (!autoTrackView || isLoading || pageViewTrackedRef.current || !experiment) return

    contextTrackPageView(experimentId)
    pageViewTrackedRef.current = true
  }, [autoTrackView, isLoading, experiment, experimentId, contextTrackPageView])

  const trackEvent = useCallback((
    eventType: EventType | string,
    value?: number,
    metadata?: Record<string, unknown>
  ) => {
    contextTrackEvent(experimentId, eventType, value, metadata)
  }, [experimentId, contextTrackEvent])

  const getConfig = useCallback(<T>(key: string, defaultValue: T): T => {
    if (!experiment?.config) return defaultValue
    const value = experiment.config[key]
    return (value !== undefined ? value : defaultValue) as T
  }, [experiment])

  const variant = experiment?.variant || 'control'

  return {
    isLoading,
    variant,
    config: experiment?.config || {},
    trackEvent,
    isControl: variant === 'control',
    isVariantA: variant === 'variant_a',
    isVariantB: variant === 'variant_b',
    getConfig
  }
}

// ============================================
// Exports
// ============================================

export type { UseExperimentOptions, UseExperimentResult, UseSpecificExperimentResult }
