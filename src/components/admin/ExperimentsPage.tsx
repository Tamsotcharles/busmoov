/**
 * ExperimentsPage - Interface admin pour la gestion des tests A/B
 *
 * Fonctionnalités:
 * - Liste des expériences avec filtres par statut
 * - Création/édition d'expériences via modal
 * - Activation/Pause/Terminaison des tests
 * - Statistiques avec intervalles de confiance et significativité
 */

import { useState, useMemo } from 'react'
import {
  FlaskConical,
  Plus,
  Play,
  Pause,
  StopCircle,
  Trash2,
  Edit,
  BarChart3,
  Eye,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Settings,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import {
  useExperiments,
  useCreateExperiment,
  useUpdateExperiment,
  useDeleteExperiment,
  useActivateExperiment,
  usePauseExperiment,
  useCompleteExperiment,
  useExperimentStats,
  type ExperimentInsert
} from '@/hooks/useSupabase'
import {
  calculateConfidenceInterval,
  chiSquareTest,
  calculateUplift,
  type TargetPage
} from '@/lib/ab-testing'

// ============================================
// Types
// ============================================

type TabType = 'active' | 'draft' | 'completed'

interface VariantConfig {
  name: string
  config: Record<string, unknown>
}

interface Experiment {
  id: string
  name: string
  description: string | null
  target_page: string
  status: string
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

const TARGET_PAGES: { value: TargetPage; label: string }[] = [
  { value: 'homepage_form', label: 'Formulaire Homepage' },
  { value: 'payment', label: 'Page de Paiement' },
  { value: 'client_dashboard', label: 'Dashboard Client' },
  { value: 'mes_devis', label: 'Mes Devis' },
  { value: 'invoice', label: 'Factures' },
  { value: 'admin', label: 'Admin' }
]

const METRICS: { value: string; label: string }[] = [
  { value: 'conversion', label: 'Taux de conversion' },
  { value: 'form_submit', label: 'Soumission formulaire' },
  { value: 'payment_complete', label: 'Paiement complété' },
  { value: 'contract_signed', label: 'Contrat signé' },
  { value: 'click_rate', label: 'Taux de clic' },
  { value: 'time_on_page', label: 'Temps sur la page' }
]

// ============================================
// Main Component
// ============================================

export function ExperimentsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null)
  const [viewingStats, setViewingStats] = useState<string | null>(null)

  // Queries
  const { data: experiments, isLoading, refetch } = useExperiments()

  // Mutations
  const createExperiment = useCreateExperiment()
  const updateExperiment = useUpdateExperiment()
  const deleteExperiment = useDeleteExperiment()
  const activateExperiment = useActivateExperiment()
  const pauseExperiment = usePauseExperiment()
  const completeExperiment = useCompleteExperiment()

  // Filtered experiments by tab
  const filteredExperiments = useMemo((): Experiment[] => {
    if (!experiments) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exps = experiments as any[]

    switch (activeTab) {
      case 'active':
        return exps.filter((e) => e.status === 'active' || e.status === 'paused')
      case 'draft':
        return exps.filter((e) => e.status === 'draft')
      case 'completed':
        return exps.filter((e) => e.status === 'completed')
      default:
        return exps
    }
  }, [experiments, activeTab])

  // Counts for tabs
  const counts = useMemo(() => {
    if (!experiments) return { active: 0, draft: 0, completed: 0 }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exps = experiments as any[]
    return {
      active: exps.filter((e) => e.status === 'active' || e.status === 'paused').length,
      draft: exps.filter((e) => e.status === 'draft').length,
      completed: exps.filter((e) => e.status === 'completed').length
    }
  }, [experiments])

  const handleCreate = async (data: ExperimentInsert & { id?: string }) => {
    await createExperiment.mutateAsync(data)
    setShowCreateModal(false)
  }

  const handleUpdate = async (data: ExperimentInsert & { id?: string }) => {
    if (!data.id) return
    await updateExperiment.mutateAsync({ ...data, id: data.id })
    setEditingExperiment(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette expérience ? Cette action est irréversible.')) return
    await deleteExperiment.mutateAsync(id)
  }

  const handleActivate = async (id: string) => {
    await activateExperiment.mutateAsync(id)
  }

  const handlePause = async (id: string) => {
    await pauseExperiment.mutateAsync(id)
  }

  const handleComplete = async (id: string) => {
    if (!confirm('Terminer cette expérience ? Les résultats seront figés.')) return
    await completeExperiment.mutateAsync(id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple to-magenta flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Tests A/B</h1>
            <p className="text-sm text-gray-500">Gérez vos expériences et analysez les résultats</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouvelle expérience
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <TabButton
          active={activeTab === 'active'}
          onClick={() => setActiveTab('active')}
          count={counts.active}
          icon={<Play className="w-4 h-4" />}
        >
          Actifs
        </TabButton>
        <TabButton
          active={activeTab === 'draft'}
          onClick={() => setActiveTab('draft')}
          count={counts.draft}
          icon={<Clock className="w-4 h-4" />}
        >
          Brouillons
        </TabButton>
        <TabButton
          active={activeTab === 'completed'}
          onClick={() => setActiveTab('completed')}
          count={counts.completed}
          icon={<CheckCircle2 className="w-4 h-4" />}
        >
          Terminés
        </TabButton>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple" />
        </div>
      ) : filteredExperiments.length === 0 ? (
        <EmptyState tab={activeTab} onCreateClick={() => setShowCreateModal(true)} />
      ) : (
        <div className="space-y-4">
          {filteredExperiments.map((experiment: Experiment) => (
            <ExperimentCard
              key={experiment.id}
              experiment={experiment}
              onEdit={() => setEditingExperiment(experiment)}
              onDelete={() => handleDelete(experiment.id)}
              onActivate={() => handleActivate(experiment.id)}
              onPause={() => handlePause(experiment.id)}
              onComplete={() => handleComplete(experiment.id)}
              onViewStats={() => setViewingStats(experiment.id)}
              isViewingStats={viewingStats === experiment.id}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <ExperimentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreate}
        isLoading={createExperiment.isPending}
      />

      {/* Edit Modal */}
      <ExperimentModal
        isOpen={!!editingExperiment}
        onClose={() => setEditingExperiment(null)}
        onSave={handleUpdate}
        experiment={editingExperiment}
        isLoading={updateExperiment.isPending}
      />
    </div>
  )
}

// ============================================
// Tab Button
// ============================================

interface TabButtonProps {
  active: boolean
  onClick: () => void
  count: number
  icon: React.ReactNode
  children: React.ReactNode
}

function TabButton({ active, onClick, count, icon, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors',
        active
          ? 'border-purple text-purple'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      )}
    >
      {icon}
      {children}
      <span className={cn(
        'px-2 py-0.5 text-xs rounded-full',
        active ? 'bg-purple/10 text-purple' : 'bg-gray-100 text-gray-600'
      )}>
        {count}
      </span>
    </button>
  )
}

// ============================================
// Empty State
// ============================================

function EmptyState({ tab, onCreateClick }: { tab: TabType; onCreateClick: () => void }) {
  const messages = {
    active: {
      title: 'Aucun test actif',
      description: 'Lancez votre première expérience pour commencer à optimiser vos conversions.',
      showButton: true
    },
    draft: {
      title: 'Aucun brouillon',
      description: 'Les expériences en préparation apparaîtront ici.',
      showButton: true
    },
    completed: {
      title: 'Aucun test terminé',
      description: 'Les expériences terminées avec leurs résultats apparaîtront ici.',
      showButton: false
    }
  }

  const { title, description, showButton } = messages[tab]

  return (
    <div className="card p-12 text-center">
      <FlaskConical className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
      {showButton && (
        <button onClick={onCreateClick} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Créer une expérience
        </button>
      )}
    </div>
  )
}

// ============================================
// Experiment Card
// ============================================

interface ExperimentCardProps {
  experiment: Experiment
  onEdit: () => void
  onDelete: () => void
  onActivate: () => void
  onPause: () => void
  onComplete: () => void
  onViewStats: () => void
  isViewingStats: boolean
}

function ExperimentCard({
  experiment,
  onEdit,
  onDelete,
  onActivate,
  onPause,
  onComplete,
  onViewStats,
  isViewingStats
}: ExperimentCardProps) {
  const targetPageLabel = TARGET_PAGES.find(p => p.value === experiment.target_page)?.label || experiment.target_page

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              experiment.status === 'active' ? 'bg-green-100' :
              experiment.status === 'paused' ? 'bg-orange-100' :
              experiment.status === 'completed' ? 'bg-blue-100' :
              'bg-gray-100'
            )}>
              <FlaskConical className={cn(
                'w-5 h-5',
                experiment.status === 'active' ? 'text-green-600' :
                experiment.status === 'paused' ? 'text-orange-600' :
                experiment.status === 'completed' ? 'text-blue-600' :
                'text-gray-600'
              )} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{experiment.name}</h3>
              {experiment.description && (
                <p className="text-sm text-gray-500 mt-0.5">{experiment.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <StatusBadge status={experiment.status} />
                <span className="text-xs text-gray-400">|</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {targetPageLabel}
                </span>
                {experiment.started_at && (
                  <>
                    <span className="text-xs text-gray-400">|</span>
                    <span className="text-xs text-gray-500">
                      Démarré le {formatDate(experiment.started_at)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {experiment.status === 'draft' && (
              <button
                onClick={onActivate}
                className="btn btn-sm bg-green-50 text-green-700 hover:bg-green-100"
              >
                <Play className="w-4 h-4 mr-1" />
                Lancer
              </button>
            )}
            {experiment.status === 'active' && (
              <button
                onClick={onPause}
                className="btn btn-sm bg-orange-50 text-orange-700 hover:bg-orange-100"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </button>
            )}
            {experiment.status === 'paused' && (
              <>
                <button
                  onClick={onActivate}
                  className="btn btn-sm bg-green-50 text-green-700 hover:bg-green-100"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Reprendre
                </button>
                <button
                  onClick={onComplete}
                  className="btn btn-sm bg-blue-50 text-blue-700 hover:bg-blue-100"
                >
                  <StopCircle className="w-4 h-4 mr-1" />
                  Terminer
                </button>
              </>
            )}
            {(experiment.status === 'active' || experiment.status === 'paused' || experiment.status === 'completed') && (
              <button
                onClick={onViewStats}
                className={cn(
                  'btn btn-sm',
                  isViewingStats ? 'bg-purple text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                )}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Stats
                {isViewingStats ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </button>
            )}
            {experiment.status !== 'completed' && (
              <button
                onClick={onEdit}
                className="btn btn-sm bg-gray-50 text-gray-700 hover:bg-gray-100"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onDelete}
              className="btn btn-sm bg-red-50 text-red-700 hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Traffic Split */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <TrafficBar
            label={(experiment.variant_control as VariantConfig)?.name || 'Contrôle'}
            percentage={experiment.traffic_control}
            color="gray"
          />
          <TrafficBar
            label={(experiment.variant_a as VariantConfig)?.name || 'Variante A'}
            percentage={experiment.traffic_variant_a}
            color="purple"
          />
          {experiment.variant_b && experiment.traffic_variant_b > 0 && (
            <TrafficBar
              label={(experiment.variant_b as VariantConfig)?.name || 'Variante B'}
              percentage={experiment.traffic_variant_b}
              color="magenta"
            />
          )}
        </div>
      </div>

      {/* Stats Panel */}
      {isViewingStats && (
        <StatsPanel experimentId={experiment.id} primaryMetric={experiment.primary_metric} />
      )}
    </div>
  )
}

// ============================================
// Status Badge
// ============================================

function StatusBadge({ status }: { status: string }) {
  const config = {
    draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
    active: { label: 'Actif', className: 'bg-green-100 text-green-700' },
    paused: { label: 'En pause', className: 'bg-orange-100 text-orange-700' },
    completed: { label: 'Terminé', className: 'bg-blue-100 text-blue-700' }
  }[status] || { label: status, className: 'bg-gray-100 text-gray-700' }

  return (
    <span className={cn('px-2 py-0.5 text-xs font-medium rounded-full', config.className)}>
      {config.label}
    </span>
  )
}

// ============================================
// Traffic Bar
// ============================================

function TrafficBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  const colorClasses = {
    gray: 'bg-gray-400',
    purple: 'bg-purple',
    magenta: 'bg-magenta'
  }[color] || 'bg-gray-400'

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-900">{percentage}%</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClasses)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// ============================================
// Stats Panel
// ============================================

function StatsPanel({ experimentId, primaryMetric }: { experimentId: string; primaryMetric: string }) {
  const { data: stats, isLoading } = useExperimentStats(experimentId)

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple" />
      </div>
    )
  }

  if (!stats || !stats.byVariant || stats.byVariant.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p>Pas encore de données disponibles</p>
        <p className="text-xs mt-1">Les statistiques apparaîtront dès les premières visites</p>
      </div>
    )
  }

  // Calculer les stats par variante
  const variantStats = stats.byVariant.map((v: any) => {
    const views = v.views || 0
    const conversions = primaryMetric === 'form_submit' ? v.form_submits :
                        primaryMetric === 'payment_complete' ? v.payments :
                        primaryMetric === 'contract_signed' ? v.contracts :
                        v.form_submits // default to form_submit

    const ci = calculateConfidenceInterval(conversions, views)

    return {
      variant: v.variant,
      views,
      conversions,
      rate: ci.rate,
      ciLower: ci.lower,
      ciUpper: ci.upper
    }
  })

  // Trouver le contrôle et calculer la significativité
  const controlStats = variantStats.find((v: any) => v.variant === 'control')
  const variantAStats = variantStats.find((v: any) => v.variant === 'variant_a')
  const variantBStats = variantStats.find((v: any) => v.variant === 'variant_b')

  let significanceA = null
  let significanceB = null

  if (controlStats && variantAStats) {
    significanceA = chiSquareTest(
      controlStats.conversions, controlStats.views,
      variantAStats.conversions, variantAStats.views
    )
  }

  if (controlStats && variantBStats) {
    significanceB = chiSquareTest(
      controlStats.conversions, controlStats.views,
      variantBStats.conversions, variantBStats.views
    )
  }

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {variantStats.map((v: any) => (
          <StatCard
            key={v.variant}
            variant={v.variant}
            views={v.views}
            conversions={v.conversions}
            rate={v.rate}
            ciLower={v.ciLower}
            ciUpper={v.ciUpper}
            isControl={v.variant === 'control'}
            uplift={v.variant !== 'control' && controlStats
              ? calculateUplift(controlStats.rate, v.rate)
              : null
            }
            significance={
              v.variant === 'variant_a' ? significanceA :
              v.variant === 'variant_b' ? significanceB :
              null
            }
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Significatif (p &lt; 0.05)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Tendance (p &lt; 0.1)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-300" />
          <span>Non significatif</span>
        </div>
      </div>
    </div>
  )
}

// ============================================
// Stat Card
// ============================================

interface StatCardProps {
  variant: string
  views: number
  conversions: number
  rate: number
  ciLower: number
  ciUpper: number
  isControl: boolean
  uplift: number | null
  significance: { pValue: number; significant: boolean; chiSquare: number } | null
}

function StatCard({
  variant,
  views,
  conversions,
  rate,
  ciLower,
  ciUpper,
  isControl,
  uplift,
  significance
}: StatCardProps) {
  const variantLabel = variant === 'control' ? 'Contrôle' :
                       variant === 'variant_a' ? 'Variante A' :
                       variant === 'variant_b' ? 'Variante B' : variant

  const significanceColor = significance
    ? significance.pValue < 0.05
      ? 'bg-green-500'
      : significance.pValue < 0.1
        ? 'bg-orange-500'
        : 'bg-gray-300'
    : 'bg-gray-300'

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      isControl ? 'bg-gray-50 border-gray-200' : 'bg-purple-50 border-purple-200'
    )}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-gray-900">{variantLabel}</span>
        {significance && (
          <div className={cn('w-3 h-3 rounded-full', significanceColor)} title={`p = ${significance.pValue.toFixed(4)}`} />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Vues
          </span>
          <span className="text-sm font-medium">{views.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Conversions
          </span>
          <span className="text-sm font-medium">{conversions.toLocaleString()}</span>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Taux</span>
            <span className="text-lg font-bold text-gray-900">{rate.toFixed(2)}%</span>
          </div>
          <div className="text-xs text-gray-400 text-right">
            IC 95%: [{ciLower.toFixed(2)}% - {ciUpper.toFixed(2)}%]
          </div>
        </div>

        {uplift !== null && (
          <div className={cn(
            'flex items-center justify-between pt-2 border-t',
            uplift > 0 ? 'text-green-600' : uplift < 0 ? 'text-red-600' : 'text-gray-600'
          )}>
            <span className="text-xs flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Uplift
            </span>
            <span className="text-sm font-medium">
              {uplift > 0 ? '+' : ''}{uplift.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// Experiment Modal
// ============================================

interface ExperimentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ExperimentInsert & { id?: string }) => void
  experiment?: Experiment | null
  isLoading: boolean
}

function ExperimentModal({ isOpen, onClose, onSave, experiment, isLoading }: ExperimentModalProps) {
  const [formData, setFormData] = useState<{
    name: string
    description: string
    target_page: TargetPage
    primary_metric: string
    traffic_control: number
    traffic_variant_a: number
    traffic_variant_b: number
    variant_control_name: string
    variant_a_name: string
    variant_b_name: string
    hasVariantB: boolean
  }>({
    name: '',
    description: '',
    target_page: 'homepage_form',
    primary_metric: 'conversion',
    traffic_control: 50,
    traffic_variant_a: 50,
    traffic_variant_b: 0,
    variant_control_name: 'Contrôle',
    variant_a_name: 'Variante A',
    variant_b_name: 'Variante B',
    hasVariantB: false
  })

  // Reset form when modal opens/closes or experiment changes
  useState(() => {
    if (experiment) {
      setFormData({
        name: experiment.name,
        description: experiment.description || '',
        target_page: experiment.target_page as TargetPage,
        primary_metric: experiment.primary_metric,
        traffic_control: experiment.traffic_control,
        traffic_variant_a: experiment.traffic_variant_a,
        traffic_variant_b: experiment.traffic_variant_b,
        variant_control_name: (experiment.variant_control as VariantConfig)?.name || 'Contrôle',
        variant_a_name: (experiment.variant_a as VariantConfig)?.name || 'Variante A',
        variant_b_name: (experiment.variant_b as VariantConfig)?.name || 'Variante B',
        hasVariantB: !!experiment.variant_b && experiment.traffic_variant_b > 0
      })
    } else {
      setFormData({
        name: '',
        description: '',
        target_page: 'homepage_form',
        primary_metric: 'conversion',
        traffic_control: 50,
        traffic_variant_a: 50,
        traffic_variant_b: 0,
        variant_control_name: 'Contrôle',
        variant_a_name: 'Variante A',
        variant_b_name: 'Variante B',
        hasVariantB: false
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const data: ExperimentInsert & { id?: string } = {
      name: formData.name,
      description: formData.description || undefined,
      target_page: formData.target_page,
      primary_metric: formData.primary_metric,
      traffic_control: formData.traffic_control,
      traffic_variant_a: formData.traffic_variant_a,
      traffic_variant_b: formData.hasVariantB ? formData.traffic_variant_b : 0,
      variant_control: { name: formData.variant_control_name, config: {} },
      variant_a: { name: formData.variant_a_name, config: {} },
      variant_b: formData.hasVariantB
        ? { name: formData.variant_b_name, config: {} }
        : null
    }

    if (experiment) {
      data.id = experiment.id
    }

    onSave(data)
  }

  const totalTraffic = formData.traffic_control + formData.traffic_variant_a +
    (formData.hasVariantB ? formData.traffic_variant_b : 0)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={experiment ? 'Modifier l\'expérience' : 'Nouvelle expérience'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="label">Nom de l'expérience *</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Test formulaire simplifié"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez l'objectif de ce test..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Page cible *</label>
              <select
                className="input"
                value={formData.target_page}
                onChange={(e) => setFormData({ ...formData, target_page: e.target.value as TargetPage })}
              >
                {TARGET_PAGES.map((page) => (
                  <option key={page.value} value={page.value}>
                    {page.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Métrique principale</label>
              <select
                className="input"
                value={formData.primary_metric}
                onChange={(e) => setFormData({ ...formData, primary_metric: e.target.value })}
              >
                {METRICS.map((metric) => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration des variantes
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom du contrôle</label>
              <input
                type="text"
                className="input"
                value={formData.variant_control_name}
                onChange={(e) => setFormData({ ...formData, variant_control_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Nom de la variante A</label>
              <input
                type="text"
                className="input"
                value={formData.variant_a_name}
                onChange={(e) => setFormData({ ...formData, variant_a_name: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasVariantB"
              checked={formData.hasVariantB}
              onChange={(e) => {
                const hasB = e.target.checked
                setFormData({
                  ...formData,
                  hasVariantB: hasB,
                  traffic_control: hasB ? 34 : 50,
                  traffic_variant_a: hasB ? 33 : 50,
                  traffic_variant_b: hasB ? 33 : 0
                })
              }}
              className="rounded border-gray-300 text-purple focus:ring-purple"
            />
            <label htmlFor="hasVariantB" className="text-sm text-gray-700">
              Ajouter une variante B (test A/B/C)
            </label>
          </div>

          {formData.hasVariantB && (
            <div>
              <label className="label">Nom de la variante B</label>
              <input
                type="text"
                className="input"
                value={formData.variant_b_name}
                onChange={(e) => setFormData({ ...formData, variant_b_name: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* Traffic Split */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Répartition du trafic
            <span className={cn(
              'ml-auto text-sm',
              totalTraffic === 100 ? 'text-green-600' : 'text-red-600'
            )}>
              Total: {totalTraffic}%
            </span>
          </h4>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-600">{formData.variant_control_name}</label>
                <span className="text-sm font-medium">{formData.traffic_control}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.traffic_control}
                onChange={(e) => setFormData({ ...formData, traffic_control: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-gray-600">{formData.variant_a_name}</label>
                <span className="text-sm font-medium">{formData.traffic_variant_a}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.traffic_variant_a}
                onChange={(e) => setFormData({ ...formData, traffic_variant_a: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

            {formData.hasVariantB && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">{formData.variant_b_name}</label>
                  <span className="text-sm font-medium">{formData.traffic_variant_b}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.traffic_variant_b}
                  onChange={(e) => setFormData({ ...formData, traffic_variant_b: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
          </div>

          {totalTraffic !== 100 && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              Le total doit être égal à 100%
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || totalTraffic !== 100 || !formData.name}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Enregistrement...
              </>
            ) : experiment ? (
              'Mettre à jour'
            ) : (
              'Créer l\'expérience'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ExperimentsPage
