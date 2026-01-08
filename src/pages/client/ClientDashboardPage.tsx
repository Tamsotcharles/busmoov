import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Euro,
  Calendar,
  MapPin,
  Users,
  Bus,
  LogOut,
  MessageCircle,
  Download,
  Star,
  Luggage,
  Route,
  Info,
  Send,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'

interface ClientSession {
  id: string
  reference: string
  email: string
}

interface Paiement {
  id: string
  amount: number
  payment_date: string
  type: string
}

interface Dossier {
  id: string
  reference: string
  client_name: string
  client_email: string
  status: string
  created_at: string
  departure: string
  arrival: string
  departure_date: string
  return_date: string | null
  passengers: number
  vehicle_type: string | null
  contract_signed_at: string | null
  price_ttc: number | null
  trip_mode: string | null
  special_requests: string | null
  demande: {
    id: string
    reference: string
    trip_type: string
    departure_date: string
    return_date: string | null
    departure_city: string
    arrival_city: string
    passengers: string
    voyage_type: string | null
    special_requests: string | null
  } | null
  paiements?: Paiement[]
}

interface Devis {
  id: string
  reference: string
  status: string
  price_ht: number
  price_ttc: number
  validity_days: number
  sent_at: string
  created_at: string
  vehicle_type: string | null
  options: string | null
  client_notes: string | null
  transporteur: {
    name: string
    rating: number | null
    number: string
  } | null
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'Nouveau', color: 'bg-blue-100 text-blue-700', icon: Clock },
  quotes_pending: { label: 'Devis en attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  quotes_received: { label: 'Devis reçus', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  quotes_sent: { label: 'Devis envoyés', color: 'bg-purple-100 text-purple-700', icon: FileText },
  'pending-client': { label: 'Devis envoyés', color: 'bg-orange-100 text-orange-700', icon: FileText },
  quote_accepted: { label: 'Devis accepté', color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  'pending-payment': { label: 'En attente paiement', color: 'bg-amber-100 text-amber-700', icon: Clock },
  'pending-reservation': { label: 'Acompte payé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  'bpa-received': { label: 'Réservation confirmée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  'pending-info': { label: 'Infos à compléter', color: 'bg-cyan-100 text-cyan-700', icon: FileText },
  'pending-driver': { label: 'Chauffeur assigné', color: 'bg-indigo-100 text-indigo-700', icon: CheckCircle },
  contract_sent: { label: 'Contrat envoyé', color: 'bg-indigo-100 text-indigo-700', icon: FileText },
  contract_signed: { label: 'Contrat signé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  completed: { label: 'Terminé', color: 'bg-gray-100 text-gray-700', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: AlertCircle },
}

// Fonction pour déterminer l'étape actuelle du workflow
// 6 étapes: Devis reçu → Contrat signé → Acompte payé → Infos voyage → Feuille de route → Voyage terminé
const getWorkflowStep = (status: string, hasDevis: boolean, hasContract: boolean, hasAcceptedDevis: boolean): number => {
  // Étape 0: Pas encore de devis
  if (!hasDevis) return 0

  // Étape 1: Devis reçu (on a des devis)
  if (!hasAcceptedDevis && !hasContract) return 1

  // Étape 2: Contrat signé
  if (!hasContract) return 1

  // Étape 2: En attente paiement (contrat signé, attente acompte)
  if (status === 'pending-payment') return 2

  // Étape 3: Acompte payé (en attente réservation = acompte reçu)
  if (status === 'pending-reservation') return 3

  // Étape 3.5: BPA reçu (transporteur a confirmé, en attente infos voyage)
  if (status === 'bpa-received') return 3

  // Étape 4: Infos voyage (attente infos ou infos reçues)
  if (status === 'pending-info' || status === 'pending-info-received') return 4

  // Étape 5: Feuille de route (chauffeur assigné ou dossier confirmé)
  if (status === 'pending-driver' || status === 'confirmed') return 5

  // Étape 6: Voyage terminé
  if (status === 'completed') return 6

  // Si on a un contrat signé mais dans un autre état
  if (hasContract) return 2

  return 1
}

// Fonction pour obtenir le label du véhicule
const getVehicleLabel = (type: string | null): string => {
  if (!type) return 'Autocar'
  const types: Record<string, string> = {
    minibus: 'Minibus (8-20 places)',
    standard: 'Autocar Standard (21-59 places)',
    '60-63': 'Autocar 60-63 places',
    '70': 'Autocar 70 places',
    '83-90': 'Double étage (83-90 places)',
    'autocar-standard': 'Autocar Standard',
    'autocar-gt': 'Autocar Grand Tourisme',
  }
  return types[type] || type
}

// Fonction pour obtenir le label du type de trajet
const getTripModeLabel = (tripMode: string | null): string => {
  if (!tripMode) return 'Non défini'
  const modes: Record<string, string> = {
    'one-way': 'Aller simple',
    'round-trip': 'Aller-retour',
    'circuit': 'Circuit / Mise à disposition',
  }
  return modes[tripMode] || tripMode
}

// Fonction pour extraire le détail du circuit depuis special_requests
const extractCircuitDetails = (specialRequests: string | null | undefined): string | null => {
  if (!specialRequests) return null

  const madMatch = specialRequests.match(/=== DÉTAIL MISE À DISPOSITION ===\n([\s\S]*?)\n==============================/)
  if (madMatch) {
    return madMatch[1].trim()
  }

  return null
}

export function ClientDashboardPage() {
  const navigate = useNavigate()
  const [session, setSession] = useState<ClientSession | null>(null)
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [devis, setDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)

  // États pour la modale de contact support
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [supportMessage, setSupportMessage] = useState('')
  const [supportSubject, setSupportSubject] = useState('question')
  const [sendingSupport, setSendingSupport] = useState(false)
  const [supportSuccess, setSupportSuccess] = useState(false)

  useEffect(() => {
    // Vérifier la session client
    const stored = sessionStorage.getItem('client_dossier')
    if (!stored) {
      navigate('/espace-client')
      return
    }

    const clientSession: ClientSession = JSON.parse(stored)
    setSession(clientSession)
    loadDossier(clientSession.id)
  }, [navigate])

  const loadDossier = async (dossierId: string) => {
    try {
      // Charger le dossier avec la demande
      const { data: dossierData } = await supabase
        .from('dossiers')
        .select(`
          id,
          reference,
          client_name,
          client_email,
          status,
          created_at,
          departure,
          arrival,
          departure_date,
          return_date,
          passengers,
          vehicle_type,
          contract_signed_at,
          price_ttc,
          trip_mode,
          special_requests,
          demande:demandes (
            id,
            reference,
            trip_type,
            departure_date,
            return_date,
            departure_city,
            arrival_city,
            passengers,
            voyage_type,
            special_requests
          )
        `)
        .eq('id', dossierId)
        .single()

      // Charger les paiements
      const { data: paiementsData } = await supabase
        .from('paiements')
        .select('id, amount, payment_date, type')
        .eq('dossier_id', dossierId)
        .order('payment_date', { ascending: false })

      if (dossierData) {
        const demande = Array.isArray(dossierData.demande)
          ? dossierData.demande[0]
          : dossierData.demande

        // Si le contrat est signé, rediriger vers MesDevisPage
        if (dossierData.contract_signed_at) {
          navigate(`/mes-devis?ref=${dossierData.reference}&email=${encodeURIComponent(dossierData.client_email)}`)
          return
        }

        setDossier({
          ...dossierData,
          demande,
          paiements: paiementsData || []
        } as unknown as Dossier)
      }

      // Charger les devis
      const { data: devisData } = await supabase
        .from('devis')
        .select(`
          id,
          reference,
          status,
          price_ht,
          price_ttc,
          validity_days,
          sent_at,
          created_at,
          vehicle_type,
          options,
          client_notes,
          transporteur:transporteurs (
            name,
            rating,
            number
          )
        `)
        .eq('dossier_id', dossierId)
        .in('status', ['sent', 'accepted', 'client_validated', 'rejected'])
        .order('price_ttc', { ascending: true })

      if (devisData) {
        const formattedDevis = devisData.map(d => ({
          ...d,
          transporteur: Array.isArray(d.transporteur) ? d.transporteur[0] : d.transporteur
        })) as unknown as Devis[]
        setDevis(formattedDevis)
      }
    } catch (error) {
      console.error('Erreur chargement dossier:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('client_dossier')
    navigate('/espace-client')
  }

  const handleAcceptDevis = async (devisId: string) => {
    if (!dossier || !session) return

    // Trouver le devis sélectionné pour avoir le prix
    const selectedDevis = devis.find(d => d.id === devisId)
    if (!selectedDevis) return

    const supplierNum = devis.findIndex(d => d.id === devisId) + 1
    const transporteurRef = selectedDevis.transporteur?.number || `Fournisseur n°${supplierNum}`

    if (!confirm(`Confirmer ${transporteurRef} à ${formatPrice(selectedDevis.price_ttc)} TTC ?\n\nVous allez être redirigé vers la signature du contrat.`)) {
      return
    }

    try {
      // Ne pas changer le statut du dossier ici - seulement après la signature du contrat
      // Le dossier reste en statut 'quotes_sent' jusqu'à la signature complète
      // On passe juste l'ID du devis sélectionné pour ouvrir la modal de signature

      // Rediriger vers MesDevisPage qui ouvrira automatiquement la modal de signature
      // On passe le devisId pour pré-sélectionner le bon devis
      navigate(`/mes-devis?ref=${dossier.reference}&email=${encodeURIComponent(dossier.client_email)}&sign=1&devis=${devisId}`)
    } catch (error) {
      console.error('Erreur acceptation devis:', error)
      alert('Une erreur est survenue')
    }
  }

  const handleSendSupportMessage = async () => {
    if (!dossier || !supportMessage.trim()) return

    setSendingSupport(true)
    try {
      const subjectLabels: Record<string, string> = {
        question: 'Question',
        modification: 'Demande de modification',
        probleme: 'Signalement de problème',
        autre: 'Autre demande'
      }

      const emailSubject = `[${dossier.reference}] ${subjectLabels[supportSubject]} - ${dossier.client_name}`
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Nouveau message client</h2>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #374151;">Informations du dossier</h3>
            <p style="margin: 5px 0;"><strong>Référence :</strong> ${dossier.reference}</p>
            <p style="margin: 5px 0;"><strong>Client :</strong> ${dossier.client_name}</p>
            <p style="margin: 5px 0;"><strong>Email :</strong> ${dossier.client_email}</p>
            <p style="margin: 5px 0;"><strong>Trajet :</strong> ${dossier.departure} → ${dossier.arrival}</p>
            <p style="margin: 5px 0;"><strong>Date :</strong> ${new Date(dossier.departure_date).toLocaleDateString('fr-FR')}</p>
          </div>

          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #92400e;">Type de demande : ${subjectLabels[supportSubject]}</h3>
            <p style="margin: 0; white-space: pre-wrap;">${supportMessage}</p>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Ce message a été envoyé depuis l'espace client Busmoov.
          </p>
        </div>
      `

      // Envoyer l'email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          type: 'custom',
          to: 'infos@busmoov.com',
          subject: emailSubject,
          html_content: emailContent,
          data: {
            dossier_id: dossier.id
          }
        }
      })

      if (emailError) {
        console.error('Erreur envoi email support:', emailError)
        throw emailError
      }

      // Insérer dans la timeline
      await supabase.from('timeline').insert({
        dossier_id: dossier.id,
        type: 'client_message',
        content: `📩 Message client (${subjectLabels[supportSubject]}): "${supportMessage.substring(0, 100)}${supportMessage.length > 100 ? '...' : ''}"`,
      })

      setSupportSuccess(true)
      setSupportMessage('')

      // Fermer la modale après un court délai
      setTimeout(() => {
        setSupportModalOpen(false)
        setSupportSuccess(false)
      }, 2000)

    } catch (error) {
      console.error('Erreur envoi message support:', error)
      alert('Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.')
    } finally {
      setSendingSupport(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Dossier introuvable</p>
          <Link to="/espace-client" className="btn btn-primary">
            Retour
          </Link>
        </div>
      </div>
    )
  }

  const status = statusConfig[dossier.status] || statusConfig.new
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
            <span className="font-display text-xl font-bold gradient-text">Busmoov</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {dossier.client_email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Dossier header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-2xl font-bold text-purple-dark">
                  Dossier {dossier.reference}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                  <StatusIcon size={14} className="inline mr-1" />
                  {status.label}
                </span>
              </div>
              <p className="text-gray-600">
                Bonjour {dossier.client_name}, bienvenue dans votre espace client
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              Créé le {formatDate(dossier.created_at)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Détails du voyage */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
                <Bus size={20} className="text-magenta" />
                Détails du voyage
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type de prestation */}
                <div className="flex items-start gap-3">
                  <Route size={18} className="text-magenta mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Type de prestation</p>
                    <p className="font-medium">
                      {getTripModeLabel(dossier.trip_mode || dossier.demande?.trip_type || null)}
                    </p>
                  </div>
                </div>

                {/* Trajet */}
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Trajet</p>
                    <p className="font-medium">
                      {dossier.departure} → {dossier.arrival}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Date(s)</p>
                    <p className="font-medium">
                      {formatDate(dossier.departure_date)}
                      {dossier.return_date && (
                        <> au {formatDate(dossier.return_date)}</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Passagers */}
                <div className="flex items-start gap-3">
                  <Users size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Passagers</p>
                    <p className="font-medium">{dossier.passengers} personnes</p>
                  </div>
                </div>

                {/* Type véhicule */}
                <div className="flex items-start gap-3">
                  <Bus size={18} className="text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Type de véhicule</p>
                    <p className="font-medium">{getVehicleLabel(dossier.vehicle_type)}</p>
                  </div>
                </div>

                {/* Type de voyage (scolaire, tourisme, etc.) */}
                {dossier.demande?.voyage_type && (
                  <div className="flex items-start gap-3">
                    <FileText size={18} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Motif du voyage</p>
                      <p className="font-medium capitalize">{dossier.demande.voyage_type}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Détail circuit/mise à disposition si applicable */}
              {(() => {
                const circuitDetails = extractCircuitDetails(dossier.special_requests || dossier.demande?.special_requests)
                const tripMode = dossier.trip_mode || dossier.demande?.trip_type

                if (circuitDetails && tripMode === 'circuit') {
                  return (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info size={18} className="text-purple mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-purple-dark mb-2">Détail de la mise à disposition</p>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{circuitDetails}</p>
                        </div>
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>

            {/* Liste des devis */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
                <Euro size={20} className="text-magenta" />
                Vos devis ({devis.length})
              </h2>

              {devis.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Vos devis sont en cours de préparation</p>
                  <p className="text-sm mt-1">Vous recevrez un email dès qu'ils seront disponibles</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devis.map((d, index) => {
                    const supplierNum = index + 1
                    const isBestPrice = index === 0 && d.status !== 'accepted' && d.status !== 'client_validated'
                    const pricePerPerson = dossier.passengers > 0 ? Math.round(d.price_ttc / dossier.passengers) : d.price_ttc
                    const isAccepted = d.status === 'accepted'
                    const isPending = d.status === 'client_validated'

                    return (
                      <div
                        key={d.id}
                        className={`border-2 rounded-xl overflow-hidden transition-all ${
                          isAccepted ? 'border-green-400 bg-green-50 ring-2 ring-green-200' :
                          isPending ? 'border-orange-400 bg-orange-50 ring-2 ring-orange-200' :
                          isBestPrice ? 'border-magenta bg-gradient-to-r from-magenta/5 to-purple/5 ring-2 ring-magenta/20' :
                          'border-gray-200 hover:border-magenta/50 hover:shadow-md'
                        }`}
                      >
                        {/* Badge meilleur prix */}
                        {isBestPrice && (
                          <div className="bg-gradient-to-r from-magenta to-purple text-white text-center py-1.5 text-sm font-semibold">
                            Meilleur prix
                          </div>
                        )}
                        {isAccepted && (
                          <div className="bg-green-500 text-white text-center py-1.5 text-sm font-semibold flex items-center justify-center gap-1">
                            <CheckCircle size={14} />
                            Fournisseur confirmé
                          </div>
                        )}
                        {isPending && (
                          <div className="bg-orange-400 text-white text-center py-1.5 text-sm font-semibold flex items-center justify-center gap-1">
                            <Clock size={14} />
                            En cours de validation
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center gap-4">
                            {/* Info fournisseur */}
                            <div className="flex items-center gap-3 md:w-1/4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                                isBestPrice ? 'bg-gradient-to-br from-magenta to-purple' : 'bg-gradient-to-br from-purple to-purple-dark'
                              }`}>
                                {supplierNum}
                              </div>
                              <div>
                                <span className="font-semibold text-purple-dark block">
                                  {d.transporteur?.number || `Fournisseur n°${supplierNum}`}
                                </span>
                                <span className="flex items-center gap-1 text-sm text-yellow-600">
                                  <Star size={12} fill="currentColor" />
                                  {d.transporteur?.rating?.toFixed(1) || '5.0'}
                                </span>
                              </div>
                            </div>

                            {/* Détails */}
                            <div className="flex-1 grid grid-cols-2 gap-2 text-sm md:w-2/4">
                              <div className="flex items-center gap-2">
                                <Bus size={14} className="text-gray-400" />
                                <span className="text-gray-600">{getVehicleLabel(d.vehicle_type)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock size={14} className="text-gray-400" />
                                <span className="text-gray-600">Valide {d.validity_days}j</span>
                              </div>
                              {d.client_notes && (
                                <div className="col-span-2 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                                  {d.client_notes}
                                </div>
                              )}
                            </div>

                            {/* Prix et action */}
                            <div className="flex items-center gap-4 md:w-1/4 justify-end">
                              <div className="text-right">
                                <p className={`text-2xl font-bold ${isBestPrice ? 'text-magenta' : 'text-purple-dark'}`}>
                                  {formatPrice(d.price_ttc)}
                                </p>
                                <p className="text-xs text-gray-500">TTC ({formatPrice(d.price_ht)} HT)</p>
                                <p className={`text-sm font-medium ${isBestPrice ? 'text-magenta' : 'text-purple'}`}>
                                  soit {formatPrice(pricePerPerson)}/pers.
                                </p>
                              </div>

                              {d.status === 'sent' && (
                                <button
                                  onClick={() => handleAcceptDevis(d.id)}
                                  className={`btn ${isBestPrice ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap`}
                                >
                                  Choisir
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="card p-6">
              <h3 className="font-semibold text-purple-dark mb-4">Actions</h3>
              <div className="space-y-3">
                <Link
                  to={`/mes-devis?ref=${dossier.reference}&email=${encodeURIComponent(dossier.client_email)}`}
                  className="btn btn-primary w-full justify-start"
                >
                  <FileText size={18} className="mr-2" />
                  Voir tous mes devis
                </Link>
                <button
                  onClick={() => setSupportModalOpen(true)}
                  className="btn btn-outline w-full justify-start"
                >
                  <MessageCircle size={18} className="mr-2" />
                  Contacter le support
                </button>
                <button className="btn btn-outline w-full justify-start">
                  <Download size={18} className="mr-2" />
                  Télécharger les documents
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <h3 className="font-semibold text-purple-dark mb-4">Suivi du dossier</h3>
              {(() => {
                const hasContract = !!dossier.contract_signed_at
                const hasDevis = devis.length > 0
                const hasAcceptedDevis = devis.some(d => d.status === 'accepted' || d.status === 'client_validated')
                const currentStep = getWorkflowStep(dossier.status, hasDevis, hasContract, hasAcceptedDevis)

                const steps = [
                  { num: 1, icon: '💰', label: 'Devis reçu' },
                  { num: 2, icon: '📄', label: 'Contrat signé' },
                  { num: 3, icon: '💳', label: 'Acompte payé' },
                  { num: 4, icon: '📝', label: 'Infos voyage' },
                  { num: 5, icon: '🗺️', label: 'Feuille de route' },
                  { num: 6, icon: '🎉', label: 'Voyage terminé' },
                ]

                return (
                  <div className="space-y-3">
                    {steps.map((step) => {
                      // Une étape est complétée si currentStep >= step.num
                      const isDone = currentStep >= step.num
                      // L'étape courante est celle qui correspond exactement à currentStep
                      const isCurrent = currentStep === step.num

                      return (
                        <div key={step.num} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all text-sm ${
                            isDone
                              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-sm'
                              : isCurrent
                                ? 'bg-magenta/10 border-2 border-magenta'
                                : 'bg-gray-100'
                          }`}>
                            {step.icon}
                          </div>
                          <span className={`text-sm ${
                            isDone ? 'text-gray-900 font-medium' : isCurrent ? 'text-magenta font-medium' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      )
                    })}

                    {/* Détails du paiement si acompte payé (pending-reservation ou bpa-received) */}
                    {(dossier.status === 'pending-reservation' || dossier.status === 'bpa-received') && dossier.paiements && dossier.paiements.length > 0 && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <CheckCircle size={16} />
                          Acompte reçu
                        </h4>
                        <div className="space-y-2 text-sm">
                          {dossier.paiements.map((p) => (
                            <div key={p.id} className="flex justify-between">
                              <span className="text-gray-600">
                                {p.type === 'virement' ? 'Virement' : p.type === 'cb' ? 'Carte bancaire' : p.type === 'especes' ? 'Espèces' : p.type === 'cheque' ? 'Chèque' : p.type}
                              </span>
                              <span className="font-medium text-green-700">
                                {formatPrice(p.amount)}
                              </span>
                            </div>
                          ))}
                          {dossier.price_ttc && (
                            <>
                              <div className="border-t border-green-200 pt-2 mt-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Solde restant</span>
                                  <span className="font-bold text-purple-dark">
                                    {formatPrice(dossier.price_ttc - dossier.paiements.reduce((sum, p) => sum + p.amount, 0))}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">
                                Le solde est à régler avant le départ.
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bloc Infos voyage à compléter si pending-reservation ou bpa-received */}
                    {(dossier.status === 'pending-reservation' || dossier.status === 'bpa-received') && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg">
                        <h4 className="font-semibold text-cyan-800 mb-2 flex items-center gap-2">
                          <FileText size={16} />
                          Prochaine étape : Infos voyage
                        </h4>
                        <p className="text-sm text-gray-600">
                          Notre équipe va vous contacter pour compléter les informations de votre voyage (liste des passagers, horaires précis, etc.)
                        </p>
                      </div>
                    )}

                    {/* Message de remerciement si voyage terminé */}
                    {currentStep >= 6 && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg text-center">
                        <p className="text-sm text-emerald-700 font-medium">
                          Merci d'avoir voyagé avec Busmoov ! 🎉
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Contact */}
            <div className="card p-6 bg-gradient-to-br from-purple-50 to-magenta-50">
              <h3 className="font-semibold text-purple-dark mb-2">Besoin d'aide ?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Notre équipe est disponible pour répondre à vos questions.
              </p>
              <button
                onClick={() => setSupportModalOpen(true)}
                className="text-magenta font-medium hover:underline"
              >
                Nous contacter
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Contact Support */}
      <Modal
        isOpen={supportModalOpen}
        onClose={() => {
          setSupportModalOpen(false)
          setSupportSuccess(false)
        }}
        title="Contacter le support"
        size="md"
      >
        {supportSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Message envoyé !</h3>
            <p className="text-gray-600">
              Notre équipe vous répondra dans les plus brefs délais.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <strong>Dossier :</strong> {dossier.reference}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Trajet :</strong> {dossier.departure} → {dossier.arrival}
              </p>
            </div>

            <div>
              <label className="label">Type de demande</label>
              <select
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                className="input"
              >
                <option value="question">Question sur mon dossier</option>
                <option value="modification">Demande de modification</option>
                <option value="probleme">Signaler un problème</option>
                <option value="autre">Autre demande</option>
              </select>
            </div>

            <div>
              <label className="label">Votre message</label>
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Décrivez votre demande en détail..."
                rows={5}
                className="input resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setSupportModalOpen(false)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleSendSupportMessage}
                disabled={sendingSupport || !supportMessage.trim()}
                className="btn btn-primary flex items-center gap-2"
              >
                {sendingSupport ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
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
