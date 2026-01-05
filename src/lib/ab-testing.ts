/**
 * A/B Testing Utilities for Busmoov
 *
 * Ce module gère l'assignation des variantes et le tracking des événements
 * pour le système de tests A/B.
 */

import { supabase } from './supabase'

// ============================================
// Types
// ============================================

export type Variant = 'control' | 'variant_a' | 'variant_b'

export type TargetPage =
  | 'homepage_form'
  | 'payment'
  | 'client_dashboard'
  | 'mes_devis'
  | 'invoice'
  | 'admin'

export type EventType =
  | 'view'
  | 'form_start'
  | 'form_submit'
  | 'payment_view'
  | 'payment_complete'
  | 'contract_signed'
  | 'click'
  | 'time_on_page'

export interface Experiment {
  id: string
  name: string
  description: string | null
  target_page: TargetPage
  status: 'draft' | 'active' | 'paused' | 'completed'
  variant_control: VariantConfig
  variant_a: VariantConfig
  variant_b: VariantConfig | null
  traffic_control: number
  traffic_variant_a: number
  traffic_variant_b: number
  primary_metric: string
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
}

export interface VariantConfig {
  name: string
  config: Record<string, unknown>
}

export interface ExperimentAssignment {
  id: string
  experiment_id: string
  dossier_id: string | null
  demande_id: string | null
  session_id: string | null
  variant: Variant
  assigned_at: string
}

export interface TrafficSplit {
  control: number
  variant_a: number
  variant_b: number
}

// ============================================
// Session ID Management (localStorage)
// ============================================

const SESSION_ID_KEY = 'busmoov_ab_session_id'

/**
 * Génère un ID de session unique
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 15)
  return `${timestamp}-${randomPart}`
}

/**
 * Récupère ou crée un session ID pour le visiteur
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId()
  }

  let sessionId = localStorage.getItem(SESSION_ID_KEY)

  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem(SESSION_ID_KEY, sessionId)
  }

  return sessionId
}

/**
 * Récupère le session ID actuel (sans en créer un nouveau)
 */
export function getSessionId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(SESSION_ID_KEY)
}

// ============================================
// Hash Function (pour assignation déterministe)
// ============================================

/**
 * Fonction de hash simple et déterministe (djb2)
 * Utilisée pour assigner de manière cohérente un visiteur à une variante
 */
function hashCode(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
  }
  return hash
}

// ============================================
// Variant Assignment
// ============================================

/**
 * Assigne une variante de manière déterministe basée sur un hash
 *
 * @param experimentId - ID de l'expérience
 * @param identifier - Identifiant unique (session_id, dossier_id, etc.)
 * @param trafficSplit - Répartition du trafic en pourcentage
 * @returns La variante assignée
 */
export function assignVariant(
  experimentId: string,
  identifier: string,
  trafficSplit: TrafficSplit
): Variant {
  // Créer un hash déterministe basé sur l'expérience et l'identifiant
  const hash = hashCode(`${experimentId}-${identifier}`)
  const bucket = Math.abs(hash) % 100

  // Assigner selon les pourcentages
  if (bucket < trafficSplit.control) {
    return 'control'
  }

  if (bucket < trafficSplit.control + trafficSplit.variant_a) {
    return 'variant_a'
  }

  return 'variant_b'
}

/**
 * Récupère ou crée une assignation pour un visiteur
 */
export async function getOrCreateAssignment(
  experiment: Experiment,
  options: {
    sessionId?: string
    dossierId?: string
    demandeId?: string
  }
): Promise<ExperimentAssignment | null> {
  const { sessionId, dossierId, demandeId } = options

  // Au moins un identifiant requis
  if (!sessionId && !dossierId && !demandeId) {
    console.error('[AB Testing] No identifier provided for assignment')
    return null
  }

  try {
    // Chercher une assignation existante
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('experiment_assignments')
      .select('*')
      .eq('experiment_id', experiment.id)

    if (dossierId) {
      query = query.eq('dossier_id', dossierId)
    } else if (demandeId) {
      query = query.eq('demande_id', demandeId)
    } else if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data: existing, error: selectError } = await query.maybeSingle()

    if (selectError) {
      console.error('[AB Testing] Error checking existing assignment:', selectError)
      return null
    }

    // Si assignation existante, la retourner
    if (existing) {
      return existing as ExperimentAssignment
    }

    // Sinon, créer une nouvelle assignation
    const identifier = dossierId || demandeId || sessionId!
    const variant = assignVariant(
      experiment.id,
      identifier,
      {
        control: experiment.traffic_control,
        variant_a: experiment.traffic_variant_a,
        variant_b: experiment.traffic_variant_b
      }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newAssignment, error: insertError } = await (supabase as any)
      .from('experiment_assignments')
      .insert({
        experiment_id: experiment.id,
        dossier_id: dossierId || null,
        demande_id: demandeId || null,
        session_id: (!dossierId && !demandeId) ? sessionId : null,
        variant
      })
      .select()
      .single()

    if (insertError) {
      // Peut arriver en cas de race condition, réessayer la lecture
      if (insertError.code === '23505') { // Unique violation
        const { data: retryData } = await query.single()
        return retryData as ExperimentAssignment
      }
      console.error('[AB Testing] Error creating assignment:', insertError)
      return null
    }

    return newAssignment as ExperimentAssignment

  } catch (error) {
    console.error('[AB Testing] Unexpected error in getOrCreateAssignment:', error)
    return null
  }
}

// ============================================
// Event Tracking
// ============================================

/**
 * Enregistre un événement pour une assignation
 */
export async function trackEvent(
  experimentId: string,
  assignmentId: string | null,
  eventType: EventType | string,
  eventValue?: number,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('experiment_events')
      .insert({
        experiment_id: experimentId,
        assignment_id: assignmentId,
        event_type: eventType,
        event_value: eventValue ?? null,
        event_metadata: metadata ?? null
      })

    if (error) {
      console.error('[AB Testing] Error tracking event:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[AB Testing] Unexpected error in trackEvent:', error)
    return false
  }
}

/**
 * Helper pour tracker une vue de page
 */
export async function trackPageView(
  experimentId: string,
  assignmentId: string | null
): Promise<boolean> {
  return trackEvent(experimentId, assignmentId, 'view')
}

/**
 * Helper pour tracker le temps passé sur une page
 */
export async function trackTimeOnPage(
  experimentId: string,
  assignmentId: string | null,
  durationSeconds: number
): Promise<boolean> {
  return trackEvent(experimentId, assignmentId, 'time_on_page', durationSeconds)
}

// ============================================
// Statistics Helpers
// ============================================

/**
 * Calcule l'intervalle de confiance à 95% pour une proportion
 * Utilise l'approximation normale (Wilson score interval)
 */
export function calculateConfidenceInterval(
  successes: number,
  total: number
): { lower: number; upper: number; rate: number } {
  if (total === 0) {
    return { lower: 0, upper: 0, rate: 0 }
  }

  const p = successes / total
  const z = 1.96 // 95% confidence
  const n = total

  // Wilson score interval
  const denominator = 1 + (z * z) / n
  const center = (p + (z * z) / (2 * n)) / denominator
  const margin = (z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n)) / denominator

  return {
    lower: Math.max(0, (center - margin) * 100),
    upper: Math.min(100, (center + margin) * 100),
    rate: p * 100
  }
}

/**
 * Effectue un test chi-carré pour déterminer la significativité statistique
 * @returns p-value (< 0.05 = significatif)
 */
export function chiSquareTest(
  controlSuccess: number,
  controlTotal: number,
  variantSuccess: number,
  variantTotal: number
): { pValue: number; significant: boolean; chiSquare: number } {
  const total = controlTotal + variantTotal
  const totalSuccess = controlSuccess + variantSuccess
  const totalFailure = total - totalSuccess

  if (total === 0 || controlTotal === 0 || variantTotal === 0) {
    return { pValue: 1, significant: false, chiSquare: 0 }
  }

  // Expected values
  const expectedControlSuccess = (controlTotal * totalSuccess) / total
  const expectedControlFailure = (controlTotal * totalFailure) / total
  const expectedVariantSuccess = (variantTotal * totalSuccess) / total
  const expectedVariantFailure = (variantTotal * totalFailure) / total

  // Chi-square statistic
  const controlFailure = controlTotal - controlSuccess
  const variantFailure = variantTotal - variantSuccess

  const chiSquare =
    Math.pow(controlSuccess - expectedControlSuccess, 2) / expectedControlSuccess +
    Math.pow(controlFailure - expectedControlFailure, 2) / expectedControlFailure +
    Math.pow(variantSuccess - expectedVariantSuccess, 2) / expectedVariantSuccess +
    Math.pow(variantFailure - expectedVariantFailure, 2) / expectedVariantFailure

  // Approximation de la p-value (distribution chi-carré avec 1 degré de liberté)
  // Utilise la fonction de distribution cumulative inverse
  const pValue = 1 - chiSquareCDF(chiSquare, 1)

  return {
    pValue,
    significant: pValue < 0.05,
    chiSquare
  }
}

/**
 * Fonction de distribution cumulative chi-carré (approximation)
 */
function chiSquareCDF(x: number, k: number): number {
  if (x <= 0) return 0

  // Approximation using the regularized incomplete gamma function
  // Pour k=1 (notre cas), on peut utiliser une formule simplifiée
  if (k === 1) {
    // CDF for chi-square with 1 df = 2 * Φ(√x) - 1
    // où Φ est la CDF de la normale standard
    const sqrtX = Math.sqrt(x)
    return erf(sqrtX / Math.sqrt(2))
  }

  // Fallback pour autres k (pas utilisé actuellement)
  return 0
}

/**
 * Error function (erf) approximation
 */
function erf(x: number): number {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

/**
 * Calcule l'uplift (amélioration) d'une variante par rapport au contrôle
 */
export function calculateUplift(
  controlRate: number,
  variantRate: number
): number {
  if (controlRate === 0) {
    return variantRate > 0 ? 100 : 0
  }
  return ((variantRate - controlRate) / controlRate) * 100
}

// ============================================
// Fetch Active Experiments
// ============================================

/**
 * Récupère toutes les expériences actives pour une page cible
 */
export async function getActiveExperiments(
  targetPage: TargetPage
): Promise<Experiment[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('experiments')
      .select('*')
      .eq('status', 'active')
      .eq('target_page', targetPage)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[AB Testing] Error fetching active experiments:', error)
      return []
    }

    return (data || []) as Experiment[]
  } catch (error) {
    console.error('[AB Testing] Unexpected error in getActiveExperiments:', error)
    return []
  }
}

/**
 * Récupère toutes les expériences actives (toutes pages confondues)
 */
export async function getAllActiveExperiments(): Promise<Experiment[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('experiments')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[AB Testing] Error fetching all active experiments:', error)
      return []
    }

    return (data || []) as Experiment[]
  } catch (error) {
    console.error('[AB Testing] Unexpected error in getAllActiveExperiments:', error)
    return []
  }
}
