import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Info, Phone, MapPin, Bus, Users, Calendar, Euro, Briefcase, MessageSquare, Loader2, Route } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useCreateOrUpdateVoyageInfo, useUpdateDossier } from '@/hooks/useSupabase'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete'
import { formatDate, formatDateTime, formatTime, formatPrice, getVehicleTypeLabel } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'
import type { Dossier, VoyageInfo, DossierWithRelations } from '@/types/database'

// Helper pour extraire le détail MAD du special_requests
function extractMadDetails(specialRequests: string | null | undefined): string {
  if (!specialRequests) return ''
  const match = specialRequests.match(/=== DÉTAIL MISE À DISPOSITION ===\n([\s\S]*?)\n==============================/)
  return match ? match[1].trim() : ''
}

// Helper pour reconstruire le special_requests avec le nouveau détail MAD
function updateMadDetailsInSpecialRequests(specialRequests: string | null | undefined, newMadDetails: string): string {
  if (!specialRequests) {
    return newMadDetails ? `=== DÉTAIL MISE À DISPOSITION ===\n${newMadDetails}\n==============================` : ''
  }

  // Remplacer le bloc MAD existant ou l'ajouter
  const madBlock = `=== DÉTAIL MISE À DISPOSITION ===\n${newMadDetails}\n==============================`
  if (specialRequests.includes('=== DÉTAIL MISE À DISPOSITION ===')) {
    return specialRequests.replace(
      /=== DÉTAIL MISE À DISPOSITION ===\n[\s\S]*?\n==============================/,
      madBlock
    )
  }
  return specialRequests + '\n\n' + madBlock
}

export function InfosVoyagePage() {
  const { t } = useTranslation()
  const localizedPath = useLocalizedPath()
  const [searchParams] = useSearchParams()
  const reference = searchParams.get('ref') || ''
  const email = searchParams.get('email') || ''

  const [dossier, setDossier] = useState<DossierWithRelations | null>(null)
  const [demande, setDemande] = useState<any>(null)
  const [voyageInfo, setVoyageInfo] = useState<Partial<VoyageInfo & { commentaires?: string; bagages?: string }>>({})
  const [madDetails, setMadDetails] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)

  const createOrUpdateVoyageInfo = useCreateOrUpdateVoyageInfo()
  const updateDossier = useUpdateDossier()

  useEffect(() => {
    loadDossier()
  }, [reference, email])

  const loadDossier = async () => {
    if (!reference || !email) return

    try {
      const { data: dossierData, error: dossierError } = await supabase
        .from('dossiers')
        .select(`
          *,
          voyage_info:voyage_infos(*),
          devis(*),
          demande:demandes(*)
        `)
        .eq('reference', reference)
        .eq('client_email', email.toLowerCase())
        .single()

      if (dossierError) throw dossierError

      const typedDossier = dossierData as unknown as DossierWithRelations
      setDossier(typedDossier)

      // Pre-fill form with existing data or dossier/demande defaults
      const existingInfo = typedDossier.voyage_info as VoyageInfo | null
      const demandeData = Array.isArray((dossierData as any).demande) ? (dossierData as any).demande[0] : (dossierData as any).demande
      setDemande(demandeData)

      // Construire la date+heure de départ depuis le dossier
      let allerDateTime = typedDossier.departure_date
      if (typedDossier.departure_time && typedDossier.departure_date) {
        // Si on a une heure séparée, la combiner avec la date
        const dateOnly = typedDossier.departure_date.split('T')[0]
        allerDateTime = `${dateOnly}T${typedDossier.departure_time}`
      } else if (demandeData?.departure_time && typedDossier.departure_date) {
        const dateOnly = typedDossier.departure_date.split('T')[0]
        allerDateTime = `${dateOnly}T${demandeData.departure_time}`
      }

      // Construire la date+heure de retour
      let retourDateTime = typedDossier.return_date
      if (typedDossier.return_time && typedDossier.return_date) {
        const dateOnly = typedDossier.return_date.split('T')[0]
        retourDateTime = `${dateOnly}T${typedDossier.return_time}`
      } else if (demandeData?.return_time && typedDossier.return_date) {
        const dateOnly = typedDossier.return_date.split('T')[0]
        retourDateTime = `${dateOnly}T${demandeData.return_time}`
      }

      // Récupérer les adresses précises du dossier ou de la demande
      const allerAdresseDepart = typedDossier.departure_address || demandeData?.departure_address || typedDossier.departure
      const allerAdresseArrivee = typedDossier.arrival_address || demandeData?.arrival_address || typedDossier.arrival
      const retourAdresseDepart = typedDossier.return_departure_address || demandeData?.return_departure_address || typedDossier.arrival
      const retourAdresseArrivee = typedDossier.return_arrival_address || demandeData?.return_arrival_address || typedDossier.departure

      setVoyageInfo({
        dossier_id: typedDossier.id,
        aller_date: existingInfo?.aller_date || allerDateTime,
        aller_passagers: existingInfo?.aller_passagers || typedDossier.passengers,
        aller_adresse_depart: existingInfo?.aller_adresse_depart || allerAdresseDepart,
        aller_adresse_arrivee: existingInfo?.aller_adresse_arrivee || allerAdresseArrivee,
        retour_date: existingInfo?.retour_date || retourDateTime,
        retour_passagers: existingInfo?.retour_passagers || typedDossier.passengers,
        retour_adresse_depart: existingInfo?.retour_adresse_depart || retourAdresseDepart,
        retour_adresse_arrivee: existingInfo?.retour_adresse_arrivee || retourAdresseArrivee,
        // Split nom/prénom : format habituel "Prénom Nom" ou "Prénom Nom1 Nom2"
        // Le premier mot est le prénom, le reste est le nom de famille
        contact_prenom: existingInfo?.contact_prenom || typedDossier.client_name?.split(' ')[0] || '',
        contact_nom: existingInfo?.contact_nom || typedDossier.client_name?.split(' ').slice(1).join(' ') || '',
        contact_tel: existingInfo?.contact_tel || typedDossier.client_phone || '',
        contact_email: existingInfo?.contact_email || typedDossier.client_email || '',
        commentaires: (existingInfo as any)?.commentaires || '',
      })

      // Initialiser le détail MAD depuis special_requests du dossier
      if (typedDossier.trip_mode === 'circuit') {
        const existingMadDetails = extractMadDetails(typedDossier.special_requests)
        setMadDetails(existingMadDetails)
      }
    } catch (err) {
      console.error('Error loading dossier:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!voyageInfo.aller_date || !voyageInfo.aller_adresse_depart || !voyageInfo.aller_adresse_arrivee) {
      alert(t('infosVoyage.alertFillOutward'))
      return
    }

    if (!voyageInfo.contact_nom || !voyageInfo.contact_tel) {
      alert(t('infosVoyage.alertFillContact'))
      return
    }

    try {
      // Extraire les heures des dates combinées
      const allerHeure = voyageInfo.aller_date ? new Date(voyageInfo.aller_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }) : null
      const retourHeure = voyageInfo.retour_date ? new Date(voyageInfo.retour_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }) : null

      // Save voyage info avec date de soumission client (en attente validation service)
      await createOrUpdateVoyageInfo.mutateAsync({
        ...voyageInfo,
        dossier_id: dossier!.id,
        aller_heure: allerHeure,
        retour_heure: retourHeure,
        client_validated_at: new Date().toISOString(), // Date de soumission par le client
        // validated_at et admin_validated_at restent null jusqu'à validation par le service client
      } as any)

      // Update dossier status - passe en "Infos VO reçues" (attente validation service)
      // Pour les circuits MAD, mettre à jour aussi le special_requests avec le détail modifié
      const updateData: any = {
        id: dossier!.id,
        status: 'pending-info-received',
      }

      if (dossier!.trip_mode === 'circuit' && madDetails) {
        updateData.special_requests = updateMadDetailsInSpecialRequests(dossier!.special_requests, madDetails)
      }

      await updateDossier.mutateAsync(updateData)

      // Créer une notification CRM pour le service client
      await (supabase as any)
        .from('notifications_crm')
        .insert({
          dossier_id: dossier!.id,
          dossier_reference: dossier!.reference,
          type: 'infos_voyage',
          title: `Infos voyage reçues`,
          description: `${dossier!.client_name} a soumis ses informations de voyage pour ${dossier!.departure} → ${dossier!.arrival}`,
          source_type: 'client',
          source_name: dossier!.client_name,
        })

      // Ajouter à la timeline
      await supabase.from('timeline').insert({
        dossier_id: dossier!.id,
        type: 'infos_voyage_submitted',
        content: `📋 Informations voyage soumises par ${dossier!.client_name}`,
      })

      setSuccess(true)
    } catch (err) {
      console.error('Error saving voyage info:', err)
      alert(t('infosVoyage.alertError'))
    }
  }

  const handleChange = (field: string, value: any) => {
    setVoyageInfo(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-magenta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('infosVoyage.loading')}</p>
        </div>
      </div>
    )
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-2">
            {t('infosVoyage.notFound')}
          </h2>
          <p className="text-gray-500 mb-6">
            {t('infosVoyage.notFoundDescription')}
          </p>
          <Link to={localizedPath('/')} className="btn btn-primary">
            {t('infosVoyage.backToHome')}
          </Link>
        </div>
      </div>
    )
  }

  // Vérifier si les infos ont déjà été soumises par le client
  const existingInfo = dossier?.voyage_info as any
  const isAlreadyValidated = existingInfo?.client_validated_at

  // Affichage en lecture seule si déjà validé
  if (success || isAlreadyValidated) {
    const info = existingInfo || voyageInfo
    const isAdminValidated = info?.validated_at // Validé par l'admin

    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 py-4 px-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to={localizedPath('/')} className="flex items-center gap-3">
              <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
              <span className="font-display text-xl font-bold gradient-text">Busmoov</span>
            </Link>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Success Banner */}
          <div className="card p-6 mb-6 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl flex-shrink-0">
                ✅
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-emerald-600 mb-1">
                  {success ? t('infosVoyage.successTitle') : t('infosVoyage.sentTitle')}
                </h2>
                <p className="text-gray-600 text-sm">
                  {isAdminValidated
                    ? t('infosVoyage.successDescriptionValidated')
                    : t('infosVoyage.successDescriptionPending')
                  }
                </p>
                {info?.client_validated_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('infosVoyage.sentOn')} {formatDateTime(info.client_validated_at)}
                    {isAdminValidated && ` • ${t('infosVoyage.validatedOn')} ${formatDateTime(info.validated_at)}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Statut */}
          <div className="flex justify-center mb-6">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              isAdminValidated
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {isAdminValidated ? `✓ ${t('infosVoyage.statusValidated')}` : `⏳ ${t('infosVoyage.statusPending')}`}
            </span>
          </div>

          {/* Infos voyage en lecture seule */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Aller */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-magenta mb-4 flex items-center gap-2">
                <MapPin size={20} />
                {t('infosVoyage.outward')}
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Calendar size={12} />
                    {t('infosVoyage.dateTime')}
                  </div>
                  <div className="font-medium text-gray-800">
                    {info?.aller_date ? formatDateTime(info.aller_date) : '-'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <Users size={12} />
                    {t('infosVoyage.passengers')}
                  </div>
                  <div className="font-medium text-gray-800">
                    {info?.aller_passagers || dossier?.passengers || '-'} {t('infosVoyage.passengersUnit')}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <MapPin size={12} className="text-green-500" />
                    {t('infosVoyage.pickupAddress')}
                  </div>
                  <div className="font-medium text-gray-800">
                    {info?.aller_adresse_depart || '-'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <MapPin size={12} className="text-red-500" />
                    {t('infosVoyage.destinationAddress')}
                  </div>
                  <div className="font-medium text-gray-800">
                    {info?.aller_adresse_arrivee || '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Retour */}
            {(info?.retour_date || dossier?.return_date) && (
              <div className="card p-6">
                <h3 className="font-display text-lg font-semibold text-magenta mb-4 flex items-center gap-2">
                  <MapPin size={20} />
                  {t('infosVoyage.return')}
                </h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Calendar size={12} />
                      {t('infosVoyage.dateTime')}
                    </div>
                    <div className="font-medium text-gray-800">
                      {info?.retour_date ? formatDateTime(info.retour_date) : '-'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Users size={12} />
                      {t('infosVoyage.passengers')}
                    </div>
                    <div className="font-medium text-gray-800">
                      {info?.retour_passagers || dossier?.passengers || '-'} {t('infosVoyage.passengersUnit')}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <MapPin size={12} className="text-green-500" />
                      {t('infosVoyage.pickupAddress')}
                    </div>
                    <div className="font-medium text-gray-800">
                      {info?.retour_adresse_depart || '-'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <MapPin size={12} className="text-red-500" />
                      {t('infosVoyage.destinationAddress')}
                    </div>
                    <div className="font-medium text-gray-800">
                      {info?.retour_adresse_arrivee || '-'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Contact sur place */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
                <Phone size={20} />
                {t('infosVoyage.contactOnSite')}
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{t('infosVoyage.lastName')}</div>
                  <div className="font-medium text-gray-800">
                    {info?.contact_prenom} {info?.contact_nom}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">{t('infosVoyage.phone')}</div>
                  <div className="font-medium text-gray-800">
                    {info?.contact_tel || '-'}
                  </div>
                </div>
                {info?.contact_email && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">{t('infosVoyage.email')}</div>
                    <div className="font-medium text-gray-800">
                      {info.contact_email}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Détail Mise à Disposition - pour circuits (lecture seule) */}
            {dossier?.trip_mode === 'circuit' && extractMadDetails(dossier?.special_requests) && (
              <div className="card p-6">
                <h3 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
                  <Route size={20} />
                  {t('infosVoyage.madDetail')}
                </h3>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="text-gray-800 whitespace-pre-wrap">
                    {extractMadDetails(dossier?.special_requests)}
                  </div>
                </div>
              </div>
            )}

            {/* Options & Commentaires */}
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold text-purple-dark mb-4 flex items-center gap-2">
                <MessageSquare size={20} />
                {t('infosVoyage.optionsBaggage')}
              </h3>
              <div className="space-y-4">
                {(info?.bagages || dossier?.luggage_type) && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Briefcase size={12} />
                      {t('infosVoyage.baggageType')}
                    </div>
                    <div className="font-medium text-gray-800">
                      {info?.bagages === 'leger' ? t('infosVoyage.baggageLight') :
                       info?.bagages === 'standard' ? t('infosVoyage.baggageStandardOption') :
                       info?.bagages === 'volumineux' ? t('infosVoyage.baggageHeavy') :
                       dossier?.luggage_type || '-'}
                    </div>
                  </div>
                )}
                {info?.commentaires && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">{t('infosVoyage.comments')}</div>
                    <div className="text-gray-800 whitespace-pre-wrap">
                      {info.commentaires}
                    </div>
                  </div>
                )}
                {!info?.commentaires && !info?.bagages && !dossier?.luggage_type && (
                  <p className="text-gray-500 text-sm italic">{t('infosVoyage.noOptionsComments')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bouton retour */}
          <div className="flex justify-center mt-8">
            <Link
              to={`${localizedPath('/mes-devis')}?ref=${reference}&email=${encodeURIComponent(email)}`}
              className="btn btn-primary"
            >
              <ArrowLeft size={18} />
              {t('infosVoyage.backToMyFolder')}
            </Link>
          </div>
        </div>

        {/* Chat Widget */}
        <ChatWidget dossierId={dossier!.id} isClient={true} countryCode={dossier?.country_code} />

        {/* Footer */}
        <footer className="text-center py-8 text-gray-500 text-sm">
          © {t('infosVoyage.footerYear')} {t('infosVoyage.footerBrand')}{' '}
          <a href="https://www.centrale-autocar.com" className="text-magenta hover:underline">
            Centrale Autocar
          </a>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to={localizedPath('/')} className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
            <span className="font-display text-xl font-bold gradient-text">Busmoov</span>
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <span className="badge badge-magenta mb-4">{t('infosVoyage.dossier')} {dossier.reference}</span>
          <h1 className="font-display text-2xl font-bold text-magenta mb-2">
            {t('infosVoyage.pageTitle')}
          </h1>
          <p className="text-gray-500">
            {t('infosVoyage.pageSubtitle')}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Info size={24} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong className="text-blue-600">{t('infosVoyage.howItWorksTitle')}</strong><br />
            {t('infosVoyage.howItWorksDescription')}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Colonne Devis Initial (lecture seule) */}
            <div className="card p-6 bg-gray-50">
              <h3 className="font-display text-lg font-semibold text-gray-600 mb-6 pb-4 border-b-2 border-gray-200 flex items-center gap-2">
                <Bus size={20} className="text-gray-500" />
                {t('infosVoyage.initialQuote')}
              </h3>

              <div className="space-y-6">
                {/* Récapitulatif tarif */}
                <div className="bg-gradient-to-br from-purple/5 to-magenta/10 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-purple-dark mb-3 flex items-center gap-2">
                    <Euro size={16} />
                    {t('infosVoyage.validatedPrice')}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('infosVoyage.priceTTC')}</span>
                      <span className="font-bold text-purple-dark text-xl">{formatPrice(dossier.price_ttc)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{t('infosVoyage.vehicle')}</span>
                      <span className="font-medium">{getVehicleTypeLabel(dossier.vehicle_type)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">{t('infosVoyage.passengers')}</span>
                      <span className="font-medium">{dossier.passengers} {t('infosVoyage.passengersUnit')}</span>
                    </div>
                  </div>
                </div>

                {/* Aller */}
                <div>
                  <h4 className="text-sm font-semibold text-magenta mb-3 flex items-center gap-2">
                    <MapPin size={16} />
                    {t('infosVoyage.outward')}
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Calendar size={12} />
                        {t('infosVoyage.departureDateTimeLabel')}
                      </div>
                      <div className="font-medium text-gray-800">
                        {formatDate(dossier.departure_date)}
                        {(dossier.departure_time || demande?.departure_time) && (
                          <span className="ml-2 text-magenta font-semibold">
                            {t('infosVoyage.at')} {dossier.departure_time || demande?.departure_time}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <MapPin size={12} className="text-green-500" />
                        {t('infosVoyage.departureLabel')}
                      </div>
                      <div className="font-medium text-gray-800">{dossier.departure}</div>
                      {(dossier.departure_address || demande?.departure_address) && (
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {dossier.departure_address || demande?.departure_address}
                        </div>
                      )}
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <MapPin size={12} className="text-red-500" />
                        {t('infosVoyage.arrivalLabel')}
                      </div>
                      <div className="font-medium text-gray-800">{dossier.arrival}</div>
                      {(dossier.arrival_address || demande?.arrival_address) && (
                        <div className="text-xs text-gray-500 mt-1">
                          📍 {dossier.arrival_address || demande?.arrival_address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Retour */}
                {dossier.return_date && (
                  <div>
                    <h4 className="text-sm font-semibold text-magenta mb-3 flex items-center gap-2">
                      <MapPin size={16} />
                      {t('infosVoyage.return')}
                    </h4>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <Calendar size={12} />
                          {t('infosVoyage.returnDateTimeLabel')}
                        </div>
                        <div className="font-medium text-gray-800">
                          {formatDate(dossier.return_date)}
                          {(dossier.return_time || demande?.return_time) && (
                            <span className="ml-2 text-magenta font-semibold">
                              {t('infosVoyage.at')} {dossier.return_time || demande?.return_time}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <MapPin size={12} className="text-green-500" />
                          {t('infosVoyage.departureLabel')}
                        </div>
                        <div className="font-medium text-gray-800">{dossier.arrival}</div>
                        {(dossier.return_departure_address || demande?.return_departure_address) && (
                          <div className="text-xs text-gray-500 mt-1">
                            📍 {dossier.return_departure_address || demande?.return_departure_address}
                          </div>
                        )}
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                          <MapPin size={12} className="text-red-500" />
                          {t('infosVoyage.arrivalLabel')}
                        </div>
                        <div className="font-medium text-gray-800">{dossier.departure}</div>
                        {(dossier.return_arrival_address || demande?.return_arrival_address) && (
                          <div className="text-xs text-gray-500 mt-1">
                            📍 {dossier.return_arrival_address || demande?.return_arrival_address}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Détail Mise à Disposition - pour circuits */}
                {dossier.trip_mode === 'circuit' && extractMadDetails(dossier.special_requests) && (
                  <div>
                    <h4 className="text-sm font-semibold text-magenta mb-3 flex items-center gap-2">
                      <Route size={16} />
                      {t('infosVoyage.madDetail')}
                    </h4>
                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                      <div className="text-sm text-purple-800 whitespace-pre-wrap">
                        {extractMadDetails(dossier.special_requests)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bagages / Options */}
                <div>
                  <h4 className="text-sm font-semibold text-magenta mb-3 flex items-center gap-2">
                    <Briefcase size={16} />
                    {t('infosVoyage.optionsBaggage')}
                  </h4>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-sm text-gray-600">
                      {dossier.luggage_type || t('infosVoyage.baggageStandard')}
                    </div>
                    {dossier.special_requests && !dossier.special_requests.includes('=== DÉTAIL MISE À DISPOSITION ===') && (
                      <div className="mt-2 text-sm text-gray-500 italic">
                        "{dossier.special_requests}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact client initial */}
                <div>
                  <h4 className="text-sm font-semibold text-magenta mb-3 flex items-center gap-2">
                    <Users size={16} />
                    {t('infosVoyage.client')}
                  </h4>
                  <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-1">
                    <div className="font-medium text-gray-800">{dossier.client_name}</div>
                    <div className="text-sm text-gray-500">{dossier.client_email}</div>
                    <div className="text-sm text-gray-500">{dossier.client_phone}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne Informations Finales (éditable) */}
            <div className="card p-6 border-2 border-magenta">
              <h3 className="font-display text-lg font-semibold text-magenta mb-6 pb-4 border-b-2 border-gray-200 flex items-center gap-2">
                <Check size={20} className="text-magenta" />
                {t('infosVoyage.finalInfo')}
              </h3>

              <div className="space-y-6">
                {/* Aller */}
                <div>
                  <h4 className="text-sm font-semibold text-purple-dark mb-3 flex items-center gap-2">
                    <MapPin size={16} />
                    {t('infosVoyage.outward')}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="label">{t('infosVoyage.departureDateTimeLabel')}</label>
                      <input
                        type="datetime-local"
                        value={voyageInfo.aller_date?.slice(0, 16) || ''}
                        onChange={(e) => handleChange('aller_date', e.target.value)}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">{t('infosVoyage.numberOfPassengers')}</label>
                      <input
                        type="number"
                        value={voyageInfo.aller_passagers || ''}
                        onChange={(e) => handleChange('aller_passagers', parseInt(e.target.value))}
                        className="input"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">
                        {t('infosVoyage.pickupAddress')} <span className="text-gray-400 font-normal">({t('infosVoyage.pickupAddressHint')})</span>
                      </label>
                      <AddressAutocomplete
                        value={voyageInfo.aller_adresse_depart || ''}
                        onChange={(value) => handleChange('aller_adresse_depart', value)}
                        placeholder={t('infosVoyage.pickupPlaceholder')}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="label">
                        {t('infosVoyage.destinationAddress')} <span className="text-gray-400 font-normal">({t('infosVoyage.destinationAddressHint')})</span>
                      </label>
                      <AddressAutocomplete
                        value={voyageInfo.aller_adresse_arrivee || ''}
                        onChange={(value) => handleChange('aller_adresse_arrivee', value)}
                        placeholder={t('infosVoyage.destinationPlaceholder')}
                        className="input"
                      />
                    </div>
                  </div>
                </div>

                {/* Retour */}
                {dossier.return_date && (
                  <div>
                    <h4 className="text-sm font-semibold text-purple-dark mb-3 flex items-center gap-2">
                      <MapPin size={16} />
                      {t('infosVoyage.return')}
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="label">{t('infosVoyage.returnDateTimeLabel')}</label>
                        <input
                          type="datetime-local"
                          value={voyageInfo.retour_date?.slice(0, 16) || ''}
                          onChange={(e) => handleChange('retour_date', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">{t('infosVoyage.numberOfPassengers')}</label>
                        <input
                          type="number"
                          value={voyageInfo.retour_passagers || ''}
                          onChange={(e) => handleChange('retour_passagers', parseInt(e.target.value))}
                          className="input"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="label">
                          {t('infosVoyage.pickupAddress')} <span className="text-gray-400 font-normal">({t('infosVoyage.pickupAddressHint')})</span>
                        </label>
                        <AddressAutocomplete
                          value={voyageInfo.retour_adresse_depart || ''}
                          onChange={(value) => handleChange('retour_adresse_depart', value)}
                          placeholder={t('infosVoyage.destinationPlaceholder')}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label">
                          {t('infosVoyage.destinationAddress')} <span className="text-gray-400 font-normal">({t('infosVoyage.destinationAddressHint')})</span>
                        </label>
                        <AddressAutocomplete
                          value={voyageInfo.retour_adresse_arrivee || ''}
                          onChange={(value) => handleChange('retour_adresse_arrivee', value)}
                          placeholder={t('infosVoyage.pickupPlaceholder')}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Détail Mise à Disposition - éditable pour circuits */}
                {dossier.trip_mode === 'circuit' && (
                  <div>
                    <h4 className="text-sm font-semibold text-purple-dark mb-3 flex items-center gap-2">
                      <Route size={16} />
                      {t('infosVoyage.madDetail')}
                    </h4>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <p className="text-xs text-purple-600 mb-3">
                        {t('infosVoyage.madEditHint')}
                      </p>
                      <textarea
                        value={madDetails}
                        onChange={(e) => setMadDetails(e.target.value)}
                        placeholder={t('infosVoyage.madPlaceholder')}
                        className="input min-h-[180px] text-sm resize-y"
                        rows={8}
                      />
                    </div>
                  </div>
                )}

                {/* Contact sur place */}
                <div>
                  <h4 className="text-sm font-semibold text-purple-dark mb-3 flex items-center gap-2">
                    <Phone size={16} />
                    {t('infosVoyage.contactOnSite')}
                  </h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="label">{t('infosVoyage.lastName')}</label>
                        <input
                          type="text"
                          value={voyageInfo.contact_nom || ''}
                          onChange={(e) => handleChange('contact_nom', e.target.value)}
                          className="input"
                          placeholder={t('infosVoyage.lastName')}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">{t('infosVoyage.firstName')}</label>
                        <input
                          type="text"
                          value={voyageInfo.contact_prenom || ''}
                          onChange={(e) => handleChange('contact_prenom', e.target.value)}
                          className="input"
                          placeholder={t('infosVoyage.firstName')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">{t('infosVoyage.phone')}</label>
                      <input
                        type="tel"
                        value={voyageInfo.contact_tel || ''}
                        onChange={(e) => handleChange('contact_tel', e.target.value)}
                        className="input"
                        placeholder={t('infosVoyage.phonePlaceholder')}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Options & Bagages */}
                <div>
                  <h4 className="text-sm font-semibold text-purple-dark mb-3 flex items-center gap-2">
                    <Briefcase size={16} />
                    {t('infosVoyage.optionsBaggage')}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="label">{t('infosVoyage.baggageType')}</label>
                      <select
                        value={voyageInfo.bagages || dossier.luggage_type || 'leger'}
                        onChange={(e) => handleChange('bagages', e.target.value)}
                        className="input"
                      >
                        <option value="leger">{t('infosVoyage.baggageLight')}</option>
                        <option value="standard">{t('infosVoyage.baggageStandardOption')}</option>
                        <option value="volumineux">{t('infosVoyage.baggageHeavy')}</option>
                      </select>
                    </div>
                    {dossier.special_requests && !dossier.special_requests.includes('=== DÉTAIL MISE À DISPOSITION ===') && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <label className="label text-xs text-gray-500">{t('infosVoyage.initialRequest')}</label>
                        <p className="text-sm text-gray-600 italic">"{dossier.special_requests}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Commentaires */}
                <div>
                  <h4 className="text-sm font-semibold text-purple-dark mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />
                    {t('infosVoyage.comments')}
                  </h4>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                    <p className="text-xs text-amber-700">
                      {t('infosVoyage.commentsHint')}
                    </p>
                  </div>
                  <textarea
                    value={voyageInfo.commentaires || ''}
                    onChange={(e) => handleChange('commentaires', e.target.value)}
                    className="input min-h-[120px] resize-y"
                    placeholder={t('infosVoyage.commentsPlaceholder')}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <Link
              to={`${localizedPath('/mes-devis')}?ref=${reference}&email=${encodeURIComponent(email)}`}
              className="btn btn-secondary"
            >
              <ArrowLeft size={18} />
              {t('infosVoyage.back')}
            </Link>
            <button
              type="submit"
              className="btn btn-success"
              disabled={createOrUpdateVoyageInfo.isPending}
            >
              <Check size={18} />
              {createOrUpdateVoyageInfo.isPending ? t('infosVoyage.validating') : t('infosVoyage.validateInfo')}
            </button>
          </div>
        </form>
      </div>

      {/* Chat Widget */}
      <ChatWidget dossierId={dossier.id} isClient={true} countryCode={dossier?.country_code} />

      {/* Footer */}
      <footer className="text-center py-8 text-gray-500 text-sm">
        © {t('infosVoyage.footerYear')} {t('infosVoyage.footerBrand')}{' '}
        <a href="https://www.centrale-autocar.com" className="text-magenta hover:underline">
          Centrale Autocar
        </a>
      </footer>
    </div>
  )
}
