import { useState, useEffect } from 'react'
import { Settings, Play, Clock, CheckCircle, XCircle, Loader2, AlertCircle, Calendar, Truck, Zap, FileText, RefreshCw, Pause, RotateCcw, Eye, Trash2, Send, Key, MapPin, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatDate as formatDateUtil, cn } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAppSetting,
  useUpdateAppSetting,
  useRunCronChauffeur,
  useAllDossiersAutoDevis,
  useWorkflowsDevisAuto,
  useDeactivateAutoDevis,
  type CronChauffeurConfig,
  type CronChauffeurLastRun
} from '@/hooks/useSupabase'

// Types pour l'auto-devis
interface AutoDevisConfig {
  enabled: boolean
  run_interval_minutes: number
  auto_activate_new_dossiers?: boolean
  default_workflow_id?: string
}

interface AutoDevisLastRun {
  date: string | null
  success: boolean
  processed: number
  error?: string
}

export function CronSettingsSection() {
  const queryClient = useQueryClient()
  const [showSuccess, setShowSuccess] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'chauffeur' | 'auto-devis'>('chauffeur')
  const [runningAutoDevis, setRunningAutoDevis] = useState(false)
  const [autoDevisResult, setAutoDevisResult] = useState<any>(null)

  // Récupérer les paramètres chauffeur
  const { data: cronConfig, isLoading: loadingConfig } = useAppSetting<CronChauffeurConfig>('cron_chauffeur_auto')
  const { data: lastRun, isLoading: loadingLastRun } = useAppSetting<CronChauffeurLastRun>('cron_chauffeur_last_run')

  // Récupérer les paramètres auto-devis
  const { data: autoDevisConfig } = useAppSetting<AutoDevisConfig>('auto_devis_config')
  const { data: autoDevisLastRun } = useAppSetting<AutoDevisLastRun>('auto_devis_last_run')

  // Récupérer les dossiers avec auto-devis actifs
  const { data: dossiersAutoDevis, isLoading: loadingAutoDevis, refetch: refetchAutoDevis } = useAllDossiersAutoDevis()
  const { data: workflows } = useWorkflowsDevisAuto()
  const deactivateAutoDevis = useDeactivateAutoDevis()

  const updateSetting = useUpdateAppSetting()
  const runCron = useRunCronChauffeur()

  // Compter les dossiers actifs
  const activeDossiers = dossiersAutoDevis?.filter(d => d.is_active) || []
  const pendingDevis = activeDossiers.filter(d => d.next_devis_at && new Date(d.next_devis_at) <= new Date())

  // Toggle auto-devis global
  const handleToggleAutoDevis = async () => {
    await updateSetting.mutateAsync({
      key: 'auto_devis_config',
      value: {
        ...autoDevisConfig,
        enabled: !autoDevisConfig?.enabled,
        run_interval_minutes: autoDevisConfig?.run_interval_minutes || 30
      }
    })
  }

  // Toggle activation automatique pour nouveaux dossiers
  const handleToggleAutoActivate = async () => {
    await updateSetting.mutateAsync({
      key: 'auto_devis_config',
      value: {
        ...autoDevisConfig,
        enabled: autoDevisConfig?.enabled ?? false,
        run_interval_minutes: autoDevisConfig?.run_interval_minutes || 30,
        auto_activate_new_dossiers: !autoDevisConfig?.auto_activate_new_dossiers
      }
    })
  }

  // Changer le workflow par défaut
  const handleChangeDefaultWorkflow = async (workflowId: string) => {
    await updateSetting.mutateAsync({
      key: 'auto_devis_config',
      value: {
        ...autoDevisConfig,
        enabled: autoDevisConfig?.enabled ?? false,
        run_interval_minutes: autoDevisConfig?.run_interval_minutes || 30,
        default_workflow_id: workflowId || undefined
      }
    })
  }

  // Exécuter le processeur auto-devis manuellement
  const handleRunAutoDevis = async (dryRun = false) => {
    setRunningAutoDevis(true)
    setAutoDevisResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('process-auto-devis', {
        body: { dry_run: dryRun }
      })

      if (error) throw error

      setAutoDevisResult(data)

      // Mettre à jour le dernier run
      if (!dryRun) {
        await updateSetting.mutateAsync({
          key: 'auto_devis_last_run',
          value: {
            date: new Date().toISOString(),
            success: data.success,
            processed: data.processed || 0,
            error: data.error || null
          }
        })
      }

      refetchAutoDevis()
      queryClient.invalidateQueries({ queryKey: ['devis'] })

      setShowSuccess(dryRun
        ? `Simulation: ${data.processed || 0} devis seraient générés`
        : `${data.processed || 0} devis générés avec succès`
      )
      setTimeout(() => setShowSuccess(null), 5000)

    } catch (error: any) {
      console.error('Erreur process-auto-devis:', error)
      setAutoDevisResult({ success: false, error: error.message })
    } finally {
      setRunningAutoDevis(false)
    }
  }

  // Forcer un devis pour un dossier spécifique
  const handleForceDevis = async (dossierId: string) => {
    setRunningAutoDevis(true)
    try {
      const { data, error } = await supabase.functions.invoke('process-auto-devis', {
        body: { dossier_id: dossierId }
      })

      if (error) throw error

      refetchAutoDevis()
      queryClient.invalidateQueries({ queryKey: ['devis'] })

      setShowSuccess(`Devis généré pour le dossier`)
      setTimeout(() => setShowSuccess(null), 3000)

    } catch (error: any) {
      console.error('Erreur:', error)
    } finally {
      setRunningAutoDevis(false)
    }
  }

  // Désactiver l'auto-devis pour un dossier
  const handleDeactivate = async (dossierId: string) => {
    if (!confirm('Désactiver l\'auto-devis pour ce dossier ?')) return
    await deactivateAutoDevis.mutateAsync(dossierId)
    refetchAutoDevis()
  }

  const handleToggleEnabled = async () => {
    if (!cronConfig) return
    await updateSetting.mutateAsync({
      key: 'cron_chauffeur_auto',
      value: { ...cronConfig, enabled: !cronConfig.enabled }
    })
  }

  const handleRunManually = async () => {
    try {
      const result = await runCron.mutateAsync()
      setShowSuccess(result.message)
      setTimeout(() => setShowSuccess(null), 5000)
    } catch (error) {
      console.error('Erreur exécution CRON:', error)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais'
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculer les prochaines dates de départ concernées
  const getNextDepartureDates = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const dates: string[] = []

    if (dayOfWeek === 5) {
      // Vendredi: Sam, Dim, Lun
      for (let i = 1; i <= 3; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)
        dates.push(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }))
      }
    } else if (dayOfWeek === 6) {
      dates.push('(Pas de demandes le samedi)')
    } else if (dayOfWeek === 0) {
      dates.push('(Pas de demandes le dimanche)')
    } else {
      const date = new Date(today)
      date.setDate(date.getDate() + 1)
      dates.push(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }))
    }

    return dates
  }

  if (loadingConfig || loadingLastRun) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Onglets de navigation */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSection('chauffeur')}
          className={cn(
            'px-4 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2',
            activeSection === 'chauffeur'
              ? 'bg-purple text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Truck size={16} />
          Demandes Chauffeur
        </button>
        <button
          onClick={() => setActiveSection('auto-devis')}
          className={cn(
            'px-4 py-2 rounded-t-lg font-medium transition-all flex items-center gap-2',
            activeSection === 'auto-devis'
              ? 'bg-purple text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          <Zap size={16} />
          Auto-Devis
          {pendingDevis.length > 0 && (
            <span className="px-1.5 py-0.5 bg-orange text-white text-xs rounded-full">
              {pendingDevis.length}
            </span>
          )}
        </button>
      </div>

      {/* Message de succès */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{showSuccess}</span>
        </div>
      )}

      {/* ============ SECTION CHAUFFEUR ============ */}
      {activeSection === 'chauffeur' && (
        <>
          {/* Carte principale */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Toggle activation */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    cronConfig?.enabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Truck className={`w-6 h-6 ${cronConfig?.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Demandes automatiques</h4>
                    <p className="text-sm text-gray-500">
                      Envoie automatiquement les demandes de contact chauffeur chaque matin
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleEnabled}
                  disabled={updateSetting.isPending}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    cronConfig?.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    cronConfig?.enabled ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Détails de configuration */}
            <div className="p-6 bg-gray-50">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Règles */}
                <div>
                  <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Règles d'exécution
                  </h5>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span><strong>Lun-Jeu :</strong> Demandes pour les départs du lendemain</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span>
                      <span><strong>Vendredi :</strong> Demandes pour Sam, Dim et Lun</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span><strong>Sam-Dim :</strong> Pas de demandes (couvert par vendredi)</span>
                    </li>
                  </ul>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Prochains départs concernés :</strong><br />
                      {getNextDepartureDates().join(', ')}
                    </p>
                  </div>
                </div>

                {/* Dernière exécution */}
                <div>
                  <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Dernière exécution
                  </h5>

                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {lastRun?.date ? (
                        lastRun.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={`font-medium ${
                        lastRun?.date
                          ? lastRun.success ? 'text-green-700' : 'text-red-700'
                          : 'text-gray-500'
                      }`}>
                        {lastRun?.date
                          ? lastRun.success ? 'Succès' : 'Erreur'
                          : 'Jamais exécuté'}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <p className="flex justify-between">
                        <span className="text-gray-500">Date :</span>
                        <span className="font-medium">{formatDate(lastRun?.date || null)}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-gray-500">Demandes créées :</span>
                        <span className="font-medium">{lastRun?.dossiers_count ?? 0}</span>
                      </p>
                      {lastRun?.error && (
                        <p className="text-red-600 mt-2">{lastRun.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Exécution automatique : tous les jours à 8h00 (heure de Paris)
              </p>

              <button
                onClick={handleRunManually}
                disabled={runCron.isPending}
                className="btn bg-gradient-to-r from-purple to-magenta text-white hover:opacity-90 flex items-center gap-2"
              >
                {runCron.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exécution...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Exécuter maintenant
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Conditions pour qu'une demande soit envoyée :</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>Le dossier doit avoir un transporteur assigné</li>
                <li><strong>BPA validé</strong> par le transporteur</li>
                <li><strong>Infos voyages envoyées</strong> au client</li>
                <li>Pas d'infos chauffeur déjà reçues</li>
                <li>Pas de demande en attente existante</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* ============ SECTION AUTO-DEVIS ============ */}
      {activeSection === 'auto-devis' && (
        <>
          {/* Statistiques rapides */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-dark">{activeDossiers.length}</p>
                  <p className="text-xs text-gray-500">Dossiers actifs</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange">{pendingDevis.length}</p>
                  <p className="text-xs text-gray-500">En attente</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{autoDevisLastRun?.processed || 0}</p>
                  <p className="text-xs text-gray-500">Dernière exéc.</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{workflows?.length || 0}</p>
                  <p className="text-xs text-gray-500">Workflows</p>
                </div>
              </div>
            </div>
          </div>

          {/* Panneau de contrôle principal */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Toggle activation globale */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    autoDevisConfig?.enabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <Zap className={`w-6 h-6 ${autoDevisConfig?.enabled ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Génération automatique des devis</h4>
                    <p className="text-sm text-gray-500">
                      Génère et envoie automatiquement les devis selon les workflows configurés
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleAutoDevis}
                  disabled={updateSetting.isPending}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    autoDevisConfig?.enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    autoDevisConfig?.enabled ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Option activation automatique pour nouveaux dossiers */}
            <div className="p-6 border-b border-gray-100 bg-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    autoDevisConfig?.auto_activate_new_dossiers ? 'bg-purple-200' : 'bg-gray-200'
                  }`}>
                    <FileText className={`w-5 h-5 ${autoDevisConfig?.auto_activate_new_dossiers ? 'text-purple' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">Activer auto-devis sur les nouveaux dossiers</h5>
                    <p className="text-sm text-gray-500">
                      Active automatiquement l'auto-devis dès qu'un nouveau dossier est créé
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleAutoActivate}
                  disabled={updateSetting.isPending}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    autoDevisConfig?.auto_activate_new_dossiers ? 'bg-purple' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    autoDevisConfig?.auto_activate_new_dossiers ? 'left-8' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Sélection du workflow par défaut */}
              {autoDevisConfig?.auto_activate_new_dossiers && (
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow par défaut pour les nouveaux dossiers
                  </label>
                  <select
                    value={autoDevisConfig?.default_workflow_id || ''}
                    onChange={(e) => handleChangeDefaultWorkflow(e.target.value)}
                    className="input max-w-md"
                  >
                    <option value="">Workflow par défaut du système</option>
                    {workflows?.map((wf: any) => (
                      <option key={wf.id} value={wf.id}>
                        {wf.name} {wf.is_default ? '(défaut)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Ce workflow sera utilisé pour tous les nouveaux dossiers créés
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleRunAutoDevis(true)}
                  disabled={runningAutoDevis}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Simuler (dry run)
                </button>
                <button
                  onClick={() => handleRunAutoDevis(false)}
                  disabled={runningAutoDevis || pendingDevis.length === 0}
                  className="btn bg-gradient-to-r from-purple to-magenta text-white hover:opacity-90 flex items-center gap-2"
                >
                  {runningAutoDevis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exécution...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Exécuter maintenant ({pendingDevis.length})
                    </>
                  )}
                </button>
                <button
                  onClick={() => refetchAutoDevis()}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualiser
                </button>
              </div>

              {autoDevisLastRun?.date && (
                <div className="text-sm text-gray-500">
                  Dernière exécution : {formatDate(autoDevisLastRun.date || null)}
                  {autoDevisLastRun.success ? (
                    <span className="text-green-600 ml-2">({autoDevisLastRun.processed} traités)</span>
                  ) : (
                    <span className="text-red-600 ml-2">(erreur)</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Résultat du dernier run */}
          {autoDevisResult && (
            <div className={cn(
              'border rounded-xl p-4',
              autoDevisResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <h4 className={cn(
                'font-medium mb-2',
                autoDevisResult.success ? 'text-green-800' : 'text-red-800'
              )}>
                {autoDevisResult.success ? 'Exécution réussie' : 'Erreur'}
              </h4>
              {autoDevisResult.error ? (
                <p className="text-red-600 text-sm">{autoDevisResult.error}</p>
              ) : (
                <div className="space-y-2">
                  {autoDevisResult.results?.map((r: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      {r.status === 'created' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : r.status === 'dry_run' ? (
                        <Eye className="w-4 h-4 text-blue-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="font-medium">{r.reference}</span>
                      <span className="text-gray-500">
                        {r.status === 'created' && `Devis ${r.devis_reference} créé (${r.marge}% marge)`}
                        {r.status === 'dry_run' && `Marge ${r.marge}% → ${formatPrice(r.prix_final_ht)} HT`}
                        {r.status === 'skipped' && `Ignoré (${r.reason})`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Liste des dossiers avec auto-devis actifs */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-semibold text-gray-800">Dossiers avec auto-devis actif</h4>
              <span className="text-sm text-gray-500">{activeDossiers.length} dossier(s)</span>
            </div>

            {loadingAutoDevis ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-purple mx-auto" />
              </div>
            ) : activeDossiers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>Aucun dossier avec auto-devis actif</p>
                <p className="text-sm">Activez l'auto-devis depuis la page d'un dossier</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {activeDossiers.map((ad: any) => {
                  const dossier = ad.dossier
                  const workflow = ad.workflow
                  const steps = workflow?.steps || []
                  const isPending = ad.next_devis_at && new Date(ad.next_devis_at) <= new Date()

                  return (
                    <div key={ad.id} className={cn(
                      'p-4 flex items-center justify-between',
                      isPending && 'bg-orange-50'
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          isPending ? 'bg-orange-100' : 'bg-purple-100'
                        )}>
                          <span className={cn(
                            'text-sm font-bold',
                            isPending ? 'text-orange' : 'text-purple'
                          )}>
                            {(ad.current_step || 0) + 1}/{steps.length}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{dossier?.reference || 'N/A'}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{workflow?.name || 'Workflow inconnu'}</span>
                            <span>•</span>
                            <span>
                              Prochain: {ad.next_devis_at
                                ? formatDate(ad.next_devis_at || null)
                                : 'Terminé'}
                            </span>
                            {isPending && (
                              <>
                                <span>•</span>
                                <span className="text-orange font-medium">En attente</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => handleForceDevis(dossier?.id)}
                            disabled={runningAutoDevis}
                            className="p-2 text-purple hover:bg-purple-100 rounded-lg"
                            title="Forcer la génération maintenant"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeactivate(dossier?.id)}
                          className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
                          title="Désactiver l'auto-devis"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info sur le fonctionnement */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Fonctionnement de l'auto-devis :</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Les prix sont calculés depuis les <strong>grilles tarifaires</strong> (TTC → HT)</li>
                <li>La <strong>marge du workflow</strong> est appliquée au prix de base</li>
                <li>Les <strong>coefficients véhicules</strong> sont pris en compte automatiquement</li>
                <li>Chaque étape génère un devis avec une marge différente selon le workflow</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
