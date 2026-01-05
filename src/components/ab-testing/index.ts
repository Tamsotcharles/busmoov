/**
 * A/B Testing Module Exports
 */

// Provider
export { ABTestProvider, useABTest, ABTestContext } from './ABTestProvider'

// Hooks
export {
  useExperiment,
  useSpecificExperiment,
  type UseExperimentOptions,
  type UseExperimentResult,
  type UseSpecificExperimentResult
} from './useExperiment'

// Re-export useful types and functions from lib
export {
  type Experiment,
  type ExperimentAssignment,
  type Variant,
  type TargetPage,
  type EventType,
  type VariantConfig,
  calculateConfidenceInterval,
  chiSquareTest,
  calculateUplift
} from '@/lib/ab-testing'
