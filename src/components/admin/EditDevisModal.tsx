import { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Info, ChevronDown, ChevronUp, MapPin, Luggage, Clock, Calendar, Euro, Percent, Car, Users, Calculator, Sparkles, AlertTriangle, UserCheck } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  calculerTarifComplet,
  calculerInfosTrajet,
  extraireDepartement,
  determinerAmplitudeGrille,
  chargerMajorationsRegions,
  type GrillesTarifaires,
  type MajorationRegion,
  type ServiceType,
  type AmplitudeType,
  TARIFS_HORS_GRILLE,
} from '@/lib/pricing-rules'
import type {
  Devis,
  Transporteur,
  DossierWithRelations,
  DevisServiceType,
  DevisAmplitude,
  DevisLuggageType,
  DevisOptionStatus,
  DevisOptionsDetails
} from '@/types/database'

interface EditDevisModalProps {
  isOpen: boolean
  onClose: () => void
  devis: Devis | null
  dossier?: DossierWithRelations | null
  transporteurs: Transporteur[]
  onSave: (devisData: Partial<Devis>) => Promise<void>
  isPending?: boolean
}

const SERVICE_TYPE_LABELS: Record<DevisServiceType, string> = {
  aller_simple: 'Aller simple',
  ar_1j: 'Aller-retour 1 jour',
  ar_mad: 'AR avec mise à disposition',
  ar_sans_mad: 'AR sans mise à disposition',
}

const AMPLITUDE_LABELS: Record<DevisAmplitude, string> = {
  '8h': '8 heures',
  '10h': '10 heures',
  '12h': '12 heures',
  '9h_coupure': '9h avec coupure',
}

const LUGGAGE_TYPE_LABELS: Record<DevisLuggageType, string> = {
  aucun: 'Aucun bagage',
  leger: 'Bagages légers',
  moyen: 'Bagages moyens',
  volumineux: 'Bagages volumineux',
}

// Les types de véhicules sont maintenant chargés depuis la table capacites_vehicules

const DEFAULT_OPTIONS: DevisOptionsDetails = {
  repas_chauffeur: { status: 'inclus', montant: 25 }, // Repas inclus par défaut
  parking: { status: 'non_inclus', montant: 0 },
  hebergement: { status: 'non_inclus', montant: 0, nuits: 0 },
  peages: { status: 'inclus', montant: 0 }, // Péages inclus par défaut
}

// Types pour les grilles tarifaires
interface TarifAllerSimple {
  km_min: number
  km_max: number
  prix_public: number
}

interface TarifAR1J {
  km_min: number
  km_max: number
  prix_8h: number | null
  prix_10h: number | null
  prix_12h: number | null
  prix_9h_coupure: number | null
}

interface TarifARMAD {
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
  km_min: number
  km_max: number
  prix_2j: number | null
  prix_3j: number | null
  prix_4j: number | null
  prix_5j: number | null
  prix_6j: number | null
  supplement_jour: number | null
}

interface CoefficientVehicule {
  code: string
  label: string
  coefficient: number
}

interface CapaciteVehicule {
  code: string
  label: string
  places_min: number
  places_max: number
  coefficient: number
}

// Fonction pour extraire le détail MAD du special_requests
function extractDetailMAD(specialRequests: string | null | undefined): string {
  if (!specialRequests) return ''

  // Chercher le bloc de détail MAD
  const madMatch = specialRequests.match(/=== DÉTAIL MISE À DISPOSITION ===\n([\s\S]*?)\n==============================/)
  if (madMatch) {
    return madMatch[1].trim()
  }

  // Si pas de bloc formaté, retourner tout le texte pour les circuits
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

export function EditDevisModal({
  isOpen,
  onClose,
  devis,
  dossier,
  transporteurs,
  onSave,
  isPending = false,
}: EditDevisModalProps) {
  const [formData, setFormData] = useState<Partial<Devis>>({})
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  // State pour les grilles tarifaires
  const [tarifsAllerSimple, setTarifsAllerSimple] = useState<TarifAllerSimple[]>([])
  const [tarifsAR1J, setTarifsAR1J] = useState<TarifAR1J[]>([])
  const [tarifsARMAD, setTarifsARMAD] = useState<TarifARMAD[]>([])
  const [tarifsARSansMAD, setTarifsARSansMAD] = useState<TarifARSansMAD[]>([])
  const [coefficientsVehicules, setCoefficientsVehicules] = useState<CoefficientVehicule[]>([])
  const [capacitesVehicules, setCapacitesVehicules] = useState<CapaciteVehicule[]>([])
  const [majorationsRegions, setMajorationsRegions] = useState<MajorationRegion[]>([])
  const [isLoadingTarifs, setIsLoadingTarifs] = useState(false)

  // Valeurs automatiques depuis le dossier
  const kmFromDossier = useMemo(() => {
    // Le km est stocké dans la demande ou le dossier
    // Pour l'instant on utilise la valeur déjà présente dans le devis
    return devis?.km || ''
  }, [devis])

  const paxFromDossier = useMemo(() => {
    return dossier?.passengers || 0
  }, [dossier])

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

    if (isOpen) {
      loadTarifs()
    }
  }, [isOpen])

  // Initialiser le formulaire quand le devis change
  useEffect(() => {
    if (devis) {
      // Extraire le détail MAD depuis special_requests du dossier si circuit
      const detailMAD = (dossier?.trip_mode === 'circuit' || dossier?.special_requests)
        ? extractDetailMAD(dossier?.special_requests)
        : devis.detail_mad || ''

      setFormData({
        ...devis,
        options_details: (devis.options_details as DevisOptionsDetails | null) || DEFAULT_OPTIONS,
        service_type: devis.service_type || detectServiceType(devis, dossier),
        // Récupérer les valeurs du dossier
        km: devis.km || kmFromDossier,
        pax_aller: devis.pax_aller || paxFromDossier,
        pax_retour: devis.pax_retour || paxFromDossier,
        detail_mad: detailMAD,
      })
    }
  }, [devis, dossier, kmFromDossier, paxFromDossier])

  // Calculer la durée en jours à partir des dates du dossier
  function calculateDureeJours(dos: DossierWithRelations | null | undefined): number {
    if (!dos?.return_date || !dos?.departure_date) return 1

    const depDate = new Date(dos.departure_date)
    const retDate = new Date(dos.return_date)
    const diffDays = Math.ceil((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24))

    return Math.max(1, diffDays + 1) // +1 car on compte le jour de départ
  }

  // Durée calculée automatiquement
  const dureeJours = calculateDureeJours(dossier)

  // Obtenir la ville de départ pour la majoration régionale
  const villeDepartAvecCP = useMemo(() => {
    if (dossier?.departure) {
      // Format attendu: "Ville (CP)" ou "Ville CP"
      return dossier.departure
    }
    return null
  }, [dossier?.departure])

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

    return {
      percent: 0,
      nom: null,
      grandeCapaciteDispo: true,
      departement: dept,
    }
  }, [villeDepartAvecCP, majorationsRegions])

  // Construire les grilles pour le calcul
  const grilles: GrillesTarifaires | null = useMemo(() => {
    if (tarifsAllerSimple.length === 0) return null

    // Conversion des types pour compatibilité
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
    const km = parseInt(formData.km?.toString() || '0') || 0
    if (km <= 0) return null

    const serviceType = (formData.service_type || 'aller_simple') as ServiceType
    // Utiliser les valeurs du formulaire en priorité, sinon celles du dossier
    const heureDepart = (formData as any).departure_time_override || dossier?.departure_time || null
    const heureRetour = (formData as any).return_time_override || dossier?.return_time || null
    const dateDepart = (formData as any).departure_date_override || dossier?.departure_date || null
    const dateRetour = (formData as any).return_date_override || dossier?.return_date || null

    return calculerInfosTrajet(km, heureDepart, heureRetour, dateDepart, dateRetour, serviceType)
  }, [formData.km, formData.service_type, (formData as any).departure_time_override, (formData as any).return_time_override, (formData as any).departure_date_override, (formData as any).return_date_override, dossier])

  // Calculer le tarif estimé selon les grilles tarifaires (nouvelle version)
  const tarifEstime = useMemo(() => {
    const km = parseInt(formData.km?.toString() || '0') || 0
    const serviceType = (formData.service_type || 'aller_simple') as ServiceType
    const amplitude = formData.amplitude as AmplitudeType | null
    const vehicleType = formData.vehicle_type || 'autocar'
    const nombreCars = formData.nombre_cars || 1

    if (km <= 0 || !grilles) return null

    // Trouver le coefficient véhicule
    const coeff = capacitesVehicules.find(c => c.code === vehicleType)?.coefficient
      || coefficientsVehicules.find(c => c.code === vehicleType)?.coefficient
      || 1

    // Déterminer l'amplitude automatiquement si AR 1 jour et non spécifiée
    let amplitudeUtilisee = amplitude
    if (serviceType === 'ar_1j' && !amplitude && infosTrajet?.amplitudeJournee) {
      amplitudeUtilisee = determinerAmplitudeGrille(infosTrajet.amplitudeJournee)
    }

    // Utiliser le nouveau calcul complet
    // Utiliser les valeurs du formulaire en priorité, sinon celles du dossier
    const heureDepart = (formData as any).departure_time_override || dossier?.departure_time || null
    const heureRetour = (formData as any).return_time_override || dossier?.return_time || null
    const dateDepart = (formData as any).departure_date_override || dossier?.departure_date || null
    const dateRetour = (formData as any).return_date_override || dossier?.return_date || null

    const result = calculerTarifComplet({
      distanceKm: km,
      typeService: serviceType,
      amplitude: amplitudeUtilisee,
      nbJours: dureeJours,
      coefficientVehicule: coeff,
      nombreCars,
      villeDepartAvecCP,
      majorationRushManuelle: (majorationRegion?.percent || 0) / 100, // Convertir % en décimal
      kmSupplementairesMAD: 0,
      heureDepart,
      heureRetour,
      dateDepart,
      dateRetour,
      grilles,
    })

    // Déterminer si hors grille
    const kmHorsGrille = result.kmHorsCadre
    const isHorsGrille = kmHorsGrille > 0
    const isPetitKm = km <= TARIFS_HORS_GRILLE.PETIT_KM_SEUIL && serviceType === 'ar_1j'

    return {
      prixBase: result.prixBase,
      coefficient: coeff,
      nombreCars,
      prixFinal: result.prixFinal,
      // Nouvelles infos
      prixGrille: result.prixBase,
      supplementHorsGrille: result.supplementHorsCadre,
      majorationRegion: majorationRegion?.percent || 0,
      coutRelaisChauffeur: result.coutRelaisChauffeur,
      nbChauffeurs: infosTrajet?.nbChauffeurs || 1,
      raisonChauffeurs: infosTrajet?.raisonDeuxChauffeurs || '',
      isHorsGrille,
      isPetitKm,
      kmHorsGrille,
      detailType: result.detailType,
    }
  }, [
    formData.km,
    formData.service_type,
    formData.amplitude,
    formData.vehicle_type,
    formData.nombre_cars,
    (formData as any).departure_time_override,
    (formData as any).return_time_override,
    (formData as any).departure_date_override,
    (formData as any).return_date_override,
    dureeJours,
    grilles,
    coefficientsVehicules,
    capacitesVehicules,
    villeDepartAvecCP,
    majorationRegion,
    infosTrajet,
    dossier,
  ])

  // Fonction pour appliquer le tarif estimé
  const applyEstimatedPrice = () => {
    if (tarifEstime) {
      // Les prix de la grille tarifaire sont TTC, on calcule le HT
      const prixHT = Math.round(tarifEstime.prixFinal / 1.1 * 100) / 100
      handleChange('price_ht', prixHT)

      // Appliquer aussi le nombre de chauffeurs calculé
      if (tarifEstime.nbChauffeurs && tarifEstime.nbChauffeurs > (formData.nombre_chauffeurs || 1)) {
        handleChange('nombre_chauffeurs', tarifEstime.nbChauffeurs)
      }

      // Appliquer la majoration région si présente
      if (tarifEstime.majorationRegion > 0 && !formData.majoration_percent) {
        handleChange('majoration_percent', tarifEstime.majorationRegion)
      }
    }
  }

  // Détecter le type de service basé sur les données du dossier
  function detectServiceType(d: Devis | null, dos: DossierWithRelations | null | undefined): DevisServiceType {
    if (!dos) return 'aller_simple'

    const tripMode = dos.trip_mode
    if (tripMode === 'one-way') return 'aller_simple'
    if (tripMode === 'circuit') return 'ar_mad'

    // Si AR, regarder si c'est 1 jour ou plusieurs
    if (dos.return_date && dos.departure_date) {
      const depDate = new Date(dos.departure_date)
      const retDate = new Date(dos.return_date)
      const diffDays = Math.ceil((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return 'ar_1j'
      // Par défaut AR sans MAD pour les voyages de plusieurs jours
      return 'ar_sans_mad'
    }

    return 'ar_1j'
  }

  const handleChange = (field: keyof Devis, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      const tva = field === 'tva_rate' ? value : prev.tva_rate || 10

      // Prix vente : HT -> TTC
      if (field === 'price_ht') {
        updated.price_ttc = Math.round(value * (1 + tva / 100) * 100) / 100
      }
      // Prix vente : TTC -> HT
      if (field === 'price_ttc') {
        updated.price_ht = Math.round((value / (1 + tva / 100)) * 100) / 100
      }

      // Prix achat : HT -> TTC
      if (field === 'price_achat_ht') {
        updated.price_achat_ttc = Math.round(value * (1 + tva / 100) * 100) / 100
      }
      // Prix achat : TTC -> HT
      if (field === 'price_achat_ttc') {
        updated.price_achat_ht = Math.round((value / (1 + tva / 100)) * 100) / 100
      }

      // Si on change la TVA, recalculer tous les TTC
      if (field === 'tva_rate') {
        const newTva = value
        if (prev.price_ht) {
          updated.price_ttc = Math.round(prev.price_ht * (1 + newTva / 100) * 100) / 100
        }
        if (prev.price_achat_ht) {
          updated.price_achat_ttc = Math.round(prev.price_achat_ht * (1 + newTva / 100) * 100) / 100
        }
      }

      return updated
    })
  }

  const handleOptionChange = (
    option: keyof DevisOptionsDetails,
    field: 'status' | 'montant' | 'nuits',
    value: any
  ) => {
    setFormData(prev => {
      const currentOptions = (prev.options_details as DevisOptionsDetails) || DEFAULT_OPTIONS
      return {
        ...prev,
        options_details: {
          ...currentOptions,
          [option]: {
            ...currentOptions[option],
            [field]: value,
          },
        },
      }
    })
  }

  const handleSubmit = async () => {
    // Nettoyer formData pour ne garder que les colonnes valides de la table devis
    // Exclure les relations et objets imbriqués qui viennent de la requête avec jointures
    const cleanData: Partial<Devis> & Record<string, any> = {
      transporteur_id: formData.transporteur_id,
      vehicle_type: formData.vehicle_type,
      tva_rate: formData.tva_rate,
      price_ht: formData.price_ht,
      price_ttc: formData.price_ttc,
      price_achat_ht: formData.price_achat_ht,
      price_achat_ttc: formData.price_achat_ttc,
      km: formData.km,
      options: formData.options,
      validity_days: formData.validity_days,
      notes: formData.notes,
      nombre_cars: formData.nombre_cars,
      nombre_chauffeurs: formData.nombre_chauffeurs,
      service_type: formData.service_type,
      duree_jours: formData.duree_jours,
      amplitude: formData.amplitude,
      pax_aller: formData.pax_aller,
      pax_retour: formData.pax_retour,
      luggage_type: formData.luggage_type,
      options_details: formData.options_details,
      detail_mad: formData.detail_mad,
      remise_percent: formData.remise_percent,
      remise_montant: formData.remise_montant,
      majoration_percent: formData.majoration_percent,
      majoration_montant: formData.majoration_montant,
      // Champs de surcharge des paramètres du trajet
      departure_override: (formData as any).departure_override || null,
      arrival_override: (formData as any).arrival_override || null,
      departure_date_override: (formData as any).departure_date_override || null,
      return_date_override: (formData as any).return_date_override || null,
      departure_time_override: (formData as any).departure_time_override || null,
      return_time_override: (formData as any).return_time_override || null,
    }

    await onSave(cleanData)
    onClose()
  }

  const options = (formData.options_details as DevisOptionsDetails) || DEFAULT_OPTIONS

  // Calculer la marge
  const marge = (formData.price_ht || 0) - (formData.price_achat_ht || 0)
  const margePercent = formData.price_achat_ht
    ? Math.round((marge / formData.price_achat_ht) * 100)
    : 0

  if (!devis) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Éditer le devis"
      size="xl"
      footer={
        <>
          <button
            className="btn btn-secondary"
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </>
      }
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Info devis */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-purple-dark">{devis.reference}</span>
              {dossier && (
                <span className="text-sm text-gray-500 ml-2">
                  → Dossier {dossier.reference}
                </span>
              )}
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              devis.status === 'accepted' ? 'bg-green-100 text-green-800' :
              devis.status === 'sent' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {devis.status || 'Brouillon'}
            </span>
          </div>
        </div>

        {/* Type de service */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <label className="label flex items-center gap-2">
            <Car size={16} />
            Type de prestation
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {(Object.entries(SERVICE_TYPE_LABELS) as [DevisServiceType, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleChange('service_type', value)}
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
              {(Object.entries(AMPLITUDE_LABELS) as [DevisAmplitude, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleChange('amplitude', value)}
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

        {/* Durée pour AR MAD / AR sans MAD - calculée automatiquement */}
        {(formData.service_type === 'ar_mad' || formData.service_type === 'ar_sans_mad') && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <label className="label flex items-center gap-2 text-indigo-700">
              <Calendar size={16} />
              Durée de la prestation
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-indigo-700">{dureeJours}</span>
                <span className="text-indigo-600">jour{dureeJours > 1 ? 's' : ''}</span>
              </div>
              {dossier?.departure_date && dossier?.return_date && (
                <span className="text-sm text-indigo-500">
                  (du {new Date(dossier.departure_date).toLocaleDateString('fr-FR')} au {new Date(dossier.return_date).toLocaleDateString('fr-FR')})
                </span>
              )}
            </div>
            <p className="text-xs text-indigo-500 mt-1">
              Calculé automatiquement à partir des dates de la demande
            </p>
          </div>
        )}

        {/* Transporteur */}
        <div>
          <label className="label">Transporteur</label>
          <select
            className="input"
            value={formData.transporteur_id || ''}
            onChange={(e) => handleChange('transporteur_id', e.target.value)}
          >
            <option value="">-- Sélectionner --</option>
            {transporteurs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.number} - {t.name} {t.city ? `(${t.city})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Données du trajet - Modifiables */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-purple" />
              <span className="text-sm font-medium text-gray-700">Paramètres du trajet</span>
            </div>
            <span className="text-xs text-gray-400">
              Modifiez ces valeurs pour surcharger les données du dossier
            </span>
          </div>

          {/* Lieux */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label text-gray-600">Ville de départ</label>
              <input
                type="text"
                className="input"
                value={(formData as any).departure_override || dossier?.departure || ''}
                onChange={(e) => handleChange('departure_override' as any, e.target.value)}
                placeholder={dossier?.departure || 'Ex: Paris (75000)'}
              />
            </div>
            <div>
              <label className="label text-gray-600">Ville d'arrivée</label>
              <input
                type="text"
                className="input"
                value={(formData as any).arrival_override || dossier?.arrival || ''}
                onChange={(e) => handleChange('arrival_override' as any, e.target.value)}
                placeholder={dossier?.arrival || 'Ex: Lyon (69000)'}
              />
            </div>
          </div>

          {/* Dates et Horaires */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="label text-gray-600">Date départ</label>
              <input
                type="date"
                className="input"
                value={(formData as any).departure_date_override || formatDateForInput(dossier?.departure_date)}
                onChange={(e) => handleChange('departure_date_override' as any, e.target.value)}
              />
            </div>
            <div>
              <label className="label text-gray-600">Heure départ</label>
              <input
                type="time"
                className="input"
                value={(formData as any).departure_time_override || dossier?.departure_time || ''}
                onChange={(e) => handleChange('departure_time_override' as any, e.target.value)}
              />
            </div>
            <div>
              <label className="label text-gray-600">Date retour</label>
              <input
                type="date"
                className="input"
                value={(formData as any).return_date_override || formatDateForInput(dossier?.return_date)}
                onChange={(e) => handleChange('return_date_override' as any, e.target.value)}
              />
            </div>
            <div>
              <label className="label text-gray-600">Heure retour</label>
              <input
                type="time"
                className="input"
                value={(formData as any).return_time_override || dossier?.return_time || ''}
                onChange={(e) => handleChange('return_time_override' as any, e.target.value)}
              />
            </div>
          </div>

          {/* Distance et Passagers */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label flex items-center gap-2 text-gray-600">
                Distance (km)
              </label>
              <input
                type="text"
                className="input"
                value={formData.km || kmFromDossier || ''}
                onChange={(e) => handleChange('km', e.target.value)}
                placeholder="Ex: 350"
              />
            </div>
            <div>
              <label className="label flex items-center gap-2 text-gray-600">
                <Users size={16} />
                Pax Aller
              </label>
              <input
                type="number"
                className="input"
                value={formData.pax_aller || paxFromDossier || ''}
                onChange={(e) => handleChange('pax_aller', parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
            <div>
              <label className="label flex items-center gap-2 text-gray-600">
                <Users size={16} />
                Pax Retour
              </label>
              <input
                type="number"
                className="input"
                value={formData.pax_retour || paxFromDossier || ''}
                onChange={(e) => handleChange('pax_retour', parseInt(e.target.value) || 0)}
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Type véhicule et bagages */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Type véhicule</label>
            <select
              className="input"
              value={formData.vehicle_type || 'standard'}
              onChange={(e) => handleChange('vehicle_type', e.target.value)}
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
          <div>
            <label className="label flex items-center gap-2">
              <Luggage size={16} />
              Type de bagages
            </label>
            <select
              className="input"
              value={formData.luggage_type || 'moyen'}
              onChange={(e) => handleChange('luggage_type', e.target.value)}
            >
              {(Object.entries(LUGGAGE_TYPE_LABELS) as [DevisLuggageType, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Nombre de cars et chauffeurs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre de cars</label>
            <input
              type="number"
              className="input"
              value={formData.nombre_cars || 1}
              onChange={(e) => handleChange('nombre_cars', parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>
          <div>
            <label className="label">Nombre de chauffeurs</label>
            <input
              type="number"
              className="input"
              value={formData.nombre_chauffeurs || 1}
              onChange={(e) => handleChange('nombre_chauffeurs', parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>
        </div>

        {/* Alertes majoration régionale et véhicule */}
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
            <UserCheck size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                2 chauffeurs recommandés
              </p>
              <p className="text-xs text-blue-600">
                {infosTrajet.raisonDeuxChauffeurs}
                {infosTrajet.tempsConduiteAller > 0 && (
                  <span className="block">
                    Temps conduite aller: {Math.floor(infosTrajet.tempsConduiteAller)}h{Math.round((infosTrajet.tempsConduiteAller % 1) * 60).toString().padStart(2, '0')}
                    {infosTrajet.amplitudeJournee && ` • Amplitude: ${infosTrajet.amplitudeJournee.toFixed(1)}h`}
                  </span>
                )}
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
                <span className="text-purple-600">Coeff. véhicule</span>
                <p className="font-semibold text-purple-800">×{tarifEstime.coefficient}</p>
              </div>
              <div>
                <span className="text-purple-600">Nb de cars</span>
                <p className="font-semibold text-purple-800">×{tarifEstime.nombreCars}</p>
              </div>
              <div>
                <span className="text-purple-600">Prix final TTC</span>
                <p className="font-bold text-lg text-purple-900">{formatPrice(tarifEstime.prixFinal)}</p>
              </div>
            </div>

            {/* Détails supplémentaires */}
            {(tarifEstime.majorationRegion > 0 || tarifEstime.coutRelaisChauffeur > 0 || tarifEstime.supplementHorsGrille > 0) && (
              <div className="mt-3 pt-3 border-t border-purple-200 grid grid-cols-3 gap-3 text-xs">
                {tarifEstime.majorationRegion > 0 && (
                  <div className="bg-amber-50 rounded p-2">
                    <span className="text-amber-700">Majoration région</span>
                    <p className="font-medium text-amber-800">+{tarifEstime.majorationRegion}%</p>
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
                <UserCheck size={14} />
                <span>2 chauffeurs nécessaires : {tarifEstime.raisonChauffeurs}</span>
              </div>
            )}

            {isLoadingTarifs && (
              <p className="text-xs text-purple-500 mt-2">Chargement des grilles tarifaires...</p>
            )}
          </div>
        )}

        {!tarifEstime && formData.km && parseInt(formData.km.toString()) > 0 && !isLoadingTarifs && (
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label text-blue-700">Prix HT *</label>
              <input
                type="number"
                className="input"
                value={formData.price_ht || ''}
                onChange={(e) => handleChange('price_ht', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="label text-blue-700">TVA (%)</label>
              <select
                className="input"
                value={formData.tva_rate || 10}
                onChange={(e) => handleChange('tva_rate', parseFloat(e.target.value))}
              >
                <option value="10">10%</option>
                <option value="20">20%</option>
              </select>
            </div>
            <div>
              <label className="label text-blue-700">Prix TTC</label>
              <input
                type="number"
                className="input bg-blue-100"
                value={formData.price_ttc || ''}
                onChange={(e) => handleChange('price_ttc', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
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
                value={formData.price_achat_ht || ''}
                onChange={(e) => handleChange('price_achat_ht', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <label className="label text-amber-700">Prix achat TTC</label>
              <input
                type="number"
                className="input"
                value={formData.price_achat_ttc || ''}
                onChange={(e) => handleChange('price_achat_ttc', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Marge */}
        {formData.price_ht && formData.price_achat_ht && formData.price_ht > 0 && formData.price_achat_ht > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Marge HT</span>
              <span className="font-bold text-green-700">
                {formatPrice(marge)}
                <span className="text-xs ml-1">
                  ({margePercent}%)
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Remises et majorations */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="label flex items-center gap-1">
              <Percent size={14} />
              Remise %
            </label>
            <input
              type="number"
              className="input"
              value={formData.remise_percent || ''}
              onChange={(e) => handleChange('remise_percent', parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.5"
            />
          </div>
          <div>
            <label className="label">Remise €</label>
            <input
              type="number"
              className="input"
              value={formData.remise_montant || ''}
              onChange={(e) => handleChange('remise_montant', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="label">Majoration %</label>
            <input
              type="number"
              className="input"
              value={formData.majoration_percent || ''}
              onChange={(e) => handleChange('majoration_percent', parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.5"
            />
          </div>
          <div>
            <label className="label">Majoration €</label>
            <input
              type="number"
              className="input"
              value={formData.majoration_montant || ''}
              onChange={(e) => handleChange('majoration_montant', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Validité */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Validité (jours)</label>
            <input
              type="number"
              className="input"
              value={formData.validity_days || 7}
              onChange={(e) => handleChange('validity_days', parseInt(e.target.value) || 7)}
              min="1"
            />
          </div>
        </div>

        {/* Section OPTIONS */}
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition"
          >
            <span className="font-medium">Options (repas, parking, hébergement, péages)</span>
            {showOptions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          {showOptions && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-gray-500 mb-2">
                Les options "Non inclus" avec un montant seront proposées au client sur son interface.
              </p>

              {/* Péages - Inclus par défaut */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="grid grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="label text-green-700">Péages</label>
                    <select
                      className="input"
                      value={options.peages?.status || 'inclus'}
                      onChange={(e) => handleOptionChange('peages', 'status', e.target.value as DevisOptionStatus)}
                    >
                      <option value="inclus">Inclus</option>
                      <option value="non_inclus">Non inclus (option client)</option>
                      <option value="cache">Caché</option>
                    </select>
                  </div>
                  {options.peages?.status === 'non_inclus' && (
                    <div>
                      <label className="label text-green-700">Prix unitaire (client)</label>
                      <input
                        type="number"
                        className="input"
                        value={options.peages?.montant || ''}
                        onChange={(e) => handleOptionChange('peages', 'montant', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        placeholder="Montant péages"
                      />
                    </div>
                  )}
                  {options.peages?.status === 'inclus' && (
                    <div className="col-span-2 flex items-center text-sm text-green-600">
                      Péages inclus dans le prix
                    </div>
                  )}
                </div>
              </div>

              {/* Repas chauffeur */}
              <div className="grid grid-cols-4 gap-4 items-end">
                <div>
                  <label className="label">Repas chauffeur</label>
                  <select
                    className="input"
                    value={options.repas_chauffeur?.status || 'non_inclus'}
                    onChange={(e) => handleOptionChange('repas_chauffeur', 'status', e.target.value as DevisOptionStatus)}
                  >
                    <option value="inclus">Inclus</option>
                    <option value="non_inclus">Non inclus (option client)</option>
                    <option value="cache">Caché</option>
                  </select>
                </div>
                {options.repas_chauffeur?.status === 'non_inclus' && (
                  <>
                    <div>
                      <label className="label">Prix unitaire (client)</label>
                      <input
                        type="number"
                        className="input"
                        value={options.repas_chauffeur?.montant || 25}
                        onChange={(e) => handleOptionChange('repas_chauffeur', 'montant', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        placeholder="€ par repas"
                      />
                    </div>
                    <div className="col-span-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <span className="font-medium">Calcul:</span> {dureeJours} jour{dureeJours > 1 ? 's' : ''} × 2 repas × {options.repas_chauffeur?.montant || 25}€ × {formData.nombre_chauffeurs || 1} chauff. = <span className="font-semibold text-purple">{dureeJours * 2 * (options.repas_chauffeur?.montant || 25) * (formData.nombre_chauffeurs || 1)}€</span>
                    </div>
                  </>
                )}
              </div>

              {/* Parking */}
              <div className="grid grid-cols-3 gap-4 items-end">
                <div>
                  <label className="label">Parking</label>
                  <select
                    className="input"
                    value={options.parking?.status || 'non_inclus'}
                    onChange={(e) => handleOptionChange('parking', 'status', e.target.value as DevisOptionStatus)}
                  >
                    <option value="inclus">Inclus</option>
                    <option value="non_inclus">Non inclus (option client)</option>
                    <option value="cache">Caché</option>
                  </select>
                </div>
                {options.parking?.status === 'non_inclus' && (
                  <div>
                    <label className="label">Prix unitaire (client)</label>
                    <input
                      type="number"
                      className="input"
                      value={options.parking?.montant || ''}
                      onChange={(e) => handleOptionChange('parking', 'montant', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      placeholder="€ parking"
                    />
                  </div>
                )}
              </div>

              {/* Hébergement */}
              <div className="grid grid-cols-4 gap-4 items-end">
                <div>
                  <label className="label">Hébergement chauffeur</label>
                  <select
                    className="input"
                    value={options.hebergement?.status || 'non_inclus'}
                    onChange={(e) => handleOptionChange('hebergement', 'status', e.target.value as DevisOptionStatus)}
                  >
                    <option value="inclus">Inclus</option>
                    <option value="non_inclus">Non inclus (option client)</option>
                    <option value="cache">Caché</option>
                  </select>
                </div>
                {options.hebergement?.status === 'non_inclus' && (
                  <>
                    <div>
                      <label className="label">Prix/nuit (client)</label>
                      <input
                        type="number"
                        className="input"
                        value={options.hebergement?.montant || ''}
                        onChange={(e) => handleOptionChange('hebergement', 'montant', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        placeholder="€/nuit"
                      />
                    </div>
                    <div>
                      <label className="label">Nb nuits</label>
                      <input
                        type="number"
                        className="input"
                        value={options.hebergement?.nuits || ''}
                        onChange={(e) => handleOptionChange('hebergement', 'nuits', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Détail MAD pour circuits - récupéré depuis le dossier */}
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
              className="input min-h-[120px]"
              value={formData.detail_mad || ''}
              onChange={(e) => handleChange('detail_mad', e.target.value)}
              placeholder="Détaillez le programme jour par jour, les étapes, les horaires..."
            />
            <p className="text-xs text-orange-600 mt-1">
              Ce détail sera affiché sur le devis et le contrat.
            </p>
          </div>
        )}

        {/* Options et notes texte libre */}
        <div>
          <label className="label">Options incluses (texte libre)</label>
          <textarea
            className="input min-h-[80px]"
            value={formData.options || ''}
            onChange={(e) => handleChange('options', e.target.value)}
            placeholder="Climatisation, WiFi, WC..."
          />
        </div>

        <div>
          <label className="label">Notes internes</label>
          <textarea
            className="input min-h-[80px]"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Notes visibles uniquement par l'admin..."
          />
        </div>
      </div>
    </Modal>
  )
}
