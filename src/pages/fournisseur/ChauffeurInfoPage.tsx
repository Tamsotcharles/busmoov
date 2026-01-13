import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Truck,
  Calendar,
  MapPin,
  Users,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  User,
  Car,
  Clock,
  Briefcase,
  MessageSquare
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSaveVehiculesEtChauffeurs } from '@/hooks/useSupabase'
import { formatDate, formatDateTime } from '@/lib/utils'
import { generateFeuilleRoutePDFBase64 } from '@/lib/pdf'
import { useTranslation } from 'react-i18next'

interface VehiculeForm {
  id: string
  immatriculation: string
  chauffeurs: ChauffeurForm[]
}

interface ChauffeurForm {
  id: string
  nom: string
  tel: string
  role: 'principal' | 'secondaire' | 'relais'
}

interface DemandeChauffeurData {
  id: string
  dossier_id: string
  transporteur_id: string
  type: 'aller' | 'retour' | 'aller_retour'
  token: string
  status: string | null
  dossier: {
    id: string
    reference: string
    client_name: string
    departure: string
    arrival: string
    departure_date: string
    return_date: string | null
    passengers: number
  }
  transporteur: {
    id: string
    name: string
    email: string | null
    astreinte_tel: string | null
  }
  voyage_info: {
    aller_date: string | null
    aller_heure: string | null
    aller_adresse_depart: string | null
    aller_adresse_arrivee: string | null
    aller_passagers: number | null
    retour_date: string | null
    retour_heure: string | null
    retour_adresse_depart: string | null
    retour_adresse_arrivee: string | null
    retour_passagers: number | null
    contact_nom: string | null
    contact_prenom: string | null
    contact_tel: string | null
    commentaires: string | null
  } | null
  luggage_type: string | null
}

// Générer un ID unique
const generateId = () => Math.random().toString(36).substr(2, 9)

// Créer un véhicule vide
const createEmptyVehicule = (): VehiculeForm => ({
  id: generateId(),
  immatriculation: '',
  chauffeurs: [createEmptyChauffeur()],
})

// Créer un chauffeur vide
const createEmptyChauffeur = (): ChauffeurForm => ({
  id: generateId(),
  nom: '',
  tel: '',
  role: 'principal',
})

export function ChauffeurInfoPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [demande, setDemande] = useState<DemandeChauffeurData | null>(null)
  const [success, setSuccess] = useState(false)

  // Formulaire
  const [astreinteTel, setAstreinteTel] = useState('')
  const [vehiculesAller, setVehiculesAller] = useState<VehiculeForm[]>([createEmptyVehicule()])
  const [vehiculesRetour, setVehiculesRetour] = useState<VehiculeForm[]>([createEmptyVehicule()])

  const saveVehicules = useSaveVehiculesEtChauffeurs()

  // Charger les données de la demande
  useEffect(() => {
    const loadDemande = async () => {
      if (!token) {
        setError(t('fournisseur.missingToken'))
        setLoading(false)
        return
      }

      try {
        // Récupérer la demande avec le token
        const { data: demandeData, error: demandeError } = await supabase
          .from('demandes_chauffeur')
          .select('*')
          .eq('token', token)
          .single()

        if (demandeError || !demandeData) {
          setError(t('fournisseur.requestNotFoundExpired'))
          setLoading(false)
          return
        }

        // Vérifier si déjà traité
        if (demandeData.status === 'received') {
          setError(t('fournisseur.requestAlreadyProcessed'))
          setLoading(false)
          return
        }

        // Vérifier expiration
        if (demandeData.expires_at && new Date(demandeData.expires_at) < new Date()) {
          setError(t('fournisseur.requestExpired'))
          setLoading(false)
          return
        }

        // Vérifier que dossier_id et transporteur_id existent
        if (!demandeData.dossier_id || !demandeData.transporteur_id) {
          setError(t('fournisseur.incompleteRequestData'))
          setLoading(false)
          return
        }

        const dossierId = demandeData.dossier_id
        const transporteurId = demandeData.transporteur_id

        // Récupérer le dossier
        const { data: dossierData, error: dossierError } = await supabase
          .from('dossiers')
          .select('id, reference, client_name, departure, arrival, departure_date, return_date, passengers, luggage_type')
          .eq('id', dossierId)
          .single()

        if (dossierError || !dossierData) {
          setError(t('fournisseur.dossierNotFound'))
          setLoading(false)
          return
        }

        // Récupérer le transporteur
        const { data: transporteurData } = await supabase
          .from('transporteurs')
          .select('id, name, email, astreinte_tel')
          .eq('id', transporteurId)
          .single()

        // Récupérer les infos voyage
        const { data: voyageInfoData } = await supabase
          .from('voyage_infos')
          .select('*')
          .eq('dossier_id', dossierId)
          .single()

        setDemande({
          ...demandeData as { id: string; dossier_id: string; transporteur_id: string; type: string; token: string; status: string | null },
          dossier_id: dossierId,
          transporteur_id: transporteurId,
          type: demandeData.type as 'aller' | 'retour' | 'aller_retour',
          dossier: dossierData,
          transporteur: transporteurData || { id: '', name: '', email: null, astreinte_tel: null },
          voyage_info: voyageInfoData,
          luggage_type: dossierData.luggage_type,
        })

        // Pré-remplir l'astreinte si disponible
        if (transporteurData?.astreinte_tel) {
          setAstreinteTel(transporteurData.astreinte_tel)
        }

        setLoading(false)
      } catch (err) {
        console.error('Erreur chargement demande:', err)
        setError(t('fournisseur.errorOccurred'))
        setLoading(false)
      }
    }

    loadDemande()
  }, [token, t])

  // Ajouter un véhicule
  const addVehicule = (type: 'aller' | 'retour') => {
    if (type === 'aller') {
      setVehiculesAller([...vehiculesAller, createEmptyVehicule()])
    } else {
      setVehiculesRetour([...vehiculesRetour, createEmptyVehicule()])
    }
  }

  // Supprimer un véhicule
  const removeVehicule = (type: 'aller' | 'retour', vehiculeId: string) => {
    if (type === 'aller') {
      if (vehiculesAller.length > 1) {
        setVehiculesAller(vehiculesAller.filter(v => v.id !== vehiculeId))
      }
    } else {
      if (vehiculesRetour.length > 1) {
        setVehiculesRetour(vehiculesRetour.filter(v => v.id !== vehiculeId))
      }
    }
  }

  // Mettre à jour un véhicule
  const updateVehicule = (type: 'aller' | 'retour', vehiculeId: string, field: string, value: string) => {
    const updateFn = (vehicules: VehiculeForm[]) =>
      vehicules.map(v => v.id === vehiculeId ? { ...v, [field]: value } : v)

    if (type === 'aller') {
      setVehiculesAller(updateFn(vehiculesAller))
    } else {
      setVehiculesRetour(updateFn(vehiculesRetour))
    }
  }

  // Ajouter un chauffeur à un véhicule
  const addChauffeur = (type: 'aller' | 'retour', vehiculeId: string) => {
    const updateFn = (vehicules: VehiculeForm[]) =>
      vehicules.map(v =>
        v.id === vehiculeId
          ? { ...v, chauffeurs: [...v.chauffeurs, createEmptyChauffeur()] }
          : v
      )

    if (type === 'aller') {
      setVehiculesAller(updateFn(vehiculesAller))
    } else {
      setVehiculesRetour(updateFn(vehiculesRetour))
    }
  }

  // Supprimer un chauffeur
  const removeChauffeur = (type: 'aller' | 'retour', vehiculeId: string, chauffeurId: string) => {
    const updateFn = (vehicules: VehiculeForm[]) =>
      vehicules.map(v =>
        v.id === vehiculeId && v.chauffeurs.length > 1
          ? { ...v, chauffeurs: v.chauffeurs.filter(c => c.id !== chauffeurId) }
          : v
      )

    if (type === 'aller') {
      setVehiculesAller(updateFn(vehiculesAller))
    } else {
      setVehiculesRetour(updateFn(vehiculesRetour))
    }
  }

  // Mettre à jour un chauffeur
  const updateChauffeur = (
    type: 'aller' | 'retour',
    vehiculeId: string,
    chauffeurId: string,
    field: string,
    value: string
  ) => {
    const updateFn = (vehicules: VehiculeForm[]) =>
      vehicules.map(v =>
        v.id === vehiculeId
          ? {
              ...v,
              chauffeurs: v.chauffeurs.map(c =>
                c.id === chauffeurId ? { ...c, [field]: value } : c
              )
            }
          : v
      )

    if (type === 'aller') {
      setVehiculesAller(updateFn(vehiculesAller))
    } else {
      setVehiculesRetour(updateFn(vehiculesRetour))
    }
  }

  // Valider le formulaire
  const validateForm = (): boolean => {
    if (!demande) return false

    // Conditions basées sur l'affichage réel des formulaires
    const hasAllerForm = demande.type === 'aller' || demande.type === 'aller_retour'
    const hasRetourForm = (demande.type === 'retour' || demande.type === 'aller_retour') &&
                          (demande.voyage_info?.retour_date || demande.dossier.return_date)

    // Vérifier qu'il y a au moins un chauffeur avec un nom pour chaque trajet affiché
    if (hasAllerForm) {
      const hasValidAllerChauffeur = vehiculesAller.some(v =>
        v.chauffeurs.some(c => c.nom.trim() !== '')
      )
      if (!hasValidAllerChauffeur) return false
    }

    if (hasRetourForm) {
      const hasValidRetourChauffeur = vehiculesRetour.some(v =>
        v.chauffeurs.some(c => c.nom.trim() !== '')
      )
      if (!hasValidRetourChauffeur) return false
    }

    return true
  }

  // Soumettre le formulaire
  const handleSubmit = async () => {
    if (!demande || !validateForm()) return

    try {
      // Vérifier l'existence réelle d'un aller et retour basé sur les dates
      const hasAller = demande.type === 'aller' || demande.type === 'aller_retour'
      const hasRetourDate = !!(demande.voyage_info?.retour_date || demande.dossier.return_date)
      const hasRetour = (demande.type === 'retour' || demande.type === 'aller_retour') && hasRetourDate

      // Récupérer les chauffeurs principaux
      const chauffeurAllerPrincipal = hasAller
        ? vehiculesAller[0]?.chauffeurs?.find(c => c.role === 'principal' && c.nom.trim()) || vehiculesAller[0]?.chauffeurs?.find(c => c.nom.trim())
        : null
      const chauffeurRetourPrincipal = hasRetour
        ? vehiculesRetour[0]?.chauffeurs?.find(c => c.role === 'principal' && c.nom.trim()) || vehiculesRetour[0]?.chauffeurs?.find(c => c.nom.trim())
        : null

      await saveVehicules.mutateAsync({
        dossierId: demande.dossier.id,
        demandeChauffeurId: demande.id,
        astreinteTel: astreinteTel || undefined,
        vehiculesAller: hasAller ? vehiculesAller.map(v => ({
          immatriculation: v.immatriculation || undefined,
          chauffeurs: v.chauffeurs
            .filter(c => c.nom.trim() !== '')
            .map(c => ({
              nom: c.nom,
              tel: c.tel || undefined,
              role: c.role,
            })),
        })).filter(v => v.chauffeurs.length > 0) : undefined,
        vehiculesRetour: hasRetour ? vehiculesRetour.map(v => ({
          immatriculation: v.immatriculation || undefined,
          chauffeurs: v.chauffeurs
            .filter(c => c.nom.trim() !== '')
            .map(c => ({
              nom: c.nom,
              tel: c.tel || undefined,
              role: c.role,
            })),
        })).filter(v => v.chauffeurs.length > 0) : undefined,
      })

      // Récupérer l'email du client depuis le dossier complet
      const { data: dossierData } = await supabase
        .from('dossiers')
        .select('client_email, client_name, client_phone, luggage_type, country_code')
        .eq('id', demande.dossier.id)
        .single()

      // Envoyer automatiquement la feuille de route au client
      if (dossierData?.client_email) {
        try {
          // Préparer les données pour le PDF
          // Déterminer le type réel basé sur l'existence des dates
          const pdfType = hasAller && hasRetour ? 'aller_retour' : hasAller ? 'aller' : 'retour'

          const pdfData = {
            reference: demande.dossier.reference,
            dossier_reference: demande.dossier.reference,
            client_name: dossierData.client_name || demande.dossier.client_name,
            client_phone: dossierData.client_phone || '',
            type: pdfType as 'aller' | 'retour' | 'aller_retour',
            aller_date: demande.voyage_info?.aller_date || demande.dossier.departure_date,
            aller_heure: demande.voyage_info?.aller_heure || '',
            aller_adresse_depart: demande.voyage_info?.aller_adresse_depart || demande.dossier.departure,
            aller_adresse_arrivee: demande.voyage_info?.aller_adresse_arrivee || demande.dossier.arrival,
            aller_passagers: demande.voyage_info?.aller_passagers || demande.dossier.passengers,
            retour_date: demande.voyage_info?.retour_date || demande.dossier.return_date,
            retour_heure: demande.voyage_info?.retour_heure || '',
            retour_adresse_depart: demande.voyage_info?.retour_adresse_depart || '',
            retour_adresse_arrivee: demande.voyage_info?.retour_adresse_arrivee || '',
            retour_passagers: demande.voyage_info?.retour_passagers || demande.dossier.passengers,
            transporteur_nom: demande.transporteur.name,
            astreinte_tel: astreinteTel || demande.transporteur.astreinte_tel || '',
            chauffeur_aller_nom: chauffeurAllerPrincipal?.nom || '',
            chauffeur_aller_tel: chauffeurAllerPrincipal?.tel || '',
            chauffeur_aller_immatriculation: vehiculesAller[0]?.immatriculation || '',
            chauffeur_retour_nom: chauffeurRetourPrincipal?.nom || '',
            chauffeur_retour_tel: chauffeurRetourPrincipal?.tel || '',
            chauffeur_retour_immatriculation: vehiculesRetour[0]?.immatriculation || '',
            contact_nom: (demande.voyage_info as any)?.contact_nom || '',
            contact_prenom: (demande.voyage_info as any)?.contact_prenom || '',
            contact_tel: (demande.voyage_info as any)?.contact_tel || '',
            commentaires: (demande.voyage_info as any)?.commentaires || '',
            luggage_type: dossierData.luggage_type,
          }

          // Générer le PDF avec la langue appropriée selon le pays du dossier
          const countryCode = dossierData.country_code || 'FR'
          const pdfLang = countryCode === 'DE' ? 'de' : countryCode === 'ES' ? 'es' : countryCode === 'GB' ? 'en' : 'fr'
          const { base64: pdfBase64, filename: pdfFilename } = await generateFeuilleRoutePDFBase64(pdfData, pdfLang)

          // Envoyer l'email avec le PDF
          const dateFormatted = formatDate(demande.voyage_info?.aller_date || demande.dossier.departure_date)
          const emailBody = `Bonjour ${dossierData.client_name || ''},

Votre voyage est confirmé ! Veuillez trouver ci-joint votre feuille de route avec toutes les informations nécessaires pour votre déplacement.

Récapitulatif :
- Référence : ${demande.dossier.reference}
- Date : ${dateFormatted}
- Trajet : ${demande.voyage_info?.aller_adresse_depart || demande.dossier.departure} → ${demande.voyage_info?.aller_adresse_arrivee || demande.dossier.arrival}
- Chauffeur : ${chauffeurAllerPrincipal?.nom || 'Non communiqué'}
- Téléphone chauffeur : ${chauffeurAllerPrincipal?.tel || 'Non communiqué'}

Vous pouvez également consulter votre feuille de route à tout moment depuis votre espace client.

Bon voyage !
L'équipe Busmoov`

          await supabase.functions.invoke('send-email', {
            body: {
              type: 'custom',
              to: dossierData.client_email,
              subject: `Feuille de route - ${demande.dossier.reference}`,
              html_content: emailBody.replace(/\n/g, '<br>'),
              data: {
                dossier_id: demande.dossier.id,
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

          // Marquer la feuille de route comme envoyée
          await supabase
            .from('voyage_infos')
            .update({ feuille_route_envoyee_at: new Date().toISOString() })
            .eq('dossier_id', demande.dossier.id)

          // Ajouter à la timeline
          await supabase.from('timeline').insert({
            dossier_id: demande.dossier.id,
            type: 'feuille_route',
            content: `📄 Feuille de route envoyée automatiquement au client (${dossierData.client_email})`,
          })

          console.log('Feuille de route envoyée automatiquement au client')
        } catch (emailErr) {
          console.error('Erreur envoi feuille de route:', emailErr)
          // On ne bloque pas si l'email échoue
        }
      }

      // Créer une notification CRM pour le service client
      const allVehicules = [...vehiculesAller, ...vehiculesRetour]
      const chauffeurPrincipal = vehiculesAller[0]?.chauffeurs?.find((c: ChauffeurForm) => c.role === 'principal') || vehiculesAller[0]?.chauffeurs?.[0]
      await (supabase as any)
        .from('notifications_crm')
        .insert({
          dossier_id: demande.dossier.id,
          dossier_reference: demande.dossier.reference,
          type: 'contact_chauffeur',
          title: `Contact chauffeur reçu`,
          description: `${demande.transporteur.name} a transmis les infos chauffeur${chauffeurPrincipal ? ` (${chauffeurPrincipal.nom})` : ''} pour ${demande.dossier.departure} → ${demande.dossier.arrival}`,
          source_type: 'transporteur',
          source_name: demande.transporteur.name,
          source_id: demande.transporteur.id,
          metadata: {
            nb_vehicules: allVehicules.length,
            chauffeur_principal: chauffeurPrincipal?.nom,
            chauffeur_tel: chauffeurPrincipal?.tel
          }
        })

      setSuccess(true)
    } catch (err) {
      console.error('Erreur soumission:', err)
      alert(t('fournisseur.saveError'))
    }
  }

  // États de chargement/erreur/succès
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{t('fournisseur.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('fournisseur.error')}</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('fournisseur.thankYou')}</h1>
          <p className="text-gray-600 mb-4">
            {t('fournisseur.driverInfoSaved')}
          </p>
          <p className="text-sm text-gray-500">
            {t('fournisseur.canClosePage')}
          </p>
        </div>
      </div>
    )
  }

  if (!demande) return null

  const hasAller = demande.type === 'aller' || demande.type === 'aller_retour'
  const hasRetour = demande.type === 'retour' || demande.type === 'aller_retour'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {t('fournisseur.driverInfoTitle')}
              </h1>
              <p className="text-gray-500">
                {t('fournisseur.dossier')} {demande.dossier.reference}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>{t('fournisseur.client')} :</strong> {demande.dossier.client_name}</p>
            <p><strong>{t('fournisseur.transporter')} :</strong> {demande.transporteur.name}</p>
          </div>
        </div>

        {/* Récap du voyage */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="font-semibold text-purple-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {t('fournisseur.tripSummary')}
          </h2>

          <div className="space-y-4">
            {/* Aller */}
            {hasAller && (
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-purple-700 font-semibold mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('fournisseur.outbound')}</span>
                  <span className="text-sm font-normal text-gray-500 ml-auto">
                    {demande.voyage_info?.aller_date
                      ? formatDate(demande.voyage_info.aller_date)
                      : formatDate(demande.dossier.departure_date)}
                  </span>
                </div>
                {demande.voyage_info?.aller_heure && (
                  <p className="text-sm text-purple-600 flex items-center gap-1 mb-2">
                    <Clock className="w-4 h-4" />
                    {t('fournisseur.pickupAt')} {demande.voyage_info.aller_heure}
                  </p>
                )}
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>{t('fournisseur.departure')} :</strong> {demande.voyage_info?.aller_adresse_depart || demande.dossier.departure}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span><strong>{t('fournisseur.arrival')} :</strong> {demande.voyage_info?.aller_adresse_arrivee || demande.dossier.arrival}</span>
                  </p>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                  <Users className="w-4 h-4" />
                  {demande.voyage_info?.aller_passagers || demande.dossier.passengers} {t('fournisseur.passengers')}
                </p>
              </div>
            )}

            {/* Retour */}
            {hasRetour && (demande.voyage_info?.retour_date || demande.dossier.return_date) && (
              <div className="bg-magenta/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-magenta font-semibold mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('fournisseur.return')}</span>
                  <span className="text-sm font-normal text-gray-500 ml-auto">
                    {demande.voyage_info?.retour_date
                      ? formatDate(demande.voyage_info.retour_date)
                      : demande.dossier.return_date ? formatDate(demande.dossier.return_date) : ''}
                  </span>
                </div>
                {demande.voyage_info?.retour_heure && (
                  <p className="text-sm text-magenta flex items-center gap-1 mb-2">
                    <Clock className="w-4 h-4" />
                    {t('fournisseur.pickupAt')} {demande.voyage_info.retour_heure}
                  </p>
                )}
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span><strong>{t('fournisseur.departure')} :</strong> {demande.voyage_info?.retour_adresse_depart || demande.dossier.arrival}</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span><strong>{t('fournisseur.arrival')} :</strong> {demande.voyage_info?.retour_adresse_arrivee || demande.dossier.departure}</span>
                  </p>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-2">
                  <Users className="w-4 h-4" />
                  {demande.voyage_info?.retour_passagers || demande.dossier.passengers} {t('fournisseur.passengers')}
                </p>
              </div>
            )}

            {/* Informations complémentaires */}
            <div className="border-t pt-4 mt-4 space-y-3">
              {/* Type de bagages */}
              {demande.luggage_type && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                  <span><strong>{t('fournisseur.luggage')} :</strong> {demande.luggage_type === 'cabine' ? t('fournisseur.luggageCabin') : demande.luggage_type === 'soute' ? t('fournisseur.luggageHold') : demande.luggage_type}</span>
                </div>
              )}

              {/* Contact sur place */}
              {(demande.voyage_info?.contact_nom || demande.voyage_info?.contact_prenom || demande.voyage_info?.contact_tel) && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div>
                    <strong>{t('fournisseur.contactOnSite')} :</strong>
                    <span className="ml-1">
                      {[demande.voyage_info.contact_prenom, demande.voyage_info.contact_nom].filter(Boolean).join(' ')}
                      {demande.voyage_info.contact_tel && ` - ${demande.voyage_info.contact_tel}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Commentaires */}
              {demande.voyage_info?.commentaires && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <strong>{t('fournisseur.comments')} :</strong>
                    <p className="text-gray-500 mt-1 whitespace-pre-wrap">{demande.voyage_info.commentaires}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Numéro d'astreinte */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-amber-500" />
            {t('fournisseur.emergencyNumber')}
            <span className="text-sm font-normal text-gray-400">({t('fournisseur.optional')})</span>
          </h2>
          <input
            type="tel"
            value={astreinteTel}
            onChange={(e) => setAstreinteTel(e.target.value)}
            placeholder={t('fournisseur.phonePlaceholder')}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-2">
            {t('fournisseur.emergencyNumberHelp')}
          </p>
        </div>

        {/* Formulaire Aller */}
        {hasAller && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-purple-800 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                {t('fournisseur.vehiclesDriversOutbound')}
              </h2>
              <button
                onClick={() => addVehicule('aller')}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
              >
                <Plus className="w-4 h-4" />
                {t('fournisseur.addVehicle')}
              </button>
            </div>

            <div className="space-y-6">
              {vehiculesAller.map((vehicule, vIndex) => (
                <div key={vehicule.id} className="border border-purple-200 rounded-xl p-4 bg-purple-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-purple-700 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      {t('fournisseur.vehicle')} {vIndex + 1}
                    </span>
                    {vehiculesAller.length > 1 && (
                      <button
                        onClick={() => removeVehicule('aller', vehicule.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Immatriculation */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('fournisseur.registration')} <span className="text-gray-400">({t('fournisseur.optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={vehicule.immatriculation}
                      onChange={(e) => updateVehicule('aller', vehicule.id, 'immatriculation', e.target.value)}
                      placeholder={t('fournisseur.registrationPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Chauffeurs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">{t('fournisseur.driversLabel')}</span>
                      <button
                        onClick={() => addChauffeur('aller', vehicule.id)}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
                      >
                        <Plus className="w-3 h-3" />
                        {t('fournisseur.add')}
                      </button>
                    </div>

                    {vehicule.chauffeurs.map((chauffeur, cIndex) => (
                      <div key={chauffeur.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {t('fournisseur.driver')} {cIndex + 1}
                          </span>
                          {vehicule.chauffeurs.length > 1 && (
                            <button
                              onClick={() => removeChauffeur('aller', vehicule.id, chauffeur.id)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={chauffeur.nom}
                            onChange={(e) => updateChauffeur('aller', vehicule.id, chauffeur.id, 'nom', e.target.value)}
                            placeholder={t('fournisseur.driverNamePlaceholder')}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <input
                            type="tel"
                            value={chauffeur.tel}
                            onChange={(e) => updateChauffeur('aller', vehicule.id, chauffeur.id, 'tel', e.target.value)}
                            placeholder={t('fournisseur.telephone')}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          <select
                            value={chauffeur.role}
                            onChange={(e) => updateChauffeur('aller', vehicule.id, chauffeur.id, 'role', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="principal">{t('fournisseur.rolePrimary')}</option>
                            <option value="secondaire">{t('fournisseur.roleSecondary')}</option>
                            <option value="relais">{t('fournisseur.roleRelay')}</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Formulaire Retour */}
        {hasRetour && (demande.voyage_info?.retour_date || demande.dossier.return_date) && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-magenta flex items-center gap-2">
                <Truck className="w-5 h-5" />
                {t('fournisseur.vehiclesDriversReturn')}
              </h2>
              <button
                onClick={() => addVehicule('retour')}
                className="flex items-center gap-1 text-sm text-magenta hover:opacity-80"
              >
                <Plus className="w-4 h-4" />
                {t('fournisseur.addVehicle')}
              </button>
            </div>

            <div className="space-y-6">
              {vehiculesRetour.map((vehicule, vIndex) => (
                <div key={vehicule.id} className="border border-magenta/30 rounded-xl p-4 bg-magenta/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-magenta flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      {t('fournisseur.vehicle')} {vIndex + 1}
                    </span>
                    {vehiculesRetour.length > 1 && (
                      <button
                        onClick={() => removeVehicule('retour', vehicule.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Immatriculation */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('fournisseur.registration')} <span className="text-gray-400">({t('fournisseur.optional')})</span>
                    </label>
                    <input
                      type="text"
                      value={vehicule.immatriculation}
                      onChange={(e) => updateVehicule('retour', vehicule.id, 'immatriculation', e.target.value)}
                      placeholder={t('fournisseur.registrationPlaceholder')}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-magenta focus:border-transparent"
                    />
                  </div>

                  {/* Chauffeurs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">{t('fournisseur.driversLabel')}</span>
                      <button
                        onClick={() => addChauffeur('retour', vehicule.id)}
                        className="flex items-center gap-1 text-xs text-magenta hover:opacity-80"
                      >
                        <Plus className="w-3 h-3" />
                        {t('fournisseur.add')}
                      </button>
                    </div>

                    {vehicule.chauffeurs.map((chauffeur, cIndex) => (
                      <div key={chauffeur.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {t('fournisseur.driver')} {cIndex + 1}
                          </span>
                          {vehicule.chauffeurs.length > 1 && (
                            <button
                              onClick={() => removeChauffeur('retour', vehicule.id, chauffeur.id)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={chauffeur.nom}
                            onChange={(e) => updateChauffeur('retour', vehicule.id, chauffeur.id, 'nom', e.target.value)}
                            placeholder={t('fournisseur.driverNamePlaceholder')}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-magenta focus:border-transparent"
                          />
                          <input
                            type="tel"
                            value={chauffeur.tel}
                            onChange={(e) => updateChauffeur('retour', vehicule.id, chauffeur.id, 'tel', e.target.value)}
                            placeholder={t('fournisseur.telephone')}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-magenta focus:border-transparent"
                          />
                          <select
                            value={chauffeur.role}
                            onChange={(e) => updateChauffeur('retour', vehicule.id, chauffeur.id, 'role', e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-magenta focus:border-transparent"
                          >
                            <option value="principal">{t('fournisseur.rolePrimary')}</option>
                            <option value="secondaire">{t('fournisseur.roleSecondary')}</option>
                            <option value="relais">{t('fournisseur.roleRelay')}</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bouton de soumission */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <button
            onClick={handleSubmit}
            disabled={!validateForm() || saveVehicules.isPending}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saveVehicules.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('fournisseur.saving')}
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {t('fournisseur.validateInfo')}
              </>
            )}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            * {t('fournisseur.driverNameRequired')}
          </p>
        </div>
      </div>
    </div>
  )
}
