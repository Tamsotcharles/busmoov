import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2, Calendar, MapPin, Users, Euro, FileText, Route } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, formatPrice } from '@/lib/utils'

interface DossierInfo {
  id: string
  reference: string
  departure: string
  arrival: string
  departure_date: string
  departure_time: string | null
  return_date: string | null
  return_time: string | null
  passengers: number
  service_type: string | null
  nb_vehicles: number | null
  nb_chauffeurs: number | null
  duree_jours: number | null
  detail_mad: string | null
  transporteur_name: string | null
  transporteur_id: string | null
  prix_achat: number | null
  marge_percent: number | null
  price_ht: number | null
}

export function ValidationBpaPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const demandeId = searchParams.get('demande') || ''

  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [alreadyValidated, setAlreadyValidated] = useState(false)
  const [dossierInfo, setDossierInfo] = useState<DossierInfo | null>(null)

  useEffect(() => {
    validateToken()
  }, [token, demandeId])

  const validateToken = async () => {
    if (!token || !demandeId) {
      setError('Lien invalide. Veuillez contacter Busmoov.')
      setLoading(false)
      return
    }

    try {
      // Vérifier que la demande fournisseur existe et récupérer les infos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: demande, error: demandeError } = await (supabase as any)
        .from('demandes_fournisseurs')
        .select(`
          id,
          status,
          prix_propose,
          marge_percent,
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
            price_ht,
            devis (
              service_type,
              nombre_cars,
              nombre_chauffeurs,
              duree_jours,
              detail_mad,
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
        setError('Demande introuvable. Ce lien peut avoir expiré.')
        setLoading(false)
        return
      }

      // Vérifier le token de validation
      if ((demande as any).validation_token !== token) {
        setError('Lien de validation invalide.')
        setLoading(false)
        return
      }

      // Vérifier si déjà validé
      if ((demande as any).status === 'bpa_received') {
        setAlreadyValidated(true)
      }

      // Extraire les infos du dossier
      const dossier = Array.isArray((demande as any).dossier) ? (demande as any).dossier[0] : (demande as any).dossier
      const transporteur = Array.isArray((demande as any).transporteur) ? (demande as any).transporteur[0] : (demande as any).transporteur

      if (dossier) {
        // Récupérer le devis accepté ou le premier devis disponible
        const devisArray = dossier.devis || []
        const devisAccepte = devisArray.find((d: any) => d.status === 'accepted') || devisArray[0]

        setDossierInfo({
          id: dossier.id,
          reference: dossier.reference,
          departure: dossier.departure,
          arrival: dossier.arrival,
          departure_date: dossier.departure_date,
          departure_time: dossier.departure_time,
          return_date: dossier.return_date,
          return_time: dossier.return_time,
          passengers: dossier.passengers,
          service_type: devisAccepte?.service_type || null,
          nb_vehicles: devisAccepte?.nombre_cars || null,
          nb_chauffeurs: devisAccepte?.nombre_chauffeurs || null,
          duree_jours: devisAccepte?.duree_jours || null,
          detail_mad: devisAccepte?.detail_mad || null,
          transporteur_name: transporteur?.name || null,
          transporteur_id: (demande as any).transporteur_id || transporteur?.id || null,
          prix_achat: (demande as any).prix_propose,
          marge_percent: (demande as any).marge_percent,
          price_ht: dossier.price_ht,
        })
      }

      setLoading(false)
    } catch (err) {
      console.error('Error validating token:', err)
      setError('Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  const handleValidate = async () => {
    if (!demandeId || !token) return

    setValidating(true)

    try {
      // Mettre à jour le statut de la demande fournisseur
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('demandes_fournisseurs')
        .update({
          status: 'bpa_received',
          bpa_received_at: new Date().toISOString(),
        })
        .eq('id', demandeId)
        .eq('validation_token', token)

      if (updateError) throw updateError

      // Mettre à jour le dossier avec les infos définitives (prix achat, transporteur)
      if (dossierInfo) {
        // Convertir le prix TTC en HT (prix_achat dans le dossier est en HT)
        // prix_propose du transporteur est en TTC, on divise par 1.1 pour obtenir le HT
        const prixAchatHT = dossierInfo.prix_achat
          ? Math.round((dossierInfo.prix_achat / 1.1) * 100) / 100
          : null

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('dossiers')
          .update({
            status: 'bpa-received',
            price_achat: prixAchatHT,
            transporteur_id: dossierInfo.transporteur_id,
          })
          .eq('id', dossierInfo.id)

        // Construire le message timeline avec les détails financiers
        let timelineContent = `BPA reçu de ${dossierInfo.transporteur_name || 'fournisseur'} - Validation en ligne.`
        if (dossierInfo.prix_achat) {
          // dossierInfo.prix_achat est en TTC (prix_propose du transporteur)
          timelineContent += ` Prix d'achat : ${dossierInfo.prix_achat.toFixed(2).replace('.', ',')} € TTC`
          if (prixAchatHT) {
            timelineContent += ` (${prixAchatHT.toFixed(2).replace('.', ',')} € HT).`
          } else {
            timelineContent += `.`
          }
        }
        timelineContent += ` Dossier confirmé côté transporteur.`

        // Ajouter une entrée dans la timeline du dossier
        await supabase
          .from('timeline')
          .insert({
            dossier_id: dossierInfo.id,
            type: 'note',
            content: timelineContent,
          })
      }

      setSuccess(true)
    } catch (err) {
      console.error('Error validating BPA:', err)
      setError('Une erreur est survenue lors de la validation.')
    } finally {
      setValidating(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-magenta mx-auto mb-4" />
          <p className="text-gray-500">Vérification en cours...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle size={40} className="text-red-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-red-600 mb-2">
              Erreur
            </h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <a href="mailto:infos@busmoov.com" className="btn btn-primary">
              Contacter Busmoov
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Already validated state
  if (alreadyValidated) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-4xl">
              <CheckCircle size={40} />
            </div>
            <h2 className="font-display text-2xl font-bold text-emerald-600 mb-2">
              Déjà validé
            </h2>
            <p className="text-gray-500 mb-6">
              Cette commande a déjà été confirmée. Merci de votre collaboration !
            </p>
            {dossierInfo && (
              <div className="text-sm text-gray-500">
                Référence : <span className="font-semibold">{dossierInfo.reference}</span>
              </div>
            )}
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
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white">
              <CheckCircle size={40} />
            </div>
            <h2 className="font-display text-2xl font-bold text-emerald-600 mb-2">
              Commande confirmée !
            </h2>
            <p className="text-gray-500 mb-6">
              Merci ! Votre confirmation a bien été enregistrée. L'équipe Busmoov va prendre le relais.
            </p>
            {dossierInfo && (
              <div className="p-4 bg-gray-50 rounded-lg text-sm text-left space-y-2">
                <p><span className="text-gray-500">Référence :</span> <span className="font-semibold">{dossierInfo.reference}</span></p>
                <p><span className="text-gray-500">Trajet :</span> {dossierInfo.departure} → {dossierInfo.arrival}</p>
                <p><span className="text-gray-500">Date :</span> {formatDate(dossierInfo.departure_date)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Main validation form
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
            <span className="font-display text-xl font-bold gradient-text">Busmoov</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-purple-dark">
            Confirmation de commande
          </h1>
          <p className="text-gray-500 mt-2">
            Validez votre Bon Pour Accord (BPA) en un clic
          </p>
        </div>

        {/* Dossier info card */}
        {dossierInfo && (
          <div className="card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-magenta to-purple flex items-center justify-center">
                <FileText size={20} className="text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-purple-dark">Dossier {dossierInfo.reference}</h2>
                {dossierInfo.transporteur_name && (
                  <p className="text-sm text-gray-500">Pour : {dossierInfo.transporteur_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {/* Type de trajet */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Route size={18} className="text-magenta mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Type de prestation</p>
                  <p className="font-medium">
                    {dossierInfo.service_type === 'aller_simple' && 'Aller simple'}
                    {dossierInfo.service_type === 'aller_retour' && 'Aller-Retour'}
                    {(dossierInfo.service_type === 'circuit' || dossierInfo.service_type === 'mise_disposition' || dossierInfo.service_type === 'ar_mad') && 'Mise à disposition'}
                    {!dossierInfo.service_type && (dossierInfo.return_date ? 'Aller-Retour' : 'Aller simple')}
                  </p>
                </div>
              </div>

              {/* Trajet */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin size={18} className="text-magenta mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Trajet</p>
                  <p className="font-medium">{dossierInfo.departure} → {dossierInfo.arrival}</p>
                </div>
              </div>

              {/* Date aller */}
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar size={18} className="text-magenta mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {(dossierInfo.service_type === 'circuit' || dossierInfo.service_type === 'mise_disposition' || dossierInfo.service_type === 'ar_mad')
                      ? 'Date début'
                      : 'Date aller'}
                  </p>
                  <p className="font-medium">
                    {formatDate(dossierInfo.departure_date)}
                    {dossierInfo.departure_time && ` à ${dossierInfo.departure_time}`}
                  </p>
                </div>
              </div>

              {/* Date retour / fin */}
              {dossierInfo.return_date && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar size={18} className="text-magenta mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">
                      {(dossierInfo.service_type === 'circuit' || dossierInfo.service_type === 'mise_disposition' || dossierInfo.service_type === 'ar_mad')
                        ? 'Date fin'
                        : 'Date retour'}
                    </p>
                    <p className="font-medium">
                      {formatDate(dossierInfo.return_date)}
                      {dossierInfo.return_time && ` à ${dossierInfo.return_time}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Durée (pour mise à disposition) */}
              {dossierInfo.duree_jours && dossierInfo.duree_jours > 0 && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar size={18} className="text-magenta mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Durée</p>
                    <p className="font-medium">{dossierInfo.duree_jours} jour{dossierInfo.duree_jours > 1 ? 's' : ''}</p>
                  </div>
                </div>
              )}

              {/* Détail mise à disposition */}
              {dossierInfo.detail_mad && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <Route size={18} className="text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-600 uppercase tracking-wide">Détail mise à disposition</p>
                    <p className="font-medium text-amber-800">{dossierInfo.detail_mad}</p>
                  </div>
                </div>
              )}

              {/* Passagers, Véhicules, Chauffeurs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <Users size={16} className="text-magenta mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Passagers</p>
                    <p className="font-medium">{dossierInfo.passengers}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Véhicules</p>
                    <p className="font-medium">{dossierInfo.nb_vehicles || 1}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Chauffeurs</p>
                    <p className="font-medium">{dossierInfo.nb_chauffeurs || 1}</p>
                  </div>
                </div>
              </div>

              {/* Prix */}
              {dossierInfo.prix_achat && (
                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-purple-50 to-magenta-50 rounded-lg border border-purple-100">
                  <Euro size={18} className="text-magenta mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Montant convenu</p>
                    <p className="font-bold text-lg text-purple-dark">{formatPrice(dossierInfo.prix_achat)} TTC</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Validation button */}
        <div className="card p-6">
          <p className="text-sm text-gray-600 mb-4">
            En cliquant sur le bouton ci-dessous, vous confirmez accepter cette commande aux conditions indiquées.
          </p>

          <button
            onClick={handleValidate}
            disabled={validating}
            className="w-full btn btn-primary btn-lg flex items-center justify-center gap-2"
          >
            {validating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Validation en cours...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Je confirme la commande (BPA)
              </>
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            Une confirmation vous sera envoyée par email.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Besoin d'aide ? Contactez-nous à <a href="mailto:infos@busmoov.com" className="text-magenta hover:underline">infos@busmoov.com</a></p>
        </div>
      </div>
    </div>
  )
}
