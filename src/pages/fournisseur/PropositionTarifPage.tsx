import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Calendar, MapPin, Users, Bus, Clock, Euro, Send, Wifi, Info, Accessibility, Luggage } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatPrice } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

// Taux de TVA par pays pour le transport de passagers
const COUNTRY_TVA_RATES: Record<string, number> = {
  FR: 10,
  ES: 10,
  DE: 7,
  GB: 0,
  EN: 0,
}

function getTvaRateByCountry(countryCode?: string | null): number {
  if (!countryCode) return 10
  return COUNTRY_TVA_RATES[countryCode] ?? 10
}

interface DemandeInfo {
  id: string
  status: string
  prix_propose: number | null
  dossier: {
    id: string
    reference: string
    departure: string
    arrival: string
    departure_date: string
    departure_time: string | null
    return_date: string | null
    return_time: string | null
    passengers: number
    // Champs additionnels du dossier
    trip_mode: string | null
    special_requests: string | null
    vehicle_type: string | null
    nombre_cars: number | null
    nombre_chauffeurs: number | null
    wifi: boolean | null
    wc: boolean | null
    accessibility: boolean | null
    luggage_type: string | null
    country_code: string | null
    tva_rate: number | null
  }
  transporteur: {
    id: string
    name: string
  }
  devis: {
    service_type: string | null
    nombre_cars: number | null
    nombre_chauffeurs: number | null
    duree_jours: number | null
    vehicle_type: string | null
    km: string | null
  } | null
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  'aller_simple': 'Aller simple',
  'ar_1j': 'Aller-retour 1 jour',
  'ar_mad': 'AR avec mise à disposition',
  'ar_sans_mad': 'AR sans mise à disposition',
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  'minibus': 'Minibus (8-20 places)',
  'standard': 'Standard (53 places)',
  'autocar': 'Autocar standard',
  '60-63': '60-63 places',
  '70': '70 places',
  '83-90': 'Double étage (83-90 places)',
}

const TRIP_MODE_LABELS: Record<string, string> = {
  'simple': 'Transfert simple',
  'aller_retour': 'Aller-retour',
  'circuit': 'Circuit / Mise à disposition',
}

const LUGGAGE_TYPE_LABELS: Record<string, string> = {
  'none': 'Sans bagages',
  'hand': 'Bagages à main uniquement',
  'standard': 'Bagages standard (1 valise/pers)',
  'large': 'Bagages volumineux',
}

// Helper pour extraire le détail MAD du special_requests
function extractMadDetails(specialRequests: string | null | undefined): string {
  if (!specialRequests) return ''
  const match = specialRequests.match(/=== DÉTAIL MISE À DISPOSITION ===\n([\s\S]*?)\n==============================/)
  return match ? match[1].trim() : ''
}

// Helper pour extraire les remarques hors MAD
function extractRemarques(specialRequests: string | null | undefined): string {
  if (!specialRequests) return ''
  // Retirer le bloc MAD s'il existe
  const withoutMad = specialRequests.replace(/=== DÉTAIL MISE À DISPOSITION ===\n[\s\S]*?\n==============================/g, '').trim()
  return withoutMad
}

export function PropositionTarifPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const demandeId = searchParams.get('demande') || ''

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [refusing, setRefusing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [refused, setRefused] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [alreadyRefused, setAlreadyRefused] = useState(false)
  const [demandeInfo, setDemandeInfo] = useState<DemandeInfo | null>(null)
  const [prixTTC, setPrixTTC] = useState<string>('')

  useEffect(() => {
    loadDemande()
  }, [token, demandeId])

  const loadDemande = async () => {
    if (!token || !demandeId) {
      setError(t('fournisseur.invalidLink'))
      setLoading(false)
      return
    }

    try {
      // Récupérer la demande fournisseur avec les infos du dossier
      const { data: demande, error: demandeError } = await (supabase as any)
        .from('demandes_fournisseurs')
        .select(`
          id,
          status,
          prix_propose,
          validation_token,
          transporteur_id,
          dossier:dossiers (
            id,
            reference,
            departure,
            arrival,
            departure_date,
            departure_time,
            return_date,
            return_time,
            passengers,
            trip_mode,
            special_requests,
            vehicle_type,
            nombre_cars,
            nombre_chauffeurs,
            wifi,
            wc,
            accessibility,
            luggage_type,
            country_code,
            tva_rate,
            devis (
              service_type,
              nombre_cars,
              nombre_chauffeurs,
              duree_jours,
              vehicle_type,
              km,
              status
            )
          ),
          transporteur:transporteurs (
            id,
            name
          )
        `)
        .eq('id', demandeId)
        .single()

      if (demandeError || !demande) {
        setError(t('fournisseur.requestNotFound'))
        setLoading(false)
        return
      }

      // Vérifier le token
      if (demande.validation_token !== token) {
        setError(t('fournisseur.invalidValidationLink'))
        setLoading(false)
        return
      }

      // Vérifier si déjà soumis ou refusé
      if (demande.prix_propose !== null) {
        setAlreadySubmitted(true)
        setPrixTTC(demande.prix_propose.toString())
      }

      if (demande.status === 'refused' || demande.status === 'non_disponible') {
        setAlreadyRefused(true)
      }

      // Extraire les infos
      const dossier = Array.isArray(demande.dossier) ? demande.dossier[0] : demande.dossier
      const transporteur = Array.isArray(demande.transporteur) ? demande.transporteur[0] : demande.transporteur

      if (!dossier || !transporteur) {
        setError(t('fournisseur.dossierInfoNotFound'))
        setLoading(false)
        return
      }

      // Récupérer le devis accepté ou le premier
      const devisArray = dossier.devis || []
      const devisAccepte = devisArray.find((d: any) => d.status === 'accepted') || devisArray[0] || null

      setDemandeInfo({
        id: demande.id,
        status: demande.status,
        prix_propose: demande.prix_propose,
        dossier: {
          id: dossier.id,
          reference: dossier.reference,
          departure: dossier.departure,
          arrival: dossier.arrival,
          departure_date: dossier.departure_date,
          departure_time: dossier.departure_time,
          return_date: dossier.return_date,
          return_time: dossier.return_time,
          passengers: dossier.passengers,
          // Champs additionnels
          trip_mode: dossier.trip_mode,
          special_requests: dossier.special_requests,
          vehicle_type: dossier.vehicle_type,
          nombre_cars: dossier.nombre_cars,
          nombre_chauffeurs: dossier.nombre_chauffeurs,
          wifi: dossier.wifi,
          wc: dossier.wc,
          accessibility: dossier.accessibility,
          luggage_type: dossier.luggage_type,
          country_code: dossier.country_code || null,
          tva_rate: dossier.tva_rate || null,
        },
        transporteur: {
          id: transporteur.id,
          name: transporteur.name,
        },
        devis: devisAccepte ? {
          service_type: devisAccepte.service_type,
          nombre_cars: devisAccepte.nombre_cars,
          nombre_chauffeurs: devisAccepte.nombre_chauffeurs,
          duree_jours: devisAccepte.duree_jours,
          vehicle_type: devisAccepte.vehicle_type,
          km: devisAccepte.km,
        } : null,
      })

      setLoading(false)
    } catch (err) {
      console.error('Error loading demande:', err)
      setError(t('fournisseur.errorOccurred'))
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!demandeId || !token || !prixTTC) return

    const prix = parseFloat(prixTTC.replace(',', '.'))
    if (isNaN(prix) || prix <= 0) {
      setError(t('fournisseur.invalidPrice'))
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Mettre à jour la demande avec le prix proposé
      const { error: updateError } = await (supabase as any)
        .from('demandes_fournisseurs')
        .update({
          prix_propose: prix,
          status: 'tarif_recu',
          tarif_received_at: new Date().toISOString(),
        })
        .eq('id', demandeId)
        .eq('validation_token', token)

      if (updateError) throw updateError

      // Ajouter une entrée dans la timeline
      if (demandeInfo) {
        const tvaRate = demandeInfo.dossier.tva_rate ?? getTvaRateByCountry(demandeInfo.dossier.country_code)
        const prixHT = Math.round((prix / (1 + tvaRate / 100)) * 100) / 100
        await supabase
          .from('timeline')
          .insert({
            dossier_id: demandeInfo.dossier.id,
            type: 'note',
            content: `Proposition tarifaire reçue de ${demandeInfo.transporteur.name} : ${formatPrice(prix)} TTC (${formatPrice(prixHT)} HT)`,
          })

        // Créer une notification CRM
        await (supabase as any)
          .from('notifications_crm')
          .insert({
            dossier_id: demandeInfo.dossier.id,
            dossier_reference: demandeInfo.dossier.reference,
            type: 'tarif_fournisseur',
            title: `Tarif reçu: ${formatPrice(prix)} TTC`,
            description: `${demandeInfo.transporteur.name} a proposé ${formatPrice(prix)} TTC (${formatPrice(prixHT)} HT) pour le trajet ${demandeInfo.dossier.departure} → ${demandeInfo.dossier.arrival}`,
            source_type: 'transporteur',
            source_name: demandeInfo.transporteur.name,
            source_id: demandeInfo.transporteur.id,
            metadata: { prix_ttc: prix, prix_ht: prixHT }
          })
      }

      setSuccess(true)
    } catch (err) {
      console.error('Error submitting tarif:', err)
      setError(t('fournisseur.sendError'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleRefuse = async () => {
    if (!demandeId || !token || !demandeInfo) return

    // Confirmation
    if (!confirm(t('fournisseur.confirmRefuse'))) {
      return
    }

    setRefusing(true)
    setError(null)

    try {
      // Mettre à jour la demande avec le statut refusé
      const { error: updateError } = await (supabase as any)
        .from('demandes_fournisseurs')
        .update({
          status: 'non_disponible',
          refused_at: new Date().toISOString(),
        })
        .eq('id', demandeId)
        .eq('validation_token', token)

      if (updateError) throw updateError

      // Ajouter une entrée dans la timeline
      await supabase
        .from('timeline')
        .insert({
          dossier_id: demandeInfo.dossier.id,
          type: 'note',
          content: `${demandeInfo.transporteur.name} a décliné la demande de tarif (non disponible)`,
        })

      // Créer une notification CRM
      await (supabase as any)
        .from('notifications_crm')
        .insert({
          dossier_id: demandeInfo.dossier.id,
          dossier_reference: demandeInfo.dossier.reference,
          type: 'refus_fournisseur',
          title: `Refus de ${demandeInfo.transporteur.name}`,
          description: `${demandeInfo.transporteur.name} n'est pas disponible pour le trajet ${demandeInfo.dossier.departure} → ${demandeInfo.dossier.arrival} du ${formatDate(demandeInfo.dossier.departure_date)}`,
          source_type: 'transporteur',
          source_name: demandeInfo.transporteur.name,
          source_id: demandeInfo.transporteur.id,
        })

      setRefused(true)
    } catch (err) {
      console.error('Error refusing demande:', err)
      setError(t('fournisseur.refuseError'))
    } finally {
      setRefusing(false)
    }
  }

  // Calculer le prix HT à partir du TTC (selon le taux de TVA du pays)
  const tvaRateDisplay = demandeInfo?.dossier.tva_rate ?? getTvaRateByCountry(demandeInfo?.dossier.country_code)
  const prixHTCalcule = prixTTC
    ? Math.round((parseFloat(prixTTC.replace(',', '.')) / (1 + tvaRateDisplay / 100)) * 100) / 100
    : null

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-magenta mx-auto mb-4" />
          <p className="text-gray-500">{t('fournisseur.loading')}</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !demandeInfo) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle size={40} className="text-red-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-red-600 mb-2">
              {t('fournisseur.error')}
            </h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <a href="mailto:infos@busmoov.com" className="btn btn-primary">
              {t('fournisseur.contactBusmoov')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-green-600 mb-2">
              {t('fournisseur.proposalSent')}
            </h2>
            <p className="text-gray-500 mb-4">
              {t('fournisseur.proposalSentText', { price: formatPrice(parseFloat(prixTTC.replace(',', '.'))) })}
            </p>
            <p className="text-gray-400 text-sm">
              {t('fournisseur.willContactYou')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Already submitted state
  if (alreadySubmitted && demandeInfo) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle size={40} className="text-blue-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-blue-600 mb-2">
              {t('fournisseur.alreadySubmitted')}
            </h2>
            <p className="text-gray-500 mb-4">
              {t('fournisseur.alreadySubmittedText', { price: formatPrice(demandeInfo.prix_propose || 0) })}
            </p>
            <p className="text-gray-400 text-sm">
              {t('fournisseur.modifyContact')}
            </p>
            <a href="mailto:infos@busmoov.com" className="btn btn-secondary mt-4">
              {t('fournisseur.contactBusmoov')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Refused state (just refused)
  if (refused) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
              <XCircle size={40} className="text-orange-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-orange-600 mb-2">
              {t('fournisseur.requestRefused')}
            </h2>
            <p className="text-gray-500 mb-4">
              {t('fournisseur.unavailabilityRecorded')}
            </p>
            <p className="text-gray-400 text-sm">
              {t('fournisseur.thanksForInfo')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Already refused state
  if (alreadyRefused && demandeInfo) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
              <XCircle size={40} className="text-orange-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-orange-600 mb-2">
              {t('fournisseur.alreadyRefused')}
            </h2>
            <p className="text-gray-500 mb-4">
              {t('fournisseur.alreadyRefusedText')}
            </p>
            <p className="text-gray-400 text-sm">
              {t('fournisseur.wantToQuote')}
            </p>
            <a href="mailto:infos@busmoov.com" className="btn btn-secondary mt-4">
              {t('fournisseur.contactBusmoov')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!demandeInfo) return null

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Busmoov" className="h-12 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-gray-900">
            {t('fournisseur.quoteRequest')}
          </h1>
          <p className="text-gray-500 mt-2">
            {demandeInfo.transporteur.name}
          </p>
        </div>

        {/* Infos dossier */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Bus size={20} className="text-magenta" />
            {t('fournisseur.serviceDetails')}
          </h2>

          <div className="space-y-4">
            {/* Référence */}
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-sm text-gray-500">{t('fournisseur.reference')}</span>
              <p className="font-semibold">{demandeInfo.dossier.reference}</p>
            </div>

            {/* Trajet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm text-gray-500">{t('fournisseur.departure')}</span>
                  <p className="font-medium">{demandeInfo.dossier.departure}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm text-gray-500">{t('fournisseur.arrival')}</span>
                  <p className="font-medium">{demandeInfo.dossier.arrival}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-magenta mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm text-gray-500">{t('fournisseur.departureDate')}</span>
                  <p className="font-medium">
                    {formatDate(demandeInfo.dossier.departure_date)}
                    {demandeInfo.dossier.departure_time && ` ${t('fournisseur.at')} ${demandeInfo.dossier.departure_time}`}
                  </p>
                </div>
              </div>
              {demandeInfo.dossier.return_date && (
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-magenta mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-gray-500">{t('fournisseur.returnDate')}</span>
                    <p className="font-medium">
                      {formatDate(demandeInfo.dossier.return_date)}
                      {demandeInfo.dossier.return_time && ` ${t('fournisseur.at')} ${demandeInfo.dossier.return_time}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Passagers */}
            <div className="flex items-start gap-3">
              <Users size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm text-gray-500">{t('fournisseur.passengers')}</span>
                <p className="font-medium">{demandeInfo.dossier.passengers} {t('fournisseur.passengersCount')}</p>
              </div>
            </div>

            {/* Type de trajet */}
            {demandeInfo.dossier.trip_mode && (
              <div className="flex items-start gap-3">
                <Bus size={18} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm text-gray-500">{t('fournisseur.tripType')}</span>
                  <p className="font-medium">{t(`fournisseur.tripMode.${demandeInfo.dossier.trip_mode}`, TRIP_MODE_LABELS[demandeInfo.dossier.trip_mode] || demandeInfo.dossier.trip_mode)}</p>
                </div>
              </div>
            )}

            {/* Type de véhicule (du dossier) */}
            {demandeInfo.dossier.vehicle_type && (
              <div className="flex items-start gap-3">
                <Bus size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-sm text-gray-500">{t('fournisseur.vehicleType')}</span>
                  <p className="font-medium">{t(`fournisseur.vehicleTypes.${demandeInfo.dossier.vehicle_type}`, VEHICLE_TYPE_LABELS[demandeInfo.dossier.vehicle_type] || demandeInfo.dossier.vehicle_type)}</p>
                </div>
              </div>
            )}

            {/* Nombre de cars et chauffeurs (du dossier) */}
            {(demandeInfo.dossier.nombre_cars && demandeInfo.dossier.nombre_cars > 1) || (demandeInfo.dossier.nombre_chauffeurs && demandeInfo.dossier.nombre_chauffeurs > 1) ? (
              <div className="grid grid-cols-2 gap-4">
                {demandeInfo.dossier.nombre_cars && demandeInfo.dossier.nombre_cars > 1 && (
                  <div className="flex items-start gap-3">
                    <Bus size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-gray-500">{t('fournisseur.nbBuses')}</span>
                      <p className="font-medium">{demandeInfo.dossier.nombre_cars}</p>
                    </div>
                  </div>
                )}
                {demandeInfo.dossier.nombre_chauffeurs && demandeInfo.dossier.nombre_chauffeurs > 1 && (
                  <div className="flex items-start gap-3">
                    <Users size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm text-gray-500">{t('fournisseur.nbDrivers')}</span>
                      <p className="font-medium">{demandeInfo.dossier.nombre_chauffeurs}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Équipements demandés */}
            {(demandeInfo.dossier.wifi || demandeInfo.dossier.wc || demandeInfo.dossier.accessibility || demandeInfo.dossier.luggage_type) && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Info size={16} className="text-blue-500" />
                  {t('fournisseur.requestedEquipment')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {demandeInfo.dossier.wifi && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                      <Wifi size={14} /> WiFi
                    </span>
                  )}
                  {demandeInfo.dossier.wc && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                      WC
                    </span>
                  )}
                  {demandeInfo.dossier.accessibility && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                      <Accessibility size={14} /> {t('fournisseur.pmr')}
                    </span>
                  )}
                  {demandeInfo.dossier.luggage_type && demandeInfo.dossier.luggage_type !== 'none' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
                      <Luggage size={14} /> {t(`fournisseur.luggageTypes.${demandeInfo.dossier.luggage_type}`, LUGGAGE_TYPE_LABELS[demandeInfo.dossier.luggage_type] || demandeInfo.dossier.luggage_type)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Détail MAD si circuit */}
            {demandeInfo.dossier.trip_mode === 'circuit' && extractMadDetails(demandeInfo.dossier.special_requests) && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-magenta" />
                  {t('fournisseur.disposalDetail')}
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-900 whitespace-pre-line">{extractMadDetails(demandeInfo.dossier.special_requests)}</p>
                </div>
              </div>
            )}

            {/* Remarques */}
            {extractRemarques(demandeInfo.dossier.special_requests) && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Info size={16} className="text-gray-500" />
                  {t('fournisseur.remarks')}
                </h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 whitespace-pre-line">{extractRemarques(demandeInfo.dossier.special_requests)}</p>
                </div>
              </div>
            )}

            {/* Infos devis supplémentaires si disponibles */}
            {demandeInfo.devis && (demandeInfo.devis.service_type || demandeInfo.devis.km || demandeInfo.devis.duree_jours) && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('fournisseur.additionalDetails')}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {demandeInfo.devis.service_type && (
                    <div>
                      <span className="text-gray-500">{t('fournisseur.serviceTypeLabel')}</span>
                      <p className="font-medium">{t(`fournisseur.serviceTypes.${demandeInfo.devis.service_type}`, SERVICE_TYPE_LABELS[demandeInfo.devis.service_type] || demandeInfo.devis.service_type)}</p>
                    </div>
                  )}
                  {demandeInfo.devis.km && (
                    <div>
                      <span className="text-gray-500">{t('fournisseur.estimatedDistance')}</span>
                      <p className="font-medium">{demandeInfo.devis.km} km</p>
                    </div>
                  )}
                  {demandeInfo.devis.duree_jours && demandeInfo.devis.duree_jours > 1 && (
                    <div>
                      <span className="text-gray-500">{t('fournisseur.duration')}</span>
                      <p className="font-medium">{demandeInfo.devis.duree_jours} {t('fournisseur.days')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Formulaire de proposition */}
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Euro size={20} className="text-green-600" />
            {t('fournisseur.yourQuote')}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="label">{t('fournisseur.priceTTC')}</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  className="input pr-12 text-lg font-semibold"
                  placeholder="Ex: 1500"
                  value={prixTTC}
                  onChange={(e) => setPrixTTC(e.target.value)}
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  € TTC
                </span>
              </div>
              {prixHTCalcule && prixHTCalcule > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('fournisseur.priceHTNote', { price: formatPrice(prixHTCalcule), vatRate: tvaRateDisplay })}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || refusing || !prixTTC}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('fournisseur.sending')}
                </>
              ) : (
                <>
                  <Send size={18} />
                  {t('fournisseur.sendProposal')}
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              {t('fournisseur.commitmentNote')}
            </p>
          </form>

          {/* Séparateur */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('fournisseur.or')}</span>
            </div>
          </div>

          {/* Bouton refuser */}
          <button
            type="button"
            onClick={handleRefuse}
            disabled={submitting || refusing}
            className="w-full py-2 px-4 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {refusing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('fournisseur.processing')}
              </>
            ) : (
              <>
                <XCircle size={18} />
                {t('fournisseur.notAvailable')}
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>{t('fournisseur.questionContact')} <a href="mailto:infos@busmoov.com" className="text-magenta hover:underline">infos@busmoov.com</a></p>
        </div>
      </div>
    </div>
  )
}
