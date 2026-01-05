/**
 * ABTestProvider - Context global pour le système A/B Testing
 *
 * Ce provider charge les expériences actives au démarrage et gère
 * l'assignation des variantes pour chaque visiteur.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import {
  getOrCreateSessionId,
  getActiveExperiments,
  getOrCreateAssignment,
  trackEvent as trackEventFn,
  trackPageView as trackPageViewFn,
} from '@/lib/ab-testing'
import type {
  Experiment,
  ExperimentAssignment,
  TargetPage,
  Variant,
  EventType
} from '@/lib/ab-testing'

// ============================================
// Types
// ============================================

interface ExperimentWithAssignment {
  experiment: Experiment
  assignment: ExperimentAssignment | null
  variant: Variant
  config: Record<string, unknown>
}

interface ABTestContextValue {
  // État
  isLoading: boolean
  sessionId: string | null
  experiments: Map<string, ExperimentWithAssignment> // Keyed by experiment ID

  // Actions
  getExperiment: (experimentId: string) => ExperimentWithAssignment | null
  getExperimentsForPage: (targetPage: TargetPage) => ExperimentWithAssignment[]
  trackEvent: (experimentId: string, eventType: EventType | string, value?: number, metadata?: Record<string, unknown>) => Promise<void>
  trackPageView: (experimentId: string) => Promise<void>

  // Contexte utilisateur (peut être mis à jour après login/création dossier)
  setDossierId: (dossierId: string) => void
  setDemandeId: (demandeId: string) => void
}

const ABTestContext = createContext<ABTestContextValue | null>(null)

// ============================================
// Provider Component
// ============================================

interface ABTestProviderProps {
  children: React.ReactNode
  // Optionnel: identifiants connus au chargement
  initialDossierId?: string
  initialDemandeId?: string
}

export function ABTestProvider({
  children,
  initialDossierId,
  initialDemandeId
}: ABTestProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [dossierId, setDossierId] = useState<string | null>(initialDossierId || null)
  const [demandeId, setDemandeId] = useState<string | null>(initialDemandeId || null)
  const [experiments, setExperiments] = useState<Map<string, ExperimentWithAssignment>>(new Map())

  // Initialiser le session ID
  useEffect(() => {
    const sid = getOrCreateSessionId()
    setSessionId(sid)
  }, [])

  // Charger les expériences actives et créer les assignations
  useEffect(() => {
    async function loadExperiments() {
      if (!sessionId) return

      setIsLoading(true)

      try {
        // Charger toutes les expériences actives (toutes pages)
        const allPages: TargetPage[] = ['homepage_form', 'payment', 'client_dashboard', 'mes_devis', 'invoice', 'admin']
        const allExperiments: Experiment[] = []

        for (const page of allPages) {
          const pageExperiments = await getActiveExperiments(page)
          allExperiments.push(...pageExperiments)
        }

        // Créer les assignations pour chaque expérience
        const experimentsMap = new Map<string, ExperimentWithAssignment>()

        for (const experiment of allExperiments) {
          const assignment = await getOrCreateAssignment(experiment, {
            sessionId,
            dossierId: dossierId || undefined,
            demandeId: demandeId || undefined
          })

          const variant = assignment?.variant || 'control'

          // Récupérer la config de la variante
          let config: Record<string, unknown> = {}
          if (variant === 'control' && experiment.variant_control) {
            config = (experiment.variant_control as { config?: Record<string, unknown> }).config || {}
          } else if (variant === 'variant_a' && experiment.variant_a) {
            config = (experiment.variant_a as { config?: Record<string, unknown> }).config || {}
          } else if (variant === 'variant_b' && experiment.variant_b) {
            config = (experiment.variant_b as { config?: Record<string, unknown> }).config || {}
          }

          experimentsMap.set(experiment.id, {
            experiment,
            assignment,
            variant,
            config
          })
        }

        setExperiments(experimentsMap)
      } catch (error) {
        console.error('[ABTestProvider] Error loading experiments:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadExperiments()
  }, [sessionId, dossierId, demandeId])

  // Récupérer une expérience par ID
  const getExperiment = useCallback((experimentId: string): ExperimentWithAssignment | null => {
    return experiments.get(experimentId) || null
  }, [experiments])

  // Récupérer toutes les expériences pour une page
  const getExperimentsForPage = useCallback((targetPage: TargetPage): ExperimentWithAssignment[] => {
    const result: ExperimentWithAssignment[] = []
    experiments.forEach((exp) => {
      if (exp.experiment.target_page === targetPage) {
        result.push(exp)
      }
    })
    return result
  }, [experiments])

  // Tracker un événement
  const trackEvent = useCallback(async (
    experimentId: string,
    eventType: EventType | string,
    value?: number,
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    const exp = experiments.get(experimentId)
    if (!exp) {
      console.warn(`[ABTestProvider] Experiment ${experimentId} not found for tracking`)
      return
    }
    await trackEventFn(experimentId, exp.assignment?.id || null, eventType, value, metadata)
  }, [experiments])

  // Tracker une vue de page
  const trackPageView = useCallback(async (experimentId: string): Promise<void> => {
    const exp = experiments.get(experimentId)
    if (!exp) {
      console.warn(`[ABTestProvider] Experiment ${experimentId} not found for page view tracking`)
      return
    }
    await trackPageViewFn(experimentId, exp.assignment?.id || null)
  }, [experiments])

  // Mettre à jour les identifiants utilisateur
  const handleSetDossierId = useCallback((newDossierId: string) => {
    setDossierId(newDossierId)
  }, [])

  const handleSetDemandeId = useCallback((newDemandeId: string) => {
    setDemandeId(newDemandeId)
  }, [])

  const value = useMemo<ABTestContextValue>(() => ({
    isLoading,
    sessionId,
    experiments,
    getExperiment,
    getExperimentsForPage,
    trackEvent,
    trackPageView,
    setDossierId: handleSetDossierId,
    setDemandeId: handleSetDemandeId
  }), [
    isLoading,
    sessionId,
    experiments,
    getExperiment,
    getExperimentsForPage,
    trackEvent,
    trackPageView,
    handleSetDossierId,
    handleSetDemandeId
  ])

  return (
    <ABTestContext.Provider value={value}>
      {children}
    </ABTestContext.Provider>
  )
}

// ============================================
// Hook pour accéder au contexte
// ============================================

export function useABTest(): ABTestContextValue {
  const context = useContext(ABTestContext)
  if (!context) {
    throw new Error('useABTest must be used within an ABTestProvider')
  }
  return context
}

export { ABTestContext }
