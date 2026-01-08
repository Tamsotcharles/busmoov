import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Workflow,
  Play,
  Pause,
  Edit2,
  Save,
  X,
  Clock,
  Mail,
  RefreshCw,
  CheckCircle,
  Zap,
  Calendar,
  Users,
  FileText,
  Truck,
  Timer,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'

// Interface flexible pour les règles de workflow
interface WorkflowRule {
  id: string
  name: string
  description?: string | null
  trigger_event: string // Le champ existant dans la DB
  conditions: Record<string, unknown> | null
  actions: Array<{ type: string; params?: Record<string, unknown> }> | null
  action_type?: string | null
  action_config?: Record<string, unknown> | null
  delay_hours?: number | null
  repeat_interval_hours?: number | null
  max_repeats?: number | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
}

interface WorkflowExecution {
  id: string
  rule_id: string
  dossier_id: string
  execution_count: number
  last_executed_at: string | null
  next_execution_at: string | null
  status: string
  result: Record<string, unknown> | null
  created_at: string
  dossiers?: {
    reference: string
    client_name: string
  } | null
}

const TRIGGER_TYPES = [
  { value: 'devis_sent', label: 'Devis envoyé', icon: FileText, color: 'text-blue-600' },
  { value: 'contrat_signed', label: 'Contrat signé', icon: FileText, color: 'text-purple-600' },
  { value: 'payment_received', label: 'Paiement reçu', icon: CheckCircle, color: 'text-green-600' },
  { value: 'departure_reminder', label: 'Rappel avant départ', icon: Calendar, color: 'text-orange-600' },
  { value: 'voyage_completed', label: 'Voyage terminé', icon: CheckCircle, color: 'text-emerald-600' },
  { value: 'chauffeur_received', label: 'Infos chauffeur reçues', icon: Truck, color: 'text-teal-600' },
  { value: 'devis_accepted', label: 'Devis accepté', icon: CheckCircle, color: 'text-green-600' },
  { value: 'dossier_created', label: 'Dossier créé', icon: FileText, color: 'text-blue-600' },
  { value: 'info_submitted', label: 'Infos voyage soumises', icon: Users, color: 'text-cyan-600' },
  { value: 'bpa_received', label: 'BPA reçu', icon: Truck, color: 'text-indigo-600' },
]

const ACTION_TYPES = [
  { value: 'send_email', label: 'Envoyer un email' },
  { value: 'send_sms', label: 'Envoyer un SMS' },
  { value: 'update_status', label: 'Mettre à jour le statut' },
  { value: 'create_task', label: 'Créer une tâche' },
  { value: 'notify_admin', label: 'Notifier l\'admin' },
]

interface CronJob {
  jobid: number
  schedule: string
  command: string
  nodename: string
  nodeport: number
  database: string
  username: string
  active: boolean
}

interface CronJobRun {
  runid: number
  jobid: number
  job_pid: number
  database: string
  username: string
  command: string
  status: string
  return_message: string
  start_time: string
  end_time: string
}

interface EmailTemplate {
  key: string
  name: string
  is_active: boolean
}

export function WorkflowPage() {
  const [rules, setRules] = useState<WorkflowRule[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'rules' | 'history' | 'scheduler'>('rules')

  // État pour le planificateur cron
  const [cronJobs, setCronJobs] = useState<CronJob[]>([])
  const [cronHistory, setCronHistory] = useState<CronJobRun[]>([])
  const [cronLoading, setCronLoading] = useState(false)
  const [cronError, setCronError] = useState<string | null>(null)
  const [isRunningManual, setIsRunningManual] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_event: 'devis_sent',
    action_type: 'send_email',
    delay_hours: 0,
    repeat_interval_hours: 0,
    max_repeats: 1,
    conditions: '{}',
    action_config: '{}',
    is_active: true,
    // Conditions simplifiées
    cond_days_before: '',
    cond_solde_pending: false,
    cond_infos_missing: false,
    cond_chauffeur_missing: false,
    cond_chauffeur_received: false,
    cond_bpa_received: false,
    cond_no_response: false,
    cond_payment_status: '',
    // Config action simplifiée
    config_template: '',
    config_subject: '',
  })

  useEffect(() => {
    loadRules()
    loadExecutions()
    loadEmailTemplates()
  }, [])

  const loadEmailTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('key, name')
        .order('name')

      if (error) throw error
      setEmailTemplates((data || []).map(t => ({ ...t, is_active: true })) as EmailTemplate[])
    } catch (err) {
      console.error('Error loading email templates:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'scheduler') {
      loadCronJobs()
    }
  }, [activeTab])

  const loadCronJobs = async () => {
    setCronLoading(true)
    setCronError(null)
    try {
      // Charger les jobs cron (utiliser as any car les types ne sont pas générés)
      const { data: jobs, error: jobsError } = await (supabase.rpc as any)('get_cron_jobs')
      if (jobsError) {
        // L'extension pg_cron n'est peut-être pas installée
        if (jobsError.message.includes('does not exist')) {
          setCronError('L\'extension pg_cron n\'est pas activée. Activez-la depuis Database > Extensions dans Supabase.')
        } else {
          setCronError(jobsError.message)
        }
        setCronJobs([])
      } else {
        setCronJobs((jobs as CronJob[]) || [])
      }

      // Charger l'historique des exécutions
      const { data: history, error: historyError } = await (supabase.rpc as any)('get_cron_job_history')
      if (!historyError && history) {
        setCronHistory(history as CronJobRun[])
      }
    } catch (err) {
      console.error('Erreur chargement cron:', err)
      setCronError('Erreur lors du chargement des jobs cron')
    } finally {
      setCronLoading(false)
    }
  }

  const createCronJob = async () => {
    setCronLoading(true)
    try {
      const { error } = await (supabase.rpc as any)('create_departure_reminder_cron')
      if (error) throw error
      await loadCronJobs()
      alert('Job cron créé avec succès !')
    } catch (err: any) {
      console.error('Erreur création cron:', err)
      alert(`Erreur: ${err.message}`)
    } finally {
      setCronLoading(false)
    }
  }

  const deleteCronJob = async (jobName: string) => {
    if (!confirm(`Supprimer le job "${jobName}" ?`)) return
    setCronLoading(true)
    try {
      const { error } = await (supabase.rpc as any)('delete_cron_job', { job_name: jobName })
      if (error) throw error
      await loadCronJobs()
    } catch (err: any) {
      console.error('Erreur suppression cron:', err)
      alert(`Erreur: ${err.message}`)
    } finally {
      setCronLoading(false)
    }
  }

  const runManualCheck = async () => {
    setIsRunningManual(true)
    try {
      // Appeler directement la fonction check_departure_reminders
      const { error } = await (supabase.rpc as any)('check_departure_reminders')
      if (error) throw error
      alert('Vérification des relances effectuée avec succès !')
      await loadCronJobs()
    } catch (err: any) {
      console.error('Erreur exécution manuelle:', err)
      alert(`Erreur: ${err.message}`)
    } finally {
      setIsRunningManual(false)
    }
  }

  const loadRules = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('workflow_rules')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRules((data as unknown as WorkflowRule[]) || [])
    } catch (err) {
      console.error('Erreur chargement règles:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const loadExecutions = async () => {
    try {
      // La table workflow_executions n'existe peut-être pas encore
      const { data, error } = await supabase
        .from('workflow_executions' as any)
        .select(`
          *,
          dossiers:dossier_id (reference, client_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // Table n'existe pas encore
        console.log('Table workflow_executions non disponible:', error.message)
        setExecutions([])
        return
      }
      setExecutions((data as unknown as WorkflowExecution[]) || [])
    } catch (err) {
      console.error('Erreur chargement exécutions:', err)
      setExecutions([])
    }
  }

  const handleEdit = (rule: WorkflowRule) => {
    setSelectedRule(rule)
    const conditions = rule.conditions || {}
    const actionConfig = rule.action_config || rule.actions?.[0]?.params || {}
    setFormData({
      name: rule.name,
      description: rule.description || '',
      trigger_event: rule.trigger_event,
      action_type: rule.action_type || rule.actions?.[0]?.type || 'send_email',
      delay_hours: rule.delay_hours || 0,
      repeat_interval_hours: rule.repeat_interval_hours || 0,
      max_repeats: rule.max_repeats || 1,
      conditions: JSON.stringify(rule.conditions || {}, null, 2),
      action_config: JSON.stringify(rule.action_config || rule.actions?.[0]?.params || {}, null, 2),
      is_active: rule.is_active ?? true,
      // Extraire les conditions simplifiées
      cond_days_before: (conditions as any).days_before?.toString() || '',
      cond_solde_pending: !!(conditions as any).solde_pending,
      cond_infos_missing: !!(conditions as any).infos_missing,
      cond_chauffeur_missing: !!(conditions as any).chauffeur_missing,
      cond_chauffeur_received: !!(conditions as any).chauffeur_received,
      cond_bpa_received: !!(conditions as any).bpa_received,
      cond_no_response: !!(conditions as any).no_response,
      cond_payment_status: (conditions as any).payment_status || '',
      // Extraire la config action
      config_template: (actionConfig as any).template || '',
      config_subject: (actionConfig as any).subject || '',
    })
    setIsEditing(true)
  }

  const handleCreate = () => {
    setSelectedRule(null)
    setFormData({
      name: '',
      description: '',
      trigger_event: 'devis_sent',
      action_type: 'send_email',
      delay_hours: 24,
      repeat_interval_hours: 0,
      max_repeats: 1,
      conditions: '{}',
      action_config: '{"template": "", "subject": ""}',
      is_active: true,
      // Conditions simplifiées - valeurs par défaut
      cond_days_before: '',
      cond_solde_pending: false,
      cond_infos_missing: false,
      cond_chauffeur_missing: false,
      cond_chauffeur_received: false,
      cond_bpa_received: false,
      cond_no_response: false,
      cond_payment_status: '',
      // Config action simplifiée
      config_template: '',
      config_subject: '',
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Construire les conditions à partir des champs simplifiés
      const conditions: Record<string, unknown> = {}
      if (formData.cond_days_before) {
        conditions.days_before = parseInt(formData.cond_days_before)
      }
      if (formData.cond_solde_pending) conditions.solde_pending = true
      if (formData.cond_infos_missing) conditions.infos_missing = true
      if (formData.cond_chauffeur_missing) conditions.chauffeur_missing = true
      if (formData.cond_chauffeur_received) conditions.chauffeur_received = true
      if (formData.cond_bpa_received) conditions.bpa_received = true
      if (formData.cond_no_response) conditions.no_response = true
      if (formData.cond_payment_status) conditions.payment_status = formData.cond_payment_status

      // Construire la config action
      const action_config: Record<string, unknown> = {}
      if (formData.config_template) action_config.template = formData.config_template
      if (formData.config_subject) action_config.subject = formData.config_subject

      // Construire le tableau actions pour compatibilité
      const actions = [{ type: formData.action_type, params: action_config }]

      const ruleData = {
        name: formData.name,
        description: formData.description || null,
        trigger_event: formData.trigger_event,
        conditions,
        actions,
        action_type: formData.action_type,
        action_config,
        delay_hours: formData.delay_hours,
        repeat_interval_hours: formData.repeat_interval_hours || null,
        max_repeats: formData.max_repeats,
        is_active: formData.is_active,
      }

      if (selectedRule) {
        const { error } = await supabase
          .from('workflow_rules')
          .update(ruleData as any)
          .eq('id', selectedRule.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('workflow_rules')
          .insert([ruleData] as any)

        if (error) throw error
      }

      await loadRules()
      setIsEditing(false)
      setSelectedRule(null)
    } catch (err) {
      console.error('Erreur sauvegarde règle:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleRuleActive = async (rule: WorkflowRule) => {
    try {
      const { error } = await supabase
        .from('workflow_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id)

      if (error) throw error
      await loadRules()
    } catch (err) {
      console.error('Erreur toggle règle:', err)
    }
  }

  const deleteRule = async (rule: WorkflowRule) => {
    if (!confirm(`Supprimer la règle "${rule.name}" ?`)) return

    try {
      const { error } = await supabase
        .from('workflow_rules')
        .delete()
        .eq('id', rule.id)

      if (error) throw error
      await loadRules()
    } catch (err) {
      console.error('Erreur suppression règle:', err)
    }
  }

  const getTriggerInfo = (type: string) => {
    return TRIGGER_TYPES.find(t => t.value === type) || {
      label: type,
      icon: Zap,
      color: 'text-gray-600'
    }
  }

  const formatDelay = (hours: number | null | undefined) => {
    if (!hours || hours === 0) return 'Immédiat'
    if (hours < 24) return `${hours}h`
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    if (remainingHours === 0) return `${days}j`
    return `${days}j ${remainingHours}h`
  }

  const getActionLabel = (rule: WorkflowRule) => {
    const actionType = rule.action_type || rule.actions?.[0]?.type
    const config = rule.action_config || rule.actions?.[0]?.params
    if (actionType === 'send_email' && config) {
      return (config as { template?: string })?.template || 'Email'
    }
    return ACTION_TYPES.find(a => a.value === actionType)?.label || actionType || 'Action'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-magenta" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-magenta/10 rounded-lg">
            <Workflow className="w-6 h-6 text-magenta" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflow & Automatisation</h1>
            <p className="text-sm text-gray-500">Gérez les règles d'automatisation et les relances</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="btn btn-primary flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Nouvelle règle
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'rules'
              ? 'text-magenta border-b-2 border-magenta'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Règles ({rules.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'history'
              ? 'text-magenta border-b-2 border-magenta'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Historique ({executions.length})
        </button>
        <button
          onClick={() => setActiveTab('scheduler')}
          className={`pb-3 px-1 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'scheduler'
              ? 'text-magenta border-b-2 border-magenta'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Timer className="w-4 h-4" />
          Planificateur
        </button>
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="grid gap-4">
          {rules.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              <Workflow className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune règle configurée</p>
              <button
                onClick={handleCreate}
                className="mt-4 text-magenta hover:underline"
              >
                Créer votre première règle
              </button>
            </div>
          ) : (
            rules.map((rule) => {
              const triggerInfo = getTriggerInfo(rule.trigger_event)
              const TriggerIcon = triggerInfo.icon

              return (
                <div
                  key={rule.id}
                  className={`card p-4 ${!rule.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${rule.is_active ? 'bg-green-50' : 'bg-gray-100'}`}>
                        <TriggerIcon className={`w-5 h-5 ${rule.is_active ? triggerInfo.color : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                          {rule.is_active ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        {rule.description && (
                          <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {triggerInfo.label}
                          </span>
                          {/* Afficher la condition J-X */}
                          {(rule.conditions as any)?.days_before && (
                            <span className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                              <Calendar className="w-3 h-3" />
                              J-{(rule.conditions as any).days_before}
                            </span>
                          )}
                          {(rule.delay_hours !== undefined && rule.delay_hours !== null && rule.delay_hours > 0) && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Délai: {formatDelay(rule.delay_hours)}
                            </span>
                          )}
                          {rule.repeat_interval_hours && (
                            <span className="flex items-center gap-1">
                              <RefreshCw className="w-3 h-3" />
                              Répète tous les {formatDelay(rule.repeat_interval_hours)} (max {rule.max_repeats || 1}x)
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {getActionLabel(rule)}
                          </span>
                          {/* Autres conditions */}
                          {(rule.conditions as any)?.solde_pending && (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Solde en attente</span>
                          )}
                          {(rule.conditions as any)?.infos_missing && (
                            <span className="bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded">Infos manquantes</span>
                          )}
                          {(rule.conditions as any)?.chauffeur_missing && (
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Chauffeur manquant</span>
                          )}
                          {(rule.conditions as any)?.bpa_received && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">BPA reçu</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRuleActive(rule)}
                        className={`p-2 rounded-lg transition-colors ${
                          rule.is_active
                            ? 'hover:bg-orange-50 text-orange-600'
                            : 'hover:bg-green-50 text-green-600'
                        }`}
                        title={rule.is_active ? 'Désactiver' : 'Activer'}
                      >
                        {rule.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteRule(rule)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Supprimer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dossier</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Règle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exécutions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière exéc.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prochaine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {executions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Aucune exécution pour le moment
                  </td>
                </tr>
              ) : (
                executions.map((exec) => {
                  const rule = rules.find(r => r.id === exec.rule_id)
                  return (
                    <tr key={exec.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {exec.dossiers?.reference || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {exec.dossiers?.client_name || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {rule?.name || 'Règle supprimée'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          exec.status === 'completed' ? 'bg-green-100 text-green-700' :
                          exec.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          exec.status === 'executed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {exec.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {exec.execution_count} / {rule?.max_repeats || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {exec.last_executed_at ? formatDate(exec.last_executed_at) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {exec.next_execution_at && exec.status === 'pending'
                          ? formatDate(exec.next_execution_at)
                          : '-'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Scheduler Tab */}
      {activeTab === 'scheduler' && (
        <div className="space-y-6">
          {/* Info Card */}
          <div className="card p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Timer className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Planificateur de relances automatiques</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Le planificateur vérifie chaque jour à 8h00 UTC les dossiers approchant leur date de départ
                  et envoie automatiquement les relances configurées (J-15, J-10, J-5, J-2).
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {cronError && (
            <div className="card p-4 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900">Configuration requise</h3>
                  <p className="text-sm text-red-700 mt-1">{cronError}</p>
                  <p className="text-sm text-red-600 mt-2">
                    Pour activer pg_cron : Dashboard Supabase → Database → Extensions → Rechercher "pg_cron" → Activer
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={runManualCheck}
              disabled={isRunningManual || cronLoading}
              className="btn btn-primary flex items-center gap-2"
            >
              {isRunningManual ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Exécuter maintenant
            </button>
            <button
              onClick={loadCronJobs}
              disabled={cronLoading}
              className="btn btn-secondary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${cronLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          {/* Cron Jobs List */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Jobs programmés</h3>
              {!cronError && cronJobs.length === 0 && (
                <button
                  onClick={createCronJob}
                  disabled={cronLoading}
                  className="text-sm text-magenta hover:underline flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  Créer le job de relances
                </button>
              )}
            </div>

            {cronLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Chargement...</p>
              </div>
            ) : cronJobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Timer className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun job cron configuré</p>
                {!cronError && (
                  <button
                    onClick={createCronJob}
                    className="mt-4 text-magenta hover:underline"
                  >
                    Créer le job de relances automatiques
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planification</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commande</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cronJobs.map((job) => (
                    <tr key={job.jobid} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        Job #{job.jobid}
                      </td>
                      <td className="px-4 py-3">
                        <code className="px-2 py-1 bg-gray-100 rounded text-sm">{job.schedule}</code>
                        <p className="text-xs text-gray-500 mt-1">
                          {job.schedule === '0 8 * * *' ? 'Tous les jours à 8h00 UTC' : job.schedule}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {job.command}
                      </td>
                      <td className="px-4 py-3">
                        {job.active ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-sm">Actif</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Pause className="w-4 h-4" />
                            <span className="text-sm">Inactif</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => deleteCronJob(`job_${job.jobid}`)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                          title="Supprimer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Cron History */}
          {cronHistory.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h3 className="font-medium text-gray-900">Historique des exécutions</h3>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Début</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cronHistory.slice(0, 10).map((run) => (
                    <tr key={run.runid} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700">#{run.jobid}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {run.start_time ? formatDate(run.start_time) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {run.end_time ? formatDate(run.end_time) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          run.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                          run.status === 'failed' ? 'bg-red-100 text-red-700' :
                          run.status === 'running' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                        {run.return_message || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Relances programmées - dynamique depuis les rules */}
          <div className="card p-4">
            <h3 className="font-medium text-gray-900 mb-4">Relances automatiques configurées</h3>
            {(() => {
              const departureRules = rules
                .filter(r => r.trigger_event === 'departure_reminder' && r.is_active)
                .sort((a, b) => {
                  const daysA = (a.conditions as any)?.days_before || 0
                  const daysB = (b.conditions as any)?.days_before || 0
                  return daysB - daysA // Du plus grand au plus petit
                })

              if (departureRules.length === 0) {
                return (
                  <p className="text-gray-500 text-sm">
                    Aucune relance de type "Rappel avant départ" configurée.
                    Créez une règle avec le déclencheur "Rappel avant départ" pour la voir ici.
                  </p>
                )
              }

              const colors = [
                { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', textSm: 'text-orange-600', textXs: 'text-orange-500' },
                { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', textSm: 'text-cyan-600', textXs: 'text-cyan-500' },
                { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', textSm: 'text-indigo-600', textXs: 'text-indigo-500' },
                { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', textSm: 'text-green-600', textXs: 'text-green-500' },
                { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', textSm: 'text-purple-600', textXs: 'text-purple-500' },
                { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', textSm: 'text-pink-600', textXs: 'text-pink-500' },
              ]

              const getConditionLabel = (conditions: Record<string, unknown> | null) => {
                if (!conditions) return ''
                const labels: string[] = []
                if (conditions.solde_pending) labels.push('Si solde non payé')
                if (conditions.infos_missing) labels.push('Si infos non validées')
                if (conditions.chauffeur_missing) labels.push('Si chauffeur manquant')
                if (conditions.chauffeur_received) labels.push('Si chauffeur reçu')
                if (conditions.bpa_received) labels.push('Si BPA reçu')
                if (conditions.no_response) labels.push('Si pas de réponse')
                return labels.join(', ') || 'Aucune condition'
              }

              return (
                <div className={`grid grid-cols-2 md:grid-cols-${Math.min(departureRules.length, 4)} gap-4`}>
                  {departureRules.map((rule, index) => {
                    const color = colors[index % colors.length]
                    const days = (rule.conditions as any)?.days_before || 0
                    return (
                      <div key={rule.id} className={`p-3 ${color.bg} rounded-lg border ${color.border}`}>
                        <div className={`flex items-center gap-2 ${color.text} font-medium`}>
                          <Calendar className="w-4 h-4" />
                          J-{days}
                        </div>
                        <p className={`text-sm ${color.textSm} mt-1`}>{rule.name}</p>
                        <p className={`text-xs ${color.textXs} mt-1`}>{getConditionLabel(rule.conditions)}</p>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title={selectedRule ? 'Modifier la règle' : 'Nouvelle règle'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nom de la règle</label>
            <input
              type="text"
              className="input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Relance après devis"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description de la règle..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Déclencheur</label>
              <select
                className="input"
                value={formData.trigger_event}
                onChange={(e) => setFormData({ ...formData, trigger_event: e.target.value })}
              >
                {TRIGGER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Action</label>
              <select
                className="input"
                value={formData.action_type}
                onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
              >
                {ACTION_TYPES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Délai (heures)</label>
              <input
                type="number"
                className="input"
                min={0}
                value={formData.delay_hours}
                onChange={(e) => setFormData({ ...formData, delay_hours: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500 mt-1">{formatDelay(formData.delay_hours)}</p>
            </div>

            <div>
              <label className="label">Répétition (heures)</label>
              <input
                type="number"
                className="input"
                min={0}
                value={formData.repeat_interval_hours}
                onChange={(e) => setFormData({ ...formData, repeat_interval_hours: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.repeat_interval_hours ? formatDelay(formData.repeat_interval_hours) : 'Pas de répétition'}
              </p>
            </div>

            <div>
              <label className="label">Max répétitions</label>
              <input
                type="number"
                className="input"
                min={1}
                value={formData.max_repeats}
                onChange={(e) => setFormData({ ...formData, max_repeats: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          {/* Conditions intuitives */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="label mb-3">Conditions</label>

            {/* Condition: Jours avant départ */}
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="text-sm text-gray-600">Jours avant départ (J-X)</label>
                <input
                  type="number"
                  className="input mt-1"
                  min={0}
                  placeholder="Ex: 15 pour J-15"
                  value={formData.cond_days_before}
                  onChange={(e) => setFormData({ ...formData, cond_days_before: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.cond_days_before ? `Déclenche J-${formData.cond_days_before} avant le départ` : 'Laisser vide si non applicable'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Statut de paiement</label>
                <select
                  className="input mt-1"
                  value={formData.cond_payment_status}
                  onChange={(e) => setFormData({ ...formData, cond_payment_status: e.target.value })}
                >
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="acompte">Acompte payé</option>
                </select>
              </div>
            </div>

            {/* Conditions checkboxes */}
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={formData.cond_solde_pending}
                  onChange={(e) => setFormData({ ...formData, cond_solde_pending: e.target.checked })}
                />
                Solde en attente
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={formData.cond_infos_missing}
                  onChange={(e) => setFormData({ ...formData, cond_infos_missing: e.target.checked })}
                />
                Infos voyage manquantes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={formData.cond_chauffeur_missing}
                  onChange={(e) => setFormData({ ...formData, cond_chauffeur_missing: e.target.checked })}
                />
                Infos chauffeur manquantes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={formData.cond_chauffeur_received}
                  onChange={(e) => setFormData({ ...formData, cond_chauffeur_received: e.target.checked })}
                />
                Infos chauffeur reçues
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={formData.cond_bpa_received}
                  onChange={(e) => setFormData({ ...formData, cond_bpa_received: e.target.checked })}
                />
                BPA reçu
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300"
                  checked={formData.cond_no_response}
                  onChange={(e) => setFormData({ ...formData, cond_no_response: e.target.checked })}
                />
                Pas de réponse client
              </label>
            </div>
          </div>

          {/* Configuration Email */}
          {formData.action_type === 'send_email' && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <label className="label mb-3">Configuration Email</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Template email</label>
                  <select
                    className="input mt-1"
                    value={formData.config_template}
                    onChange={(e) => setFormData({ ...formData, config_template: e.target.value })}
                  >
                    <option value="">Sélectionner un template</option>
                    {emailTemplates.map((template) => (
                      <option key={template.key} value={template.key}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Sujet de l'email (optionnel)</label>
                  <input
                    type="text"
                    className="input mt-1"
                    placeholder="Sujet personnalisé..."
                    value={formData.config_subject}
                    onChange={(e) => setFormData({ ...formData, config_subject: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Règle active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !formData.name}
              className="btn btn-primary flex items-center gap-2"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {selectedRule ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
