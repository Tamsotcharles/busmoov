import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UsersRound,
  Workflow,
  FileType,
  FolderOpen,
  FileText,
  Receipt,
  Truck,
  MessageCircle,
  Settings,
  LogOut,
  Plus,
  Search,
  ChevronRight,
  ExternalLink,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  MapPin,
  Euro,
  Eye,
  CheckCircle,
  XCircle,
  X,
  Send,
  ArrowLeft,
  ArrowRight,
  Save,
  Trash2,
  Phone,
  Mail,
  Building,
  Download,
  History,
  RotateCcw,
  RefreshCw,
  Link2,
  AlertTriangle,
  AlertCircle,
  Pencil,
  Check,
  Zap,
  Edit2,
  ShieldCheck,
  Headphones,
  Car,
  Info,
  Calculator,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Navigation,
  Loader2,
  BarChart3,
  TrendingDown,
  Wallet,
  CreditCard,
  PiggyBank,
  Bell,
  BellRing,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQueryClient } from '@tanstack/react-query'
import { useDossiers, useTransporteurs, useDashboardStats, useAllDevis, useUpdateDossier, useCreateDossier, useCreateDevis, useDevisByDossier, useUpdateDevis, useDeleteDevis, useContrats, useDeleteContrat, useCreatePaiement, useDeletePaiement, useTimeline, useAddTimelineEntry, useVoyageInfo, useCreateOrUpdateVoyageInfo, useDemandesFournisseurs, useAllDemandesFournisseurs, useCreateDemandeFournisseur, useUpdateDemandeFournisseur, useDeleteDemandeFournisseur, useUpdateTransporteur, useCreateTransporteur, useDeleteTransporteur, useWorkflowsDevisAuto, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow, useDossierAutoDevis, useActivateAutoDevis, useDeactivateAutoDevis, useDefaultWorkflow, useAllDossiersAutoDevis, useCreateFacture, useDemandesChauffeur, useMarkFeuilleRouteEnvoyee, useContratByDossier, usePaiementsByContrat, useFacturesByDossier, usePaiementsFournisseurs, useCreatePaiementFournisseur, useDeletePaiementFournisseur, useRappels, useCreateRappel, useUpdateRappel, useDeleteRappel, generateChauffeurToken } from '@/hooks/useSupabase'
import { DemandeContactChauffeurModal } from '@/components/admin/DemandeContactChauffeurModal'
import { CronSettingsSection } from '@/components/admin/CronSettingsSection'
import { EditDevisModal } from '@/components/admin/EditDevisModal'
import { CGVPage } from '@/components/admin/CGVPage'
import { EmailTemplatesPage } from '@/components/admin/EmailTemplatesPage'
import { EmailHistoryPage } from '@/components/admin/EmailHistoryPage'
import { NotificationsPanel } from '@/components/admin/NotificationsPanel'
import {
  calculerTarifComplet,
  calculerInfosTrajet,
  chargerMajorationsRegions,
  extraireDepartement,
  determinerAmplitudeGrille,
  type GrillesTarifaires,
  type MajorationRegion as PricingMajorationRegion,
  type ServiceType as PricingServiceType,
  type AmplitudeType as PricingAmplitudeType,
  TARIFS_HORS_GRILLE,
} from '@/lib/pricing-rules'
import type { Transporteur, FeuilleRouteType, Devis } from '@/types/database'

// Types locaux pour workflows
interface WorkflowStep {
  delay_hours: number
  marge_percent: number
  label: string
}

interface WorkflowDevisAuto {
  id: string
  name: string
  is_active: boolean
  is_default: boolean
  steps: WorkflowStep[]
  created_at: string
  updated_at: string
}
import { supabase } from '@/lib/supabase'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Modal } from '@/components/ui/Modal'
import { EmailPreviewModal, useEmailPreview } from '@/components/ui/EmailPreviewModal'
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete'
import { formatDate, formatDateTime, formatPrice, cn, generateValidationFournisseurEmailFromTemplate, generateDemandePrixEmailFromTemplate, generateValidationToken, getDistanceWithCache, calculateRouteInfo, calculateNumberOfCars, calculateNumberOfDrivers, getVehicleTypeLabel, getTripModeLabel, calculateAmplitudeFromTimes, extractMadDetails, getSiteBaseUrl } from '@/lib/utils'
import { generateDevisPDF, generateContratPDF, generateFacturePDF, generateFeuilleRoutePDF, generateFeuilleRoutePDFBase64, generateInfosVoyagePDF, generateInfosVoyagePDFBase64 } from '@/lib/pdf'
import { MessagesPage } from '@/components/admin/MessagesPage'
import { ServiceClientelePage } from '@/components/admin/ServiceClientelePage'
import { WorkflowPage } from '@/components/admin/WorkflowPage'
import { DepartsPage } from '@/components/admin/DepartsPage'
import { ExperimentsPage } from '@/components/admin/ExperimentsPage'
import { TestRunnerPage } from '@/components/admin/TestRunnerPage'
import { ReviewsPage } from '@/components/admin/ReviewsPage'
import { FlaskConical, TestTube2, Star } from 'lucide-react'
import type { DossierWithRelations } from '@/types/database'

type Page = 'dashboard' | 'dossiers' | 'devis' | 'exploitation' | 'factures' | 'transporteurs' | 'clients' | 'workflow' | 'templates' | 'email-history' | 'messages' | 'service-client' | 'reviews' | 'stats' | 'calendrier' | 'departs' | 'settings'

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'dossiers', label: 'Dossiers', icon: FolderOpen },
  { id: 'devis', label: 'Devis', icon: FileText },
  { id: 'exploitation', label: 'Exploitation', icon: Send },
  { id: 'factures', label: 'Factures', icon: Receipt },
  { id: 'stats', label: 'Statistiques', icon: BarChart3 },
  { id: 'calendrier', label: 'Calendrier', icon: Calendar },
  { id: 'departs', label: 'Départs', icon: Navigation },
  { id: 'transporteurs', label: 'Transporteurs', icon: Truck },
  { id: 'clients', label: 'Clients', icon: UsersRound },
  { id: 'workflow', label: 'Workflow', icon: Workflow },
  { id: 'templates', label: 'Templates', icon: FileType },
  { id: 'email-history', label: 'Emails envoyés', icon: Mail },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'service-client', label: 'Service Client', icon: Headphones },
  { id: 'reviews', label: 'Avis clients', icon: Star },
  { id: 'settings', label: 'Paramètres', icon: Settings },
]

// Composant Modal Offre Flash
function OffreFlashModal({
  isOpen,
  onClose,
  selectedDossiers,
  config,
  setConfig,
  onSend,
}: {
  isOpen: boolean
  onClose: () => void
  selectedDossiers: DossierWithRelations[]
  config: { type: 'percent' | 'amount'; value: number; validityHours: number }
  setConfig: (config: { type: 'percent' | 'amount'; value: number; validityHours: number }) => void
  onSend: () => void
}) {
  const [isSending, setIsSending] = useState(false)
  const updateDevis = useUpdateDevis()

  // Calculer l'aperçu pour chaque dossier
  const dossiersWithPreview = useMemo(() => {
    return selectedDossiers.map(dossier => {
      // Trouver le devis le moins cher (envoyé mais pas encore accepté)
      const devisDisponibles = (dossier.devis || []).filter(
        (d: any) => d.status === 'sent' && d.price_ttc && d.price_ttc > 0
      )

      if (devisDisponibles.length === 0) {
        return { dossier, devis: null, newPrice: 0, savings: 0, error: 'Aucun devis envoyé' }
      }

      // Trier par prix TTC croissant
      const devisMoinsCher = devisDisponibles.sort((a: any, b: any) =>
        (a.price_ttc || 0) - (b.price_ttc || 0)
      )[0]

      const originalPrice = devisMoinsCher.price_ttc || 0
      let savings = 0
      let newPrice = originalPrice

      if (config.type === 'percent') {
        savings = Math.round(originalPrice * (config.value / 100) * 100) / 100
        newPrice = originalPrice - savings
      } else {
        savings = config.value
        newPrice = originalPrice - savings
      }

      return {
        dossier,
        devis: devisMoinsCher,
        originalPrice,
        newPrice: Math.max(0, newPrice),
        savings,
        error: null
      }
    })
  }, [selectedDossiers, config])

  // Stats globales
  const validDossiers = dossiersWithPreview.filter(d => !d.error)
  const totalSavings = validDossiers.reduce((sum, d) => sum + d.savings, 0)
  const avgSavings = validDossiers.length > 0 ? totalSavings / validDossiers.length : 0

  const handleSend = async () => {
    if (validDossiers.length === 0) {
      alert('Aucun dossier éligible pour l\'offre flash')
      return
    }

    setIsSending(true)
    try {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + config.validityHours)

      for (const { dossier, devis, newPrice, savings, originalPrice } of validDossiers) {
        if (!devis) continue

        // 1. Mettre à jour le devis avec la remise ET le nouveau prix
        const remiseData = config.type === 'percent'
          ? { remise_percent: config.value, remise_montant: null }
          : { remise_montant: config.value, remise_percent: null }

        // Calculer le nouveau prix HT à partir du TTC
        const tvaRate = devis.tva_rate || 10
        const newPriceHT = Math.round((newPrice / (1 + tvaRate / 100)) * 100) / 100

        await updateDevis.mutateAsync({
          id: devis.id,
          ...remiseData,
          promo_expires_at: expiresAt.toISOString(),
          promo_original_price: originalPrice,
          price_ttc: newPrice,
          price_ht: newPriceHT,
        })

        // 2. Envoyer l'email avec offre flash
        const emailBody = `
Bonjour ${dossier.client_name},

OFFRE FLASH - Réduction exceptionnelle sur votre devis !

Pour votre trajet ${dossier.departure} → ${dossier.arrival} le ${formatDate(dossier.departure_date)}, nous vous proposons une offre exclusive :

Prix initial : ${formatPrice(originalPrice)}
Votre remise : -${formatPrice(savings)}${config.type === 'percent' ? ` (${config.value}%)` : ''}
NOUVEAU PRIX : ${formatPrice(newPrice)}

ATTENTION : Cette offre expire dans ${config.validityHours}h !

Pour en profiter, rendez-vous sur votre espace client :
${window.location.origin}/mes-devis?ref=${dossier.reference}&email=${encodeURIComponent(dossier.client_email || '')}

À très bientôt,
L'équipe Busmoov
        `.trim()

        await supabase.from('emails').insert({
          to: dossier.client_email,
          subject: `OFFRE FLASH -${config.type === 'percent' ? `${config.value}%` : formatPrice(config.value)} sur votre devis #${dossier.reference}`,
          body: emailBody,
          template: 'offre_flash',
          dossier_id: dossier.id,
          status: 'pending',
        })

        // 3. Ajouter une entrée timeline
        await supabase.from('timeline').insert({
          dossier_id: dossier.id,
          type: 'promo_sent',
          content: `Offre flash envoyée : -${config.type === 'percent' ? `${config.value}%` : formatPrice(config.value)} (expire dans ${config.validityHours}h)`,
        })
      }

      alert(`Offre flash envoyée à ${validDossiers.length} client${validDossiers.length > 1 ? 's' : ''} !`)
      onSend()
    } catch (error) {
      console.error('Erreur envoi offre flash:', error)
      alert('Erreur lors de l\'envoi des offres flash')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Offre Flash" size="lg">
      <div className="space-y-6">
        {/* Configuration */}
        <div className="card p-4 bg-gradient-to-r from-magenta/5 to-purple/5 border border-magenta/20">
          <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
            <Zap size={18} className="text-magenta" />
            Configuration de l'offre
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Type de remise */}
            <div>
              <label className="label">Type de remise</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfig({ ...config, type: 'percent' })}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
                    config.type === 'percent'
                      ? "bg-magenta text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  )}
                >
                  % Pourcentage
                </button>
                <button
                  onClick={() => setConfig({ ...config, type: 'amount' })}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
                    config.type === 'amount'
                      ? "bg-magenta text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  )}
                >
                  € Montant
                </button>
              </div>
            </div>

            {/* Valeur */}
            <div>
              <label className="label">
                {config.type === 'percent' ? 'Pourcentage de remise' : 'Montant de remise (€)'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.value}
                  onChange={(e) => setConfig({ ...config, value: parseFloat(e.target.value) || 0 })}
                  className="input pr-10"
                  min="0"
                  max={config.type === 'percent' ? 100 : undefined}
                  step={config.type === 'percent' ? 5 : 10}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  {config.type === 'percent' ? '%' : '€'}
                </span>
              </div>
            </div>

            {/* Validité */}
            <div className="col-span-2">
              <label className="label">Durée de validité de l'offre</label>
              <div className="flex gap-2">
                {[24, 48, 72, 168].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setConfig({ ...config, validityHours: hours })}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg font-medium transition-colors text-sm",
                      config.validityHours === hours
                        ? "bg-purple text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    )}
                  >
                    {hours < 48 ? `${hours}h` : `${hours / 24}j`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Aperçu des dossiers */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center justify-between">
            <span>Aperçu ({validDossiers.length}/{selectedDossiers.length} dossiers éligibles)</span>
            {validDossiers.length > 0 && (
              <span className="text-sm font-normal text-emerald-600">
                Économie moyenne : {formatPrice(avgSavings)}
              </span>
            )}
          </h3>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {dossiersWithPreview.map(({ dossier, originalPrice, newPrice, savings, error }) => (
              <div
                key={dossier.id}
                className={cn(
                  "p-3 rounded-lg border",
                  error ? "bg-gray-50 border-gray-200" : "bg-white border-emerald-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-purple-dark">#{dossier.reference}</span>
                    <span className="text-sm text-gray-500 ml-2">{dossier.client_name}</span>
                  </div>
                  {error ? (
                    <span className="text-sm text-gray-400">{error}</span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 line-through">{formatPrice(originalPrice)}</span>
                      <span className="font-bold text-emerald-600">{formatPrice(newPrice)}</span>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                        -{formatPrice(savings)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn btn-secondary">
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || validDossiers.length === 0}
            className="btn bg-gradient-to-r from-magenta to-purple text-white hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send size={16} />
                Envoyer {validDossiers.length} offre{validDossiers.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('dossiers')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [transporteurFilter, setTransporteurFilter] = useState('')
  const [voyageDateFrom, setVoyageDateFrom] = useState('')
  const [voyageDateTo, setVoyageDateTo] = useState('')
  const [receptionDateFrom, setReceptionDateFrom] = useState('')
  const [receptionDateTo, setReceptionDateTo] = useState('')
  const [sortBy, setSortBy] = useState<'reception' | 'voyage' | 'amount'>('reception')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [amountMinDashboard, setAmountMinDashboard] = useState('')
  const [amountMaxDashboard, setAmountMaxDashboard] = useState('')
  const [devisSearchQuery, setDevisSearchQuery] = useState('')

  // États pour le filtre CA/Marge du mois en cours avec possibilité de jour
  const now = new Date()
  const defaultStatsDateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const [statsDateFrom, setStatsDateFrom] = useState(defaultStatsDateFrom)
  const [statsDateTo, setStatsDateTo] = useState('')
  // Filtre pour afficher uniquement les dossiers des stats (cliquables)
  const [showOnlyStatsDossiers, setShowOnlyStatsDossiers] = useState(false)
  const [showCreateDossierModal, setShowCreateDossierModal] = useState(false)
  const [selectedDossier, setSelectedDossier] = useState<DossierWithRelations | null>(null)
  const [editingDevis, setEditingDevis] = useState<any | null>(null)
  const [showEditDevisModal, setShowEditDevisModal] = useState(false)

  // États pour l'offre flash (sélection multiple de dossiers)
  const [selectedDossierIds, setSelectedDossierIds] = useState<Set<string>>(new Set())
  const [showOffreFlashModal, setShowOffreFlashModal] = useState(false)
  const [offreFlashConfig, setOffreFlashConfig] = useState({
    type: 'percent' as 'percent' | 'amount',
    value: 10,
    validityHours: 48,
  })

  // Email preview modal state
  const { isOpen: isEmailPreviewOpen, emailData, onSendCallback, openEmailPreview, closeEmailPreview } = useEmailPreview()

  const { data: stats } = useDashboardStats()
  // Ne pas passer les filtres spéciaux côté client comme statut à Supabase
  const specialFilters = ['flash-active', 'facture-fournisseur-pending', 'signed-only']
  const { data: dossiers = [], isLoading: dossiersLoading } = useDossiers({
    status: statusFilter && !specialFilters.includes(statusFilter) ? statusFilter : undefined,
    search: searchQuery || undefined,
  })
  const { data: transporteurs = [] } = useTransporteurs()
  const { data: allDevis = [], isLoading: devisLoading } = useAllDevis()
  const { data: contrats = [], isLoading: contratsLoading } = useContrats()
  const { data: allDemandesFournisseurs = [] } = useAllDemandesFournisseurs()
  const { data: allDossiersAutoDevis = [] } = useAllDossiersAutoDevis()
  const { data: paiementsFournisseurs = [] } = usePaiementsFournisseurs()
  const updateDevisMain = useUpdateDevis()
  const queryClient = useQueryClient()

  // Map des dossiers avec auto-devis activé
  const autoDevisMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    allDossiersAutoDevis.forEach((ad) => {
      if (ad.is_active) {
        map[ad.dossier_id] = true
      }
    })
    return map
  }, [allDossiersAutoDevis])

  // Compteur des nouveaux tarifs reçus (non traités)
  const nouveauxTarifsCount = useMemo(() => {
    return allDemandesFournisseurs.filter((df: any) => df.status === 'tarif_recu').length
  }, [allDemandesFournisseurs])

  // Annuler toute la séquence auto-devis d'un dossier
  const handleCancelAutoDevisSequence = async (dossierId: string) => {
    if (!confirm('Annuler toute la séquence auto-devis pour ce dossier ?\n\nTous les devis programmés seront annulés.')) return

    try {
      // Récupérer tous les devis programmés du dossier
      const { data: scheduledDevis, error: fetchError } = await supabase
        .from('devis')
        .select('id')
        .eq('dossier_id', dossierId)
        .eq('status', 'scheduled')

      if (fetchError) throw fetchError

      // Annuler chaque devis programmé
      if (scheduledDevis && scheduledDevis.length > 0) {
        for (const devis of scheduledDevis) {
          await supabase
            .from('devis')
            .update({ status: 'cancelled', scheduled_send_at: null })
            .eq('id', devis.id)
        }
      }

      // Désactiver l'auto-devis pour ce dossier
      await supabase
        .from('dossiers_auto_devis')
        .update({ is_active: false })
        .eq('dossier_id', dossierId)

      queryClient.invalidateQueries({ queryKey: ['devis'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers_auto_devis'] })
      alert(`Séquence auto-devis annulée (${scheduledDevis?.length || 0} devis annulés)`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'annulation')
    }
  }

  // Calculer les dossiers avec marge positive potentielle
  // On n'affiche que les opportunités pour les dossiers sans fournisseur validé (pas de BPA reçu)
  const dossiersAvecMargePositive = useMemo(() => {
    const alertes: Array<{
      dossier: typeof dossiers[0]
      meilleurPrixHT: number
      meilleurPrixTTC: number
      prixVenteTTC: number
      transporteurName: string
      margeEstimee: number
      margePourcent: number
    }> = []

    dossiers.forEach((dossier) => {
      // Trouver les demandes fournisseurs pour ce dossier
      const demandesDossier = allDemandesFournisseurs.filter(
        (df: any) => df.dossier_id === dossier.id && df.prix_propose && df.prix_propose > 0
      )
      if (demandesDossier.length === 0) return

      // Vérifier si un fournisseur a déjà été validé (BPA reçu) pour ce dossier
      const hasFournisseurValide = demandesDossier.some((df: any) => df.status === 'bpa_received')
      if (hasFournisseurValide) return // Ne pas afficher les opportunités si fournisseur déjà validé

      // Trouver le meilleur prix
      const meilleureDemande = demandesDossier.reduce((best: any, current: any) =>
        (current.prix_propose || 0) < (best.prix_propose || Infinity) ? current : best
      )

      // Calculer la marge si on a un prix de vente (marge calculée en HT)
      const prixFournisseurHT = meilleureDemande.prix_propose || 0
      const tvaRate = dossier.tva_rate || 10
      const prixFournisseurTTC = prixFournisseurHT * (1 + tvaRate / 100)

      if (dossier.price_ht && dossier.price_ht > 0 && prixFournisseurHT > 0) {
        const margeEstimee = dossier.price_ht - prixFournisseurHT
        if (margeEstimee > 0) {
          const transporteur = transporteurs.find((t) => t.id === meilleureDemande.transporteur_id)
          alertes.push({
            dossier,
            meilleurPrixHT: prixFournisseurHT,
            meilleurPrixTTC: prixFournisseurTTC,
            prixVenteTTC: dossier.price_ttc || dossier.price_ht * (1 + tvaRate / 100),
            transporteurName: transporteur?.name || 'Fournisseur inconnu',
            margeEstimee,
            margePourcent: Math.round((margeEstimee / dossier.price_ht) * 100),
          })
        }
      }
    })

    return alertes
  }, [dossiers, allDemandesFournisseurs, transporteurs])

  // Stats CA/Marge filtrées par période (mois en cours par défaut)
  // Placé avant filteredDossiers car ce dernier en dépend
  const statsFiltered = useMemo(() => {
    // Statuts qui comptent pour le CA (devis confirmé par admin et au-delà)
    const validRevenueStatuses = ['pending-payment', 'pending-reservation', 'bpa-received', 'pending-info', 'pending-info-received', 'pending-info-confirm', 'pending-driver', 'confirmed', 'completed']

    const dossiersWithRevenue = dossiers.filter(d => {
      if (!validRevenueStatuses.includes(d.status || '')) return false

      // Filtrer par date de signature du contrat
      const signedDate = d.contract_signed_at ? new Date(d.contract_signed_at) : null
      if (!signedDate) return false

      const matchesDateFrom = !statsDateFrom || signedDate >= new Date(statsDateFrom)
      const matchesDateTo = !statsDateTo || signedDate <= new Date(statsDateTo + 'T23:59:59')

      return matchesDateFrom && matchesDateTo
    })

    return {
      count: dossiersWithRevenue.length,
      totalRevenue: dossiersWithRevenue.reduce((sum, d) => sum + (d.price_ttc || 0), 0),
      // Marge = Prix Vente HT - Prix Achat HT (price_achat est en HT)
      totalMargin: dossiersWithRevenue.reduce((sum, d) => sum + ((d.price_ht || 0) - (d.price_achat || 0)), 0),
      // IDs des dossiers pour le filtre cliquable
      dossierIds: new Set(dossiersWithRevenue.map(d => d.id)),
    }
  }, [dossiers, statsDateFrom, statsDateTo])

  // Filtrer les dossiers avec les filtres croisés
  const filteredDossiers = useMemo(() => {
    const filtered = dossiers.filter(d => {
      // Filtre par transporteur
      const matchesTransporteur = !transporteurFilter || d.transporteur_id === transporteurFilter

      // Filtre par période de voyage
      const voyageDate = d.departure_date ? new Date(d.departure_date) : null
      const matchesVoyageDateFrom = !voyageDateFrom || (voyageDate && voyageDate >= new Date(voyageDateFrom))
      const matchesVoyageDateTo = !voyageDateTo || (voyageDate && voyageDate <= new Date(voyageDateTo + 'T23:59:59'))

      // Filtre par date de réception (created_at)
      const receptionDate = d.created_at ? new Date(d.created_at) : null
      const matchesReceptionDateFrom = !receptionDateFrom || (receptionDate && receptionDate >= new Date(receptionDateFrom))
      const matchesReceptionDateTo = !receptionDateTo || (receptionDate && receptionDate <= new Date(receptionDateTo + 'T23:59:59'))

      // Filtre par montant
      const amount = d.price_ttc || 0
      const matchesAmountMin = !amountMinDashboard || amount >= parseFloat(amountMinDashboard)
      const matchesAmountMax = !amountMaxDashboard || amount <= parseFloat(amountMaxDashboard)

      // Filtre Offre Flash active : dossiers avec au moins un devis avec promo active
      const matchesFlashActive = statusFilter !== 'flash-active' || (d.devis || []).some(
        (devis: any) => devis.promo_expires_at && new Date(devis.promo_expires_at) > new Date()
      )

      // Filtre facture fournisseur en attente : dossiers avec transporteur assigné, fournisseur payé ou partiellement payé, mais facture non reçue
      const matchesFactureFournisseurPending = statusFilter !== 'facture-fournisseur-pending' || (
        d.transporteur_id && // a un transporteur
        d.price_achat && d.price_achat > 0 && // a un prix d'achat
        !(d as any).facture_fournisseur_recue // facture non reçue
      )

      // Filtre contrats signés uniquement
      const matchesSignedOnly = statusFilter !== 'signed-only' || d.contract_signed_at

      // Filtre dossiers des stats (cliquable)
      const matchesStatsDossiers = !showOnlyStatsDossiers || statsFiltered.dossierIds.has(d.id)

      return matchesTransporteur && matchesVoyageDateFrom && matchesVoyageDateTo && matchesReceptionDateFrom && matchesReceptionDateTo && matchesAmountMin && matchesAmountMax && matchesFlashActive && matchesFactureFournisseurPending && matchesSignedOnly && matchesStatsDossiers
    })

    // Tri des résultats
    return filtered.sort((a, b) => {
      let valueA: number, valueB: number

      if (sortBy === 'reception') {
        valueA = a.created_at ? new Date(a.created_at).getTime() : 0
        valueB = b.created_at ? new Date(b.created_at).getTime() : 0
      } else if (sortBy === 'voyage') {
        valueA = a.departure_date ? new Date(a.departure_date).getTime() : 0
        valueB = b.departure_date ? new Date(b.departure_date).getTime() : 0
      } else {
        valueA = a.price_ttc || 0
        valueB = b.price_ttc || 0
      }

      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA
    })
  }, [dossiers, transporteurFilter, voyageDateFrom, voyageDateTo, receptionDateFrom, receptionDateTo, amountMinDashboard, amountMaxDashboard, statusFilter, sortBy, sortOrder, showOnlyStatsDossiers, statsFiltered.dossierIds])

  // Réinitialiser les filtres du Dashboard
  const clearDashboardFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setTransporteurFilter('')
    setVoyageDateFrom('')
    setVoyageDateTo('')
    setReceptionDateFrom('')
    setReceptionDateTo('')
    setAmountMinDashboard('')
    setAmountMaxDashboard('')
    setSortBy('reception')
    setSortOrder('desc')
    setShowOnlyStatsDossiers(false)
  }

  const hasDashboardFilters = searchQuery || statusFilter || transporteurFilter || voyageDateFrom || voyageDateTo || receptionDateFrom || receptionDateTo || amountMinDashboard || amountMaxDashboard || showOnlyStatsDossiers

  const handleSelectDossier = (dossier: DossierWithRelations) => {
    setSelectedDossier(dossier)
  }

  const handleCloseDossierDetail = () => {
    setSelectedDossier(null)
    // Réinitialiser les filtres quand on ferme le détail d'un dossier
    setSearchQuery('')
    setStatusFilter('')
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const statsCards = [
    { label: 'Total', value: stats?.total || 0, icon: FolderOpen, color: 'blue', filter: '' },
    { label: 'Nouveaux', value: stats?.new || 0, icon: Plus, color: 'cyan', filter: 'new' },
    { label: 'Att. client', value: stats?.pendingClient || 0, icon: Clock, color: 'orange', filter: 'pending-client' },
    { label: 'Att. paiement', value: stats?.pendingPayment || 0, icon: Euro, color: 'amber', filter: 'pending-payment' },
    { label: 'Att. résa', value: stats?.pendingReservation || 0, icon: ShieldCheck, color: 'violet', filter: 'pending-reservation' },
    { label: 'Att. infos', value: stats?.pendingInfo || 0, icon: FileText, color: 'purple', filter: 'pending-info' },
    { label: 'Info VO', value: stats?.pendingInfoReceived || 0, icon: CheckCircle, color: 'teal', filter: 'pending-info-received' },
    { label: 'Att. chauffeur', value: stats?.pendingDriver || 0, icon: Truck, color: 'indigo', filter: 'pending-driver' },
    { label: 'Confirmés', value: stats?.confirmed || 0, icon: CheckCircle, color: 'green', filter: 'confirmed' },
    { label: 'Terminés', value: stats?.completed || 0, icon: TrendingUp, color: 'emerald', filter: 'completed' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-purple-dark text-white flex flex-col fixed h-screen">
        <div className="p-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="Busmoov" className="w-9 h-9" />
            <span className="font-display text-lg font-bold text-white">Busmoov</span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                currentPage === item.id
                  ? 'bg-gradient-to-r from-magenta to-purple text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon size={18} />
              {item.label}
              {item.id === 'exploitation' && nouveauxTarifsCount > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {nouveauxTarifsCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-white/70">
            <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-xs">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 mt-2 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-56">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
          <h1 className="font-display text-lg font-semibold text-purple-dark capitalize">
            {currentPage === 'dashboard' ? 'Tableau de bord' : currentPage}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateDossierModal(true)}
              className="btn btn-success btn-sm"
            >
              <Plus size={16} />
              Dossier
            </button>
            <Link to="/" target="_blank" className="btn btn-secondary btn-sm">
              <ExternalLink size={16} />
              Site
            </Link>
          </div>
        </header>

        <div className="p-6">
          {/* Dashboard View */}
          {currentPage === 'dashboard' && (
            <>
              {/* Search & Filters */}
              <div className="card p-4 mb-6 space-y-3">
                {/* Ligne 1: Recherche et filtres principaux */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="🔍 Recherche client, dossier, tél, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input w-auto"
                  >
                    <option value="">Tous statuts</option>
                    <option value="flash-active">⚡ Offre Flash active</option>
                    <option value="new">📥 Nouveau</option>
                    <option value="quotes_sent">📤 Devisé</option>
                    <option value="pending-client">⏳ Att. retour client</option>
                    <option value="pending-payment">💳 Att. paiement</option>
                    <option value="pending-reservation">🔒 Att. réservation</option>
                    <option value="bpa-received">✅ BPA reçu</option>
                    <option value="pending-supplier">📋 Att. résa</option>
                    <option value="pending-info">📝 Att. infos</option>
                    <option value="pending-info-received">📋 Info VO reçue</option>
                    <option value="pending-info-confirm">🔄 Att. confirm client</option>
                    <option value="pending-balance">💰 Voir solde</option>
                    <option value="pending-driver">👨‍✈️ Att. chauffeur</option>
                    <option value="confirmed">✅ Confirmé</option>
                    <option value="completed">✅ Terminé</option>
                    <option value="cancelled">❌ Abandonné</option>
                    <option value="facture-fournisseur-pending">📄 Att. facture fournisseur</option>
                    <option value="signed-only">📝 Signés uniquement</option>
                  </select>
                  <select
                    value={transporteurFilter}
                    onChange={(e) => setTransporteurFilter(e.target.value)}
                    className="input w-auto"
                  >
                    <option value="">Tous transporteurs</option>
                    {transporteurs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.number} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ligne 2: Filtres croisés */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500 whitespace-nowrap">Reçue :</label>
                    <input
                      type="date"
                      className="input w-36 text-sm"
                      value={receptionDateFrom}
                      onChange={(e) => setReceptionDateFrom(e.target.value)}
                    />
                    <span className="text-gray-400">→</span>
                    <input
                      type="date"
                      className="input w-36 text-sm"
                      value={receptionDateTo}
                      onChange={(e) => setReceptionDateTo(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500 whitespace-nowrap">Voyage :</label>
                    <input
                      type="date"
                      className="input w-36 text-sm"
                      value={voyageDateFrom}
                      onChange={(e) => setVoyageDateFrom(e.target.value)}
                    />
                    <span className="text-gray-400">→</span>
                    <input
                      type="date"
                      className="input w-36 text-sm"
                      value={voyageDateTo}
                      onChange={(e) => setVoyageDateTo(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500 whitespace-nowrap">Montant :</label>
                    <input
                      type="number"
                      className="input w-24 text-sm"
                      value={amountMinDashboard}
                      onChange={(e) => setAmountMinDashboard(e.target.value)}
                      placeholder="Min €"
                      min="0"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      className="input w-24 text-sm"
                      value={amountMaxDashboard}
                      onChange={(e) => setAmountMaxDashboard(e.target.value)}
                      placeholder="Max €"
                      min="0"
                    />
                  </div>
                </div>

                {/* Ligne 3: Tri et compteur */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500 whitespace-nowrap">Trier par :</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'reception' | 'voyage' | 'amount')}
                      className="input w-auto text-sm"
                    >
                      <option value="reception">Date réception</option>
                      <option value="voyage">Date voyage</option>
                      <option value="amount">Montant</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="btn btn-sm btn-secondary"
                      title={sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
                    >
                      {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {hasDashboardFilters && (
                    <button
                      onClick={clearDashboardFilters}
                      className="btn btn-sm btn-secondary text-xs"
                    >
                      <X size={14} />
                      Effacer
                    </button>
                  )}

                  <div className="ml-auto text-sm text-gray-500">
                    {filteredDossiers.length} dossier{filteredDossiers.length > 1 ? 's' : ''}
                    {hasDashboardFilters && ` sur ${dossiers.length}`}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                {statsCards.map((stat, index) => (
                  <div
                    key={index}
                    className={cn(
                      "card p-4 cursor-pointer hover:shadow-lg transition-all",
                      statusFilter === stat.filter && "ring-2 ring-magenta"
                    )}
                    onClick={() => setStatusFilter(stat.filter)}
                  >
                    <div className="text-2xl mb-1">
                      <stat.icon size={24} className="text-gray-400" />
                    </div>
                    <div className="font-display text-2xl font-bold text-purple-dark">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Revenue Stats avec filtres de période */}
              <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-500">Statistiques par période de signature</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="input w-36 text-sm"
                      value={statsDateFrom}
                      onChange={(e) => setStatsDateFrom(e.target.value)}
                    />
                    <span className="text-gray-400">→</span>
                    <input
                      type="date"
                      className="input w-36 text-sm"
                      value={statsDateTo}
                      onChange={(e) => setStatsDateTo(e.target.value)}
                      placeholder="Aujourd'hui"
                    />
                    {(statsDateFrom !== defaultStatsDateFrom || statsDateTo) && (
                      <button
                        onClick={() => {
                          setStatsDateFrom(defaultStatsDateFrom)
                          setStatsDateTo('')
                        }}
                        className="btn btn-sm btn-secondary text-xs"
                        title="Réinitialiser au mois en cours"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div
                    className={cn(
                      "p-4 bg-blue-50 rounded-xl cursor-pointer transition-all hover:shadow-md",
                      showOnlyStatsDossiers && "ring-2 ring-blue-500 shadow-md"
                    )}
                    onClick={() => setShowOnlyStatsDossiers(!showOnlyStatsDossiers)}
                    title={showOnlyStatsDossiers ? "Cliquez pour voir tous les dossiers" : "Cliquez pour filtrer sur ces dossiers"}
                  >
                    <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Ventes signées</p>
                    <p className="font-display text-2xl font-bold text-blue-700">{statsFiltered.count}</p>
                    <p className="text-xs text-blue-500 mt-1">dossier{statsFiltered.count > 1 ? 's' : ''}</p>
                  </div>
                  <div
                    className={cn(
                      "p-4 bg-purple-50 rounded-xl cursor-pointer transition-all hover:shadow-md",
                      showOnlyStatsDossiers && "ring-2 ring-purple-500 shadow-md"
                    )}
                    onClick={() => setShowOnlyStatsDossiers(!showOnlyStatsDossiers)}
                    title={showOnlyStatsDossiers ? "Cliquez pour voir tous les dossiers" : "Cliquez pour filtrer sur ces dossiers"}
                  >
                    <p className="text-xs text-purple-600 uppercase tracking-wide mb-1">CA TTC</p>
                    <p className="font-display text-2xl font-bold text-purple">{formatPrice(statsFiltered.totalRevenue)}</p>
                    <p className="text-xs text-purple-500 mt-1">chiffre d'affaires</p>
                  </div>
                  <div
                    className={cn(
                      "p-4 bg-emerald-50 rounded-xl cursor-pointer transition-all hover:shadow-md",
                      showOnlyStatsDossiers && "ring-2 ring-emerald-500 shadow-md"
                    )}
                    onClick={() => setShowOnlyStatsDossiers(!showOnlyStatsDossiers)}
                    title={showOnlyStatsDossiers ? "Cliquez pour voir tous les dossiers" : "Cliquez pour filtrer sur ces dossiers"}
                  >
                    <p className="text-xs text-emerald-600 uppercase tracking-wide mb-1">Marge générée</p>
                    <p className="font-display text-2xl font-bold text-emerald-600">{formatPrice(statsFiltered.totalMargin)}</p>
                    <p className="text-xs text-emerald-500 mt-1">
                      {statsFiltered.totalRevenue > 0
                        ? `${((statsFiltered.totalMargin / statsFiltered.totalRevenue) * 100).toFixed(1)}% du CA`
                        : 'marge HT'}
                    </p>
                  </div>
                </div>
                {showOnlyStatsDossiers && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                    <CheckCircle size={16} />
                    <span>Affichage des {statsFiltered.count} dossier{statsFiltered.count > 1 ? 's' : ''} signé{statsFiltered.count > 1 ? 's' : ''} sur la période</span>
                    <button
                      onClick={() => setShowOnlyStatsDossiers(false)}
                      className="ml-2 text-blue-500 hover:text-blue-700 underline"
                    >
                      Effacer le filtre
                    </button>
                  </div>
                )}
              </div>

              {/* Notifications CRM */}
              <div className="mb-6">
                <NotificationsPanel
                  onOpenDossier={(dossierId) => {
                    const dossier = dossiers.find(d => d.id === dossierId)
                    if (dossier) handleSelectDossier(dossier)
                  }}
                  maxHeight="300px"
                />
              </div>

              {/* Alertes Marge Positive */}
              {dossiersAvecMargePositive.length > 0 && (
                <div className="card mb-6 overflow-hidden border-l-4 border-emerald-500">
                  <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-white flex items-center gap-2">
                    <span className="text-xl">💰</span>
                    <h3 className="font-display font-semibold text-emerald-700">
                      Opportunités de marge ({dossiersAvecMargePositive.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {dossiersAvecMargePositive.slice(0, 5).map((alerte) => (
                      <div
                        key={alerte.dossier.id}
                        className="px-4 py-3 flex items-center justify-between hover:bg-emerald-50/50 cursor-pointer transition-colors"
                        onClick={() => handleSelectDossier(alerte.dossier)}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="font-medium text-purple-dark">{alerte.dossier.reference}</span>
                            <span className="text-gray-400 mx-2">•</span>
                            <span className="text-sm text-gray-600">{alerte.dossier.client_name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Prix fournisseur TTC</p>
                            <p className="font-medium">{formatPrice(alerte.meilleurPrixTTC)}</p>
                            <p className="text-xs text-gray-400">{alerte.transporteurName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Prix vente TTC</p>
                            <p className="font-medium">{formatPrice(alerte.prixVenteTTC)}</p>
                          </div>
                          <div className="text-right min-w-24">
                            <p className="text-xs text-emerald-600">Marge HT</p>
                            <p className="font-bold text-lg text-emerald-600">{formatPrice(alerte.margeEstimee)}</p>
                            <p className="text-xs text-emerald-500">({alerte.margePourcent}%)</p>
                          </div>
                          <ChevronRight size={20} className="text-gray-400" />
                        </div>
                      </div>
                    ))}
                    {dossiersAvecMargePositive.length > 5 && (
                      <div className="px-4 py-2 text-center text-sm text-gray-500 bg-gray-50">
                        +{dossiersAvecMargePositive.length - 5} autres opportunités
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dossiers Table */}
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-display font-semibold text-purple-dark">Dossiers</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-4 py-3 text-left font-medium">Réf</th>
                        <th className="px-4 py-3 text-left font-medium">Client</th>
                        <th className="px-4 py-3 text-left font-medium">Statut</th>
                        <th className="px-4 py-3 text-left font-medium">Reçue</th>
                        <th className="px-4 py-3 text-left font-medium">Date voyage</th>
                        <th className="px-4 py-3 text-left font-medium">Transporteur</th>
                        <th className="px-4 py-3 text-left font-medium">Montant</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dossiersLoading ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            Chargement...
                          </td>
                        </tr>
                      ) : filteredDossiers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            Aucun dossier trouvé
                          </td>
                        </tr>
                      ) : (
                        filteredDossiers.map((dossier) => (
                          <DossierRow
                            key={dossier.id}
                            dossier={dossier}
                            onView={() => {
                              // Ouvrir directement le détail du dossier
                              handleSelectDossier(dossier)
                            }}
                          />
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Transporteurs View */}
          {currentPage === 'transporteurs' && (
            <TransporteursPage transporteurs={transporteurs} />
          )}

          {/* Dossiers View */}
          {currentPage === 'dossiers' && (
            <>
              {/* Search & Filters */}
              <div className="card p-4 mb-6 space-y-3">
                {/* Ligne 1: Recherche et filtres principaux */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Recherche par nom, email, référence..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input w-auto"
                  >
                    <option value="">Tous statuts</option>
                    <option value="new">Nouveau</option>
                    <option value="quotes_sent">Devisé</option>
                    <option value="pending-client">Att. retour client</option>
                    <option value="pending-payment">Att. paiement</option>
                    <option value="pending-reservation">Att. réservation</option>
                    <option value="bpa-received">BPA reçu</option>
                    <option value="pending-info">Att. infos</option>
                    <option value="pending-info-received">Info VO reçue</option>
                    <option value="pending-info-confirm">Att. confirm client</option>
                    <option value="pending-driver">Att. chauffeur</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="completed">Terminé</option>
                    <option value="cancelled">Abandonné</option>
                    <option value="facture-fournisseur-pending">Att. facture fournisseur</option>
                  </select>
                  <select
                    value={transporteurFilter}
                    onChange={(e) => setTransporteurFilter(e.target.value)}
                    className="input w-auto"
                  >
                    <option value="">Tous transporteurs</option>
                    {transporteurs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.number} - {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ligne 2: Filtres croisés */}
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500 whitespace-nowrap">Date voyage :</label>
                    <input
                      type="date"
                      className="input w-36 text-sm"
                      value={voyageDateFrom}
                      onChange={(e) => setVoyageDateFrom(e.target.value)}
                    />
                    <span className="text-gray-400">→</span>
                    <input
                      type="date"
                      className="input w-36 text-sm"
                      value={voyageDateTo}
                      onChange={(e) => setVoyageDateTo(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500 whitespace-nowrap">Montant TTC :</label>
                    <input
                      type="number"
                      className="input w-24 text-sm"
                      value={amountMinDashboard}
                      onChange={(e) => setAmountMinDashboard(e.target.value)}
                      placeholder="Min €"
                      min="0"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      className="input w-24 text-sm"
                      value={amountMaxDashboard}
                      onChange={(e) => setAmountMaxDashboard(e.target.value)}
                      placeholder="Max €"
                      min="0"
                    />
                  </div>

                  {hasDashboardFilters && (
                    <button
                      onClick={clearDashboardFilters}
                      className="btn btn-sm btn-secondary text-xs"
                    >
                      <X size={14} />
                      Effacer
                    </button>
                  )}

                  <div className="ml-auto text-sm text-gray-500">
                    {filteredDossiers.length} dossier{filteredDossiers.length > 1 ? 's' : ''}
                    {hasDashboardFilters && ` sur ${dossiers.length}`}
                  </div>
                </div>
              </div>

              {/* Barre d'actions Offre Flash (visible quand filtre pending-client ou quotes_sent) */}
              {(statusFilter === 'pending-client' || statusFilter === 'quotes_sent') && (
                <div className="card p-3 mb-4 bg-gradient-to-r from-magenta/10 to-purple/10 border-2 border-magenta/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDossierIds.size === filteredDossiers.length && filteredDossiers.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDossierIds(new Set(filteredDossiers.map(d => d.id)))
                            } else {
                              setSelectedDossierIds(new Set())
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-magenta focus:ring-magenta"
                        />
                        <span className="text-sm font-medium text-gray-700">Tout sélectionner</span>
                      </label>
                      {selectedDossierIds.size > 0 && (
                        <span className="text-sm text-magenta font-semibold">
                          {selectedDossierIds.size} dossier{selectedDossierIds.size > 1 ? 's' : ''} sélectionné{selectedDossierIds.size > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {selectedDossierIds.size > 0 && (
                      <button
                        onClick={() => setShowOffreFlashModal(true)}
                        className="btn bg-gradient-to-r from-magenta to-purple text-white hover:opacity-90 flex items-center gap-2"
                      >
                        <Zap size={16} />
                        Offre Flash
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Dossiers Grid */}
              <div className="grid gap-4">
                {dossiersLoading ? (
                  <div className="card p-8 text-center text-gray-500">Chargement...</div>
                ) : filteredDossiers.length === 0 ? (
                  <div className="card p-8 text-center text-gray-500">Aucun dossier trouvé</div>
                ) : (
                  filteredDossiers.map((dossier) => (
                    <DossierCard
                      key={dossier.id}
                      dossier={dossier}
                      onSelect={() => handleSelectDossier(dossier)}
                      onViewDevis={() => {
                        setCurrentPage('devis')
                        setDevisSearchQuery(dossier.reference || '')
                      }}
                      hasAutoDevis={autoDevisMap[dossier.id]}
                      onCancelAutoDevis={() => handleCancelAutoDevisSequence(dossier.id)}
                      isSelectable={statusFilter === 'pending-client' || statusFilter === 'quotes_sent'}
                      isSelected={selectedDossierIds.has(dossier.id)}
                      onToggleSelect={() => {
                        setSelectedDossierIds(prev => {
                          const newSet = new Set(prev)
                          if (newSet.has(dossier.id)) {
                            newSet.delete(dossier.id)
                          } else {
                            newSet.add(dossier.id)
                          }
                          return newSet
                        })
                      }}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {/* Dossier Detail View */}
          {selectedDossier && (
            <DossierDetailView
              dossier={selectedDossier}
              transporteurs={transporteurs}
              onClose={handleCloseDossierDetail}
              onViewDevis={() => {
                setCurrentPage('devis')
                setDevisSearchQuery(selectedDossier.reference || '')
                setSelectedDossier(null)
              }}
              openEmailPreview={openEmailPreview}
              onEditDevis={(devis) => {
                setEditingDevis({
                  ...devis,
                  dossier: selectedDossier,
                  tva_rate: devis.tva_rate || 10,
                  nombre_cars: devis.nombre_cars || 1,
                  nombre_chauffeurs: devis.nombre_chauffeurs || 1,
                })
                setShowEditDevisModal(true)
              }}
            />
          )}

          {/* Devis View */}
          {currentPage === 'devis' && (
            <>
              {/* Search */}
              <div className="card p-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Recherche par référence devis ou dossier..."
                      value={devisSearchQuery}
                      onChange={(e) => setDevisSearchQuery(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Stats devis */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-4">
                  <div className="text-2xl font-bold text-purple-dark">{allDevis.length}</div>
                  <div className="text-sm text-gray-500">Total devis</div>
                </div>
                <div className="card p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {allDevis.filter(d => d.status === 'draft').length}
                  </div>
                  <div className="text-sm text-gray-500">Brouillons</div>
                </div>
                <div className="card p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {allDevis.filter(d => d.status === 'sent').length}
                  </div>
                  <div className="text-sm text-gray-500">Envoyés</div>
                </div>
                <div className="card p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {allDevis.filter(d => d.status === 'accepted').length}
                  </div>
                  <div className="text-sm text-gray-500">Acceptés</div>
                </div>
              </div>

              {/* Liste des devis */}
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-display font-semibold text-purple-dark">Tous les devis</h3>
                  <span className="text-sm text-gray-500">
                    {allDevis.filter(d =>
                      !devisSearchQuery ||
                      d.reference?.toLowerCase().includes(devisSearchQuery.toLowerCase()) ||
                      d.dossier?.reference?.toLowerCase().includes(devisSearchQuery.toLowerCase())
                    ).length} résultats
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                        <th className="px-4 py-3 text-left font-medium">Référence</th>
                        <th className="px-4 py-3 text-left font-medium">Dossier</th>
                        <th className="px-4 py-3 text-left font-medium">Transporteur</th>
                        <th className="px-4 py-3 text-left font-medium">Prix HT</th>
                        <th className="px-4 py-3 text-left font-medium">Prix TTC</th>
                        <th className="px-4 py-3 text-left font-medium">Statut</th>
                        <th className="px-4 py-3 text-left font-medium">Créé le</th>
                        <th className="px-4 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {devisLoading ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            Chargement...
                          </td>
                        </tr>
                      ) : allDevis.filter(d =>
                          !devisSearchQuery ||
                          d.reference?.toLowerCase().includes(devisSearchQuery.toLowerCase()) ||
                          d.dossier?.reference?.toLowerCase().includes(devisSearchQuery.toLowerCase())
                        ).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                            Aucun devis trouvé
                          </td>
                        </tr>
                      ) : (
                        allDevis
                          .filter(d =>
                            !devisSearchQuery ||
                            d.reference?.toLowerCase().includes(devisSearchQuery.toLowerCase()) ||
                            d.dossier?.reference?.toLowerCase().includes(devisSearchQuery.toLowerCase())
                          )
                          .map((devis) => (
                          <tr
                            key={devis.id}
                            className="hover:bg-gray-50 text-sm cursor-pointer"
                            onClick={() => {
                              if (devis.dossier?.reference) {
                                setCurrentPage('dossiers')
                                setSearchQuery(devis.dossier.reference)
                              }
                            }}
                          >
                            <td className="px-4 py-3">
                              <span className="font-semibold text-purple-dark">
                                {devis.reference}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {devis.dossier ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setCurrentPage('dossiers')
                                    setSearchQuery(devis.dossier?.reference || '')
                                  }}
                                  className="text-purple hover:text-magenta font-medium hover:underline"
                                >
                                  {devis.dossier.reference}
                                </button>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {devis.transporteur ? (
                                <div>
                                  <div className="font-medium">{devis.transporteur.name}</div>
                                  <div className="text-xs text-gray-500">{devis.transporteur.number}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">{formatPrice(devis.price_ht || 0)}</td>
                            <td className="px-4 py-3 font-semibold">{formatPrice(devis.price_ttc || 0)}</td>
                            <td className="px-4 py-3">
                              <DevisStatusBadge status={devis.status || 'draft'} />
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {formatDate(devis.created_at)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <button
                                  className="p-1.5 rounded hover:bg-purple-50"
                                  title="Éditer le devis"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingDevis({
                                      ...devis,
                                      price_ht: devis.price_ht || 0,
                                      price_ttc: devis.price_ttc || 0,
                                      price_achat_ht: devis.price_achat_ht || 0,
                                      price_achat_ttc: devis.price_achat_ttc || 0,
                                      vehicle_type: devis.vehicle_type || 'minibus',
                                      validity_days: devis.validity_days || 30,
                                      options: devis.options || '',
                                      notes: devis.notes || '',
                                      tva_rate: devis.tva_rate || 10,
                                    })
                                    setShowEditDevisModal(true)
                                  }}
                                >
                                  <Pencil size={16} className="text-purple" />
                                </button>
                                <button
                                  className="p-1.5 rounded hover:bg-gray-100"
                                  title="Voir le dossier"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (devis.dossier?.reference) {
                                      setCurrentPage('dossiers')
                                      setSearchQuery(devis.dossier.reference)
                                    }
                                  }}
                                >
                                  <Eye size={16} className="text-gray-500" />
                                </button>
                                {devis.status === 'draft' && (
                                  <button
                                    className="p-1.5 rounded hover:bg-blue-50"
                                    title="Envoyer"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Send size={16} className="text-blue-500" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Exploitation View */}
          {currentPage === 'exploitation' && (
            <ExploitationPage
              transporteurs={transporteurs}
              setCurrentPage={setCurrentPage}
              setSearchQuery={setSearchQuery}
              openEmailPreview={openEmailPreview}
            />
          )}

          {/* Clients View */}
          {currentPage === 'clients' && (
            <ClientsPage />
          )}

          {/* Workflow View */}
          {currentPage === 'workflow' && (
            <WorkflowPage />
          )}

          {/* Templates View */}
          {currentPage === 'templates' && (
            <EmailTemplatesPage />
          )}

          {/* Email History View */}
          {currentPage === 'email-history' && (
            <EmailHistoryPage />
          )}

          {/* Settings View */}
          {currentPage === 'settings' && (
            <SettingsPage />
          )}

          {/* Factures View */}
          {currentPage === 'factures' && (
            <FacturesPage />
          )}

          {/* Messages Page */}
          {currentPage === 'messages' && (
            <MessagesPage />
          )}

          {/* Service Clientèle Page */}
          {currentPage === 'service-client' && (
            <ServiceClientelePage
              onNavigateToDossier={(dossierId) => {
                const dossier = dossiers.find(d => d.id === dossierId)
                if (dossier) {
                  setSelectedDossier(dossier)
                  setCurrentPage('dossiers')
                }
              }}
            />
          )}

          {/* Reviews Page */}
          {currentPage === 'reviews' && (
            <ReviewsPage />
          )}

          {/* Statistiques Page */}
          {currentPage === 'stats' && (
            <StatsPage
              dossiers={dossiers}
              transporteurs={transporteurs}
              paiementsFournisseurs={paiementsFournisseurs}
            />
          )}

          {/* Calendrier Page */}
          {currentPage === 'calendrier' && (
            <CalendrierPage
              dossiers={dossiers}
              onSelectDossier={(d: any) => {
                setSelectedDossier(d)
                setCurrentPage('dossiers')
              }}
            />
          )}
          {currentPage === 'departs' && (
            <DepartsPage
              onViewDossier={(id: string) => {
                const dossier = dossiers.find(d => d.id === id)
                if (dossier) {
                  setSelectedDossier(dossier)
                  setCurrentPage('dossiers')
                }
              }}
            />
          )}
        </div>
      </main>

      {/* Create Dossier Modal */}
      <CreateDossierModal
        isOpen={showCreateDossierModal}
        onClose={() => setShowCreateDossierModal(false)}
        transporteurs={transporteurs}
      />

      {/* Edit Devis Modal - Nouveau composant enrichi */}
      <EditDevisModal
        isOpen={showEditDevisModal}
        onClose={() => {
          setShowEditDevisModal(false)
          setEditingDevis(null)
        }}
        devis={editingDevis}
        dossier={editingDevis?.dossier || selectedDossier}
        transporteurs={transporteurs}
        onSave={async (devisData) => {
          if (!editingDevis) return
          try {
            await updateDevisMain.mutateAsync({
              id: editingDevis.id,
              ...devisData,
            })
            queryClient.invalidateQueries({ queryKey: ['devis'] })
            setShowEditDevisModal(false)
            setEditingDevis(null)
            alert('Devis mis à jour avec succès')
          } catch (error) {
            console.error('Error updating devis:', error)
            alert('Erreur lors de la mise à jour du devis')
          }
        }}
        isPending={updateDevisMain.isPending}
      />

      {/* Modal Offre Flash */}
      <OffreFlashModal
        isOpen={showOffreFlashModal}
        onClose={() => {
          setShowOffreFlashModal(false)
          setSelectedDossierIds(new Set())
        }}
        selectedDossiers={filteredDossiers.filter(d => selectedDossierIds.has(d.id))}
        config={offreFlashConfig}
        setConfig={setOffreFlashConfig}
        onSend={async () => {
          // Logique d'envoi implémentée dans le composant
          setShowOffreFlashModal(false)
          setSelectedDossierIds(new Set())
          queryClient.invalidateQueries({ queryKey: ['devis'] })
          queryClient.invalidateQueries({ queryKey: ['dossiers'] })
        }}
      />

      {/* Email Preview Modal */}
      <EmailPreviewModal
        isOpen={isEmailPreviewOpen}
        onClose={closeEmailPreview}
        to={emailData?.to || ''}
        subject={emailData?.subject || ''}
        body={emailData?.body || ''}
        onSend={onSendCallback}
      />
    </div>
  )
}

function DossierRow({ dossier, onView }: { dossier: DossierWithRelations; onView: () => void }) {
  const contrat = Array.isArray(dossier.contrats) ? dossier.contrats[0] : dossier.contrats
  const isSigned = contrat?.signed_at

  return (
    <tr className={cn(
      "text-sm cursor-pointer transition-colors",
      isSigned ? "bg-green-50/50 hover:bg-green-100/50" : "hover:bg-gray-50"
    )} onClick={onView}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold">#{dossier.reference}</span>
          {isSigned && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
              <CheckCircle size={10} />
              Signé
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-medium">{dossier.client_name}</div>
        <div className="text-xs text-gray-500">{dossier.client_company || dossier.client_email}</div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <StatusBadge status={dossier.status || 'new'} size="sm" />
          {dossier.requires_manual_review && (
            <span title={dossier.manual_review_reason || 'Révision manuelle requise'} className="text-amber-500 cursor-help">
              ⭐
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div>{formatDate(dossier.created_at)}</div>
      </td>
      <td className="px-4 py-3">{formatDate(dossier.departure_date)}</td>
      <td className="px-4 py-3">
        {dossier.transporteur ? (
          <span className="bg-purple text-white text-xs font-bold px-2 py-1 rounded" title={dossier.transporteur.number}>
            {dossier.transporteur.name}
          </span>
        ) : (
          '-'
        )}
      </td>
      <td className="px-4 py-3 font-semibold">{formatPrice(dossier.price_ttc || 0)}</td>
      <td className="px-4 py-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onView()
          }}
          className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </td>
    </tr>
  )
}

function DossierCard({ dossier, onSelect, onViewDevis, hasAutoDevis, onCancelAutoDevis, isSelectable, isSelected, onToggleSelect }: { dossier: DossierWithRelations; onSelect: () => void; onViewDevis: () => void; hasAutoDevis?: boolean; onCancelAutoDevis?: () => void; isSelectable?: boolean; isSelected?: boolean; onToggleSelect?: () => void }) {
  // Calculer le prix à afficher : devis validé ou le moins cher des devis envoyés
  const devisAccepte = (dossier.devis || []).find((d: any) => d.status === 'accepted')
  const devisEnvoyes = (dossier.devis || []).filter((d: any) => d.status === 'sent' && d.price_ttc && d.price_ttc > 0)
  const devisMoinsCher = devisEnvoyes.length > 0
    ? devisEnvoyes.reduce((min: any, d: any) => (d.price_ttc < min.price_ttc ? d : min), devisEnvoyes[0])
    : null

  // Prix à afficher :
  // - Si contrat signé : dossier.price_ttc (inclut les options sélectionnées par le client)
  // - Sinon si devis validé : devis.price_ttc (prix de base)
  // - Sinon : moins cher envoyé > 0
  const hasSignedContract = dossier.contract_signed_at
  const prixAffiche = hasSignedContract && dossier.price_ttc
    ? dossier.price_ttc
    : (devisAccepte?.price_ttc || devisMoinsCher?.price_ttc || dossier.price_ttc || 0)
  const isDevisValide = !!devisAccepte
  const nbDevisEnvoyes = devisEnvoyes.length

  // Calculer le reste à payer
  const totalPaye = (dossier.paiements || []).reduce((sum, p) => sum + (p.amount || 0), 0)
  const resteAPayer = (dossier.price_ttc || 0) - totalPaye
  const hasContrat = dossier.contrats && dossier.contrats.length > 0
  const contrat = Array.isArray(dossier.contrats) ? dossier.contrats[0] : dossier.contrats
  const isSigned = contrat?.signed_at

  // Vérifier si le dossier a une offre flash active ou expirée
  const devisWithPromo = (dossier.devis || []).find(
    (devis: any) => devis.promo_expires_at && devis.promo_original_price
  ) as any
  const promoExpiresAt = devisWithPromo?.promo_expires_at as string | undefined
  const isPromoActive = promoExpiresAt ? new Date(promoExpiresAt) > new Date() : false
  const isPromoExpired = promoExpiresAt ? new Date(promoExpiresAt) <= new Date() : false
  const flashExpiresAt = promoExpiresAt
  const flashOriginalPrice = devisWithPromo?.promo_original_price as number | undefined
  const flashCurrentPrice = devisWithPromo?.price_ttc as number | undefined

  // Si promo expirée et pas encore accepté, le prix à afficher est le prix original
  const acceptedAt = devisWithPromo?.accepted_at as string | undefined
  const wasAcceptedDuringPromo = acceptedAt && promoExpiresAt &&
    new Date(acceptedAt) <= new Date(promoExpiresAt)
  const shouldShowOriginalPrice = isPromoExpired && !wasAcceptedDuringPromo

  return (
    <div className={cn(
      "card p-4 hover:shadow-lg transition-shadow cursor-pointer",
      isSigned && "ring-2 ring-green-400 bg-green-50/30",
      isSelected && "ring-2 ring-magenta bg-magenta/5"
    )} onClick={onSelect}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Checkbox de sélection pour offre flash */}
        {isSelectable && (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-5 h-5 rounded border-gray-300 text-magenta focus:ring-magenta cursor-pointer"
            />
          </div>
        )}
        {/* Info principale */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-display font-bold text-purple-dark">
              #{dossier.reference}
            </span>
            <StatusBadge status={dossier.status || 'new'} size="sm" />
            {dossier.requires_manual_review && (
              <span title={dossier.manual_review_reason || 'Révision manuelle requise'} className="text-amber-500 cursor-help">
                ⭐
              </span>
            )}
            {isSigned && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                <CheckCircle size={12} />
                Contrat signé
              </span>
            )}
            {hasAutoDevis && (
              <button
                className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full hover:bg-orange-200 transition-colors"
                title="Cliquer pour annuler la séquence auto-devis"
                onClick={(e) => {
                  e.stopPropagation()
                  onCancelAutoDevis?.()
                }}
              >
                <Zap size={12} />
                Auto
                <XCircle size={12} className="ml-1" />
              </button>
            )}
            {isPromoActive && flashOriginalPrice && flashCurrentPrice && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold rounded-full animate-pulse"
                title={`Offre Flash ACTIVE : ${formatPrice(flashOriginalPrice)} → ${formatPrice(flashCurrentPrice)} (expire ${formatDateTime(flashExpiresAt)})`}
              >
                <Zap size={12} />
                Flash -{formatPrice(flashOriginalPrice - flashCurrentPrice)}
              </span>
            )}
            {shouldShowOriginalPrice && flashOriginalPrice && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-400 text-white text-xs font-semibold rounded-full"
                title={`Offre Flash EXPIRÉE le ${formatDateTime(flashExpiresAt)} - Prix revenu à ${formatPrice(flashOriginalPrice)}`}
              >
                <Clock size={12} />
                Flash expirée
              </span>
            )}
          </div>
          <div className="font-medium text-gray-900">{dossier.client_name}</div>
          <div className="text-sm text-gray-500">{dossier.client_email}</div>
          {dossier.created_at && (
            <div className="text-xs text-gray-400 mt-1">
              Reçue le {formatDate(dossier.created_at)}
            </div>
          )}
        </div>

        {/* Trajet */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin size={16} className="text-gray-400" />
          <span>{dossier.departure} → {dossier.arrival}</span>
        </div>

        {/* Dates */}
        <div className="text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span>{formatDate(dossier.departure_date)}</span>
          </div>
        </div>

        {/* Passagers */}
        <div className="flex items-center gap-2 text-sm">
          <Users size={16} className="text-gray-400" />
          <span>{dossier.passengers} pers.</span>
        </div>

        {/* Prix TTC */}
        <div className="text-center">
          <div className="text-xs text-gray-500">Prix TTC</div>
          {shouldShowOriginalPrice && flashOriginalPrice ? (
            <div>
              <span className="font-bold text-purple-dark">
                {formatPrice(flashOriginalPrice)}
              </span>
              <div className="text-xs text-gray-400 line-through">
                {formatPrice(flashCurrentPrice || 0)}
              </div>
            </div>
          ) : isPromoActive && flashOriginalPrice && flashCurrentPrice ? (
            <div>
              <span className="font-bold text-red-600">
                {formatPrice(flashCurrentPrice)}
              </span>
              <div className="text-xs text-gray-400 line-through">
                {formatPrice(flashOriginalPrice)}
              </div>
            </div>
          ) : prixAffiche > 0 ? (
            <div>
              <span className={cn(
                "font-bold",
                isDevisValide ? "text-green-600" : "text-purple-dark"
              )}>
                {formatPrice(prixAffiche)}
              </span>
              {!isDevisValide && nbDevisEnvoyes > 0 && (
                <div className="text-xs text-gray-400">
                  {nbDevisEnvoyes > 1 ? `(${nbDevisEnvoyes} devis)` : '(1 devis)'}
                </div>
              )}
            </div>
          ) : (
            <span className="font-bold text-gray-400">-</span>
          )}
        </div>

        {/* Reste à payer */}
        {hasContrat && (
          <div className="text-center">
            <div className="text-xs text-gray-500">Reste à payer</div>
            <span className={cn(
              "font-bold",
              resteAPayer <= 0 ? "text-emerald-600" : resteAPayer <= (dossier.price_ttc || 0) * 0.7 ? "text-amber-600" : "text-red-600"
            )}>
              {resteAPayer <= 0 ? "Soldé" : formatPrice(resteAPayer)}
            </span>
          </div>
        )}

        {/* Transporteur */}
        <div>
          {dossier.transporteur ? (
            <span className="bg-purple text-white text-xs font-bold px-2 py-1 rounded" title={dossier.transporteur.number}>
              {dossier.transporteur.name}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary btn-sm"
            title="Voir les devis"
            onClick={(e) => {
              e.stopPropagation()
              onViewDevis()
            }}
          >
            <FileText size={16} />
          </button>
          <button
            className="btn btn-primary btn-sm"
            title="Ouvrir le dossier"
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <Eye size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function CreateDossierModal({
  isOpen,
  onClose,
  transporteurs,
}: {
  isOpen: boolean
  onClose: () => void
  transporteurs: any[]
}) {
  const [formData, setFormData] = useState({
    client_name: '',
    client_company: '',
    client_email: '',
    client_phone: '',
    departure: '',
    arrival: '',
    departure_date: '',
    departure_time: '',
    return_date: '',
    return_time: '',
    passengers: 1,
    tva_rate: 10,
    transporteur_id: '',
    price_ht: 0,
    price_achat_ht: 0,
    price_achat_ttc: 0,
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createDossier = useCreateDossier()
  const createDevis = useCreateDevis()
  const queryClient = useQueryClient()

  // Calculate TTC
  const price_ttc = Math.round(formData.price_ht * (1 + formData.tva_rate / 100) * 100) / 100

  // Handler pour calculer TTC à partir de HT (prix achat)
  const handlePriceAchatHTChange = (value: number) => {
    setFormData({
      ...formData,
      price_achat_ht: value,
      price_achat_ttc: Math.round(value * 1.1 * 100) / 100,
    })
  }

  // Handler pour calculer HT à partir de TTC (prix achat)
  const handlePriceAchatTTCChange = (value: number) => {
    setFormData({
      ...formData,
      price_achat_ttc: value,
      price_achat_ht: Math.round((value / 1.1) * 100) / 100,
    })
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.client_name || !formData.client_email || !formData.departure || !formData.arrival || !formData.departure_date || !formData.passengers) {
      alert('Veuillez remplir tous les champs obligatoires')
      return
    }

    setIsSubmitting(true)
    try {
      // Generate reference
      const reference = `DOS-${Date.now().toString(36).toUpperCase()}`

      // Create dossier
      const dossierData = await createDossier.mutateAsync({
        reference,
        client_name: formData.client_name,
        client_company: formData.client_company || null,
        client_email: formData.client_email.toLowerCase(),
        client_phone: formData.client_phone || null,
        departure: formData.departure,
        arrival: formData.arrival,
        departure_date: new Date(formData.departure_date).toISOString(),
        departure_time: formData.departure_time || null,
        return_date: formData.return_date ? new Date(formData.return_date).toISOString() : null,
        return_time: formData.return_time || null,
        passengers: formData.passengers,
        tva_rate: formData.tva_rate,
        transporteur_id: formData.transporteur_id || null,
        price_ht: formData.price_ht || null,
        price_ttc: price_ttc || null,
        price_achat: formData.price_achat_ht || null,
        notes: formData.notes || null,
        status: 'new',
      })

      // If transporteur and price are set, create a devis
      if (formData.transporteur_id && formData.price_ht > 0) {
        const devisReference = `DEV-${Date.now().toString(36).toUpperCase()}`
        await createDevis.mutateAsync({
          reference: devisReference,
          dossier_id: dossierData.id,
          transporteur_id: formData.transporteur_id,
          price_ht: formData.price_ht,
          price_ttc: price_ttc,
          price_achat_ht: formData.price_achat_ht || null,
          price_achat_ttc: formData.price_achat_ttc || null,
          tva_rate: formData.tva_rate,
          status: 'draft',
          validity_days: 30,
        })
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })

      // Reset form and close modal
      setFormData({
        client_name: '',
        client_company: '',
        client_email: '',
        client_phone: '',
        departure: '',
        arrival: '',
        departure_date: '',
        departure_time: '',
        return_date: '',
        return_time: '',
        passengers: 1,
        tva_rate: 10,
        transporteur_id: '',
        price_ht: 0,
        price_achat_ht: 0,
        price_achat_ttc: 0,
        notes: '',
      })
      onClose()
      alert('Dossier créé avec succès !')
    } catch (error) {
      console.error('Erreur création dossier:', error)
      alert('Erreur lors de la création du dossier')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau dossier"
      size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </button>
          <button className="btn btn-success" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer le dossier'}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-purple mb-3">Client</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Nom *</label>
              <input
                type="text"
                className="input"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Société</label>
              <input
                type="text"
                className="input"
                value={formData.client_company}
                onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                value={formData.client_email}
                onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                className="input"
                value={formData.client_phone}
                onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-purple mb-3">Voyage</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Lieu de départ *</label>
              <AddressAutocomplete
                value={formData.departure}
                onChange={(value) => setFormData({ ...formData, departure: value })}
                placeholder="Ex: Paris, Gare de Lyon"
              />
            </div>
            <div>
              <label className="label">Lieu d'arrivée *</label>
              <AddressAutocomplete
                value={formData.arrival}
                onChange={(value) => setFormData({ ...formData, arrival: value })}
                placeholder="Ex: Lyon, Part-Dieu"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div>
              <label className="label">Date départ *</label>
              <input
                type="date"
                className="input"
                value={formData.departure_date}
                onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Heure départ</label>
              <input
                type="time"
                className="input"
                value={formData.departure_time}
                onChange={(e) => setFormData({ ...formData, departure_time: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Date retour</label>
              <input
                type="date"
                className="input"
                value={formData.return_date}
                onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Heure retour</label>
              <input
                type="time"
                className="input"
                value={formData.return_time}
                onChange={(e) => setFormData({ ...formData, return_time: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="label">Passagers *</label>
              <input
                type="number"
                className="input"
                min="1"
                value={formData.passengers}
                onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="label">TVA</label>
              <select
                className="input"
                value={formData.tva_rate}
                onChange={(e) => setFormData({ ...formData, tva_rate: parseInt(e.target.value) })}
              >
                <option value="10">10%</option>
                <option value="20">20%</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-purple mb-3">Devis (optionnel)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Transporteur</label>
              <select
                className="input"
                value={formData.transporteur_id}
                onChange={(e) => setFormData({ ...formData, transporteur_id: e.target.value })}
              >
                <option value="">-- Sélectionner --</option>
                {transporteurs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.number} - {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Prix vente HT</label>
              <input
                type="number"
                className="input"
                value={formData.price_ht}
                onChange={(e) => setFormData({ ...formData, price_ht: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div>
              <label className="label">Prix vente TTC</label>
              <input
                type="number"
                className="input bg-gray-50"
                value={price_ttc}
                readOnly
              />
            </div>
            <div>
              <label className="label">Prix achat HT</label>
              <input
                type="number"
                className="input"
                value={formData.price_achat_ht}
                onChange={(e) => handlePriceAchatHTChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="label">Prix achat TTC</label>
              <input
                type="number"
                className="input"
                value={formData.price_achat_ttc}
                onChange={(e) => handlePriceAchatTTCChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="label">Marge HT</label>
              <input
                type="text"
                className={`input bg-gray-50 font-semibold ${formData.price_ht - formData.price_achat_ht >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                value={formatPrice(formData.price_ht - formData.price_achat_ht)}
                readOnly
              />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Notes internes</label>
          <textarea
            className="input min-h-16"
            placeholder="Notes internes sur ce dossier..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  )
}

function DevisStatusBadge({ status, scheduledAt }: { status: string; scheduledAt?: string | null }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
    scheduled: { label: 'Programmé', className: 'bg-blue-100 text-blue-700' },
    sent: { label: 'Envoyé', className: 'bg-yellow-100 text-yellow-700' },
    client_validated: { label: 'PROFORMA (En attente)', className: 'bg-orange-100 text-orange-700 font-bold' },
    accepted: { label: 'PROFORMA CONFIRMÉE', className: 'bg-green-100 text-green-700 font-bold' },
    rejected: { label: 'Refusé (pas de dispo)', className: 'bg-red-100 text-red-700' },
    expired: { label: 'Expiré', className: 'bg-gray-100 text-gray-500' },
  }

  const { label, className } = config[status] || { label: status, className: 'bg-gray-100 text-gray-700' }

  // Pour les devis programmés, afficher l'heure d'envoi
  const displayLabel = status === 'scheduled' && scheduledAt
    ? `Programmé ${formatDateTime(scheduledAt)}`
    : label

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${className}`}>
      {displayLabel}
    </span>
  )
}

// Helper pour comparer deux valeurs et détecter les modifications
function CompareField({
  label,
  originalValue,
  clientValue,
  isEditing,
  editValue,
  onEditChange,
  type = 'text',
  formatFn,
  isAddress = false,
}: {
  label: string
  originalValue: string | number | null | undefined
  clientValue: string | number | null | undefined
  isEditing: boolean
  editValue: string | number
  onEditChange: (value: string) => void
  type?: 'text' | 'number' | 'datetime-local' | 'tel'
  formatFn?: (value: any) => string
  isAddress?: boolean
}) {
  const originalFormatted = formatFn ? formatFn(originalValue) : (originalValue?.toString() || '-')
  const clientFormatted = formatFn ? formatFn(clientValue) : (clientValue?.toString() || '-')
  const hasChanged = originalValue !== clientValue && clientValue !== null && clientValue !== undefined

  return (
    <div className={cn(
      "p-2 rounded-lg transition-all",
      hasChanged && !isEditing && "bg-amber-50 border border-amber-200"
    )}>
      <div className="flex items-center gap-2">
        <span className="text-gray-500 text-xs uppercase tracking-wide">{label}</span>
        {hasChanged && !isEditing && (
          <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded uppercase">
            Modifié
          </span>
        )}
      </div>
      {isEditing ? (
        isAddress ? (
          <AddressAutocomplete
            value={editValue?.toString() || ''}
            onChange={onEditChange}
            placeholder="Rechercher une adresse..."
            className="mt-1"
          />
        ) : (
          <input
            type={type}
            className="input mt-1"
            value={type === 'datetime-local' ? (editValue?.toString()?.slice(0, 16) || '') : editValue}
            onChange={(e) => onEditChange(e.target.value)}
          />
        )
      ) : (
        <div className="mt-1">
          {hasChanged ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 uppercase w-12">Devis:</span>
                <span className="text-gray-500 line-through text-sm">{originalFormatted}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-600 uppercase w-12">Client:</span>
                <span className="font-semibold text-amber-700">{clientFormatted}</span>
              </div>
            </div>
          ) : (
            <p className="font-medium">{clientFormatted}</p>
          )}
        </div>
      )}
    </div>
  )
}

// Voyage Info Admin Section Component
function VoyageInfoAdminSection({
  dossier,
  voyageInfo,
  transporteurs,
}: {
  dossier: DossierWithRelations
  voyageInfo: any
  transporteurs: any[]
}) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    aller_date: voyageInfo.aller_date || '',
    aller_passagers: voyageInfo.aller_passagers || dossier.passengers,
    aller_adresse_depart: voyageInfo.aller_adresse_depart || '',
    aller_adresse_arrivee: voyageInfo.aller_adresse_arrivee || '',
    retour_date: voyageInfo.retour_date || '',
    retour_passagers: voyageInfo.retour_passagers || dossier.passengers,
    retour_adresse_depart: voyageInfo.retour_adresse_depart || '',
    retour_adresse_arrivee: voyageInfo.retour_adresse_arrivee || '',
    contact_nom: voyageInfo.contact_nom || '',
    contact_prenom: voyageInfo.contact_prenom || '',
    contact_tel: voyageInfo.contact_tel || '',
    commentaires: voyageInfo.commentaires || '',
  })

  const updateDossier = useUpdateDossier()
  const updateVoyageInfo = useCreateOrUpdateVoyageInfo()
  const addTimelineEntry = useAddTimelineEntry()

  // États pour la modale d'email fournisseur
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailModalType, setEmailModalType] = useState<'infos_voyage' | 'demande_chauffeur'>('infos_voyage')
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
  })
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Construire les valeurs originales du devis/dossier
  const originalAllerDate = dossier.departure_date && dossier.departure_time
    ? `${dossier.departure_date.split('T')[0]}T${dossier.departure_time}`
    : dossier.departure_date
  const originalRetourDate = dossier.return_date && dossier.return_time
    ? `${dossier.return_date.split('T')[0]}T${dossier.return_time}`
    : dossier.return_date

  // Détecter s'il y a des modifications
  const hasModifications = useMemo(() => {
    const checks = [
      voyageInfo.aller_passagers !== dossier.passengers,
      voyageInfo.aller_adresse_depart !== dossier.departure_address && voyageInfo.aller_adresse_depart !== dossier.departure,
      voyageInfo.aller_adresse_arrivee !== dossier.arrival_address && voyageInfo.aller_adresse_arrivee !== dossier.arrival,
      dossier.return_date && voyageInfo.retour_passagers !== dossier.passengers,
    ]
    return checks.some(Boolean)
  }, [voyageInfo, dossier])

  // Sauvegarder les modifications
  const handleSaveChanges = async () => {
    try {
      const now = new Date().toISOString()
      // Ne garder que les champs valides pour la table voyage_infos
      // editData ne contient que certains champs éditables, les autres viennent de voyageInfo
      await updateVoyageInfo.mutateAsync({
        dossier_id: dossier.id,
        aller_date: editData.aller_date || voyageInfo.aller_date,
        aller_heure: voyageInfo.aller_heure,
        aller_adresse_depart: editData.aller_adresse_depart || voyageInfo.aller_adresse_depart,
        aller_adresse_arrivee: editData.aller_adresse_arrivee || voyageInfo.aller_adresse_arrivee,
        aller_passagers: editData.aller_passagers || voyageInfo.aller_passagers,
        retour_date: editData.retour_date || voyageInfo.retour_date,
        retour_heure: voyageInfo.retour_heure,
        retour_adresse_depart: editData.retour_adresse_depart || voyageInfo.retour_adresse_depart,
        retour_adresse_arrivee: editData.retour_adresse_arrivee || voyageInfo.retour_adresse_arrivee,
        retour_passagers: editData.retour_passagers || voyageInfo.retour_passagers,
        contact_nom: editData.contact_nom || voyageInfo.contact_nom,
        contact_prenom: editData.contact_prenom || voyageInfo.contact_prenom,
        contact_tel: editData.contact_tel || voyageInfo.contact_tel,
        contact_email: voyageInfo.contact_email,
        commentaires: editData.commentaires || voyageInfo.commentaires,
        admin_modified_at: now,
      })
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'note',
        content: 'Informations voyage modifiées par l\'admin',
      })
      setIsEditing(false)
      queryClient.invalidateQueries({ queryKey: ['voyage_info', dossier.id] })
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      alert('Erreur lors de la sauvegarde')
    }
  }

  // Ouvrir la modale d'email avec contenu pré-rempli
  const openEmailModal = (type: 'infos_voyage' | 'demande_chauffeur') => {
    const transporteur = transporteurs.find(t => t.id === dossier.transporteur_id)
    if (!transporteur) {
      alert('Aucun transporteur assigné à ce dossier')
      return
    }

    const allerDate = editData.aller_date || voyageInfo.aller_date
    const allerHeure = voyageInfo.aller_heure || dossier.departure_time || ''
    const retourDate = editData.retour_date || voyageInfo.retour_date
    const retourHeure = voyageInfo.retour_heure || dossier.return_time || ''
    const contactNom = `${editData.contact_prenom || voyageInfo.contact_prenom || ''} ${editData.contact_nom || voyageInfo.contact_nom || ''}`.trim()
    const contactTel = editData.contact_tel || voyageInfo.contact_tel || ''
    const commentaires = editData.commentaires || voyageInfo.commentaires || ''

    if (type === 'infos_voyage') {
      setEmailForm({
        to: transporteur.email || '',
        subject: `Informations voyage - ${dossier.reference}`,
        body: `Bonjour,

Veuillez trouver ci-dessous les informations pour le dossier ${dossier.reference} :

📅 ALLER
Date : ${allerDate ? new Date(allerDate).toLocaleDateString('fr-FR') : 'Non définie'}
Heure : ${allerHeure || 'Non définie'}
Départ : ${editData.aller_adresse_depart || voyageInfo.aller_adresse_depart || dossier.departure_address || dossier.departure}
Arrivée : ${editData.aller_adresse_arrivee || voyageInfo.aller_adresse_arrivee || dossier.arrival_address || dossier.arrival}
Passagers : ${editData.aller_passagers || voyageInfo.aller_passagers || dossier.passengers}
${retourDate ? `
📅 RETOUR
Date : ${new Date(retourDate).toLocaleDateString('fr-FR')}
Heure : ${retourHeure || 'Non définie'}
Départ : ${editData.retour_adresse_depart || voyageInfo.retour_adresse_depart || ''}
Arrivée : ${editData.retour_adresse_arrivee || voyageInfo.retour_adresse_arrivee || ''}
Passagers : ${editData.retour_passagers || voyageInfo.retour_passagers || dossier.passengers}
` : ''}
👤 CONTACT SUR PLACE
${contactNom || 'Non défini'}
${contactTel || ''}
${commentaires ? `
📝 COMMENTAIRES
${commentaires}
` : ''}
Merci de confirmer la bonne réception de ces informations.

Cordialement,
L'équipe Busmoov`,
      })
    } else {
      // demande_chauffeur
      setEmailForm({
        to: transporteur.email || '',
        subject: `Demande informations chauffeur - ${dossier.reference}`,
        body: `Bonjour,

Concernant le dossier ${dossier.reference} prévu le ${allerDate ? new Date(allerDate).toLocaleDateString('fr-FR') : ''} :

Trajet : ${editData.aller_adresse_depart || voyageInfo.aller_adresse_depart || dossier.departure_address || dossier.departure} → ${editData.aller_adresse_arrivee || voyageInfo.aller_adresse_arrivee || dossier.arrival_address || dossier.arrival}
Passagers : ${editData.aller_passagers || voyageInfo.aller_passagers || dossier.passengers}

Merci de nous transmettre les coordonnées du chauffeur assigné à cette mission :
- Nom et prénom du chauffeur
- Numéro de téléphone

Ces informations seront communiquées au client afin de faciliter le jour du départ.

Cordialement,
L'équipe Busmoov`,
      })
    }

    setEmailModalType(type)
    setShowEmailModal(true)
  }

  // Envoyer l'email au fournisseur
  const sendEmailToSupplier = async () => {
    const transporteur = transporteurs.find(t => t.id === dossier.transporteur_id)
    if (!transporteur || !emailForm.to) {
      alert('Email du transporteur manquant')
      return
    }

    setIsSendingEmail(true)
    try {
      console.log('=== DEBUT ENVOI EMAIL ===')
      console.log('Transporteur:', transporteur.name)
      console.log('Email:', emailForm.to)

      // Générer le PDF des informations voyage
      const tripType = dossier.return_date ? 'aller_retour' : 'aller'
      console.log('Type trajet:', tripType)

      const pdfData = {
        reference: dossier.reference || '',
        dossier_reference: dossier.reference || '',
        client_name: dossier.client_name || '',
        type: tripType as 'aller' | 'retour' | 'aller_retour',
        aller_date: editData.aller_date || voyageInfo.aller_date,
        aller_heure: voyageInfo.aller_heure || dossier.departure_time,
        aller_adresse_depart: editData.aller_adresse_depart || voyageInfo.aller_adresse_depart || dossier.departure_address || dossier.departure,
        aller_adresse_arrivee: editData.aller_adresse_arrivee || voyageInfo.aller_adresse_arrivee || dossier.arrival_address || dossier.arrival,
        aller_passagers: editData.aller_passagers || voyageInfo.aller_passagers || dossier.passengers,
        retour_date: editData.retour_date || voyageInfo.retour_date,
        retour_heure: voyageInfo.retour_heure || dossier.return_time,
        retour_adresse_depart: editData.retour_adresse_depart || voyageInfo.retour_adresse_depart,
        retour_adresse_arrivee: editData.retour_adresse_arrivee || voyageInfo.retour_adresse_arrivee,
        retour_passagers: editData.retour_passagers || voyageInfo.retour_passagers || dossier.passengers,
        contact_nom: editData.contact_nom || voyageInfo.contact_nom,
        contact_prenom: editData.contact_prenom || voyageInfo.contact_prenom,
        contact_tel: editData.contact_tel || voyageInfo.contact_tel,
        commentaires: editData.commentaires || voyageInfo.commentaires,
        luggage_type: dossier.luggage_type,
      }

      console.log('PDF Data:', pdfData)
      console.log('Génération du PDF...')

      const { base64: pdfBase64, filename: pdfFilename } = await generateInfosVoyagePDFBase64(pdfData)

      console.log('PDF généré avec succès:', pdfFilename, '(', Math.round(pdfBase64.length / 1024), 'Ko)')

      // Mode simulation en développement (localhost)
      const isDevMode = window.location.hostname === 'localhost'

      if (isDevMode) {
        // SIMULATION : afficher les détails dans la console au lieu d'envoyer
        console.log('=== SIMULATION ENVOI EMAIL ===')
        console.log('Destinataire:', emailForm.to)
        console.log('Sujet:', emailForm.subject)
        console.log('Corps:', emailForm.body)
        console.log('Pièce jointe:', pdfFilename, '(', Math.round(pdfBase64.length / 1024), 'Ko)')
        console.log('==============================')

        // Télécharger le PDF pour vérification
        const link = document.createElement('a')
        link.href = `data:application/pdf;base64,${pdfBase64}`
        link.download = pdfFilename
        link.click()

        alert(`[SIMULATION] Email qui serait envoyé à: ${emailForm.to}\nSujet: ${emailForm.subject}\n\nLe PDF a été téléchargé pour vérification.`)
      } else {
        // Production : envoyer l'email via l'Edge Function avec le PDF en pièce jointe
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            type: 'custom',
            to: emailForm.to,
            subject: emailForm.subject,
            html_content: emailForm.body.replace(/\n/g, '<br>'),
            attachments: [
              {
                filename: pdfFilename,
                content: pdfBase64,
                contentType: 'application/pdf',
              }
            ],
          }
        })

        if (emailError) {
          console.error('Erreur envoi email:', emailError)
          // Continuer quand même si l'email échoue
        }
      }

      const now = new Date().toISOString()

      if (emailModalType === 'demande_chauffeur') {
        // Mettre à jour le voyage_info avec validation admin
        await updateVoyageInfo.mutateAsync({
          dossier_id: dossier.id,
          aller_date: editData.aller_date || voyageInfo.aller_date,
          aller_heure: voyageInfo.aller_heure,
          aller_adresse_depart: editData.aller_adresse_depart || voyageInfo.aller_adresse_depart,
          aller_adresse_arrivee: editData.aller_adresse_arrivee || voyageInfo.aller_adresse_arrivee,
          aller_passagers: editData.aller_passagers || voyageInfo.aller_passagers,
          retour_date: editData.retour_date || voyageInfo.retour_date,
          retour_heure: voyageInfo.retour_heure,
          retour_adresse_depart: editData.retour_adresse_depart || voyageInfo.retour_adresse_depart,
          retour_adresse_arrivee: editData.retour_adresse_arrivee || voyageInfo.retour_adresse_arrivee,
          retour_passagers: editData.retour_passagers || voyageInfo.retour_passagers,
          contact_nom: editData.contact_nom || voyageInfo.contact_nom,
          contact_prenom: editData.contact_prenom || voyageInfo.contact_prenom,
          contact_tel: editData.contact_tel || voyageInfo.contact_tel,
          contact_email: voyageInfo.contact_email,
          commentaires: editData.commentaires || voyageInfo.commentaires,
          validated_at: now,
          admin_validated_at: now,
          sent_to_supplier_at: now,
        })

        // Passer le dossier en attente chauffeur + mettre à jour les dates si modifiées
        const updatedDossierData: any = {
          id: dossier.id,
          status: 'pending-driver',
        }
        // Mettre à jour departure_date si modifié dans infos voyage
        if (editData.aller_date || voyageInfo.aller_date) {
          updatedDossierData.departure_date = editData.aller_date || voyageInfo.aller_date
        }
        // Mettre à jour return_date si modifié dans infos voyage
        if (editData.retour_date || voyageInfo.retour_date) {
          updatedDossierData.return_date = editData.retour_date || voyageInfo.retour_date
        }
        await updateDossier.mutateAsync(updatedDossierData)

        await addTimelineEntry.mutateAsync({
          dossier_id: dossier.id,
          type: 'status_change',
          content: `Infos voyage validées et envoyées à ${transporteur.name} - Demande chauffeur envoyée`,
        })

        alert('Email envoyé ! Le dossier passe en attente chauffeur.')
      } else {
        // infos_voyage - juste envoyer les infos sans changer le statut
        await updateVoyageInfo.mutateAsync({
          dossier_id: dossier.id,
          aller_date: editData.aller_date || voyageInfo.aller_date,
          aller_heure: voyageInfo.aller_heure,
          aller_adresse_depart: editData.aller_adresse_depart || voyageInfo.aller_adresse_depart,
          aller_adresse_arrivee: editData.aller_adresse_arrivee || voyageInfo.aller_adresse_arrivee,
          aller_passagers: editData.aller_passagers || voyageInfo.aller_passagers,
          retour_date: editData.retour_date || voyageInfo.retour_date,
          retour_heure: voyageInfo.retour_heure,
          retour_adresse_depart: editData.retour_adresse_depart || voyageInfo.retour_adresse_depart,
          retour_adresse_arrivee: editData.retour_adresse_arrivee || voyageInfo.retour_adresse_arrivee,
          retour_passagers: editData.retour_passagers || voyageInfo.retour_passagers,
          contact_nom: editData.contact_nom || voyageInfo.contact_nom,
          contact_prenom: editData.contact_prenom || voyageInfo.contact_prenom,
          contact_tel: editData.contact_tel || voyageInfo.contact_tel,
          contact_email: voyageInfo.contact_email,
          commentaires: editData.commentaires || voyageInfo.commentaires,
          admin_modified_at: now,
          sent_to_supplier_at: now,
        })

        await addTimelineEntry.mutateAsync({
          dossier_id: dossier.id,
          type: 'note',
          content: `Infos voyage envoyées à ${transporteur.name}`,
        })

        alert(`Email envoyé à ${transporteur.name} !`)
      }

      queryClient.invalidateQueries({ queryKey: ['dossier', dossier.id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['voyageInfo', dossier.id] })
      setShowEmailModal(false)
      setIsEditing(false)
    } catch (error) {
      console.error('=== ERREUR ENVOI EMAIL ===')
      console.error('Type erreur:', typeof error)
      console.error('Erreur complète:', error)
      // Extraire le message d'erreur de façon plus robuste
      let errorMsg = 'Erreur inconnue'
      if (error instanceof Error) {
        errorMsg = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMsg = JSON.stringify(error, null, 2)
      } else {
        errorMsg = String(error)
      }
      console.error('Message formaté:', errorMsg)
      alert('Erreur lors de l\'envoi: ' + errorMsg)
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Valider et envoyer au fournisseur
  const handleValidateAndSend = async () => {
    const transporteur = transporteurs.find(t => t.id === dossier.transporteur_id)
    if (!transporteur) {
      alert('Aucun transporteur assigné à ce dossier')
      return
    }

    if (!confirm(`Valider les informations et les envoyer à ${transporteur.name} ?\n\nLe dossier passera en "Attente chauffeur".`)) {
      return
    }

    try {
      const now = new Date().toISOString()
      // Mettre à jour le voyage_info avec validation admin
      // Ne garder que les champs valides pour la table voyage_infos
      // editData ne contient que certains champs éditables, les autres viennent de voyageInfo
      await updateVoyageInfo.mutateAsync({
        dossier_id: dossier.id,
        aller_date: editData.aller_date || voyageInfo.aller_date,
        aller_heure: voyageInfo.aller_heure,
        aller_adresse_depart: editData.aller_adresse_depart || voyageInfo.aller_adresse_depart,
        aller_adresse_arrivee: editData.aller_adresse_arrivee || voyageInfo.aller_adresse_arrivee,
        aller_passagers: editData.aller_passagers || voyageInfo.aller_passagers,
        retour_date: editData.retour_date || voyageInfo.retour_date,
        retour_heure: voyageInfo.retour_heure,
        retour_adresse_depart: editData.retour_adresse_depart || voyageInfo.retour_adresse_depart,
        retour_adresse_arrivee: editData.retour_adresse_arrivee || voyageInfo.retour_adresse_arrivee,
        retour_passagers: editData.retour_passagers || voyageInfo.retour_passagers,
        contact_nom: editData.contact_nom || voyageInfo.contact_nom,
        contact_prenom: editData.contact_prenom || voyageInfo.contact_prenom,
        contact_tel: editData.contact_tel || voyageInfo.contact_tel,
        contact_email: voyageInfo.contact_email,
        commentaires: editData.commentaires || voyageInfo.commentaires,
        validated_at: now,
        admin_validated_at: now,
        sent_to_supplier_at: now,
      })

      // Passer le dossier en attente chauffeur + mettre à jour les dates si modifiées
      const updatedDossierData2: any = {
        id: dossier.id,
        status: 'pending-driver',
      }
      // Mettre à jour departure_date si modifié dans infos voyage
      if (editData.aller_date || voyageInfo.aller_date) {
        updatedDossierData2.departure_date = editData.aller_date || voyageInfo.aller_date
      }
      // Mettre à jour return_date si modifié dans infos voyage
      if (editData.retour_date || voyageInfo.retour_date) {
        updatedDossierData2.return_date = editData.retour_date || voyageInfo.retour_date
      }
      await updateDossier.mutateAsync(updatedDossierData2)

      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'status_change',
        content: `Infos voyage validées et envoyées à ${transporteur.name}`,
      })

      queryClient.invalidateQueries({ queryKey: ['dossier', dossier.id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['voyageInfo', dossier.id] })
      alert('Informations envoyées au fournisseur !')
    } catch (error) {
      console.error('Erreur validation:', error)
      alert('Erreur lors de la validation')
    }
  }

  // Demander confirmation au fournisseur (envoyer les infos voyage)
  const handleRequestSupplierConfirmation = async () => {
    const transporteur = transporteurs.find(t => t.id === dossier.transporteur_id)
    if (!transporteur) {
      alert('Aucun transporteur assigné à ce dossier')
      return
    }

    if (!confirm(`Envoyer les informations voyage à ${transporteur.name} pour confirmation ?`)) {
      return
    }

    try {
      const now = new Date().toISOString()
      // Sauvegarder les modifications - ne garder que les champs valides
      // editData ne contient que certains champs éditables, les autres viennent de voyageInfo
      await updateVoyageInfo.mutateAsync({
        dossier_id: dossier.id,
        aller_date: editData.aller_date || voyageInfo.aller_date,
        aller_heure: voyageInfo.aller_heure,
        aller_adresse_depart: editData.aller_adresse_depart || voyageInfo.aller_adresse_depart,
        aller_adresse_arrivee: editData.aller_adresse_arrivee || voyageInfo.aller_adresse_arrivee,
        aller_passagers: editData.aller_passagers || voyageInfo.aller_passagers,
        retour_date: editData.retour_date || voyageInfo.retour_date,
        retour_heure: voyageInfo.retour_heure,
        retour_adresse_depart: editData.retour_adresse_depart || voyageInfo.retour_adresse_depart,
        retour_adresse_arrivee: editData.retour_adresse_arrivee || voyageInfo.retour_adresse_arrivee,
        retour_passagers: editData.retour_passagers || voyageInfo.retour_passagers,
        contact_nom: editData.contact_nom || voyageInfo.contact_nom,
        contact_prenom: editData.contact_prenom || voyageInfo.contact_prenom,
        contact_tel: editData.contact_tel || voyageInfo.contact_tel,
        contact_email: voyageInfo.contact_email,
        commentaires: editData.commentaires || voyageInfo.commentaires,
        admin_modified_at: now,
        sent_to_supplier_at: now,
      })

      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'note',
        content: `Infos voyage envoyées à ${transporteur.name} pour confirmation`,
      })

      queryClient.invalidateQueries({ queryKey: ['dossier', dossier.id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['voyageInfo', dossier.id] })
      setIsEditing(false)
      alert(`Informations envoyées à ${transporteur.name} !`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi')
    }
  }

  // Déterminer le statut actuel
  const isValidatedByClient = !!voyageInfo.validated_at
  const isValidatedByAdmin = !!voyageInfo.admin_validated_at
  const isPendingDriver = dossier.status === 'pending-driver'
  const isCompleted = dossier.status === 'completed'

  return (
    <div className={cn(
      "mt-4 rounded-xl p-5 border-2",
      isValidatedByAdmin
        ? "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
        : "bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className={cn(
              "font-semibold flex items-center gap-2",
              isValidatedByAdmin ? "text-emerald-800" : "text-cyan-800"
            )}>
              <FileText size={18} className={isValidatedByAdmin ? "text-emerald-600" : "text-cyan-600"} />
              Informations Voyage
            </h3>
            {/* Badge terminé */}
            {isCompleted && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <CheckCircle size={12} />
                Voyage terminé
              </span>
            )}
            {/* Badge en attente chauffeur */}
            {isPendingDriver && !isCompleted && (
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <Truck size={12} />
                En attente chauffeur
              </span>
            )}
            {hasModifications && !isEditing && !isValidatedByAdmin && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <AlertTriangle size={12} />
                Modifications détectées
              </span>
            )}
            {dossier.status === 'pending-info-confirm' && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                En attente confirmation client
              </span>
            )}
          </div>
          {/* Historique des validations */}
          <div className="flex flex-wrap gap-2 text-xs">
            {isValidatedByClient && (
              <span className="text-gray-600 flex items-center gap-1">
                <CheckCircle size={12} className="text-blue-500" />
                Client : {formatDate(voyageInfo.validated_at)}
              </span>
            )}
            {isValidatedByAdmin && (
              <span className="text-gray-600 flex items-center gap-1">
                <CheckCircle size={12} className="text-emerald-500" />
                Envoyé fournisseur : {formatDate(voyageInfo.admin_validated_at)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-sm btn-secondary flex items-center gap-1"
            >
              <Pencil size={14} />
              Modifier
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="btn btn-sm btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveChanges}
                className="btn btn-sm btn-primary flex items-center gap-1"
              >
                <Save size={14} />
                Enregistrer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Légende */}
      {hasModifications && !isEditing && (
        <div className="mb-4 p-3 bg-white/80 rounded-lg border border-amber-200 flex items-center gap-4 text-xs">
          <span className="text-gray-600">Légende :</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></span>
            <span className="text-amber-700">Champ modifié par le client</span>
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <span className="line-through">Valeur devis</span>
            → Valeur client
          </span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Aller */}
        <div className="bg-white rounded-lg p-4 border border-cyan-100">
          <h4 className="font-medium text-cyan-700 mb-3 flex items-center gap-2">
            <MapPin size={16} />
            Aller
          </h4>
          <div className="space-y-2">
            <CompareField
              label="Date/heure"
              originalValue={originalAllerDate}
              clientValue={voyageInfo.aller_date}
              isEditing={isEditing}
              editValue={editData.aller_date}
              onEditChange={(v) => setEditData({ ...editData, aller_date: v })}
              type="datetime-local"
              formatFn={(v) => v ? formatDateTime(v) : '-'}
            />
            <CompareField
              label="Passagers"
              originalValue={dossier.passengers}
              clientValue={voyageInfo.aller_passagers}
              isEditing={isEditing}
              editValue={editData.aller_passagers}
              onEditChange={(v) => setEditData({ ...editData, aller_passagers: parseInt(v) })}
              type="number"
              formatFn={(v) => v ? `${v} personnes` : '-'}
            />
            <CompareField
              label="Adresse de départ"
              originalValue={dossier.departure_address || dossier.departure}
              clientValue={voyageInfo.aller_adresse_depart}
              isEditing={isEditing}
              editValue={editData.aller_adresse_depart}
              onEditChange={(v) => setEditData({ ...editData, aller_adresse_depart: v })}
              isAddress={true}
            />
            <CompareField
              label="Adresse d'arrivée"
              originalValue={dossier.arrival_address || dossier.arrival}
              clientValue={voyageInfo.aller_adresse_arrivee}
              isEditing={isEditing}
              editValue={editData.aller_adresse_arrivee}
              onEditChange={(v) => setEditData({ ...editData, aller_adresse_arrivee: v })}
              isAddress={true}
            />
          </div>
        </div>

        {/* Retour */}
        {dossier.return_date && (
          <div className="bg-white rounded-lg p-4 border border-cyan-100">
            <h4 className="font-medium text-cyan-700 mb-3 flex items-center gap-2">
              <MapPin size={16} />
              Retour
            </h4>
            <div className="space-y-2">
              <CompareField
                label="Date/heure"
                originalValue={originalRetourDate}
                clientValue={voyageInfo.retour_date}
                isEditing={isEditing}
                editValue={editData.retour_date}
                onEditChange={(v) => setEditData({ ...editData, retour_date: v })}
                type="datetime-local"
                formatFn={(v) => v ? formatDateTime(v) : '-'}
              />
              <CompareField
                label="Passagers"
                originalValue={dossier.passengers}
                clientValue={voyageInfo.retour_passagers}
                isEditing={isEditing}
                editValue={editData.retour_passagers}
                onEditChange={(v) => setEditData({ ...editData, retour_passagers: parseInt(v) })}
                type="number"
                formatFn={(v) => v ? `${v} personnes` : '-'}
              />
              <CompareField
                label="Adresse de départ"
                originalValue={dossier.return_departure_address || dossier.arrival}
                clientValue={voyageInfo.retour_adresse_depart}
                isEditing={isEditing}
                editValue={editData.retour_adresse_depart}
                onEditChange={(v) => setEditData({ ...editData, retour_adresse_depart: v })}
                isAddress={true}
              />
              <CompareField
                label="Adresse d'arrivée"
                originalValue={dossier.return_arrival_address || dossier.departure}
                clientValue={voyageInfo.retour_adresse_arrivee}
                isEditing={isEditing}
                editValue={editData.retour_adresse_arrivee}
                onEditChange={(v) => setEditData({ ...editData, retour_adresse_arrivee: v })}
                isAddress={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* Contact et Commentaires */}
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 border border-cyan-100">
          <h4 className="font-medium text-cyan-700 mb-3 flex items-center gap-2">
            <Phone size={16} />
            Contact sur place
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Nom:</span>
              {isEditing ? (
                <input
                  type="text"
                  className="input mt-1"
                  value={editData.contact_nom}
                  onChange={(e) => setEditData({ ...editData, contact_nom: e.target.value })}
                />
              ) : (
                <p className="font-medium">{voyageInfo.contact_nom || '-'}</p>
              )}
            </div>
            <div>
              <span className="text-gray-500">Prénom:</span>
              {isEditing ? (
                <input
                  type="text"
                  className="input mt-1"
                  value={editData.contact_prenom}
                  onChange={(e) => setEditData({ ...editData, contact_prenom: e.target.value })}
                />
              ) : (
                <p className="font-medium">{voyageInfo.contact_prenom || '-'}</p>
              )}
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Téléphone:</span>
              {isEditing ? (
                <input
                  type="tel"
                  className="input mt-1"
                  value={editData.contact_tel}
                  onChange={(e) => setEditData({ ...editData, contact_tel: e.target.value })}
                />
              ) : (
                <p className="font-medium">{voyageInfo.contact_tel || '-'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-cyan-100">
          <h4 className="font-medium text-cyan-700 mb-3 flex items-center gap-2">
            <MessageCircle size={16} />
            Commentaires client
          </h4>
          {isEditing ? (
            <textarea
              className="input min-h-[100px]"
              value={editData.commentaires}
              onChange={(e) => setEditData({ ...editData, commentaires: e.target.value })}
              placeholder="Commentaires..."
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {voyageInfo.commentaires || 'Aucun commentaire'}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={cn(
        "mt-6 flex flex-wrap gap-3 justify-between border-t pt-4",
        isValidatedByAdmin ? "border-emerald-200" : "border-cyan-200"
      )}>
        {/* Bouton téléchargement PDF */}
        <button
          onClick={async () => {
            const hasRetour = !!dossier.return_date || !!voyageInfo.retour_date
            await generateInfosVoyagePDF({
              reference: dossier.reference,
              client_name: dossier.client_name,
              client_phone: dossier.client_phone,
              type: hasRetour ? 'aller_retour' : 'aller',
              aller_date: voyageInfo.aller_date,
              aller_heure: voyageInfo.aller_heure,
              aller_passagers: voyageInfo.aller_passagers || dossier.passengers,
              aller_adresse_depart: voyageInfo.aller_adresse_depart,
              aller_adresse_arrivee: voyageInfo.aller_adresse_arrivee,
              retour_date: voyageInfo.retour_date,
              retour_heure: voyageInfo.retour_heure,
              retour_passagers: voyageInfo.retour_passagers || dossier.passengers,
              retour_adresse_depart: voyageInfo.retour_adresse_depart,
              retour_adresse_arrivee: voyageInfo.retour_adresse_arrivee,
              contact_nom: voyageInfo.contact_nom,
              contact_prenom: voyageInfo.contact_prenom,
              contact_tel: voyageInfo.contact_tel,
              commentaires: voyageInfo.commentaires,
              luggage_type: dossier.luggage_type,
              validated_at: voyageInfo.validated_at,
            })
          }}
          className="btn btn-outline flex items-center gap-2"
        >
          <Download size={16} />
          Télécharger PDF
        </button>

        {/* Actions envoi */}
        {!isCompleted && (
          <div className="flex gap-3">
            <button
              onClick={() => openEmailModal('infos_voyage')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Send size={16} />
              {isValidatedByAdmin ? 'Renvoyer au fournisseur' : 'Envoyer au fournisseur'}
            </button>
            <button
              onClick={() => openEmailModal('demande_chauffeur')}
              className="btn btn-success flex items-center gap-2"
            >
              <CheckCircle size={16} />
              {isValidatedByAdmin ? 'Mettre à jour & Renvoyer' : 'Valider & Passer en attente chauffeur'}
            </button>
          </div>
        )}
      </div>

      {/* Section Chauffeur - Affichée si infos chauffeur reçues */}
      {(voyageInfo.chauffeur_aller_nom || voyageInfo.chauffeur_retour_nom) && (
        <div className="mt-6 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
          <h4 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
            <Truck size={18} className="text-emerald-600" />
            Informations Chauffeur
            {voyageInfo.feuille_route_envoyee_at && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full ml-2">
                Feuille de route envoyée
              </span>
            )}
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Chauffeur Aller */}
            {voyageInfo.chauffeur_aller_nom && (
              <div className="bg-white rounded-lg p-3 border border-emerald-100">
                <h5 className="font-medium text-purple-dark mb-2 text-sm">Chauffeur Aller</h5>
                <div className="space-y-1 text-sm">
                  <p><strong>Nom:</strong> {voyageInfo.chauffeur_aller_nom}</p>
                  <p><strong>Tel:</strong> {voyageInfo.chauffeur_aller_tel || '-'}</p>
                  <p><strong>Véhicule:</strong> {voyageInfo.chauffeur_aller_immatriculation || '-'}</p>
                </div>
              </div>
            )}
            {/* Chauffeur Retour */}
            {voyageInfo.chauffeur_retour_nom && (
              <div className="bg-white rounded-lg p-3 border border-emerald-100">
                <h5 className="font-medium text-magenta mb-2 text-sm">Chauffeur Retour</h5>
                <div className="space-y-1 text-sm">
                  <p><strong>Nom:</strong> {voyageInfo.chauffeur_retour_nom}</p>
                  <p><strong>Tel:</strong> {voyageInfo.chauffeur_retour_tel || '-'}</p>
                  <p><strong>Véhicule:</strong> {voyageInfo.chauffeur_retour_immatriculation || '-'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Email Fournisseur */}
      {showEmailModal && (
        <Modal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          title={emailModalType === 'demande_chauffeur' ? 'Demande informations chauffeur' : 'Envoyer informations voyage'}
        >
          <div className="space-y-4">
            <div>
              <label className="label">Destinataire</label>
              <input
                type="email"
                value={emailForm.to}
                onChange={(e) => setEmailForm(f => ({ ...f, to: e.target.value }))}
                className="input w-full"
                placeholder="Email du transporteur"
              />
            </div>
            <div>
              <label className="label">Objet</label>
              <input
                type="text"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(f => ({ ...f, subject: e.target.value }))}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea
                value={emailForm.body}
                onChange={(e) => setEmailForm(f => ({ ...f, body: e.target.value }))}
                rows={15}
                className="input w-full font-mono text-sm"
                style={{ whiteSpace: 'pre-wrap' }}
              />
            </div>

            {/* Info pièce jointe PDF */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-2">
              <FileText size={16} className="text-blue-600 flex-shrink-0" />
              <span><strong>Pièce jointe :</strong> Le PDF "Informations Voyage" sera automatiquement joint à l'email.</span>
            </div>

            {emailModalType === 'demande_chauffeur' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>Note :</strong> Cet envoi validera les informations voyage et passera le dossier en "Attente chauffeur".
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                onClick={() => setShowEmailModal(false)}
                className="btn btn-secondary"
                disabled={isSendingEmail}
              >
                Annuler
              </button>
              <button
                onClick={sendEmailToSupplier}
                className="btn btn-primary flex items-center gap-2"
                disabled={isSendingEmail || !emailForm.to}
              >
                {isSendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer l'email
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Dossier Detail View Component
function DossierDetailView({
  dossier,
  transporteurs,
  onClose,
  onViewDevis,
  openEmailPreview,
  onEditDevis,
}: {
  dossier: DossierWithRelations
  transporteurs: any[]
  onClose: () => void
  onViewDevis: () => void
  openEmailPreview: (data: { to: string; subject: string; body: string }, onSend?: () => void | Promise<void>) => void
  onEditDevis: (devis: any) => void
}) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [showNewDevisModal, setShowNewDevisModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showRefuseModal, setShowRefuseModal] = useState(false)
  const [refuseDevisId, setRefuseDevisId] = useState<string | null>(null)
  const [showDemandeFournisseurModal, setShowDemandeFournisseurModal] = useState(false)
  const [showDemandeContactChauffeurModal, setShowDemandeContactChauffeurModal] = useState(false)
  const [showOffreFlashModalDetail, setShowOffreFlashModalDetail] = useState(false)
  const [offreFlashConfigDetail, setOffreFlashConfigDetail] = useState({
    type: 'percent' as 'percent' | 'amount',
    value: 10,
    validityHours: 48,
  })
  const [selectedTransporteursDF, setSelectedTransporteursDF] = useState<string[]>([])
  const [categoryFilterDF, setCategoryFilterDF] = useState('')
  const [searchDF, setSearchDF] = useState('')
  const [messageTemplateDF, setMessageTemplateDF] = useState('')
  const [showPreviewDF, setShowPreviewDF] = useState(false)
  const createDemandeFournisseur = useCreateDemandeFournisseur()
  const [formData, setFormData] = useState({
    client_name: dossier.client_name || '',
    client_email: dossier.client_email || '',
    client_phone: dossier.client_phone || '',
    client_company: dossier.client_company || '',
    billing_address: dossier.billing_address || '',
    billing_zip: dossier.billing_zip || '',
    billing_city: dossier.billing_city || '',
    billing_country: dossier.billing_country || 'France',
    departure: dossier.departure || '',
    arrival: dossier.arrival || '',
    departure_date: dossier.departure_date?.slice(0, 16) || '',
    return_date: dossier.return_date?.slice(0, 16) || '',
    passengers: dossier.passengers || 1,
    vehicle_type: dossier.vehicle_type || 'autocar',
    status: dossier.status || 'new',
    price_ht: dossier.price_ht || 0,
    price_ttc: dossier.price_ttc || 0,
    price_achat: dossier.price_achat || 0,
    transporteur_id: dossier.transporteur_id || '',
    notes: dossier.notes || '',
  })

  const updateDossier = useUpdateDossier()
  const updateDevis = useUpdateDevis()
  const deleteDevis = useDeleteDevis()
  const createDevis = useCreateDevis()
  const addTimelineEntry = useAddTimelineEntry()
  const { data: dossierDevis = [], isLoading: devisLoading } = useDevisByDossier(dossier.id)
  const { data: timelineEntries = [], isLoading: timelineLoading } = useTimeline(dossier.id)
  const { data: voyageInfo } = useVoyageInfo(dossier.id)
  const { data: demandesFournisseurs = [] } = useDemandesFournisseurs(dossier.id)
  const { data: demandesChauffeur = [] } = useDemandesChauffeur(dossier.id)
  const updateDemandeFournisseur = useUpdateDemandeFournisseur()
  const markFeuilleRouteEnvoyee = useMarkFeuilleRouteEnvoyee()

  // États pour la modale d'envoi de feuille de route au client
  const [showFeuilleRouteEmailModal, setShowFeuilleRouteEmailModal] = useState(false)
  const [feuilleRouteEmailForm, setFeuilleRouteEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
  })
  const [isSendingFeuilleRouteEmail, setIsSendingFeuilleRouteEmail] = useState(false)

  // Contrat et finances
  const { data: contrat } = useContratByDossier(dossier.id)
  const { data: paiements = [], isLoading: paiementsLoading } = usePaiementsByContrat(contrat?.id)
  const { data: factures = [], isLoading: facturesLoading } = useFacturesByDossier(dossier.id)
  const { data: paiementsFournisseur = [], isLoading: paiementsFournisseurLoading } = usePaiementsFournisseurs(dossier.id)
  const createPaiement = useCreatePaiement()
  const deletePaiement = useDeletePaiement()
  const createFacture = useCreateFacture()
  const createPaiementFournisseur = useCreatePaiementFournisseur()
  const deletePaiementFournisseur = useDeletePaiementFournisseur()
  const createRappel = useCreateRappel()
  const updateRappel = useUpdateRappel()
  const deleteRappel = useDeleteRappel()
  const { data: rappelsDossier = [] } = useRappels({ dossierId: dossier.id, includeCompleted: true })

  // États pour les modales paiement/facture
  const [showPaiementModal, setShowPaiementModal] = useState(false)
  const [showFactureModal, setShowFactureModal] = useState(false)
  const [showPaiementFournisseurModal, setShowPaiementFournisseurModal] = useState(false)
  const [showRappelModal, setShowRappelModal] = useState(false)
  const [rappelForm, setRappelForm] = useState({
    title: '',
    description: '',
    reminder_date: new Date().toISOString().slice(0, 10),
    reminder_time: '09:00',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
  })

  // Onglet actif pour la section Finances
  const [financeTab, setFinanceTab] = useState<'contrat' | 'paiements' | 'factures' | 'voyage'>('contrat')
  const [paiementForm, setPaiementForm] = useState({
    type: 'virement' as 'virement' | 'cb' | 'especes' | 'cheque' | 'remboursement',
    amount: 0,
    payment_date: new Date().toISOString().slice(0, 16),
    reference: '',
    notes: '',
  })
  const [factureForm, setFactureForm] = useState({
    type: 'acompte' as 'acompte' | 'solde' | 'avoir',
    amount_ttc: 0,
    useAutoAmount: true,
    client_name: '',
    client_address: '',
    client_zip: '',
    client_city: '',
  })
  const [showEnvoiFactureModal, setShowEnvoiFactureModal] = useState(false)
  const [selectedFactureForEmail, setSelectedFactureForEmail] = useState<any>(null)
  const [envoiFactureForm, setEnvoiFactureForm] = useState({
    to: '',
    subject: '',
    body: '',
  })
  // Modal pour marquer facture comme payée
  const [showMarkFacturePaidModal, setShowMarkFacturePaidModal] = useState(false)
  const [selectedFactureForPaid, setSelectedFactureForPaid] = useState<any>(null)
  const [markPaidForm, setMarkPaidForm] = useState({
    type: 'virement' as 'virement' | 'cb' | 'especes' | 'cheque',
    payment_date: new Date().toISOString().slice(0, 10),
    reference: '',
    notes: '',
  })

  // Modal pour générer un avoir
  const [showAvoirModal, setShowAvoirModal] = useState(false)
  const [selectedFactureForAvoir, setSelectedFactureForAvoir] = useState<any>(null)
  const [avoirForm, setAvoirForm] = useState({
    type: 'total' as 'total' | 'partiel',
    amount: 0,
    motif: '',
    impactDossier: false, // Si true, met à jour le prix de vente du dossier (remise commerciale)
  })
  const [creatingAvoir, setCreatingAvoir] = useState(false)

  const [paiementFournisseurForm, setPaiementFournisseurForm] = useState({
    amount: 0,
    payment_date: new Date().toISOString().slice(0, 10),
    type: 'virement' as 'virement' | 'cb' | 'cheque' | 'especes',
    reference: '',
    notes: '',
  })

  // État pour saisie manuelle des infos chauffeur
  const [showChauffeurManuelModal, setShowChauffeurManuelModal] = useState(false)
  interface ChauffeurCar {
    nom: string
    tel: string
    immatriculation: string
  }
  const [chauffeursAllerForm, setChauffeursAllerForm] = useState<ChauffeurCar[]>([{ nom: '', tel: '', immatriculation: '' }])
  const [chauffeursRetourForm, setChauffeursRetourForm] = useState<ChauffeurCar[]>([{ nom: '', tel: '', immatriculation: '' }])
  const [memeChauffeursRetour, setMemeChauffeursRetour] = useState(true)
  const [astreinteTelForm, setAstreinteTelForm] = useState('')
  const [savingChauffeurManuel, setSavingChauffeurManuel] = useState(false)

  // Fonction pour sauvegarder les infos chauffeur manuellement
  const handleSaveChauffeurManuel = async () => {
    if (!voyageInfo) return
    setSavingChauffeurManuel(true)
    try {
      // Pour le premier chauffeur, on utilise les champs classiques
      const updateData: any = {
        chauffeur_aller_nom: chauffeursAllerForm[0]?.nom || '',
        chauffeur_aller_tel: chauffeursAllerForm[0]?.tel || '',
        chauffeur_aller_immatriculation: chauffeursAllerForm[0]?.immatriculation || '',
        chauffeur_info_recue_at: new Date().toISOString(),
        astreinte_tel: astreinteTelForm || null,
      }

      // Pour le retour
      if (memeChauffeursRetour) {
        updateData.chauffeur_retour_nom = chauffeursAllerForm[0]?.nom || ''
        updateData.chauffeur_retour_tel = chauffeursAllerForm[0]?.tel || ''
        updateData.chauffeur_retour_immatriculation = chauffeursAllerForm[0]?.immatriculation || ''
      } else {
        updateData.chauffeur_retour_nom = chauffeursRetourForm[0]?.nom || ''
        updateData.chauffeur_retour_tel = chauffeursRetourForm[0]?.tel || ''
        updateData.chauffeur_retour_immatriculation = chauffeursRetourForm[0]?.immatriculation || ''
      }

      // Stocker les chauffeurs supplémentaires en JSON si plusieurs cars
      if (chauffeursAllerForm.length > 1) {
        updateData.chauffeurs_supplementaires_aller = JSON.stringify(chauffeursAllerForm.slice(1))
      }
      if (!memeChauffeursRetour && chauffeursRetourForm.length > 1) {
        updateData.chauffeurs_supplementaires_retour = JSON.stringify(chauffeursRetourForm.slice(1))
      }

      const { error } = await supabase
        .from('voyage_infos')
        .update(updateData)
        .eq('dossier_id', dossier.id)

      if (error) throw error

      // Ajouter à la timeline
      const nbCars = chauffeursAllerForm.length
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'chauffeur_info',
        content: `Informations chauffeur saisies manuellement par l'admin (${nbCars} car${nbCars > 1 ? 's' : ''})`,
      })

      // Mettre à jour le statut du dossier
      await supabase
        .from('dossiers')
        .update({ status: 'confirmed' })
        .eq('id', dossier.id)

      queryClient.invalidateQueries({ queryKey: ['voyage-info', dossier.id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })

      setShowChauffeurManuelModal(false)
      alert('Informations chauffeur enregistrées avec succès !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'enregistrement')
    } finally {
      setSavingChauffeurManuel(false)
    }
  }

  // Calculs financiers
  const totalPaiements = paiements.reduce((sum, p) => sum + (p.amount || 0), 0)
  const resteAPayer = (contrat?.price_ttc || 0) - totalPaiements
  const totalPaiementsFournisseur = paiementsFournisseur.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const resteAPayerFournisseur = (dossier.price_achat || 0) - totalPaiementsFournisseur

  // Auto-devis hooks
  const { data: autoDevisStatus } = useDossierAutoDevis(dossier.id)
  const { data: defaultWorkflow } = useDefaultWorkflow()
  const activateAutoDevis = useActivateAutoDevis()
  const deactivateAutoDevis = useDeactivateAutoDevis()

  const handleToggleAutoDevis = async () => {
    try {
      if (autoDevisStatus?.is_active) {
        await deactivateAutoDevis.mutateAsync(dossier.id)
        await addTimelineEntry.mutateAsync({
          dossier_id: dossier.id,
          type: 'auto_devis',
          content: 'Auto-devis désactivé',
        })
      } else {
        if (!defaultWorkflow) {
          alert('Aucun workflow par défaut configuré. Créez-en un dans Paramètres > Workflows.')
          return
        }
        await activateAutoDevis.mutateAsync({ dossierId: dossier.id, workflowId: defaultWorkflow.id })
        await addTimelineEntry.mutateAsync({
          dossier_id: dossier.id,
          type: 'auto_devis',
          content: `Auto-devis activé avec le workflow "${defaultWorkflow.name}"`,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['dossier_auto_devis', dossier.id] })
    } catch (error) {
      console.error('Erreur toggle auto-devis:', error)
      alert('Erreur lors de la modification de l\'auto-devis')
    }
  }

  // Ouvrir la modale d'envoi de feuille de route au client
  const openFeuilleRouteEmailModal = () => {
    if (!voyageInfo) {
      alert('Informations voyage non disponibles')
      return
    }

    const allerDate = voyageInfo.aller_date
    const chauffeurAllerNom = voyageInfo.chauffeur_aller_nom
    const chauffeurAllerTel = voyageInfo.chauffeur_aller_tel

    setFeuilleRouteEmailForm({
      to: dossier.client_email || '',
      subject: `Votre feuille de route - ${dossier.reference}`,
      body: `Bonjour ${dossier.client_name || ''},

Votre voyage approche ! Veuillez trouver ci-joint votre feuille de route pour le ${allerDate ? new Date(allerDate).toLocaleDateString('fr-FR') : 'voyage'}.

📍 Trajet : ${voyageInfo.aller_adresse_depart || dossier.departure} → ${voyageInfo.aller_adresse_arrivee || dossier.arrival}
👥 Passagers : ${voyageInfo.aller_passagers || dossier.passengers}
${chauffeurAllerNom ? `
🚌 Votre chauffeur : ${chauffeurAllerNom}
📞 Contact : ${chauffeurAllerTel || 'Voir feuille de route'}
` : ''}
La feuille de route en pièce jointe contient toutes les informations nécessaires pour votre voyage (coordonnées chauffeur, adresses exactes, rappel de la législation).

En cas de question ou de besoin, n'hésitez pas à nous contacter.

Nous vous souhaitons un excellent voyage !

Cordialement,
L'équipe Busmoov`,
    })

    setShowFeuilleRouteEmailModal(true)
  }

  // Envoyer la feuille de route par email au client
  const sendFeuilleRouteEmail = async () => {
    if (!voyageInfo || !feuilleRouteEmailForm.to) {
      alert('Email du client manquant')
      return
    }

    setIsSendingFeuilleRouteEmail(true)
    try {
      // Générer le PDF de la feuille de route
      const pdfData = {
        reference: dossier.reference,
        dossier_reference: dossier.reference,
        client_name: dossier.client_name,
        client_phone: dossier.client_phone,
        type: (voyageInfo.feuille_route_type || (dossier.return_date ? 'aller_retour' : 'aller')) as 'aller' | 'retour' | 'aller_retour',
        aller_date: voyageInfo.aller_date,
        aller_heure: voyageInfo.aller_heure,
        aller_adresse_depart: voyageInfo.aller_adresse_depart,
        aller_adresse_arrivee: voyageInfo.aller_adresse_arrivee,
        aller_passagers: voyageInfo.aller_passagers,
        chauffeur_aller_nom: voyageInfo.chauffeur_aller_nom,
        chauffeur_aller_tel: voyageInfo.chauffeur_aller_tel,
        chauffeur_aller_immatriculation: voyageInfo.chauffeur_aller_immatriculation,
        retour_date: voyageInfo.retour_date,
        retour_heure: voyageInfo.retour_heure,
        retour_adresse_depart: voyageInfo.retour_adresse_depart,
        retour_adresse_arrivee: voyageInfo.retour_adresse_arrivee,
        retour_passagers: voyageInfo.retour_passagers,
        chauffeur_retour_nom: voyageInfo.chauffeur_retour_nom,
        chauffeur_retour_tel: voyageInfo.chauffeur_retour_tel,
        chauffeur_retour_immatriculation: voyageInfo.chauffeur_retour_immatriculation,
        contact_nom: voyageInfo.contact_nom,
        contact_prenom: voyageInfo.contact_prenom,
        contact_tel: voyageInfo.contact_tel,
        commentaires: voyageInfo.commentaires,
        luggage_type: dossier.luggage_type,
      }

      const { base64: pdfBase64, filename: pdfFilename } = await generateFeuilleRoutePDFBase64(pdfData)

      // Mode simulation en développement (localhost)
      const isDevMode = window.location.hostname === 'localhost'

      if (isDevMode) {
        // SIMULATION : afficher les détails dans la console au lieu d'envoyer
        console.log('=== SIMULATION ENVOI FEUILLE DE ROUTE ===')
        console.log('Destinataire:', feuilleRouteEmailForm.to)
        console.log('Sujet:', feuilleRouteEmailForm.subject)
        console.log('Corps:', feuilleRouteEmailForm.body)
        console.log('Pièce jointe:', pdfFilename, '(', Math.round(pdfBase64.length / 1024), 'Ko)')
        console.log('==========================================')

        // Télécharger le PDF pour vérification
        const link = document.createElement('a')
        link.href = `data:application/pdf;base64,${pdfBase64}`
        link.download = pdfFilename
        link.click()

        alert(`[SIMULATION] Feuille de route qui serait envoyée à: ${feuilleRouteEmailForm.to}\nSujet: ${feuilleRouteEmailForm.subject}\n\nLe PDF a été téléchargé pour vérification.`)
      } else {
        // Production : envoyer l'email via l'Edge Function avec le PDF en pièce jointe
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            type: 'custom',
            to: feuilleRouteEmailForm.to,
            subject: feuilleRouteEmailForm.subject,
            html_content: feuilleRouteEmailForm.body.replace(/\n/g, '<br>'),
            data: {
              dossier_id: dossier.id,
            },
            attachments: [
              {
                filename: pdfFilename,
                content: pdfBase64,
                contentType: 'application/pdf',
              }
            ],
          }
        })

        if (emailError) {
          console.error('Erreur envoi email:', emailError)
        }
      }

      // Marquer la feuille de route comme envoyée
      await markFeuilleRouteEnvoyee.mutateAsync(dossier.id)

      // Ajouter à la timeline
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'feuille_route',
        content: `Feuille de route envoyée au client (${feuilleRouteEmailForm.to})`,
      })

      queryClient.invalidateQueries({ queryKey: ['voyage-info', dossier.id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })

      setShowFeuilleRouteEmailModal(false)
      alert('Feuille de route envoyée au client !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi')
    } finally {
      setIsSendingFeuilleRouteEmail(false)
    }
  }

  // Envoyer un devis au client
  const handleSendDevis = async (devisId: string, devisRef: string) => {
    try {
      await updateDevis.mutateAsync({
        id: devisId,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })

      // Mettre à jour le dossier en "attente client"
      await updateDossier.mutateAsync({
        id: dossier.id,
        status: 'pending-client',
      })

      // Compter le nombre de devis envoyés pour ce dossier
      const sentDevisCount = dossierDevis?.filter(d => d.status === 'sent' || d.id === devisId).length || 1

      // Envoyer l'email de notification au client via le template quote_sent
      const clientEmail = dossier.client_email
      if (clientEmail) {
        const lienEspaceClient = `${window.location.origin}/mes-devis?ref=${dossier.reference}&email=${encodeURIComponent(clientEmail)}`

        console.log('Appel send-email avec:', {
          type: 'quote_sent',
          to: clientEmail,
          dossier_id: dossier.id,
        })

        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            type: 'quote_sent',
            to: clientEmail,
            data: {
              client_name: dossier.client_name || 'Client',
              reference: dossier.reference,
              departure: dossier.departure || 'N/A',
              arrival: dossier.arrival || 'N/A',
              departure_date: dossier.departure_date ? new Date(dossier.departure_date).toLocaleDateString('fr-FR') : 'N/A',
              passengers: String(dossier.passengers || 0),
              nb_devis: String(sentDevisCount),
              lien_espace_client: lienEspaceClient,
              dossier_id: dossier.id,
            },
          }
        })

        console.log('Résultat send-email:', { emailData, emailError })

        if (emailError) {
          console.error('Erreur envoi email:', emailError)
          alert(`Email non envoyé: ${emailError.message || JSON.stringify(emailError)}`)
        } else if (emailData && !emailData.success) {
          console.error('Échec envoi email:', emailData)
          alert(`Email non envoyé: ${emailData.error || 'Erreur inconnue'}`)
        }
      }

      // Ajouter à la timeline
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'devis_sent',
        content: `Devis ${devisRef} envoyé au client`,
      })

      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['devis', 'dossier', dossier.id] })

      alert(`Devis ${devisRef} envoyé au client !`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi du devis')
    }
  }

  // Renvoyer un devis déjà envoyé (sans changer le statut)
  const handleResendDevis = async (devisId: string, devisRef: string) => {
    try {
      // Compter le nombre de devis envoyés pour ce dossier
      const sentDevisCount = dossierDevis?.filter(d => d.status === 'sent').length || 1

      // Envoyer l'email de notification au client via le template quote_sent
      const clientEmail = dossier.client_email
      if (!clientEmail) {
        alert('Aucun email client trouvé')
        return
      }

      const lienEspaceClient = `${window.location.origin}/mes-devis?ref=${dossier.reference}&email=${encodeURIComponent(clientEmail)}`

      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'quote_sent',
          to: clientEmail,
          data: {
            client_name: dossier.client_name || 'Client',
            reference: dossier.reference,
            departure: dossier.departure || 'N/A',
            arrival: dossier.arrival || 'N/A',
            departure_date: dossier.departure_date ? new Date(dossier.departure_date).toLocaleDateString('fr-FR') : 'N/A',
            passengers: String(dossier.passengers || 0),
            nb_devis: String(sentDevisCount),
            lien_espace_client: lienEspaceClient,
            dossier_id: dossier.id,
          },
        }
      })

      if (emailError) {
        console.error('Erreur envoi email:', emailError)
        alert('Erreur lors de l\'envoi de l\'email')
        return
      }

      // Ajouter à la timeline
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'devis_sent',
        content: `Devis ${devisRef} renvoyé au client`,
      })

      alert(`Email renvoyé au client !`)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du renvoi du devis')
    }
  }

  // Annuler un devis programmé
  const handleCancelScheduledDevis = async (devisId: string) => {
    if (!confirm('Annuler l\'envoi programmé de ce devis ?')) return

    try {
      await updateDevis.mutateAsync({
        id: devisId,
        status: 'cancelled',
        scheduled_send_at: null,
      })

      // Ajouter à la timeline
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'devis_cancelled',
        content: `Envoi programmé annulé`,
      })

      queryClient.invalidateQueries({ queryKey: ['devis', 'dossier', dossier.id] })
      alert('Envoi programmé annulé')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'annulation')
    }
  }

  // Supprimer un devis (non validé uniquement)
  const handleDeleteDevis = async (devisId: string, devisRef: string) => {
    if (!confirm(`Supprimer définitivement le devis ${devisRef} ?\n\nCette action est irréversible.`)) return

    try {
      await deleteDevis.mutateAsync(devisId)

      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'devis_deleted',
        content: `Devis ${devisRef} supprimé`,
      })

      queryClient.invalidateQueries({ queryKey: ['devis', 'dossier', dossier.id] })
      alert('Devis supprimé')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Désaccepter un devis - même action que "Refuser (non disponible)" dans contrats
  const handleUnacceptDevis = async (devisId: string) => {
    if (!confirm('Annuler l\'acceptation de ce devis ?\n\nCela annulera la proforma et enverra un email au client pour l\'informer de la non-disponibilité.')) return

    try {
      // Remettre le devis en "sent"
      await updateDevis.mutateAsync({
        id: devisId,
        status: 'sent',
        accepted_at: null,
      })

      // Annuler le contrat (garder trace avec status cancelled)
      const { error: contratError } = await supabase
        .from('contrats')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_reason: 'Non disponible - annulé par admin'
        })
        .eq('dossier_id', dossier.id)

      if (contratError) {
        console.error('Erreur annulation contrat:', contratError)
      }

      // Remettre le dossier en quotes_sent pour que le client puisse choisir un autre devis
      await updateDossier.mutateAsync({
        id: dossier.id,
        status: 'quotes_sent',
        contract_signed_at: null,
      })

      // Ajouter à la timeline
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'proforma_cancelled',
        content: 'Proforma annulée - fournisseur non disponible',
      })

      // Ouvrir modal de prévisualisation d'email
      const clientEmail = dossier.client_email || ''
      const dossierRef = dossier.reference
      const subject = `Annulation de votre réservation - ${dossierRef}`
      const body = `Bonjour,

Nous sommes au regret de vous informer que le transporteur initialement sélectionné n'est plus disponible pour votre demande de transport.

Nous vous invitons à vous reconnecter sur votre espace client pour choisir une autre offre parmi celles disponibles.

Lien vers votre espace : ${window.location.origin}/mes-devis?ref=${dossierRef}&email=${encodeURIComponent(clientEmail)}

Nous vous prions de nous excuser pour la gêne occasionnée.

Cordialement,
L'équipe Busmoov`

      openEmailPreview({ to: clientEmail, subject, body })

      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['devis', 'dossier', dossier.id] })
      queryClient.invalidateQueries({ queryKey: ['contrats'] })
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'annulation')
    }
  }

  // Refuser un devis (faute de dispo)
  const handleRefuseDevis = async (devisId: string, reason: string) => {
    try {
      await updateDevis.mutateAsync({
        id: devisId,
        status: 'refused',
      })

      // Ajouter à la timeline
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'devis_refused',
        content: `Devis refusé: ${reason}`,
      })

      // TODO: Envoyer email automatique au client

      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['devis', 'dossier', dossier.id] })
      setShowRefuseModal(false)
      setRefuseDevisId(null)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du refus')
    }
  }

  // Signer le contrat pour le client (quand on reçoit le devis tamponné signé par courrier/email)
  const handleSignerPourClient = async (devisId: string) => {
    if (!confirm('Signer ce contrat pour le client ?\n\nCette action confirme que le client a signé (devis tamponné reçu par email/courrier).')) return

    try {
      const now = new Date().toISOString()

      // Récupérer le devis pour avoir les infos de prix
      const devisToSign = dossierDevis?.find((d: any) => d.id === devisId)
      if (!devisToSign) {
        alert('Devis non trouvé')
        return
      }

      // Mettre à jour le devis en accepté
      await updateDevis.mutateAsync({
        id: devisId,
        status: 'accepted',
        accepted_at: now,
      })

      // Vérifier si un contrat existe déjà
      const { data: existingContrat } = await supabase
        .from('contrats')
        .select('id')
        .eq('dossier_id', dossier.id)
        .single()

      if (existingContrat) {
        // Mettre à jour le contrat existant
        await supabase
          .from('contrats')
          .update({
            signed_at: now,
            status: 'active',
            signed_by_admin: true,
          })
          .eq('id', existingContrat.id)
      } else {
        // Créer le contrat
        const acompteAmount = Math.round((devisToSign.price_ttc || 0) * 0.3 * 100) / 100
        const soldeAmount = (devisToSign.price_ttc || 0) - acompteAmount

        await supabase.from('contrats').insert({
          dossier_id: dossier.id,
          devis_id: devisId,
          price_ht: devisToSign.price_ht,
          price_ttc: devisToSign.price_ttc,
          tva_rate: devisToSign.tva_rate || 10,
          acompte_amount: acompteAmount,
          solde_amount: soldeAmount,
          status: 'active',
          signed_at: now,
          signed_by_admin: true,
        })
      }

      // Mettre à jour le dossier avec contract_signed_at et les prix
      await updateDossier.mutateAsync({
        id: dossier.id,
        status: 'pending-payment',
        contract_signed_at: now,
        price_ht: devisToSign.price_ht,
        price_ttc: devisToSign.price_ttc,
        price_achat: devisToSign.price_achat_ht,
      })

      // Ajouter à la timeline
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'signature',
        content: '✍️ Contrat signé par l\'admin (devis tamponné reçu)',
      })

      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['devis', 'dossier', dossier.id] })
      queryClient.invalidateQueries({ queryKey: ['contrats'] })
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la signature')
    }
  }

  // Admin confirme la dispo et valide définitivement
  const handleAdminConfirm = async (devisId: string) => {
    if (!confirm('Confirmer ce devis ? (disponibilité OK)')) return

    try {
      const now = new Date().toISOString()

      // Récupérer les infos du devis
      const devisToConfirm = dossierDevis.find((d: any) => d.id === devisId)
      if (!devisToConfirm) {
        alert('Devis non trouvé')
        return
      }

      await updateDevis.mutateAsync({
        id: devisId,
        status: 'accepted',
        accepted_at: now,
      })

      // Vérifier si un contrat existe déjà
      const { data: existingContrat } = await supabase
        .from('contrats')
        .select('id')
        .eq('dossier_id', dossier.id)
        .maybeSingle()

      if (!existingContrat) {
        // Créer le contrat automatiquement
        const prixTTC = devisToConfirm.price_ttc || 0
        const acompteAmount = Math.round(prixTTC * 0.3 * 100) / 100
        const soldeAmount = prixTTC - acompteAmount

        // Générer la référence du contrat
        const year = new Date().getFullYear()
        const contratRef = `CTR-${year}-${dossier.reference.split('-').pop()}`

        await supabase.from('contrats').insert({
          dossier_id: dossier.id,
          devis_id: devisId,
          reference: contratRef,
          client_name: dossier.client_name,
          client_email: dossier.client_email,
          price_ht: devisToConfirm.price_ht,
          price_ttc: prixTTC,
          tva_rate: devisToConfirm.tva_rate || 10,
          acompte_amount: acompteAmount,
          solde_amount: soldeAmount,
          status: 'active',
          signed_at: now,
          signed_by_admin: true,
        })
      }

      // Mettre à jour le dossier en attente de paiement
      await updateDossier.mutateAsync({
        id: dossier.id,
        status: 'pending-payment',
        price_ht: devisToConfirm.price_ht,
        price_ttc: devisToConfirm.price_ttc,
        price_achat: devisToConfirm.price_achat_ht,
        transporteur_id: devisToConfirm.transporteur_id,
      })

      // Ajouter à la timeline
      await addTimelineEntry.mutateAsync({
        dossier_id: dossier.id,
        type: 'devis_accepted',
        content: 'Devis confirmé par l\'admin - Contrat et proforma créés',
      })

      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['devis', 'dossier', dossier.id] })
      queryClient.invalidateQueries({ queryKey: ['contrat', 'dossier', dossier.id] })
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la confirmation')
    }
  }

  // Générer lien de paiement
  const generatePaymentLink = () => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/paiement?ref=${encodeURIComponent(dossier.reference)}&email=${encodeURIComponent(dossier.client_email)}`
    navigator.clipboard.writeText(link)
    alert('Lien de paiement copié dans le presse-papiers !')
  }

  // Générer lien infos voyage
  const generateInfosVoyageLink = () => {
    const baseUrl = window.location.origin
    const link = `${baseUrl}/infos-voyage?ref=${encodeURIComponent(dossier.reference)}&email=${encodeURIComponent(dossier.client_email)}`
    navigator.clipboard.writeText(link)
    alert('Lien infos voyage copié dans le presse-papiers !')
  }

  const handleSave = async () => {
    try {
      await updateDossier.mutateAsync({
        id: dossier.id,
        ...formData,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  // === HANDLERS PAIEMENTS & FACTURES ===

  const generateFactureReference = (type: 'acompte' | 'solde' | 'avoir') => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const prefix = type === 'acompte' ? 'FA' : type === 'solde' ? 'FS' : 'AV'
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${year}${month}-${random}`
  }

  const handleAddPaiement = async () => {
    if (!contrat || paiementForm.amount === 0) return

    try {
      const newAmount = paiementForm.type === 'remboursement' ? -Math.abs(paiementForm.amount) : paiementForm.amount

      await createPaiement.mutateAsync({
        contrat_id: contrat.id,
        dossier_id: dossier.id,
        type: paiementForm.type,
        amount: newAmount,
        payment_date: new Date(paiementForm.payment_date).toISOString(),
        reference: paiementForm.reference || undefined,
        notes: paiementForm.notes || undefined,
      })

      // Chercher une facture non payée correspondant au montant pour la marquer comme payée
      if (newAmount > 0 && factures) {
        const factureCorrespondante = factures.find(
          (f: any) => f.status !== 'paid' && f.status !== 'cancelled' && f.type !== 'avoir' && Math.abs(f.amount_ttc - newAmount) < 0.01
        )
        if (factureCorrespondante) {
          await supabase
            .from('factures')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', factureCorrespondante.id)

          queryClient.invalidateQueries({ queryKey: ['factures', 'dossier', dossier.id] })
        }
      }

      // Si un paiement a été reçu et le dossier était en attente de paiement, passer en "en attente de réservation"
      if (newAmount > 0 && dossier.status === 'pending-payment') {
        await updateDossier.mutateAsync({
          id: dossier.id,
          status: 'pending-reservation',
        })
      }

      queryClient.invalidateQueries({ queryKey: ['paiements', 'contrat', contrat.id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })

      setPaiementForm({
        type: 'virement',
        amount: 0,
        payment_date: new Date().toISOString().slice(0, 16),
        reference: '',
        notes: '',
      })
      setShowPaiementModal(false)
    } catch (error) {
      console.error('Error creating paiement:', error)
      alert('Erreur lors de l\'ajout du paiement')
    }
  }

  const handleDeletePaiement = async (paiementId: string) => {
    if (!contrat || !confirm('Supprimer ce paiement ?')) return

    try {
      await deletePaiement.mutateAsync({ id: paiementId, contrat_id: contrat.id })
      queryClient.invalidateQueries({ queryKey: ['paiements', 'contrat', contrat.id] })
    } catch (error) {
      console.error('Error deleting paiement:', error)
    }
  }

  const handleCreateFacture = async () => {
    if (!contrat) return

    try {
      const tvaRate = dossier.tva_rate || 10
      const prixTTC = contrat.price_ttc || 0
      const acompteContrat = contrat.acompte_amount || 0
      const soldeContrat = contrat.solde_amount || (prixTTC - acompteContrat)

      let amountTTC: number
      if (factureForm.useAutoAmount && factureForm.type !== 'avoir') {
        amountTTC = factureForm.type === 'acompte' ? acompteContrat : soldeContrat
      } else {
        amountTTC = factureForm.amount_ttc
      }

      if (amountTTC <= 0) {
        alert('Le montant doit être supérieur à 0')
        return
      }

      const finalAmountTTC = factureForm.type === 'avoir' ? -Math.abs(amountTTC) : amountTTC
      const amountHT = Math.round((finalAmountTTC / (1 + tvaRate / 100)) * 100) / 100
      const amountTVA = Math.round((finalAmountTTC - amountHT) * 100) / 100
      const reference = generateFactureReference(factureForm.type)

      const clientName = factureForm.client_name || dossier.client_name || ''
      const clientAddress = factureForm.client_address || dossier.billing_address || ''
      const clientZip = factureForm.client_zip || dossier.billing_zip || ''
      const clientCity = factureForm.client_city || dossier.billing_city || ''

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (createFacture as any).mutateAsync({
        dossier_id: dossier.id,
        contrat_id: contrat.id,
        type: factureForm.type,
        reference,
        amount_ht: amountHT,
        amount_ttc: finalAmountTTC,
        amount_tva: amountTVA,
        tva_rate: tvaRate,
        status: 'generated',
        client_name: clientName,
        client_address: clientAddress,
        client_zip: clientZip,
        client_city: clientCity,
      })

      queryClient.invalidateQueries({ queryKey: ['factures', 'dossier', dossier.id] })

      setFactureForm({
        type: 'acompte',
        amount_ttc: 0,
        useAutoAmount: true,
        client_name: '',
        client_address: '',
        client_zip: '',
        client_city: '',
      })
      setShowFactureModal(false)

      alert(`${factureForm.type === 'avoir' ? 'Avoir' : 'Facture'} ${reference} généré(e) avec succès !`)
    } catch (error) {
      console.error('Error creating facture:', error)
      alert('Erreur lors de la création de la facture')
    }
  }

  // Ouvrir la modal pour générer un avoir
  const openAvoirModal = (facture: any) => {
    setSelectedFactureForAvoir(facture)
    setAvoirForm({
      type: 'total',
      amount: facture.amount_ttc || 0,
      motif: '',
      impactDossier: false,
    })
    setShowAvoirModal(true)
  }

  // Générer un avoir
  const handleCreateAvoir = async () => {
    if (!selectedFactureForAvoir || !contrat) return

    setCreatingAvoir(true)
    try {
      // Calculer les montants de l'avoir
      const tvaRate = selectedFactureForAvoir.tva_rate || 10
      let montantTTC: number
      let montantHT: number
      let montantTVA: number

      if (avoirForm.type === 'total') {
        // Avoir total : reprendre les montants de la facture origine
        montantTTC = selectedFactureForAvoir.amount_ttc
        montantHT = selectedFactureForAvoir.amount_ht
        montantTVA = selectedFactureForAvoir.amount_tva || (montantTTC - montantHT)
      } else {
        // Avoir partiel : calculer à partir du montant TTC saisi
        montantTTC = avoirForm.amount
        montantHT = montantTTC / (1 + tvaRate / 100)
        montantTVA = montantTTC - montantHT
      }

      // Générer la référence de l'avoir
      const avoirNumber = (factures?.filter((f: any) => f.type === 'avoir').length || 0) + 1
      const avoirReference = `AV-${dossier.reference}-${String(avoirNumber).padStart(2, '0')}`

      // Créer l'avoir (montants négatifs)
      const { error } = await supabase.from('factures').insert({
        dossier_id: dossier.id,
        contrat_id: contrat.id,
        reference: avoirReference,
        type: 'avoir',
        amount_ht: -Math.abs(montantHT),
        amount_ttc: -Math.abs(montantTTC),
        amount_tva: -Math.abs(montantTVA),
        tva_rate: tvaRate,
        status: 'generated',
      })

      if (error) throw error

      // Si avoir total, marquer la facture d'origine comme annulée
      if (avoirForm.type === 'total') {
        await supabase
          .from('factures')
          .update({ status: 'cancelled' })
          .eq('id', selectedFactureForAvoir.id)
      }

      // Si l'avoir impacte le dossier (remise commerciale), mettre à jour les prix du dossier
      if (avoirForm.impactDossier) {
        const nouveauPriceTTC = (dossier.price_ttc || 0) - montantTTC
        const nouveauPriceHT = (dossier.price_ht || 0) - montantHT

        await updateDossier.mutateAsync({
          id: dossier.id,
          price_ttc: Math.max(0, nouveauPriceTTC),
          price_ht: Math.max(0, nouveauPriceHT),
        })

        // Ajouter à la timeline avec mention de l'impact sur le dossier
        await addTimelineEntry.mutateAsync({
          dossier_id: dossier.id,
          type: 'facture',
          content: `Avoir ${avoirReference} généré (${montantTTC.toFixed(2)}€ TTC) sur facture ${selectedFactureForAvoir.reference} - Remise commerciale appliquée au dossier${avoirForm.motif ? ` - ${avoirForm.motif}` : ''}`,
        })
      } else {
        // Ajouter à la timeline sans impact dossier
        await addTimelineEntry.mutateAsync({
          dossier_id: dossier.id,
          type: 'facture',
          content: `Avoir ${avoirReference} généré (${montantTTC.toFixed(2)}€ TTC) sur facture ${selectedFactureForAvoir.reference}${avoirForm.motif ? ` - ${avoirForm.motif}` : ''}`,
        })
      }

      queryClient.invalidateQueries({ queryKey: ['factures', 'dossier', dossier.id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      setShowAvoirModal(false)

      if (avoirForm.impactDossier) {
        alert(`Avoir ${avoirReference} créé avec succès !\nLe prix de vente du dossier a été mis à jour.`)
      } else {
        alert(`Avoir ${avoirReference} créé avec succès !`)
      }
    } catch (error) {
      console.error('Error creating avoir:', error)
      alert('Erreur lors de la création de l\'avoir')
    } finally {
      setCreatingAvoir(false)
    }
  }

  const openMarkFacturePaidModal = (facture: any) => {
    setSelectedFactureForPaid(facture)
    setMarkPaidForm({
      type: 'virement',
      payment_date: new Date().toISOString().slice(0, 10),
      reference: '',
      notes: '',
    })
    setShowMarkFacturePaidModal(true)
  }

  const handleMarkFacturePaid = async () => {
    if (!selectedFactureForPaid || !contrat) return

    try {
      // 1. Créer le paiement
      await createPaiement.mutateAsync({
        contrat_id: contrat.id,
        dossier_id: dossier.id,
        type: markPaidForm.type,
        amount: selectedFactureForPaid.amount_ttc,
        payment_date: new Date(markPaidForm.payment_date).toISOString(),
        reference: markPaidForm.reference || undefined,
        notes: markPaidForm.notes || `Paiement facture ${selectedFactureForPaid.reference}`,
      })

      // 2. Marquer la facture comme payée
      await supabase
        .from('factures')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', selectedFactureForPaid.id)

      // 3. Si le dossier était en attente de paiement, le passer en attente de réservation
      if (dossier.status === 'pending-payment') {
        await updateDossier.mutateAsync({
          id: dossier.id,
          status: 'pending-reservation',
        })
      }

      queryClient.invalidateQueries({ queryKey: ['factures', 'dossier', dossier.id] })
      queryClient.invalidateQueries({ queryKey: ['paiements', 'contrat', contrat.id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })

      setShowMarkFacturePaidModal(false)
      setSelectedFactureForPaid(null)
    } catch (error) {
      console.error('Error marking facture as paid:', error)
      alert('Erreur lors de l\'enregistrement du paiement')
    }
  }

  const statusOptions = [
    { value: 'new', label: 'Nouveau' },
    { value: 'quotes_pending', label: 'Devis en attente' },
    { value: 'quotes_received', label: 'Devis reçus' },
    { value: 'quote_accepted', label: 'Devis accepté' },
    { value: 'pending-payment', label: 'Att. paiement' },
    { value: 'pending-reservation', label: 'Att. réservation' },
    { value: 'bpa-received', label: 'BPA reçu' },
    { value: 'pending-info', label: 'Att. infos' },
    { value: 'pending-info-received', label: 'Info VO reçue' },
    { value: 'pending-info-confirm', label: 'Att. confirm client' },
    { value: 'pending-driver', label: 'Att. chauffeur' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
  ]

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-display text-xl font-bold text-purple-dark">
                Dossier #{dossier.reference}
              </h1>
              <p className="text-sm text-gray-500">{dossier.client_name}</p>
            </div>
            <div className="flex items-center gap-1">
              <StatusBadge status={dossier.status || 'new'} />
              {dossier.requires_manual_review && (
                <span title={dossier.manual_review_reason || 'Révision manuelle requise'} className="text-amber-500 cursor-help">
                  ⭐
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-success"
                  disabled={updateDossier.isPending}
                >
                  <Save size={16} />
                  {updateDossier.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </>
            ) : (
              <>
                {/* Lien paiement uniquement si un devis est accepté */}
                {dossierDevis.some(d => d.status === 'accepted') && (
                  <button
                    onClick={generatePaymentLink}
                    className="btn btn-secondary"
                    title="Copier le lien de paiement"
                  >
                    <Link2 size={16} />
                    Lien paiement
                  </button>
                )}
                {/* Lien infos voyage */}
                <button
                  onClick={generateInfosVoyageLink}
                  className="btn btn-secondary"
                  title="Copier le lien pour saisir les infos voyage"
                >
                  <MapPin size={16} />
                  Lien infos voyage
                </button>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="btn btn-secondary"
                >
                  <Mail size={16} />
                  Email
                </button>
                {/* Bouton Offre Flash - visible si des devis sont envoyés mais pas encore acceptés */}
                {dossierDevis.some((d: any) => d.status === 'sent') && !dossierDevis.some((d: any) => d.status === 'accepted') && (
                  <button
                    onClick={() => setShowOffreFlashModalDetail(true)}
                    className="btn bg-gradient-to-r from-magenta to-purple text-white hover:opacity-90"
                    title="Envoyer une offre flash avec réduction"
                  >
                    <Zap size={16} />
                    Offre Flash
                  </button>
                )}
                <button
                  onClick={() => setShowRappelModal(true)}
                  className="btn btn-secondary relative"
                  title="Ajouter un rappel"
                >
                  <Bell size={16} />
                  Rappel
                  {rappelsDossier.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-bold bg-orange-500 text-white rounded-full flex items-center justify-center">
                      {rappelsDossier.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setShowNewDevisModal(true)}
                  className="btn btn-success"
                >
                  <Plus size={16} />
                  Nouveau devis
                </button>
                <button
                  onClick={() => setShowDemandeFournisseurModal(true)}
                  className="btn btn-outline"
                >
                  <Truck size={16} />
                  Demande fournisseur
                </button>
                <button
                  onClick={handleToggleAutoDevis}
                  className={cn(
                    'btn',
                    autoDevisStatus?.is_active
                      ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                  disabled={activateAutoDevis.isPending || deactivateAutoDevis.isPending}
                  title={autoDevisStatus?.is_active ? 'Désactiver l\'envoi automatique de devis' : 'Activer l\'envoi automatique de devis'}
                >
                  <Zap size={16} />
                  {autoDevisStatus?.is_active ? 'Auto-devis ON' : 'Auto-devis OFF'}
                </button>

                {/* Bouton abandon (la clôture se fait automatiquement après transfert) */}
                {dossier.status !== 'completed' && dossier.status !== 'cancelled' && (
                  <button
                    onClick={async () => {
                      await updateDossier.mutateAsync({ id: dossier.id, status: 'cancelled' })
                      await addTimelineEntry.mutateAsync({
                        dossier_id: dossier.id,
                        type: 'status_change',
                        content: '❌ Dossier abandonné',
                      })
                      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
                      // Retourner à la liste des dossiers
                      onClose()
                    }}
                    className="btn bg-red-100 text-red-700 hover:bg-red-200"
                    title="Marquer comme abandonné"
                  >
                    <XCircle size={16} />
                    Abandonner
                  </button>
                )}

                {/* Bouton réouvrir pour les dossiers abandonnés (si date de départ pas passée) */}
                {dossier.status === 'cancelled' && dossier.departure_date && new Date(dossier.departure_date) > new Date() && (
                  <button
                    onClick={async () => {
                      await updateDossier.mutateAsync({ id: dossier.id, status: 'new' })
                      await addTimelineEntry.mutateAsync({
                        dossier_id: dossier.id,
                        type: 'status_change',
                        content: '🔄 Dossier réouvert',
                      })
                      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
                    }}
                    className="btn bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    title="Réouvrir le dossier"
                  >
                    <RotateCcw size={16} />
                    Réouvrir
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Info Client */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
            <Users size={20} className="text-magenta" />
            Informations client
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Demandeur</label>
              {isEditing ? (
                <input
                  type="text"
                  className="input"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                />
              ) : (
                <p className="font-medium">{dossier.client_name}</p>
              )}
            </div>
            {dossier.signer_name && dossier.signer_name !== dossier.client_name && (
              <div>
                <label className="label">Signataire</label>
                <p className="font-medium text-purple">{dossier.signer_name}</p>
              </div>
            )}
            <div>
              <label className="label">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  className="input"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                />
              ) : (
                <p className="font-medium flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  {dossier.client_email}
                </p>
              )}
            </div>
            <div>
              <label className="label">Téléphone</label>
              {isEditing ? (
                <input
                  type="tel"
                  className="input"
                  value={formData.client_phone}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                />
              ) : (
                <p className="font-medium flex items-center gap-2">
                  <Phone size={14} className="text-gray-400" />
                  {dossier.client_phone || '-'}
                </p>
              )}
            </div>
            <div>
              <label className="label">Société</label>
              {isEditing ? (
                <input
                  type="text"
                  className="input"
                  value={formData.client_company}
                  onChange={(e) => setFormData({ ...formData, client_company: e.target.value })}
                />
              ) : (
                <p className="font-medium flex items-center gap-2">
                  <Building size={14} className="text-gray-400" />
                  {dossier.client_company || '-'}
                </p>
              )}
            </div>
          </div>

          {/* Adresse de facturation */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">Adresse de facturation (optionnel)</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="label">Adresse</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="input"
                    placeholder="123 rue de Paris"
                    value={formData.billing_address}
                    onChange={(e) => setFormData({ ...formData, billing_address: e.target.value })}
                  />
                ) : (
                  <p className="font-medium">{dossier.billing_address || '-'}</p>
                )}
              </div>
              <div>
                <label className="label">Code postal</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="input"
                    placeholder="75001"
                    value={formData.billing_zip}
                    onChange={(e) => setFormData({ ...formData, billing_zip: e.target.value })}
                  />
                ) : (
                  <p className="font-medium">{dossier.billing_zip || '-'}</p>
                )}
              </div>
              <div>
                <label className="label">Ville</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="input"
                    placeholder="Paris"
                    value={formData.billing_city}
                    onChange={(e) => setFormData({ ...formData, billing_city: e.target.value })}
                  />
                ) : (
                  <p className="font-medium">{dossier.billing_city || '-'}</p>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="label">Pays</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="input"
                    placeholder="France"
                    value={formData.billing_country}
                    onChange={(e) => setFormData({ ...formData, billing_country: e.target.value })}
                  />
                ) : (
                  <p className="font-medium">{dossier.billing_country || 'France'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Contrat & Finances - visible si contrat existe */}
        {contrat && (
          <div className="card overflow-hidden">
            {/* Onglets */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setFinanceTab('contrat')}
                className={cn(
                  "flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  financeTab === 'contrat'
                    ? "text-purple-dark border-b-2 border-magenta bg-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                <FileText size={16} />
                Contrat
                {contrat.signed_at && (
                  <span className="ml-1 w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </button>
              <button
                onClick={() => setFinanceTab('paiements')}
                className={cn(
                  "flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  financeTab === 'paiements'
                    ? "text-purple-dark border-b-2 border-magenta bg-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                <Euro size={16} />
                Paiements
                {paiements.length > 0 && (
                  <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">{paiements.length}</span>
                )}
              </button>
              <button
                onClick={() => setFinanceTab('factures')}
                className={cn(
                  "flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  financeTab === 'factures'
                    ? "text-purple-dark border-b-2 border-magenta bg-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                <Receipt size={16} />
                Factures
                {factures.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{factures.length}</span>
                )}
              </button>
              <button
                onClick={() => setFinanceTab('voyage')}
                className={cn(
                  "flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  financeTab === 'voyage'
                    ? "text-purple-dark border-b-2 border-magenta bg-white"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                <MapPin size={16} />
                Voyage
                {voyageInfo?.validated_at && (
                  <span className="ml-1 w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </button>
            </div>

            {/* Contenu des onglets */}
            <div className="p-6">
              {/* Onglet Contrat */}
              {financeTab === 'contrat' && (
                <div className="space-y-6">
                  {/* En-tête avec référence et statut */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-dark">{contrat.reference}</h3>
                      <p className="text-sm text-gray-500">Créé le {formatDate(contrat.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const devisAccepte = dossierDevis.find((d: any) => d.status === 'accepted')
                          // Calculer la durée en jours pour les circuits/MAD
                          const dureeJoursContrat = dossier.departure_date && dossier.return_date
                            ? Math.ceil((new Date(dossier.return_date).getTime() - new Date(dossier.departure_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
                            : 1

                          // Récupérer les options du devis accepté
                          const optionsDetails = (devisAccepte as any)?.options_details || {}
                          const nbChauffeurs = devisAccepte?.nombre_chauffeurs || 1
                          const nbRepas = dureeJoursContrat * 2 // 2 repas par jour
                          const nbNuits = Math.max(0, dureeJoursContrat - 1)

                          // Construire les lignes d'options à partir du prix du dossier vs prix du devis
                          const basePriceTTC = devisAccepte?.price_ttc || 0
                          const totalPriceTTC = dossier.price_ttc || contrat.price_ttc || basePriceTTC
                          const optionsTotal = totalPriceTTC - basePriceTTC

                          // Si le prix total est supérieur au prix de base, des options ont été ajoutées
                          const optionsLignes: { label: string; montant: number }[] = []
                          if (optionsTotal > 0 && optionsDetails) {
                            // Reconstituer les options sélectionnées
                            if (optionsDetails.peages?.status === 'non_inclus' && optionsDetails.peages.montant) {
                              optionsLignes.push({ label: 'Péages', montant: optionsDetails.peages.montant })
                            }
                            if (optionsDetails.repas_chauffeur?.status === 'non_inclus' && optionsDetails.repas_chauffeur.montant) {
                              const montant = optionsDetails.repas_chauffeur.montant * nbRepas * nbChauffeurs
                              optionsLignes.push({ label: `Repas chauffeur (${nbRepas} repas × ${nbChauffeurs} chauff.)`, montant })
                            }
                            if (optionsDetails.parking?.status === 'non_inclus' && optionsDetails.parking.montant) {
                              optionsLignes.push({ label: 'Parking', montant: optionsDetails.parking.montant })
                            }
                            if (optionsDetails.hebergement?.status === 'non_inclus' && optionsDetails.hebergement.montant) {
                              const montant = optionsDetails.hebergement.montant * nbNuits * nbChauffeurs
                              optionsLignes.push({ label: `Hébergement (${nbNuits} nuits × ${nbChauffeurs} chauff.)`, montant })
                            }
                          }

                          generateContratPDF({
                            reference: contrat.reference,
                            client_name: contrat.client_name || dossier.client_name,
                            client_email: contrat.client_email || dossier.client_email,
                            client_phone: dossier.client_phone || '',
                            client_company: dossier.client_company || '',
                            billing_address: dossier.billing_address || '',
                            billing_zip: dossier.billing_zip || '',
                            billing_city: dossier.billing_city || '',
                            price_ht: contrat.price_ttc ? Math.round(contrat.price_ttc / 1.1) : 0,
                            price_ttc: contrat.price_ttc || 0,
                            base_price_ttc: basePriceTTC,
                            options_lignes: optionsLignes.length > 0 ? optionsLignes : undefined,
                            tva_rate: devisAccepte?.tva_rate || 10,
                            acompte_amount: contrat.acompte_amount || 0,
                            solde_amount: contrat.solde_amount || 0,
                            signed_at: contrat.signed_at || undefined,
                            nombre_cars: devisAccepte?.nombre_cars || 1,
                            nombre_chauffeurs: nbChauffeurs,
                            service_type: (devisAccepte as any)?.service_type || dossier.trip_mode || undefined,
                            duree_jours: dureeJoursContrat > 1 ? dureeJoursContrat : undefined,
                            detail_mad: (devisAccepte as any)?.detail_mad || undefined,
                            paiements: paiements.map(p => ({
                              type: p.type,
                              amount: p.amount,
                              payment_date: p.payment_date,
                              reference: p.reference,
                            })),
                            dossier: {
                              reference: dossier.reference,
                              client_name: dossier.client_name,
                              client_company: dossier.client_company,
                              client_email: dossier.client_email,
                              client_phone: dossier.client_phone,
                              departure: dossier.departure,
                              arrival: dossier.arrival,
                              departure_date: dossier.departure_date,
                              departure_time: dossier.departure_time || undefined,
                              return_date: dossier.return_date || undefined,
                              return_time: dossier.return_time || undefined,
                              passengers: dossier.passengers,
                              vehicle_type: dossier.vehicle_type || 'autocar',
                              trip_mode: dossier.trip_mode || undefined,
                            },
                          })
                        }}
                        className="btn btn-secondary text-sm flex items-center gap-2"
                      >
                        <Download size={16} />
                        Télécharger Proforma
                      </button>
                      {contrat.signed_at ? (
                        <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700">
                          ✓ Signé
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-700">
                          En attente signature
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Grille d'infos */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-purple-50 to-magenta-50 rounded-xl p-4 border border-purple-100">
                      <label className="label text-xs text-gray-500">Prix TTC</label>
                      <p className="text-2xl font-bold text-purple-dark">{formatPrice(contrat.price_ttc)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <label className="label text-xs text-gray-500">Acompte (30%)</label>
                      <p className="text-xl font-semibold text-gray-700">{formatPrice(contrat.acompte_amount || 0)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <label className="label text-xs text-gray-500">Solde</label>
                      <p className="text-xl font-semibold text-gray-700">{formatPrice(contrat.solde_amount || ((contrat.price_ttc || 0) - (contrat.acompte_amount || 0)))}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <label className="label text-xs text-gray-500">Reste à payer</label>
                      <p className={cn(
                        "text-xl font-semibold",
                        resteAPayer > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {formatPrice(resteAPayer)}
                      </p>
                    </div>
                  </div>

                  {/* Signature du contrat */}
                  {contrat.signed_at && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <CheckCircle size={18} />
                        Signature électronique
                      </h4>
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <label className="label text-xs text-green-600">Signataire</label>
                          <p className="font-medium text-gray-800">{contrat.client_name || dossier.client_name}</p>
                        </div>
                        <div>
                          <label className="label text-xs text-green-600">Date de signature</label>
                          <p className="font-medium text-gray-800">{formatDate(contrat.signed_at)}</p>
                        </div>
                        <div>
                          <label className="label text-xs text-green-600">Adresse IP</label>
                          <p className="font-mono text-gray-800">{contrat.client_ip || '-'}</p>
                        </div>
                        <div>
                          <label className="label text-xs text-green-600">Navigateur</label>
                          <p className="text-gray-800 truncate" title={contrat.user_agent || ''}>
                            {contrat.user_agent ? contrat.user_agent.slice(0, 50) + '...' : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-200 flex items-center gap-4 text-xs">
                        {contrat.signed_by_client && (
                          <span className="flex items-center gap-1 text-green-700">
                            <CheckCircle size={12} /> Signé par le client
                          </span>
                        )}
                        {contrat.signed_by_admin && (
                          <span className="flex items-center gap-1 text-green-700">
                            <CheckCircle size={12} /> Signé par l'admin
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Devis associé */}
                  {(contrat as any).devis && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                        <FileText size={18} />
                        Devis associé
                      </h4>
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <label className="label text-xs text-blue-600">Référence</label>
                          <p className="font-medium text-gray-800">{(contrat as any).devis.reference}</p>
                        </div>
                        <div>
                          <label className="label text-xs text-blue-600">Transporteur</label>
                          <p className="font-medium text-gray-800">
                            {(contrat as any).devis.transporteur?.name || '-'}
                          </p>
                        </div>
                        <div>
                          <label className="label text-xs text-blue-600">Prix d'achat HT</label>
                          <p className="font-medium text-gray-800">{formatPrice((contrat as any).devis.price_achat_ht || 0)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Annulation si applicable */}
                  {contrat.cancelled_at && (
                    <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <AlertCircle size={18} />
                        Contrat annulé
                      </h4>
                      <p className="text-sm text-red-700">
                        Annulé le {formatDate(contrat.cancelled_at)}
                        {contrat.cancelled_reason && ` - Motif: ${contrat.cancelled_reason}`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Paiements */}
              {financeTab === 'paiements' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-purple-dark flex items-center gap-2">
                      <Euro size={18} />
                      Paiements reçus
                    </h3>
                    <button
                      onClick={() => setShowPaiementModal(true)}
                      className="btn btn-primary text-sm"
                    >
                      <Plus size={16} />
                      Ajouter un paiement
                    </button>
                  </div>

                  {/* Résumé paiements */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                    <div>
                      <label className="label text-xs">Total reçu</label>
                      <p className={cn(
                        "text-2xl font-bold",
                        totalPaiements > 0 ? "text-green-600" : "text-gray-400"
                      )}>
                        {formatPrice(totalPaiements)}
                      </p>
                    </div>
                    <div>
                      <label className="label text-xs">Reste à payer</label>
                      <p className={cn(
                        "text-2xl font-bold",
                        resteAPayer > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {formatPrice(resteAPayer)}
                      </p>
                    </div>
                    <div>
                      <label className="label text-xs">Progression</label>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-magenta to-purple h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (totalPaiements / (contrat.price_ttc || 1)) * 100)}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-1 font-medium">
                          {Math.round((totalPaiements / (contrat.price_ttc || 1)) * 100)}% payé
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Liste des paiements */}
                  {paiementsLoading ? (
                    <p className="text-center text-gray-500 py-8">Chargement...</p>
                  ) : paiements.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <Euro size={40} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">Aucun paiement enregistré</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {paiements.map((paiement) => (
                        <div
                          key={paiement.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            paiement.amount < 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold",
                              paiement.type === 'virement' && "bg-blue-500",
                              paiement.type === 'cb' && "bg-purple",
                              paiement.type === 'especes' && "bg-green-500",
                              paiement.type === 'cheque' && "bg-amber-500",
                              paiement.type === 'remboursement' && "bg-red-500",
                            )}>
                              {paiement.type === 'virement' && 'VIR'}
                              {paiement.type === 'cb' && 'CB'}
                              {paiement.type === 'especes' && 'ESP'}
                              {paiement.type === 'cheque' && 'CHQ'}
                              {paiement.type === 'remboursement' && 'RMB'}
                            </div>
                            <div>
                              <p className="font-medium">
                                {paiement.type === 'virement' && 'Virement bancaire'}
                                {paiement.type === 'cb' && 'Carte bancaire'}
                                {paiement.type === 'especes' && 'Espèces'}
                                {paiement.type === 'cheque' && 'Chèque'}
                                {paiement.type === 'remboursement' && 'Remboursement'}
                              </p>
                              <p className="text-sm text-gray-500">{formatDate(paiement.payment_date)}</p>
                              {paiement.reference && (
                                <p className="text-xs text-gray-400">Réf: {paiement.reference}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className={cn(
                              "text-lg font-bold",
                              paiement.amount < 0 ? "text-red-600" : "text-green-600"
                            )}>
                              {paiement.amount < 0 ? '-' : '+'}{formatPrice(Math.abs(paiement.amount))}
                            </p>
                            <button
                              onClick={() => handleDeletePaiement(paiement.id)}
                              className="p-2 rounded hover:bg-red-100 text-red-500"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Séparateur */}
                  <div className="border-t border-gray-200 my-6" />

                  {/* Section Paiements Fournisseurs */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-orange-600 flex items-center gap-2">
                        <Truck size={18} />
                        Paiements Fournisseur
                      </h3>
                      <button
                        onClick={() => {
                          setPaiementFournisseurForm({
                            amount: resteAPayerFournisseur > 0 ? resteAPayerFournisseur : 0,
                            payment_date: new Date().toISOString().slice(0, 10),
                            type: 'virement',
                            reference: '',
                            notes: '',
                          })
                          setShowPaiementFournisseurModal(true)
                        }}
                        className="btn bg-orange-500 hover:bg-orange-600 text-white text-sm"
                        disabled={!dossier.transporteur_id}
                      >
                        <Plus size={16} />
                        Payer fournisseur
                      </button>
                    </div>

                    {/* Résumé paiements fournisseur */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-orange-50 rounded-xl">
                      <div>
                        <label className="label text-xs">Total payé</label>
                        <p className={cn(
                          "text-2xl font-bold",
                          totalPaiementsFournisseur > 0 ? "text-orange-600" : "text-gray-400"
                        )}>
                          {formatPrice(totalPaiementsFournisseur)}
                        </p>
                      </div>
                      <div>
                        <label className="label text-xs">Reste à payer</label>
                        <p className={cn(
                          "text-2xl font-bold",
                          resteAPayerFournisseur > 0 ? "text-red-600" : "text-green-600"
                        )}>
                          {formatPrice(resteAPayerFournisseur)}
                        </p>
                      </div>
                      <div>
                        <label className="label text-xs">Prix achat HT</label>
                        <p className="text-xl font-bold text-gray-600">
                          {formatPrice((() => {
                            // Chercher le devis accepté pour récupérer le prix HT
                            const devisAccepte = (dossier.devis || []).find((d: any) => d.status === 'accepted')
                            if (devisAccepte?.price_achat_ht) return devisAccepte.price_achat_ht
                            // Fallback: calculer HT depuis TTC
                            const tva = dossier.tva_rate || 10
                            return dossier.price_achat ? Math.round(dossier.price_achat / (1 + tva / 100)) : 0
                          })())}
                        </p>
                      </div>
                      <div>
                        <label className="label text-xs">Prix achat TTC</label>
                        <p className="text-xl font-bold text-gray-600">
                          {formatPrice((() => {
                            // Chercher le devis accepté pour récupérer le prix TTC
                            const devisAccepte = (dossier.devis || []).find((d: any) => d.status === 'accepted')
                            return devisAccepte?.price_achat_ttc || dossier.price_achat || 0
                          })())}
                        </p>
                      </div>
                    </div>

                    {/* Facture fournisseur reçue */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-gray-500" />
                        <span className="font-medium">Facture fournisseur</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {(dossier as any).facture_fournisseur_reference && (
                          <span className="text-sm text-gray-500">
                            Réf: {(dossier as any).facture_fournisseur_reference}
                          </span>
                        )}
                        <button
                          onClick={async () => {
                            const currentlyReceived = (dossier as any).facture_fournisseur_recue

                            // Si on veut repasser en "non reçue", demander confirmation
                            if (currentlyReceived) {
                              const confirmed = confirm('Repasser la facture en "Non reçue" ?')
                              if (!confirmed) return

                              try {
                                await updateDossier.mutateAsync({
                                  id: dossier.id,
                                  facture_fournisseur_recue: false,
                                  facture_fournisseur_recue_at: null,
                                  // On garde la référence au cas où
                                } as any)
                              } catch (error) {
                                console.error('Erreur:', error)
                              }
                              return
                            }

                            // Sinon on marque comme reçue
                            let reference = (dossier as any).facture_fournisseur_reference || ''
                            const input = prompt('Référence de la facture fournisseur (optionnel):')
                            if (input !== null) reference = input

                            try {
                              await updateDossier.mutateAsync({
                                id: dossier.id,
                                facture_fournisseur_recue: true,
                                facture_fournisseur_recue_at: new Date().toISOString(),
                                facture_fournisseur_reference: reference || null,
                              } as any)
                            } catch (error) {
                              console.error('Erreur:', error)
                            }
                          }}
                          title={(dossier as any).facture_fournisseur_recue ? "Cliquer pour repasser en non reçue" : "Cliquer pour marquer comme reçue"}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors",
                            (dossier as any).facture_fournisseur_recue
                              ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                              : "bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700"
                          )}
                        >
                          {(dossier as any).facture_fournisseur_recue ? (
                            <>
                              <Check size={14} />
                              Reçue
                            </>
                          ) : (
                            <>
                              <X size={14} />
                              Non reçue
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Info transporteur avec statut BPA */}
                    {dossier.transporteur && (() => {
                      // Trouver la demande fournisseur pour ce transporteur
                      const demandeFournisseur = demandesFournisseurs.find(
                        (df: any) => df.transporteur_id === dossier.transporteur_id
                      )
                      const bpaStatus = demandeFournisseur?.status || 'pending'
                      const hasBpa = bpaStatus === 'bpa_received' || demandeFournisseur?.bpa_received_at

                      return (
                        <div className={cn(
                          "flex items-center justify-between p-3 rounded-lg border-2",
                          hasBpa
                            ? "bg-green-50 border-green-300"
                            : bpaStatus === 'validated' || bpaStatus === 'devis_created'
                              ? "bg-amber-50 border-amber-300"
                              : "bg-gray-50 border-gray-200"
                        )}>
                          <div className="flex items-center gap-3">
                            <span className="bg-purple text-white text-xs font-bold px-2 py-1 rounded">
                              {dossier.transporteur.number}
                            </span>
                            <span className="font-medium">{dossier.transporteur.name}</span>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold",
                            hasBpa
                              ? "bg-green-500 text-white"
                              : bpaStatus === 'validated'
                                ? "bg-blue-500 text-white"
                                : bpaStatus === 'devis_created'
                                  ? "bg-amber-500 text-white"
                                  : "bg-gray-400 text-white"
                          )}>
                            {hasBpa
                              ? "✓ BPA REÇU"
                              : bpaStatus === 'validated'
                                ? "VALIDÉ - Att. BPA"
                                : bpaStatus === 'devis_created'
                                  ? "DEVIS CRÉÉ"
                                  : "EN ATTENTE"}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Liste des paiements fournisseur */}
                    {paiementsFournisseurLoading ? (
                      <p className="text-center text-gray-500 py-8">Chargement...</p>
                    ) : paiementsFournisseur.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl">
                        <Truck size={32} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-gray-500 text-sm">Aucun paiement fournisseur enregistré</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {paiementsFournisseur.map((paiement: any) => (
                          <div
                            key={paiement.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-white border-orange-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold",
                                paiement.type === 'virement' && "bg-blue-500",
                                paiement.type === 'cb' && "bg-purple",
                                paiement.type === 'especes' && "bg-green-500",
                                paiement.type === 'cheque' && "bg-amber-500",
                              )}>
                                {paiement.type === 'virement' && 'VIR'}
                                {paiement.type === 'cb' && 'CB'}
                                {paiement.type === 'especes' && 'ESP'}
                                {paiement.type === 'cheque' && 'CHQ'}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {paiement.type === 'virement' && 'Virement bancaire'}
                                  {paiement.type === 'cb' && 'Carte bancaire'}
                                  {paiement.type === 'especes' && 'Espèces'}
                                  {paiement.type === 'cheque' && 'Chèque'}
                                </p>
                                <p className="text-sm text-gray-500">{formatDate(paiement.payment_date)}</p>
                                {paiement.reference && (
                                  <p className="text-xs text-gray-400">Réf: {paiement.reference}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-lg font-bold text-orange-600">
                                -{formatPrice(paiement.amount)}
                              </p>
                              <button
                                onClick={async () => {
                                  if (!confirm('Supprimer ce paiement ?')) return
                                  try {
                                    await deletePaiementFournisseur.mutateAsync(paiement.id)
                                  } catch (error) {
                                    console.error('Erreur:', error)
                                    alert('Erreur lors de la suppression')
                                  }
                                }}
                                className="p-2 rounded hover:bg-red-100 text-red-500"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Onglet Factures */}
              {financeTab === 'factures' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-purple-dark flex items-center gap-2">
                      <Receipt size={18} />
                      Factures
                    </h3>
                    <button
                      onClick={() => {
                        const acompte = contrat.acompte_amount || 0
                        const solde = contrat.solde_amount || ((contrat.price_ttc || 0) - acompte)
                        const hasAcompteFacture = factures.some(f => f.type === 'acompte')
                        setFactureForm({
                          type: hasAcompteFacture ? 'solde' : 'acompte',
                          amount_ttc: hasAcompteFacture ? solde : acompte,
                          useAutoAmount: true,
                          client_name: dossier.client_name || '',
                          client_address: dossier.billing_address || '',
                          client_zip: dossier.billing_zip || '',
                          client_city: dossier.billing_city || '',
                        })
                        setShowFactureModal(true)
                      }}
                      className="btn btn-primary text-sm"
                    >
                      <Plus size={16} />
                      Générer une facture
                    </button>
                  </div>

                  {/* Montants facturés */}
                  {(() => {
                    // Montant facturé = factures valides (non annulées, non avoirs)
                    const montantFacture = factures
                      .filter((f: any) => f.type !== 'avoir' && f.status !== 'cancelled')
                      .reduce((sum: number, f: any) => sum + (f.amount_ttc || 0), 0)
                    // Prix du dossier (peut avoir été modifié par une remise commerciale)
                    const prixTotalDossier = dossier.price_ttc || contrat.price_ttc || 0
                    // Reste à facturer = prix dossier - ce qui est déjà facturé
                    const resteAFacturer = Math.max(0, prixTotalDossier - montantFacture)

                    return (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                          <label className="label text-xs">Montant déjà facturé</label>
                          <p className="text-xl font-semibold text-green-600">{formatPrice(montantFacture)}</p>
                        </div>
                        <div>
                          <label className="label text-xs">Reste à facturer</label>
                          <p className={cn("text-xl font-semibold", resteAFacturer > 0 ? "text-orange-600" : "text-gray-400")}>
                            {resteAFacturer > 0 ? formatPrice(resteAFacturer) : '0 €'}
                          </p>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Liste des factures */}
                  {facturesLoading ? (
                    <p className="text-center text-gray-500 py-8">Chargement...</p>
                  ) : factures.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <Receipt size={40} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">Aucune facture générée</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {factures.map((facture) => (
                        <div
                          key={facture.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            facture.status === 'paid' ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold",
                              facture.type === 'acompte' ? "bg-amber-500" : facture.type === 'avoir' ? "bg-red-500" : "bg-blue-500"
                            )}>
                              {facture.type === 'acompte' ? 'AC' : facture.type === 'avoir' ? 'AV' : 'SOL'}
                            </div>
                            <div>
                              <p className="font-medium flex items-center gap-2">
                                {facture.reference}
                                {facture.status === 'paid' && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    Payée
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {facture.type === 'acompte' && 'Facture d\'acompte'}
                                {facture.type === 'solde' && 'Facture de solde'}
                                {facture.type === 'avoir' && 'Avoir'}
                                {' - '}{formatDate(facture.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className={cn("text-lg font-bold", facture.amount_ttc < 0 && "text-red-600")}>
                              {formatPrice(facture.amount_ttc)}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const devisAccepte = dossierDevis.find((d: any) => d.status === 'accepted')
                                  const tvaRate = devisAccepte?.tva_rate || 10
                                  // Récupérer la facture d'acompte si c'est une facture de solde
                                  const factureAcompte = facture.type === 'solde'
                                    ? factures.find((f: any) => f.type === 'acompte')
                                    : null

                                  // Calculer la durée et les options comme pour la proforma
                                  const dureeJoursFacture = dossier.departure_date && dossier.return_date
                                    ? Math.ceil((new Date(dossier.return_date).getTime() - new Date(dossier.departure_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
                                    : 1
                                  const optionsDetailsFacture = (devisAccepte as any)?.options_details || {}
                                  const nbChauffeursFacture = devisAccepte?.nombre_chauffeurs || 1
                                  const nbRepasFacture = dureeJoursFacture * 2
                                  const nbNuitsFacture = Math.max(0, dureeJoursFacture - 1)

                                  const basePriceTTCFacture = devisAccepte?.price_ttc || 0
                                  const totalPriceTTCFacture = dossier.price_ttc || basePriceTTCFacture
                                  const optionsTotalFacture = totalPriceTTCFacture - basePriceTTCFacture

                                  const optionsLignesFacture: { label: string; montant: number }[] = []
                                  if (optionsTotalFacture > 0 && optionsDetailsFacture) {
                                    if (optionsDetailsFacture.peages?.status === 'non_inclus' && optionsDetailsFacture.peages.montant) {
                                      optionsLignesFacture.push({ label: 'Péages', montant: optionsDetailsFacture.peages.montant })
                                    }
                                    if (optionsDetailsFacture.repas_chauffeur?.status === 'non_inclus' && optionsDetailsFacture.repas_chauffeur.montant) {
                                      const montant = optionsDetailsFacture.repas_chauffeur.montant * nbRepasFacture * nbChauffeursFacture
                                      optionsLignesFacture.push({ label: `Repas chauffeur (${nbRepasFacture} repas × ${nbChauffeursFacture} chauff.)`, montant })
                                    }
                                    if (optionsDetailsFacture.parking?.status === 'non_inclus' && optionsDetailsFacture.parking.montant) {
                                      optionsLignesFacture.push({ label: 'Parking', montant: optionsDetailsFacture.parking.montant })
                                    }
                                    if (optionsDetailsFacture.hebergement?.status === 'non_inclus' && optionsDetailsFacture.hebergement.montant) {
                                      const montant = optionsDetailsFacture.hebergement.montant * nbNuitsFacture * nbChauffeursFacture
                                      optionsLignesFacture.push({ label: `Hébergement (${nbNuitsFacture} nuits × ${nbChauffeursFacture} chauff.)`, montant })
                                    }
                                  }

                                  generateFacturePDF({
                                    reference: facture.reference,
                                    type: facture.type as 'acompte' | 'solde' | 'avoir',
                                    client_name: dossier.client_name,
                                    client_address: dossier.billing_address || '',
                                    client_zip: dossier.billing_zip || '',
                                    client_city: dossier.billing_city || '',
                                    amount_ht: facture.amount_ht || Math.round(facture.amount_ttc / (1 + tvaRate / 100)),
                                    amount_ttc: facture.amount_ttc,
                                    tva_rate: tvaRate,
                                    created_at: facture.created_at,
                                    base_price_ttc: basePriceTTCFacture,
                                    options_lignes: optionsLignesFacture.length > 0 ? optionsLignesFacture : undefined,
                                    dossier: {
                                      reference: dossier.reference,
                                      departure: dossier.departure,
                                      arrival: dossier.arrival,
                                      departure_date: dossier.departure_date,
                                      passengers: dossier.passengers,
                                      client_name: dossier.client_name,
                                      client_email: dossier.client_email,
                                      nombre_cars: devisAccepte?.nombre_cars || 1,
                                      nombre_chauffeurs: nbChauffeursFacture,
                                      total_ttc: totalPriceTTCFacture,
                                    },
                                    facture_acompte: factureAcompte ? { reference: factureAcompte.reference, amount_ttc: factureAcompte.amount_ttc } : null,
                                  })
                                }}
                                className="p-2 rounded hover:bg-purple-100 text-purple-600"
                                title="Télécharger PDF"
                              >
                                <Download size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  const typeFacture = facture.type === 'acompte' ? "d'acompte" : facture.type === 'solde' ? 'de solde' : "d'avoir"
                                  setSelectedFactureForEmail(facture)
                                  setEnvoiFactureForm({
                                    to: dossier.client_email || '',
                                    subject: `Votre facture ${typeFacture} - ${facture.reference}`,
                                    body: `Bonjour ${dossier.client_name},

Veuillez trouver ci-joint votre facture ${typeFacture} n°${facture.reference} d'un montant de ${formatPrice(facture.amount_ttc)}.

Dossier : ${dossier.reference}
Trajet : ${dossier.departure} → ${dossier.arrival}
Date de départ : ${formatDate(dossier.departure_date)}

${facture.type === 'acompte' ? `Merci de procéder au règlement de cet acompte afin de confirmer votre réservation.

Moyens de paiement :
- Virement bancaire (RIB en pièce jointe)
- Carte bancaire via le lien de paiement qui vous sera envoyé` : facture.type === 'solde' ? `Merci de procéder au règlement du solde avant la date de départ.

Moyens de paiement :
- Virement bancaire (RIB en pièce jointe)
- Carte bancaire via le lien de paiement` : `Cet avoir sera déduit de votre prochaine facture ou remboursé sur demande.`}

Cordialement,
L'équipe Busmoov`,
                                  })
                                  setShowEnvoiFactureModal(true)
                                }}
                                className="p-2 rounded hover:bg-cyan-100 text-cyan-600"
                                title="Envoyer par email"
                              >
                                <Mail size={16} />
                              </button>
                              {facture.status !== 'paid' && (
                                <button
                                  onClick={() => openMarkFacturePaidModal(facture)}
                                  className="p-2 rounded hover:bg-green-100 text-green-600"
                                  title="Marquer comme payée"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              {facture.type !== 'avoir' && (
                                <button
                                  onClick={() => openAvoirModal(facture)}
                                  className="p-2 rounded hover:bg-orange-100 text-orange-600"
                                  title="Générer un avoir"
                                >
                                  <RotateCcw size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Onglet Voyage */}
              {financeTab === 'voyage' && (
                <div className="space-y-6">
                  {/* Statut global */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-purple-dark">Informations voyage</h3>
                      <p className="text-sm text-gray-500">
                        {voyageInfo?.validated_at
                          ? `Validé par le service le ${formatDate(voyageInfo.validated_at)}`
                          : (voyageInfo as any)?.client_validated_at
                          ? `Reçu du client le ${formatDate((voyageInfo as any).client_validated_at)} - En attente validation service`
                          : 'En attente des infos client'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {voyageInfo && ((voyageInfo as any)?.client_validated_at || voyageInfo.validated_at) && (
                        <button
                          onClick={() => {
                            generateInfosVoyagePDF({
                              reference: dossier.reference,
                              client_name: dossier.client_name,
                              client_phone: dossier.client_phone || '',
                              type: (voyageInfo.feuille_route_type as 'aller' | 'retour' | 'aller_retour') || 'aller_retour',
                              aller_date: voyageInfo.aller_date,
                              aller_heure: voyageInfo.aller_heure,
                              aller_adresse_depart: voyageInfo.aller_adresse_depart,
                              aller_adresse_arrivee: voyageInfo.aller_adresse_arrivee,
                              aller_passagers: voyageInfo.aller_passagers,
                              retour_date: voyageInfo.retour_date,
                              retour_heure: voyageInfo.retour_heure,
                              retour_adresse_depart: voyageInfo.retour_adresse_depart,
                              retour_adresse_arrivee: voyageInfo.retour_adresse_arrivee,
                              retour_passagers: voyageInfo.retour_passagers,
                              contact_nom: voyageInfo.contact_nom,
                              contact_prenom: voyageInfo.contact_prenom,
                              contact_tel: voyageInfo.contact_tel,
                              commentaires: voyageInfo.commentaires,
                              luggage_type: dossier.luggage_type,
                              validated_at: voyageInfo.validated_at || (voyageInfo as any).client_validated_at,
                            })
                          }}
                          className="btn btn-secondary text-sm flex items-center gap-2"
                        >
                          <Download size={16} />
                          PDF Infos Voyage
                        </button>
                      )}
                      <div className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium",
                        voyageInfo?.chauffeur_info_recue_at
                          ? "bg-green-100 text-green-700"
                          : voyageInfo?.validated_at
                          ? "bg-blue-100 text-blue-700"
                          : (voyageInfo as any)?.client_validated_at
                          ? "bg-orange-100 text-orange-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {voyageInfo?.chauffeur_info_recue_at
                          ? '✓ Feuille de route prête'
                          : voyageInfo?.validated_at
                          ? 'Infos validées'
                          : (voyageInfo as any)?.client_validated_at
                          ? 'À valider'
                          : 'En attente'}
                      </div>
                    </div>
                  </div>

                  {/* Infos voyage reçues du client (même si pas encore validées par le service) */}
                  {voyageInfo && ((voyageInfo as any)?.client_validated_at || voyageInfo.validated_at) && (
                    <VoyageInfoAdminSection
                      dossier={dossier}
                      voyageInfo={voyageInfo}
                      transporteurs={transporteurs}
                    />
                  )}

                  {/* Section Feuille de route et Demande chauffeur - seulement après validation service */}
                  {voyageInfo && voyageInfo.validated_at && dossier.transporteur_id && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-indigo-800 flex items-center gap-2">
                            <Truck size={18} />
                            Feuille de Route
                          </h4>
                          <p className="text-sm text-indigo-600 mt-1">
                            {voyageInfo.chauffeur_info_recue_at
                              ? `Infos chauffeur reçues le ${formatDate(voyageInfo.chauffeur_info_recue_at)}`
                              : voyageInfo.demande_chauffeur_envoyee_at
                              ? `Demande envoyée le ${formatDate(voyageInfo.demande_chauffeur_envoyee_at)}`
                              : 'Demander les informations du chauffeur au transporteur'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {voyageInfo.chauffeur_info_recue_at && (
                            <>
                              <button
                                onClick={async () => {
                                  const transporteur = transporteurs.find(t => t.id === dossier.transporteur_id)
                                  await generateFeuilleRoutePDF({
                                    reference: dossier.reference,
                                    type: (voyageInfo.feuille_route_type as FeuilleRouteType) || 'aller_retour',
                                    client_name: dossier.client_name,
                                    client_phone: dossier.client_phone,
                                    aller_date: voyageInfo.aller_date,
                                    aller_heure: voyageInfo.aller_heure,
                                    aller_adresse_depart: voyageInfo.aller_adresse_depart,
                                    aller_adresse_arrivee: voyageInfo.aller_adresse_arrivee,
                                    aller_passagers: voyageInfo.aller_passagers,
                                    chauffeur_aller_nom: voyageInfo.chauffeur_aller_nom,
                                    chauffeur_aller_tel: voyageInfo.chauffeur_aller_tel,
                                    chauffeur_aller_immatriculation: voyageInfo.chauffeur_aller_immatriculation,
                                    retour_date: voyageInfo.retour_date,
                                    retour_heure: voyageInfo.retour_heure,
                                    retour_adresse_depart: voyageInfo.retour_adresse_depart,
                                    retour_adresse_arrivee: voyageInfo.retour_adresse_arrivee,
                                    retour_passagers: voyageInfo.retour_passagers,
                                    chauffeur_retour_nom: voyageInfo.chauffeur_retour_nom,
                                    chauffeur_retour_tel: voyageInfo.chauffeur_retour_tel,
                                    chauffeur_retour_immatriculation: voyageInfo.chauffeur_retour_immatriculation,
                                    contact_nom: voyageInfo.contact_nom,
                                    contact_prenom: voyageInfo.contact_prenom,
                                    contact_tel: voyageInfo.contact_tel,
                                    astreinte_tel: voyageInfo.astreinte_tel || transporteur?.astreinte_tel,
                                    luggage_type: dossier.luggage_type,
                                    commentaires: voyageInfo.commentaires,
                                  })
                                }}
                                className="btn btn-secondary flex items-center gap-2"
                              >
                                <Download size={16} />
                                Télécharger PDF
                              </button>
                              <button
                                onClick={() => {
                                  // Pré-remplir avec les données existantes
                                  setChauffeursAllerForm([{
                                    nom: voyageInfo.chauffeur_aller_nom || '',
                                    tel: voyageInfo.chauffeur_aller_tel || '',
                                    immatriculation: voyageInfo.chauffeur_aller_immatriculation || '',
                                  }])
                                  setChauffeursRetourForm([{
                                    nom: voyageInfo.chauffeur_retour_nom || '',
                                    tel: voyageInfo.chauffeur_retour_tel || '',
                                    immatriculation: voyageInfo.chauffeur_retour_immatriculation || '',
                                  }])
                                  setAstreinteTelForm(voyageInfo.astreinte_tel || '')
                                  setMemeChauffeursRetour(!voyageInfo.chauffeur_retour_nom)
                                  setShowChauffeurManuelModal(true)
                                }}
                                className="btn btn-outline flex items-center gap-2"
                              >
                                <Edit2 size={16} />
                                Modifier
                              </button>
                              {!voyageInfo.feuille_route_envoyee_at && (
                                <button
                                  onClick={openFeuilleRouteEmailModal}
                                  className="btn btn-success flex items-center gap-2"
                                >
                                  <Send size={16} />
                                  Envoyer au client
                                </button>
                              )}
                              {voyageInfo.feuille_route_envoyee_at && (
                                <>
                                  <button
                                    onClick={openFeuilleRouteEmailModal}
                                    className="btn btn-outline flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
                                  >
                                    <RefreshCw size={16} />
                                    Renvoyer
                                  </button>
                                  <span className="text-green-600 text-sm flex items-center gap-1">
                                    <CheckCircle size={14} />
                                    Envoyée le {formatDate(voyageInfo.feuille_route_envoyee_at)}
                                  </span>
                                </>
                              )}
                            </>
                          )}
                          {!voyageInfo.chauffeur_info_recue_at && (
                            <>
                              <button
                                onClick={() => setShowDemandeContactChauffeurModal(true)}
                                className="btn btn-primary flex items-center gap-2"
                              >
                                <Phone size={16} />
                                Demander contact chauffeur
                              </button>
                              <button
                                onClick={() => {
                                  // Récupérer le nombre de cars du devis accepté
                                  const devisAccepte = dossierDevis.find((d: any) => d.status === 'accepted')
                                  const nombreCars = devisAccepte?.nombre_cars || 1

                                  // Initialiser les formulaires avec le bon nombre de cars
                                  const initialChauffeurs = Array.from({ length: nombreCars }, () => ({
                                    nom: '',
                                    tel: '',
                                    immatriculation: '',
                                  }))

                                  setChauffeursAllerForm(initialChauffeurs)
                                  setChauffeursRetourForm(initialChauffeurs.map(() => ({ nom: '', tel: '', immatriculation: '' })))
                                  setMemeChauffeursRetour(true)
                                  setShowChauffeurManuelModal(true)
                                }}
                                className="btn btn-secondary flex items-center gap-2"
                              >
                                <Edit2 size={16} />
                                Saisir manuellement
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message si pas d'infos voyage du tout */}
                  {(!voyageInfo || (!(voyageInfo as any)?.client_validated_at && !voyageInfo.validated_at)) && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <MapPin size={40} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">En attente des informations voyage du client</p>
                      <p className="text-sm text-gray-400 mt-1">Le client doit compléter et valider ses informations de voyage</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Voyage */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
            <MapPin size={20} className="text-magenta" />
            Détails du voyage
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Départ</label>
              {isEditing ? (
                <AddressAutocomplete
                  value={formData.departure}
                  onChange={(value) => setFormData({ ...formData, departure: value })}
                  placeholder="Lieu de départ"
                />
              ) : (
                <p className="font-medium">{dossier.departure}</p>
              )}
            </div>
            <div>
              <label className="label">Arrivée</label>
              {isEditing ? (
                <AddressAutocomplete
                  value={formData.arrival}
                  onChange={(value) => setFormData({ ...formData, arrival: value })}
                  placeholder="Lieu d'arrivée"
                />
              ) : (
                <p className="font-medium">{dossier.arrival}</p>
              )}
            </div>
            <div>
              <label className="label">Date départ</label>
              {isEditing ? (
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.departure_date}
                  onChange={(e) => setFormData({ ...formData, departure_date: e.target.value })}
                />
              ) : (
                <p className="font-medium">{formatDate(dossier.departure_date)}</p>
              )}
            </div>
            <div>
              <label className="label">Date retour</label>
              {isEditing ? (
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.return_date}
                  onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                />
              ) : (
                <p className="font-medium">{dossier.return_date ? formatDate(dossier.return_date) : '-'}</p>
              )}
            </div>
            <div>
              <label className="label">Passagers</label>
              {isEditing ? (
                <input
                  type="number"
                  className="input"
                  min="1"
                  value={formData.passengers}
                  onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
                />
              ) : (
                <p className="font-medium">{dossier.passengers} personnes</p>
              )}
            </div>
            <div>
              <label className="label">Type de véhicule</label>
              {isEditing ? (
                <select
                  className="input"
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                >
                  <option value="minibus">Minibus</option>
                  <option value="autocar">Autocar</option>
                  <option value="autocar_vip">Autocar VIP</option>
                </select>
              ) : (
                <p className="font-medium capitalize">{dossier.vehicle_type?.replace('_', ' ')}</p>
              )}
            </div>
            <div>
              <label className="label">Statut</label>
              {isEditing ? (
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1">
                  <StatusBadge status={dossier.status || 'new'} />
                  {dossier.requires_manual_review && (
                    <span title={dossier.manual_review_reason || 'Révision manuelle requise'} className="text-amber-500 cursor-help">
                      ⭐
                    </span>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="label">Transporteur</label>
              {isEditing ? (
                <select
                  className="input"
                  value={formData.transporteur_id}
                  onChange={(e) => setFormData({ ...formData, transporteur_id: e.target.value })}
                >
                  <option value="">-- Aucun --</option>
                  {transporteurs.map((t) => (
                    <option key={t.id} value={t.id}>{t.number} - {t.name}</option>
                  ))}
                </select>
              ) : (
                <p className="font-medium">
                  {dossier.transporteur ? (
                    <span className="bg-purple text-white text-xs font-bold px-2 py-1 rounded">
                      {dossier.transporteur.number} - {dossier.transporteur.name}
                    </span>
                  ) : '-'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Infos complètes du lead */}
        <div className="card p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <h2 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
            <FileText size={20} className="text-magenta" />
            Informations complètes de la demande
          </h2>

          {/* Type de trajet et voyage */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-3 border">
              <span className="text-xs text-gray-500 uppercase">Mode de trajet</span>
              <p className="font-semibold text-purple-dark">
                {getTripModeLabel(dossier.trip_mode)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <span className="text-xs text-gray-500 uppercase">Type de voyage</span>
              <p className="font-semibold text-purple-dark">{dossier.voyage_type || '-'}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <span className="text-xs text-gray-500 uppercase">Type de véhicule</span>
              <p className="font-semibold text-purple-dark">{getVehicleTypeLabel(dossier.vehicle_type) || '-'}</p>
            </div>
            <div className="bg-white rounded-lg p-3 border">
              <span className="text-xs text-gray-500 uppercase">Bagages</span>
              <p className="font-semibold text-purple-dark">{dossier.luggage_type || '-'}</p>
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-3 mb-6">
            {dossier.accessibility && (
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                ♿ Accessibilité PMR
              </span>
            )}
            {dossier.wifi && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                📶 WiFi
              </span>
            )}
            {dossier.wc && (
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                🚻 WC
              </span>
            )}
            {!dossier.accessibility && !dossier.wifi && !dossier.wc && (
              <span className="text-gray-400 text-sm">Aucune option spécifique</span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Trajet Aller */}
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <h3 className="font-semibold text-purple-dark mb-3 flex items-center gap-2">
                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">ALLER</span>
                {formatDate(dossier.departure_date)} {dossier.departure_time && `à ${dossier.departure_time}`}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Départ:</strong> {dossier.departure_address || dossier.departure}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong>Arrivée:</strong> {dossier.arrival_address || dossier.arrival}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users size={14} className="text-gray-400 mt-0.5" />
                  <span><strong>Passagers:</strong> {dossier.passengers}</span>
                </div>
              </div>
            </div>

            {/* Trajet Retour */}
            {(dossier.return_date || dossier.return_time || dossier.trip_mode === 'aller_retour' || dossier.trip_mode === 'round-trip' || dossier.trip_mode?.toLowerCase().includes('retour')) && (
              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <h3 className="font-semibold text-purple-dark mb-3 flex items-center gap-2">
                  <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded">RETOUR</span>
                  {dossier.return_date ? formatDate(dossier.return_date) : formatDate(dossier.departure_date)} {dossier.return_time && `à ${dossier.return_time}`}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Départ:</strong> {dossier.return_departure_address || dossier.arrival_address || dossier.arrival}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Arrivée:</strong> {dossier.return_arrival_address || dossier.departure_address || dossier.departure}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Demandes spéciales */}
          {dossier.special_requests && (
            <div className="mt-4 bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h3 className="font-semibold text-purple-dark mb-2 flex items-center gap-2">
                <FileText size={16} className="text-yellow-600" />
                Demandes spéciales / Informations complémentaires
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{dossier.special_requests}</p>
            </div>
          )}

          {/* Contact sur place (depuis voyage_info si disponible) */}
          {voyageInfo && (voyageInfo.contact_nom || voyageInfo.contact_tel) && (
            <div className="mt-4 bg-white rounded-lg p-4 border border-purple-100">
              <h3 className="font-semibold text-purple-dark mb-3 flex items-center gap-2">
                <Phone size={16} className="text-magenta" />
                Contact sur place
              </h3>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Nom:</span>
                  <p className="font-medium">{voyageInfo.contact_nom || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Prénom:</span>
                  <p className="font-medium">{voyageInfo.contact_prenom || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Téléphone:</span>
                  <p className="font-medium">{voyageInfo.contact_tel || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{voyageInfo.contact_email || '-'}</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Tarification */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
            <Euro size={20} className="text-magenta" />
            Tarification
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="label">💰 Vente HT</label>
              {isEditing ? (
                <input
                  type="number"
                  className="input"
                  value={formData.price_ht}
                  onChange={(e) => setFormData({ ...formData, price_ht: parseFloat(e.target.value) })}
                />
              ) : (
                <p className="font-medium">{dossier.price_ht ? formatPrice(dossier.price_ht) : '-'}</p>
              )}
            </div>
            <div>
              <label className="label">💰 Vente TTC</label>
              {isEditing ? (
                <input
                  type="number"
                  className="input"
                  value={formData.price_ttc}
                  onChange={(e) => setFormData({ ...formData, price_ttc: parseFloat(e.target.value) })}
                />
              ) : (
                <p className="font-bold text-xl text-purple-dark">{dossier.price_ttc ? formatPrice(dossier.price_ttc) : '-'}</p>
              )}
              <p className="text-xs text-gray-400">Facturé au client</p>
            </div>
            <div>
              <label className="label">🏷️ Achat HT</label>
              {isEditing ? (
                <input
                  type="number"
                  className="input"
                  value={formData.price_achat}
                  onChange={(e) => setFormData({ ...formData, price_achat: parseFloat(e.target.value) })}
                />
              ) : (
                <p className="font-medium">{dossier.price_achat ? formatPrice(dossier.price_achat) : '-'}</p>
              )}
              <p className="text-xs text-gray-400">Payé au transporteur</p>
            </div>
            <div>
              <label className="label">📊 Marge HT</label>
              {dossier.price_ht && dossier.price_achat ? (
                <>
                  <p className={`font-bold text-xl ${(dossier.price_ht - dossier.price_achat) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatPrice(dossier.price_ht - dossier.price_achat)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {Math.round(((dossier.price_ht - dossier.price_achat) / dossier.price_ht) * 100)}%
                  </p>
                </>
              ) : (
                <p className="text-gray-400">-</p>
              )}
            </div>
            <div>
              <label className="label">TVA</label>
              <p className="font-medium">{dossier.tva_rate ? `${dossier.tva_rate}%` : '10%'}</p>
            </div>
          </div>

          {/* Meilleur prix fournisseur */}
          {(() => {
            const demandesAvecPrix = dossier.demandes_fournisseurs?.filter(df => df.prix_propose && df.prix_propose > 0) || []
            if (demandesAvecPrix.length === 0) return null
            const meilleureDemande = demandesAvecPrix.reduce((best, current) =>
              (current.prix_propose || 0) < (best.prix_propose || Infinity) ? current : best
            )
            // prix_propose est en TTC, on calcule le HT pour la marge
            const prixAchatTTC = meilleureDemande.prix_propose || 0
            const prixAchatHT = Math.round((prixAchatTTC / 1.1) * 100) / 100
            const margeEstimee = (dossier.price_ht || 0) - prixAchatHT
            return (
              <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🏆</span>
                    <div>
                      <p className="text-sm text-gray-600">Meilleur prix fournisseur reçu</p>
                      <p className="font-bold text-lg text-emerald-600">{formatPrice(prixAchatTTC)} TTC</p>
                      <p className="text-xs text-gray-500">{formatPrice(prixAchatHT)} HT</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">par {meilleureDemande.transporteur?.name || 'Fournisseur inconnu'}</p>
                    {dossier.price_ht && dossier.price_ht > 0 && (
                      <p className={`text-sm font-medium ${margeEstimee > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        Marge potentielle: {formatPrice(margeEstimee)}
                        {margeEstimee > 0 && dossier.price_ht && (
                          <span className="text-xs ml-1">
                            ({Math.round((margeEstimee / dossier.price_ht) * 100)}%)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Réponses Fournisseurs - Toujours visible */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-purple-dark flex items-center gap-2">
              <Truck size={20} className="text-magenta" />
              Réponses fournisseurs ({demandesFournisseurs.length})
            </h2>
            <button
              onClick={() => setShowDemandeFournisseurModal(true)}
              className="btn btn-sm btn-primary"
            >
              <Plus size={14} />
              Demander des prix
            </button>
          </div>
          {demandesFournisseurs.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                // Trouver le meilleur prix pour comparaison
                const prixProposes = demandesFournisseurs
                  .filter((df: any) => df.prix_propose && df.prix_propose > 0)
                  .map((df: any) => df.prix_propose)
                const meilleurPrix = prixProposes.length > 0 ? Math.min(...prixProposes) : null
                const prixVenteHT = dossier.price_ht || 0

                // Récupérer le devis accepté pour avoir les vrais prix HT/TTC validés
                const devisAccepte = dossier.devis?.find((d: any) => d.status === 'accepted')

                return demandesFournisseurs.map((demande: any) => {
                  const isMeilleur = meilleurPrix && demande.prix_propose === meilleurPrix

                  // Utiliser les données du devis si disponibles (plus fiables), sinon le price_achat du dossier
                  // Le price_achat du dossier est maintenant toujours en HT
                  let prixAchatHT: number | null = null
                  let prixAchatTTC: number | null = null

                  if (devisAccepte?.price_achat_ht && devisAccepte?.price_achat_ttc) {
                    // Données du devis validé
                    prixAchatHT = devisAccepte.price_achat_ht
                    prixAchatTTC = devisAccepte.price_achat_ttc
                  } else if (dossier.price_achat) {
                    // Fallback sur price_achat du dossier (en HT)
                    prixAchatHT = dossier.price_achat
                    prixAchatTTC = Math.round(dossier.price_achat * 1.1 * 100) / 100
                  } else if (demande.prix_propose) {
                    // Dernier recours: prix_propose (considéré comme TTC pour les nouveaux)
                    prixAchatTTC = demande.prix_propose
                    prixAchatHT = Math.round((demande.prix_propose / 1.1) * 100) / 100
                  }

                  const marge = prixVenteHT && prixAchatHT ? Math.round((prixVenteHT - prixAchatHT) * 100) / 100 : null
                  const margePositive = marge !== null && marge > 0

                  const isNouveauTarif = demande.status === 'tarif_recu'

                  return (
                    <div
                      key={demande.id}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all",
                        isNouveauTarif ? "border-orange-400 bg-orange-50 ring-2 ring-orange-300 ring-offset-1" :
                        isMeilleur && demande.prix_propose ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-gray-50",
                        demande.status === 'accepted' && "border-blue-400 bg-blue-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isNouveauTarif && (
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                              NOUVEAU
                            </span>
                          )}
                          {isMeilleur && demande.prix_propose && !isNouveauTarif && (
                            <span className="text-lg" title="Meilleur prix">🏆</span>
                          )}
                          <div>
                            <p className="font-semibold text-purple-dark">
                              {demande.transporteur?.name || 'Transporteur inconnu'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {demande.transporteur?.city || ''}
                              {demande.transporteur?.number && ` • ${demande.transporteur.number}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Prix achat (depuis devis validé ou dossier) */}
                          <div className="text-right">
                            {prixAchatHT ? (
                              <>
                                <p className={cn(
                                  "font-bold text-lg",
                                  isMeilleur ? "text-emerald-600" : "text-gray-700"
                                )}>
                                  {formatPrice(prixAchatHT)} <span className="text-xs font-normal text-gray-500">HT</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatPrice(prixAchatTTC)} TTC
                                </p>
                                {marge !== null && prixVenteHT > 0 && (
                                  <p className={cn(
                                    "text-xs",
                                    margePositive ? "text-emerald-600" : "text-red-500"
                                  )}>
                                    Marge: {formatPrice(marge)} ({Math.round((marge / prixVenteHT) * 100)}%)
                                  </p>
                                )}
                              </>
                            ) : demande.prix_propose ? (
                              <>
                                <p className={cn(
                                  "font-bold text-lg",
                                  isMeilleur ? "text-emerald-600" : "text-gray-700"
                                )}>
                                  {formatPrice(demande.prix_propose)} <span className="text-xs font-normal text-gray-500">TTC</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatPrice(Math.round((demande.prix_propose / 1.1) * 100) / 100)} HT
                                </p>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder="Prix TTC"
                                  className="input w-24 text-sm"
                                  onBlur={async (e) => {
                                    const prix = parseFloat(e.target.value)
                                    if (prix > 0) {
                                      await updateDemandeFournisseur.mutateAsync({
                                        id: demande.id,
                                        prix_propose: prix,
                                        status: 'responded',
                                        responded_at: new Date().toISOString(),
                                      })
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Statut */}
                          <div>
                            {demande.status === 'bpa_received' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                                ✓ BPA reçu
                              </span>
                            ) : demande.status === 'validated' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                                ✓ Validé
                              </span>
                            ) : demande.status === 'devis_created' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                Devis créé
                              </span>
                            ) : demande.status === 'responded' || demande.prix_propose ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                Répondu
                              </span>
                            ) : demande.status === 'sent' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                Att. tarif
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                                En attente
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          {demande.prix_propose && (
                            <div className="flex gap-2 flex-wrap">
                              {/* Bouton créer devis client - disponible si pas encore de devis créé */}
                              {(demande.status === 'responded' || demande.status === 'devis_created') && (
                                <button
                                  onClick={async () => {
                                    try {
                                      // prix_propose est en TTC
                                      const prixAchatTTC = demande.prix_propose!
                                      const prixAchatHT = Math.round((prixAchatTTC / 1.1) * 100) / 100
                                      const margePercent = 18 // 18% de marge
                                      const tvaRate = 10 // TVA 10%

                                      // Calculer prix de vente avec 18% de marge sur le HT
                                      const prixVenteHT = Math.round(prixAchatHT * (1 + margePercent / 100))
                                      const prixVenteTTC = Math.round(prixVenteHT * (1 + tvaRate / 100))

                                      // Générer référence devis
                                      const now = new Date()
                                      const refDevis = `DEV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

                                      console.log('Création devis...', { prixAchatHT, prixVenteHT, refDevis })

                                      // Créer le devis client avec 18% de marge
                                      const newDevis = await createDevis.mutateAsync({
                                        dossier_id: dossier.id,
                                        transporteur_id: demande.transporteur_id,
                                        reference: refDevis,
                                        price_ht: prixVenteHT,
                                        price_ttc: prixVenteTTC,
                                        price_achat_ht: prixAchatHT,
                                        price_achat_ttc: prixAchatTTC,
                                        tva_rate: tvaRate,
                                        status: 'pending',
                                        validity_days: 30,
                                      })

                                      console.log('Devis créé:', newDevis)

                                      // Marquer la demande comme "devis créé"
                                      if (demande.status !== 'devis_created') {
                                        await updateDemandeFournisseur.mutateAsync({
                                          id: demande.id,
                                          status: 'devis_created',
                                        })
                                      }

                                      // Ajouter à la timeline
                                      addTimelineEntry.mutate({
                                        dossier_id: dossier.id,
                                        type: 'note',
                                        content: `Devis client créé depuis ${demande.transporteur?.name}: Achat ${formatPrice(prixAchatHT)} HT (${formatPrice(prixAchatTTC)} TTC) → Vente ${formatPrice(prixVenteHT)} HT (+18% marge)`,
                                      })

                                      // Rafraîchir les devis
                                      queryClient.invalidateQueries({ queryKey: ['devis'] })
                                      queryClient.invalidateQueries({ queryKey: ['devis', 'dossier', dossier.id] })

                                      alert(`Devis ${refDevis} créé avec succès !`)
                                    } catch (error) {
                                      console.error('Erreur création devis:', error)
                                      alert('Erreur lors de la création du devis: ' + (error as Error).message)
                                    }
                                  }}
                                  className="btn btn-sm btn-primary"
                                  title="Créer un devis client avec +18% de marge"
                                >
                                  <FileText size={14} />
                                  Créer devis
                                </button>
                              )}

                              {/* Bouton valider au fournisseur */}
                              {(demande.status === 'responded' || demande.status === 'devis_created') && (
                                <button
                                  onClick={async () => {
                                    // Ouvrir l'email de validation au fournisseur
                                    const transporteurEmail = demande.transporteur?.email
                                    if (!transporteurEmail) {
                                      alert('Ce transporteur n\'a pas d\'adresse email renseignée')
                                      return
                                    }

                                    // Générer un token de validation unique
                                    const validationToken = generateValidationToken()

                                    // Sauvegarder le token dans la demande fournisseur
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    await (supabase as any)
                                      .from('demandes_fournisseurs')
                                      .update({ validation_token: validationToken })
                                      .eq('id', demande.id)

                                    // Récupérer le nombre de cars et chauffeurs depuis le devis accepté ou le devis créé
                                    const devisAvecInfos = dossier.devis?.find((d: any) => d.status === 'accepted')
                                      || dossier.devis?.find((d: any) => d.transporteur_id === demande.transporteur_id)
                                      || dossier.devis?.[0]
                                    const nbCars = devisAvecInfos?.nombre_cars || calculateNumberOfCars(dossier.passengers || 1, dossier.vehicle_type || 'standard')
                                    const nbChauffeurs = devisAvecInfos?.nombre_chauffeurs || nbCars

                                    // Générer les données d'email avec le template depuis la base de données
                                    const emailData = await generateValidationFournisseurEmailFromTemplate({
                                      transporteurEmail,
                                      transporteurName: demande.transporteur?.name || 'Transporteur',
                                      dossierReference: dossier.reference,
                                      departureCity: dossier.departure,
                                      arrivalCity: dossier.arrival,
                                      departureDate: dossier.departure_date,
                                      returnDate: dossier.return_date,
                                      departureTime: dossier.departure_time,
                                      returnTime: dossier.return_time,
                                      passengers: dossier.passengers,
                                      prixAchat: demande.prix_propose,
                                      serviceType: devisAvecInfos?.service_type || (dossier as any).service_type,
                                      nbCars: nbCars,
                                      nbChauffeurs: nbChauffeurs,
                                      detailMad: devisAvecInfos?.detail_mad,
                                      dureeJours: devisAvecInfos?.duree_jours,
                                      amplitude: devisAvecInfos?.amplitude,
                                      demandeId: demande.id,
                                      validationToken,
                                    })

                                    // Ouvrir la modal d'email avec callback pour valider après envoi
                                    openEmailPreview(emailData, async () => {
                                      await updateDemandeFournisseur.mutateAsync({
                                        id: demande.id,
                                        status: 'validated',
                                      })

                                      // Mettre à jour le dossier avec le transporteur choisi
                                      // prix_propose est en TTC, on stocke le HT dans price_achat
                                      const prixAchatHT = Math.round((demande.prix_propose / 1.1) * 100) / 100
                                      await updateDossier.mutateAsync({
                                        id: dossier.id,
                                        price_achat: prixAchatHT,
                                        transporteur_id: demande.transporteur_id,
                                      })

                                      addTimelineEntry.mutate({
                                        dossier_id: dossier.id,
                                        type: 'note',
                                        content: `Commande validée auprès de ${demande.transporteur?.name} à ${formatPrice(demande.prix_propose)} TTC - Email de confirmation envoyé - En attente BPA`,
                                      })
                                    })
                                  }}
                                  className="btn btn-sm btn-success"
                                  title="Valider la commande au fournisseur"
                                >
                                  <Check size={14} />
                                  Valider fournisseur
                                </button>
                              )}

                              {/* Bouton BPA reçu */}
                              {demande.status === 'validated' && (
                                <button
                                  onClick={async () => {
                                    await updateDemandeFournisseur.mutateAsync({
                                      id: demande.id,
                                      status: 'bpa_received',
                                    })

                                    addTimelineEntry.mutate({
                                      dossier_id: dossier.id,
                                      type: 'note',
                                      content: `BPA reçu de ${demande.transporteur?.name} - Prestation confirmée`,
                                    })
                                  }}
                                  className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                                  title="Marquer le BPA comme reçu"
                                >
                                  <CheckCircle size={14} />
                                  BPA reçu
                                </button>
                              )}

                              {/* Bouton annuler */}
                              {(demande.status === 'devis_created' || demande.status === 'validated' || demande.status === 'bpa_received') && (
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Annuler le statut pour ${demande.transporteur?.name} ?`)) return

                                    // Si on annule depuis validated ou bpa_received, revenir à devis_created
                                    // Si on annule depuis devis_created, revenir à responded
                                    const newStatus = (demande.status === 'validated' || demande.status === 'bpa_received')
                                      ? 'devis_created'
                                      : 'responded'

                                    await updateDemandeFournisseur.mutateAsync({
                                      id: demande.id,
                                      status: newStatus,
                                    })

                                    // Retirer le transporteur du dossier si c'était validé
                                    if (demande.status === 'validated' || demande.status === 'bpa_received') {
                                      await updateDossier.mutateAsync({
                                        id: dossier.id,
                                        transporteur_id: null,
                                      })
                                    }

                                    addTimelineEntry.mutate({
                                      dossier_id: dossier.id,
                                      type: 'note',
                                      content: `Statut annulé pour ${demande.transporteur?.name} → ${newStatus === 'devis_created' ? 'Devis créé' : 'Répondu'}`,
                                    })
                                  }}
                                  className="btn btn-sm btn-outline text-red-600 border-red-300 hover:bg-red-50"
                                  title="Annuler"
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Note fournisseur */}
                      {demande.note_fournisseur && (
                        <p className="mt-2 text-sm text-gray-600 italic">
                          "{demande.note_fournisseur}"
                        </p>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Truck size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Aucune demande fournisseur pour ce dossier</p>
              <p className="text-sm mt-1">Cliquez sur "Demander des prix" pour solliciter des transporteurs</p>
            </div>
          )}
        </div>

        {/* Notes - toujours modifiable */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
            <FileText size={20} className="text-magenta" />
            Notes internes
          </h2>
          <textarea
            className="input min-h-24"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            onBlur={async () => {
              if (formData.notes !== dossier.notes) {
                await updateDossier.mutateAsync({ id: dossier.id, notes: formData.notes })
              }
            }}
            placeholder="Notes internes sur ce dossier (sauvegarde automatique)..."
          />
          <p className="text-xs text-gray-400 mt-1">Sauvegarde automatique à la perte du focus</p>
        </div>

        {/* Devis du dossier */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-purple-dark flex items-center gap-2">
              <Receipt size={20} className="text-magenta" />
              Devis ({dossierDevis.length})
            </h2>
            <button
              onClick={() => setShowNewDevisModal(true)}
              className="btn btn-success btn-sm"
            >
              <Plus size={16} />
              Nouveau devis
            </button>
          </div>

          {devisLoading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : dossierDevis.length === 0 ? (
            <p className="text-gray-500">Aucun devis pour ce dossier</p>
          ) : (
            <div className="space-y-3">
              {dossierDevis.map((devis) => {
                const isAuto = (devis as any).is_auto_generated
                const scheduledAt = (devis as any).scheduled_send_at
                const workflowStep = (devis as any).workflow_step

                return (
                <div
                  key={devis.id}
                  className={`p-4 rounded-xl border-2 ${
                    devis.status === 'accepted'
                      ? 'border-green-300 bg-green-50'
                      : isAuto
                        ? 'border-orange-300 bg-orange-50'
                        : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-purple-dark">{devis.reference}</span>
                        {isAuto && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">
                            AUTO {workflowStep ? `#${workflowStep}` : ''}
                          </span>
                        )}
                        <DevisStatusBadge status={devis.status || 'draft'} scheduledAt={scheduledAt} />
                      </div>
                      <p className="text-sm text-gray-500">
                        {devis.transporteur?.name || 'Transporteur'} ({devis.transporteur?.number})
                      </p>
                      {isAuto && scheduledAt && devis.status === 'scheduled' && (
                        <p className="text-xs text-orange-600 mt-1">
                          Envoi prévu : {formatDateTime(scheduledAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Prix TTC</p>
                        <p className="text-xl font-bold text-purple-dark">{formatPrice(devis.price_ttc || 0)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Télécharger PDF"
                          onClick={async () => await generateDevisPDF({
                            reference: devis.reference,
                            dossier: {
                              reference: dossier.reference,
                              client_name: dossier.client_name,
                              client_email: dossier.client_email,
                              client_phone: dossier.client_phone,
                              departure: dossier.departure,
                              arrival: dossier.arrival,
                              departure_date: dossier.departure_date,
                              departure_time: dossier.departure_time || undefined,
                              return_date: dossier.return_date,
                              return_time: dossier.return_time || undefined,
                              passengers: dossier.passengers,
                              trip_mode: dossier.trip_mode || undefined,
                            },
                            transporteur: devis.transporteur,
                            vehicle_type: devis.vehicle_type,
                            price_ht: devis.price_ht,
                            price_ttc: devis.price_ttc,
                            tva_rate: devis.tva_rate,
                            km: devis.km,
                            options: devis.options,
                            notes: devis.notes,
                            created_at: devis.created_at,
                            validity_days: devis.validity_days,
                            nombre_cars: devis.nombre_cars,
                            nombre_chauffeurs: devis.nombre_chauffeurs,
                            service_type: devis.service_type || undefined,
                            duree_jours: devis.duree_jours || undefined,
                            detail_mad: devis.detail_mad || undefined,
                            options_details: devis.options_details as any || undefined,
                            commentaires: devis.options || devis.notes || undefined,
                          })}
                        >
                          <Download size={14} />
                        </button>
                        {/* Bouton Modifier devis */}
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Modifier le devis"
                          onClick={() => onEditDevis(devis)}
                        >
                          <Pencil size={14} />
                        </button>
                        {devis.status === 'scheduled' && (
                          <button
                            className="btn btn-danger btn-sm"
                            title="Annuler l'envoi programmé"
                            onClick={() => handleCancelScheduledDevis(devis.id)}
                          >
                            <XCircle size={14} />
                            Annuler
                          </button>
                        )}
                        {(devis.status === 'draft' || devis.status === 'pending') && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Envoyer au client"
                            onClick={() => handleSendDevis(devis.id, devis.reference)}
                          >
                            <Send size={14} />
                          </button>
                        )}
                        {devis.status === 'sent' && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Renvoyer l'email au client"
                              onClick={() => handleResendDevis(devis.id, devis.reference)}
                            >
                              <Send size={14} />
                              Renvoyer
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              title="Signer pour le client (devis tamponné reçu)"
                              onClick={() => handleSignerPourClient(devis.id)}
                            >
                              <Pencil size={14} />
                              Signer pour client
                            </button>
                          </>
                        )}
                        {devis.status === 'client_validated' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              title="Confirmer (dispo OK)"
                              onClick={() => handleAdminConfirm(devis.id)}
                            >
                              <CheckCircle size={14} />
                              Confirmer
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Refuser (pas de dispo)"
                              onClick={() => {
                                setRefuseDevisId(devis.id)
                                setShowRefuseModal(true)
                              }}
                            >
                              <XCircle size={14} />
                              Refuser
                            </button>
                          </>
                        )}
                        {devis.status === 'accepted' && (
                          <button
                            className="btn btn-warning btn-sm"
                            title="Annuler l'acceptation"
                            onClick={() => handleUnacceptDevis(devis.id)}
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                        {/* Bouton supprimer - uniquement pour devis non validés */}
                        {devis.status && !['accepted', 'client_validated'].includes(devis.status) && (
                          <button
                            className="btn btn-sm border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400"
                            title="Supprimer le devis"
                            onClick={() => handleDeleteDevis(devis.id, devis.reference)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
              })}
            </div>
          )}
        </div>

        {/* Rappels du dossier */}
        {rappelsDossier.length > 0 && (
          <div className="card p-6">
            <h2 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
              <Bell size={20} className="text-orange-500" />
              Rappels ({rappelsDossier.length})
            </h2>
            <div className="space-y-3">
              {rappelsDossier.map((rappel: any) => {
                const isOverdue = new Date(rappel.reminder_date) < new Date() && !rappel.is_done
                const isToday = rappel.reminder_date.split('T')[0] === new Date().toISOString().slice(0, 10)

                return (
                  <div
                    key={rappel.id}
                    className={cn(
                      "p-3 rounded-lg border flex items-start gap-3",
                      rappel.is_done && "bg-gray-50 opacity-60",
                      !rappel.is_done && isOverdue && "bg-red-50 border-red-200",
                      !rappel.is_done && isToday && "bg-orange-50 border-orange-200",
                      !rappel.is_done && !isOverdue && !isToday && "bg-white border-gray-200"
                    )}
                  >
                    <button
                      onClick={async () => {
                        await updateRappel.mutateAsync({ id: rappel.id, is_done: !rappel.is_done })
                        if (!rappel.is_done) {
                          await addTimelineEntry.mutateAsync({
                            dossier_id: dossier.id,
                            type: 'rappel_done',
                            content: `✅ Rappel terminé : ${rappel.title}`,
                          })
                        }
                      }}
                      className={cn(
                        "mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
                        rappel.is_done
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-purple-500"
                      )}
                    >
                      {rappel.is_done && <Check size={12} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          rappel.is_done && "line-through text-gray-400"
                        )}>
                          {rappel.title}
                        </span>
                        <span className={cn(
                          "px-1.5 py-0.5 text-xs rounded-full",
                          rappel.priority === 'urgent' && "bg-red-100 text-red-700",
                          rappel.priority === 'high' && "bg-orange-100 text-orange-700",
                          rappel.priority === 'normal' && "bg-blue-100 text-blue-700",
                          rappel.priority === 'low' && "bg-gray-100 text-gray-600"
                        )}>
                          {rappel.priority === 'urgent' ? 'Urgent' :
                           rappel.priority === 'high' ? 'Haute' :
                           rappel.priority === 'normal' ? 'Normale' : 'Basse'}
                        </span>
                        {isOverdue && !rappel.is_done && (
                          <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                            En retard
                          </span>
                        )}
                        {isToday && !rappel.is_done && (
                          <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">
                            Aujourd'hui
                          </span>
                        )}
                      </div>
                      {rappel.description && (
                        <p className="text-sm text-gray-500 mt-1">{rappel.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(rappel.reminder_date).toLocaleDateString('fr-FR')}
                        {rappel.reminder_time && ` à ${rappel.reminder_time.slice(0, 5)}`}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm('Supprimer ce rappel ?')) {
                          await deleteRappel.mutateAsync(rappel.id)
                        }
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => setShowRappelModal(true)}
              className="mt-3 text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              <Plus size={14} />
              Ajouter un rappel
            </button>
          </div>
        )}

        {/* Timeline / Historique */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
            <History size={20} className="text-magenta" />
            Historique
          </h2>
          {timelineLoading ? (
            <p className="text-gray-500">Chargement...</p>
          ) : timelineEntries.length === 0 ? (
            <p className="text-gray-500">Aucun événement enregistré</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
              <div className="space-y-4">
                {timelineEntries.map((entry) => (
                  <div key={entry.id} className="relative pl-10">
                    <div className={cn(
                      "absolute left-2 w-5 h-5 rounded-full flex items-center justify-center",
                      entry.type === 'status_change' ? 'bg-blue-100' :
                      entry.type === 'devis_accepted' ? 'bg-green-100' :
                      entry.type === 'devis_refused' ? 'bg-red-100' :
                      entry.type === 'devis_unaccepted' ? 'bg-orange-100' :
                      entry.type === 'payment' ? 'bg-purple-100' :
                      entry.type === 'email_sent' ? 'bg-cyan-100' :
                      entry.type === 'rappel_created' ? 'bg-orange-100' :
                      entry.type === 'rappel_done' ? 'bg-green-100' :
                      'bg-gray-100'
                    )}>
                      {entry.type === 'status_change' && <Clock size={12} className="text-blue-600" />}
                      {entry.type === 'devis_accepted' && <CheckCircle size={12} className="text-green-600" />}
                      {entry.type === 'devis_refused' && <XCircle size={12} className="text-red-600" />}
                      {entry.type === 'devis_unaccepted' && <RotateCcw size={12} className="text-orange-600" />}
                      {entry.type === 'payment' && <Euro size={12} className="text-purple-600" />}
                      {entry.type === 'email_sent' && <Mail size={12} className="text-cyan-600" />}
                      {entry.type === 'rappel_created' && <Bell size={12} className="text-orange-600" />}
                      {entry.type === 'rappel_done' && <BellRing size={12} className="text-green-600" />}
                      {!['status_change', 'devis_accepted', 'devis_refused', 'devis_unaccepted', 'payment', 'email_sent', 'rappel_created', 'rappel_done'].includes(entry.type) &&
                        <History size={12} className="text-gray-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{entry.content}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(entry.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Widget flottant raccourcis */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="flex flex-col gap-2">
          {/* Bouton principal avec menu */}
          <div className="relative group">
            {/* Menu qui s'affiche au hover */}
            <div className="absolute bottom-full right-0 pb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-2 min-w-[180px]">
                <button
                  onClick={() => setFinanceTab('contrat')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-dark rounded-lg transition-colors"
                >
                  <FileText size={16} />
                  Contrat
                </button>
                <button
                  onClick={() => setFinanceTab('paiements')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-dark rounded-lg transition-colors"
                >
                  <Euro size={16} />
                  Paiements
                </button>
                <button
                  onClick={() => setFinanceTab('factures')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-dark rounded-lg transition-colors"
                >
                  <Receipt size={16} />
                  Factures
                </button>
                <button
                  onClick={() => setFinanceTab('voyage')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-dark rounded-lg transition-colors"
                >
                  <MapPin size={16} />
                  Voyage
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => setShowNewDevisModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  Nouveau devis
                </button>
                {contrat && (
                  <button
                    onClick={() => setShowPaiementModal(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Ajouter paiement
                  </button>
                )}
                <button
                  onClick={() => setShowRappelModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors"
                >
                  <Bell size={16} />
                  Ajouter rappel
                  {rappelsDossier.length > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                      {rappelsDossier.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
            {/* Bouton flottant principal */}
            <button
              className="w-14 h-14 bg-gradient-to-r from-magenta to-purple text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
              title="Raccourcis"
            >
              <Zap size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Nouveau Devis */}
      <NewDevisModal
        isOpen={showNewDevisModal}
        onClose={() => setShowNewDevisModal(false)}
        dossier={dossier}
        transporteurs={transporteurs}
      />

      {/* Modal Refuser Devis */}
      <Modal
        isOpen={showRefuseModal}
        onClose={() => {
          setShowRefuseModal(false)
          setRefuseDevisId(null)
        }}
        title="Refuser le devis"
      >
        <RefuseDevisForm
          onSubmit={(reason) => {
            if (refuseDevisId) {
              handleRefuseDevis(refuseDevisId, reason)
            }
          }}
          onCancel={() => {
            setShowRefuseModal(false)
            setRefuseDevisId(null)
          }}
        />
      </Modal>

      {/* Modal Rappel */}
      <Modal
        isOpen={showRappelModal}
        onClose={() => {
          setShowRappelModal(false)
          setRappelForm({
            title: '',
            description: '',
            reminder_date: new Date().toISOString().slice(0, 10),
            reminder_time: '09:00',
            priority: 'normal',
          })
        }}
        title="Ajouter un rappel"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Titre du rappel *</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Relancer le client pour le solde"
              value={rappelForm.title}
              onChange={(e) => setRappelForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Description (optionnel)</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Notes supplémentaires..."
              value={rappelForm.description}
              onChange={(e) => setRappelForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                className="input"
                value={rappelForm.reminder_date}
                onChange={(e) => setRappelForm(prev => ({ ...prev, reminder_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Heure</label>
              <input
                type="time"
                className="input"
                value={rappelForm.reminder_time}
                onChange={(e) => setRappelForm(prev => ({ ...prev, reminder_time: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Priorité</label>
            <select
              className="input"
              value={rappelForm.priority}
              onChange={(e) => setRappelForm(prev => ({ ...prev, priority: e.target.value as typeof rappelForm.priority }))}
            >
              <option value="low">Basse</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          {/* Liste des rappels existants pour ce dossier */}
          {rappelsDossier.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Rappels existants ({rappelsDossier.length})</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {rappelsDossier.map((rappel: any) => (
                  <div key={rappel.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <Bell size={14} className={cn(
                        rappel.priority === 'urgent' && 'text-red-500',
                        rappel.priority === 'high' && 'text-orange-500',
                        rappel.priority === 'normal' && 'text-blue-500',
                        rappel.priority === 'low' && 'text-gray-400'
                      )} />
                      <span>{rappel.title}</span>
                    </div>
                    <span className="text-gray-500">
                      {new Date(rappel.reminder_date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setShowRappelModal(false)
                setRappelForm({
                  title: '',
                  description: '',
                  reminder_date: new Date().toISOString().slice(0, 10),
                  reminder_time: '09:00',
                  priority: 'normal',
                })
              }}
              className="btn btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                if (!rappelForm.title.trim()) {
                  alert('Veuillez saisir un titre')
                  return
                }
                await createRappel.mutateAsync({
                  dossier_id: dossier.id,
                  title: rappelForm.title,
                  description: rappelForm.description || undefined,
                  reminder_date: rappelForm.reminder_date,
                  reminder_time: rappelForm.reminder_time || undefined,
                  priority: rappelForm.priority,
                })
                // Ajouter à la timeline
                await addTimelineEntry.mutateAsync({
                  dossier_id: dossier.id,
                  type: 'rappel_created',
                  content: `🔔 Rappel créé : ${rappelForm.title} (${new Date(rappelForm.reminder_date).toLocaleDateString('fr-FR')})`,
                })
                setShowRappelModal(false)
                setRappelForm({
                  title: '',
                  description: '',
                  reminder_date: new Date().toISOString().slice(0, 10),
                  reminder_time: '09:00',
                  priority: 'normal',
                })
              }}
              disabled={createRappel.isPending}
              className="btn btn-primary flex-1"
            >
              {createRappel.isPending ? 'Création...' : 'Créer le rappel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Offre Flash individuelle */}
      <OffreFlashModal
        isOpen={showOffreFlashModalDetail}
        onClose={() => setShowOffreFlashModalDetail(false)}
        selectedDossiers={[dossier]}
        config={offreFlashConfigDetail}
        setConfig={setOffreFlashConfigDetail}
        onSend={() => {
          setShowOffreFlashModalDetail(false)
          queryClient.invalidateQueries({ queryKey: ['devis', 'dossier', dossier.id] })
          queryClient.invalidateQueries({ queryKey: ['dossiers'] })
        }}
      />

      {/* Modal Envoi Email */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Envoyer un email"
      >
        <SendEmailForm
          dossier={dossier}
          onClose={() => setShowEmailModal(false)}
          onSent={() => {
            addTimelineEntry.mutate({
              dossier_id: dossier.id,
              type: 'email_sent',
              content: 'Email envoyé au client',
            })
            setShowEmailModal(false)
          }}
        />
      </Modal>

      {/* Modal Envoi Facture par Email */}
      <Modal
        isOpen={showEnvoiFactureModal}
        onClose={() => {
          setShowEnvoiFactureModal(false)
          setSelectedFactureForEmail(null)
        }}
        title={`Envoyer la facture ${selectedFactureForEmail?.reference || ''}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold",
                selectedFactureForEmail?.type === 'acompte' ? "bg-amber-500" :
                selectedFactureForEmail?.type === 'avoir' ? "bg-red-500" : "bg-blue-500"
              )}>
                {selectedFactureForEmail?.type === 'acompte' ? 'AC' :
                 selectedFactureForEmail?.type === 'avoir' ? 'AV' : 'SOL'}
              </div>
              <div>
                <p className="font-medium">{selectedFactureForEmail?.reference}</p>
                <p className="text-sm text-gray-500">
                  Montant : {formatPrice(selectedFactureForEmail?.amount_ttc || 0)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Destinataire *</label>
            <input
              type="email"
              className="input"
              value={envoiFactureForm.to}
              onChange={(e) => setEnvoiFactureForm(prev => ({ ...prev, to: e.target.value }))}
              placeholder="email@client.com"
            />
          </div>

          <div>
            <label className="label">Objet *</label>
            <input
              type="text"
              className="input"
              value={envoiFactureForm.subject}
              onChange={(e) => setEnvoiFactureForm(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Message *</label>
            <textarea
              className="input min-h-[200px] font-mono text-sm"
              value={envoiFactureForm.body}
              onChange={(e) => setEnvoiFactureForm(prev => ({ ...prev, body: e.target.value }))}
            />
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note :</strong> La facture PDF sera automatiquement jointe à l'email.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setShowEnvoiFactureModal(false)
                setSelectedFactureForEmail(null)
              }}
              className="btn btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                if (!envoiFactureForm.to || !envoiFactureForm.subject || !envoiFactureForm.body) {
                  alert('Veuillez remplir tous les champs')
                  return
                }

                try {
                  // Pour l'instant, ouvrir le client mail avec mailto
                  const mailtoLink = `mailto:${envoiFactureForm.to}?subject=${encodeURIComponent(envoiFactureForm.subject)}&body=${encodeURIComponent(envoiFactureForm.body)}`
                  window.open(mailtoLink, '_blank')

                  // Enregistrer dans la timeline
                  await addTimelineEntry.mutateAsync({
                    dossier_id: dossier.id,
                    type: 'email_sent',
                    content: `📧 Facture ${selectedFactureForEmail?.reference} envoyée à ${envoiFactureForm.to}`,
                  })

                  setShowEnvoiFactureModal(false)
                  setSelectedFactureForEmail(null)
                } catch (error) {
                  console.error('Erreur:', error)
                  alert('Erreur lors de l\'envoi')
                }
              }}
              className="btn btn-primary flex-1"
            >
              <Mail size={16} />
              Envoyer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Marquer Facture comme Payée */}
      <Modal
        isOpen={showMarkFacturePaidModal}
        onClose={() => {
          setShowMarkFacturePaidModal(false)
          setSelectedFactureForPaid(null)
        }}
        title="Enregistrer le paiement"
      >
        <div className="space-y-4">
          {/* Info facture */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold",
                selectedFactureForPaid?.type === 'acompte' ? "bg-amber-500" :
                selectedFactureForPaid?.type === 'avoir' ? "bg-red-500" : "bg-blue-500"
              )}>
                {selectedFactureForPaid?.type === 'acompte' ? 'AC' :
                 selectedFactureForPaid?.type === 'avoir' ? 'AV' : 'SOL'}
              </div>
              <div>
                <p className="font-semibold text-lg">{selectedFactureForPaid?.reference}</p>
                <p className="text-gray-600">
                  {selectedFactureForPaid?.type === 'acompte' ? "Facture d'acompte" :
                   selectedFactureForPaid?.type === 'avoir' ? "Avoir" : "Facture de solde"}
                </p>
              </div>
            </div>
          </div>

          {/* Montant total */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Montant total</span>
              <span className="text-2xl font-bold text-green-700">
                {formatPrice(selectedFactureForPaid?.amount_ttc || 0)}
              </span>
            </div>
          </div>

          {/* Type de paiement */}
          <div>
            <label className="label">Type de paiement *</label>
            <select
              className="input"
              value={markPaidForm.type}
              onChange={(e) => setMarkPaidForm(prev => ({ ...prev, type: e.target.value as any }))}
            >
              <option value="virement">Virement bancaire</option>
              <option value="cb">Carte bancaire</option>
              <option value="cheque">Chèque</option>
              <option value="especes">Espèces</option>
            </select>
          </div>

          {/* Date de paiement */}
          <div>
            <label className="label">Date du paiement *</label>
            <input
              type="date"
              className="input"
              value={markPaidForm.payment_date}
              onChange={(e) => setMarkPaidForm(prev => ({ ...prev, payment_date: e.target.value }))}
            />
          </div>

          {/* Référence */}
          <div>
            <label className="label">Référence (optionnel)</label>
            <input
              type="text"
              className="input"
              value={markPaidForm.reference}
              onChange={(e) => setMarkPaidForm(prev => ({ ...prev, reference: e.target.value }))}
              placeholder="Ex: VIR-12345, CHQ-67890..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes (optionnel)</label>
            <textarea
              className="input min-h-[80px]"
              value={markPaidForm.notes}
              onChange={(e) => setMarkPaidForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Informations complémentaires..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setShowMarkFacturePaidModal(false)
                setSelectedFactureForPaid(null)
              }}
              className="btn btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              onClick={handleMarkFacturePaid}
              className="btn btn-success flex-1"
            >
              <CheckCircle size={16} />
              Valider le paiement
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Générer un Avoir */}
      <Modal
        isOpen={showAvoirModal}
        onClose={() => {
          setShowAvoirModal(false)
          setSelectedFactureForAvoir(null)
        }}
        title="Générer un avoir"
      >
        <div className="space-y-4">
          {/* Info facture d'origine */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold",
                selectedFactureForAvoir?.type === 'acompte' ? "bg-amber-500" : "bg-blue-500"
              )}>
                {selectedFactureForAvoir?.type === 'acompte' ? 'AC' : 'SOL'}
              </div>
              <div>
                <p className="font-semibold text-lg">{selectedFactureForAvoir?.reference}</p>
                <p className="text-gray-600">
                  Montant: {formatPrice(selectedFactureForAvoir?.amount_ttc || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Type d'avoir */}
          <div>
            <label className="label">Type d'avoir *</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="avoir_type"
                  value="total"
                  checked={avoirForm.type === 'total'}
                  onChange={() => setAvoirForm(prev => ({ ...prev, type: 'total', amount: selectedFactureForAvoir?.amount_ttc || 0 }))}
                  className="text-purple-600"
                />
                <span>Avoir total</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="avoir_type"
                  value="partiel"
                  checked={avoirForm.type === 'partiel'}
                  onChange={() => setAvoirForm(prev => ({ ...prev, type: 'partiel' }))}
                  className="text-purple-600"
                />
                <span>Avoir partiel</span>
              </label>
            </div>
          </div>

          {/* Montant (si partiel) */}
          {avoirForm.type === 'partiel' && (
            <div>
              <label className="label">Montant de l'avoir *</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedFactureForAvoir?.amount_ttc || 0}
                  className="input pr-8"
                  value={avoirForm.amount}
                  onChange={(e) => setAvoirForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {formatPrice(selectedFactureForAvoir?.amount_ttc || 0)}
              </p>
            </div>
          )}

          {/* Montant total affiché */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-orange-700 font-medium">Montant de l'avoir</span>
              <span className="text-2xl font-bold text-orange-700">
                -{formatPrice(avoirForm.type === 'total' ? (selectedFactureForAvoir?.amount_ttc || 0) : avoirForm.amount)}
              </span>
            </div>
          </div>

          {/* Option impact dossier */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={avoirForm.impactDossier}
                onChange={(e) => setAvoirForm(prev => ({ ...prev, impactDossier: e.target.checked }))}
                className="mt-1 text-blue-600"
              />
              <div>
                <span className="font-medium text-blue-900">Remise commerciale (impacte le dossier)</span>
                <p className="text-sm text-blue-700 mt-1">
                  Si coché, le prix de vente et la marge du dossier seront mis à jour.
                  Utilisez cette option pour accorder une remise au client.
                </p>
                {avoirForm.impactDossier && (
                  <div className="mt-2 p-2 bg-blue-100 rounded text-sm">
                    <p className="text-blue-800">
                      <strong>Nouveau prix TTC :</strong> {formatPrice(Math.max(0, (dossier?.price_ttc || 0) - (avoirForm.type === 'total' ? (selectedFactureForAvoir?.amount_ttc || 0) : avoirForm.amount)))}
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Motif */}
          <div>
            <label className="label">Motif de l'avoir</label>
            <textarea
              className="input min-h-[80px]"
              value={avoirForm.motif}
              onChange={(e) => setAvoirForm(prev => ({ ...prev, motif: e.target.value }))}
              placeholder="Ex: Annulation de prestation, remise commerciale, erreur de facturation..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setShowAvoirModal(false)
                setSelectedFactureForAvoir(null)
              }}
              className="btn btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateAvoir}
              disabled={creatingAvoir || (avoirForm.type === 'partiel' && avoirForm.amount <= 0)}
              className="btn btn-primary flex-1"
            >
              {creatingAvoir ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  Générer l'avoir
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Demande Fournisseur */}
      <Modal
        isOpen={showDemandeFournisseurModal}
        onClose={() => {
          setShowDemandeFournisseurModal(false)
          setSelectedTransporteursDF([])
          setCategoryFilterDF('')
          setSearchDF('')
        }}
        title="Demande Fournisseur"
        size="lg"
      >
        <div className="space-y-4">
          {/* Info dossier */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold">{dossier.reference}</p>
            <p className="text-sm text-gray-500">
              {dossier.departure} → {dossier.arrival}
            </p>
            <p className="text-sm text-gray-500">
              {formatDate(dossier.departure_date)} - {dossier.passengers} passagers
            </p>
          </div>

          {/* Recherche et filtre */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rechercher</label>
              <input
                type="text"
                value={searchDF}
                onChange={(e) => setSearchDF(e.target.value)}
                placeholder="Nom, ville, tag..."
                className="input"
              />
            </div>
            <div>
              <label className="label">Filtrer par tag</label>
              <select
                value={categoryFilterDF}
                onChange={(e) => setCategoryFilterDF(e.target.value)}
                className="input"
              >
                <option value="">Tous</option>
                {[...new Set(transporteurs.flatMap((t: any) => [...(t.categories || []), ...(t.tags || [])]))].sort().map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sélection transporteurs */}
          <div>
            <label className="label">Fournisseurs</label>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {transporteurs
                .filter((t: any) => {
                  if (t.active === false || t.is_active === false) return false
                  // Filtre par catégorie/tag
                  if (categoryFilterDF && !t.categories?.includes(categoryFilterDF) && !t.tags?.includes(categoryFilterDF)) return false
                  // Filtre par recherche textuelle
                  if (searchDF) {
                    const search = searchDF.toLowerCase()
                    const matchName = t.name?.toLowerCase().includes(search)
                    const matchCity = t.city?.toLowerCase().includes(search)
                    const matchNumber = t.number?.toLowerCase().includes(search)
                    const matchTags = t.tags?.some((tag: string) => tag.toLowerCase().includes(search))
                    const matchCategories = t.categories?.some((cat: string) => cat.toLowerCase().includes(search))
                    if (!matchName && !matchCity && !matchNumber && !matchTags && !matchCategories) return false
                  }
                  return true
                })
                .map((t: any) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTransporteursDF.includes(t.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTransporteursDF([...selectedTransporteursDF, t.id])
                        } else {
                          setSelectedTransporteursDF(selectedTransporteursDF.filter((id) => id !== t.id))
                        }
                      }}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.number} - {t.city || 'N/A'}</p>
                    </div>
                    {t.rating > 0 && (
                      <span className="text-xs text-yellow-500">{'★'.repeat(Math.floor(t.rating))}</span>
                    )}
                  </label>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={async () => {
                // Générer le message depuis le template BDD
                const d = dossier
                try {
                  const emailData = await generateDemandePrixEmailFromTemplate({
                    transporteurEmail: '',
                    dossierReference: d.reference || '',
                    departureCity: d.departure,
                    arrivalCity: d.arrival,
                    departureDate: d.departure_date,
                    returnDate: d.return_date,
                    departureTime: d.departure_time,
                    returnTime: d.return_time,
                    tripMode: d.trip_mode,
                    passengers: d.passengers,
                    vehicleType: d.vehicle_type,
                    departureAddress: d.departure_address,
                    arrivalAddress: d.arrival_address,
                    specialRequests: d.special_requests,
                    luggageType: d.luggage_type,
                    madDetails: extractMadDetails(d.special_requests),
                  })
                  setMessageTemplateDF(emailData.body)
                } catch (error) {
                  console.error('Erreur chargement template:', error)
                  // Fallback sur un template basique
                  const tripModeLabels: Record<string, string> = {
                    'aller_simple': 'Aller simple',
                    'one-way': 'Aller simple',
                    'aller_retour': 'Aller-Retour',
                    'round-trip': 'Aller-Retour',
                    'circuit': 'Circuit',
                    'mise-a-dispo': 'Mise à disposition',
                    'Aller simple': 'Aller simple',
                    'Aller-Retour 1 jour': 'Aller-Retour 1 jour',
                    'Aller-Retour sans mise à disposition': 'Aller-Retour sans mise à disposition',
                    'Aller-Retour avec mise à disposition': 'Aller-Retour avec mise à disposition',
                  }
                  const tripModeLabel = tripModeLabels[d.trip_mode || ''] || d.trip_mode || ''
                  const nbCars = calculateNumberOfCars(d.passengers || 1, d.vehicle_type || 'standard')
                  const madDetailsText = extractMadDetails(d.special_requests)
                  setMessageTemplateDF(`Bonjour,

Pouvez-vous me faire une proposition pour la prestation suivante :

Trajet : ${d.departure} → ${d.arrival}
Date départ : ${formatDate(d.departure_date)}${d.departure_time ? ` à ${d.departure_time}` : ''}
${d.return_date ? `Date retour : ${formatDate(d.return_date)}${d.return_time ? ` à ${d.return_time}` : ''}\n` : ''}Type : ${tripModeLabel}
Passagers : ${d.passengers}
Nombre de cars : ${nbCars}
${d.luggage_type ? `Bagages : ${d.luggage_type}` : ''}

${d.departure_address ? `Adresse départ : ${d.departure_address}` : ''}
${d.arrival_address ? `Adresse arrivée : ${d.arrival_address}` : ''}
${madDetailsText ? `\nDétail mise à disposition :\n${madDetailsText}` : ''}

${d.special_requests ? `Remarques : ${d.special_requests}` : ''}

Merci de me faire parvenir votre meilleur tarif.

Cordialement,
L'équipe Busmoov`)
                }
                setShowPreviewDF(true)
              }}
              disabled={selectedTransporteursDF.length === 0}
              className="btn btn-primary flex-1"
            >
              <Eye size={16} />
              Prévisualiser ({selectedTransporteursDF.length})
            </button>
            <button
              onClick={() => {
                setShowDemandeFournisseurModal(false)
                setSelectedTransporteursDF([])
                setCategoryFilterDF('')
                setSearchDF('')
              }}
              className="btn btn-outline"
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Prévisualisation Demande Fournisseur */}
      <Modal
        isOpen={showPreviewDF}
        onClose={() => setShowPreviewDF(false)}
        title="Prévisualisation de la demande"
        size="lg"
      >
        <div className="space-y-4">
          {/* Destinataires */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Destinataires ({selectedTransporteursDF.length}) :
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedTransporteursDF.map((id) => {
                const t = transporteurs.find((tr: any) => tr.id === id)
                return t ? (
                  <span key={id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {t.name}
                  </span>
                ) : null
              })}
            </div>
          </div>

          {/* Message modifiable */}
          <div>
            <label className="label">Message (note interne)</label>
            <textarea
              className="input min-h-[150px] font-mono text-sm"
              value={messageTemplateDF}
              onChange={(e) => setMessageTemplateDF(e.target.value)}
              placeholder="Note interne (optionnel)"
            />
          </div>

          {/* Aperçu de l'email */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
              <Mail size={16} />
              Aperçu de l'email envoyé aux transporteurs :
            </p>
            <div className="bg-white p-4 rounded border text-sm space-y-2">
              <p><strong>Objet :</strong> Demande de tarif - {dossier.departure} → {dossier.arrival} le {formatDate(dossier.departure_date)}</p>
              <hr className="my-2" />
              <p>Bonjour,</p>
              <p>Nous avons une demande de transport pour laquelle nous aimerions recevoir votre meilleur tarif.</p>
              <div className="bg-gray-50 p-3 rounded my-2 space-y-1">
                <p><strong>Trajet :</strong> {dossier.departure} → {dossier.arrival}</p>
                <p><strong>Type :</strong> {getTripModeLabel(dossier.trip_mode)}</p>
                <p><strong>Date aller :</strong> {formatDate(dossier.departure_date)} à {dossier.departure_time || '--:--'}</p>
                {dossier.return_date && (
                  <p><strong>Date retour :</strong> {formatDate(dossier.return_date)} à {dossier.return_time || '--:--'}</p>
                )}
                <p><strong>Passagers :</strong> {dossier.passengers} personnes</p>
                {dossier.vehicle_type && (
                  <p><strong>Véhicule :</strong> {getVehicleTypeLabel(dossier.vehicle_type)}</p>
                )}
                {dossier.nombre_cars && dossier.nombre_cars > 1 && (
                  <p><strong>Nombre de cars :</strong> {dossier.nombre_cars}</p>
                )}
                {/* Détail MAD si circuit */}
                {dossier.trip_mode === 'circuit' && extractMadDetails(dossier.special_requests) && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p><strong>Détail mise à disposition :</strong></p>
                    <p className="text-gray-600 whitespace-pre-wrap text-xs mt-1">{extractMadDetails(dossier.special_requests)}</p>
                  </div>
                )}
                {/* Autres demandes spéciales (hors MAD) */}
                {dossier.special_requests && !dossier.special_requests.includes('=== DÉTAIL MISE À DISPOSITION ===') && (
                  <p><strong>Remarques :</strong> {dossier.special_requests}</p>
                )}
              </div>
              <div className="bg-magenta/10 p-3 rounded border border-magenta/30 text-center">
                <p className="text-magenta font-semibold">🔗 Lien personnalisé par transporteur</p>
                <p className="text-xs text-gray-500 mt-1">
                  {getSiteBaseUrl()}/fournisseur/proposition-tarif?token=XXXX&demande=YYYY
                </p>
                <p className="text-xs text-gray-400 mt-1">(Un lien unique sera généré pour chaque transporteur)</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={async () => {
                try {
                  // Récupérer les infos des transporteurs
                  const transporteursInfos = selectedTransporteursDF.map(id => {
                    const t = transporteurs.find((tr: any) => tr.id === id)
                    return { id, name: t?.name || 'Inconnu', email: t?.email || null }
                  })

                  // Récupérer le devis accepté pour avoir les infos véhicule
                  const devisAccepte = dossier.devis?.find((d: any) => d.status === 'accepted') || dossier.devis?.[0]

                  const baseUrl = window.location.origin

                  for (const transporteur of transporteursInfos) {
                    // Générer un token unique pour chaque demande
                    const token = generateChauffeurToken()

                    // Créer la demande fournisseur avec le token
                    const demande = await createDemandeFournisseur.mutateAsync({
                      dossier_id: dossier.id,
                      transporteur_id: transporteur.id,
                      status: 'sent',
                      sent_at: new Date().toISOString(),
                      note_interne: messageTemplateDF,
                      validation_token: token,
                    })

                    // Construire le lien de proposition tarif
                    const lienPropositionTarif = `${baseUrl}/fournisseur/proposition-tarif?token=${token}&demande=${demande.id}`

                    // Envoyer l'email au transporteur si email disponible
                    if (transporteur.email) {
                      await supabase.functions.invoke('send-email', {
                        body: {
                          type: 'demande_tarif_fournisseur',
                          to: transporteur.email,
                          data: {
                            reference: dossier.reference,
                            departure: dossier.departure,
                            arrival: dossier.arrival,
                            departure_date: formatDate(dossier.departure_date),
                            departure_time: dossier.departure_time || '--:--',
                            return_date: dossier.return_date ? formatDate(dossier.return_date) : 'Non défini',
                            return_time: dossier.return_time || '--:--',
                            passengers: dossier.passengers?.toString() || '0',
                            vehicle_type: devisAccepte?.vehicle_type || 'standard',
                            nb_cars: devisAccepte?.nombre_cars?.toString() || '1',
                            lien_proposition_tarif: lienPropositionTarif,
                            dossier_id: dossier.id,
                          },
                        },
                      })
                    }
                  }

                  addTimelineEntry.mutate({
                    dossier_id: dossier.id,
                    type: 'email_sent',
                    content: `📋 Demande de tarif envoyée à ${transporteursInfos.length} transporteur(s) : ${transporteursInfos.map(t => t.name).join(', ')}`,
                  })
                  setShowPreviewDF(false)
                  setShowDemandeFournisseurModal(false)
                  setSelectedTransporteursDF([])
                  setCategoryFilterDF('')
                  setSearchDF('')
                  setMessageTemplateDF('')
                  alert(`Demandes de tarif envoyées à ${transporteursInfos.length} transporteur(s) !`)
                } catch (error) {
                  console.error('Erreur:', error)
                  alert('Erreur lors de l\'envoi des demandes')
                }
              }}
              className="btn btn-primary flex-1"
            >
              <Send size={16} />
              Envoyer par email
            </button>
            <button
              onClick={async () => {
                try {
                  // Récupérer les noms des transporteurs
                  const transporteursNames = selectedTransporteursDF.map(id => {
                    const t = transporteurs.find((tr: any) => tr.id === id)
                    return t?.name || 'Inconnu'
                  })

                  for (const transporteurId of selectedTransporteursDF) {
                    // Générer un token unique même sans envoi d'email
                    const token = generateChauffeurToken()
                    await createDemandeFournisseur.mutateAsync({
                      dossier_id: dossier.id,
                      transporteur_id: transporteurId,
                      status: 'pending',
                      note_interne: messageTemplateDF,
                      validation_token: token,
                    })
                  }
                  addTimelineEntry.mutate({
                    dossier_id: dossier.id,
                    type: 'note',
                    content: `📋 Demande fournisseur créée pour ${selectedTransporteursDF.length} transporteur(s) : ${transporteursNames.join(', ')}`,
                  })
                  setShowPreviewDF(false)
                  setShowDemandeFournisseurModal(false)
                  setSelectedTransporteursDF([])
                  setCategoryFilterDF('')
                  setSearchDF('')
                  setMessageTemplateDF('')
                } catch (error) {
                  console.error('Erreur:', error)
                }
              }}
              className="btn btn-outline"
            >
              Créer sans envoyer
            </button>
            <button onClick={() => setShowPreviewDF(false)} className="btn btn-outline">
              Retour
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Demande Contact Chauffeur */}
      <DemandeContactChauffeurModal
        isOpen={showDemandeContactChauffeurModal}
        onClose={() => setShowDemandeContactChauffeurModal(false)}
        dossier={dossier}
        transporteur={transporteurs.find((t: Transporteur) => t.id === dossier.transporteur_id) || null}
        voyageInfo={voyageInfo || null}
      />

      {/* Modal Saisie Manuelle Infos Chauffeur */}
      <Modal
        isOpen={showChauffeurManuelModal}
        onClose={() => setShowChauffeurManuelModal(false)}
        title={`Saisir les informations chauffeur${chauffeursAllerForm.length > 1 ? ` (${chauffeursAllerForm.length} cars)` : ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowChauffeurManuelModal(false)}>
              Annuler
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveChauffeurManuel}
              disabled={savingChauffeurManuel || !chauffeursAllerForm[0]?.nom}
            >
              {savingChauffeurManuel ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </>
        }
      >
        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Section Aller */}
          <div>
            <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Truck size={18} />
              Trajet Aller
            </h3>
            <div className="space-y-4">
              {chauffeursAllerForm.map((chauffeur, index) => (
                <div key={index} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="font-medium text-blue-700 mb-3">
                    {chauffeursAllerForm.length > 1 ? `Car ${index + 1}` : 'Chauffeur'}
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Nom du chauffeur {index === 0 && '*'}</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Ex: Jean Dupont"
                        value={chauffeur.nom}
                        onChange={(e) => {
                          const updated = [...chauffeursAllerForm]
                          updated[index] = { ...updated[index], nom: e.target.value }
                          setChauffeursAllerForm(updated)
                        }}
                      />
                    </div>
                    <div>
                      <label className="label">Téléphone</label>
                      <input
                        type="tel"
                        className="input"
                        placeholder="Ex: 06 12 34 56 78"
                        value={chauffeur.tel}
                        onChange={(e) => {
                          const updated = [...chauffeursAllerForm]
                          updated[index] = { ...updated[index], tel: e.target.value }
                          setChauffeursAllerForm(updated)
                        }}
                      />
                    </div>
                    <div>
                      <label className="label">Immatriculation</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Ex: AB-123-CD"
                        value={chauffeur.immatriculation}
                        onChange={(e) => {
                          const updated = [...chauffeursAllerForm]
                          updated[index] = { ...updated[index], immatriculation: e.target.value }
                          setChauffeursAllerForm(updated)
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Option même chauffeur retour */}
          {voyageInfo?.feuille_route_type === 'aller_retour' && (
            <>
              <div className="flex items-center gap-2 py-2 border-t border-b border-gray-200">
                <input
                  type="checkbox"
                  id="meme_chauffeur"
                  checked={memeChauffeursRetour}
                  onChange={(e) => setMemeChauffeursRetour(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="meme_chauffeur" className="text-sm text-gray-700">
                  {chauffeursAllerForm.length > 1
                    ? 'Mêmes chauffeurs pour le retour'
                    : 'Même chauffeur pour le retour'}
                </label>
              </div>

              {/* Section Retour (si différent) */}
              {!memeChauffeursRetour && (
                <div>
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Truck size={18} />
                    Trajet Retour
                  </h3>
                  <div className="space-y-4">
                    {chauffeursRetourForm.map((chauffeur, index) => (
                      <div key={index} className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <h4 className="font-medium text-green-700 mb-3">
                          {chauffeursRetourForm.length > 1 ? `Car ${index + 1}` : 'Chauffeur'}
                        </h4>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="label">Nom du chauffeur</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="Ex: Jean Dupont"
                              value={chauffeur.nom}
                              onChange={(e) => {
                                const updated = [...chauffeursRetourForm]
                                updated[index] = { ...updated[index], nom: e.target.value }
                                setChauffeursRetourForm(updated)
                              }}
                            />
                          </div>
                          <div>
                            <label className="label">Téléphone</label>
                            <input
                              type="tel"
                              className="input"
                              placeholder="Ex: 06 12 34 56 78"
                              value={chauffeur.tel}
                              onChange={(e) => {
                                const updated = [...chauffeursRetourForm]
                                updated[index] = { ...updated[index], tel: e.target.value }
                                setChauffeursRetourForm(updated)
                              }}
                            />
                          </div>
                          <div>
                            <label className="label">Immatriculation</label>
                            <input
                              type="text"
                              className="input"
                              placeholder="Ex: AB-123-CD"
                              value={chauffeur.immatriculation}
                              onChange={(e) => {
                                const updated = [...chauffeursRetourForm]
                                updated[index] = { ...updated[index], immatriculation: e.target.value }
                                setChauffeursRetourForm(updated)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Numéro d'astreinte */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <Phone size={18} />
              Numéro d'astreinte
            </h3>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <label className="label">Téléphone astreinte (urgences)</label>
              <input
                type="tel"
                className="input"
                placeholder="Ex: 06 00 00 00 00"
                value={astreinteTelForm}
                onChange={(e) => setAstreinteTelForm(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Numéro à contacter en cas d'urgence pendant le voyage
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500 italic">
            Ces informations seront utilisées pour générer la feuille de route du client.
          </p>
        </div>
      </Modal>

      {/* Modal ajout paiement */}
      <Modal
        isOpen={showPaiementModal}
        onClose={() => setShowPaiementModal(false)}
        title="Ajouter un paiement"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowPaiementModal(false)}>
              Annuler
            </button>
            <button
              className="btn btn-success"
              onClick={handleAddPaiement}
              disabled={createPaiement.isPending || paiementForm.amount === 0}
            >
              {createPaiement.isPending ? 'Ajout...' : 'Ajouter'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Type de paiement *</label>
            <select
              className="input"
              value={paiementForm.type}
              onChange={(e) => setPaiementForm({ ...paiementForm, type: e.target.value as any })}
            >
              <option value="virement">Virement</option>
              <option value="cb">Carte bancaire</option>
              <option value="especes">Espèces</option>
              <option value="cheque">Chèque</option>
              <option value="remboursement">Remboursement</option>
            </select>
          </div>
          <div>
            <label className="label">Montant * {paiementForm.type === 'remboursement' && '(sera déduit)'}</label>
            <input
              type="number"
              className="input"
              value={paiementForm.amount}
              onChange={(e) => setPaiementForm({ ...paiementForm, amount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="label">Date du paiement *</label>
            <input
              type="datetime-local"
              className="input"
              value={paiementForm.payment_date}
              onChange={(e) => setPaiementForm({ ...paiementForm, payment_date: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Référence (optionnel)</label>
            <input
              type="text"
              className="input"
              placeholder="N° de transaction, référence virement..."
              value={paiementForm.reference}
              onChange={(e) => setPaiementForm({ ...paiementForm, reference: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Notes (optionnel)</label>
            <textarea
              className="input min-h-16"
              placeholder="Remarques sur ce paiement..."
              value={paiementForm.notes}
              onChange={(e) => setPaiementForm({ ...paiementForm, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Modal génération facture */}
      <Modal
        isOpen={showFactureModal}
        onClose={() => setShowFactureModal(false)}
        title="Générer une facture"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowFactureModal(false)}>
              Annuler
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateFacture}
              disabled={createFacture.isPending}
            >
              {createFacture.isPending ? 'Génération...' : 'Générer la facture'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Type de facture *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  const acompte = contrat?.acompte_amount || 0
                  setFactureForm({ ...factureForm, type: 'acompte', amount_ttc: acompte, useAutoAmount: true })
                }}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-all",
                  factureForm.type === 'acompte'
                    ? "border-amber-500 bg-amber-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                    AC
                  </div>
                  <div>
                    <p className="font-medium text-sm">Acompte</p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(contrat?.acompte_amount || 0)}
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  const solde = contrat?.solde_amount || ((contrat?.price_ttc || 0) - (contrat?.acompte_amount || 0))
                  setFactureForm({ ...factureForm, type: 'solde', amount_ttc: solde, useAutoAmount: true })
                }}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-all",
                  factureForm.type === 'solde'
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                    SOL
                  </div>
                  <div>
                    <p className="font-medium text-sm">Solde</p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(contrat?.solde_amount || ((contrat?.price_ttc || 0) - (contrat?.acompte_amount || 0)))}
                    </p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFactureForm({ ...factureForm, type: 'avoir', amount_ttc: 0, useAutoAmount: false })
                }}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-all",
                  factureForm.type === 'avoir'
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                    AV
                  </div>
                  <div>
                    <p className="font-medium text-sm">Avoir</p>
                    <p className="text-xs text-gray-500">Remboursement</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="label">Montant {factureForm.type === 'avoir' ? '(sera négatif)' : ''}</label>
            <div className="space-y-2">
              {factureForm.type !== 'avoir' && (
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="montant_mode_dossier"
                    checked={factureForm.useAutoAmount}
                    onChange={() => setFactureForm({ ...factureForm, useAutoAmount: true })}
                    className="accent-magenta"
                  />
                  <span>
                    Montant automatique : <strong>
                      {formatPrice(
                        factureForm.type === 'acompte'
                          ? (contrat?.acompte_amount || 0)
                          : (contrat?.solde_amount || ((contrat?.price_ttc || 0) - (contrat?.acompte_amount || 0)))
                      )}
                    </strong>
                  </span>
                </label>
              )}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="montant_mode_dossier"
                  checked={!factureForm.useAutoAmount || factureForm.type === 'avoir'}
                  onChange={() => setFactureForm({ ...factureForm, useAutoAmount: false })}
                  className="accent-magenta"
                />
                <span>Montant personnalisé</span>
              </label>
              {(!factureForm.useAutoAmount || factureForm.type === 'avoir') && (
                <div className="ml-6">
                  <input
                    type="number"
                    className="input"
                    placeholder="Montant TTC"
                    value={factureForm.amount_ttc}
                    onChange={(e) => setFactureForm({ ...factureForm, amount_ttc: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    HT : {formatPrice(factureForm.amount_ttc / (1 + (dossier.tva_rate || 10) / 100))} (TVA {dossier.tva_rate || 10}%)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Infos client pour facturation */}
          <div>
            <label className="label flex items-center gap-2">
              Client facturé
              <span className="text-xs text-gray-400 font-normal">(modifiable)</span>
            </label>
            <div className="space-y-2">
              <input
                type="text"
                className="input"
                placeholder="Nom du client"
                value={factureForm.client_name}
                onChange={(e) => setFactureForm({ ...factureForm, client_name: e.target.value })}
              />
              <input
                type="text"
                className="input"
                placeholder="Adresse"
                value={factureForm.client_address}
                onChange={(e) => setFactureForm({ ...factureForm, client_address: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  className="input"
                  placeholder="Code postal"
                  value={factureForm.client_zip}
                  onChange={(e) => setFactureForm({ ...factureForm, client_zip: e.target.value })}
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Ville"
                  value={factureForm.client_city}
                  onChange={(e) => setFactureForm({ ...factureForm, client_city: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Résumé */}
          <div className={cn(
            "rounded-lg p-4",
            factureForm.type === 'avoir' ? "bg-red-50" : "bg-gray-50"
          )}>
            <h4 className="font-medium mb-2">Récapitulatif</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Type :</span>
                <span className="font-medium">
                  {factureForm.type === 'acompte' ? 'Facture d\'acompte' : factureForm.type === 'avoir' ? 'Avoir' : 'Facture de solde'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Montant TTC :</span>
                <span className={cn("font-bold text-lg", factureForm.type === 'avoir' && "text-red-600")}>
                  {factureForm.type === 'avoir' && '-'}
                  {formatPrice(
                    (factureForm.useAutoAmount && factureForm.type !== 'avoir')
                      ? (factureForm.type === 'acompte'
                          ? (contrat?.acompte_amount || 0)
                          : (contrat?.solde_amount || ((contrat?.price_ttc || 0) - (contrat?.acompte_amount || 0))))
                      : factureForm.amount_ttc
                  )}
                </span>
              </div>
              {factureForm.client_name && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Client :</span>
                  <span className="font-medium">{factureForm.client_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal paiement fournisseur */}
      <Modal
        isOpen={showPaiementFournisseurModal}
        onClose={() => setShowPaiementFournisseurModal(false)}
        title="Payer le fournisseur"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowPaiementFournisseurModal(false)}>
              Annuler
            </button>
            <button
              className="btn bg-orange-500 hover:bg-orange-600 text-white"
              onClick={async () => {
                if (!dossier.transporteur_id) {
                  alert('Aucun transporteur assigné à ce dossier')
                  return
                }
                if (paiementFournisseurForm.amount <= 0) {
                  alert('Veuillez entrer un montant valide')
                  return
                }
                try {
                  await createPaiementFournisseur.mutateAsync({
                    dossier_id: dossier.id,
                    transporteur_id: dossier.transporteur_id,
                    amount: paiementFournisseurForm.amount,
                    payment_date: paiementFournisseurForm.payment_date,
                    type: paiementFournisseurForm.type,
                    reference: paiementFournisseurForm.reference || undefined,
                    notes: paiementFournisseurForm.notes || undefined,
                  })
                  await addTimelineEntry.mutateAsync({
                    dossier_id: dossier.id,
                    type: 'paiement_fournisseur',
                    content: `Paiement fournisseur de ${formatPrice(paiementFournisseurForm.amount)} (${paiementFournisseurForm.type})`,
                  })
                  setShowPaiementFournisseurModal(false)
                  queryClient.invalidateQueries({ queryKey: ['paiements_fournisseurs'] })
                } catch (error) {
                  console.error('Erreur:', error)
                  alert('Erreur lors de l\'ajout du paiement')
                }
              }}
              disabled={createPaiementFournisseur.isPending || paiementFournisseurForm.amount <= 0}
            >
              {createPaiementFournisseur.isPending ? 'Ajout...' : 'Enregistrer le paiement'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Info transporteur */}
          {dossier.transporteur && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <span className="bg-purple text-white text-xs font-bold px-2 py-1 rounded">
                {dossier.transporteur.number}
              </span>
              <div>
                <p className="font-medium">{dossier.transporteur.name}</p>
                <p className="text-sm text-gray-500">Prix achat HT : {formatPrice(dossier.price_achat || 0)}</p>
              </div>
            </div>
          )}

          {/* Résumé */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Déjà payé</p>
              <p className="font-bold text-orange-600">{formatPrice(totalPaiementsFournisseur)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reste à payer</p>
              <p className={cn("font-bold", resteAPayerFournisseur > 0 ? "text-red-600" : "text-green-600")}>
                {formatPrice(resteAPayerFournisseur)}
              </p>
            </div>
          </div>

          <div>
            <label className="label">Type de paiement *</label>
            <select
              className="input"
              value={paiementFournisseurForm.type}
              onChange={(e) => setPaiementFournisseurForm({ ...paiementFournisseurForm, type: e.target.value as any })}
            >
              <option value="virement">Virement bancaire</option>
              <option value="cb">Carte bancaire</option>
              <option value="cheque">Chèque</option>
              <option value="especes">Espèces</option>
            </select>
          </div>

          <div>
            <label className="label">Montant *</label>
            <input
              type="number"
              className="input"
              value={paiementFournisseurForm.amount}
              onChange={(e) => setPaiementFournisseurForm({ ...paiementFournisseurForm, amount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
            {resteAPayerFournisseur > 0 && (
              <button
                type="button"
                className="text-sm text-orange-600 hover:underline mt-1"
                onClick={() => setPaiementFournisseurForm({ ...paiementFournisseurForm, amount: resteAPayerFournisseur })}
              >
                Payer le solde ({formatPrice(resteAPayerFournisseur)})
              </button>
            )}
          </div>

          <div>
            <label className="label">Date du paiement *</label>
            <input
              type="date"
              className="input"
              value={paiementFournisseurForm.payment_date}
              onChange={(e) => setPaiementFournisseurForm({ ...paiementFournisseurForm, payment_date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Référence (optionnel)</label>
            <input
              type="text"
              className="input"
              placeholder="N° de virement, référence..."
              value={paiementFournisseurForm.reference}
              onChange={(e) => setPaiementFournisseurForm({ ...paiementFournisseurForm, reference: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Notes (optionnel)</label>
            <textarea
              className="input min-h-16"
              placeholder="Remarques sur ce paiement..."
              value={paiementFournisseurForm.notes}
              onChange={(e) => setPaiementFournisseurForm({ ...paiementFournisseurForm, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Modale d'envoi de feuille de route au client */}
      <Modal
        isOpen={showFeuilleRouteEmailModal}
        onClose={() => setShowFeuilleRouteEmailModal(false)}
        title="Envoyer la feuille de route au client"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Destinataire</label>
            <input
              type="email"
              value={feuilleRouteEmailForm.to}
              onChange={(e) => setFeuilleRouteEmailForm(f => ({ ...f, to: e.target.value }))}
              className="input w-full"
              placeholder="Email du client"
            />
          </div>
          <div>
            <label className="label">Objet</label>
            <input
              type="text"
              value={feuilleRouteEmailForm.subject}
              onChange={(e) => setFeuilleRouteEmailForm(f => ({ ...f, subject: e.target.value }))}
              className="input w-full"
            />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              value={feuilleRouteEmailForm.body}
              onChange={(e) => setFeuilleRouteEmailForm(f => ({ ...f, body: e.target.value }))}
              rows={12}
              className="input w-full font-mono text-sm"
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </div>

          {/* Info pièce jointe PDF */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-2">
            <FileText size={16} className="text-blue-600 flex-shrink-0" />
            <span><strong>Pièce jointe :</strong> Le PDF "Feuille de Route" sera automatiquement joint à l'email.</span>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              onClick={() => setShowFeuilleRouteEmailModal(false)}
              className="btn btn-secondary"
              disabled={isSendingFeuilleRouteEmail}
            >
              Annuler
            </button>
            <button
              onClick={sendFeuilleRouteEmail}
              className="btn btn-primary flex items-center gap-2"
              disabled={isSendingFeuilleRouteEmail || !feuilleRouteEmailForm.to}
            >
              {isSendingFeuilleRouteEmail ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Envoyer au client
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Formulaire de refus de devis
function RefuseDevisForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (reason: string) => void
  onCancel: () => void
}) {
  const [reason, setReason] = useState('indisponibilité')
  const [customReason, setCustomReason] = useState('')

  const reasons = [
    { value: 'indisponibilité', label: 'Indisponibilité du transporteur' },
    { value: 'prix', label: 'Prix non accepté par le client' },
    { value: 'annulation_client', label: 'Annulation par le client' },
    { value: 'autre', label: 'Autre raison' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Raison du refus</label>
        <select
          className="input"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          {reasons.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {reason === 'autre' && (
        <div>
          <label className="label">Précisez</label>
          <input
            type="text"
            className="input"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Raison du refus..."
          />
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        <AlertTriangle size={16} className="inline mr-2" />
        Un email sera automatiquement envoyé au client pour l'informer.
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onCancel} className="btn btn-secondary">
          Annuler
        </button>
        <button
          onClick={() => onSubmit(reason === 'autre' ? customReason : reasons.find(r => r.value === reason)?.label || reason)}
          className="btn btn-primary"
        >
          Confirmer le refus
        </button>
      </div>
    </div>
  )
}

// Formulaire d'envoi d'email
function SendEmailForm({
  dossier,
  onClose,
  onSent,
}: {
  dossier: DossierWithRelations
  onClose: () => void
  onSent: () => void
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])

  useEffect(() => {
    const loadTemplates = async () => {
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .order('name')
      if (data) setTemplates(data)
    }
    loadTemplates()
  }, [])

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey)
    const template = templates.find(t => t.key === templateKey)
    if (template) {
      // Remplacer les variables
      let subj = template.subject
      let bod = template.body

      const vars = {
        '{{client_name}}': dossier.client_name,
        '{{reference}}': dossier.reference,
        '{{departure}}': dossier.departure,
        '{{arrival}}': dossier.arrival,
        '{{departure_date}}': formatDate(dossier.departure_date),
        '{{price_ttc}}': formatPrice(dossier.price_ttc || 0),
      }

      Object.entries(vars).forEach(([key, value]) => {
        subj = subj.replace(new RegExp(key, 'g'), value || '')
        bod = bod.replace(new RegExp(key, 'g'), value || '')
      })

      setSubject(subj)
      setBody(bod)
    }
  }

  const handleSend = async () => {
    if (!subject || !body) {
      alert('Veuillez remplir le sujet et le contenu')
      return
    }

    setSending(true)
    // TODO: Implémenter l'envoi réel via Edge Function
    // Pour l'instant, on simule l'envoi
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSending(false)
    onSent()
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Destinataire</label>
        <input
          type="text"
          className="input bg-gray-50"
          value={`${dossier.client_name} <${dossier.client_email}>`}
          readOnly
        />
      </div>

      <div>
        <label className="label">Template</label>
        <select
          className="input"
          value={selectedTemplate}
          onChange={(e) => handleTemplateChange(e.target.value)}
        >
          <option value="">-- Sélectionner un template --</option>
          {templates.map((t) => (
            <option key={t.key} value={t.key}>{t.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Sujet</label>
        <input
          type="text"
          className="input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Objet de l'email..."
        />
      </div>

      <div>
        <label className="label">Contenu</label>
        <textarea
          className="input min-h-40"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Contenu de l'email..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button onClick={onClose} className="btn btn-secondary">
          Annuler
        </button>
        <button
          onClick={handleSend}
          className="btn btn-primary"
          disabled={sending}
        >
          {sending ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>
    </div>
  )
}

// Modal pour créer un nouveau devis
// Types pour les grilles tarifaires dans NewDevisModal
interface TarifAllerSimpleNDM {
  km_min: number
  km_max: number
  prix_public: number
}

interface TarifAR1JNDM {
  km_min: number
  km_max: number
  prix_8h: number | null
  prix_10h: number | null
  prix_12h: number | null
  prix_9h_coupure: number | null
}

interface TarifARMADNDM {
  km_min: number
  km_max: number
  prix_2j: number | null
  prix_3j: number | null
  prix_4j: number | null
  prix_5j: number | null
  prix_6j: number | null
  supplement_jour: number | null
}

interface TarifARSansMADNDM {
  km_min: number
  km_max: number
  prix_2j: number | null
  prix_3j: number | null
  prix_4j: number | null
  prix_5j: number | null
  prix_6j: number | null
  supplement_jour: number | null
}

interface CoefficientVehiculeNDM {
  code: string
  label: string
  coefficient: number
}

interface CapaciteVehiculeNDM {
  code: string
  label: string
  places_min: number
  places_max: number
  coefficient: number
}

type ServiceTypeNDM = 'aller_simple' | 'ar_1j' | 'ar_mad' | 'ar_sans_mad'
type AmplitudeNDM = '8h' | '10h' | '12h' | '9h_coupure'

const SERVICE_TYPE_LABELS_NDM: Record<ServiceTypeNDM, string> = {
  aller_simple: 'Aller simple',
  ar_1j: 'Aller-retour 1 jour',
  ar_mad: 'AR avec mise à disposition',
  ar_sans_mad: 'AR sans mise à disposition',
}

const AMPLITUDE_LABELS_NDM: Record<AmplitudeNDM, string> = {
  '8h': '8 heures',
  '10h': '10 heures',
  '12h': '12 heures',
  '9h_coupure': '9h avec coupure',
}

// Les types de véhicules sont chargés depuis la table capacites_vehicules

// Extraire le détail MAD du special_requests
function extractDetailMADNDM(specialRequests: string | null | undefined): string {
  if (!specialRequests) return ''
  const madMatch = specialRequests.match(/=== DÉTAIL MISE À DISPOSITION ===\n([\s\S]*?)\n==============================/)
  if (madMatch) return madMatch[1].trim()
  return specialRequests
}

// Extrait la partie date (yyyy-mm-dd) d'une date ISO ou timestamp
function formatDateForInput(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  // Si c'est déjà au format yyyy-mm-dd, retourner tel quel
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  // Sinon extraire la partie date d'un ISO string
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/)
  return match ? match[1] : ''
}

function NewDevisModal({
  isOpen,
  onClose,
  dossier,
  transporteurs,
}: {
  isOpen: boolean
  onClose: () => void
  dossier: DossierWithRelations
  transporteurs: Transporteur[]
}) {
  const [formData, setFormData] = useState({
    transporteur_id: '',
    service_type: 'ar_1j' as ServiceTypeNDM,
    amplitude: '8h' as AmplitudeNDM,
    vehicle_type: 'standard',
    km: '',
    price_ht: 0,
    price_ttc: 0,
    price_achat_ht: 0,
    price_achat_ttc: 0,
    validity_days: 30,
    notes: '',
    client_notes: '',
    nombre_cars: 1,
    nombre_chauffeurs: 1,
    detail_mad: '',
    pax_aller: 0,
    pax_retour: 0,
    tva_rate: 10,
    // Champs override pour surcharger les données du dossier
    departure_override: '',
    arrival_override: '',
    departure_date_override: '',
    return_date_override: '',
    departure_time_override: '',
    return_time_override: '',
  })
  const [showOptions, setShowOptions] = useState(false)
  const [options, setOptions] = useState({
    peages: { status: 'inclus', montant: 0 },
    repas_chauffeur: { status: 'non_inclus', montant: 25 },
    parking: { status: 'non_inclus', montant: 0 },
    hebergement: { status: 'non_inclus', montant: 0, nuits: 0 },
  })

  // State pour les grilles tarifaires
  const [tarifsAllerSimple, setTarifsAllerSimple] = useState<TarifAllerSimpleNDM[]>([])
  const [tarifsAR1J, setTarifsAR1J] = useState<TarifAR1JNDM[]>([])
  const [tarifsARMAD, setTarifsARMAD] = useState<TarifARMADNDM[]>([])
  const [tarifsARSansMAD, setTarifsARSansMAD] = useState<TarifARSansMADNDM[]>([])
  const [coefficientsVehicules, setCoefficientsVehicules] = useState<CoefficientVehiculeNDM[]>([])
  const [capacitesVehicules, setCapacitesVehicules] = useState<CapaciteVehiculeNDM[]>([])
  const [majorationsRegions, setMajorationsRegions] = useState<PricingMajorationRegion[]>([])
  const [isLoadingTarifs, setIsLoadingTarifs] = useState(false)

  const createDevis = useCreateDevis()

  // Charger les grilles tarifaires au montage
  useEffect(() => {
    async function loadTarifs() {
      setIsLoadingTarifs(true)
      try {
        const [resAS, resAR1J, resARMAD, resARSansMAD, resCoeff, resCapacites, majorations] = await Promise.all([
          supabase.from('tarifs_aller_simple').select('*').order('km_min'),
          supabase.from('tarifs_ar_1j').select('*').order('km_min'),
          supabase.from('tarifs_ar_mad').select('*').order('km_min'),
          supabase.from('tarifs_ar_sans_mad').select('*').order('km_min'),
          supabase.from('coefficients_vehicules').select('*'),
          supabase.from('capacites_vehicules').select('*').order('places_min'),
          chargerMajorationsRegions(),
        ])
        if (resAS.data) setTarifsAllerSimple(resAS.data)
        if (resAR1J.data) setTarifsAR1J(resAR1J.data)
        if (resARMAD.data) setTarifsARMAD(resARMAD.data)
        if (resARSansMAD.data) setTarifsARSansMAD(resARSansMAD.data)
        if (resCoeff.data) setCoefficientsVehicules(resCoeff.data)
        if (resCapacites.data) setCapacitesVehicules(resCapacites.data.map((c: any) => ({
          code: c.code,
          label: c.label,
          places_min: c.places_min,
          places_max: c.places_max,
          coefficient: parseFloat(c.coefficient),
        })))
        setMajorationsRegions(majorations)
      } catch (err) {
        console.error('Erreur chargement tarifs:', err)
      } finally {
        setIsLoadingTarifs(false)
      }
    }
    if (isOpen) loadTarifs()
  }, [isOpen])

  // State pour indiquer le chargement de la distance
  const [isLoadingDistance, setIsLoadingDistance] = useState(false)

  // Initialiser depuis le dossier
  useEffect(() => {
    if (dossier && isOpen) {
      // Détecter le type de service
      let serviceType: ServiceTypeNDM = 'ar_1j'
      if (dossier.trip_mode === 'one-way' || dossier.trip_mode === 'aller_simple') {
        serviceType = 'aller_simple'
      } else if (dossier.trip_mode === 'circuit' || dossier.trip_mode === 'mise-a-dispo') {
        serviceType = 'ar_mad'
      } else if (dossier.return_date && dossier.departure_date) {
        // Comparer les dates comme strings pour éviter les problèmes de timezone
        const depDateStr = dossier.departure_date.split('T')[0]
        const retDateStr = dossier.return_date.split('T')[0]
        if (depDateStr === retDateStr) {
          serviceType = 'ar_1j'
        } else {
          const depDate = new Date(dossier.departure_date)
          const retDate = new Date(dossier.return_date)
          const diffDays = Math.round((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDays <= 1) serviceType = 'ar_1j'
          else serviceType = 'ar_sans_mad'
        }
      }

      // Extraire détail MAD
      const detailMAD = extractDetailMADNDM(dossier.special_requests)

      // Calculer l'amplitude à partir des horaires du dossier
      const calculatedAmplitude = calculateAmplitudeFromTimes(dossier.departure_time, dossier.return_time)

      // Déterminer automatiquement le type de véhicule selon le nombre de passagers
      // Si le dossier a déjà un type défini ET qu'il est cohérent avec le nb de pax, on le garde
      // Sinon on auto-sélectionne le bon type
      const determineVehicleType = (pax: number, existingType?: string | null): string => {
        // Normaliser le type existant (convertir les labels en codes)
        const typeMapping: Record<string, string> = {
          'Minibus': 'minibus',
          'Grand Car': 'standard',
          'Autocar': 'standard',
          'Autocar Standard': 'standard',
          'autocar': 'standard',
          'autocar-standard': 'standard',
          'autocar_standard': 'standard',
        }
        const normalizedType = existingType ? (typeMapping[existingType] || existingType) : null

        // Vérifier si le type existant est cohérent avec le nb de pax
        const typeCapacities: Record<string, { min: number; max: number }> = {
          'minibus': { min: 1, max: 20 },
          'standard': { min: 21, max: 59 },
          '60-63': { min: 60, max: 63 },
          '70': { min: 64, max: 70 },
          '83-90': { min: 71, max: 90 },
        }

        if (normalizedType && typeCapacities[normalizedType]) {
          const cap = typeCapacities[normalizedType]
          if (pax >= cap.min && pax <= cap.max) {
            return normalizedType // Le type existant est cohérent
          }
        }

        // Auto-sélectionner le bon type
        if (pax <= 20) return 'minibus'
        if (pax <= 59) return 'standard'
        if (pax <= 63) return '60-63'
        if (pax <= 70) return '70'
        return '83-90' // Double étage pour > 70 pax
      }

      const autoVehicleType = determineVehicleType(dossier.passengers || 1, dossier.vehicle_type)

      setFormData(prev => ({
        ...prev,
        service_type: serviceType,
        vehicle_type: autoVehicleType,
        detail_mad: detailMAD,
        amplitude: calculatedAmplitude || '8h', // Fallback à 8h si pas d'horaires
        pax_aller: dossier.passengers || 0,
        pax_retour: dossier.passengers || 0,
      }))

      // Calculer automatiquement la distance, durée, nombre de cars et chauffeurs via API
      if (dossier.departure && dossier.arrival) {
        setIsLoadingDistance(true)
        calculateRouteInfo(dossier.departure, dossier.arrival)
          .then((routeInfo) => {
            if (routeInfo) {
              // Calculer nombre de cars selon passagers
              const nbCars = calculateNumberOfCars(dossier.passengers || 1, dossier.vehicle_type || 'standard')

              // Déterminer si c'est un AR le même jour
              let isSameDay = false
              if (dossier.return_date && dossier.departure_date) {
                const depDate = new Date(dossier.departure_date).toDateString()
                const retDate = new Date(dossier.return_date).toDateString()
                isSameDay = depDate === retDate
              }

              // Calculer nombre de chauffeurs selon amplitude
              const driverInfo = calculateNumberOfDrivers(routeInfo.duration, isSameDay, isSameDay ? 2 : 0)

              setFormData(prev => ({
                ...prev,
                km: routeInfo.distance.toString(),
                nombre_cars: nbCars,
                nombre_chauffeurs: driverInfo.drivers,
              }))
            }
          })
          .finally(() => {
            setIsLoadingDistance(false)
          })
      }
    }
  }, [dossier, isOpen])

  // Calculer la durée en jours - utiliser Date.UTC pour éviter les problèmes de timezone
  const dureeJours = useMemo(() => {
    if (!dossier?.return_date || !dossier?.departure_date) return 1
    // Extraire uniquement YYYY-MM-DD pour éviter les problèmes de timezone
    // Les dates peuvent être au format ISO (T) ou PostgreSQL (espace)
    const depDateStr = dossier.departure_date.substring(0, 10)
    const retDateStr = dossier.return_date.substring(0, 10)
    const [depYear, depMonth, depDay] = depDateStr.split('-').map(Number)
    const [retYear, retMonth, retDay] = retDateStr.split('-').map(Number)
    const depDate = new Date(Date.UTC(depYear, depMonth - 1, depDay))
    const retDate = new Date(Date.UTC(retYear, retMonth - 1, retDay))
    const diffDays = Math.round((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24))
    return Math.max(1, diffDays + 1)
  }, [dossier?.departure_date, dossier?.return_date])

  // Obtenir la ville de départ (override ou dossier)
  const villeDepartAvecCP = useMemo(() => {
    return formData.departure_override || dossier?.departure || null
  }, [formData.departure_override, dossier?.departure])

  // Calculer la majoration régionale
  const majorationRegion = useMemo(() => {
    if (!villeDepartAvecCP || majorationsRegions.length === 0) return null
    const dept = extraireDepartement(villeDepartAvecCP)
    if (!dept) return null
    const region = majorationsRegions.find(m => m.region_code === dept)
    if (region) {
      return {
        percent: region.majoration_percent,
        nom: region.region_nom,
        grandeCapaciteDispo: region.grande_capacite_dispo,
        departement: dept,
      }
    }
    return { percent: 0, nom: null, grandeCapaciteDispo: true, departement: dept }
  }, [villeDepartAvecCP, majorationsRegions])

  // Construire les grilles au format GrillesTarifaires
  const grilles: GrillesTarifaires | null = useMemo(() => {
    // Au moins une grille doit être remplie
    if (tarifsAllerSimple.length === 0 && tarifsAR1J.length === 0 && tarifsARMAD.length === 0 && tarifsARSansMAD.length === 0) return null
    const toNum = (val: unknown): number => parseFloat(String(val)) || 0
    const toNumOrNull = (val: unknown): number | null => val != null ? parseFloat(String(val)) || null : null
    return {
      tarifsAllerSimple: tarifsAllerSimple.map(t => ({
        km_min: t.km_min,
        km_max: t.km_max,
        prix_public: toNum(t.prix_public),
      })),
      tarifsAR1J: tarifsAR1J.map(t => ({
        km_min: t.km_min,
        km_max: t.km_max,
        prix_8h: toNumOrNull(t.prix_8h),
        prix_10h: toNumOrNull(t.prix_10h),
        prix_12h: toNumOrNull(t.prix_12h),
        prix_9h_coupure: toNumOrNull(t.prix_9h_coupure),
      })),
      tarifsARMAD: tarifsARMAD.map(t => ({
        km_min: t.km_min,
        km_max: t.km_max,
        prix_2j: toNumOrNull(t.prix_2j),
        prix_3j: toNumOrNull(t.prix_3j),
        prix_4j: toNumOrNull(t.prix_4j),
        prix_5j: toNumOrNull(t.prix_5j),
        prix_6j: toNumOrNull(t.prix_6j),
        supplement_jour: toNumOrNull(t.supplement_jour),
      })),
      tarifsARSansMAD: tarifsARSansMAD.map(t => ({
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
  }, [tarifsAllerSimple, tarifsAR1J, tarifsARMAD, tarifsARSansMAD])

  // Calculer les infos trajet (chauffeurs, temps conduite, amplitude)
  const infosTrajet = useMemo(() => {
    const km = parseInt(formData.km || '0') || 0
    if (km <= 0) return null
    const serviceType = formData.service_type as PricingServiceType
    const heureDepart = formData.departure_time_override || dossier?.departure_time || null
    const heureRetour = formData.return_time_override || dossier?.return_time || null
    const dateDepart = formData.departure_date_override || dossier?.departure_date || null
    const dateRetour = formData.return_date_override || dossier?.return_date || null
    return calculerInfosTrajet(km, heureDepart, heureRetour, dateDepart, dateRetour, serviceType)
  }, [formData.km, formData.service_type, formData.departure_time_override, formData.return_time_override, formData.departure_date_override, formData.return_date_override, dossier])

  // Mettre à jour automatiquement le nombre de chauffeurs selon les règles
  useEffect(() => {
    if (infosTrajet?.nbChauffeurs && infosTrajet.nbChauffeurs !== formData.nombre_chauffeurs) {
      setFormData(prev => ({
        ...prev,
        nombre_chauffeurs: infosTrajet.nbChauffeurs,
      }))
    }
  }, [infosTrajet?.nbChauffeurs])

  // Mettre à jour automatiquement le nombre de cars selon la capacité du véhicule et le nombre de passagers
  useEffect(() => {
    const passengers = dossier?.passengers || 0
    if (passengers > 0 && capacitesVehicules.length > 0) {
      const vehicleCapacity = capacitesVehicules.find(c => c.code === formData.vehicle_type)
      if (vehicleCapacity && vehicleCapacity.places_max) {
        const nbCarsNeeded = Math.ceil(passengers / vehicleCapacity.places_max)
        if (nbCarsNeeded !== formData.nombre_cars) {
          setFormData(prev => ({
            ...prev,
            nombre_cars: nbCarsNeeded,
          }))
        }
      }
    }
  }, [dossier?.passengers, formData.vehicle_type, capacitesVehicules])

  // Calculer le tarif estimé avec gestion km hors grille
  const tarifEstime = useMemo(() => {
    const km = parseInt(formData.km || '0') || 0
    const serviceType = formData.service_type as PricingServiceType
    const amplitude = formData.amplitude as PricingAmplitudeType | null
    const vehicleType = formData.vehicle_type || 'standard'
    const nombreCars = formData.nombre_cars || 1

    if (km <= 0 || !grilles) return null

    // Trouver le coefficient véhicule
    const coeff = capacitesVehicules.find(c => c.code === vehicleType)?.coefficient
      || coefficientsVehicules.find(c => c.code === vehicleType)?.coefficient
      || 1

    // Déterminer l'amplitude automatiquement si AR 1 jour
    let amplitudeUtilisee = amplitude
    if (serviceType === 'ar_1j' && !amplitude && infosTrajet?.amplitudeJournee) {
      amplitudeUtilisee = determinerAmplitudeGrille(infosTrajet.amplitudeJournee)
    }

    // Utiliser le calcul complet avec gestion km hors grille
    const result = calculerTarifComplet({
      distanceKm: km,
      typeService: serviceType,
      amplitude: amplitudeUtilisee,
      nbJours: dureeJours,
      coefficientVehicule: coeff,
      nombreCars,
      villeDepartAvecCP,
      majorationRushManuelle: (majorationRegion?.percent || 0) / 100,
      kmSupplementairesMAD: 0,
      heureDepart: formData.departure_time_override || dossier?.departure_time || null,
      heureRetour: formData.return_time_override || dossier?.return_time || null,
      dateDepart: formData.departure_date_override || dossier?.departure_date || null,
      dateRetour: formData.return_date_override || dossier?.return_date || null,
      grilles,
    })

    const kmHorsGrille = result.kmHorsCadre
    const isHorsGrille = kmHorsGrille > 0
    const isPetitKm = km <= TARIFS_HORS_GRILLE.PETIT_KM_SEUIL && serviceType === 'ar_1j'

    return {
      prixBase: result.prixBase,
      coefficient: coeff,
      nombreCars,
      prixFinal: result.prixFinal,
      prixGrille: result.prixBase,
      supplementHorsGrille: result.supplementHorsCadre,
      majorationRegionPercent: majorationRegion?.percent || 0,
      coutRelaisChauffeur: result.coutRelaisChauffeur,
      nbChauffeurs: infosTrajet?.nbChauffeurs || 1,
      raisonChauffeurs: infosTrajet?.raisonDeuxChauffeurs || '',
      isHorsGrille,
      isPetitKm,
      kmHorsGrille,
      detailType: result.detailType,
    }
  }, [formData.km, formData.service_type, formData.amplitude, formData.vehicle_type, formData.nombre_cars, formData.departure_time_override, formData.return_time_override, formData.departure_date_override, formData.return_date_override, dureeJours, grilles, coefficientsVehicules, capacitesVehicules, villeDepartAvecCP, majorationRegion, infosTrajet, dossier])

  const applyEstimatedPrice = () => {
    if (tarifEstime) {
      // Les prix de la grille tarifaire sont TTC
      const prixTTC = tarifEstime.prixFinal
      const prixHT = Math.round(prixTTC / 1.1 * 100) / 100
      setFormData(prev => ({
        ...prev,
        price_ht: prixHT,
        price_ttc: prixTTC,
      }))
    }
  }

  const handleSubmit = async () => {
    if (!formData.transporteur_id) {
      alert('Veuillez sélectionner un transporteur')
      return
    }

    try {
      const reference = `DEV-${Date.now().toString(36).toUpperCase()}`
      await createDevis.mutateAsync({
        dossier_id: dossier.id,
        transporteur_id: formData.transporteur_id,
        reference,
        price_ht: formData.price_ht,
        price_ttc: formData.price_ttc,
        price_achat_ht: formData.price_achat_ht || null,
        price_achat_ttc: formData.price_achat_ttc || null,
        notes: formData.notes || null,
        client_notes: formData.client_notes || null,
        validity_days: formData.validity_days,
        status: 'draft',
        nombre_cars: formData.nombre_cars || 1,
        nombre_chauffeurs: formData.nombre_chauffeurs || 1,
        service_type: formData.service_type,
        amplitude: formData.service_type === 'ar_1j' ? formData.amplitude : null,
        vehicle_type: formData.vehicle_type,
        km: formData.km || null,
        pax_aller: formData.pax_aller || dossier.passengers,
        pax_retour: formData.pax_retour || dossier.passengers,
        detail_mad: formData.detail_mad || null,
        options_details: options,
        duree_jours: dureeJours,
        // Champs override (cast en any car les types ne sont pas encore régénérés)
        departure_override: formData.departure_override || null,
        arrival_override: formData.arrival_override || null,
        departure_date_override: formData.departure_date_override || null,
        return_date_override: formData.return_date_override || null,
        departure_time_override: formData.departure_time_override || null,
        return_time_override: formData.return_time_override || null,
      } as any)
      onClose()
      // Reset form
      setFormData({
        transporteur_id: '',
        service_type: 'ar_1j',
        amplitude: '8h',
        vehicle_type: 'autocar',
        km: '',
        price_ht: 0,
        price_ttc: 0,
        price_achat_ht: 0,
        price_achat_ttc: 0,
        validity_days: 30,
        notes: '',
        client_notes: '',
        nombre_cars: 1,
        nombre_chauffeurs: 1,
        detail_mad: '',
        pax_aller: 0,
        pax_retour: 0,
        tva_rate: 10,
        departure_override: '',
        arrival_override: '',
        departure_date_override: '',
        return_date_override: '',
        departure_time_override: '',
        return_time_override: '',
      })
    } catch (error) {
      console.error('Erreur création devis:', error)
    }
  }

  // Auto-calculate TTC (assuming 10% VAT)
  const handlePriceHTChange = (value: number) => {
    setFormData({
      ...formData,
      price_ht: value,
      price_ttc: Math.round(value * 1.1 * 100) / 100,
    })
  }

  // Auto-calculate Prix achat TTC from HT (using form TVA rate)
  const handlePriceAchatHTChange = (value: number) => {
    const tvaRate = formData.tva_rate || 10
    setFormData({
      ...formData,
      price_achat_ht: value,
      price_achat_ttc: Math.round(value * (1 + tvaRate / 100) * 100) / 100,
    })
  }

  // Auto-calculate Prix achat HT from TTC (using form TVA rate)
  const handlePriceAchatTTCChange = (value: number) => {
    const tvaRate = formData.tva_rate || 10
    setFormData({
      ...formData,
      price_achat_ttc: value,
      price_achat_ht: Math.round((value / (1 + tvaRate / 100)) * 100) / 100,
    })
  }

  // Calcul de la marge (en HT)
  const marge = formData.price_ht - formData.price_achat_ht

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nouveau devis"
      size="xl"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={createDevis.isPending}
          >
            {createDevis.isPending ? 'Création...' : 'Créer le devis'}
          </button>
        </>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Type de prestation */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <label className="label flex items-center gap-2">
            <Car size={16} />
            Type de prestation
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {(Object.entries(SERVICE_TYPE_LABELS_NDM) as [ServiceTypeNDM, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData({ ...formData, service_type: value })}
                className={`p-2 rounded-lg text-sm font-medium transition-all border ${
                  formData.service_type === value
                    ? 'bg-purple text-white border-purple'
                    : 'bg-white border-gray-200 hover:border-purple-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Amplitude pour AR 1 jour */}
        {formData.service_type === 'ar_1j' && (
          <div>
            <label className="label flex items-center gap-2">
              <Clock size={16} />
              Amplitude horaire
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(AMPLITUDE_LABELS_NDM) as [AmplitudeNDM, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, amplitude: value })}
                  className={`p-2 rounded-lg text-sm font-medium transition-all border ${
                    formData.amplitude === value
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Durée pour AR MAD */}
        {(formData.service_type === 'ar_mad' || formData.service_type === 'ar_sans_mad') && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <label className="label flex items-center gap-2 text-indigo-700">
              <Calendar size={16} />
              Durée de la prestation
            </label>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-indigo-700">{dureeJours}</span>
              <span className="text-indigo-600">jour{dureeJours > 1 ? 's' : ''}</span>
              {dossier?.departure_date && dossier?.return_date && (
                <span className="text-sm text-indigo-500">
                  (du {new Date(dossier.departure_date).toLocaleDateString('fr-FR')} au {new Date(dossier.return_date).toLocaleDateString('fr-FR')})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Transporteur */}
        <div>
          <label className="label">Transporteur *</label>
          <select
            className="input"
            value={formData.transporteur_id}
            onChange={(e) => setFormData({ ...formData, transporteur_id: e.target.value })}
          >
            <option value="">-- Sélectionner --</option>
            {transporteurs.map((t) => (
              <option key={t.id} value={t.id}>{t.number} - {t.name} {t.city ? `(${t.city})` : ''}</option>
            ))}
          </select>
        </div>

        {/* Trajet et Distance */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Navigation size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Trajet</span>
            </div>
            {isLoadingDistance && (
              <span className="text-xs text-blue-500 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                Calcul distance...
              </span>
            )}
          </div>

          {/* Lieux */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label text-blue-700">Ville de départ</label>
              <AddressAutocomplete
                value={formData.departure_override || dossier?.departure || ''}
                onChange={(value) => setFormData({ ...formData, departure_override: value })}
                placeholder="Ex: Paris (75000)"
                className="input"
              />
            </div>
            <div>
              <label className="label text-blue-700">Ville d'arrivée</label>
              <AddressAutocomplete
                value={formData.arrival_override || dossier?.arrival || ''}
                onChange={(value) => setFormData({ ...formData, arrival_override: value })}
                placeholder="Ex: Lyon (69000)"
                className="input"
              />
            </div>
          </div>

          {/* Dates et Horaires */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="label text-blue-700">Date départ</label>
              <input
                type="date"
                className="input"
                value={formData.departure_date_override || formatDateForInput(dossier?.departure_date)}
                onChange={(e) => setFormData({ ...formData, departure_date_override: e.target.value })}
              />
            </div>
            <div>
              <label className="label text-blue-700">Heure départ</label>
              <input
                type="time"
                className="input"
                value={formData.departure_time_override || dossier?.departure_time || ''}
                onChange={(e) => setFormData({ ...formData, departure_time_override: e.target.value })}
              />
            </div>
            <div>
              <label className="label text-blue-700">Date retour</label>
              <input
                type="date"
                className="input"
                value={formData.return_date_override || formatDateForInput(dossier?.return_date)}
                onChange={(e) => setFormData({ ...formData, return_date_override: e.target.value })}
              />
            </div>
            <div>
              <label className="label text-blue-700">Heure retour</label>
              <input
                type="time"
                className="input"
                value={formData.return_time_override || dossier?.return_time || ''}
                onChange={(e) => setFormData({ ...formData, return_time_override: e.target.value })}
              />
            </div>
          </div>

          {/* Distance et Passagers */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label flex items-center gap-2 text-blue-700">
                <MapPin size={16} />
                Distance (km)
              </label>
              <div className="relative">
                <input
                  type="text"
                  className={`input ${isLoadingDistance ? 'bg-gray-100' : formData.km ? 'bg-green-50 border-green-300' : ''}`}
                  value={formData.km}
                  onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                  placeholder={isLoadingDistance ? 'Calcul...' : 'Ex: 350'}
                  disabled={isLoadingDistance}
                />
                {formData.km && !isLoadingDistance && (
                  <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
            </div>
            <div>
              <label className="label flex items-center gap-2 text-blue-700">
                <Users size={16} />
                Pax Aller
              </label>
              <input
                type="number"
                className="input"
                min={1}
                value={formData.pax_aller || ''}
                onChange={(e) => setFormData({ ...formData, pax_aller: parseInt(e.target.value) || 0 })}
                placeholder="Nb passagers"
              />
            </div>
            <div>
              <label className="label flex items-center gap-2 text-blue-700">
                <Users size={16} />
                Pax Retour
              </label>
              <input
                type="number"
                className="input"
                min={1}
                value={formData.pax_retour || ''}
                onChange={(e) => setFormData({ ...formData, pax_retour: parseInt(e.target.value) || 0 })}
                placeholder="Nb passagers"
              />
            </div>
          </div>
        </div>

        {/* Type véhicule */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Type véhicule</label>
            <select
              className="input"
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
            >
              {capacitesVehicules.length > 0 ? (
                capacitesVehicules.map((v) => (
                  <option key={v.code} value={v.code}>
                    {v.label} ({v.places_min}-{v.places_max} places) - coeff {v.coefficient}
                  </option>
                ))
              ) : (
                <>
                  <option value="minibus">Minibus (8-20 places)</option>
                  <option value="standard">Standard (21-59 places)</option>
                  <option value="60-63">60-63 places</option>
                  <option value="70">70 places</option>
                  <option value="83-90">Double étage (83-90 places)</option>
                </>
              )}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Nb cars</label>
              <input
                type="number"
                className="input"
                min={1}
                value={formData.nombre_cars}
                onChange={(e) => setFormData({ ...formData, nombre_cars: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <label className="label">Nb chauffeurs</label>
              <input
                type="number"
                className="input"
                min={1}
                value={formData.nombre_chauffeurs}
                onChange={(e) => setFormData({ ...formData, nombre_chauffeurs: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
        </div>

        {/* Alertes majoration régionale */}
        {majorationRegion && majorationRegion.percent > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Zone avec majoration : {majorationRegion.nom || `Département ${majorationRegion.departement}`}
              </p>
              <p className="text-xs text-amber-600">
                +{majorationRegion.percent}% de majoration appliquée automatiquement
                {!majorationRegion.grandeCapaciteDispo && (
                  <span className="block mt-1 text-red-600 font-medium">
                    Double-étage non disponible dans cette zone
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Info chauffeurs calculée */}
        {infosTrajet && infosTrajet.nbChauffeurs > 1 && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 flex items-start gap-3">
            <Users size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                2 chauffeurs recommandés
              </p>
              <p className="text-xs text-blue-600">
                {infosTrajet.raisonDeuxChauffeurs}
              </p>
            </div>
          </div>
        )}

        {/* Tarif estimé automatique */}
        {tarifEstime && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-purple-800 flex items-center gap-2">
                <Calculator size={16} />
                Tarif estimé (grille tarifaire)
              </h4>
              <button
                type="button"
                onClick={applyEstimatedPrice}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple text-white rounded-lg text-sm font-medium hover:bg-purple-dark transition"
              >
                <Sparkles size={14} />
                Appliquer ce tarif
              </button>
            </div>

            {/* Alertes hors grille */}
            {tarifEstime.isPetitKm && (
              <div className="bg-orange-100 border border-orange-300 rounded p-2 mb-3 text-xs text-orange-800">
                <strong>Petit km (≤50km AR 1j)</strong> : Tarif forfaitaire appliqué selon amplitude
              </div>
            )}
            {tarifEstime.isHorsGrille && !tarifEstime.isPetitKm && (
              <div className="bg-orange-100 border border-orange-300 rounded p-2 mb-3 text-xs text-orange-800">
                <strong>Km hors grille</strong> : +{tarifEstime.kmHorsGrille} km × {TARIFS_HORS_GRILLE.PRIX_KM_SUPPLEMENTAIRE}€ × 2 = +{formatPrice(tarifEstime.supplementHorsGrille || 0)}
              </div>
            )}

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-purple-600">Prix grille TTC</span>
                <p className="font-semibold text-purple-800">{formatPrice(tarifEstime.prixGrille || tarifEstime.prixBase)}</p>
              </div>
              <div>
                <span className="text-purple-600">Coeff.</span>
                <p className="font-semibold text-purple-800">×{tarifEstime.coefficient}</p>
              </div>
              <div>
                <span className="text-purple-600">Cars</span>
                <p className="font-semibold text-purple-800">×{tarifEstime.nombreCars}</p>
              </div>
              <div>
                <span className="text-purple-600">Prix final TTC</span>
                <p className="font-bold text-lg text-purple-900">{formatPrice(tarifEstime.prixFinal)}</p>
              </div>
            </div>

            {/* Détails supplémentaires */}
            {(tarifEstime.majorationRegionPercent > 0 || tarifEstime.coutRelaisChauffeur > 0 || tarifEstime.supplementHorsGrille > 0) && (
              <div className="mt-3 pt-3 border-t border-purple-200 grid grid-cols-3 gap-3 text-xs">
                {tarifEstime.majorationRegionPercent > 0 && (
                  <div className="bg-amber-50 rounded p-2">
                    <span className="text-amber-700">Majoration région</span>
                    <p className="font-medium text-amber-800">+{tarifEstime.majorationRegionPercent}%</p>
                  </div>
                )}
                {tarifEstime.supplementHorsGrille > 0 && (
                  <div className="bg-orange-50 rounded p-2">
                    <span className="text-orange-700">Supplément km</span>
                    <p className="font-medium text-orange-800">+{formatPrice(tarifEstime.supplementHorsGrille)}</p>
                  </div>
                )}
                {tarifEstime.coutRelaisChauffeur > 0 && (
                  <div className="bg-blue-50 rounded p-2">
                    <span className="text-blue-700">Relais chauffeur</span>
                    <p className="font-medium text-blue-800">+{formatPrice(tarifEstime.coutRelaisChauffeur)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Info chauffeurs */}
            {tarifEstime.nbChauffeurs > 1 && (
              <div className="mt-3 text-xs text-purple-600 flex items-center gap-2">
                <Users size={14} />
                <span>2 chauffeurs nécessaires : {tarifEstime.raisonChauffeurs}</span>
              </div>
            )}
          </div>
        )}

        {!tarifEstime && formData.km && parseInt(formData.km) > 0 && !isLoadingTarifs && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
            <p className="text-sm text-gray-500">
              Calcul du tarif en cours... ({formData.km} km)
            </p>
          </div>
        )}

        {/* Prix de vente */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
            <Euro size={16} />
            Prix de vente
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-blue-700">Prix HT *</label>
              <input
                type="number"
                className="input"
                value={formData.price_ht}
                onChange={(e) => handlePriceHTChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="label text-blue-700">Prix TTC</label>
              <input
                type="number"
                className="input bg-blue-100"
                value={formData.price_ttc}
                onChange={(e) => setFormData({ ...formData, price_ttc: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Prix d'achat */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-medium text-amber-800 mb-3">Prix d'achat fournisseur</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-amber-700">Prix achat HT</label>
              <input
                type="number"
                className="input"
                value={formData.price_achat_ht}
                onChange={(e) => handlePriceAchatHTChange(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="label text-amber-700">Prix achat TTC</label>
              <input
                type="number"
                className="input"
                value={formData.price_achat_ttc}
                onChange={(e) => handlePriceAchatTTCChange(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Marge */}
        {formData.price_ht > 0 && formData.price_achat_ht > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Marge HT</span>
              <span className={`font-bold text-xl ${marge >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {formatPrice(marge)}
              </span>
            </div>
          </div>
        )}

        {/* Options collapsibles */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
          >
            <span className="font-medium">Options (péages, repas, parking, hébergement)</span>
            {showOptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showOptions && (
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-500 mb-2">
                Péages sont inclus par défaut. Les options "Non inclus" seront proposées au client.
              </p>

              {/* Péages - Inclus par défaut */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="label text-green-700 text-sm">Péages</label>
                    <select
                      className="input text-sm"
                      value={options.peages.status}
                      onChange={(e) => setOptions({ ...options, peages: { ...options.peages, status: e.target.value } })}
                    >
                      <option value="inclus">Inclus</option>
                      <option value="non_inclus">Non inclus (option client)</option>
                    </select>
                  </div>
                  {options.peages.status === 'non_inclus' && (
                    <div>
                      <label className="label text-green-700 text-sm">Montant</label>
                      <input
                        type="number"
                        className="input text-sm"
                        value={options.peages.montant}
                        onChange={(e) => setOptions({ ...options, peages: { ...options.peages, montant: parseFloat(e.target.value) || 0 } })}
                        placeholder="€"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Repas */}
              <div className="grid grid-cols-4 gap-4 items-end">
                <div>
                  <label className="label text-sm">Repas chauffeur</label>
                  <select
                    className="input text-sm"
                    value={options.repas_chauffeur.status}
                    onChange={(e) => setOptions({ ...options, repas_chauffeur: { ...options.repas_chauffeur, status: e.target.value } })}
                  >
                    <option value="inclus">Inclus</option>
                    <option value="non_inclus">Non inclus</option>
                  </select>
                </div>
                {options.repas_chauffeur.status === 'non_inclus' && (
                  <>
                    <div>
                      <label className="label text-sm">Prix unitaire</label>
                      <input
                        type="number"
                        className="input text-sm"
                        value={options.repas_chauffeur.montant}
                        onChange={(e) => setOptions({ ...options, repas_chauffeur: { ...options.repas_chauffeur, montant: parseFloat(e.target.value) || 0 } })}
                        placeholder="€/repas"
                      />
                    </div>
                    <div className="col-span-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <span className="font-medium">Calcul:</span> {dureeJours} jour{dureeJours > 1 ? 's' : ''} × 2 repas × {options.repas_chauffeur.montant}€ × {formData.nombre_chauffeurs || 1} chauff. = <span className="font-semibold text-purple">{dureeJours * 2 * options.repas_chauffeur.montant * (formData.nombre_chauffeurs || 1)}€</span>
                    </div>
                  </>
                )}
              </div>

              {/* Parking */}
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <label className="label text-sm">Parking</label>
                  <select
                    className="input text-sm"
                    value={options.parking.status}
                    onChange={(e) => setOptions({ ...options, parking: { ...options.parking, status: e.target.value } })}
                  >
                    <option value="inclus">Inclus</option>
                    <option value="non_inclus">Non inclus</option>
                  </select>
                </div>
                {options.parking.status === 'non_inclus' && (
                  <div>
                    <label className="label text-sm">Montant</label>
                    <input
                      type="number"
                      className="input text-sm"
                      value={options.parking.montant}
                      onChange={(e) => setOptions({ ...options, parking: { ...options.parking, montant: parseFloat(e.target.value) || 0 } })}
                      placeholder="€"
                    />
                  </div>
                )}
              </div>

              {/* Hébergement */}
              <div className="grid grid-cols-4 gap-4 items-end">
                <div>
                  <label className="label text-sm">Hébergement</label>
                  <select
                    className="input text-sm"
                    value={options.hebergement.status}
                    onChange={(e) => setOptions({ ...options, hebergement: { ...options.hebergement, status: e.target.value } })}
                  >
                    <option value="inclus">Inclus</option>
                    <option value="non_inclus">Non inclus</option>
                  </select>
                </div>
                {options.hebergement.status === 'non_inclus' && (
                  <>
                    <div>
                      <label className="label text-sm">€/nuit</label>
                      <input
                        type="number"
                        className="input text-sm"
                        value={options.hebergement.montant}
                        onChange={(e) => setOptions({ ...options, hebergement: { ...options.hebergement, montant: parseFloat(e.target.value) || 0 } })}
                      />
                    </div>
                    <div>
                      <label className="label text-sm">Nuits</label>
                      <input
                        type="number"
                        className="input text-sm"
                        value={options.hebergement.nuits}
                        onChange={(e) => setOptions({ ...options, hebergement: { ...options.hebergement, nuits: parseInt(e.target.value) || 0 } })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Détail MAD pour circuits */}
        {(formData.service_type === 'ar_mad' || dossier?.trip_mode === 'circuit') && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="label text-orange-700 mb-0">Détail mise à disposition</label>
              {dossier?.special_requests && (
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                  Récupéré de la demande
                </span>
              )}
            </div>
            <textarea
              className="input min-h-[100px]"
              value={formData.detail_mad}
              onChange={(e) => setFormData({ ...formData, detail_mad: e.target.value })}
              placeholder="Programme jour par jour, étapes, horaires..."
            />
          </div>
        )}

        {/* Validité */}
        <div>
          <label className="label">Validité (jours)</label>
          <input
            type="number"
            className="input w-32"
            value={formData.validity_days}
            onChange={(e) => setFormData({ ...formData, validity_days: parseInt(e.target.value) || 30 })}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes internes</label>
          <textarea
            className="input min-h-16"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes internes pour l'équipe admin..."
          />
        </div>

        <div>
          <label className="label">Notes client</label>
          <textarea
            className="input min-h-16"
            value={formData.client_notes}
            onChange={(e) => setFormData({ ...formData, client_notes: e.target.value })}
            placeholder="Informations visibles par le client..."
          />
        </div>
      </div>
    </Modal>
  )
}

// ============ SETTINGS PAGE COMPONENT ============


// ============================================
// STATS PAGE
// ============================================
function StatsPage({ dossiers, transporteurs, paiementsFournisseurs }: {
  dossiers: DossierWithRelations[]
  transporteurs: any[]
  paiementsFournisseurs: any[]
}) {
  const queryClient = useQueryClient()
  const [periodFilter, setPeriodFilter] = useState<'month' | 'quarter' | 'year' | 'all'>('month')
  const [dateMode, setDateMode] = useState<'signature' | 'departure'>('signature') // Par défaut: date de signature
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [showPaiementFournisseurModal, setShowPaiementFournisseurModal] = useState(false)
  const [selectedTransporteurForPayment, setSelectedTransporteurForPayment] = useState<any>(null)
  const [paiementFournisseurForm, setPaiementFournisseurForm] = useState({
    dossier_id: '',
    amount: 0,
    payment_date: new Date().toISOString().slice(0, 10),
    type: 'virement' as string,
    reference: '',
    notes: '',
  })
  const createPaiementFournisseur = useCreatePaiementFournisseur()

  // Filtrer les dossiers par période (basé sur la date de signature ou de départ)
  const filteredDossiers = useMemo(() => {
    return dossiers.filter(d => {
      const contrat = Array.isArray(d.contrats) ? d.contrats[0] : d.contrats
      if (!contrat?.signed_at) return false

      // Choisir la date selon le mode
      let targetDate: Date
      if (dateMode === 'signature') {
        targetDate = new Date(contrat.signed_at)
      } else {
        if (!d.departure_date) return false
        targetDate = new Date(d.departure_date)
      }

      const targetYear = targetDate.getFullYear()
      const targetMonth = targetDate.getMonth() + 1
      const targetQuarter = Math.ceil(targetMonth / 3)
      const currentQuarter = Math.ceil(selectedMonth / 3)

      if (periodFilter === 'month') {
        return targetYear === selectedYear && targetMonth === selectedMonth
      } else if (periodFilter === 'quarter') {
        return targetYear === selectedYear && targetQuarter === currentQuarter
      } else if (periodFilter === 'year') {
        return targetYear === selectedYear
      }
      return true // 'all'
    })
  }, [dossiers, periodFilter, dateMode, selectedYear, selectedMonth])

  // Stats globales
  const stats = useMemo(() => {
    const signedDossiers = filteredDossiers
    const totalCA = signedDossiers.reduce((sum, d) => sum + (d.price_ttc || 0), 0)
    const totalVenteHT = signedDossiers.reduce((sum, d) => sum + (d.price_ht || 0), 0)
    const totalAchat = signedDossiers.reduce((sum, d) => sum + (d.price_achat || 0), 0)
    const totalMarge = signedDossiers.reduce((sum, d) => {
      const ht = d.price_ht || 0
      const achat = d.price_achat || 0
      return sum + (ht - achat)
    }, 0)
    // % marge calculé sur le prix de vente HT
    const margePercent = totalVenteHT > 0 ? (totalMarge / totalVenteHT) * 100 : 0

    // Paiements clients reçus
    const totalPaiementsClients = signedDossiers.reduce((sum, d) => {
      const paiements = d.paiements || []
      return sum + paiements.reduce((s, p) => s + (p.amount || 0), 0)
    }, 0)

    // Paiements fournisseurs
    const paiementsFournisseursFiltered = paiementsFournisseurs.filter(pf => {
      const paymentDate = new Date(pf.payment_date)
      const paymentYear = paymentDate.getFullYear()
      const paymentMonth = paymentDate.getMonth() + 1
      const paymentQuarter = Math.ceil(paymentMonth / 3)
      const currentQuarter = Math.ceil(selectedMonth / 3)

      if (periodFilter === 'month') {
        return paymentYear === selectedYear && paymentMonth === selectedMonth
      } else if (periodFilter === 'quarter') {
        return paymentYear === selectedYear && paymentQuarter === currentQuarter
      } else if (periodFilter === 'year') {
        return paymentYear === selectedYear
      }
      return true
    })

    const totalPayeFournisseurs = paiementsFournisseursFiltered.reduce((sum, pf) => sum + (pf.amount || 0), 0)
    const totalAPayerFournisseurs = totalAchat - totalPayeFournisseurs

    return {
      nbSignatures: signedDossiers.length,
      totalCA,
      totalAchat,
      totalMarge,
      margePercent,
      totalPaiementsClients,
      resteAEncaisser: totalCA - totalPaiementsClients,
      totalPayeFournisseurs,
      totalAPayerFournisseurs,
    }
  }, [filteredDossiers, paiementsFournisseurs, periodFilter, selectedYear, selectedMonth])

  // Stats de conversion (basées sur tous les dossiers de la période, pas seulement les signés)
  const conversionStats = useMemo(() => {
    // Helper pour vérifier si une date est dans la période sélectionnée
    const isInPeriod = (dateStr: string | null | undefined) => {
      if (!dateStr) return false
      const targetDate = new Date(dateStr)
      const targetYear = targetDate.getFullYear()
      const targetMonth = targetDate.getMonth() + 1
      const targetQuarter = Math.ceil(targetMonth / 3)
      const currentQuarter = Math.ceil(selectedMonth / 3)

      if (periodFilter === 'month') {
        return targetYear === selectedYear && targetMonth === selectedMonth
      } else if (periodFilter === 'quarter') {
        return targetYear === selectedYear && targetQuarter === currentQuarter
      } else if (periodFilter === 'year') {
        return targetYear === selectedYear
      }
      return true
    }

    // Calculer le délai moyen de signature (en jours)
    const calcDelaiMoyen = (dossiersSignes: any[]) => {
      const delais = dossiersSignes
        .filter(d => d.created_at && d.contract_signed_at)
        .map(d => {
          const created = new Date(d.created_at)
          const signed = new Date(d.contract_signed_at)
          return (signed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) // en jours
        })
        .filter(d => d >= 0) // Exclure les valeurs négatives (données incorrectes)

      if (delais.length === 0) return 0
      return delais.reduce((sum, d) => sum + d, 0) / delais.length
    }

    // En mode "signature", on compte les contrats signés dans la période
    // En mode "départ", on compte les dossiers dont le départ est dans la période
    if (dateMode === 'signature') {
      // Dossiers signés dans la période
      const dossiersSignes = dossiers.filter(d => {
        return d.contract_signed_at && isInPeriod(d.contract_signed_at)
      })
      const signes = dossiersSignes.length

      // Pour le taux de conversion, on prend tous les dossiers créés
      // et on regarde combien ont été signés dans la période
      const totalDemandes = dossiers.filter(d => isInPeriod(d.created_at)).length
      const devisEnvoyes = dossiers.filter(d => {
        if (!isInPeriod(d.created_at)) return false
        const devis = d.devis || []
        return devis.some((dev: any) => dev.status === 'sent' || dev.status === 'accepted')
      }).length
      const refuses = dossiers.filter(d => {
        return isInPeriod(d.created_at) && (d.status === 'lost' || d.status === 'cancelled')
      }).length
      const enCours = dossiers.filter(d => {
        return isInPeriod(d.created_at) && !d.contract_signed_at && d.status !== 'lost' && d.status !== 'cancelled'
      }).length

      const tauxDevis = totalDemandes > 0 ? (devisEnvoyes / totalDemandes) * 100 : 0
      const tauxConversion = devisEnvoyes > 0 ? (signes / devisEnvoyes) * 100 : 0
      const tauxGlobal = totalDemandes > 0 ? (signes / totalDemandes) * 100 : 0
      const delaiMoyen = calcDelaiMoyen(dossiersSignes)

      return {
        totalDemandes,
        devisEnvoyes,
        signes,
        refuses,
        enCours,
        tauxDevis,
        tauxConversion,
        tauxGlobal,
        delaiMoyen,
      }
    } else {
      // Mode départ : filtrer par date de départ
      const allDossiersInPeriod = dossiers.filter(d => {
        if (!d.departure_date) return false
        return isInPeriod(d.departure_date)
      })

      const totalDemandes = allDossiersInPeriod.length
      const devisEnvoyes = allDossiersInPeriod.filter(d => {
        const devis = d.devis || []
        return devis.some((dev: any) => dev.status === 'sent' || dev.status === 'accepted')
      }).length
      const dossiersSignes = allDossiersInPeriod.filter(d => d.contract_signed_at)
      const signes = dossiersSignes.length
      const refuses = allDossiersInPeriod.filter(d => d.status === 'lost' || d.status === 'cancelled').length
      const enCours = allDossiersInPeriod.filter(d => {
        return !d.contract_signed_at && d.status !== 'lost' && d.status !== 'cancelled'
      }).length

      const tauxDevis = totalDemandes > 0 ? (devisEnvoyes / totalDemandes) * 100 : 0
      const tauxConversion = devisEnvoyes > 0 ? (signes / devisEnvoyes) * 100 : 0
      const tauxGlobal = totalDemandes > 0 ? (signes / totalDemandes) * 100 : 0
      const delaiMoyen = calcDelaiMoyen(dossiersSignes)

      return {
        totalDemandes,
        devisEnvoyes,
        signes,
        refuses,
        enCours,
        tauxDevis,
        tauxConversion,
        tauxGlobal,
        delaiMoyen,
      }
    }
  }, [dossiers, dateMode, periodFilter, selectedYear, selectedMonth])

  // Stats par transporteur (enrichies avec CA, marge)
  const statsTransporteurs = useMemo(() => {
    const byTransporteur: Record<string, {
      id: string
      name: string
      number: string
      nbDossiers: number
      totalCA: number
      totalVenteHT: number
      totalAchat: number
      totalMarge: number
      margePercent: number
      totalPaye: number
      resteAPayer: number
    }> = {}

    filteredDossiers.forEach(d => {
      if (d.transporteur_id && d.transporteur) {
        const tid = d.transporteur_id
        if (!byTransporteur[tid]) {
          byTransporteur[tid] = {
            id: tid,
            name: d.transporteur.name,
            number: d.transporteur.number,
            nbDossiers: 0,
            totalCA: 0,
            totalVenteHT: 0,
            totalAchat: 0,
            totalMarge: 0,
            margePercent: 0,
            totalPaye: 0,
            resteAPayer: 0,
          }
        }
        byTransporteur[tid].nbDossiers++
        byTransporteur[tid].totalCA += d.price_ttc || 0
        byTransporteur[tid].totalVenteHT += d.price_ht || 0
        byTransporteur[tid].totalAchat += d.price_achat || 0
        byTransporteur[tid].totalMarge += (d.price_ht || 0) - (d.price_achat || 0)
      }
    })

    // Ajouter les paiements fournisseurs
    paiementsFournisseurs.forEach(pf => {
      if (pf.transporteur_id && byTransporteur[pf.transporteur_id]) {
        byTransporteur[pf.transporteur_id].totalPaye += pf.amount || 0
      }
    })

    // Calculer reste à payer et % marge (marge / prix vente HT)
    Object.values(byTransporteur).forEach(t => {
      t.resteAPayer = t.totalAchat - t.totalPaye
      t.margePercent = t.totalVenteHT > 0 ? (t.totalMarge / t.totalVenteHT) * 100 : 0
    })

    return Object.values(byTransporteur).sort((a, b) => b.totalCA - a.totalCA)
  }, [filteredDossiers, paiementsFournisseurs])

  // Stats par mois (pour le graphique) - basé sur la date de signature ou de départ
  const statsByMonth = useMemo(() => {
    const months: Record<string, { month: string, ca: number, marge: number, signatures: number }> = {}

    dossiers.forEach(d => {
      const contrat = Array.isArray(d.contrats) ? d.contrats[0] : d.contrats
      if (!contrat?.signed_at) return

      // Choisir la date selon le mode
      let targetDate: Date
      if (dateMode === 'signature') {
        targetDate = new Date(contrat.signed_at)
      } else {
        if (!d.departure_date) return
        targetDate = new Date(d.departure_date)
      }

      if (targetDate.getFullYear() !== selectedYear) return

      const monthKey = `${targetDate.getMonth() + 1}`.padStart(2, '0')
      const monthName = targetDate.toLocaleDateString('fr-FR', { month: 'short' })

      if (!months[monthKey]) {
        months[monthKey] = { month: monthName, ca: 0, marge: 0, signatures: 0 }
      }
      months[monthKey].ca += d.price_ttc || 0
      months[monthKey].marge += (d.price_ht || 0) - (d.price_achat || 0)
      months[monthKey].signatures++
    })

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)
  }, [dossiers, dateMode, selectedYear])

  // Dossiers filtrés selon le type de filtre sélectionné
  const dossiersFiltered = useMemo(() => {
    if (!filterType) return []

    switch (filterType) {
      case 'signatures':
      case 'ca':
      case 'marge':
      case 'achats':
        return filteredDossiers
      case 'encaisse':
        // Dossiers avec au moins un paiement reçu
        return filteredDossiers.filter(d => {
          const paiements = Array.isArray(d.paiements) ? d.paiements : []
          const totalPaye = paiements.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)
          return totalPaye > 0
        })
      case 'reste_encaisser':
        // Dossiers avec reste à encaisser (factures en attente)
        return filteredDossiers.filter(d => {
          const paiements = Array.isArray(d.paiements) ? d.paiements : []
          const totalPaye = paiements.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)
          const resteAEncaisser = (Number(d.price_ttc) || 0) - totalPaye
          return resteAEncaisser > 0
        })
      case 'paye_fournisseur':
        // Dossiers avec fournisseur au moins partiellement payé
        return filteredDossiers.filter(d => {
          if (!d.transporteur_id) return false
          const paiementsDossier = paiementsFournisseurs.filter(pf => pf.dossier_id === d.id)
          const totalPaye = paiementsDossier.reduce((s: number, pf: any) => s + (Number(pf.amount) || 0), 0)
          return totalPaye > 0
        })
      case 'reste_payer_fournisseur':
        return filteredDossiers.filter(d => {
          if (!d.transporteur_id) return false
          const paiementsDossier = paiementsFournisseurs.filter(pf => pf.dossier_id === d.id)
          const totalPaye = paiementsDossier.reduce((s: number, pf: any) => s + (Number(pf.amount) || 0), 0)
          return (Number(d.price_achat) || 0) - totalPaye > 0
        })
      default:
        return filteredDossiers
    }
  }, [filteredDossiers, filterType, paiementsFournisseurs])

  // Dossiers d'un transporteur avec reste à payer
  const dossiersTransporteurNonPayes = useMemo(() => {
    if (!selectedTransporteurForPayment) return []
    return filteredDossiers.filter(d => {
      if (d.transporteur_id !== selectedTransporteurForPayment.id) return false
      const paiementsDossier = paiementsFournisseurs.filter(pf => pf.dossier_id === d.id)
      const totalPaye = paiementsDossier.reduce((s: number, pf: any) => s + (pf.amount || 0), 0)
      return (d.price_achat || 0) - totalPaye > 0
    })
  }, [filteredDossiers, selectedTransporteurForPayment, paiementsFournisseurs])

  const maxCA = Math.max(...statsByMonth.map(s => s.ca), 1)

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
  }, [])

  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
  ]

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-purple-dark flex items-center gap-2">
              <BarChart3 size={24} />
              Statistiques
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Par {dateMode === 'signature' ? 'date de signature' : 'date de départ'}
            </p>
          </div>

          {/* Toggle signature / départ */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDateMode('signature')}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-all",
                dateMode === 'signature'
                  ? "bg-white text-purple-dark font-medium shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Date signature
            </button>
            <button
              onClick={() => setDateMode('departure')}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-all",
                dateMode === 'departure'
                  ? "bg-white text-purple-dark font-medium shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Date départ
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="input w-auto"
            >
              <option value="month">Par mois</option>
              <option value="quarter">Par trimestre</option>
              <option value="year">Par année</option>
              <option value="all">Tout</option>
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="input w-auto"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            {periodFilter === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="input w-auto"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Cards stats principales - cliquables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterType(filterType === 'signatures' ? null : 'signatures')}
          className={cn(
            "card p-4 text-left transition-all",
            filterType === 'signatures'
              ? "bg-gradient-to-br from-purple-100 to-magenta-100 border-purple-400 ring-2 ring-purple-300"
              : "bg-gradient-to-br from-purple-50 to-magenta-50 border-purple-200 hover:border-purple-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple text-white flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Signatures</p>
              <p className="text-2xl font-bold text-purple-dark">{stats.nbSignatures}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'ca' ? null : 'ca')}
          className={cn(
            "card p-4 text-left transition-all",
            filterType === 'ca'
              ? "bg-gradient-to-br from-blue-100 to-cyan-100 border-blue-400 ring-2 ring-blue-300"
              : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 hover:border-blue-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center">
              <Euro size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">CA TTC</p>
              <p className="text-2xl font-bold text-blue-700">{formatPrice(stats.totalCA)}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'marge' ? null : 'marge')}
          className={cn(
            "card p-4 text-left transition-all",
            filterType === 'marge'
              ? "bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-400 ring-2 ring-emerald-300"
              : "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 hover:border-emerald-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Marge HT</p>
              <p className="text-2xl font-bold text-emerald-700">{formatPrice(stats.totalMarge)}</p>
              <p className="text-xs text-emerald-600">{stats.margePercent.toFixed(1)}%</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'achats' ? null : 'achats')}
          className={cn(
            "card p-4 text-left transition-all",
            filterType === 'achats'
              ? "bg-gradient-to-br from-amber-100 to-orange-100 border-amber-400 ring-2 ring-amber-300"
              : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Achats HT</p>
              <p className="text-2xl font-bold text-amber-700">{formatPrice(stats.totalAchat)}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Cards paiements - cliquables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterType(filterType === 'encaisse' ? null : 'encaisse')}
          className={cn(
            "card p-4 text-left transition-all",
            filterType === 'encaisse'
              ? "bg-green-100 border-green-400 ring-2 ring-green-300"
              : "hover:bg-gray-50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Encaissé clients</p>
              <p className="text-lg font-bold text-green-600">{formatPrice(stats.totalPaiementsClients)}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'reste_encaisser' ? null : 'reste_encaisser')}
          className={cn(
            "card p-4 text-left transition-all",
            filterType === 'reste_encaisser'
              ? "bg-red-100 border-red-400 ring-2 ring-red-300"
              : "hover:bg-gray-50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Reste à encaisser</p>
              <p className="text-lg font-bold text-red-600">{formatPrice(stats.resteAEncaisser)}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'paye_fournisseur' ? null : 'paye_fournisseur')}
          className={cn(
            "card p-4 text-left transition-all",
            filterType === 'paye_fournisseur'
              ? "bg-blue-100 border-blue-400 ring-2 ring-blue-300"
              : "hover:bg-gray-50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <PiggyBank size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Payé fournisseurs</p>
              <p className="text-lg font-bold text-blue-600">{formatPrice(stats.totalPayeFournisseurs)}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setFilterType(filterType === 'reste_payer_fournisseur' ? null : 'reste_payer_fournisseur')}
          className={cn(
            "card p-4 text-left transition-all",
            filterType === 'reste_payer_fournisseur'
              ? "bg-orange-100 border-orange-400 ring-2 ring-orange-300"
              : "hover:bg-gray-50"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
              <Truck size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">Reste à payer fournis.</p>
              <p className="text-lg font-bold text-orange-600">{formatPrice(stats.totalAPayerFournisseurs)}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Stats de conversion */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
          <TrendingUp size={20} />
          Taux de conversion
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-gray-700">{conversionStats.totalDemandes}</p>
            <p className="text-sm text-gray-500">Demandes reçues</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-3xl font-bold text-blue-600">{conversionStats.devisEnvoyes}</p>
            <p className="text-sm text-gray-500">Devis envoyés</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-3xl font-bold text-green-600">{conversionStats.signes}</p>
            <p className="text-sm text-gray-500">Contrats signés</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-xl">
            <p className="text-3xl font-bold text-red-500">{conversionStats.refuses}</p>
            <p className="text-sm text-gray-500">Perdus / Annulés</p>
          </div>
        </div>

        {/* Barres de progression conversion */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Taux d'envoi de devis</span>
              <span className="text-sm font-bold text-blue-600">{conversionStats.tauxDevis.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, conversionStats.tauxDevis)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{conversionStats.devisEnvoyes} devis envoyés sur {conversionStats.totalDemandes} demandes</p>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Taux de signature (sur devis envoyés)</span>
              <span className="text-sm font-bold text-green-600">{conversionStats.tauxConversion.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, conversionStats.tauxConversion)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{conversionStats.signes} signés sur {conversionStats.devisEnvoyes} devis envoyés</p>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Taux de conversion global</span>
              <span className="text-sm font-bold text-purple-dark">{conversionStats.tauxGlobal.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-magenta to-purple h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, conversionStats.tauxGlobal)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{conversionStats.signes} signés sur {conversionStats.totalDemandes} demandes ({conversionStats.enCours} en cours)</p>
          </div>

          {/* Délai moyen de signature */}
          {conversionStats.signes > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-amber-500" />
                  <span className="text-sm font-medium text-gray-700">Délai moyen de signature</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-amber-600">
                    {conversionStats.delaiMoyen < 1
                      ? `${Math.round(conversionStats.delaiMoyen * 24)}h`
                      : `${conversionStats.delaiMoyen.toFixed(1).replace('.', ',')} j`
                    }
                  </span>
                  <p className="text-xs text-gray-500">entre demande et signature</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Liste des dossiers filtrés */}
      {filterType && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-purple-dark flex items-center gap-2">
              <FolderOpen size={20} />
              Dossiers ({dossiersFiltered.length})
              <span className="text-sm font-normal text-gray-500">
                - {filterType === 'signatures' && 'Tous les dossiers signés'}
                {filterType === 'ca' && 'Tous les dossiers (CA)'}
                {filterType === 'marge' && 'Tous les dossiers (Marge)'}
                {filterType === 'achats' && 'Tous les dossiers (Achats)'}
                {filterType === 'encaisse' && 'Dossiers avec paiements'}
                {filterType === 'reste_encaisser' && 'Dossiers avec reste à encaisser'}
                {filterType === 'paye_fournisseur' && 'Dossiers avec fournisseur payé'}
                {filterType === 'reste_payer_fournisseur' && 'Dossiers avec reste à payer fournisseur'}
              </span>
            </h2>
            <button
              onClick={() => setFilterType(null)}
              className="btn btn-secondary text-sm"
            >
              <X size={16} />
              Fermer
            </button>
          </div>

          {dossiersFiltered.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucun dossier pour ce filtre</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-semibold text-gray-600">Référence</th>
                    <th className="pb-3 font-semibold text-gray-600">Client</th>
                    <th className="pb-3 font-semibold text-gray-600">Date départ</th>
                    <th className="pb-3 font-semibold text-gray-600">Transporteur</th>
                    <th className="pb-3 font-semibold text-gray-600 text-right">CA TTC</th>
                    <th className="pb-3 font-semibold text-gray-600 text-right">Achat HT</th>
                    <th className="pb-3 font-semibold text-gray-600 text-right">Marge</th>
                    {(filterType === 'reste_encaisser' || filterType === 'encaisse') && (
                      <>
                        <th className="pb-3 font-semibold text-gray-600 text-right">Encaissé</th>
                        <th className="pb-3 font-semibold text-gray-600 text-right">Reste</th>
                      </>
                    )}
                    {(filterType === 'reste_payer_fournisseur' || filterType === 'paye_fournisseur') && (
                      <>
                        <th className="pb-3 font-semibold text-gray-600 text-right">Payé fourn.</th>
                        <th className="pb-3 font-semibold text-gray-600 text-right">Reste</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {dossiersFiltered.map(d => {
                    const paiements = Array.isArray(d.paiements) ? d.paiements : []
                    const totalPaye = paiements.reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0)
                    const resteAEncaisser = (Number(d.price_ttc) || 0) - totalPaye
                    const paiementsDossier = paiementsFournisseurs.filter((pf: any) => pf.dossier_id === d.id)
                    const totalPayeFourn = paiementsDossier.reduce((s: number, pf: any) => s + (Number(pf.amount) || 0), 0)
                    const resteAPayerFourn = (Number(d.price_achat) || 0) - totalPayeFourn
                    const marge = (Number(d.price_ht) || 0) - (Number(d.price_achat) || 0)

                    return (
                      <tr key={d.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 font-medium">#{d.reference}</td>
                        <td className="py-3">{d.client_name}</td>
                        <td className="py-3">{formatDate(d.departure_date)}</td>
                        <td className="py-3">
                          {d.transporteur ? (
                            <span className="bg-purple text-white text-xs font-bold px-2 py-0.5 rounded">
                              {d.transporteur.number}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-3 text-right font-medium">{formatPrice(d.price_ttc || 0)}</td>
                        <td className="py-3 text-right">{formatPrice(d.price_achat || 0)}</td>
                        <td className={cn("py-3 text-right font-medium", marge > 0 ? "text-green-600" : "text-red-600")}>
                          {formatPrice(marge)}
                        </td>
                        {(filterType === 'reste_encaisser' || filterType === 'encaisse') && (
                          <>
                            <td className="py-3 text-right">
                              <span className={cn("font-medium", totalPaye >= (d.price_ttc || 0) ? "text-green-600" : "text-blue-600")}>
                                {formatPrice(totalPaye)}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <span className={cn("font-bold", resteAEncaisser > 0 ? "text-red-600" : "text-green-600")}>
                                {resteAEncaisser > 0 ? formatPrice(resteAEncaisser) : '✓ Soldé'}
                              </span>
                            </td>
                          </>
                        )}
                        {(filterType === 'reste_payer_fournisseur' || filterType === 'paye_fournisseur') && (
                          <>
                            <td className="py-3 text-right">
                              <span className={cn("font-medium", totalPayeFourn >= (d.price_achat || 0) ? "text-green-600" : "text-blue-600")}>
                                {formatPrice(totalPayeFourn)}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <span className={cn("font-bold", resteAPayerFourn > 0 ? "text-orange-600" : "text-green-600")}>
                                {resteAPayerFourn > 0 ? formatPrice(resteAPayerFourn) : '✓ Payé'}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Graphique CA par mois */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
          <BarChart3 size={20} />
          CA et Marge par mois ({selectedYear})
        </h2>

        {statsByMonth.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune donnée pour cette période</p>
        ) : (
          <div className="space-y-3">
            {statsByMonth.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-16 text-sm font-medium text-gray-600">{s.month}</div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg"
                      style={{ width: `${(s.ca / maxCA) * 100}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg opacity-50"
                      style={{ width: `${(s.marge / maxCA) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-28 text-right">
                  <p className="text-sm font-semibold text-blue-600">{formatPrice(s.ca)}</p>
                  <p className="text-xs text-emerald-600">{formatPrice(s.marge)}</p>
                </div>
                <div className="w-16 text-right">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                    {s.signatures} sig.
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500" />
            <span className="text-sm text-gray-600">CA TTC</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span className="text-sm text-gray-600">Marge HT</span>
          </div>
        </div>
      </div>

      {/* Stats par transporteur */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
          <Truck size={20} />
          Statistiques par transporteur
        </h2>

        {statsTransporteurs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Aucune donnée pour cette période</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-semibold text-gray-600">Transporteur</th>
                  <th className="pb-3 font-semibold text-gray-600 text-center">Dossiers</th>
                  <th className="pb-3 font-semibold text-gray-600 text-right">CA TTC</th>
                  <th className="pb-3 font-semibold text-gray-600 text-right">Achats HT</th>
                  <th className="pb-3 font-semibold text-gray-600 text-right">Marge HT</th>
                  <th className="pb-3 font-semibold text-gray-600 text-center">% Marge</th>
                  <th className="pb-3 font-semibold text-gray-600 text-right">Payé</th>
                  <th className="pb-3 font-semibold text-gray-600 text-right">Reste</th>
                  <th className="pb-3 font-semibold text-gray-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {statsTransporteurs.map(t => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple text-white text-xs font-bold px-2 py-0.5 rounded">
                          {t.number}
                        </span>
                        <span className="font-medium">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        {t.nbDossiers}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium text-blue-600">{formatPrice(t.totalCA)}</td>
                    <td className="py-3 text-right font-medium">{formatPrice(t.totalAchat)}</td>
                    <td className={cn("py-3 text-right font-medium", t.totalMarge >= 0 ? "text-green-600" : "text-red-600")}>
                      {formatPrice(t.totalMarge)}
                    </td>
                    <td className="py-3 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        t.margePercent >= 20 ? "bg-green-100 text-green-700" :
                        t.margePercent >= 10 ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {t.margePercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-green-600 font-medium">{formatPrice(t.totalPaye)}</td>
                    <td className="py-3 text-right">
                      <span className={cn(
                        "font-bold",
                        t.resteAPayer > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {t.resteAPayer <= 0 ? 'Soldé' : formatPrice(t.resteAPayer)}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {t.resteAPayer > 0 && (
                        <button
                          onClick={() => {
                            setSelectedTransporteurForPayment(t)
                            setPaiementFournisseurForm({
                              dossier_id: '',
                              amount: 0,
                              payment_date: new Date().toISOString().slice(0, 10),
                              type: 'virement',
                              reference: '',
                              notes: '',
                            })
                            setShowPaiementFournisseurModal(true)
                          }}
                          className="btn bg-orange-500 hover:bg-orange-600 text-white text-xs py-1 px-2"
                        >
                          <Euro size={14} />
                          Payer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-3">Total</td>
                  <td className="py-3 text-center">{statsTransporteurs.reduce((s, t) => s + t.nbDossiers, 0)}</td>
                  <td className="py-3 text-right text-blue-600">{formatPrice(statsTransporteurs.reduce((s, t) => s + t.totalCA, 0))}</td>
                  <td className="py-3 text-right">{formatPrice(statsTransporteurs.reduce((s, t) => s + t.totalAchat, 0))}</td>
                  <td className="py-3 text-right text-green-600">{formatPrice(statsTransporteurs.reduce((s, t) => s + t.totalMarge, 0))}</td>
                  <td className="py-3 text-center">
                    {(() => {
                      const totalVenteHT = statsTransporteurs.reduce((s, t) => s + t.totalVenteHT, 0)
                      const totalMarge = statsTransporteurs.reduce((s, t) => s + t.totalMarge, 0)
                      const avgPercent = totalVenteHT > 0 ? (totalMarge / totalVenteHT) * 100 : 0
                      return <span className="font-bold">{avgPercent.toFixed(1)}%</span>
                    })()}
                  </td>
                  <td className="py-3 text-right text-green-600">{formatPrice(statsTransporteurs.reduce((s, t) => s + t.totalPaye, 0))}</td>
                  <td className="py-3 text-right text-red-600">{formatPrice(statsTransporteurs.reduce((s, t) => s + t.resteAPayer, 0))}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Modal paiement fournisseur depuis stats */}
      <Modal
        isOpen={showPaiementFournisseurModal}
        onClose={() => {
          setShowPaiementFournisseurModal(false)
          setSelectedTransporteurForPayment(null)
        }}
        title={`Payer le fournisseur ${selectedTransporteurForPayment?.name || ''}`}
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowPaiementFournisseurModal(false)
                setSelectedTransporteurForPayment(null)
              }}
            >
              Annuler
            </button>
            <button
              className="btn bg-orange-500 hover:bg-orange-600 text-white"
              onClick={async () => {
                if (!paiementFournisseurForm.dossier_id) {
                  alert('Veuillez sélectionner un dossier')
                  return
                }
                if (paiementFournisseurForm.amount <= 0) {
                  alert('Veuillez entrer un montant valide')
                  return
                }
                try {
                  await createPaiementFournisseur.mutateAsync({
                    dossier_id: paiementFournisseurForm.dossier_id,
                    transporteur_id: selectedTransporteurForPayment.id,
                    amount: paiementFournisseurForm.amount,
                    payment_date: paiementFournisseurForm.payment_date,
                    type: paiementFournisseurForm.type,
                    reference: paiementFournisseurForm.reference || undefined,
                    notes: paiementFournisseurForm.notes || undefined,
                  })
                  setShowPaiementFournisseurModal(false)
                  setSelectedTransporteurForPayment(null)
                  queryClient.invalidateQueries({ queryKey: ['paiements_fournisseurs'] })
                } catch (error) {
                  console.error('Erreur:', error)
                  alert('Erreur lors de l\'ajout du paiement')
                }
              }}
              disabled={createPaiementFournisseur.isPending || !paiementFournisseurForm.dossier_id || paiementFournisseurForm.amount <= 0}
            >
              {createPaiementFournisseur.isPending ? 'Ajout...' : 'Enregistrer le paiement'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Info transporteur */}
          {selectedTransporteurForPayment && (
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <span className="bg-purple text-white text-xs font-bold px-2 py-1 rounded">
                {selectedTransporteurForPayment.number}
              </span>
              <div>
                <p className="font-medium">{selectedTransporteurForPayment.name}</p>
                <p className="text-sm text-gray-500">
                  Reste à payer : <span className="text-red-600 font-bold">{formatPrice(selectedTransporteurForPayment.resteAPayer)}</span>
                </p>
              </div>
            </div>
          )}

          {/* Sélection du dossier */}
          <div>
            <label className="label">Dossier à payer *</label>
            <select
              className="input"
              value={paiementFournisseurForm.dossier_id}
              onChange={(e) => {
                const dossierId = e.target.value
                setPaiementFournisseurForm({ ...paiementFournisseurForm, dossier_id: dossierId })
                // Auto-remplir le montant avec le reste à payer du dossier
                if (dossierId) {
                  const dossier = dossiersTransporteurNonPayes.find(d => d.id === dossierId)
                  if (dossier) {
                    const paiementsDossier = paiementsFournisseurs.filter(pf => pf.dossier_id === dossier.id)
                    const totalPaye = paiementsDossier.reduce((s: number, pf: any) => s + (pf.amount || 0), 0)
                    const reste = (dossier.price_achat || 0) - totalPaye
                    setPaiementFournisseurForm(prev => ({ ...prev, dossier_id: dossierId, amount: reste > 0 ? reste : 0 }))
                  }
                }
              }}
            >
              <option value="">Sélectionner un dossier...</option>
              {dossiersTransporteurNonPayes.map(d => {
                const paiementsDossier = paiementsFournisseurs.filter(pf => pf.dossier_id === d.id)
                const totalPaye = paiementsDossier.reduce((s: number, pf: any) => s + (pf.amount || 0), 0)
                const reste = (d.price_achat || 0) - totalPaye
                return (
                  <option key={d.id} value={d.id}>
                    #{d.reference} - {d.client_name} - Reste: {formatPrice(reste)}
                  </option>
                )
              })}
            </select>
            {dossiersTransporteurNonPayes.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">Aucun dossier avec reste à payer pour ce transporteur</p>
            )}
          </div>

          <div>
            <label className="label">Type de paiement *</label>
            <select
              className="input"
              value={paiementFournisseurForm.type}
              onChange={(e) => setPaiementFournisseurForm({ ...paiementFournisseurForm, type: e.target.value })}
            >
              <option value="virement">Virement bancaire</option>
              <option value="cb">Carte bancaire</option>
              <option value="cheque">Chèque</option>
              <option value="especes">Espèces</option>
            </select>
          </div>

          <div>
            <label className="label">Montant *</label>
            <input
              type="number"
              className="input"
              value={paiementFournisseurForm.amount}
              onChange={(e) => setPaiementFournisseurForm({ ...paiementFournisseurForm, amount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="label">Date du paiement *</label>
            <input
              type="date"
              className="input"
              value={paiementFournisseurForm.payment_date}
              onChange={(e) => setPaiementFournisseurForm({ ...paiementFournisseurForm, payment_date: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Référence (optionnel)</label>
            <input
              type="text"
              className="input"
              placeholder="N° de virement, référence..."
              value={paiementFournisseurForm.reference}
              onChange={(e) => setPaiementFournisseurForm({ ...paiementFournisseurForm, reference: e.target.value })}
            />
          </div>

          <div>
            <label className="label">Notes (optionnel)</label>
            <textarea
              className="input min-h-16"
              placeholder="Remarques sur ce paiement..."
              value={paiementFournisseurForm.notes}
              onChange={(e) => setPaiementFournisseurForm({ ...paiementFournisseurForm, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================
// CALENDRIER PAGE (RAPPELS)
// ============================================
function CalendrierPage({ dossiers, onSelectDossier }: {
  dossiers: DossierWithRelations[]
  onSelectDossier: (d: any) => void
}) {
  const { data: rappels = [], isLoading } = useRappels({ includeCompleted: true })
  const updateRappel = useUpdateRappel()
  const deleteRappel = useDeleteRappel()
  const createRappel = useCreateRappel()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [showCompleted, setShowCompleted] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showNewRappelModal, setShowNewRappelModal] = useState(false)
  const [newRappelForm, setNewRappelForm] = useState({
    title: '',
    description: '',
    reminder_date: new Date().toISOString().slice(0, 10),
    reminder_time: '09:00',
    priority: 'normal' as string,
    dossier_id: '',
  })

  // Filtrer les rappels
  const filteredRappels = useMemo(() => {
    return rappels.filter((r: any) => {
      if (!showCompleted && r.is_done) return false
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
      return true
    })
  }, [rappels, showCompleted, priorityFilter])

  // Grouper par date
  const rappelsByDate = useMemo(() => {
    const groups: Record<string, any[]> = {}
    filteredRappels.forEach((r: any) => {
      const date = r.reminder_date.split('T')[0]
      if (!groups[date]) groups[date] = []
      groups[date].push(r)
    })
    return groups
  }, [filteredRappels])

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayRappels = rappels.filter((r: any) => r.reminder_date.split('T')[0] === today && !r.is_done)
    const overdueRappels = rappels.filter((r: any) => r.reminder_date.split('T')[0] < today && !r.is_done)
    const upcomingRappels = rappels.filter((r: any) => r.reminder_date.split('T')[0] > today && !r.is_done)
    const completedRappels = rappels.filter((r: any) => r.is_done)

    return {
      today: todayRappels.length,
      overdue: overdueRappels.length,
      upcoming: upcomingRappels.length,
      completed: completedRappels.length,
      total: rappels.length,
    }
  }, [rappels])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'low': return 'text-gray-500 bg-gray-50 border-gray-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent'
      case 'high': return 'Haute'
      case 'normal': return 'Normale'
      case 'low': return 'Basse'
      default: return priority
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-purple-dark" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-purple-dark">Calendrier des rappels</h1>
          <p className="text-gray-500 mt-1">Gérez vos rappels et tâches à faire</p>
        </div>
        <button
          onClick={() => setShowNewRappelModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Nouveau rappel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">En retard</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertTriangle className="text-red-500" size={24} />
          </div>
        </div>
        <div className="card p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aujourd'hui</p>
              <p className="text-2xl font-bold text-orange-600">{stats.today}</p>
            </div>
            <BellRing className="text-orange-500" size={24} />
          </div>
        </div>
        <div className="card p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">À venir</p>
              <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
            </div>
            <Calendar className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="card p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Terminés</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Priorité:</label>
            <select
              className="input py-1.5 text-sm"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">Toutes</option>
              <option value="urgent">Urgente</option>
              <option value="high">Haute</option>
              <option value="normal">Normale</option>
              <option value="low">Basse</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-600">Afficher les terminés</span>
          </label>

          <div className="ml-auto text-sm text-gray-500">
            {filteredRappels.length} rappel{filteredRappels.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Rappels List */}
      <div className="space-y-4">
        {Object.entries(rappelsByDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, dateRappels]) => {
            const dateObj = new Date(date)
            const today = new Date().toISOString().slice(0, 10)
            const isToday = date === today
            const isPast = date < today

            return (
              <div key={date} className="card overflow-hidden">
                <div className={cn(
                  "px-4 py-2 font-medium flex items-center gap-2",
                  isToday && "bg-orange-100 text-orange-800",
                  isPast && !isToday && "bg-red-100 text-red-800",
                  !isToday && !isPast && "bg-gray-100 text-gray-700"
                )}>
                  <Calendar size={16} />
                  {isToday ? "Aujourd'hui" : dateObj.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  {isPast && !isToday && <span className="ml-2 text-xs px-2 py-0.5 bg-red-200 rounded-full">En retard</span>}
                  <span className="ml-auto text-sm opacity-75">{dateRappels.length} rappel{dateRappels.length > 1 ? 's' : ''}</span>
                </div>

                <div className="divide-y">
                  {dateRappels.map((rappel: any) => (
                    <div
                      key={rappel.id}
                      className={cn(
                        "p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors",
                        rappel.is_done && "opacity-50"
                      )}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => updateRappel.mutate({ id: rappel.id, is_done: !rappel.is_done })}
                        className={cn(
                          "mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          rappel.is_done
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-gray-300 hover:border-purple-500"
                        )}
                      >
                        {rappel.is_done && <Check size={12} />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <h3 className={cn(
                            "font-medium",
                            rappel.is_done && "line-through text-gray-400"
                          )}>
                            {rappel.title}
                          </h3>
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-full border",
                            getPriorityColor(rappel.priority)
                          )}>
                            {getPriorityLabel(rappel.priority)}
                          </span>
                        </div>

                        {rappel.description && (
                          <p className="text-sm text-gray-500 mt-1">{rappel.description}</p>
                        )}

                        {rappel.dossier && (
                          <button
                            onClick={() => onSelectDossier(dossiers.find(d => d.id === rappel.dossier_id))}
                            className="mt-2 inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
                          >
                            <FolderOpen size={14} />
                            {rappel.dossier.reference} - {rappel.dossier.client_name}
                          </button>
                        )}

                        {rappel.reminder_time && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <Clock size={12} />
                            {rappel.reminder_time.slice(0, 5)}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (confirm('Supprimer ce rappel ?')) {
                              deleteRappel.mutate(rappel.id)
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

        {filteredRappels.length === 0 && (
          <div className="card p-12 text-center">
            <Bell className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-500">Aucun rappel</h3>
            <p className="text-gray-400 mt-1">Créez un rappel pour ne rien oublier</p>
            <button
              onClick={() => setShowNewRappelModal(true)}
              className="btn btn-primary mt-4"
            >
              <Plus size={18} />
              Nouveau rappel
            </button>
          </div>
        )}
      </div>

      {/* Modal Nouveau Rappel */}
      <Modal
        isOpen={showNewRappelModal}
        onClose={() => {
          setShowNewRappelModal(false)
          setNewRappelForm({
            title: '',
            description: '',
            reminder_date: new Date().toISOString().slice(0, 10),
            reminder_time: '09:00',
            priority: 'normal',
            dossier_id: '',
          })
        }}
        title="Nouveau rappel"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Titre du rappel *</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Relancer le client"
              value={newRappelForm.title}
              onChange={(e) => setNewRappelForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Description (optionnel)</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="Notes supplémentaires..."
              value={newRappelForm.description}
              onChange={(e) => setNewRappelForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Dossier associé (optionnel)</label>
            <select
              className="input"
              value={newRappelForm.dossier_id}
              onChange={(e) => setNewRappelForm(prev => ({ ...prev, dossier_id: e.target.value }))}
            >
              <option value="">Aucun dossier</option>
              {dossiers.slice(0, 50).map(d => (
                <option key={d.id} value={d.id}>{d.reference} - {d.client_name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input
                type="date"
                className="input"
                value={newRappelForm.reminder_date}
                onChange={(e) => setNewRappelForm(prev => ({ ...prev, reminder_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Heure</label>
              <input
                type="time"
                className="input"
                value={newRappelForm.reminder_time}
                onChange={(e) => setNewRappelForm(prev => ({ ...prev, reminder_time: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Priorité</label>
            <select
              className="input"
              value={newRappelForm.priority}
              onChange={(e) => setNewRappelForm(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="low">Basse</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setShowNewRappelModal(false)
                setNewRappelForm({
                  title: '',
                  description: '',
                  reminder_date: new Date().toISOString().slice(0, 10),
                  reminder_time: '09:00',
                  priority: 'normal',
                  dossier_id: '',
                })
              }}
              className="btn btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                if (!newRappelForm.title.trim()) {
                  alert('Veuillez saisir un titre')
                  return
                }
                await createRappel.mutateAsync({
                  dossier_id: newRappelForm.dossier_id || undefined,
                  title: newRappelForm.title,
                  description: newRappelForm.description || undefined,
                  reminder_date: newRappelForm.reminder_date,
                  reminder_time: newRappelForm.reminder_time || undefined,
                  priority: newRappelForm.priority,
                })
                setShowNewRappelModal(false)
                setNewRappelForm({
                  title: '',
                  description: '',
                  reminder_date: new Date().toISOString().slice(0, 10),
                  reminder_time: '09:00',
                  priority: 'normal',
                  dossier_id: '',
                })
              }}
              disabled={createRappel.isPending}
              className="btn btn-primary flex-1"
            >
              {createRappel.isPending ? 'Création...' : 'Créer le rappel'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================
// TRANSPORTEURS PAGE
// ============================================
function TransporteursPage({ transporteurs }: { transporteurs: any[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTransporteur, setSelectedTransporteur] = useState<any | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    number: '',
    email: '',
    phone: '',
    astreinte_tel: '',
    city: '',
    tags: '',
    categories: '',
    regions: '',
    rating: 0,
    notes: '',
  })

  const updateTransporteur = useUpdateTransporteur()
  const createTransporteur = useCreateTransporteur()
  const deleteTransporteur = useDeleteTransporteur()

  const filteredTransporteurs = transporteurs.filter((t) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      t.name?.toLowerCase().includes(query) ||
      t.number?.toLowerCase().includes(query) ||
      t.city?.toLowerCase().includes(query) ||
      t.email?.toLowerCase().includes(query) ||
      t.tags?.some((tag: string) => tag.toLowerCase().includes(query)) ||
      t.categories?.some((cat: string) => cat.toLowerCase().includes(query))
    )
  })

  const handleEdit = (t: any) => {
    setSelectedTransporteur(t)
    setEditForm({
      name: t.name || '',
      number: t.number || '',
      email: t.email || '',
      phone: t.phone || '',
      astreinte_tel: t.astreinte_tel || '',
      city: t.city || '',
      tags: t.tags?.join(', ') || '',
      categories: t.categories?.join(', ') || '',
      regions: t.regions?.join(', ') || '',
      rating: t.rating || 0,
      notes: t.notes || '',
    })
    setShowEditModal(true)
  }

  const handleCreate = () => {
    setEditForm({
      name: '',
      number: '',
      email: '',
      phone: '',
      astreinte_tel: '',
      city: '',
      tags: '',
      categories: '',
      regions: '',
      rating: 0,
      notes: '',
    })
    setShowCreateModal(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedTransporteur) return
    try {
      await updateTransporteur.mutateAsync({
        id: selectedTransporteur.id,
        name: editForm.name,
        number: editForm.number,
        email: editForm.email || null,
        phone: editForm.phone || null,
        astreinte_tel: editForm.astreinte_tel || null,
        city: editForm.city || null,
        tags: editForm.tags ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        categories: editForm.categories ? editForm.categories.split(',').map((c) => c.trim()).filter(Boolean) : [],
        regions: editForm.regions ? editForm.regions.split(',').map((r) => r.trim()).filter(Boolean) : [],
        rating: editForm.rating,
        notes: editForm.notes || null,
      })
      setShowEditModal(false)
      setSelectedTransporteur(null)
    } catch (error) {
      console.error('Erreur mise à jour transporteur:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  const handleSaveCreate = async () => {
    if (!editForm.name || !editForm.number) {
      alert('Nom et numéro sont obligatoires')
      return
    }
    try {
      await createTransporteur.mutateAsync({
        name: editForm.name,
        number: editForm.number,
        email: editForm.email || null,
        phone: editForm.phone || null,
        astreinte_tel: editForm.astreinte_tel || null,
        city: editForm.city || null,
        tags: editForm.tags ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        categories: editForm.categories ? editForm.categories.split(',').map((c) => c.trim()).filter(Boolean) : [],
        regions: editForm.regions ? editForm.regions.split(',').map((r) => r.trim()).filter(Boolean) : [],
        rating: editForm.rating,
        notes: editForm.notes || null,
        is_active: true,
        active: true,
      })
      setShowCreateModal(false)
    } catch (error) {
      console.error('Erreur création transporteur:', error)
      alert('Erreur lors de la création')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Désactiver ce transporteur ?')) return
    try {
      await deleteTransporteur.mutateAsync(id)
    } catch (error) {
      console.error('Erreur suppression transporteur:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Get all unique tags and categories
  const allTags = [...new Set(transporteurs.flatMap((t) => t.tags || []))].sort()
  const allCategories = [...new Set(transporteurs.flatMap((t) => t.categories || []))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, numéro, ville, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button onClick={handleCreate} className="btn btn-primary">
          <Plus size={16} />
          Nouveau transporteur
        </button>
      </div>

      {/* Tags filter */}
      {(allTags.length > 0 || allCategories.length > 0) && (
        <div className="card p-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 mr-2">Filtrer par tag:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className={`text-xs px-2 py-1 rounded-full ${
                  searchQuery === tag ? 'bg-purple text-white' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSearchQuery(cat)}
                className={`text-xs px-2 py-1 rounded-full ${
                  searchQuery === cat ? 'bg-magenta text-white' : 'bg-purple-100 hover:bg-purple-200'
                }`}
              >
                {cat}
              </button>
            ))}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              >
                ✕ Effacer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-purple-dark">{transporteurs.length}</p>
          <p className="text-sm text-gray-500">Total actifs</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{transporteurs.filter((t) => (t.rating || 0) >= 4).length}</p>
          <p className="text-sm text-gray-500">Note ≥ 4/5</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{allTags.length}</p>
          <p className="text-sm text-gray-500">Tags</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl font-bold text-magenta">{allCategories.length}</p>
          <p className="text-sm text-gray-500">Catégories</p>
        </div>
      </div>

      {/* Transporteurs Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTransporteurs.map((t) => (
          <div
            key={t.id}
            className="card p-4 hover:shadow-lg transition-shadow cursor-pointer relative group"
            onClick={() => handleEdit(t)}
          >
            {/* Bouton supprimer en haut à droite */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(t.id)
              }}
              className="absolute top-2 right-2 p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Désactiver"
            >
              <Trash2 size={14} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <span className="bg-purple text-white text-xs font-bold px-2 py-1 rounded">
                {t.number}
              </span>
              <span className="font-semibold text-purple-dark">{t.name}</span>
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              {t.city && <div className="flex items-center gap-2"><MapPin size={14} /> {t.city}</div>}
              {t.email && <div className="flex items-center gap-2"><Mail size={14} /> {t.email}</div>}
              {t.phone && <div className="flex items-center gap-2"><Phone size={14} /> {t.phone}</div>}
            </div>

            {/* Tags & Categories - affichage discret avec virgules */}
            {(t.tags?.length > 0 || t.categories?.length > 0) && (
              <div className="text-xs text-gray-500 mt-2">
                {t.tags?.length > 0 && <span>{t.tags.join(', ')}</span>}
                {t.tags?.length > 0 && t.categories?.length > 0 && <span> · </span>}
                {t.categories?.length > 0 && <span className="text-purple-600">{t.categories.join(', ')}</span>}
              </div>
            )}

            {/* Notes */}
            {t.notes && (
              <div className="text-xs text-gray-400 italic mt-1 line-clamp-2">
                {t.notes}
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
              <span className="text-yellow-500">{'★'.repeat(Math.floor(t.rating || 0))}</span>
              <span className="text-gray-300">{'★'.repeat(5 - Math.floor(t.rating || 0))}</span>
              <span className="text-sm text-gray-500">{(t.rating || 0).toFixed(1).replace('.', ',')}/5</span>
            </div>
          </div>
        ))}
      </div>

      {filteredTransporteurs.length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          Aucun transporteur trouvé
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier le transporteur">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Numéro *</label>
              <input
                type="text"
                value={editForm.number}
                onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                className="input"
                placeholder="T001"
              />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="input"
                placeholder="Transport Express"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="input"
                placeholder="contact@transport.fr"
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="input"
                placeholder="01 23 45 67 89"
              />
            </div>
          </div>

          <div>
            <label className="label">Téléphone astreinte</label>
            <input
              type="tel"
              value={editForm.astreinte_tel}
              onChange={(e) => setEditForm({ ...editForm, astreinte_tel: e.target.value })}
              className="input"
              placeholder="06 12 34 56 78"
            />
            <p className="text-xs text-gray-400 mt-1">Numéro d'urgence/astreinte pour les chauffeurs</p>
          </div>

          <div>
            <label className="label">Ville</label>
            <input
              type="text"
              value={editForm.city}
              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              className="input"
              placeholder="Paris"
            />
          </div>

          <div>
            <label className="label">Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              className="input"
              placeholder="Nord, GT, Scolaire"
            />
            <p className="text-xs text-gray-400 mt-1">Ex: Nord, Sud, GT, Standard, Scolaire, VIP</p>
          </div>

          <div>
            <label className="label">Catégories (séparées par des virgules)</label>
            <input
              type="text"
              value={editForm.categories}
              onChange={(e) => setEditForm({ ...editForm, categories: e.target.value })}
              className="input"
              placeholder="Minibus, Autocar"
            />
            <p className="text-xs text-gray-400 mt-1">Ex: Minibus, Autocar, Autocar GT, VTC</p>
          </div>

          <div>
            <label className="label">Régions (séparées par des virgules)</label>
            <input
              type="text"
              value={editForm.regions}
              onChange={(e) => setEditForm({ ...editForm, regions: e.target.value })}
              className="input"
              placeholder="Île-de-France, Hauts-de-France"
            />
          </div>

          <div>
            <label className="label">Évaluation (0 à 5)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={editForm.rating}
              onChange={(e) => setEditForm({ ...editForm, rating: parseFloat(e.target.value) || 0 })}
              className="input"
              placeholder="Ex: 4,5"
            />
          </div>

          <div>
            <label className="label">Notes internes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Commentaires, remarques..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={handleSaveEdit} className="btn btn-primary flex-1">
              <Save size={16} />
              Enregistrer
            </button>
            <button onClick={() => setShowEditModal(false)} className="btn btn-outline">
              Annuler
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nouveau transporteur">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Numéro *</label>
              <input
                type="text"
                value={editForm.number}
                onChange={(e) => setEditForm({ ...editForm, number: e.target.value })}
                className="input"
                placeholder="T001"
              />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="input"
                placeholder="Transport Express"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="input"
                placeholder="contact@transport.fr"
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="input"
                placeholder="01 23 45 67 89"
              />
            </div>
          </div>

          <div>
            <label className="label">Téléphone astreinte</label>
            <input
              type="tel"
              value={editForm.astreinte_tel}
              onChange={(e) => setEditForm({ ...editForm, astreinte_tel: e.target.value })}
              className="input"
              placeholder="06 12 34 56 78"
            />
            <p className="text-xs text-gray-400 mt-1">Numéro d'urgence/astreinte pour les chauffeurs</p>
          </div>

          <div>
            <label className="label">Ville</label>
            <input
              type="text"
              value={editForm.city}
              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              className="input"
              placeholder="Paris"
            />
          </div>

          <div>
            <label className="label">Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={editForm.tags}
              onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
              className="input"
              placeholder="Nord, GT, Scolaire"
            />
          </div>

          <div>
            <label className="label">Catégories (séparées par des virgules)</label>
            <input
              type="text"
              value={editForm.categories}
              onChange={(e) => setEditForm({ ...editForm, categories: e.target.value })}
              className="input"
              placeholder="Minibus, Autocar"
            />
          </div>

          <div>
            <label className="label">Régions (séparées par des virgules)</label>
            <input
              type="text"
              value={editForm.regions}
              onChange={(e) => setEditForm({ ...editForm, regions: e.target.value })}
              className="input"
              placeholder="Île-de-France, Hauts-de-France"
            />
          </div>

          <div>
            <label className="label">Notes internes</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              className="input min-h-[80px]"
              placeholder="Commentaires, remarques..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button onClick={handleSaveCreate} className="btn btn-primary flex-1">
              <Plus size={16} />
              Créer
            </button>
            <button onClick={() => setShowCreateModal(false)} className="btn btn-outline">
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================
// EXPLOITATION PAGE
// ============================================
function ExploitationPage({
  transporteurs,
  setCurrentPage,
  setSearchQuery: setGlobalSearchQuery,
  openEmailPreview,
}: {
  transporteurs: any[]
  setCurrentPage: (p: Page) => void
  setSearchQuery: (q: string) => void
  openEmailPreview: (data: { to: string; subject: string; body: string }, onSend?: () => void | Promise<void>) => void
}) {
  const [dateDebut, setDateDebut] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [dateFin, setDateFin] = useState('')
  const [filterOption, setFilterOption] = useState('default')
  const [dossierFilter, setDossierFilter] = useState('')
  const [bpaFilter, setBpaFilter] = useState<'tous' | 'sans_bpa' | 'avec_bpa'>('sans_bpa') // Par défaut: cacher les dossiers avec BPA reçu
  const [contratFilter, setContratFilter] = useState<'tous' | 'signes' | 'non_signes'>('signes') // Par défaut: dossiers signés
  const [selectedDossier, setSelectedDossier] = useState<any | null>(null)
  const [showEnvoiModal, setShowEnvoiModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedTransporteurs, setSelectedTransporteurs] = useState<string[]>([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [messageTemplate, setMessageTemplate] = useState('')

  const queryClient = useQueryClient()
  const { data: demandesFournisseurs = [], isLoading } = useAllDemandesFournisseurs()
  const { data: dossiers = [] } = useDossiers()
  const createDemandeFournisseur = useCreateDemandeFournisseur()
  const updateDemandeFournisseur = useUpdateDemandeFournisseur()
  const deleteDemandeFournisseur = useDeleteDemandeFournisseur()
  const createDevis = useCreateDevis()
  const addTimelineEntry = useAddTimelineEntry()

  // Group demandes by dossier
  const demandesParDossier = useMemo(() => {
    const grouped: Record<string, any[]> = {}
    demandesFournisseurs.forEach((df: any) => {
      const dossierId = df.dossier_id
      if (!grouped[dossierId]) grouped[dossierId] = []
      grouped[dossierId].push(df)
    })
    return grouped
  }, [demandesFournisseurs])

  // Get dossiers with their demandes fournisseurs
  const dossiersAvecDemandes = useMemo(() => {
    return dossiers
      .filter((d: any) => {
        // Filter by date
        if (dateDebut && d.departure_date < dateDebut) return false
        if (dateFin && d.departure_date > dateFin) return false
        // Filter by dossier number
        if (dossierFilter && !d.reference.toLowerCase().includes(dossierFilter.toLowerCase())) return false
        return true
      })
      .map((d: any) => ({
        ...d,
        demandes_fournisseurs: demandesParDossier[d.id] || [],
      }))
      .filter((d: any) => {
        // Filtre Contrat signé
        const isContratSigne = !!d.contract_signed_at
        if (contratFilter === 'signes' && !isContratSigne) return false
        if (contratFilter === 'non_signes' && isContratSigne) return false

        // Filtre BPA: vérifier si le dossier a un BPA reçu
        const hasBpaReceived = d.demandes_fournisseurs.some((df: any) =>
          df.status === 'bpa_received' || df.status === 'accepted' || df.bpa_received_at
        )

        if (bpaFilter === 'sans_bpa') {
          // Exclure les dossiers avec BPA reçu
          return !hasBpaReceived
        } else if (bpaFilter === 'avec_bpa') {
          // Seulement les dossiers avec BPA reçu
          return hasBpaReceived
        }
        // 'tous' - pas de filtre
        return true
      })
      .sort((a: any, b: any) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime())
  }, [dossiers, demandesParDossier, dateDebut, dateFin, dossierFilter, bpaFilter, contratFilter])

  // Categories from transporteurs
  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    transporteurs.forEach((t: any) => {
      t.categories?.forEach((c: string) => cats.add(c))
      t.tags?.forEach((c: string) => cats.add(c))
    })
    return Array.from(cats).sort()
  }, [transporteurs])

  // Filter transporteurs by category
  const filteredTransporteurs = useMemo(() => {
    if (!categoryFilter) return transporteurs.filter((t: any) => t.active !== false && t.is_active !== false)
    return transporteurs.filter((t: any) => {
      if (t.active === false || t.is_active === false) return false
      return t.categories?.includes(categoryFilter) || t.tags?.includes(categoryFilter)
    })
  }, [transporteurs, categoryFilter])

  // Générer le template de message depuis la BDD
  const generateMessageTemplateAsync = async (dossier: any): Promise<string> => {
    if (!dossier) return ''
    const d = dossier

    // Utiliser le template depuis la base de données
    try {
      const emailData = await generateDemandePrixEmailFromTemplate({
        transporteurEmail: '', // Pas utilisé pour le template, juste pour le body
        dossierReference: d.reference || '',
        departureCity: d.departure,
        arrivalCity: d.arrival,
        departureDate: d.departure_date,
        returnDate: d.return_date,
        departureTime: d.departure_time,
        returnTime: d.return_time,
        tripMode: d.trip_mode,
        passengers: d.passengers,
        vehicleType: d.vehicle_type,
        departureAddress: d.departure_address,
        arrivalAddress: d.arrival_address,
        specialRequests: d.special_requests,
        luggageType: d.luggage_type,
        madDetails: extractMadDetails(d.special_requests),
      })
      return emailData.body
    } catch (error) {
      console.error('Erreur chargement template:', error)
      // Fallback sur un template basique
      const tripModeLabels: Record<string, string> = {
        'aller_simple': 'Aller simple',
        'one-way': 'Aller simple',
        'aller_retour': 'Aller-Retour',
        'round-trip': 'Aller-Retour',
        'circuit': 'Circuit',
        'mise-a-dispo': 'Mise à disposition',
        'Aller simple': 'Aller simple',
        'Aller-Retour 1 jour': 'Aller-Retour 1 jour',
        'Aller-Retour sans mise à disposition': 'Aller-Retour sans mise à disposition',
        'Aller-Retour avec mise à disposition': 'Aller-Retour avec mise à disposition',
      }
      const tripModeLabel = tripModeLabels[d.trip_mode || ''] || d.trip_mode || ''
      const nbCars = calculateNumberOfCars(d.passengers || 1, d.vehicle_type || 'standard')
      const madDetailsText = extractMadDetails(d.special_requests)

      return `Bonjour,

Pouvez-vous me faire une proposition pour la prestation suivante :

Trajet : ${d.departure} → ${d.arrival}
Date départ : ${formatDate(d.departure_date)}${d.departure_time ? ` à ${d.departure_time}` : ''}
${d.return_date ? `Date retour : ${formatDate(d.return_date)}${d.return_time ? ` à ${d.return_time}` : ''}\n` : ''}Type : ${tripModeLabel}
Passagers : ${d.passengers}
Nombre de cars : ${nbCars}
${d.luggage_type ? `Bagages : ${d.luggage_type}` : ''}

${d.departure_address ? `Adresse départ : ${d.departure_address}` : ''}
${d.arrival_address ? `Adresse arrivée : ${d.arrival_address}` : ''}
${madDetailsText ? `\nDétail mise à disposition :\n${madDetailsText}` : ''}

${d.special_requests ? `Remarques : ${d.special_requests}` : ''}

Merci de me faire parvenir votre meilleur tarif.

Cordialement,
L'équipe Busmoov`
    }
  }

  const handleOpenPreview = async () => {
    if (selectedTransporteurs.length === 0) return
    const msg = await generateMessageTemplateAsync(selectedDossier)
    setMessageTemplate(msg)
    setShowPreviewModal(true)
  }

  const handleEnvoyerDemandes = async (withEmail: boolean = true) => {
    if (!selectedDossier || selectedTransporteurs.length === 0) return

    try {
      // Récupérer les infos des transporteurs sélectionnés
      const transporteursInfos = selectedTransporteurs.map(id => {
        const t = transporteurs.find((tr: any) => tr.id === id)
        return { id, name: t?.name || 'Inconnu', email: t?.email || null }
      })

      // Récupérer le devis accepté pour avoir les infos véhicule
      const devisAccepte = selectedDossier.devis?.find((d: any) => d.status === 'accepted') || selectedDossier.devis?.[0]

      const baseUrl = window.location.origin

      for (const transporteur of transporteursInfos) {
        // Générer un token unique pour chaque demande
        const token = generateChauffeurToken()

        // Créer la demande fournisseur avec le token
        const demande = await createDemandeFournisseur.mutateAsync({
          dossier_id: selectedDossier.id,
          transporteur_id: transporteur.id,
          status: withEmail ? 'sent' : 'pending',
          sent_at: withEmail ? new Date().toISOString() : null,
          note_interne: messageTemplate,
          validation_token: token,
        })

        // Envoyer l'email au transporteur si demandé et email disponible
        if (withEmail && transporteur.email) {
          const lienPropositionTarif = `${baseUrl}/fournisseur/proposition-tarif?token=${token}&demande=${demande.id}`

          await supabase.functions.invoke('send-email', {
            body: {
              type: 'demande_tarif_fournisseur',
              to: transporteur.email,
              data: {
                reference: selectedDossier.reference,
                departure: selectedDossier.departure,
                arrival: selectedDossier.arrival,
                departure_date: formatDate(selectedDossier.departure_date),
                departure_time: selectedDossier.departure_time || '--:--',
                return_date: selectedDossier.return_date ? formatDate(selectedDossier.return_date) : 'Non défini',
                return_time: selectedDossier.return_time || '--:--',
                passengers: selectedDossier.passengers?.toString() || '0',
                vehicle_type: devisAccepte?.vehicle_type || 'standard',
                nb_cars: devisAccepte?.nombre_cars?.toString() || '1',
                lien_proposition_tarif: lienPropositionTarif,
                dossier_id: selectedDossier.id,
              },
            },
          })
        }
      }

      // Ajouter une entrée timeline avec les détails
      addTimelineEntry.mutate({
        dossier_id: selectedDossier.id,
        type: 'email_sent',
        content: `📋 Demande de tarif ${withEmail ? 'envoyée' : 'créée'} à ${transporteursInfos.length} transporteur(s) : ${transporteursInfos.map(t => t.name).join(', ')}`,
      })

      setShowPreviewModal(false)
      setShowEnvoiModal(false)
      setSelectedTransporteurs([])
      setSelectedDossier(null)
      setMessageTemplate('')

      if (withEmail) {
        alert(`Demandes de tarif envoyées à ${transporteursInfos.length} transporteur(s) !`)
      }
    } catch (error) {
      console.error('Erreur envoi demandes:', error)
      alert('Erreur lors de l\'envoi des demandes')
    }
  }

  const handleUpdatePrix = async (demandeId: string, prix: number) => {
    try {
      await updateDemandeFournisseur.mutateAsync({
        id: demandeId,
        prix_propose: prix,
        responded_at: new Date().toISOString(),
        status: 'responded',
      })
    } catch (error) {
      console.error('Erreur mise à jour prix:', error)
    }
  }

  const handleValider = async (demandeId: string, demande: any, dossier: any) => {
    // Ouvrir l'email de validation au fournisseur
    const transporteurEmail = demande.transporteur?.email
    if (!transporteurEmail) {
      alert('Ce transporteur n\'a pas d\'adresse email renseignée')
      return
    }

    // Générer un token de validation unique
    const validationToken = generateValidationToken()

    // Sauvegarder le token dans la base de données
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('demandes_fournisseurs')
        .update({ validation_token: validationToken })
        .eq('id', demandeId)
    } catch (error) {
      console.error('Erreur sauvegarde token:', error)
    }

    // Récupérer le nombre de cars et chauffeurs depuis le devis accepté ou le devis créé
    const devisAvecInfos = dossier.devis?.find((d: any) => d.status === 'accepted')
      || dossier.devis?.find((d: any) => d.transporteur_id === demande.transporteur_id)
      || dossier.devis?.[0]
    const nbCars = devisAvecInfos?.nombre_cars || calculateNumberOfCars(dossier.passengers || 1, dossier.vehicle_type || 'standard')
    const nbChauffeurs = devisAvecInfos?.nombre_chauffeurs || nbCars

    // Générer les données d'email avec le template depuis la base de données
    const emailData = await generateValidationFournisseurEmailFromTemplate({
      transporteurEmail,
      transporteurName: demande.transporteur?.name || 'Transporteur',
      dossierReference: dossier.reference,
      departureCity: dossier.departure,
      arrivalCity: dossier.arrival,
      departureDate: dossier.departure_date,
      returnDate: dossier.return_date,
      departureTime: dossier.departure_time,
      returnTime: dossier.return_time,
      passengers: dossier.passengers,
      prixAchat: demande.prix_propose,
      serviceType: devisAvecInfos?.service_type || (dossier as any).service_type,
      nbCars: nbCars,
      nbChauffeurs: nbChauffeurs,
      detailMad: devisAvecInfos?.detail_mad,
      dureeJours: devisAvecInfos?.duree_jours,
      amplitude: devisAvecInfos?.amplitude,
      demandeId: demandeId,
      validationToken: validationToken,
    })

    // Ouvrir la modal d'email avec callback pour valider après envoi
    openEmailPreview(emailData, async () => {
      try {
        await updateDemandeFournisseur.mutateAsync({
          id: demandeId,
          status: 'validated',
        })
        // Ajouter timeline
        if (demande.dossier_id) {
          addTimelineEntry.mutate({
            dossier_id: demande.dossier_id,
            type: 'note',
            content: `Commande validée auprès de ${demande.transporteur?.name} - Email de confirmation envoyé avec lien de validation`,
          })
        }
      } catch (error) {
        console.error('Erreur validation:', error)
      }
    })
  }

  const handleBpaRecu = async (demandeId: string, demande: any) => {
    try {
      await updateDemandeFournisseur.mutateAsync({
        id: demandeId,
        status: 'bpa_received',
      })
      // Ajouter timeline
      if (demande.dossier_id) {
        addTimelineEntry.mutate({
          dossier_id: demande.dossier_id,
          type: 'note',
          content: `BPA reçu de ${demande.transporteur?.name} - Prestation confirmée`,
        })
      }
    } catch (error) {
      console.error('Erreur BPA:', error)
    }
  }

  const handleRefuser = async (demandeId: string) => {
    try {
      await updateDemandeFournisseur.mutateAsync({
        id: demandeId,
        status: 'refused',
      })
    } catch (error) {
      console.error('Erreur refus:', error)
    }
  }

  const handleAnnulerStatut = async (demandeId: string, currentStatus: string) => {
    try {
      // Si on annule depuis validated ou bpa_received, revenir à devis_created
      // Si on annule depuis devis_created, revenir à responded
      const newStatus = (currentStatus === 'validated' || currentStatus === 'bpa_received')
        ? 'devis_created'
        : 'responded'

      await updateDemandeFournisseur.mutateAsync({
        id: demandeId,
        status: newStatus,
      })
    } catch (error) {
      console.error('Erreur annulation:', error)
    }
  }

  const handleGenererDevis = async (demande: any, dossier: any) => {
    if (!demande.prix_propose) {
      alert('Le fournisseur doit d\'abord donner un prix')
      return
    }

    try {
      // prix_propose est en TTC
      const prixAchatTTC = demande.prix_propose
      const prixAchatHT = Math.round((prixAchatTTC / 1.1) * 100) / 100
      const margePercent = 18 // 18% de marge
      const tvaRate = 10 // TVA 10%

      // Calculer prix de vente avec 18% de marge sur le HT
      const prixVenteHT = Math.round(prixAchatHT * (1 + margePercent / 100))
      const prixVenteTTC = Math.round(prixVenteHT * (1 + tvaRate / 100))

      // Générer référence devis
      const now = new Date()
      const refDevis = `DEV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

      // Marquer la demande comme "devis créé"
      await updateDemandeFournisseur.mutateAsync({
        id: demande.id,
        status: 'devis_created',
      })

      // Créer le devis client avec 18% de marge
      await createDevis.mutateAsync({
        dossier_id: dossier.id,
        transporteur_id: demande.transporteur_id,
        reference: refDevis,
        price_ht: prixVenteHT,
        price_ttc: prixVenteTTC,
        price_achat_ht: prixAchatHT,
        price_achat_ttc: prixAchatTTC,
        tva_rate: tvaRate,
        status: 'pending',
        validity_days: 30,
      })

      // Ajouter à la timeline
      addTimelineEntry.mutate({
        dossier_id: dossier.id,
        type: 'note',
        content: `Devis client créé depuis ${demande.transporteur?.name}: Achat ${formatPrice(prixAchatHT)} HT (${formatPrice(prixAchatTTC)} TTC) → Vente ${formatPrice(prixVenteHT)} HT (+18% marge)`,
      })

      // Rafraîchir
      queryClient.invalidateQueries({ queryKey: ['devis'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-fournisseurs'] })
    } catch (error) {
      console.error('Erreur génération devis:', error)
      alert('Erreur lors de la génération du devis')
    }
  }

  const handleSupprimer = async (demandeId: string) => {
    if (!confirm('Supprimer cette demande fournisseur ?')) return
    try {
      await deleteDemandeFournisseur.mutateAsync(demandeId)
    } catch (error) {
      console.error('Erreur suppression:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
      pending: { label: 'En attente', bg: '#FEF3C7', color: '#92400E' },
      sent: { label: 'Att. tarif', bg: '#FFEDD5', color: '#C2410C' },
      tarif_recu: { label: '🔔 NOUVEAU', bg: '#F97316', color: '#FFFFFF' },
      responded: { label: 'Répondu', bg: '#D1FAE5', color: '#065F46' },
      devis_created: { label: 'Devis créé', bg: '#EDE9FE', color: '#7C3AED' },
      validated: { label: '✓ Validé', bg: '#3B82F6', color: '#FFFFFF' },
      bpa_received: { label: '✓ BPA reçu', bg: '#10B981', color: '#FFFFFF' },
      accepted: { label: '✓ Validé', bg: '#3B82F6', color: '#FFFFFF' }, // Legacy
      refused: { label: 'Refusé', bg: '#FEE2E2', color: '#991B1B' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        {config.label}
      </span>
    )
  }

  const calculMarge = (prixVenteTTC: number, prixAchatTTC: number) => {
    if (!prixAchatTTC || prixAchatTTC === 0) return null
    // Convertir en HT pour le calcul de marge
    const prixVenteHT = prixVenteTTC / 1.1
    const prixAchatHT = prixAchatTTC / 1.1
    const marge = Math.round((prixVenteHT - prixAchatHT) * 100) / 100
    const margePercent = (marge / prixAchatHT) * 100
    return { marge, margePercent }
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Départ entre le</span>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="input text-sm py-1"
            />
            <span className="text-sm text-gray-500">et le</span>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="input text-sm py-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Contrat:</span>
            <select
              value={contratFilter}
              onChange={(e) => setContratFilter(e.target.value as 'tous' | 'signes' | 'non_signes')}
              className="input text-sm py-1"
            >
              <option value="signes">Signés</option>
              <option value="non_signes">Non signés</option>
              <option value="tous">Tous</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Statut BPA:</span>
            <select
              value={bpaFilter}
              onChange={(e) => setBpaFilter(e.target.value as 'tous' | 'sans_bpa' | 'avec_bpa')}
              className="input text-sm py-1"
            >
              <option value="sans_bpa">Sans BPA reçu</option>
              <option value="avec_bpa">Avec BPA reçu</option>
              <option value="tous">Tous</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Demandes:</span>
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
              className="input text-sm py-1"
            >
              <option value="default">Toutes</option>
              <option value="hideRefused">Sans refusées</option>
              <option value="onlyPending">En attente seul.</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">N° Dossier:</span>
            <input
              type="text"
              placeholder="DOS-..."
              value={dossierFilter}
              onChange={(e) => setDossierFilter(e.target.value)}
              className="input text-sm py-1 w-32"
            />
          </div>

          <button className="btn btn-primary text-sm py-1">
            Filtrer
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-3 bg-gray-100 text-sm font-medium text-gray-600 border-b">
          <div>Fournisseur</div>
          <div>Prix</div>
          <div>Marge</div>
          <div>Statut</div>
          <div>Note</div>
          <div>Action</div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : dossiersAvecDemandes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Aucun dossier trouvé</div>
        ) : (
          dossiersAvecDemandes.map((dossier: any) => {
            const devisValide = dossier.devis?.find((d: any) => d.status === 'accepted')
            const prixDevisBase = devisValide?.price_ttc || 0
            // Le prix total peut être différent du prix du devis si des options ont été ajoutées
            const prixTotal = dossier.price_ttc || prixDevisBase
            const hasOptions = prixTotal > prixDevisBase && prixDevisBase > 0

            // Construire le récap pour le tooltip
            const nbCars = devisValide?.nombre_cars || 1
            const vehicleType = devisValide?.vehicle_type || dossier.vehicle_type || 'standard'
            const serviceType = devisValide?.service_type || ''
            const serviceLabels: Record<string, string> = {
              'aller_simple': 'Aller simple',
              'ar_1j': 'AR 1 jour',
              'ar_mad': 'AR avec MAD',
              'ar_sans_mad': 'AR sans MAD',
            }
            const vehicleLabels: Record<string, string> = {
              'minibus': 'Minibus',
              'standard': 'Standard 53pl',
              '60-63': '60-63 places',
              '70': '70 places',
              '83-90': 'Double étage',
            }
            const tooltipRecap = `${dossier.departure} → ${dossier.arrival}
${formatDate(dossier.departure_date)}${dossier.departure_time ? ' à ' + dossier.departure_time : ''}${dossier.return_date ? '\nRetour: ' + formatDate(dossier.return_date) + (dossier.return_time ? ' à ' + dossier.return_time : '') : ''}
${dossier.passengers} passagers - ${nbCars} car${nbCars > 1 ? 's' : ''} ${vehicleLabels[vehicleType] || vehicleType}
${serviceLabels[serviceType] || serviceType || ''}
${dossier.special_requests ? '\n' + dossier.special_requests : ''}`

            return (
              <div key={dossier.id} className="border-b last:border-b-0">
                {/* Dossier row */}
                <div className="bg-blue-50 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span
                      className="font-bold text-purple-dark cursor-help border-b border-dashed border-purple-dark"
                      title={tooltipRecap}
                    >
                      Dossier {dossier.reference}
                    </span>
                    <span className="text-sm text-gray-500">|</span>
                    <span className="text-sm flex items-center gap-1">
                      Devis {devisValide?.reference || '-'} à {formatPrice(prixTotal)}
                      {hasOptions && (
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700"
                          title={`Prix de base: ${formatPrice(prixDevisBase)} + Options: ${formatPrice(prixTotal - prixDevisBase)}`}
                        >
                          +Options
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-gray-500">|</span>
                    <span className="text-sm">
                      Départ le {formatDate(dossier.departure_date)}
                    </span>
                    <span className="text-sm text-gray-500">|</span>
                    <div className="flex items-center gap-1">
                      <StatusBadge status={dossier.status || 'new'} size="sm" />
                      {dossier.requires_manual_review && (
                        <span title={dossier.manual_review_reason || 'Révision manuelle requise'} className="text-amber-500 cursor-help">
                          ⭐
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedDossier(dossier)
                        setShowEnvoiModal(true)
                      }}
                      className="btn btn-primary text-sm py-1"
                    >
                      Nouvelle demande
                    </button>
                    <button className="btn btn-outline text-sm py-1">
                      Relance gr.
                    </button>
                  </div>
                </div>

                {/* Demandes fournisseurs */}
                {dossier.demandes_fournisseurs.length === 0 ? (
                  dossier.transporteur_id ? (
                    // Afficher le transporteur assigné via le devis validé avec boutons d'action
                    (() => {
                      const transporteurAssigne = transporteurs.find((t: any) => t.id === dossier.transporteur_id)
                      const devisAccepte = dossier.devis?.find((d: any) => d.status === 'accepted')

                      // Valider directement (créer demande + ouvrir email)
                      const handleValiderDirect = async () => {
                        if (!transporteurAssigne) return

                        const subject = `Validation réservation - ${dossier.reference}`
                        const body = `Bonjour,

Suite à notre échange, je vous confirme la réservation suivante :

Référence : ${dossier.reference}
Date : ${dossier.departure_date ? new Date(dossier.departure_date).toLocaleDateString('fr-FR') : '-'}
Trajet : ${dossier.departure} → ${dossier.arrival}
Passagers : ${dossier.passengers}

Prix convenu HT : ${formatPrice(devisAccepte?.price_achat_ht || dossier.price_achat || 0)}

Merci de me confirmer la disponibilité et de m'envoyer votre BPA.

Cordialement,
L'équipe Busmoov`

                        openEmailPreview(
                          {
                            to: transporteurAssigne.email || '',
                            subject,
                            body,
                          },
                          async () => {
                            await createDemandeFournisseur.mutateAsync({
                              dossier_id: dossier.id,
                              transporteur_id: dossier.transporteur_id,
                              status: 'validated',
                              prix_propose: devisAccepte?.price_achat_ht || dossier.price_achat || 0,
                            })
                            queryClient.invalidateQueries({ queryKey: ['demandes-fournisseurs'] })
                          }
                        )
                      }

                      // Marquer BPA reçu directement
                      const handleBpaRecuDirect = async () => {
                        try {
                          await createDemandeFournisseur.mutateAsync({
                            dossier_id: dossier.id,
                            transporteur_id: dossier.transporteur_id,
                            status: 'bpa_received',
                            prix_propose: devisAccepte?.price_achat_ht || dossier.price_achat || 0,
                            bpa_received_at: new Date().toISOString(),
                          })

                          await supabase
                            .from('dossiers')
                            .update({ status: 'pending-info' })
                            .eq('id', dossier.id)

                          queryClient.invalidateQueries({ queryKey: ['demandes-fournisseurs'] })
                          queryClient.invalidateQueries({ queryKey: ['dossiers'] })
                        } catch (error) {
                          console.error('Erreur BPA reçu:', error)
                        }
                      }

                      return (
                        <div className="p-3 bg-purple-50 border-l-4 border-purple-500">
                          <div className="grid grid-cols-6 gap-4 items-center text-sm">
                            <div>
                              <p className="font-medium text-purple-800">{transporteurAssigne?.name || 'Transporteur assigné'}</p>
                              <p className="text-xs text-purple-600">{transporteurAssigne?.number}</p>
                            </div>
                            <div>
                              <span className="font-medium">{formatPrice(devisAccepte?.price_achat_ht || dossier.price_achat || 0)}</span>
                              <p className="text-xs text-gray-500">Prix achat HT</p>
                            </div>
                            <div>
                              {devisAccepte && (
                                <span className={`font-medium ${(devisAccepte.price_ht - devisAccepte.price_achat_ht) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPrice(devisAccepte.price_ht - devisAccepte.price_achat_ht)}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-500 text-white">
                                VIA DEVIS
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {devisAccepte?.reference || '-'}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleValiderDirect}
                                className="p-1.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-600"
                                title="Valider au fournisseur (ouvre email)"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={handleBpaRecuDirect}
                                className="p-1.5 rounded bg-green-100 hover:bg-green-200 text-green-600"
                                title="BPA reçu"
                              >
                                <CheckCircle size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })()
                  ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">
                      Aucune demande fournisseur pour ce dossier
                    </div>
                  )
                ) : (
                  dossier.demandes_fournisseurs
                    .filter((df: any) => {
                      if (filterOption === 'hideRefused' && df.status === 'refused') return false
                      if (filterOption === 'onlyPending' && df.status !== 'pending' && df.status !== 'sent') return false
                      return true
                    })
                    .map((df: any) => {
                      const margeInfo = calculMarge(prixTotal, df.prix_propose)
                      const isSelected = df.status === 'accepted'

                      const isBpaReceived = df.status === 'bpa_received'
                      const isValidated = df.status === 'validated'
                      const isTarifRecu = df.status === 'tarif_recu'

                      return (
                        <div
                          key={df.id}
                          className={`grid grid-cols-6 gap-4 p-3 items-center text-sm ${
                            isTarifRecu ? 'bg-orange-100 border-l-4 border-orange-500 animate-pulse' :
                            isBpaReceived ? 'bg-green-50 border-l-4 border-green-500' :
                            isValidated ? 'bg-blue-50 border-l-4 border-blue-500' :
                            isSelected ? 'bg-green-50 border-l-4 border-green-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div>
                            <p className="font-medium">{df.transporteur?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-400">{df.transporteur?.number}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={df.prix_propose || 0}
                              onChange={(e) => handleUpdatePrix(df.id, parseFloat(e.target.value))}
                              className="input text-sm py-1 w-24"
                            />
                            <a href="#" className="text-blue-500 text-xs">
                              <ExternalLink size={14} />
                            </a>
                          </div>
                          <div>
                            {margeInfo ? (
                              <div>
                                <span className={`font-medium ${margeInfo.marge >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPrice(margeInfo.marge)} / {Math.round(margeInfo.margePercent)}%
                                </span>
                                <div className="w-20 h-2 bg-gray-200 rounded mt-1">
                                  <div
                                    className={`h-2 rounded ${margeInfo.margePercent >= 15 ? 'bg-green-500' : margeInfo.margePercent >= 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.min(100, Math.max(0, margeInfo.margePercent))}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div>{getStatusBadge(df.status)}</div>
                          <div>
                            <input
                              type="text"
                              placeholder="Ajoutez une note"
                              defaultValue={df.note_interne || ''}
                              onBlur={async (e) => {
                                if (e.target.value !== df.note_interne) {
                                  await updateDemandeFournisseur.mutateAsync({
                                    id: df.id,
                                    note_interne: e.target.value,
                                  })
                                }
                              }}
                              className="input text-sm py-1 w-full"
                            />
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            {/* Bouton Vu - pour marquer tarif_recu comme traité */}
                            {df.status === 'tarif_recu' && (
                              <button
                                onClick={async () => {
                                  await updateDemandeFournisseur.mutateAsync({
                                    id: df.id,
                                    status: 'responded',
                                  })
                                }}
                                className="p-1.5 rounded bg-orange-500 hover:bg-orange-600 text-white"
                                title="Marquer comme vu"
                              >
                                <Eye size={16} />
                              </button>
                            )}

                            {/* Bouton Générer devis - si répondu/tarif_recu et pas encore de devis créé */}
                            {(df.status === 'responded' || df.status === 'tarif_recu') && df.prix_propose && (
                              <button
                                onClick={() => handleGenererDevis(df, dossier)}
                                className="p-1.5 rounded bg-purple-100 hover:bg-purple-200 text-purple-600"
                                title="Générer devis client (+18% marge)"
                              >
                                <FileText size={16} />
                              </button>
                            )}

                            {/* Bouton Valider fournisseur - si répondu, tarif_recu ou devis créé */}
                            {(df.status === 'responded' || df.status === 'tarif_recu' || df.status === 'devis_created') && (
                              <button
                                onClick={() => handleValider(df.id, df, dossier)}
                                className="p-1.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-600"
                                title="Valider au fournisseur (ouvre email)"
                              >
                                <Check size={16} />
                              </button>
                            )}

                            {/* Bouton BPA reçu - si validé */}
                            {df.status === 'validated' && (
                              <button
                                onClick={() => handleBpaRecu(df.id, df)}
                                className="p-1.5 rounded bg-green-100 hover:bg-green-200 text-green-600"
                                title="BPA reçu"
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}

                            {/* Bouton Refuser - si en attente, répondu ou tarif_recu */}
                            {(df.status === 'sent' || df.status === 'responded' || df.status === 'pending' || df.status === 'tarif_recu') && (
                              <button
                                onClick={() => handleRefuser(df.id)}
                                className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-600"
                                title="Refuser"
                              >
                                <XCircle size={16} />
                              </button>
                            )}

                            {/* Bouton Annuler - si validé ou BPA reçu */}
                            {(df.status === 'validated' || df.status === 'bpa_received' || df.status === 'devis_created') && (
                              <button
                                onClick={() => handleAnnulerStatut(df.id, df.status)}
                                className="p-1.5 rounded bg-orange-100 hover:bg-orange-200 text-orange-600"
                                title="Annuler statut"
                              >
                                <RotateCcw size={16} />
                              </button>
                            )}

                            <button
                              onClick={() => handleSupprimer(df.id)}
                              className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                            <span className="text-xs text-gray-400 ml-2">
                              {df.sent_at ? formatDate(df.sent_at) : '-'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modal Envoi Demandes */}
      <Modal isOpen={showEnvoiModal} onClose={() => setShowEnvoiModal(false)} title="Demande Fournisseur">
        <div className="space-y-4">
          {/* Selected dossier info */}
          {selectedDossier && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold">{selectedDossier.reference}</p>
              <p className="text-sm text-gray-500">
                {selectedDossier.departure} → {selectedDossier.arrival}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(selectedDossier.departure_date)} - {selectedDossier.passengers} passagers
              </p>
            </div>
          )}

          {/* Devis selector (if multiple) */}
          <div>
            <label className="label">Devis associé</label>
            <select className="input">
              <option value="">
                {selectedDossier?.devis?.find((d: any) => d.status === 'accepted')?.reference || 'Aucun devis validé'}
              </option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="label">Ou par catégorie</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">Toutes les catégories</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Transporteurs selection */}
          <div>
            <label className="label">Fournisseurs ({filteredTransporteurs.length})</label>
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              {filteredTransporteurs.map((t: any) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedTransporteurs.includes(t.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTransporteurs([...selectedTransporteurs, t.id])
                      } else {
                        setSelectedTransporteurs(selectedTransporteurs.filter((id) => id !== t.id))
                      }
                    }}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.number} - {t.city || 'N/A'}</p>
                  </div>
                  {t.tags?.length > 0 && (
                    <div className="flex gap-1">
                      {t.tags.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleOpenPreview}
              disabled={selectedTransporteurs.length === 0}
              className="btn btn-primary flex-1"
            >
              <Eye size={16} />
              Prévisualiser ({selectedTransporteurs.length})
            </button>
            <button onClick={() => setShowEnvoiModal(false)} className="btn btn-outline">
              Annuler
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Prévisualisation */}
      <Modal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} title="Prévisualisation de la demande" size="lg">
        <div className="space-y-4">
          {/* Destinataires */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Destinataires ({selectedTransporteurs.length}) :
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedTransporteurs.map((id) => {
                const t = transporteurs.find((tr: any) => tr.id === id)
                return t ? (
                  <span key={id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {t.name}
                  </span>
                ) : null
              })}
            </div>
          </div>

          {/* Note interne */}
          <div>
            <label className="label">Note interne (optionnel)</label>
            <textarea
              className="input min-h-[100px] font-mono text-sm"
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              placeholder="Note interne visible uniquement par l'admin"
            />
          </div>

          {/* Aperçu de l'email */}
          {selectedDossier && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                <Mail size={16} />
                Aperçu de l'email envoyé aux transporteurs :
              </p>
              <div className="bg-white p-4 rounded border text-sm space-y-2">
                <p><strong>Objet :</strong> Demande de tarif - {selectedDossier.departure} → {selectedDossier.arrival} le {formatDate(selectedDossier.departure_date)}</p>
                <hr className="my-2" />
                <p>Bonjour,</p>
                <p>Nous avons une demande de transport pour laquelle nous aimerions recevoir votre meilleur tarif.</p>
                <div className="bg-gray-50 p-3 rounded my-2 space-y-1">
                  <p><strong>Trajet :</strong> {selectedDossier.departure} → {selectedDossier.arrival}</p>
                  <p><strong>Type :</strong> {getTripModeLabel(selectedDossier.trip_mode)}</p>
                  <p><strong>Date aller :</strong> {formatDate(selectedDossier.departure_date)} à {selectedDossier.departure_time || '--:--'}</p>
                  {selectedDossier.return_date && (
                    <p><strong>Date retour :</strong> {formatDate(selectedDossier.return_date)} à {selectedDossier.return_time || '--:--'}</p>
                  )}
                  <p><strong>Passagers :</strong> {selectedDossier.passengers} personnes</p>
                  {selectedDossier.vehicle_type && (
                    <p><strong>Véhicule :</strong> {getVehicleTypeLabel(selectedDossier.vehicle_type)}</p>
                  )}
                  {selectedDossier.nombre_cars && selectedDossier.nombre_cars > 1 && (
                    <p><strong>Nombre de cars :</strong> {selectedDossier.nombre_cars}</p>
                  )}
                  {/* Détail MAD si circuit */}
                  {selectedDossier.trip_mode === 'circuit' && extractMadDetails(selectedDossier.special_requests) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p><strong>Détail mise à disposition :</strong></p>
                      <p className="text-gray-600 whitespace-pre-wrap text-xs mt-1">{extractMadDetails(selectedDossier.special_requests)}</p>
                    </div>
                  )}
                  {/* Autres demandes spéciales (hors MAD) */}
                  {selectedDossier.special_requests && !selectedDossier.special_requests.includes('=== DÉTAIL MISE À DISPOSITION ===') && (
                    <p><strong>Remarques :</strong> {selectedDossier.special_requests}</p>
                  )}
                </div>
                <div className="bg-magenta/10 p-3 rounded border border-magenta/30 text-center">
                  <p className="text-magenta font-semibold">🔗 Lien personnalisé par transporteur</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getSiteBaseUrl()}/fournisseur/proposition-tarif?token=XXXX&demande=YYYY
                  </p>
                  <p className="text-xs text-gray-400 mt-1">(Un lien unique sera généré pour chaque transporteur)</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => handleEnvoyerDemandes(true)}
              className="btn btn-primary flex-1"
            >
              <Send size={16} />
              Envoyer par email
            </button>
            <button
              onClick={() => handleEnvoyerDemandes(false)}
              className="btn btn-outline"
            >
              Créer sans envoyer
            </button>
            <button onClick={() => setShowPreviewModal(false)} className="btn btn-outline">
              Retour
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ============================================
// CLIENTS PAGE
// ============================================
function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('dossiers')
        .select('client_name, client_email, client_phone, client_company, billing_address, billing_zip, billing_city, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      const clientsMap = new Map()
      data?.forEach(d => {
        if (d.client_email && !clientsMap.has(d.client_email)) {
          clientsMap.set(d.client_email, {
            email: d.client_email,
            name: d.client_name,
            phone: d.client_phone,
            company: d.client_company,
            address: d.billing_address,
            zip: d.billing_zip,
            city: d.billing_city,
            firstContact: d.created_at,
            dossierCount: 1
          })
        } else if (d.client_email) {
          const existing = clientsMap.get(d.client_email)
          existing.dossierCount++
        }
      })

      setClients(Array.from(clientsMap.values()))
    } catch (err) {
      console.error('Error loading clients:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-purple-dark">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">{clients.length} clients enregistrés</p>
        </div>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-magenta border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Chargement des clients...</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Client</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Société</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Ville</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Dossiers</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">1er contact</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredClients.map((client, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{client.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{client.email}</p>
                    {client.phone && <p className="text-xs text-gray-400">{client.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{client.company || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{client.city || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="badge badge-magenta">{client.dossierCount}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-500">{formatDate(client.firstContact)}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Aucun client trouvé
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// WorkflowPage is now imported from @/components/admin/WorkflowPage

// ============================================
// FACTURES PAGE
// ============================================
function FacturesPage() {
  const [factures, setFactures] = useState<any[]>([])
  const [dossiersAFacturer, setDossiersAFacturer] = useState<any[]>([])
  const [dossiersPartiels, setDossiersPartiels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [amountMin, setAmountMin] = useState<string>('')
  const [amountMax, setAmountMax] = useState<string>('')
  const [activeTab, setActiveTab] = useState<'a_facturer' | 'partiels' | 'toutes'>('a_facturer')
  const queryClient = useQueryClient()
  const createFacture = useCreateFacture()

  // Modale de facturation
  const [showFactureModal, setShowFactureModal] = useState(false)
  const [selectedDossier, setSelectedDossier] = useState<any>(null)
  const [factureForm, setFactureForm] = useState({
    type: 'acompte' as 'acompte' | 'solde' | 'avoir',
    amount_ttc: 0,
    useAutoAmount: true,
    client_name: '',
    client_address: '',
    client_zip: '',
    client_city: '',
    sendEmail: true,
  })
  const [generating, setGenerating] = useState(false)

  // Modale de paiement pour marquer facture comme payée
  const [showPaiementModal, setShowPaiementModal] = useState(false)
  const [selectedFacture, setSelectedFacture] = useState<any>(null)
  const [paiementForm, setPaiementForm] = useState({
    type: 'virement' as 'virement' | 'cb' | 'especes' | 'cheque',
    payment_date: new Date().toISOString().slice(0, 10),
    reference: '',
    notes: '',
  })
  const [savingPaiement, setSavingPaiement] = useState(false)

  // Modale d'envoi de facture par email
  const [showEnvoiFactureModal, setShowEnvoiFactureModal] = useState(false)
  const [selectedFactureForEmail, setSelectedFactureForEmail] = useState<any>(null)
  const [envoiFactureForm, setEnvoiFactureForm] = useState({
    to: '',
    subject: '',
    body: '',
  })
  const [sendingEmail, setSendingEmail] = useState(false)

  useEffect(() => {
    loadFactures()
    loadDossiersAFacturer()
  }, [])

  const loadFactures = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('factures')
        .select(`
          *,
          dossier:dossiers(reference, client_name, client_email, departure, arrival, departure_date, passengers),
          contrat:contrats(reference)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setFactures(data)
      }
    } catch (err) {
      console.error('Error loading factures:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDossiersAFacturer = async () => {
    try {
      // Récupérer tous les dossiers avec contrats signés et leurs factures
      const { data: dossiers, error } = await supabase
        .from('dossiers')
        .select(`
          id,
          reference,
          client_name,
          client_email,
          departure,
          arrival,
          departure_date,
          passengers,
          price_ht,
          price_ttc,
          tva_rate,
          billing_address,
          billing_zip,
          billing_city,
          status,
          contrats(
            id,
            reference,
            status,
            price_ttc,
            acompte_amount,
            solde_amount,
            client_name,
            billing_address,
            billing_zip,
            billing_city
          ),
          factures(
            id,
            type,
            amount_ttc,
            status
          )
        `)
        .in('status', ['pending-payment', 'pending-reservation', 'bpa-received', 'pending-info', 'pending-info-received', 'pending-driver', 'confirmed', 'completed'])
        .order('departure_date', { ascending: true })

      if (error) {
        console.error('Error loading dossiers:', error)
        return
      }

      console.log('[Factures] Dossiers:', dossiers?.length, dossiers);
      if (dossiers) {
        // Calculer le reste à facturer pour chaque dossier
        const dossiersAvecReste = dossiers.map((d: any) => {
          const contrat = Array.isArray(d.contrats) ? d.contrats[0] : d.contrats
          const dossierFactures = d.factures || []

          // Montant facturé = factures valides (non annulées, non avoirs)
          const montantFacture = dossierFactures
            .filter((f: any) => f.type !== 'avoir' && f.status !== 'cancelled')
            .reduce((sum: number, f: any) => sum + (f.amount_ttc || 0), 0)

          const prixTotal = d.price_ttc || contrat?.price_ttc || 0
          const resteAFacturer = Math.max(0, prixTotal - montantFacture)

          return {
            ...d,
            contrat,
            montantFacture,
            resteAFacturer,
          }
        })

        // Dossiers à facturer = contrat actif ET reste à facturer > 0
        const aFacturer = dossiersAvecReste.filter((d: any) => {
          return d.contrat?.status === 'active' && d.resteAFacturer > 0
        })

        // Dossiers avec facturations partielles = à facturer ET déjà des factures valides
        const partiels = aFacturer.filter((d: any) => d.montantFacture > 0)

        // Dossiers sans facturation = à facturer ET aucune facture valide
        const sansFacture = aFacturer.filter((d: any) => d.montantFacture === 0)

        setDossiersAFacturer(sansFacture)
        setDossiersPartiels(partiels)
      }
    } catch (err) {
      console.error('Error loading dossiers à facturer:', err)
    }
  }

  // Ouvrir la modale de paiement
  const openPaiementModal = (facture: any) => {
    setSelectedFacture(facture)
    setPaiementForm({
      type: 'virement',
      payment_date: new Date().toISOString().slice(0, 10),
      reference: '',
      notes: `Paiement facture ${facture.reference}`,
    })
    setShowPaiementModal(true)
  }

  // Enregistrer le paiement et marquer la facture comme payée
  const handleSavePaiement = async () => {
    if (!selectedFacture) return

    setSavingPaiement(true)
    try {
      // Récupérer le contrat_id depuis la facture
      const contratId = selectedFacture.contrat_id

      if (!contratId) {
        // Si pas de contrat_id, essayer de le récupérer depuis le dossier
        const { data: contrat } = await supabase
          .from('contrats')
          .select('id')
          .eq('dossier_id', selectedFacture.dossier_id)
          .single()

        if (!contrat) {
          alert('Impossible de trouver le contrat associé à cette facture')
          setSavingPaiement(false)
          return
        }

        selectedFacture.contrat_id = contrat.id
      }

      // 1. Créer le paiement
      const { error: paiementError } = await supabase
        .from('paiements')
        .insert({
          contrat_id: selectedFacture.contrat_id,
          dossier_id: selectedFacture.dossier_id,
          type: paiementForm.type,
          amount: Math.abs(selectedFacture.amount_ttc),
          payment_date: paiementForm.payment_date,
          reference: paiementForm.reference || null,
          notes: paiementForm.notes || null,
        })

      if (paiementError) throw paiementError

      // 2. Marquer la facture comme payée
      const { error: factureError } = await supabase
        .from('factures')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('id', selectedFacture.id)

      if (factureError) throw factureError

      // 3. Ajouter une entrée dans la timeline
      await supabase.from('timeline').insert({
        dossier_id: selectedFacture.dossier_id,
        type: 'paiement',
        content: `💳 Paiement reçu: ${formatPrice(Math.abs(selectedFacture.amount_ttc))} (${paiementForm.type}) - Facture ${selectedFacture.reference}`,
      })

      // Recharger les données
      loadFactures()
      queryClient.invalidateQueries({ queryKey: ['factures'] })
      queryClient.invalidateQueries({ queryKey: ['paiements'] })
      queryClient.invalidateQueries({ queryKey: ['contrats'] })
      queryClient.invalidateQueries({ queryKey: ['timeline', selectedFacture.dossier_id] })

      // Fermer la modale
      setShowPaiementModal(false)
      setSelectedFacture(null)

      alert(`Paiement enregistré avec succès !`)
    } catch (error) {
      console.error('Error saving paiement:', error)
      alert('Erreur lors de l\'enregistrement du paiement')
    } finally {
      setSavingPaiement(false)
    }
  }

  const handleDelete = async (factureId: string) => {
    if (!confirm('Supprimer cette facture ?')) return
    try {
      await supabase.from('factures').delete().eq('id', factureId)
      loadFactures()
      queryClient.invalidateQueries({ queryKey: ['factures'] })
    } catch (error) {
      console.error('Error deleting facture:', error)
    }
  }

  // Ouvrir la modale de facturation
  const openFactureModal = (dossier: any, defaultType?: 'acompte' | 'solde') => {
    const contrat = Array.isArray(dossier.contrats) ? dossier.contrats[0] : dossier.contrats
    const dossierFactures = dossier.factures || []

    // Calculer le montant déjà facturé et le reste à facturer
    const montantFacture = dossierFactures
      .filter((f: any) => f.type !== 'avoir' && f.status !== 'cancelled')
      .reduce((sum: number, f: any) => sum + (f.amount_ttc || 0), 0)
    const prixTotal = dossier.price_ttc || contrat?.price_ttc || 0
    const resteAFacturer = Math.max(0, prixTotal - montantFacture)

    setSelectedDossier({
      ...dossier,
      contrat,
      montantFacture,
      resteAFacturer,
      isPartiel: montantFacture > 0 && resteAFacturer > 0
    })
    // Utiliser les données de facturation du contrat (signature) en priorité, sinon celles du dossier
    setFactureForm({
      type: defaultType || (montantFacture > 0 ? 'solde' : 'acompte'),
      amount_ttc: resteAFacturer,
      useAutoAmount: true,
      client_name: contrat?.client_name || dossier.client_name || '',
      client_address: contrat?.billing_address || dossier.billing_address || '',
      client_zip: contrat?.billing_zip || dossier.billing_zip || '',
      client_city: contrat?.billing_city || dossier.billing_city || '',
      sendEmail: true,
    })
    setShowFactureModal(true)
  }

  // Générer la référence de facture
  const generateFactureReference = (type: 'acompte' | 'solde' | 'avoir') => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const prefix = type === 'acompte' ? 'FA' : type === 'solde' ? 'FS' : 'AV'
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${year}${month}-${random}`
  }

  // Créer et télécharger la facture
  const handleCreateFacture = async () => {
    if (!selectedDossier) return

    setGenerating(true)
    try {
      const contrat = selectedDossier.contrat
      const tvaRate = selectedDossier.tva_rate || 10
      const prixTTC = contrat?.price_ttc || selectedDossier.price_ttc || 0
      const acompteContrat = contrat?.acompte_amount || Math.round(prixTTC * 0.3)
      const soldeContrat = contrat?.solde_amount || (prixTTC - acompteContrat)

      // Calculer le montant automatique ou utiliser le montant personnalisé
      let amountTTC: number
      if (factureForm.useAutoAmount && factureForm.type !== 'avoir') {
        amountTTC = factureForm.type === 'acompte' ? acompteContrat : soldeContrat
      } else {
        amountTTC = factureForm.amount_ttc
      }

      if (amountTTC <= 0) {
        alert('Le montant doit être supérieur à 0')
        setGenerating(false)
        return
      }

      // Pour un avoir, le montant est négatif
      const finalAmountTTC = factureForm.type === 'avoir' ? -Math.abs(amountTTC) : amountTTC

      // Calculer HT et TVA
      const amountHT = Math.round((finalAmountTTC / (1 + tvaRate / 100)) * 100) / 100
      const amountTVA = Math.round((finalAmountTTC - amountHT) * 100) / 100

      const reference = generateFactureReference(factureForm.type)

      // Utiliser les infos client du formulaire ou celles du dossier
      const clientName = factureForm.client_name || selectedDossier.client_name || ''
      const clientAddress = factureForm.client_address || selectedDossier.billing_address || ''
      const clientZip = factureForm.client_zip || selectedDossier.billing_zip || ''
      const clientCity = factureForm.client_city || selectedDossier.billing_city || ''

      // Créer la facture en base
      const { data: newFacture, error } = await supabase
        .from('factures')
        .insert({
          dossier_id: selectedDossier.id,
          contrat_id: contrat?.id,
          type: factureForm.type,
          reference,
          amount_ht: amountHT,
          amount_ttc: finalAmountTTC,
          amount_tva: amountTVA,
          tva_rate: tvaRate,
          status: 'generated',
          client_name: clientName,
          client_address: clientAddress,
          client_zip: clientZip,
          client_city: clientCity,
        })
        .select()
        .single()

      if (error) throw error

      // Si c'est une facture de solde, récupérer la facture d'acompte
      let factureAcompte = null
      if (factureForm.type === 'solde') {
        const { data: acompteData } = await supabase
          .from('factures')
          .select('reference, amount_ttc')
          .eq('dossier_id', selectedDossier.id)
          .eq('type', 'acompte')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (acompteData) {
          factureAcompte = acompteData
        }
      }

      // Récupérer le devis accepté pour les options
      const devisAccepteFacture = selectedDossier.devis?.find((d: any) => d.status === 'accepted')

      // Calculer la durée et les options
      const dureeJoursFactureNew = selectedDossier.departure_date && selectedDossier.return_date
        ? Math.ceil((new Date(selectedDossier.return_date).getTime() - new Date(selectedDossier.departure_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1
      const optionsDetailsFactureNew = (devisAccepteFacture as any)?.options_details || {}
      const nbChauffeursFactureNew = devisAccepteFacture?.nombre_chauffeurs || 1
      const nbRepasFactureNew = dureeJoursFactureNew * 2
      const nbNuitsFactureNew = Math.max(0, dureeJoursFactureNew - 1)

      const basePriceTTCFactureNew = devisAccepteFacture?.price_ttc || 0
      const optionsTotalFactureNew = prixTTC - basePriceTTCFactureNew

      const optionsLignesFactureNew: { label: string; montant: number }[] = []
      if (optionsTotalFactureNew > 0 && optionsDetailsFactureNew) {
        if (optionsDetailsFactureNew.peages?.status === 'non_inclus' && optionsDetailsFactureNew.peages.montant) {
          optionsLignesFactureNew.push({ label: 'Péages', montant: optionsDetailsFactureNew.peages.montant })
        }
        if (optionsDetailsFactureNew.repas_chauffeur?.status === 'non_inclus' && optionsDetailsFactureNew.repas_chauffeur.montant) {
          const montant = optionsDetailsFactureNew.repas_chauffeur.montant * nbRepasFactureNew * nbChauffeursFactureNew
          optionsLignesFactureNew.push({ label: `Repas chauffeur (${nbRepasFactureNew} repas × ${nbChauffeursFactureNew} chauff.)`, montant })
        }
        if (optionsDetailsFactureNew.parking?.status === 'non_inclus' && optionsDetailsFactureNew.parking.montant) {
          optionsLignesFactureNew.push({ label: 'Parking', montant: optionsDetailsFactureNew.parking.montant })
        }
        if (optionsDetailsFactureNew.hebergement?.status === 'non_inclus' && optionsDetailsFactureNew.hebergement.montant) {
          const montant = optionsDetailsFactureNew.hebergement.montant * nbNuitsFactureNew * nbChauffeursFactureNew
          optionsLignesFactureNew.push({ label: `Hébergement (${nbNuitsFactureNew} nuits × ${nbChauffeursFactureNew} chauff.)`, montant })
        }
      }

      // Générer et télécharger le PDF
      await generateFacturePDF({
        reference,
        type: factureForm.type,
        amount_ht: amountHT,
        amount_ttc: finalAmountTTC,
        tva_rate: tvaRate,
        client_name: clientName,
        client_address: clientAddress,
        client_zip: clientZip,
        client_city: clientCity,
        created_at: new Date().toISOString(),
        base_price_ttc: basePriceTTCFactureNew,
        options_lignes: optionsLignesFactureNew.length > 0 ? optionsLignesFactureNew : undefined,
        dossier: {
          reference: selectedDossier.reference,
          departure: selectedDossier.departure,
          arrival: selectedDossier.arrival,
          departure_date: selectedDossier.departure_date,
          passengers: selectedDossier.passengers,
          client_name: selectedDossier.client_name,
          client_email: selectedDossier.client_email,
          nombre_cars: devisAccepteFacture?.nombre_cars || 1,
          nombre_chauffeurs: nbChauffeursFactureNew,
          total_ttc: prixTTC,
        },
        facture_acompte: factureAcompte,
      })

      // Envoyer par email si demandé
      if (factureForm.sendEmail && selectedDossier.client_email) {
        // TODO: Implémenter l'envoi d'email via Edge Function
        console.log('Email sera envoyé à:', selectedDossier.client_email)
      }

      // Recharger les données
      loadFactures()
      loadDossiersAFacturer()
      queryClient.invalidateQueries({ queryKey: ['factures'] })

      // Fermer la modale et réinitialiser
      setShowFactureModal(false)
      setSelectedDossier(null)
      setFactureForm({
        type: 'acompte',
        amount_ttc: 0,
        useAutoAmount: true,
        client_name: '',
        client_address: '',
        client_zip: '',
        client_city: '',
        sendEmail: true,
      })

      alert(`${factureForm.type === 'avoir' ? 'Avoir' : 'Facture'} ${reference} généré(e) avec succès !`)
    } catch (error) {
      console.error('Error creating facture:', error)
      alert('Erreur lors de la création de la facture')
    } finally {
      setGenerating(false)
    }
  }

  // Télécharger le PDF d'une facture existante
  const handleDownloadPDF = async (facture: any) => {
    try {
      // Si c'est une facture de solde, récupérer la facture d'acompte
      let factureAcompte = null
      if (facture.type === 'solde' && facture.dossier_id) {
        const acompteInList = factures.find(f => f.dossier_id === facture.dossier_id && f.type === 'acompte')
        if (acompteInList) {
          factureAcompte = { reference: acompteInList.reference, amount_ttc: acompteInList.amount_ttc }
        }
      }

      // Récupérer le devis accepté pour les options
      const devisAccepteDL = facture.dossier?.devis?.find((d: any) => d.status === 'accepted')

      // Calculer la durée et les options
      const dureeJoursDL = facture.dossier?.departure_date && facture.dossier?.return_date
        ? Math.ceil((new Date(facture.dossier.return_date).getTime() - new Date(facture.dossier.departure_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 1
      const optionsDetailsDL = (devisAccepteDL as any)?.options_details || {}
      const nbChauffeursDL = devisAccepteDL?.nombre_chauffeurs || 1
      const nbRepasDL = dureeJoursDL * 2
      const nbNuitsDL = Math.max(0, dureeJoursDL - 1)

      const basePriceTTCDL = devisAccepteDL?.price_ttc || 0
      const totalPriceTTCDL = facture.dossier?.price_ttc || facture.dossier?.total_ttc || facture.dossier?.contrat?.[0]?.price_ttc || basePriceTTCDL
      const optionsTotalDL = totalPriceTTCDL - basePriceTTCDL

      const optionsLignesDL: { label: string; montant: number }[] = []
      if (optionsTotalDL > 0 && optionsDetailsDL) {
        if (optionsDetailsDL.peages?.status === 'non_inclus' && optionsDetailsDL.peages.montant) {
          optionsLignesDL.push({ label: 'Péages', montant: optionsDetailsDL.peages.montant })
        }
        if (optionsDetailsDL.repas_chauffeur?.status === 'non_inclus' && optionsDetailsDL.repas_chauffeur.montant) {
          const montant = optionsDetailsDL.repas_chauffeur.montant * nbRepasDL * nbChauffeursDL
          optionsLignesDL.push({ label: `Repas chauffeur (${nbRepasDL} repas × ${nbChauffeursDL} chauff.)`, montant })
        }
        if (optionsDetailsDL.parking?.status === 'non_inclus' && optionsDetailsDL.parking.montant) {
          optionsLignesDL.push({ label: 'Parking', montant: optionsDetailsDL.parking.montant })
        }
        if (optionsDetailsDL.hebergement?.status === 'non_inclus' && optionsDetailsDL.hebergement.montant) {
          const montant = optionsDetailsDL.hebergement.montant * nbNuitsDL * nbChauffeursDL
          optionsLignesDL.push({ label: `Hébergement (${nbNuitsDL} nuits × ${nbChauffeursDL} chauff.)`, montant })
        }
      }

      await generateFacturePDF({
        reference: facture.reference,
        type: facture.type,
        amount_ht: facture.amount_ht,
        amount_ttc: facture.amount_ttc,
        tva_rate: facture.tva_rate,
        client_name: facture.client_name,
        client_address: facture.client_address,
        client_zip: facture.client_zip,
        client_city: facture.client_city,
        created_at: facture.created_at,
        base_price_ttc: basePriceTTCDL,
        options_lignes: optionsLignesDL.length > 0 ? optionsLignesDL : undefined,
        dossier: facture.dossier ? {
          reference: facture.dossier.reference,
          departure: facture.dossier.departure,
          arrival: facture.dossier.arrival,
          departure_date: facture.dossier.departure_date,
          passengers: facture.dossier.passengers,
          client_name: facture.dossier.client_name,
          client_email: facture.dossier.client_email,
          nombre_cars: devisAccepteDL?.nombre_cars || 1,
          nombre_chauffeurs: nbChauffeursDL,
          total_ttc: totalPriceTTCDL,
        } : undefined,
        facture_acompte: factureAcompte,
      })
    } catch (error) {
      console.error('Error downloading PDF:', error)
      alert('Erreur lors du téléchargement du PDF')
    }
  }

  // Ouvrir la modale d'envoi de facture par email
  const openEnvoiFactureModal = (facture: any) => {
    const typeFacture = facture.type === 'acompte' ? "d'acompte" : facture.type === 'solde' ? 'de solde' : "d'avoir"
    const clientName = facture.dossier?.client_name || facture.client_name || ''
    const clientEmail = facture.dossier?.client_email || ''
    const dossierRef = facture.dossier?.reference || ''

    setSelectedFactureForEmail(facture)
    setEnvoiFactureForm({
      to: clientEmail,
      subject: `Votre facture ${typeFacture} - ${facture.reference}`,
      body: `Bonjour ${clientName},

Veuillez trouver ci-joint votre facture ${typeFacture} n°${facture.reference} d'un montant de ${formatPrice(facture.amount_ttc)} TTC pour votre dossier ${dossierRef}.

Nous restons à votre disposition pour toute question.

Cordialement,
L'équipe Busmoov`,
    })
    setShowEnvoiFactureModal(true)
  }

  // Envoyer la facture par email
  const handleSendFactureEmail = async () => {
    if (!envoiFactureForm.to || !envoiFactureForm.subject || !envoiFactureForm.body) {
      alert('Veuillez remplir tous les champs')
      return
    }

    setSendingEmail(true)
    try {
      // Envoyer l'email via l'Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'custom',
          to: envoiFactureForm.to,
          subject: envoiFactureForm.subject,
          html_content: envoiFactureForm.body.replace(/\n/g, '<br>'),
          data: {
            dossier_id: selectedFactureForEmail?.dossier?.id || null,
          },
        }
      })

      if (emailError) {
        console.error('Erreur envoi email:', emailError)
        throw emailError
      }

      // Enregistrer dans la timeline
      if (selectedFactureForEmail?.dossier?.id) {
        await supabase.from('timeline').insert({
          dossier_id: selectedFactureForEmail.dossier.id,
          type: 'email',
          content: `Facture ${selectedFactureForEmail.reference} envoyée à ${envoiFactureForm.to}`,
        })
      }

      setShowEnvoiFactureModal(false)
      alert('Facture envoyée avec succès !')
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Erreur lors de l\'envoi de l\'email')
    } finally {
      setSendingEmail(false)
    }
  }

  // Filtrer les factures
  const filteredFactures = factures.filter(f => {
    const matchesSearch = !searchQuery ||
      f.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.dossier?.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.dossier?.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || f.status === statusFilter
    const matchesType = !typeFilter || f.type === typeFilter

    // Filtre par période
    const factureDate = f.created_at ? new Date(f.created_at) : null
    const matchesDateFrom = !dateFrom || (factureDate && factureDate >= new Date(dateFrom))
    const matchesDateTo = !dateTo || (factureDate && factureDate <= new Date(dateTo + 'T23:59:59'))

    // Filtre par montant
    const amount = Math.abs(f.amount_ttc || 0)
    const matchesAmountMin = !amountMin || amount >= parseFloat(amountMin)
    const matchesAmountMax = !amountMax || amount <= parseFloat(amountMax)

    return matchesSearch && matchesStatus && matchesType && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax
  })

  // Réinitialiser les filtres
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('')
    setTypeFilter('')
    setDateFrom('')
    setDateTo('')
    setAmountMin('')
    setAmountMax('')
  }

  const hasActiveFilters = searchQuery || statusFilter || typeFilter || dateFrom || dateTo || amountMin || amountMax

  // Export CSV des factures filtrées
  const exportFacturesCSV = () => {
    const headers = [
      'Référence',
      'Date',
      'Type',
      'Statut',
      'Client',
      'Dossier',
      'Montant HT',
      'TVA',
      'Montant TTC'
    ]

    const rows = filteredFactures.map(f => [
      f.reference || '',
      f.created_at ? new Date(f.created_at).toLocaleDateString('fr-FR') : '',
      f.type === 'acompte' ? 'Acompte' : f.type === 'solde' ? 'Solde' : 'Avoir',
      f.status === 'paid' ? 'Payée' : f.status === 'cancelled' ? 'Annulée' : 'En attente',
      f.client_name || f.dossier?.client_name || '',
      f.dossier?.reference || '',
      (f.amount_ht || 0).toFixed(2).replace('.', ','),
      (f.tva_rate || 10) + '%',
      (f.amount_ttc || 0).toFixed(2).replace('.', ',')
    ])

    // Ajouter BOM pour UTF-8
    const BOM = '\uFEFF'
    const csvContent = BOM + [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    ].join('\r\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)

    const periodLabel = dateFrom && dateTo
      ? `_${dateFrom}_${dateTo}`
      : dateFrom
      ? `_depuis_${dateFrom}`
      : dateTo
      ? `_jusqua_${dateTo}`
      : ''
    link.setAttribute('download', `factures${periodLabel}_${new Date().toISOString().slice(0, 10)}.csv`)

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Stats
  const totalFactures = factures.length
  const totalAcomptes = factures.filter(f => f.type === 'acompte' && f.status !== 'cancelled').reduce((sum, f) => sum + (f.amount_ttc || 0), 0)
  const totalSoldes = factures.filter(f => f.type === 'solde' && f.status !== 'cancelled').reduce((sum, f) => sum + (f.amount_ttc || 0), 0)
  const totalAvoirs = factures.filter(f => f.type === 'avoir').reduce((sum, f) => sum + (f.amount_ttc || 0), 0) // Valeur négative
  // À encaisser = factures non payées et non annulées (minimum 0, jamais négatif)
  const facturesNonPayees = factures.filter(f => f.status !== 'paid' && f.status !== 'cancelled' && f.type !== 'avoir').reduce((sum, f) => sum + (f.amount_ttc || 0), 0)
  const totalNonPayees = Math.max(0, facturesNonPayees) // Jamais négatif

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-magenta mx-auto mb-4" />
          <p className="text-gray-500">Chargement des factures...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-purple-dark">Factures</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={exportFacturesCSV}
            className="btn btn-secondary"
            title={`Exporter ${filteredFactures.length} facture(s) en CSV`}
          >
            <Download size={16} />
            Export CSV
            {(dateFrom || dateTo) && (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                {filteredFactures.length}
              </span>
            )}
          </button>
          <button onClick={() => { loadFactures(); loadDossiersAFacturer(); }} className="btn btn-secondary">
            <RefreshCw size={16} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total factures</p>
          <p className="text-2xl font-bold text-purple-dark">{totalFactures}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Acomptes</p>
          <p className="text-2xl font-bold text-amber-600">{formatPrice(totalAcomptes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Soldes</p>
          <p className="text-2xl font-bold text-blue-600">{formatPrice(totalSoldes)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Avoirs</p>
          <p className="text-2xl font-bold text-red-600">{formatPrice(totalAvoirs)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">À encaisser</p>
          <p className="text-2xl font-bold text-green-600">{formatPrice(totalNonPayees)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('a_facturer')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === 'a_facturer'
              ? "border-magenta text-magenta"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <span className="flex items-center gap-2">
            À facturer
            {dossiersAFacturer.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                {dossiersAFacturer.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('partiels')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === 'partiels'
              ? "border-magenta text-magenta"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <span className="flex items-center gap-2">
            Facturations partielles
            {dossiersPartiels.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                {dossiersPartiels.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('toutes')}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === 'toutes'
              ? "border-magenta text-magenta"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Toutes les factures
        </button>
      </div>

      {/* Tab: Dossiers à facturer */}
      {activeTab === 'a_facturer' && (
        <div className="space-y-4">
          {dossiersAFacturer.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-gray-500">Tous les dossiers ont été facturés</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Dossier</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Trajet</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Date voyage</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Déjà facturé</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Reste à facturer</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dossiersAFacturer.map((dossier) => {
                    const contrat = Array.isArray(dossier.contrats) ? dossier.contrats[0] : dossier.contrats
                    const dossierFactures = dossier.factures || []
                    // Montant facturé = factures valides (non annulées, non avoirs)
                    const dejaFacture = dossierFactures
                      .filter((f: any) => f.type !== 'avoir' && f.status !== 'cancelled')
                      .reduce((sum: number, f: any) => sum + (f.amount_ttc || 0), 0)
                    const prixTotal = dossier.price_ttc || contrat?.price_ttc || 0
                    const resteAFacturer = Math.max(0, prixTotal - dejaFacture)

                    return (
                      <tr key={dossier.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <span className="font-mono font-medium">{dossier.reference}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{dossier.client_name}</p>
                          <p className="text-xs text-gray-500">{dossier.client_email}</p>
                        </td>
                        <td className="p-4 text-sm">
                          {dossier.departure} → {dossier.arrival}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {formatDate(dossier.departure_date)}
                        </td>
                        <td className="p-4 text-right text-green-600 font-medium">
                          {dejaFacture > 0 ? formatPrice(dejaFacture) : '-'}
                        </td>
                        <td className="p-4 text-right text-orange-600 font-bold">
                          {formatPrice(resteAFacturer)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => openFactureModal(dossier)}
                            className="btn btn-sm btn-primary"
                          >
                            <FileText size={14} />
                            Facturer
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Facturations partielles */}
      {activeTab === 'partiels' && (
        <div className="space-y-4">
          {dossiersPartiels.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-gray-500">Aucune facturation partielle en cours</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Dossier</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Trajet</th>
                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Date voyage</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Déjà facturé</th>
                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Reste à facturer</th>
                    <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dossiersPartiels.map((dossier) => {
                    const contrat = Array.isArray(dossier.contrats) ? dossier.contrats[0] : dossier.contrats
                    const dossierFactures = dossier.factures || []
                    // Montant facturé = factures valides (non annulées, non avoirs)
                    const dejaFacture = dossierFactures
                      .filter((f: any) => f.type !== 'avoir' && f.status !== 'cancelled')
                      .reduce((sum: number, f: any) => sum + (f.amount_ttc || 0), 0)
                    const prixTotal = dossier.price_ttc || contrat?.price_ttc || 0
                    const resteAFacturer = Math.max(0, prixTotal - dejaFacture)

                    return (
                      <tr key={dossier.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <span className="font-mono font-medium">{dossier.reference}</span>
                        </td>
                        <td className="p-4">
                          <p className="font-medium">{dossier.client_name}</p>
                        </td>
                        <td className="p-4 text-sm">
                          {dossier.departure} → {dossier.arrival}
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {formatDate(dossier.departure_date)}
                        </td>
                        <td className="p-4 text-right text-green-600 font-medium">
                          {formatPrice(dejaFacture)}
                        </td>
                        <td className="p-4 text-right text-orange-600 font-bold">
                          {formatPrice(resteAFacturer)}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => openFactureModal(dossier, dossier.missingType)}
                            className="btn btn-sm btn-secondary"
                          >
                            <FileText size={14} />
                            Compléter
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Toutes les factures */}
      {activeTab === 'toutes' && (
        <>
          {/* Filtres */}
          <div className="card p-4 space-y-4">
            {/* Ligne 1: Recherche et filtres principaux */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par référence, dossier, client..."
                  className="input pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="input w-40"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Tous les types</option>
                <option value="acompte">Acomptes</option>
                <option value="solde">Soldes</option>
                <option value="avoir">Avoirs</option>
              </select>
              <select
                className="input w-40"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="paid">Payées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>

            {/* Ligne 2: Filtres croisés (période et montant) */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 whitespace-nowrap">Période :</label>
                <input
                  type="date"
                  className="input w-36 text-sm"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Du"
                />
                <span className="text-gray-400">→</span>
                <input
                  type="date"
                  className="input w-36 text-sm"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Au"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 whitespace-nowrap">Montant TTC :</label>
                <input
                  type="number"
                  className="input w-24 text-sm"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  placeholder="Min €"
                  min="0"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  className="input w-24 text-sm"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  placeholder="Max €"
                  min="0"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn btn-sm btn-secondary text-xs"
                >
                  <X size={14} />
                  Effacer filtres
                </button>
              )}

              {/* Compteur de résultats */}
              <div className="ml-auto text-sm text-gray-500">
                {filteredFactures.length} facture{filteredFactures.length > 1 ? 's' : ''}
                {hasActiveFilters && ` sur ${factures.length}`}
              </div>
            </div>
          </div>

          {/* Liste des factures */}
          <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Référence</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Client</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Dossier</th>
              <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Montant HT</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Montant TTC</th>
              <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase">Statut</th>
              <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredFactures.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  Aucune facture trouvée
                </td>
              </tr>
            ) : (
              filteredFactures.map((facture) => (
                <tr key={facture.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <span className="font-mono font-medium">{facture.reference}</span>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                      facture.type === 'acompte' && "bg-amber-100 text-amber-700",
                      facture.type === 'solde' && "bg-blue-100 text-blue-700",
                      facture.type === 'avoir' && "bg-red-100 text-red-700"
                    )}>
                      {facture.type === 'acompte' && 'Acompte'}
                      {facture.type === 'solde' && 'Solde'}
                      {facture.type === 'avoir' && 'Avoir'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{facture.client_name || facture.dossier?.client_name || '-'}</p>
                      {facture.client_city && (
                        <p className="text-xs text-gray-500">{facture.client_zip} {facture.client_city}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm">{facture.dossier?.reference || '-'}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {formatDate(facture.created_at)}
                  </td>
                  <td className="p-4 text-right">
                    <span className={cn("font-medium", facture.amount_ht < 0 && "text-red-600")}>
                      {formatPrice(facture.amount_ht)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={cn("font-bold", facture.amount_ttc < 0 && "text-red-600")}>
                      {formatPrice(facture.amount_ttc)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {facture.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle size={12} />
                        Payée
                      </span>
                    ) : facture.status === 'cancelled' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <XCircle size={12} />
                        Annulée
                      </span>
                    ) : facture.type === 'avoir' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Émis
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <Clock size={12} />
                        En attente
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownloadPDF(facture)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
                        title="Télécharger PDF"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => openEnvoiFactureModal(facture)}
                        className="p-1.5 rounded hover:bg-blue-100 text-blue-600"
                        title="Envoyer par email"
                      >
                        <Mail size={16} />
                      </button>
                      {facture.status !== 'paid' && facture.status !== 'cancelled' && facture.type !== 'avoir' && (
                        <button
                          onClick={() => openPaiementModal(facture)}
                          className="p-1.5 rounded hover:bg-green-100 text-green-600"
                          title="Enregistrer le paiement"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(facture.id)}
                        className="p-1.5 rounded hover:bg-red-100 text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
          </div>
        </>
      )}

      {/* Modale de création de facture */}
      <Modal
        isOpen={showFactureModal}
        onClose={() => {
          setShowFactureModal(false)
          setSelectedDossier(null)
        }}
        title={`Générer une facture - ${selectedDossier?.reference || ''}`}
        size="lg"
      >
        {selectedDossier && (
          <div className="space-y-6">
            {/* Infos dossier */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-dark mb-2">Informations du dossier</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Client:</span>{' '}
                  <span className="font-medium">{selectedDossier.client_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>{' '}
                  <span className="font-medium">{selectedDossier.client_email}</span>
                </div>
                <div>
                  <span className="text-gray-500">Trajet:</span>{' '}
                  <span className="font-medium">{selectedDossier.departure} → {selectedDossier.arrival}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>{' '}
                  <span className="font-medium">{formatDate(selectedDossier.departure_date)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Prix du dossier:</span>{' '}
                  <span className="font-bold text-magenta">
                    {formatPrice(selectedDossier.contrat?.price_ttc || selectedDossier.price_ttc)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Déjà facturé:</span>{' '}
                  <span className="font-medium text-green-600">
                    {formatPrice(selectedDossier.montantFacture || 0)}
                  </span>
                </div>
              </div>
              {/* Reste à facturer mis en évidence */}
              {selectedDossier.resteAFacturer > 0 && (
                <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-orange-800">Reste à facturer</span>
                    <span className="text-xl font-bold text-orange-600">{formatPrice(selectedDossier.resteAFacturer)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Type de facture - différent si facturation partielle */}
            {selectedDossier.isPartiel ? (
              /* Mode facturation partielle */
              <div>
                <label className="label">Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFactureForm(f => ({ ...f, type: 'solde', useAutoAmount: true, amount_ttc: selectedDossier.resteAFacturer }))}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      factureForm.type === 'solde'
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Receipt size={24} className="mx-auto mb-1" />
                    <div className="font-semibold">Facturer le reste</div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(selectedDossier.resteAFacturer)}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactureForm(f => ({ ...f, type: 'avoir', useAutoAmount: false, amount_ttc: 0 }))}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      factureForm.type === 'avoir'
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <RotateCcw size={24} className="mx-auto mb-1" />
                    <div className="font-semibold">Générer un avoir</div>
                    <div className="text-xs text-gray-500">Remboursement</div>
                  </button>
                </div>
              </div>
            ) : (
              /* Mode facturation normale (nouveau dossier) */
              <div>
                <label className="label">Type de facture</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFactureForm(f => ({ ...f, type: 'acompte' }))}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      factureForm.type === 'acompte'
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <Euro size={24} className="mx-auto mb-1" />
                    <div className="font-semibold">Acompte</div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(selectedDossier.contrat?.acompte_amount || Math.round((selectedDossier.contrat?.price_ttc || selectedDossier.price_ttc) * 0.3))}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactureForm(f => ({ ...f, type: 'solde' }))}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      factureForm.type === 'solde'
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <CheckCircle size={24} className="mx-auto mb-1" />
                    <div className="font-semibold">Solde</div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(selectedDossier.contrat?.solde_amount || ((selectedDossier.contrat?.price_ttc || selectedDossier.price_ttc) - (selectedDossier.contrat?.acompte_amount || Math.round((selectedDossier.contrat?.price_ttc || selectedDossier.price_ttc) * 0.3))))}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFactureForm(f => ({ ...f, type: 'avoir', useAutoAmount: false }))}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      factureForm.type === 'avoir'
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <RotateCcw size={24} className="mx-auto mb-1" />
                    <div className="font-semibold">Avoir</div>
                    <div className="text-xs text-gray-500">Remboursement</div>
                  </button>
                </div>
              </div>
            )}

            {/* Montant personnalisé */}
            {factureForm.type !== 'avoir' && (
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={factureForm.useAutoAmount}
                    onChange={(e) => setFactureForm(f => ({ ...f, useAutoAmount: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600">
                    {selectedDossier.isPartiel ? 'Facturer le reste complet' : 'Utiliser le montant automatique'}
                  </span>
                </label>
              </div>
            )}

            {(!factureForm.useAutoAmount || factureForm.type === 'avoir') && (
              <div>
                <label className="label">
                  Montant TTC personnalisé
                  {factureForm.type !== 'avoir' && selectedDossier.resteAFacturer > 0 && (
                    <span className="text-xs text-gray-500 ml-2">(max: {formatPrice(selectedDossier.resteAFacturer)})</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={factureForm.amount_ttc || ''}
                    onChange={(e) => {
                      let value = parseFloat(e.target.value) || 0
                      // Limiter au reste à facturer pour les factures (pas pour les avoirs)
                      if (factureForm.type !== 'avoir' && selectedDossier.resteAFacturer > 0) {
                        value = Math.min(value, selectedDossier.resteAFacturer)
                      }
                      setFactureForm(f => ({ ...f, amount_ttc: value }))
                    }}
                    className="input pr-10"
                    placeholder="0.00"
                    min="0"
                    max={factureForm.type !== 'avoir' ? selectedDossier.resteAFacturer : undefined}
                    step="0.01"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                </div>
                {factureForm.type !== 'avoir' && factureForm.amount_ttc > selectedDossier.resteAFacturer && (
                  <p className="text-xs text-red-500 mt-1">Le montant ne peut pas dépasser le reste à facturer</p>
                )}
              </div>
            )}

            {/* Infos client pour facturation */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-purple-dark mb-3">Adresse de facturation</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nom / Raison sociale</label>
                  <input
                    type="text"
                    value={factureForm.client_name}
                    onChange={(e) => setFactureForm(f => ({ ...f, client_name: e.target.value }))}
                    className="input"
                    placeholder={selectedDossier.client_name}
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Adresse</label>
                  <input
                    type="text"
                    value={factureForm.client_address}
                    onChange={(e) => setFactureForm(f => ({ ...f, client_address: e.target.value }))}
                    className="input"
                    placeholder="Adresse de facturation"
                  />
                </div>
                <div>
                  <label className="label">Code postal</label>
                  <input
                    type="text"
                    value={factureForm.client_zip}
                    onChange={(e) => setFactureForm(f => ({ ...f, client_zip: e.target.value }))}
                    className="input"
                    placeholder="75000"
                  />
                </div>
                <div>
                  <label className="label">Ville</label>
                  <input
                    type="text"
                    value={factureForm.client_city}
                    onChange={(e) => setFactureForm(f => ({ ...f, client_city: e.target.value }))}
                    className="input"
                    placeholder="Paris"
                  />
                </div>
              </div>
            </div>

            {/* Option envoi email */}
            <div className="border-t pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={factureForm.sendEmail}
                  onChange={(e) => setFactureForm(f => ({ ...f, sendEmail: e.target.checked }))}
                  className="rounded border-gray-300 text-magenta focus:ring-magenta"
                />
                <div>
                  <div className="font-medium">Envoyer par email</div>
                  <div className="text-sm text-gray-500">
                    La facture sera envoyée à {selectedDossier.client_email}
                  </div>
                </div>
              </label>
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowFactureModal(false)
                  setSelectedDossier(null)
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateFacture}
                disabled={generating}
                className="btn btn-primary flex-1"
              >
                {generating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Générer et télécharger
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modale de paiement */}
      <Modal
        isOpen={showPaiementModal}
        onClose={() => {
          setShowPaiementModal(false)
          setSelectedFacture(null)
        }}
        title="Enregistrer le paiement"
        size="md"
      >
        {selectedFacture && (
          <div className="space-y-6">
            {/* Infos facture */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Facture:</span>{' '}
                  <span className="font-mono font-medium">{selectedFacture.reference}</span>
                </div>
                <div>
                  <span className="text-gray-500">Type:</span>{' '}
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    selectedFacture.type === 'acompte' && "bg-amber-100 text-amber-700",
                    selectedFacture.type === 'solde' && "bg-blue-100 text-blue-700"
                  )}>
                    {selectedFacture.type === 'acompte' ? 'Acompte' : 'Solde'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Client:</span>{' '}
                  <span className="font-medium">{selectedFacture.client_name || selectedFacture.dossier?.client_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Montant:</span>{' '}
                  <span className="font-bold text-magenta">{formatPrice(Math.abs(selectedFacture.amount_ttc))}</span>
                </div>
              </div>
            </div>

            {/* Type de paiement */}
            <div>
              <label className="label">Mode de paiement</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'virement', label: 'Virement', icon: '🏦' },
                  { value: 'cb', label: 'CB', icon: '💳' },
                  { value: 'cheque', label: 'Chèque', icon: '📝' },
                  { value: 'especes', label: 'Espèces', icon: '💵' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPaiementForm(f => ({ ...f, type: option.value as any }))}
                    className={cn(
                      "p-3 rounded-lg border-2 text-center transition-all",
                      paiementForm.type === option.value
                        ? "border-magenta bg-magenta/5 text-magenta"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="text-xl mb-1">{option.icon}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date de paiement */}
            <div>
              <label className="label">Date du paiement</label>
              <input
                type="date"
                value={paiementForm.payment_date}
                onChange={(e) => setPaiementForm(f => ({ ...f, payment_date: e.target.value }))}
                className="input"
              />
            </div>

            {/* Référence */}
            <div>
              <label className="label">Référence (optionnel)</label>
              <input
                type="text"
                value={paiementForm.reference}
                onChange={(e) => setPaiementForm(f => ({ ...f, reference: e.target.value }))}
                className="input"
                placeholder="N° de transaction, référence virement..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes (optionnel)</label>
              <textarea
                value={paiementForm.notes}
                onChange={(e) => setPaiementForm(f => ({ ...f, notes: e.target.value }))}
                className="input"
                rows={2}
                placeholder="Informations complémentaires..."
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowPaiementModal(false)
                  setSelectedFacture(null)
                }}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePaiement}
                disabled={savingPaiement}
                className="btn btn-primary flex-1"
              >
                {savingPaiement ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Confirmer le paiement
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modale d'envoi de facture par email */}
      <Modal
        isOpen={showEnvoiFactureModal}
        onClose={() => {
          setShowEnvoiFactureModal(false)
          setSelectedFactureForEmail(null)
        }}
        title={`Envoyer la facture ${selectedFactureForEmail?.reference || ''}`}
        size="lg"
      >
        {selectedFactureForEmail && (
          <div className="space-y-4">
            {/* Aperçu facture */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm",
                selectedFactureForEmail.type === 'acompte' ? "bg-amber-500" :
                selectedFactureForEmail.type === 'avoir' ? "bg-red-500" : "bg-blue-500"
              )}>
                {selectedFactureForEmail.type === 'acompte' ? 'AC' :
                 selectedFactureForEmail.type === 'avoir' ? 'AV' : 'SOL'}
              </div>
              <div>
                <p className="font-medium">{selectedFactureForEmail.reference}</p>
                <p className="text-sm text-gray-500">
                  Montant : {formatPrice(selectedFactureForEmail.amount_ttc)}
                </p>
              </div>
            </div>

            {/* Formulaire email */}
            <div>
              <label className="label">Destinataire</label>
              <input
                type="email"
                value={envoiFactureForm.to}
                onChange={(e) => setEnvoiFactureForm(prev => ({ ...prev, to: e.target.value }))}
                className="input"
                placeholder="email@client.com"
              />
            </div>

            <div>
              <label className="label">Objet</label>
              <input
                type="text"
                value={envoiFactureForm.subject}
                onChange={(e) => setEnvoiFactureForm(prev => ({ ...prev, subject: e.target.value }))}
                className="input"
              />
            </div>

            <div>
              <label className="label">Message</label>
              <textarea
                value={envoiFactureForm.body}
                onChange={(e) => setEnvoiFactureForm(prev => ({ ...prev, body: e.target.value }))}
                className="input"
                rows={8}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setShowEnvoiFactureModal(false)}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleSendFactureEmail}
                disabled={sendingEmail}
                className="btn btn-primary flex-1"
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// Types pour les tarifs
interface TarifAllerSimple {
  id: string
  km_min: number
  km_max: number
  prix_public: number
}

interface TarifAR {
  id: string
  km_min: number
  km_max: number
  prix_8h: number | null
  prix_10h: number | null
  prix_12h: number | null
  prix_9h_coupure: number | null
}

interface CoefficientVehicule {
  id: string
  code: string
  label: string
  coefficient: number
}

// Types pour les nouvelles grilles (correspondent aux tables Supabase)
interface TarifARMAD {
  id: string
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
  id: string
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
  id: string
  code: string
  label: string
  places_min: number
  places_max: number
  coefficient: number
  disponible_partout: boolean | null
}


interface MajorationRegion {
  id: string
  region_code: string
  region_nom: string
  majoration_percent: number
  description: string | null
  is_active: boolean | null
  grande_capacite_dispo: boolean | null
}

function TarifsSettingsTab() {
  const queryClient = useQueryClient()
  const [activeSubTab, setActiveSubTab] = useState<'aller-simple' | 'ar-1j' | 'ar-mad' | 'ar-sans-mad' | 'capacites' | 'majorations'>('aller-simple')
  const [tarifsAllerSimple, setTarifsAllerSimple] = useState<TarifAllerSimple[]>([])
  const [tarifsAR1J, setTarifsAR1J] = useState<TarifAR[]>([])
  const [tarifsARMAD, setTarifsARMAD] = useState<TarifARMAD[]>([])
  const [tarifsARSansMAD, setTarifsARSansMAD] = useState<TarifARSansMAD[]>([])
  const [coefficients, setCoefficients] = useState<CoefficientVehicule[]>([])
  const [capacites, setCapacites] = useState<CapaciteVehicule[]>([])
  const [majorations, setMajorations] = useState<MajorationRegion[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [resAS, resAR, resARMAD, resARSansMAD, resCoef, resCapa, resMajo] = await Promise.all([
          supabase.from('tarifs_aller_simple').select('*').order('km_min'),
          supabase.from('tarifs_ar_1j').select('*').order('km_min'),
          supabase.from('tarifs_ar_mad').select('*').order('km_min'),
          supabase.from('tarifs_ar_sans_mad').select('*').order('km_min'),
          supabase.from('coefficients_vehicules').select('*').order('coefficient'),
          supabase.from('capacites_vehicules').select('*').order('places_min'),
          supabase.from('majorations_regions').select('*').order('region_code'),
        ])

        if (resAS.data) setTarifsAllerSimple(resAS.data)
        if (resAR.data) setTarifsAR1J(resAR.data)
        if (resARMAD.data) setTarifsARMAD(resARMAD.data)
        if (resCapa.data) setCapacites(resCapa.data)
        if (resARSansMAD.data) setTarifsARSansMAD(resARSansMAD.data)
        if (resCoef.data) setCoefficients(resCoef.data)
        if (resMajo.data) setMajorations(resMajo.data)
      } catch (error) {
        console.error('Erreur chargement tarifs:', error)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Mettre à jour un tarif aller simple
  const updateTarifAS = (id: string, field: string, value: number) => {
    setTarifsAllerSimple(prev => prev.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  // Mettre à jour un tarif AR 1J
  const updateTarifAR = (id: string, field: string, value: number) => {
    setTarifsAR1J(prev => prev.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  // Mettre à jour un tarif AR MAD
  const updateTarifARMAD = (id: string, field: string, value: number | null) => {
    setTarifsARMAD(prev => prev.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  // Mettre à jour un tarif AR Sans MAD
  const updateTarifARSansMAD = (id: string, field: string, value: number | null) => {
    setTarifsARSansMAD(prev => prev.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    ))
  }

  // Mettre à jour un coefficient
  const updateCoefficient = (id: string, field: string, value: string | number) => {
    setCoefficients(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  // Mettre à jour une capacité
  const updateCapacite = (id: string, field: string, value: string | number | boolean) => {
    setCapacites(prev => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ))
  }

  // Mettre à jour une majoration
  const updateMajoration = (id: string, field: string, value: string | number | boolean) => {
    setMajorations(prev => prev.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  // Sauvegarder tous les tarifs
  const handleSave = async () => {
    setSaving(true)
    try {
      // Sauvegarder les tarifs aller simple
      for (const tarif of tarifsAllerSimple) {
        await supabase
          .from('tarifs_aller_simple')
          .update({ prix_public: tarif.prix_public })
          .eq('id', tarif.id)
      }

      // Sauvegarder les tarifs AR 1j
      for (const tarif of tarifsAR1J) {
        await supabase
          .from('tarifs_ar_1j')
          .update({
            prix_8h: tarif.prix_8h,
            prix_10h: tarif.prix_10h,
            prix_12h: tarif.prix_12h,
            prix_9h_coupure: tarif.prix_9h_coupure,
          })
          .eq('id', tarif.id)
      }

      // Sauvegarder les tarifs AR MAD
      for (const tarif of tarifsARMAD) {
        await supabase
          .from('tarifs_ar_mad')
          .update({
            prix_2j: tarif.prix_2j,
            prix_3j: tarif.prix_3j,
            prix_4j: tarif.prix_4j,
            prix_5j: tarif.prix_5j,
            prix_6j: tarif.prix_6j,
            supplement_jour: tarif.supplement_jour,
          })
          .eq('id', tarif.id)
      }

      // Sauvegarder les tarifs AR Sans MAD
      for (const tarif of tarifsARSansMAD) {
        await supabase
          .from('tarifs_ar_sans_mad')
          .update({
            prix_2j: tarif.prix_2j,
            prix_3j: tarif.prix_3j,
            prix_4j: tarif.prix_4j,
            prix_5j: tarif.prix_5j,
            prix_6j: tarif.prix_6j,
            supplement_jour: tarif.supplement_jour,
          })
          .eq('id', tarif.id)
      }

      // Sauvegarder les coefficients
      for (const coef of coefficients) {
        await supabase
          .from('coefficients_vehicules')
          .update({
            label: coef.label,
            coefficient: coef.coefficient,
          })
          .eq('id', coef.id)
      }

      // Sauvegarder les capacités véhicules
      for (const capa of capacites) {
        await supabase
          .from('capacites_vehicules')
          .update({
            label: capa.label,
            places_min: capa.places_min,
            places_max: capa.places_max,
            coefficient: capa.coefficient,
            disponible_partout: capa.disponible_partout,
          })
          .eq('id', capa.id)
      }

      // Sauvegarder les majorations régions
      for (const majo of majorations) {
        await supabase
          .from('majorations_regions')
          .update({
            region_nom: majo.region_nom,
            majoration_percent: majo.majoration_percent,
            description: majo.description,
            is_active: majo.is_active,
            grande_capacite_dispo: majo.grande_capacite_dispo,
          })
          .eq('id', majo.id)
      }

      alert('Tarifs enregistrés avec succès !')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="text-center py-8">Chargement des tarifs...</div>
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="card p-6 bg-gradient-to-r from-green-50 to-blue-50">
        <h3 className="font-semibold text-purple-dark mb-2 flex items-center gap-2">
          <Euro size={20} className="text-green-600" />
          Grilles tarifaires de référence
        </h3>
        <p className="text-sm text-gray-600">
          Ces tarifs servent de base au calcul des devis automatiques. Le prix d'achat est calculé en divisant le prix public par 1.30.
        </p>
      </div>

      {/* Sous-onglets */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveSubTab('aller-simple')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            activeSubTab === 'aller-simple'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          Aller Simple
        </button>
        <button
          onClick={() => setActiveSubTab('ar-1j')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            activeSubTab === 'ar-1j'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          AR 1 Jour
        </button>
        <button
          onClick={() => setActiveSubTab('ar-mad')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            activeSubTab === 'ar-mad'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          AR +Jours MAD
        </button>
        <button
          onClick={() => setActiveSubTab('ar-sans-mad')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            activeSubTab === 'ar-sans-mad'
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          AR +Jours Sans MAD
        </button>
        <button
          onClick={() => setActiveSubTab('capacites')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            activeSubTab === 'capacites'
              ? 'bg-teal-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          Capacités Véhicules
        </button>
        <button
          onClick={() => setActiveSubTab('majorations')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            activeSubTab === 'majorations'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          Majorations Régions
        </button>
      </div>

      {/* Tarifs Aller Simple */}
      {activeSubTab === 'aller-simple' && (
        <div className="card p-6">
          <h4 className="font-semibold text-purple-dark mb-4">Tarifs Aller Simple (Prix Public TTC)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Distance</th>
                  <th className="text-right py-2 px-3">Prix Public</th>
                  <th className="text-right py-2 px-3 text-gray-400">Prix Achat (÷1.30)</th>
                </tr>
              </thead>
              <tbody>
                {tarifsAllerSimple.map((tarif) => (
                  <tr key={tarif.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">
                      {tarif.km_min} - {tarif.km_max} km
                    </td>
                    <td className="py-2 px-3 text-right">
                      <input
                        type="number"
                        className="w-24 text-right border rounded px-2 py-1"
                        value={tarif.prix_public}
                        onChange={(e) => updateTarifAS(tarif.id, 'prix_public', parseFloat(e.target.value) || 0)}
                      />
                      <span className="ml-1">€</span>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-400">
                      {formatPrice(tarif.prix_public / 1.30)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tarifs AR 1 Jour */}
      {activeSubTab === 'ar-1j' && (
        <div className="card p-6">
          <h4 className="font-semibold text-purple-dark mb-4">Tarifs AR 1 Jour (Prix Public TTC)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Distance</th>
                  <th className="text-right py-2 px-2">8h</th>
                  <th className="text-right py-2 px-2">10h</th>
                  <th className="text-right py-2 px-2">12h</th>
                  <th className="text-right py-2 px-2">9h Coupure</th>
                </tr>
              </thead>
              <tbody>
                {tarifsAR1J.map((tarif) => (
                  <tr key={tarif.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">
                      {tarif.km_min} - {tarif.km_max} km
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_8h ?? ''}
                        onChange={(e) => updateTarifAR(tarif.id, 'prix_8h', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_10h ?? ''}
                        onChange={(e) => updateTarifAR(tarif.id, 'prix_10h', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_12h ?? ''}
                        onChange={(e) => updateTarifAR(tarif.id, 'prix_12h', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_9h_coupure ?? ''}
                        onChange={(e) => updateTarifAR(tarif.id, 'prix_9h_coupure', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tarifs AR Plusieurs Jours avec MAD */}
      {activeSubTab === 'ar-mad' && (
        <div className="card p-6">
          <h4 className="font-semibold text-purple-dark mb-2">AR Plusieurs Jours - Avec Mise à Disposition (Circuit)</h4>
          <p className="text-sm text-gray-500 mb-4">
            Forfaits incluant 50 km/jour. Au-delà de 6 jours : +{tarifsARMAD[0]?.supplement_jour || 800}€/jour.
            Km supplémentaires sur place : 3€/km.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-blue-50">
                  <th className="text-left py-2 px-2">Distance</th>
                  <th className="text-right py-2 px-2">2 jours</th>
                  <th className="text-right py-2 px-2">3 jours</th>
                  <th className="text-right py-2 px-2">4 jours</th>
                  <th className="text-right py-2 px-2">5 jours</th>
                  <th className="text-right py-2 px-2">6 jours</th>
                </tr>
              </thead>
              <tbody>
                {tarifsARMAD.map((tarif) => (
                  <tr key={tarif.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">
                      {tarif.km_min} - {tarif.km_max} km
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_2j || ''}
                        onChange={(e) => updateTarifARMAD(tarif.id, 'prix_2j', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_3j || ''}
                        onChange={(e) => updateTarifARMAD(tarif.id, 'prix_3j', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_4j || ''}
                        onChange={(e) => updateTarifARMAD(tarif.id, 'prix_4j', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_5j || ''}
                        onChange={(e) => updateTarifARMAD(tarif.id, 'prix_5j', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_6j || ''}
                        onChange={(e) => updateTarifARMAD(tarif.id, 'prix_6j', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
            <strong>Règles MAD :</strong> +{tarifsARMAD[0]?.supplement_jour || 800}€/jour au-delà de 6 jours | 50 km/jour inclus | 3€/km supplémentaire
          </div>
        </div>
      )}

      {/* Tarifs AR Plusieurs Jours sans MAD */}
      {activeSubTab === 'ar-sans-mad' && (
        <div className="card p-6">
          <h4 className="font-semibold text-purple-dark mb-2">AR Plusieurs Jours - Sans Mise à Disposition</h4>
          <p className="text-sm text-gray-500 mb-4">
            Trajets avec règles amplitude, temps de conduite. Au-delà de 6 jours : +{tarifsARSansMAD[0]?.supplement_jour || 600}€/jour.
            Cases vides = configuration non disponible.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-purple-50">
                  <th className="text-left py-2 px-2">Distance</th>
                  <th className="text-right py-2 px-2">2 jours</th>
                  <th className="text-right py-2 px-2">3 jours</th>
                  <th className="text-right py-2 px-2">4 jours</th>
                  <th className="text-right py-2 px-2">5 jours</th>
                  <th className="text-right py-2 px-2">6 jours</th>
                </tr>
              </thead>
              <tbody>
                {tarifsARSansMAD.map((tarif) => (
                  <tr key={tarif.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium">
                      {tarif.km_min} - {tarif.km_max} km
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_2j || ''}
                        placeholder="-"
                        onChange={(e) => updateTarifARSansMAD(tarif.id, 'prix_2j', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_3j || ''}
                        placeholder="-"
                        onChange={(e) => updateTarifARSansMAD(tarif.id, 'prix_3j', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_4j || ''}
                        placeholder="-"
                        onChange={(e) => updateTarifARSansMAD(tarif.id, 'prix_4j', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_5j || ''}
                        placeholder="-"
                        onChange={(e) => updateTarifARSansMAD(tarif.id, 'prix_5j', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                    <td className="py-2 px-2 text-right">
                      <input
                        type="number"
                        className="w-20 text-right border rounded px-1 py-1 text-sm"
                        value={tarif.prix_6j || ''}
                        placeholder="-"
                        onChange={(e) => updateTarifARSansMAD(tarif.id, 'prix_6j', e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-purple-50 rounded-lg text-sm">
            <strong>Règles Sans MAD :</strong> +{tarifsARSansMAD[0]?.supplement_jour || 600}€/jour au-delà de 6 jours | Règles amplitude et temps de conduite applicables
          </div>
        </div>
      )}

      {/* Capacités Véhicules */}
      {activeSubTab === 'capacites' && (
        <div className="card p-6">
          <h4 className="font-semibold text-purple-dark mb-2">Capacités et Coefficients par Véhicule</h4>
          <p className="text-sm text-gray-500 mb-4">
            Définit le nombre de places par type de véhicule et son coefficient multiplicateur.
            Si +63 passagers et pas de grande capacité dispo → 2 autocars.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-teal-50">
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-center py-2 px-2">Places Min</th>
                  <th className="text-center py-2 px-2">Places Max</th>
                  <th className="text-center py-2 px-2">Coef.</th>
                  <th className="text-center py-2 px-2">Dispo partout</th>
                </tr>
              </thead>
              <tbody>
                {capacites.map((capa) => (
                  <tr key={capa.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1 font-medium"
                        value={capa.label}
                        onChange={(e) => updateCapacite(capa.id, 'label', e.target.value)}
                      />
                      <span className="text-xs text-gray-400">({capa.code})</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        className="w-16 text-center border rounded px-1 py-1"
                        value={capa.places_min}
                        onChange={(e) => updateCapacite(capa.id, 'places_min', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        className="w-16 text-center border rounded px-1 py-1"
                        value={capa.places_max}
                        onChange={(e) => updateCapacite(capa.id, 'places_max', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        step="0.01"
                        className="w-16 text-center border rounded px-1 py-1"
                        value={capa.coefficient}
                        onChange={(e) => updateCapacite(capa.id, 'coefficient', parseFloat(e.target.value) || 1)}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={capa.disponible_partout ?? true}
                        onChange={(e) => updateCapacite(capa.id, 'disponible_partout', e.target.checked)}
                        className="w-5 h-5 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-teal-50 rounded-lg text-sm">
            <strong>Logique multi-cars :</strong> Si passagers &gt; capacité max disponible = prix x nombre de cars nécessaires
          </div>
        </div>
      )}

      {/* Majorations Régions */}
      {activeSubTab === 'majorations' && (
        <div className="card p-6">
          <h4 className="font-semibold text-purple-dark mb-2">Majorations par Département</h4>
          <p className="text-sm text-gray-500 mb-4">
            Pourcentage de majoration appliqué sur le prix d'achat selon la difficulté à trouver un transporteur dans le département de départ.
          </p>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b bg-orange-50">
                  <th className="text-left py-2 px-2">Dept</th>
                  <th className="text-left py-2 px-2">Nom</th>
                  <th className="text-center py-2 px-2">Majoration %</th>
                  <th className="text-center py-2 px-2" title="Autocars 70+ places disponibles">Gde Capa</th>
                  <th className="text-left py-2 px-2">Description</th>
                  <th className="text-center py-2 px-2">Actif</th>
                </tr>
              </thead>
              <tbody>
                {majorations.map((majo) => (
                  <tr key={majo.id} className={cn(
                    'border-b hover:bg-gray-50',
                    majo.majoration_percent >= 15 ? 'bg-red-50' :
                    majo.majoration_percent >= 10 ? 'bg-orange-50' :
                    majo.majoration_percent >= 5 ? 'bg-yellow-50' : ''
                  )}>
                    <td className="py-2 px-2 font-mono font-bold text-gray-600">
                      {majo.region_code}
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1"
                        value={majo.region_nom}
                        onChange={(e) => updateMajoration(majo.id, 'region_nom', e.target.value)}
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="50"
                        className="w-16 text-center border rounded px-1 py-1"
                        value={majo.majoration_percent}
                        onChange={(e) => updateMajoration(majo.id, 'majoration_percent', parseFloat(e.target.value) || 0)}
                      />
                      <span className="ml-1">%</span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={majo.grande_capacite_dispo ?? false}
                        onChange={(e) => updateMajoration(majo.id, 'grande_capacite_dispo', e.target.checked)}
                        className="w-5 h-5 rounded accent-green-600"
                        title="Autocars grande capacité (70+ places) disponibles"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        className="w-full border rounded px-2 py-1 text-xs"
                        value={majo.description || ''}
                        onChange={(e) => updateMajoration(majo.id, 'description', e.target.value)}
                        placeholder="Description..."
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={majo.is_active ?? true}
                        onChange={(e) => updateMajoration(majo.id, 'is_active', e.target.checked)}
                        className="w-5 h-5 rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-3 bg-orange-50 rounded-lg text-sm space-y-1">
            <div><span className="inline-block w-4 h-4 bg-white border rounded mr-2"></span><strong>0%</strong> - Facile (beaucoup de transporteurs)</div>
            <div><span className="inline-block w-4 h-4 bg-yellow-100 border rounded mr-2"></span><strong>5%</strong> - Moyen</div>
            <div><span className="inline-block w-4 h-4 bg-orange-100 border rounded mr-2"></span><strong>10%</strong> - Problématique</div>
            <div><span className="inline-block w-4 h-4 bg-red-100 border rounded mr-2"></span><strong>15%</strong> - Très compliqué / Impossible</div>
          </div>
        </div>
      )}

      {/* Bouton Sauvegarder */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={saving}
        >
          <Save size={16} />
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}

function WorkflowsSettingsTab() {
  const queryClient = useQueryClient()
  const { data: workflows, isLoading } = useWorkflowsDevisAuto()
  const createWorkflow = useCreateWorkflow()
  const updateWorkflow = useUpdateWorkflow()
  const deleteWorkflow = useDeleteWorkflow()

  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowDevisAuto | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkflowName, setNewWorkflowName] = useState('')
  const [editSteps, setEditSteps] = useState<WorkflowStep[]>([])

  const handleCreateWorkflow = async () => {
    if (!newWorkflowName.trim()) return

    const defaultSteps: WorkflowStep[] = [
      { delay_hours: 3, marge_percent: 24, label: 'Devis 1 (+3h, 24%)' },
      { delay_hours: 6, marge_percent: 18, label: 'Devis 2 (+6h, 18%)' },
      { delay_hours: 9, marge_percent: 26, label: 'Devis 3 (+9h, 26%)' },
      { delay_hours: 24, marge_percent: 22, label: 'Devis 4 (+24h, 22%)' },
    ]

    await createWorkflow.mutateAsync({
      name: newWorkflowName,
      steps: defaultSteps,
    })

    setNewWorkflowName('')
    setShowCreateModal(false)
    queryClient.invalidateQueries({ queryKey: ['workflows_devis_auto'] })
  }

  const handleEditWorkflow = (workflow: WorkflowDevisAuto) => {
    setEditingWorkflow(workflow)
    setEditSteps(workflow.steps || [])
  }

  const handleSaveWorkflow = async () => {
    if (!editingWorkflow) return

    await updateWorkflow.mutateAsync({
      id: editingWorkflow.id,
      steps: editSteps,
    })

    setEditingWorkflow(null)
    setEditSteps([])
    queryClient.invalidateQueries({ queryKey: ['workflows_devis_auto'] })
  }

  const handleSetDefault = async (workflowId: string) => {
    // D'abord, mettre tous les autres à is_default: false
    if (workflows) {
      for (const wf of workflows) {
        if (wf.id !== workflowId && wf.is_default) {
          await updateWorkflow.mutateAsync({ id: wf.id, is_default: false })
        }
      }
    }
    // Puis mettre celui-ci à is_default: true
    await updateWorkflow.mutateAsync({ id: workflowId, is_default: true })
    queryClient.invalidateQueries({ queryKey: ['workflows_devis_auto'] })
  }

  const handleToggleActive = async (workflowId: string, currentActive: boolean) => {
    await updateWorkflow.mutateAsync({ id: workflowId, is_active: !currentActive })
    queryClient.invalidateQueries({ queryKey: ['workflows_devis_auto'] })
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Supprimer ce workflow ?')) return
    await deleteWorkflow.mutateAsync(workflowId)
    queryClient.invalidateQueries({ queryKey: ['workflows_devis_auto'] })
  }

  const updateStep = (index: number, field: keyof WorkflowStep, value: string | number) => {
    const newSteps = [...editSteps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    // Mettre à jour le label automatiquement
    if (field === 'delay_hours' || field === 'marge_percent') {
      newSteps[index].label = `Devis ${index + 1} (+${newSteps[index].delay_hours}h, ${newSteps[index].marge_percent}%)`
    }
    setEditSteps(newSteps)
  }

  const addStep = () => {
    const lastStep = editSteps[editSteps.length - 1]
    const newDelay = lastStep ? lastStep.delay_hours + 6 : 3
    setEditSteps([
      ...editSteps,
      { delay_hours: newDelay, marge_percent: 20, label: `Devis ${editSteps.length + 1} (+${newDelay}h, 20%)` }
    ])
  }

  const removeStep = (index: number) => {
    if (editSteps.length <= 1) return
    setEditSteps(editSteps.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      {/* Description */}
      <div className="card p-6 bg-gradient-to-r from-purple-50 to-orange-50">
        <h3 className="font-semibold text-purple-dark mb-2 flex items-center gap-2">
          <Zap size={20} className="text-orange" />
          Système d'envoi automatique de devis
        </h3>
        <p className="text-sm text-gray-600">
          Configurez les workflows d'envoi automatique de devis avec différentes marges et délais.
          Chaque étape envoie un nouveau devis au client avec un prix calculé depuis la grille tarifaire.
        </p>
      </div>

      {/* Liste des workflows */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-purple-dark">Workflows configurés</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} />
            Nouveau workflow
          </button>
        </div>

        {workflows && workflows.length > 0 ? (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className={cn(
                  'border rounded-lg p-4',
                  workflow.is_default ? 'border-purple bg-purple-50' : 'border-gray-200'
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-purple-dark">{workflow.name}</h4>
                      {workflow.is_default && (
                        <span className="px-2 py-0.5 bg-purple text-white text-xs rounded-full">
                          Par défaut
                        </span>
                      )}
                      <span className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        workflow.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {workflow.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {workflow.steps?.length || 0} étape(s) configurée(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!workflow.is_default && (
                      <button
                        onClick={() => handleSetDefault(workflow.id)}
                        className="text-xs px-2 py-1 bg-purple-100 text-purple rounded hover:bg-purple-200"
                        title="Définir par défaut"
                      >
                        Défaut
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActive(workflow.id, workflow.is_active)}
                      className={cn(
                        'text-xs px-2 py-1 rounded',
                        workflow.is_active
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      )}
                    >
                      {workflow.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => handleEditWorkflow(workflow)}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                      className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Affichage des étapes */}
                <div className="flex flex-wrap gap-2">
                  {(workflow.steps || []).map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border rounded-full text-sm"
                    >
                      <Clock size={14} className="text-gray-400" />
                      <span className="font-medium">+{step.delay_hours}h</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-orange font-medium">{step.marge_percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Zap size={48} className="mx-auto mb-2 text-gray-300" />
            <p>Aucun workflow configuré</p>
            <p className="text-sm">Créez un workflow pour automatiser l'envoi de devis</p>
          </div>
        )}
      </div>

      {/* Modal création workflow */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau workflow"
      >
        <div className="space-y-4">
          <div>
            <label className="label">Nom du workflow</label>
            <input
              type="text"
              className="input"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              placeholder="Ex: Workflow standard"
            />
          </div>
          <p className="text-sm text-gray-500">
            Le workflow sera créé avec les étapes par défaut (+3h/24%, +6h/18%, +9h/26%, +24h/22%).
            Vous pourrez les modifier ensuite.
          </p>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="btn btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateWorkflow}
              className="btn btn-primary flex-1"
              disabled={!newWorkflowName.trim() || createWorkflow.isPending}
            >
              {createWorkflow.isPending ? 'Création...' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal édition workflow */}
      <Modal
        isOpen={!!editingWorkflow}
        onClose={() => {
          setEditingWorkflow(null)
          setEditSteps([])
        }}
        title={`Modifier: ${editingWorkflow?.name || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            <strong>Délai:</strong> Temps après la création du dossier pour envoyer le devis<br/>
            <strong>Marge:</strong> Pourcentage de marge appliqué sur le prix d'achat
          </div>

          <div className="space-y-3">
            {editSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-purple text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Délai (heures)</label>
                    <input
                      type="number"
                      className="input py-1"
                      value={step.delay_hours}
                      onChange={(e) => updateStep(idx, 'delay_hours', parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Marge (%)</label>
                    <input
                      type="number"
                      className="input py-1"
                      value={step.marge_percent}
                      onChange={(e) => updateStep(idx, 'marge_percent', parseInt(e.target.value) || 0)}
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeStep(idx)}
                  className="p-2 text-red-500 hover:bg-red-100 rounded"
                  disabled={editSteps.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addStep}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple hover:text-purple transition-colors"
          >
            <Plus size={16} className="inline mr-1" />
            Ajouter une étape
          </button>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setEditingWorkflow(null)
                setEditSteps([])
              }}
              className="btn btn-secondary flex-1"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveWorkflow}
              className="btn btn-primary flex-1"
              disabled={updateWorkflow.isPending}
            >
              <Save size={16} />
              {updateWorkflow.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Composant pour les paramètres de paiement
function PaymentSettingsTab() {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [settings, setSettings] = useState({
    acompte_percent: 30,
    solde_days_before_departure: 30,
    full_payment_threshold_days: 30,
    payment_reminder_days: [45, 30, 15, 7] as number[],
  })

  // Charger les paramètres
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'payment_settings')
          .single()

        if (data && !error) {
          const value = data.value as typeof settings
          setSettings({
            acompte_percent: value.acompte_percent || 30,
            solde_days_before_departure: value.solde_days_before_departure || 30,
            full_payment_threshold_days: value.full_payment_threshold_days || 30,
            payment_reminder_days: value.payment_reminder_days || [45, 30, 15, 7],
          })
        }
      } catch (err) {
        console.error('Error loading payment settings:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'payment_settings',
          value: settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })

      if (error) throw error

      setSaveSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['app_setting', 'payment_settings'] })
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving payment settings:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-magenta mx-auto" />
        <p className="text-gray-500 mt-2">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Configuration des paiements</h3>
            <p className="text-sm text-blue-700 mt-1">
              Ces paramètres définissent les règles de paiement pour les réservations.
              Si le départ est à moins de {settings.full_payment_threshold_days} jours, le paiement total est requis.
            </p>
          </div>
        </div>
      </div>

      {/* Acompte Settings */}
      <div className="card p-6">
        <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
          <Wallet size={20} />
          Acompte à la réservation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Pourcentage d'acompte</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="100"
                className="input w-24"
                value={settings.acompte_percent}
                onChange={(e) => setSettings(prev => ({ ...prev, acompte_percent: parseInt(e.target.value) || 30 }))}
              />
              <span className="text-gray-600">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Montant demandé à la signature du contrat (par défaut 30%)
            </p>
          </div>
          <div>
            <label className="label">Solde complet si départ dans moins de</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="90"
                className="input w-24"
                value={settings.full_payment_threshold_days}
                onChange={(e) => setSettings(prev => ({ ...prev, full_payment_threshold_days: parseInt(e.target.value) || 30 }))}
              />
              <span className="text-gray-600">jours</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Si le départ est proche, le paiement total est requis (pas d'acompte)
            </p>
          </div>
        </div>
      </div>

      {/* Solde Settings */}
      <div className="card p-6">
        <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
          <CreditCard size={20} />
          Solde avant départ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Le solde doit être réglé</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="90"
                className="input w-24"
                value={settings.solde_days_before_departure}
                onChange={(e) => setSettings(prev => ({ ...prev, solde_days_before_departure: parseInt(e.target.value) || 30 }))}
              />
              <span className="text-gray-600">jours avant le départ</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Délai pour le paiement du solde (par défaut 30 jours)
            </p>
          </div>
          <div>
            <label className="label">Calcul du solde</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Solde = Total TTC - Acompte ({settings.acompte_percent}%)
              </p>
              <p className="text-sm text-gray-700 mt-1">
                = <strong>{100 - settings.acompte_percent}%</strong> du montant total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rappels automatiques */}
      <div className="card p-6">
        <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
          <Bell size={20} />
          Rappels de paiement automatiques
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Les rappels de solde sont envoyés automatiquement aux clients dont le solde n'est pas réglé.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {settings.payment_reminder_days.map((days, index) => (
            <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 text-orange-700 font-medium">
                <Calendar size={16} />
                J-{days}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                {days} jours avant départ
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Les rappels sont configurés dans la section Workflows &gt; Planificateur
        </p>
      </div>

      {/* Exemple */}
      <div className="card p-6 bg-purple-light/20">
        <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
          <Calculator size={20} />
          Exemple de calcul
        </h3>
        <div className="bg-white rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">
            Pour une réservation de <strong>1 000 €</strong> avec un départ dans 45 jours :
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Acompte à la signature</p>
              <p className="text-xl font-bold text-magenta">
                {formatPrice(1000 * settings.acompte_percent / 100)}
              </p>
              <p className="text-xs text-gray-400">({settings.acompte_percent}% du total)</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Solde {settings.solde_days_before_departure} jours avant</p>
              <p className="text-xl font-bold text-purple-dark">
                {formatPrice(1000 * (100 - settings.acompte_percent) / 100)}
              </p>
              <p className="text-xs text-gray-400">({100 - settings.acompte_percent}% du total)</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
              <AlertTriangle size={14} className="inline mr-1" />
              Si le départ est dans moins de {settings.full_payment_threshold_days} jours : paiement total de <strong>{formatPrice(1000)}</strong> requis
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        {saveSuccess && (
          <span className="flex items-center gap-2 text-green-600">
            <CheckCircle size={16} />
            Paramètres enregistrés
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save size={16} />
              Enregistrer les paramètres
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// Composant pour l'onglet Sécurité (changement de mot de passe)
function SecurityTab() {
  const { user } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validations
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Tous les champs sont obligatoires')
      return
    }

    if (newPassword.length < 8) {
      setError('Le nouveau mot de passe doit contenir au moins 8 caractères')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('change-admin-password', {
        body: {
          current_password: currentPassword,
          new_password: newPassword
        }
      })

      if (fnError) {
        setError('Erreur de connexion au serveur')
        return
      }

      if (!data?.success) {
        setError(data?.error || 'Erreur lors du changement de mot de passe')
        return
      }

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
          <Lock size={20} />
          Changer le mot de passe
        </h3>

        <div className="max-w-md">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              Mot de passe modifié avec succès !
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Mot de passe actuel</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="label">Nouveau mot de passe</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 8 caractères
              </p>
            </div>

            <div>
              <label className="label">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Modification...
                </>
              ) : (
                <>
                  <Lock size={16} className="mr-2" />
                  Changer le mot de passe
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Info compte */}
      <div className="card p-6">
        <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
          <Mail size={20} />
          Informations du compte
        </h3>
        <div className="text-sm text-gray-600">
          <p><strong>Email :</strong> {user?.email || 'Non connecté'}</p>
        </div>
      </div>
    </div>
  )
}

function SettingsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'company' | 'api' | 'workflows' | 'tarifs' | 'automation' | 'payments' | 'cgv' | 'experiments' | 'test-runner' | 'security'>('company')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [companySettings, setCompanySettings] = useState({
    id: '',
    name: '',
    legal_name: '',
    address: '',
    zip: '',
    city: '',
    country: 'France',
    phone: '',
    email: '',
    website: '',
    siret: '',
    rcs: '',
    code_ape: '',
    tva_intracom: '',
    iban: '',
    bic: '',
    bank_name: '',
  })

  const [envVars] = useState({
    supabase_url: import.meta.env.VITE_SUPABASE_URL || '',
    supabase_key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    geoapify_key: import.meta.env.VITE_GEOAPIFY_API_KEY || '',
    // PayTweak est configure dans Supabase Secrets
  })

  // Geoapify API key management
  const [geoapifyKey, setGeoapifyKey] = useState('')
  const [geoapifyEditing, setGeoapifyEditing] = useState(false)
  const [geoapifySaving, setGeoapifySaving] = useState(false)
  const [geoapifySuccess, setGeoapifySuccess] = useState(false)

  // Load company settings from database
  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single()

      if (data && !error) {
        setCompanySettings({
          id: data.id,
          name: data.name || '',
          legal_name: data.legal_name || '',
          address: data.address || '',
          zip: data.zip || '',
          city: data.city || '',
          country: data.country || 'France',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          siret: data.siret || '',
          rcs: data.rcs || '',
          code_ape: data.code_ape || '',
          tva_intracom: data.tva_intracom || '',
          iban: data.iban || '',
          bic: data.bic || '',
          bank_name: data.bank_name || '',
        })
      }
    }
    loadSettings()
  }, [])

  // Load Geoapify key from database
  useEffect(() => {
    const loadGeoapifyKey = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'geoapify_api_key')
        .single()

      if (data && !error && data.value) {
        const value = data.value as { key?: string }
        setGeoapifyKey(value.key || '')
      } else {
        // Fallback to env variable if not in database
        setGeoapifyKey(import.meta.env.VITE_GEOAPIFY_API_KEY || '')
      }
    }
    loadGeoapifyKey()
  }, [])

  const handleSaveGeoapifyKey = async () => {
    setGeoapifySaving(true)
    setGeoapifySuccess(false)
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'geoapify_api_key',
          value: { key: geoapifyKey },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })

      if (error) throw error

      setGeoapifySuccess(true)
      setGeoapifyEditing(false)
      queryClient.invalidateQueries({ queryKey: ['app_setting', 'geoapify_api_key'] })
      setTimeout(() => setGeoapifySuccess(false), 3000)
    } catch (error) {
      console.error('Error saving Geoapify key:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setGeoapifySaving(false)
    }
  }

  const handleSaveCompanySettings = async () => {
    setSaving(true)
    setSaveSuccess(false)

    try {
      const { error } = await supabase
        .from('company_settings')
        .update({
          name: companySettings.name,
          legal_name: companySettings.legal_name,
          address: companySettings.address,
          zip: companySettings.zip,
          city: companySettings.city,
          country: companySettings.country,
          phone: companySettings.phone,
          email: companySettings.email,
          website: companySettings.website,
          siret: companySettings.siret,
          rcs: companySettings.rcs,
          code_ape: companySettings.code_ape,
          tva_intracom: companySettings.tva_intracom,
          iban: companySettings.iban,
          bic: companySettings.bic,
          bank_name: companySettings.bank_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', companySettings.id)

      if (error) throw error

      setSaveSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['company_settings'] })
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving company settings:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const maskKey = (key: string) => {
    if (!key || key.length < 10) return key
    return key.slice(0, 8) + '...' + key.slice(-4)
  }

  const updateField = (field: string, value: string) => {
    setCompanySettings(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <h2 className="font-display text-xl font-bold text-purple-dark mb-2">
          <Settings size={24} className="inline mr-2" />
          Paramètres
        </h2>
        <p className="text-gray-500 text-sm">
          Configuration de l'entreprise et des services externes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('company')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'company'
              ? 'bg-purple text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <Building size={16} className="inline mr-2" />
          Entreprise
        </button>
        <button
          onClick={() => setActiveTab('api')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'api'
              ? 'bg-purple text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <Settings size={16} className="inline mr-2" />
          APIs & Services
        </button>
        <button
          onClick={() => setActiveTab('workflows')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'workflows'
              ? 'bg-purple text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <Zap size={16} className="inline mr-2" />
          Workflows Auto-Devis
        </button>
        <button
          onClick={() => setActiveTab('tarifs')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'tarifs'
              ? 'bg-purple text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <Euro size={16} className="inline mr-2" />
          Grilles Tarifaires
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'automation'
              ? 'bg-purple text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <Clock size={16} className="inline mr-2" />
          Automatisation
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'payments'
              ? 'bg-purple text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <CreditCard size={16} className="inline mr-2" />
          Paiements
        </button>
        <button
          onClick={() => setActiveTab('cgv')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'cgv'
              ? 'bg-purple text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <FileText size={16} className="inline mr-2" />
          CGV
        </button>
        <button
          onClick={() => setActiveTab('experiments')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'experiments'
              ? 'bg-purple text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <FlaskConical size={16} className="inline mr-2" />
          Tests A/B
        </button>
        <button
          onClick={() => setActiveTab('test-runner')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'test-runner'
              ? 'bg-purple text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <TestTube2 size={16} className="inline mr-2" />
          Tests Auto
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={cn(
            'px-4 py-2 rounded-lg font-medium transition-all',
            activeTab === 'security'
              ? 'bg-purple text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          )}
        >
          <Lock size={16} className="inline mr-2" />
          Sécurité
        </button>
      </div>

      {/* Company Settings Tab */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="card p-6">
            <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
              <Building size={20} />
              Informations générales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nom commercial</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Busmoov"
                />
              </div>
              <div>
                <label className="label">Raison sociale</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.legal_name}
                  onChange={(e) => updateField('legal_name', e.target.value)}
                  placeholder="BUSMOOV SAS"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Adresse</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder="41 Rue Barrault"
                />
              </div>
              <div>
                <label className="label">Code postal</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.zip}
                  onChange={(e) => updateField('zip', e.target.value)}
                  placeholder="75013"
                />
              </div>
              <div>
                <label className="label">Ville</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Paris"
                />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="01 76 31 12 83"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={companySettings.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="infos@busmoov.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">Site web</label>
                <input
                  type="url"
                  className="input"
                  value={companySettings.website}
                  onChange={(e) => updateField('website', e.target.value)}
                  placeholder="https://busmoov.com"
                />
              </div>
            </div>
          </div>

          {/* Informations légales */}
          <div className="card p-6">
            <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
              <FileText size={20} />
              Informations légales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">SIRET</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.siret}
                  onChange={(e) => updateField('siret', e.target.value)}
                  placeholder="853 867 703 00029"
                />
              </div>
              <div>
                <label className="label">RCS</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.rcs}
                  onChange={(e) => updateField('rcs', e.target.value)}
                  placeholder="Paris 853 867 703"
                />
              </div>
              <div>
                <label className="label">Code APE</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.code_ape}
                  onChange={(e) => updateField('code_ape', e.target.value)}
                  placeholder="4939B"
                />
              </div>
              <div>
                <label className="label">TVA Intracommunautaire</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.tva_intracom}
                  onChange={(e) => updateField('tva_intracom', e.target.value)}
                  placeholder="FR58853867703"
                />
              </div>
            </div>
          </div>

          {/* Coordonnées bancaires */}
          <div className="card p-6">
            <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
              <Euro size={20} />
              Coordonnées bancaires (RIB)
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
              Ces informations apparaîtront sur les PDF (devis, contrats, factures) pour les virements clients.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Banque</label>
                <input
                  type="text"
                  className="input"
                  value={companySettings.bank_name}
                  onChange={(e) => updateField('bank_name', e.target.value)}
                  placeholder="BNP Paribas"
                />
              </div>
              <div className="md:col-span-2">
                <label className="label">IBAN</label>
                <input
                  type="text"
                  className="input font-mono"
                  value={companySettings.iban}
                  onChange={(e) => updateField('iban', e.target.value)}
                  placeholder="FR76 3000 4015 9600 0101 0820 195"
                />
              </div>
              <div>
                <label className="label">BIC</label>
                <input
                  type="text"
                  className="input font-mono"
                  value={companySettings.bic}
                  onChange={(e) => updateField('bic', e.target.value)}
                  placeholder="BNPAFRPPXXX"
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle size={16} />
                Sauvegardé avec succès
              </span>
            )}
            <button
              onClick={handleSaveCompanySettings}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* API Settings Tab */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* Supabase */}
          <div className="card p-6">
            <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold">DB</span>
              Supabase (Base de données)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">URL Supabase</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="input flex-1 bg-gray-50 font-mono text-sm"
                    value={envVars.supabase_url}
                    readOnly
                  />
                  {envVars.supabase_url && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Configuré</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Variable: VITE_SUPABASE_URL</p>
              </div>
              <div>
                <label className="label">Clé Anon Supabase</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="input flex-1 bg-gray-50 font-mono text-sm"
                    value={maskKey(envVars.supabase_key)}
                    readOnly
                  />
                  {envVars.supabase_key && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Configuré</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Variable: VITE_SUPABASE_ANON_KEY</p>
              </div>
            </div>
          </div>

          {/* Geoapify */}
          <div className="card p-6">
            <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">GEO</span>
              Geoapify (Autocomplete adresses)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-2">
                  Clé API Geoapify
                  {geoapifySuccess && (
                    <span className="text-green-600 text-xs font-normal flex items-center gap-1">
                      <CheckCircle size={12} /> Sauvegardé
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  {geoapifyEditing ? (
                    <>
                      <input
                        type="text"
                        className="input flex-1 font-mono text-sm"
                        value={geoapifyKey}
                        onChange={(e) => setGeoapifyKey(e.target.value)}
                        placeholder="Entrez votre clé API Geoapify"
                      />
                      <button
                        onClick={handleSaveGeoapifyKey}
                        disabled={geoapifySaving}
                        className="btn btn-primary flex items-center gap-1"
                      >
                        {geoapifySaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => {
                          setGeoapifyEditing(false)
                          // Reload from database
                          supabase
                            .from('app_settings')
                            .select('value')
                            .eq('key', 'geoapify_api_key')
                            .single()
                            .then(({ data }) => {
                              const value = data?.value as { key?: string } | null
                              setGeoapifyKey(value?.key || import.meta.env.VITE_GEOAPIFY_API_KEY || '')
                            })
                        }}
                        className="btn btn-secondary"
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="input flex-1 bg-gray-50 font-mono text-sm"
                        value={geoapifyKey ? maskKey(geoapifyKey) : 'Non configuré'}
                        readOnly
                      />
                      {geoapifyKey ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Configuré</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Non configuré</span>
                      )}
                      <button
                        onClick={() => setGeoapifyEditing(true)}
                        className="btn btn-secondary flex items-center gap-1"
                      >
                        <Edit2 size={14} />
                        Modifier
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Obtenez une clé gratuite sur <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">geoapify.com</a>
                </p>
              </div>
            </div>
          </div>

          {/* PayTweak */}
          <div className="card p-6">
            <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple rounded flex items-center justify-center text-white text-xs font-bold">PAY</span>
              PayTweak (Paiements en ligne)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Configuration</label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-2">
                    PayTweak est configure via les <strong>Supabase Secrets</strong> pour les Edge Functions.
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                    <li>PAYTWEAK_API_KEY - Cle API PayTweak</li>
                    <li>PAYTWEAK_WEBHOOK_SECRET - Secret pour les webhooks</li>
                    <li>APP_URL - URL de l'application</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Configurez ces secrets dans Supabase &gt; Project Settings &gt; Edge Functions &gt; Secrets
                </p>
              </div>
            </div>
          </div>

          {/* Instructions fichier .env */}
          <div className="card p-6 bg-gray-50">
            <h3 className="font-semibold text-purple-dark mb-4">Fichier .env</h3>
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm overflow-x-auto">
              <pre>{`# Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon

# Geoapify - Autocomplete adresses
VITE_GEOAPIFY_API_KEY=votre_cle_geoapify

# PayTweak - Configure dans Supabase Secrets
# PAYTWEAK_API_KEY, PAYTWEAK_WEBHOOK_SECRET, APP_URL`}</pre>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Redémarrez le serveur de développement après modification du fichier .env
            </p>
          </div>
        </div>
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <WorkflowsSettingsTab />
      )}

      {/* Tarifs Tab */}
      {activeTab === 'tarifs' && (
        <TarifsSettingsTab />
      )}

      {/* Automation Tab */}
      {activeTab === 'automation' && (
        <CronSettingsSection />
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <PaymentSettingsTab />
      )}

      {/* CGV Tab */}
      {activeTab === 'cgv' && (
        <CGVPage />
      )}

      {/* Tests A/B Tab */}
      {activeTab === 'experiments' && (
        <ExperimentsPage />
      )}

      {/* Tests Auto Tab */}
      {activeTab === 'test-runner' && (
        <TestRunnerPage />
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <SecurityTab />
      )}
    </div>
  )
}
