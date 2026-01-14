import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { ArrowLeft, Check, Clock, MessageCircle, Phone, Info, Download, Bus, Users, Euro, MapPin, Calendar, FileText, ArrowLeftRight, X, Zap, Hourglass, CheckCircle2, Sparkles, ChevronDown } from 'lucide-react'
import { useUpdateDossier } from '@/hooks/useSupabase'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/Modal'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { formatDate, formatPrice, getVehicleTypeLabel, cn, calculateRouteInfo, calculateNumberOfCars, calculateNumberOfDrivers, type RouteInfo } from '@/lib/utils'
import { generateDevisPDF, generateContratPDF, generateFacturePDF, generateFeuilleRoutePDF } from '@/lib/pdf'
import { Truck, Navigation } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocalizedPath } from '@/components/i18n'
import { useCurrentCountry } from '@/hooks/useCountrySettings'
import type { Demande, DevisWithTransporteur, DossierWithRelations } from '@/types/database'
// Types pour l'API de calcul de prix (côté serveur)
type ServiceType = 'aller_simple' | 'ar_1j' | 'ar_mad' | 'ar_sans_mad'

// Composant compte à rebours pour les offres flash
function CountdownTimer({ expiresAt, expiredText }: { expiresAt: string; expiredText?: string }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime()
      const expiry = new Date(expiresAt).getTime()
      const diff = expiry - now

      if (diff <= 0) {
        setIsExpired(true)
        setTimeLeft(null)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft({ hours, minutes, seconds })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [expiresAt])

  if (isExpired) {
    return <span className="text-gray-400">{expiredText}</span>
  }

  if (!timeLeft) {
    return null
  }

  return (
    <div className="flex items-center justify-center gap-1 font-mono text-sm">
      <div className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
        {String(timeLeft.hours).padStart(2, '0')}
      </div>
      <span className="text-red-600 font-bold">:</span>
      <div className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
        {String(timeLeft.minutes).padStart(2, '0')}
      </div>
      <span className="text-red-600 font-bold">:</span>
      <div className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
        {String(timeLeft.seconds).padStart(2, '0')}
      </div>
    </div>
  )
}

export function MesDevisPage() {
  const { t, i18n } = useTranslation()
  const dateLocale = i18n.language === 'de' ? 'de-DE' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'en' ? 'en-GB' : 'fr-FR'
  const localizedPath = useLocalizedPath()
  const { data: country } = useCurrentCountry()
  const [searchParams] = useSearchParams()
  const refParam = searchParams.get('ref')
  const emailParam = searchParams.get('email')
  const signParam = searchParams.get('sign') // Paramètre pour ouvrir automatiquement la modal de signature
  const devisParam = searchParams.get('devis') // ID du devis pré-sélectionné

  const [reference, setReference] = useState(refParam || '')
  const [email, setEmail] = useState(emailParam || '')
  const [searched, setSearched] = useState(!!refParam && !!emailParam)
  const [data, setData] = useState<{
    type: 'demande' | 'dossier'
    demande?: Demande
    dossier?: DossierWithRelations
    devis: DevisWithTransporteur[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [contractAccepted, setContractAccepted] = useState(false)
  const [signataire, setSignataire] = useState({
    firstName: '',
    lastName: '',
  })
  const [billingInfo, setBillingInfo] = useState({
    address: '',
    zip: '',
    city: '',
    country: 'France',
    // Champs e-invoice (facturation électronique)
    vatNumber: '', // N° TVA intracommunautaire client
    orderReference: '', // Référence commande (marchés publics)
    leitwegId: '', // Leitweg-ID (DE uniquement)
    dir3Code: '', // Code DIR3 (ES uniquement)
  })
  const [paymentMethod, setPaymentMethod] = useState<'cb' | 'virement' | null>(null)
  const [clientIp, setClientIp] = useState<string>('')
  const [selectedDevis, setSelectedDevis] = useState<{ devis: DevisWithTransporteur; supplierNum: number } | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatSupplier, setChatSupplier] = useState<{ devisId: string; supplierNum: number } | null>(null)
  const [voyageInfo, setVoyageInfo] = useState<any>(null)
  const [estimatedPrice, setEstimatedPrice] = useState<{ min: number; max: number } | null>(null)
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [tripEstimate, setTripEstimate] = useState<{
    nbCars: number
    nbDrivers: number
    driverReason: string
  } | null>(null)
  const [searchingTransporteurs, setSearchingTransporteurs] = useState(false)
  const [transporteursFound, setTransporteursFound] = useState(false)

  // Paramètres de paiement
  const [paymentSettings, setPaymentSettings] = useState({
    acompte_percent: 30,
    full_payment_threshold_days: 30,
  })

  // Calculer le pourcentage d'acompte effectif selon la date de départ
  const getEffectiveAcomptePercent = (departureDateStr: string | undefined | null): number => {
    if (!departureDateStr) return paymentSettings.acompte_percent
    const departureDate = new Date(departureDateStr)
    const today = new Date()
    const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    // Si départ proche, demander 100%
    if (daysUntilDeparture <= paymentSettings.full_payment_threshold_days) {
      return 100
    }
    return paymentSettings.acompte_percent
  }

  // Options sélectionnées par le client lors de la signature
  const [selectedOptions, setSelectedOptions] = useState<{
    peages: boolean
    repas_chauffeur: boolean
    parking: boolean
    hebergement: boolean
  }>({
    peages: false,
    repas_chauffeur: false,
    parking: false,
    hebergement: false,
  })

  const updateDossier = useUpdateDossier()

  // Ouvrir le chat avec un fournisseur spécifique
  const openChatWithSupplier = (devisId: string, supplierNum: number) => {
    setChatSupplier({ devisId, supplierNum })
    setChatOpen(true)
  }

  // Get client IP address
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setClientIp(data.ip))
      .catch(() => setClientIp(''))
  }, [])

  // Charger les paramètres de paiement
  useEffect(() => {
    const loadPaymentSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'payment_settings')
          .single()

        if (data && !error && data.value) {
          const value = data.value as { acompte_percent?: number; full_payment_threshold_days?: number }
          setPaymentSettings({
            acompte_percent: value.acompte_percent || 30,
            full_payment_threshold_days: value.full_payment_threshold_days || 30,
          })
        }
      } catch (err) {
        console.error('Error loading payment settings:', err)
      }
    }
    loadPaymentSettings()
  }, [])

  const loadData = async () => {
    if (!reference || !email) return

    setLoading(true)
    setError(null)

    try {
      // Utiliser l'Edge Function sécurisée pour récupérer les données
      const { data: clientData, error: fnError } = await supabase.functions.invoke('get-client-data', {
        body: { email: email.toLowerCase(), reference: reference.toUpperCase(), type: 'all' }
      })

      if (fnError || !clientData?.success) {
        // Fallback: essayer avec les demandes (pas de dossier encore)
        const { data: demandeData } = await supabase
          .from('demandes')
          .select('*')
          .eq('reference', reference)
          .eq('client_email', email.toLowerCase())
          .single()

        if (demandeData) {
          const demande = demandeData as Demande
          // Get devis for this demande via Edge Function
          const { data: devisResult } = await supabase.functions.invoke('get-client-data', {
            body: { email: email.toLowerCase(), reference: reference.toUpperCase(), type: 'devis' }
          })

          setData({
            type: 'demande',
            demande,
            devis: (devisResult?.devis as unknown as DevisWithTransporteur[]) || [],
          })
        } else {
          setError(t('mesDevis.errors.notFound'))
        }
        return
      }

      // Données récupérées via Edge Function sécurisée
      const { dossier, devis, paiements, factures, voyage_infos } = clientData

      if (dossier) {
        setVoyageInfo(voyage_infos || null)
        setData({
          type: 'dossier',
          dossier: { ...dossier, paiements: paiements || [], factures: factures || [] } as DossierWithRelations,
          devis: (devis as unknown as DevisWithTransporteur[]) || [],
        })
      } else {
        setError(t('mesDevis.errors.notFound'))
      }
    } catch (err) {
      setError(t('mesDevis.errors.generic'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour calculer l'estimation de prix via l'API serveur (sécurisé)
  const calculatePriceEstimate = async (distanceKm?: number) => {
    if (!data) return

    const displayData = data.dossier || data.demande
    if (!displayData) return

    try {
      // Récupérer les informations du trajet
      const departure = data.dossier?.departure || data.demande?.departure_city || ''
      const arrival = data.dossier?.arrival || data.demande?.arrival_city || ''
      const departureDate = data.dossier?.departure_date || data.demande?.departure_date || ''
      const returnDate = data.dossier?.return_date || data.demande?.return_date || ''
      const departureTime = data.dossier?.departure_time || data.demande?.departure_time || null
      const returnTime = data.dossier?.return_time || data.demande?.return_time || null
      const tripMode = data.dossier?.trip_mode || data.demande?.trip_type
      const hasReturn = !!returnDate
      const passengers = data.dossier?.passengers || parseInt(data.demande?.passengers || '1')

      // Calculer la distance si non fournie
      let distance = distanceKm
      if (!distance) {
        const routeResult = await calculateRouteInfo(departure, arrival)
        if (routeResult) {
          distance = routeResult.distance
        }
      }

      if (!distance || distance <= 0) {
        console.error('Distance non disponible pour le calcul')
        return
      }

      // Déterminer le type de service
      let typeService: ServiceType = 'aller_simple'
      let nbJours = 1
      let calculateAs2AllerSimple = false

      if (tripMode === 'one-way') {
        typeService = 'aller_simple'
      } else if (hasReturn) {
        const depDate = new Date(departureDate)
        const retDate = new Date(returnDate)
        nbJours = Math.max(1, Math.floor((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

        if (nbJours === 1) {
          typeService = 'ar_1j'
        } else if (tripMode === 'circuit') {
          typeService = 'ar_mad'
        } else if (nbJours > 5) {
          typeService = 'aller_simple'
          calculateAs2AllerSimple = true
        } else {
          typeService = 'ar_sans_mad'
        }
      }

      // Appeler l'API serveur pour le calcul de prix (logique cachée côté serveur)
      const { data: result, error } = await supabase.functions.invoke('calculate-price', {
        body: {
          distanceKm: distance,
          typeService,
          nbJours: calculateAs2AllerSimple ? 1 : nbJours,
          nbPassagers: passengers,
          villeDepartAvecCP: departure,
          heureDepart: departureTime,
          heureRetour: returnTime,
          dateDepart: departureDate,
          dateRetour: returnDate,
        }
      })

      if (error) {
        console.error('Erreur API calcul prix:', error)
        return
      }

      if (result && result.prixMin > 0) {
        // Si c'est 2 allers simples, multiplier le prix par 2
        const prixFinal = calculateAs2AllerSimple ? result.prixMin * 2 : result.prixMin
        setEstimatedPrice({ min: prixFinal, max: prixFinal })

        // Mettre à jour tripEstimate avec les infos de chauffeurs
        setTripEstimate(prev => ({
          nbCars: result.nbCars || prev?.nbCars || 1,
          nbDrivers: result.nbChauffeurs || 1,
          driverReason: '',
        }))
      }
    } catch (err) {
      console.error('Erreur calcul estimation:', err)
    }
  }

  // Ref pour éviter les race conditions lors du chargement des données
  const loadDataRequestRef = useRef(0)

  useEffect(() => {
    if (searched && reference && email) {
      // Incrémenter le compteur de requête pour invalider les requêtes précédentes
      const currentRequest = ++loadDataRequestRef.current

      const loadDataWithCancellation = async () => {
        if (!reference || !email) return

        setLoading(true)
        setError(null)

        try {
          // Vérifier si cette requête est toujours la plus récente
          if (currentRequest !== loadDataRequestRef.current) return

          // Normaliser la référence : si c'est une DEM-, chercher le DOS- correspondant
          let dossierRef = reference
          if (reference.startsWith('DEM-')) {
            dossierRef = reference.replace('DEM-', 'DOS-')
          }

          // First try to find a dossier (avec la référence normalisée)
          const { data: dossierData } = await supabase
            .from('dossiers')
            .select('*, transporteur:transporteurs(*)')
            .eq('reference', dossierRef)
            .eq('client_email', email.toLowerCase())
            .single()

          // Vérifier à nouveau après chaque requête async
          if (currentRequest !== loadDataRequestRef.current) return

          if (dossierData) {
            const dossier = dossierData as unknown as DossierWithRelations
            // Get devis for this dossier
            const { data: devisData, error: devisError } = await supabase
              .from('devis')
              .select('*, transporteur:transporteurs(*)')
              .eq('dossier_id', dossier.id)
              .order('price_ttc', { ascending: true })

            if (devisError) console.error('Error loading devis:', devisError)
            if (currentRequest !== loadDataRequestRef.current) return

            // Charger les paiements
            const { data: paiementsData, error: paiementsError } = await supabase
              .from('paiements')
              .select('*')
              .eq('dossier_id', dossier.id)
              .order('payment_date', { ascending: false })

            if (paiementsError) console.error('Error loading paiements:', paiementsError)
            if (currentRequest !== loadDataRequestRef.current) return

            // Charger les factures
            const { data: facturesData, error: facturesError } = await supabase
              .from('factures')
              .select('*')
              .eq('dossier_id', dossier.id)
              .order('created_at', { ascending: false })

            if (facturesError) console.error('Error loading factures:', facturesError)
            if (currentRequest !== loadDataRequestRef.current) return

            // Charger les infos voyage (feuille de route)
            const { data: voyageInfoData, error: voyageInfoError } = await supabase
              .from('voyage_infos')
              .select('*')
              .eq('dossier_id', dossier.id)
              .single()

            // PGRST116 = no rows found, which is OK for voyage_info
            if (voyageInfoError && voyageInfoError.code !== 'PGRST116') {
              console.error('Error loading voyage info:', voyageInfoError)
            }
            if (currentRequest !== loadDataRequestRef.current) return

            setVoyageInfo(voyageInfoData || null)

            setData({
              type: 'dossier',
              dossier: { ...dossier, paiements: paiementsData || [], factures: facturesData || [] },
              devis: (devisData as unknown as DevisWithTransporteur[]) || [],
            })
          } else {
            // Try to find a demande
            const { data: demandeData, error: demandeError } = await supabase
              .from('demandes')
              .select('*')
              .eq('reference', reference)
              .eq('client_email', email.toLowerCase())
              .single()

            // PGRST116 = no rows found, which means demande not found
            if (demandeError && demandeError.code !== 'PGRST116') {
              console.error('Error loading demande:', demandeError)
            }
            if (currentRequest !== loadDataRequestRef.current) return

            if (demandeData) {
              const demande = demandeData as Demande
              // Get devis for this demande
              const { data: devisData, error: devisError } = await supabase
                .from('devis')
                .select('*, transporteur:transporteurs(*)')
                .eq('demande_id', demande.id)
                .order('price_ttc', { ascending: true })

              if (devisError) console.error('Error loading devis for demande:', devisError)
              if (currentRequest !== loadDataRequestRef.current) return

              setData({
                type: 'demande',
                demande,
                devis: (devisData as unknown as DevisWithTransporteur[]) || [],
              })
            } else {
              setError(t('mesDevis.errors.notFound'))
            }
          }
        } catch (err) {
          // Ne pas afficher l'erreur si la requête a été annulée
          if (currentRequest !== loadDataRequestRef.current) return
          setError(t('mesDevis.errors.generic'))
          console.error(err)
        } finally {
          // Ne mettre à jour loading que si c'est la requête courante
          if (currentRequest === loadDataRequestRef.current) {
            setLoading(false)
          }
        }
      }

      loadDataWithCancellation()
    }
  }, [searched, reference, email])

  // Calculer l'estimation de prix et les infos de route quand les données sont chargées
  useEffect(() => {
    if (data && data.devis.length === 0) {
      // Calculer les infos de route (distance et temps)
      const displayData = data.dossier || data.demande
      if (displayData) {
        const departure = data.dossier?.departure || data.demande?.departure_city
        const arrival = data.dossier?.arrival || data.demande?.arrival_city
        const passengers = data.dossier?.passengers || parseInt(data.demande?.passengers || '1')
        const hasReturn = !!(data.dossier?.return_date || data.demande?.return_date)

        if (departure && arrival) {
          // Calculer les infos de route
          calculateRouteInfo(departure, arrival).then((info) => {
            if (info) {
              setRouteInfo(info)

              // Calculer l'estimation de prix avec la distance obtenue
              // L'API serveur retournera aussi nbCars et nbChauffeurs
              calculatePriceEstimate(info.distance)

              // Calcul local du nombre de cars (estimation avant réponse API)
              // Pour ≤ 90 pax: 1 car suffit (on choisit le bon type de véhicule)
              // Pour > 90 pax: plusieurs cars de 53 places
              let nbCars = 1
              if (passengers > 90) {
                nbCars = Math.ceil(passengers / 53)
              }

              // Déterminer si c'est un AR le même jour
              const departureDate = data.dossier?.departure_date || data.demande?.departure_date
              const returnDate = data.dossier?.return_date || data.demande?.return_date
              let isSameDay = false

              if (hasReturn && departureDate && returnDate) {
                const depDate = new Date(departureDate).toDateString()
                const retDate = new Date(returnDate).toDateString()
                isSameDay = depDate === retDate
              }

              // Pour un AR même jour, on estime 2h d'attente sur place
              const driverInfo = calculateNumberOfDrivers(info.duration, isSameDay, isSameDay ? 2 : 0)

              // Multiplier le nombre de chauffeurs par le nombre de cars
              const totalDrivers = driverInfo.drivers * nbCars

              setTripEstimate({
                nbCars,
                nbDrivers: totalDrivers,
                driverReason: nbCars > 1 ? `${totalDrivers} chauffeurs pour ${nbCars} cars` : driverInfo.reason,
              })
            }
          })
        }
      }
    }
  }, [data])

  // Animation de recherche de transporteurs quand pas de devis
  useEffect(() => {
    if (data && data.devis.length === 0 && !transporteursFound) {
      // Lancer l'animation de recherche
      setSearchingTransporteurs(true)

      // Après 5 secondes, afficher le message "transporteurs trouvés"
      const timer = setTimeout(() => {
        setSearchingTransporteurs(false)
        setTransporteursFound(true)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [data, transporteursFound])

  // Ouvrir automatiquement la modal de signature si le paramètre sign=1 est présent
  // et pré-sélectionner le devis si devisParam est fourni
  useEffect(() => {
    if (signParam === '1' && data?.devis && data.devis.length > 0 && !data?.dossier?.contract_signed_at) {
      // Trouver le devis à pré-sélectionner
      let devisToSelect: DevisWithTransporteur | undefined
      let supplierNum = 1

      if (devisParam) {
        // Chercher le devis par ID
        const index = data.devis.findIndex(d => d.id === devisParam)
        if (index !== -1) {
          devisToSelect = data.devis[index]
          supplierNum = index + 1
        }
      }

      // Si pas de devis spécifié ou non trouvé, prendre le premier devis disponible
      if (!devisToSelect) {
        devisToSelect = data.devis[0]
        supplierNum = 1
      }

      if (devisToSelect) {
        setSelectedDevis({ devis: devisToSelect, supplierNum })
        setContractModalOpen(true)
      }
    }
  }, [signParam, devisParam, data])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
  }

  const handleSelectQuote = async (devis: DevisWithTransporteur, supplierNum: number) => {
    // Redirection directe vers la signature sans confirmation
    try {
      // Stocker le devis sélectionné pour la modal de signature
      setSelectedDevis({ devis, supplierNum })

      // Open the contract signing modal directement
      setContractModalOpen(true)
    } catch (err) {
      console.error('Error selecting quote:', err)
      alert(t('mesDevis.errors.generic'))
    }
  }

  // Validation du formulaire de signature
  const isSignatureFormValid = () => {
    return (
      contractAccepted &&
      signataire.firstName.trim() !== '' &&
      signataire.lastName.trim() !== '' &&
      billingInfo.address.trim() !== '' &&
      billingInfo.zip.trim() !== '' &&
      billingInfo.city.trim() !== '' &&
      paymentMethod !== null
    )
  }

  const handleSignContract = async () => {
    if (!isSignatureFormValid() || !data?.dossier || !selectedDevis) {
      alert(t('mesDevis.errors.fillAllFields'))
      return
    }

    try {
      const signataireName = `${signataire.firstName} ${signataire.lastName}`

      // Appeler l'Edge Function pour la signature (contourne les RLS)
      const { data: result, error: fnError } = await supabase.functions.invoke('sign-contract', {
        body: {
          dossier_id: data.dossier.id,
          devis_id: selectedDevis.devis.id,
          signataire_name: signataireName,
          billing_info: {
            address: billingInfo.address,
            zip: billingInfo.zip,
            city: billingInfo.city,
            country: billingInfo.country || 'France',
          },
          // Champs e-invoice (facturation électronique B2B/B2G)
          e_invoice_info: {
            vat_number: billingInfo.vatNumber || null,
            order_reference: billingInfo.orderReference || null,
            leitweg_id: billingInfo.leitwegId || null,
            dir3_code: billingInfo.dir3Code || null,
          },
          payment_method: paymentMethod,
          selected_options: selectedOptions,
          client_ip: clientIp,
          user_agent: navigator.userAgent,
        }
      })

      if (fnError) {
        console.error('Erreur Edge Function:', fnError)
        throw new Error(fnError.message || 'Erreur lors de la signature')
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Erreur lors de la signature')
      }

      // Générer la proforma PDF avec les données retournées par l'Edge Function
      const contractData = result.data
      const countryCode = contractData.dossier?.country_code || data.dossier.country_code || 'FR'
      const pdfLang = countryCode.toLowerCase()
      await generateContratPDF({
        reference: contractData.proforma_reference,
        price_ttc: contractData.price_ttc,
        base_price_ttc: contractData.base_price_ttc,
        options_lignes: contractData.options_lignes,
        acompte_amount: contractData.acompte_amount,
        solde_amount: contractData.solde_amount,
        signed_at: contractData.signed_at,
        client_name: signataireName,
        client_email: data.dossier.client_email,
        billing_address: contractData.billing_info.address,
        billing_zip: contractData.billing_info.zip,
        billing_city: contractData.billing_info.city,
        billing_country: contractData.billing_info.country,
        country_code: countryCode,
        nombre_chauffeurs: contractData.nombre_chauffeurs,
        nombre_cars: contractData.nombre_cars,
        tva_rate: contractData.tva_rate,
        service_type: contractData.service_type,
        duree_jours: contractData.duree_jours,
        detail_mad: contractData.detail_mad,
        dossier: contractData.dossier,
      }, pdfLang)

      setContractModalOpen(false)
      setSelectedDevis(null)
      await loadData()

      // Message différent selon le moyen de paiement
      if (paymentMethod === 'virement') {
        alert(t('mesDevis.contractSignedTransfer'))
      } else {
        alert(t('mesDevis.contractSignedCard'))
        // Rediriger vers la page de paiement CB
        window.location.href = `${localizedPath('/paiement')}?ref=${data.dossier.reference}&email=${encodeURIComponent(data.dossier.client_email)}`
      }
    } catch (err: any) {
      console.error('Error signing contract:', err)
      const errorMessage = err?.message || err?.toString() || t('mesDevis.errors.unknown')
      alert(`${t('mesDevis.errors.generic')}: ${errorMessage}`)
    }
  }

  // Get display data
  const displayData = data?.dossier || data?.demande

  // Déterminer le type de prestation
  const getTripTypeLabel = () => {
    const tripMode = data?.dossier?.trip_mode || data?.demande?.trip_type
    if (tripMode === 'circuit') return t('dashboard.tripModes.circuit')
    if (tripMode === 'one-way') return t('dashboard.tripModes.oneWay')
    if (data?.dossier?.return_date || data?.demande?.return_date) return t('dashboard.tripModes.roundTrip')
    return t('dashboard.tripModes.oneWay')
  }
  const tripType = getTripTypeLabel()

  // Extraire le détail du circuit depuis special_requests
  const getCircuitDetails = () => {
    const specialRequests = data?.dossier?.special_requests || data?.demande?.special_requests
    if (!specialRequests) return null

    const madMatch = specialRequests.match(/=== DÉTAIL MISE À DISPOSITION ===\n([\s\S]*?)\n==============================/)
    if (madMatch) {
      return madMatch[1].trim()
    }
    return null
  }
  const circuitDetails = getCircuitDetails()
  const isCircuit = (data?.dossier?.trip_mode || data?.demande?.trip_type) === 'circuit'
  const acceptedDevis = data?.devis.find(d => d.status === 'accepted')
  const clientValidatedDevis = data?.devis.find(d => d.status === 'client_validated')
  const hasContract = data?.dossier?.contract_signed_at

  // Workflow steps based on actual dossier state
  // 6 étapes: Devis reçu → Contrat signé → Acompte payé → Infos voyage → Feuille de route → Voyage terminé
  const getWorkflowStep = () => {
    if (!data?.dossier) return 0

    const status = data.dossier.status || 'new'
    const hasDevis = data.devis.length > 0
    const hasAcceptedDevis = data.devis.some(d => d.status === 'accepted' || d.status === 'client_validated')
    const hasSignedContract = !!data.dossier.contract_signed_at

    // Step 0: Pas encore de devis
    if (!hasDevis) return 0

    // Step 1: Devis reçu (on a des devis mais pas encore validé/accepté)
    if (!hasAcceptedDevis && !hasSignedContract) return 1

    // Step 2: Contrat signé (devis accepté mais contrat pas encore signé)
    if (!hasSignedContract) return 1  // Reste sur l'étape 1 jusqu'à signature

    // Step 2: Acompte en attente (contrat signé, attente paiement)
    if (status === 'pending-payment') return 2

    // Step 3: Acompte payé, en attente réservation fournisseur
    if (status === 'pending-reservation') return 3

    // Step 3.5: BPA reçu (transporteur confirmé)
    if (status === 'bpa-received') return 3

    // Step 4: Infos voyage (acompte payé, attente infos ou infos reçues)
    if (status === 'pending-info' || status === 'pending-info-received') return 4

    // Step 5: Feuille de route (chauffeur assigné ou dossier confirmé)
    if (status === 'pending-driver' || status === 'confirmed') return 5

    // Step 6: Voyage terminé
    if (status === 'completed') return 6

    // Si on est après le contrat signé mais dans un autre état
    if (hasSignedContract) {
      return 2 // Par défaut après signature = attente acompte
    }

    return 1
  }

  if (!searched) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <Link to={localizedPath('/')} className="flex items-center gap-3 mb-8">
            <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
            <span className="font-display text-xl font-bold gradient-text">Busmoov</span>
          </Link>

          <div className="card p-8">
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-bold text-purple-dark mb-2">
                {t('mesDevis.pageTitle')}
              </h1>
              <p className="text-gray-500">
                {t('mesDevis.pageSubtitle')}
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="label">{t('mesDevis.referenceLabel')}</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={t('mesDevis.referencePlaceholder')}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">{t('mesDevis.emailLabel')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('mesDevis.emailPlaceholder')}
                  className="input"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                {t('mesDevis.viewQuotes')}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-magenta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('mesDevis.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-6">🔍</div>
          <h2 className="font-display text-2xl font-bold text-purple-dark mb-2">
            {t('mesDevis.notFound')}
          </h2>
          <p className="text-gray-500 mb-6">
            {error || t('mesDevis.notFoundText')}
          </p>
          <Link to={localizedPath('/')} className="btn btn-primary">
            {t('mesDevis.newRequest')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link to={localizedPath('/')} className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
            <span className="font-display text-xl font-bold gradient-text">Busmoov</span>
          </Link>
          <Link to={localizedPath('/')} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            {t('mesDevis.back')}
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-purple-dark mb-2">
            {t('mesDevis.clientSpace')}
          </h1>
          <p className="text-gray-500">{t('mesDevis.trackProgress')}</p>
        </div>

        {/* Request Summary */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-200 mb-4">
            {data.type === 'dossier' && data.dossier ? (
              <button
                onClick={() => {
                  // Stocker la session et rediriger vers le dashboard client
                  sessionStorage.setItem('client_dossier', JSON.stringify({
                    id: data.dossier?.id,
                    reference: data.dossier?.reference,
                    email: email
                  }))
                  window.location.href = '/espace-client/dashboard'
                }}
                className="badge badge-magenta cursor-pointer hover:opacity-80"
              >
                📂 {data.dossier?.reference}
              </button>
            ) : (
              <span className="badge badge-magenta">{data.demande?.reference}</span>
            )}
            <span className="text-gray-500 text-sm">
              {t('mesDevis.createdOn')} {formatDate(displayData?.created_at)}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-magenta mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">{t('mesDevis.journey')}</div>
                <div className="font-semibold text-purple-dark text-sm">
                  {data.type === 'dossier' ? `${data.dossier?.departure} → ${data.dossier?.arrival}` : `${data.demande?.departure_city} → ${data.demande?.arrival_city}`}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-magenta mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">{t('mesDevis.dates')}</div>
                <div className="font-semibold text-purple-dark text-sm">
                  {formatDate(data.type === 'dossier' ? data.dossier?.departure_date : data.demande?.departure_date)}
                  {(data.type === 'dossier' ? data.dossier?.return_date : data.demande?.return_date) && (
                    <> - {formatDate(data.type === 'dossier' ? data.dossier?.return_date : data.demande?.return_date)}</>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users size={18} className="text-magenta mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">{t('mesDevis.passengers')}</div>
                <div className="font-semibold text-purple-dark text-sm">
                  {data.type === 'dossier' ? data.dossier?.passengers : data.demande?.passengers} {t('mesDevis.persons')}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bus size={18} className="text-magenta mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">{t('mesDevis.type')}</div>
                <div className="font-semibold text-purple-dark text-sm">
                  {getVehicleTypeLabel(data.type === 'dossier' ? data.dossier?.vehicle_type : data.demande?.vehicle_type) || 'Autocar-Standard'}
                </div>
              </div>
            </div>
            {(data.type === 'dossier' ? data.dossier?.voyage_type : data.demande?.voyage_type) && (
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-magenta mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500">{t('mesDevis.voyageType')}</div>
                  <div className="font-semibold text-purple-dark text-sm capitalize">
                    {data.type === 'dossier' ? data.dossier?.voyage_type : data.demande?.voyage_type}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <ArrowLeftRight size={18} className="text-magenta mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">{t('mesDevis.formula')}</div>
                <div className="font-semibold text-purple-dark text-sm">{tripType}</div>
              </div>
            </div>
          </div>

          {/* Détail circuit/mise à disposition si applicable */}
          {isCircuit && circuitDetails && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info size={18} className="text-purple mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-purple-dark mb-2">{t('mesDevis.circuitDetails')}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{circuitDetails}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bouton Abandonner le projet - visible uniquement si dossier non terminé/abandonné */}
          {data.type === 'dossier' && data.dossier && !['completed', 'cancelled'].includes(data.dossier.status || '') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={async () => {
                  const raison = prompt(t('mesDevis.abandonReason'))
                  if (!confirm(t('mesDevis.abandonConfirm'))) return

                  try {
                    // Mettre à jour le statut du dossier
                    await updateDossier.mutateAsync({
                      id: data.dossier!.id,
                      status: 'cancelled',
                    })

                    // Ajouter à la timeline
                    await supabase.from('timeline').insert({
                      dossier_id: data.dossier!.id,
                      type: 'status_change',
                      content: `❌ ${t('mesDevis.projectAbandoned')}${raison ? ` - Raison : ${raison}` : ''}`,
                    })

                    alert(t('mesDevis.abandonSuccess'))
                    // Recharger les données
                    loadData()
                  } catch (err) {
                    console.error('Erreur:', err)
                    alert(t('mesDevis.errors.generic'))
                  }
                }}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors underline"
              >
                {t('mesDevis.abandonProject')}
              </button>
            </div>
          )}

          {/* Bouton Réouvrir le projet - visible uniquement si dossier abandonné et date de départ pas passée */}
          {data.type === 'dossier' && data.dossier && data.dossier.status === 'cancelled' && data.dossier.departure_date && new Date(data.dossier.departure_date) > new Date() && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 mb-3">
                  {t('mesDevis.projectAbandonedText')}
                </p>
                <button
                  onClick={async () => {
                    try {
                      await updateDossier.mutateAsync({
                        id: data.dossier!.id,
                        status: 'new',
                      })

                      await supabase.from('timeline').insert({
                        dossier_id: data.dossier!.id,
                        type: 'status_change',
                        content: `🔄 ${t('mesDevis.projectReopened')}`,
                      })

                      alert(t('mesDevis.reopenSuccess'))
                      loadData()
                    } catch (err) {
                      console.error('Erreur:', err)
                      alert(t('mesDevis.errors.generic'))
                    }
                  }}
                  className="btn-primary text-sm"
                >
                  {t('mesDevis.reopenProject')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Workflow Steps (only for dossiers) */}
        {data.type === 'dossier' && (
          <div className="mb-8">
            {/* Barre de progression */}
            <div className="flex justify-between items-center relative">
              <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 rounded-full">
                <div
                  className="h-full gradient-bg rounded-full transition-all duration-500"
                  style={{ width: `${(getWorkflowStep() / 5) * 100}%` }}
                />
              </div>
              {[
                { key: 'quote', icon: '💰', label: t('mesDevis.workflow.quoteReceived') },
                { key: 'contract', icon: '📄', label: t('mesDevis.workflow.contractSigned') },
                { key: 'payment', icon: '💳', label: t('mesDevis.workflow.depositPaid') },
                { key: 'info', icon: '📝', label: t('mesDevis.workflow.tripInfo') },
                { key: 'roadmap', icon: '🗺️', label: t('mesDevis.workflow.roadmap') },
                { key: 'completed', icon: '🎉', label: t('mesDevis.workflow.tripCompleted') },
              ].map((step, index) => {
                const stepNum = index + 1
                const currentStep = getWorkflowStep()
                // Une étape est complétée si currentStep >= stepNum
                const isCompleted = currentStep >= stepNum
                // L'étape courante est celle qui correspond exactement à currentStep
                const isCurrent = currentStep === stepNum

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 transition-all',
                        isCompleted
                          ? 'gradient-bg text-white shadow-lg'
                          : isCurrent
                            ? 'bg-white border-2 border-magenta text-magenta shadow-md'
                            : 'bg-gray-100 text-gray-400'
                      )}
                    >
                      {step.icon}
                    </div>
                    <span
                      className={cn(
                        'text-xs text-center max-w-16 leading-tight',
                        isCompleted ? 'text-purple-dark font-semibold' : isCurrent ? 'text-magenta font-medium' : 'text-gray-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Message contextuel selon l'étape */}
            {getWorkflowStep() === 6 && (
              <div className="mt-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="font-semibold text-emerald-800 mb-1">{t('mesDevis.workflow.completedTitle')}</h3>
                <p className="text-sm text-emerald-600">
                  {t('mesDevis.workflow.completedText')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Status Banner */}
        {data.devis.length === 0 ? (
          <>
            {/* Animation de recherche de transporteurs */}
            {searchingTransporteurs && (
              <div className="bg-gradient-to-r from-purple-50 to-magenta/10 border-2 border-purple/30 rounded-2xl p-8 mb-6 shadow-lg">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-purple/10 rounded-full flex items-center justify-center mb-4">
                    <Hourglass size={40} className="text-purple animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-purple-dark mb-2">{t('mesDevis.search.title')}</h3>
                  <p className="text-gray-600">{t('mesDevis.search.subtitle')}</p>
                  <div className="mt-4 flex gap-2">
                    <div className="w-3 h-3 bg-magenta rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-magenta rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-magenta rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Message transporteurs trouvés + devis en préparation */}
            {transporteursFound && (
              <>
                {/* Bandeau succès - transporteurs trouvés */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 rounded-2xl p-6 mb-4 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-emerald-800">{t('mesDevis.search.foundTitle')}</h3>
                        <Sparkles size={20} className="text-emerald-500" />
                      </div>
                      <p className="text-emerald-700 mt-1">
                        {t('mesDevis.search.foundText')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bandeau devis en préparation */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 mb-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center animate-pulse">
                      <Clock size={32} className="text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-amber-800">{t('mesDevis.search.preparingTitle')}</h3>
                      <p className="text-amber-700 mt-1">
                        {t('mesDevis.search.preparingText')} <span className="font-semibold">{t('mesDevis.search.responseIn24h')}</span>
                      </p>
                    </div>
                  </div>

                  {/* Infos de trajet estimées */}
                  {(routeInfo || tripEstimate) && (
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                        <Navigation size={16} />
                        {t('mesDevis.routeEstimate.title')}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {routeInfo && (
                          <>
                            <div className="bg-white/60 rounded-lg p-3 text-center">
                              <div className="text-xs text-amber-600 mb-1">{t('mesDevis.routeEstimate.distance')}</div>
                              <div className="font-bold text-amber-900">{routeInfo.distance} km</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3 text-center">
                              <div className="text-xs text-amber-600 mb-1">{t('mesDevis.routeEstimate.duration')}</div>
                              <div className="font-bold text-amber-900">{routeInfo.durationFormatted}</div>
                            </div>
                          </>
                        )}
                        {tripEstimate && (
                          <>
                            <div className="bg-white/60 rounded-lg p-3 text-center">
                              <div className="text-xs text-amber-600 mb-1">{t('mesDevis.routeEstimate.nbCars')}</div>
                              <div className="font-bold text-amber-900">{tripEstimate.nbCars}</div>
                            </div>
                            <div className="bg-white/60 rounded-lg p-3 text-center">
                              <div className="text-xs text-amber-600 mb-1">{t('mesDevis.routeEstimate.drivers')}</div>
                              <div className="font-bold text-amber-900">{tripEstimate.nbDrivers}</div>
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-amber-600 mt-2 italic">
                        {t('mesDevis.routeEstimate.disclaimer')}
                      </p>
                    </div>
                  )}

                  {/* Estimation de prix */}
                  {estimatedPrice && (
                    <div className="mt-4 pt-4 border-t border-amber-200">
                      <div className="flex items-center gap-2 text-amber-800">
                        <Euro size={18} />
                        <span className="font-medium">{t('mesDevis.priceEstimate.title')}</span>
                      </div>
                      <p className="text-lg font-bold text-amber-900 mt-1">
                        {formatPrice(estimatedPrice.min)} TTC
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        {t('mesDevis.priceEstimate.disclaimer')}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : acceptedDevis ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Check size={24} className="text-emerald-500" />
            <div>
              <h3 className="font-semibold text-emerald-800">{t('mesDevis.status.confirmed')}</h3>
              <p className="text-sm text-emerald-600">
                {t('mesDevis.status.confirmedText')} {formatPrice(acceptedDevis.price_ttc)} TTC
              </p>
            </div>
          </div>
        ) : clientValidatedDevis ? (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Clock size={24} className="text-orange-500" />
            <div>
              <h3 className="font-semibold text-orange-800">{t('mesDevis.status.pending')}</h3>
              <p className="text-sm text-orange-600">
                {t('mesDevis.status.pendingText')} ({formatPrice(clientValidatedDevis.price_ttc)} TTC)
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Info size={24} className="text-blue-500" />
            <div>
              <h3 className="font-semibold text-blue-800">
                {data.devis.length} {data.devis.length > 1 ? t('mesDevis.status.quotesAvailablePlural') : t('mesDevis.status.quotesAvailable')}
              </h3>
              <p className="text-sm text-blue-600">
                {t('mesDevis.status.compareText')}
              </p>
            </div>
          </div>
        )}

        {/* Action Cards */}
        {data.type === 'dossier' && data.dossier?.price_ttc && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {/* Bouton Contrat */}
            {hasContract ? (
              <button
                onClick={async () => {
                  const acceptedDevis = data.devis.find(d => d.status === 'accepted')
                  if (acceptedDevis && data.dossier) {
                    await generateContratPDF({
                      reference: `CTR-${data.dossier.reference}`,
                      price_ttc: data.dossier.price_ttc || 0,
                      acompte_amount: Math.round((data.dossier.price_ttc || 0) * 0.3),
                      solde_amount: Math.round((data.dossier.price_ttc || 0) * 0.7),
                      signed_at: data.dossier.contract_signed_at,
                      client_name: data.dossier.client_name,
                      client_email: data.dossier.client_email,
                      billing_address: data.dossier.billing_address,
                      billing_zip: data.dossier.billing_zip,
                      billing_city: data.dossier.billing_city,
                      billing_country: data.dossier.billing_country,
                      country_code: data.dossier.country_code || 'FR',
                      dossier: {
                        reference: data.dossier.reference,
                        client_name: data.dossier.client_name,
                        client_email: data.dossier.client_email,
                        departure: data.dossier.departure,
                        arrival: data.dossier.arrival,
                        departure_date: data.dossier.departure_date,
                        departure_time: data.dossier.departure_time,
                        return_date: data.dossier.return_date,
                        return_time: data.dossier.return_time,
                        passengers: data.dossier.passengers,
                        transporteur: acceptedDevis.transporteur || undefined,
                      },
                    }, (data.dossier.country_code || 'FR').toLowerCase())
                  }
                }}
                className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all bg-emerald-50 border-emerald-200 hover:border-emerald-400"
              >
                <div className="text-3xl mb-2">✅</div>
                <h4 className="font-semibold text-purple-dark text-sm">{t('mesDevis.actions.contractSigned')}</h4>
                <p className="text-xs text-gray-500">{formatDate(data.dossier.contract_signed_at)}</p>
                <p className="text-xs text-emerald-600 mt-1">{t('mesDevis.actions.downloadProforma')}</p>
              </button>
            ) : (
              <button
                onClick={() => setContractModalOpen(true)}
                className="card p-6 text-center cursor-pointer hover:shadow-lg hover:border-magenta transition-all"
              >
                <div className="text-3xl mb-2">📄</div>
                <h4 className="font-semibold text-purple-dark text-sm">{t('mesDevis.actions.signContract')}</h4>
                <p className="text-xs text-gray-500">{t('mesDevis.actions.electronicSignature')}</p>
              </button>
            )}

            {/* Bouton Paiement - dynamique selon l'état */}
            {hasContract && (() => {
              const paiements = data?.dossier?.paiements || []
              const totalPaye = paiements.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
              const prixTTC = data.dossier?.price_ttc || 0
              const currentAcomptePercent = getEffectiveAcomptePercent(data?.dossier?.departure_date)
              const acompte = Math.round(prixTTC * (currentAcomptePercent / 100))
              const soldeRestant = prixTTC - totalPaye
              const acomptePaye = totalPaye >= acompte
              const soldePaye = soldeRestant <= 0

              if (soldePaye) {
                // Tout est payé - bouton désactivé
                return (
                  <div className="card p-6 text-center bg-emerald-50 border-emerald-200">
                    <div className="text-3xl mb-2">✅</div>
                    <h4 className="font-semibold text-emerald-700 text-sm">{t('mesDevis.actions.fullPayment')}</h4>
                    <p className="text-xs text-emerald-600">{formatPrice(totalPaye)} {t('mesDevis.actions.paid')}</p>
                  </div>
                )
              } else if (acomptePaye) {
                // Acompte payé, reste le solde
                return (
                  <Link
                    to={`${localizedPath('/paiement')}?ref=${data.dossier?.reference}&email=${encodeURIComponent(email)}&type=solde`}
                    className="card p-6 text-center cursor-pointer hover:shadow-lg hover:border-magenta transition-all bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
                  >
                    <div className="text-3xl mb-2">💳</div>
                    <h4 className="font-semibold text-orange-700 text-sm">{t('mesDevis.actions.paySolde')}</h4>
                    <p className="text-xs text-orange-600">{formatPrice(soldeRestant)} {t('mesDevis.actions.remaining')}</p>
                  </Link>
                )
              } else {
                // Acompte non payé (ou paiement total si départ proche)
                const isFullPayment = currentAcomptePercent === 100
                return (
                  <Link
                    to={`${localizedPath('/paiement')}?ref=${data.dossier?.reference}&email=${encodeURIComponent(email)}`}
                    className="card p-6 text-center cursor-pointer hover:shadow-lg hover:border-magenta transition-all bg-gradient-to-br from-magenta/5 to-purple/5 border-magenta/20"
                  >
                    <div className="text-3xl mb-2">💳</div>
                    <h4 className="font-semibold text-purple-dark text-sm">
                      {isFullPayment ? t('mesDevis.actions.payTotal') : t('mesDevis.actions.payDeposit')}
                    </h4>
                    <p className="text-xs text-gray-500">{t('mesDevis.actions.cbOrTransfer')}</p>
                  </Link>
                )
              }
            })()}

            {/* Bouton Infos voyage - dynamique selon l'état */}
            {(() => {
              const hasVoyageInfo = voyageInfo && (voyageInfo.aller_adresse_depart || voyageInfo.contact_nom)
              const isValidated = voyageInfo?.validated_at

              if (isValidated) {
                // Infos validées - consultation seule
                return (
                  <Link
                    to={`${localizedPath('/infos-voyage')}?ref=${data.dossier?.reference}&email=${encodeURIComponent(email)}`}
                    className="card p-6 text-center cursor-pointer hover:shadow-lg transition-all bg-emerald-50 border-emerald-200 hover:border-emerald-400"
                  >
                    <div className="text-3xl mb-2">✅</div>
                    <h4 className="font-semibold text-emerald-700 text-sm">{t('mesDevis.actions.tripInfo')}</h4>
                    <p className="text-xs text-emerald-600">{t('mesDevis.actions.validated')}</p>
                  </Link>
                )
              } else if (hasVoyageInfo) {
                // Infos complétées mais pas validées
                return (
                  <Link
                    to={`${localizedPath('/infos-voyage')}?ref=${data.dossier?.reference}&email=${encodeURIComponent(email)}`}
                    className="card p-6 text-center cursor-pointer hover:shadow-lg hover:border-orange-400 transition-all bg-orange-50 border-orange-200"
                  >
                    <div className="text-3xl mb-2">⏳</div>
                    <h4 className="font-semibold text-orange-700 text-sm">{t('mesDevis.actions.tripInfo')}</h4>
                    <p className="text-xs text-orange-600">{t('mesDevis.actions.pendingValidation')}</p>
                  </Link>
                )
              } else {
                // Infos pas encore complétées
                return (
                  <Link
                    to={`${localizedPath('/infos-voyage')}?ref=${data.dossier?.reference}&email=${encodeURIComponent(email)}`}
                    className="card p-6 text-center cursor-pointer hover:shadow-lg hover:border-magenta transition-all"
                  >
                    <div className="text-3xl mb-2">📝</div>
                    <h4 className="font-semibold text-purple-dark text-sm">{t('mesDevis.actions.tripInfo')}</h4>
                    <p className="text-xs text-gray-500">{t('mesDevis.actions.toComplete')}</p>
                  </Link>
                )
              }
            })()}

            <button
              onClick={() => setChatOpen(true)}
              className="card p-6 text-center cursor-pointer hover:shadow-lg hover:border-magenta transition-all"
            >
              <div className="text-3xl mb-2">💬</div>
              <h4 className="font-semibold text-purple-dark text-sm">{t('mesDevis.actions.contact')}</h4>
              <p className="text-xs text-gray-500">{t('mesDevis.actions.chat')}</p>
            </button>
          </div>
        )}

        {/* Bloc Mes Factures - toujours visible si des factures existent (en dehors du bloc devis) */}
        {data?.type === 'dossier' && data?.dossier?.factures && data.dossier.factures.length > 0 && (
          <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 mb-6">
            <h4 className="font-semibold text-blue-800 mb-4 flex items-center gap-2 text-lg">
              <FileText size={20} className="text-blue-600" />
              {t('mesDevis.invoices.title')}
            </h4>
            <div className="space-y-3">
              {data.dossier.factures.map((facture: any) => (
                <div key={facture.id} className="flex justify-between items-center bg-white/50 rounded-lg p-3">
                  <div>
                    <span className="font-medium text-gray-700 font-mono">
                      {facture.reference}
                    </span>
                    <span className={cn(
                      "ml-2 text-xs px-2 py-0.5 rounded-full",
                      facture.type === 'acompte' && "bg-amber-100 text-amber-700",
                      facture.type === 'solde' && "bg-blue-100 text-blue-700",
                      facture.type === 'avoir' && "bg-red-100 text-red-700"
                    )}>
                      {facture.type === 'acompte' ? t('mesDevis.invoices.deposit') : facture.type === 'solde' ? t('mesDevis.invoices.balance') : t('mesDevis.invoices.credit')}
                    </span>
                    <span className={cn(
                      "ml-2 text-xs px-2 py-0.5 rounded-full",
                      facture.status === 'paid' && "bg-green-100 text-green-700",
                      facture.status === 'cancelled' && "bg-red-100 text-red-700",
                      facture.type === 'avoir' && facture.status !== 'cancelled' && "bg-gray-100 text-gray-600",
                      (facture.status === 'pending' || facture.status === 'generated') && facture.type !== 'avoir' && "bg-orange-100 text-orange-700"
                    )}>
                      {facture.status === 'paid' ? t('mesDevis.invoices.paid') :
                       facture.status === 'cancelled' ? t('mesDevis.invoices.cancelled') :
                       facture.type === 'avoir' ? t('mesDevis.invoices.issued') : t('mesDevis.invoices.pending')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(facture.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "font-bold text-lg",
                      facture.type === 'avoir' ? "text-red-600" : "text-gray-800"
                    )}>
                      {facture.type === 'avoir' ? '-' : ''}{formatPrice(Math.abs(facture.amount_ttc))}
                    </span>
                    <button
                      onClick={() => {
                        const devisAccepte = data.devis.find(d => d.status === 'accepted')
                        generateFacturePDF({
                          ...facture,
                          country_code: data.dossier?.country_code || 'FR',
                          dossier: data.dossier ? {
                            reference: data.dossier.reference,
                            departure: data.dossier.departure,
                            arrival: data.dossier.arrival,
                            departure_date: data.dossier.departure_date,
                            passengers: data.dossier.passengers,
                            client_name: data.dossier.client_name,
                            client_email: data.dossier.client_email,
                            total_ttc: data.dossier.price_ttc || devisAccepte?.price_ttc || null,
                          } : null
                        }, (data.dossier?.country_code || 'FR').toLowerCase())
                      }}
                      className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feuille de Route - visible si infos chauffeur reçues */}
        {data?.type === 'dossier' && voyageInfo?.chauffeur_info_recue_at && (
          <div className="card p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 mb-6">
            <h4 className="font-semibold text-purple-800 mb-4 flex items-center gap-2 text-lg">
              <Navigation size={20} className="text-purple-600" />
              Feuille de route
            </h4>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Trajet Aller */}
              {(voyageInfo.feuille_route_type === 'aller' || voyageInfo.feuille_route_type === 'aller_retour') && voyageInfo.chauffeur_aller_nom && (
                <div className="bg-white/70 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-3 text-purple-700 font-semibold">
                    <Truck size={18} />
                    <span>{t('mesDevis.roadmap.outbound')}</span>
                    <span className="text-sm font-normal text-gray-500 ml-auto">
                      {voyageInfo.aller_date ? formatDate(voyageInfo.aller_date) : formatDate(data.dossier?.departure_date)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500 w-24">{t('mesDevis.roadmap.driver')}</span>
                      <span className="font-semibold text-purple-dark">{voyageInfo.chauffeur_aller_nom}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500 w-24">{t('mesDevis.roadmap.phone')}</span>
                      <a href={`tel:${voyageInfo.chauffeur_aller_tel}`} className="font-semibold text-magenta hover:underline">
                        {voyageInfo.chauffeur_aller_tel}
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500 w-24">{t('mesDevis.roadmap.vehicle')}</span>
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{voyageInfo.chauffeur_aller_immatriculation}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Trajet Retour */}
              {(voyageInfo.feuille_route_type === 'retour' || voyageInfo.feuille_route_type === 'aller_retour') && voyageInfo.chauffeur_retour_nom && (
                <div className="bg-white/70 rounded-xl p-4 border border-magenta/20">
                  <div className="flex items-center gap-2 mb-3 text-magenta font-semibold">
                    <Truck size={18} />
                    <span>{t('mesDevis.roadmap.return')}</span>
                    <span className="text-sm font-normal text-gray-500 ml-auto">
                      {voyageInfo.retour_date ? formatDate(voyageInfo.retour_date) : formatDate(data.dossier?.return_date)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500 w-24">{t('mesDevis.roadmap.driver')}</span>
                      <span className="font-semibold text-purple-dark">{voyageInfo.chauffeur_retour_nom}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500 w-24">{t('mesDevis.roadmap.phone')}</span>
                      <a href={`tel:${voyageInfo.chauffeur_retour_tel}`} className="font-semibold text-magenta hover:underline">
                        {voyageInfo.chauffeur_retour_tel}
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500 w-24">{t('mesDevis.roadmap.vehicle')}</span>
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{voyageInfo.chauffeur_retour_immatriculation}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton télécharger PDF */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={async () => {
                  if (data.dossier) {
                    await generateFeuilleRoutePDF({
                      reference: data.dossier.reference,
                      type: voyageInfo.feuille_route_type || (data.dossier.return_date ? 'aller_retour' : 'aller'),
                      client_name: data.dossier.client_name,
                      client_phone: data.dossier.client_phone,
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
                      contact_tel: voyageInfo.contact_tel,
                    }, (data.dossier.country_code || 'FR').toLowerCase())
                  }
                }}
                className="btn bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
              >
                <Download size={16} />
                {t('mesDevis.roadmap.downloadPdf')}
              </button>
            </div>
          </div>
        )}

        {/* Feuille de route en attente */}
        {data?.type === 'dossier' && data?.dossier?.contract_signed_at && !voyageInfo?.chauffeur_info_recue_at && (data.dossier.status === 'pending-info' || data.dossier.status === 'pending-driver') && (
          <div className="card p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 mb-6">
            <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
              <Clock size={18} className="text-amber-600" />
              {t('mesDevis.roadmap.preparing')}
            </h4>
            <p className="text-gray-600 text-sm">
              {t('mesDevis.roadmap.preparingText')}
            </p>
          </div>
        )}

        {/* Quotes Grid - Style moderne inspiré Groupito */}
        {data.devis.length > 0 && (() => {
          // Si un contrat est signé, ne montrer que le devis accepté
          const hasSignedContract = !!data?.dossier?.contract_signed_at
          const validatedDevis = data.devis.find(d => d.status === 'accepted')

          // Filtrer les devis à afficher
          const devisToShow = hasSignedContract && validatedDevis
            ? [validatedDevis]
            : data.devis

          // Le dossier est en attente de paiement ou en attente de réservation (acompte payé)
          const isPendingPayment = data?.dossier?.status === 'pending-payment'
          const isPendingReservation = data?.dossier?.status === 'pending-reservation'
          const isBpaReceived = data?.dossier?.status === 'bpa-received'
          const isPendingInfo = data?.dossier?.status === 'pending-info' || data?.dossier?.status === 'pending-info-received'
          const isPendingDriver = data?.dossier?.status === 'pending-driver'
          const isConfirmed = data?.dossier?.status === 'confirmed'
          const isCompleted = data?.dossier?.status === 'completed'
          const paiements = data?.dossier?.paiements || []
          const totalPaye = paiements.reduce((sum, p) => sum + (p.amount || 0), 0)
          const soldeRestant = (data?.dossier?.price_ttc || 0) - totalPaye

          // Calculer la date limite du solde (30 jours avant le départ)
          // Utiliser la date des infos voyage (modifiée par le client) si disponible, sinon celle du dossier
          const departureDateStr = voyageInfo?.aller_date || data?.dossier?.departure_date
          const departureDate = departureDateStr ? new Date(departureDateStr) : null
          const soldeDueDate = departureDate ? new Date(departureDate.getTime() - 30 * 24 * 60 * 60 * 1000) : null
          const isSoldePaid = soldeRestant <= 0
          const hasAcompte = paiements.length > 0 && totalPaye > 0

          // Afficher le bloc paiement pour tous les statuts après pending-payment
          const showPaymentBlock = hasAcompte && (isPendingReservation || isBpaReceived || isPendingInfo || isPendingDriver || isConfirmed || isCompleted)

          return (
          <div className="space-y-6 mb-8">
            {/* Bloc Récapitulatif Paiements - visible pour tous les statuts après acompte */}
            {showPaymentBlock && (
              <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2 text-lg">
                  <Check size={20} className="text-green-600" />
                  {t('mesDevis.payment.summary')}
                </h4>
                <div className="space-y-3">
                  {paiements.map((p) => (
                    <div key={p.id} className="flex justify-between items-center bg-white/50 rounded-lg p-3">
                      <div>
                        <span className="font-medium text-gray-700">
                          {p.type === 'virement' ? t('mesDevis.payment.bankTransfer') : p.type === 'cb' ? t('mesDevis.payment.creditCard') : p.type === 'especes' ? t('mesDevis.payment.cash') : p.type === 'cheque' ? t('mesDevis.payment.check') : p.type}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {t('mesDevis.payment.on')} {new Date(p.payment_date).toLocaleDateString(dateLocale)}
                        </span>
                      </div>
                      <span className="font-bold text-green-700 text-lg">
                        {formatPrice(p.amount)}
                      </span>
                    </div>
                  ))}

                  {/* Solde restant */}
                  {data?.dossier?.price_ttc && (
                    <div className="border-t border-green-200 pt-3 mt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t('mesDevis.payment.totalPaid')}</span>
                        <span className="font-semibold text-green-700">
                          {formatPrice(totalPaye)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{t('mesDevis.payment.totalTTC')}</span>
                        <span className="font-semibold text-gray-700">
                          {formatPrice(data.dossier.price_ttc)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-green-100">
                        <div>
                          <span className={isSoldePaid ? "text-green-700 font-medium" : "text-purple-dark font-medium"}>
                            {isSoldePaid ? t('mesDevis.payment.balancePaid') : t('mesDevis.payment.remaining')}
                          </span>
                          {!isSoldePaid && soldeDueDate && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {t('mesDevis.payment.dueBy')} {soldeDueDate.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <span className={`font-bold text-xl ${isSoldePaid ? 'text-green-700' : 'text-purple-dark'}`}>
                          {isSoldePaid ? '✓' : formatPrice(soldeRestant)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bloc Prochaine étape si pending-reservation */}
            {isPendingReservation && (
              <div className="card p-6 bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200">
                <h4 className="font-semibold text-cyan-800 mb-2 flex items-center gap-2">
                  <Info size={18} />
                  {t('mesDevis.payment.nextStep')}
                </h4>
                <p className="text-gray-600">
                  {t('mesDevis.payment.waitingConfirmation')}
                </p>
              </div>
            )}

            {/* Bloc Confirmation fournisseur reçue si bpa-received */}
            {isBpaReceived && (() => {
              const isVirement = (data?.dossier as any)?.payment_method === 'virement'
              const paiements = data?.dossier?.paiements || []
              const totalPaye = paiements.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
              const isPaymentPending = totalPaye === 0 && isVirement

              return (
                <div className="card p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle2 size={18} />
                    {t('mesDevis.payment.reservationConfirmed')}
                    {isPaymentPending && (
                      <span className="text-orange-600 text-sm font-normal ml-2">— {t('mesDevis.payment.waitingPayment')}</span>
                    )}
                  </h4>
                  <p className="text-gray-600">
                    {t('mesDevis.payment.confirmedText')} {isPaymentPending
                      ? t('mesDevis.payment.makeTransfer')
                      : t('mesDevis.payment.willContact')}
                  </p>
                </div>
              )
            })()}

            {devisToShow.map((devis, index) => {
              // isConfirmed = devis accepté et paiement reçu (pending-reservation ou au-delà)
              const isConfirmed = devis.status === 'accepted' && !isPendingPayment
              // isPending = devis accepté mais paiement pas encore effectué
              const isPending = devis.status === 'accepted' && isPendingPayment
              // Trouver le vrai numéro du fournisseur dans la liste originale
              const originalIndex = data.devis.findIndex(d => d.id === devis.id)
              const supplierNum = originalIndex + 1
              const passengers = data?.dossier?.passengers || data?.demande?.passengers || 1
              const pricePerPerson = Math.round(devis.price_ttc / Number(passengers))
              const listAcomptePercent = getEffectiveAcomptePercent(data?.dossier?.departure_date)
              const acompte = Math.round(devis.price_ttc * (listAcomptePercent / 100))

              return (
                <div
                  key={devis.id}
                  className={cn(
                    'card overflow-hidden transition-all hover:shadow-xl',
                    isConfirmed ? 'border-2 border-emerald-500 ring-4 ring-emerald-100' :
                    isPending ? 'border-2 border-orange-400 ring-4 ring-orange-100' :
                    'hover:border-magenta hover:ring-4 hover:ring-magenta/10'
                  )}
                >
                  {/* Badge Best-seller ou Confirmé */}
                  {index === 0 && !isConfirmed && !isPending && !hasSignedContract && (
                    <div className="bg-gradient-to-r from-magenta to-purple text-white text-center py-2 text-sm font-semibold">
                      {t('mesDevis.quote.bestValue')}
                    </div>
                  )}
                  {isConfirmed && (
                    <div className="bg-emerald-500 text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-2">
                      <Check size={16} />
                      {t('mesDevis.quote.confirmedSupplier')}
                    </div>
                  )}
                  {isPending && (
                    <div className="bg-orange-400 text-white text-center py-2 text-sm font-semibold flex items-center justify-center gap-2">
                      <Clock size={16} />
                      {(data?.dossier as any)?.payment_method === 'virement' ? t('mesDevis.quote.waitingTransfer') : t('mesDevis.quote.waitingPaymentBadge')}
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Colonne gauche - Info fournisseur */}
                      <div className="lg:w-1/4 text-center lg:text-left">
                        <div className="flex flex-col items-center lg:items-start gap-3">
                          <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            #{supplierNum}
                          </div>
                          <div>
                            <h3 className="font-display font-bold text-lg text-purple-dark">
                              {devis.transporteur?.number || `${t('mesDevis.quote.supplier')}${supplierNum}`}
                            </h3>
                            <div className="flex items-center justify-center lg:justify-start gap-1 text-sm">
                              <span className="text-yellow-500">{'★'.repeat(Math.floor(devis.transporteur?.rating || 4.5))}</span>
                              <span className="text-gray-500">{devis.transporteur?.rating || 4.5}/5</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Colonne centrale - Détails inclus */}
                      <div className="lg:w-2/4 flex-1">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          {/* Véhicule */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Bus size={16} className="text-purple" />
                              <span className="text-xs text-gray-500 uppercase tracking-wide">{t('mesDevis.quote.vehicleLabel')}</span>
                            </div>
                            <div className="font-semibold text-purple-dark">
                              {getVehicleTypeLabel(devis.vehicle_type)}
                            </div>
                          </div>

                          {/* Capacité */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Users size={16} className="text-purple" />
                              <span className="text-xs text-gray-500 uppercase tracking-wide">{t('mesDevis.quote.capacityLabel')}</span>
                            </div>
                            <div className="font-semibold text-purple-dark">
                              {passengers} {t('mesDevis.quote.passengersUnit')}
                            </div>
                          </div>

                          {/* Nombre de cars */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Truck size={16} className="text-purple" />
                              <span className="text-xs text-gray-500 uppercase tracking-wide">{t('mesDevis.quote.nbCars')}</span>
                            </div>
                            <div className="font-semibold text-purple-dark">
                              {devis.nombre_cars || 1} {(devis.nombre_cars || 1) > 1 ? t('mesDevis.quote.vehiclesUnit') : t('mesDevis.quote.vehicleUnit')}
                            </div>
                          </div>

                          {/* Nombre de chauffeurs */}
                          <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1">
                              <Users size={16} className="text-purple" />
                              <span className="text-xs text-gray-500 uppercase tracking-wide">{t('mesDevis.quote.driversLabel')}</span>
                            </div>
                            <div className="font-semibold text-purple-dark">
                              {devis.nombre_chauffeurs || 1} {(devis.nombre_chauffeurs || 1) > 1 ? t('mesDevis.quote.driversUnit') : t('mesDevis.quote.driverUnit')}
                            </div>
                          </div>
                        </div>

                        {/* Prix par car si plusieurs */}
                        {(devis.nombre_cars || 1) > 1 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-blue-700">{t('mesDevis.quote.pricePerCar')}</span>
                              <span className="font-bold text-blue-800">{formatPrice(devis.price_ttc / (devis.nombre_cars || 1))}</span>
                            </div>
                          </div>
                        )}

                        {/* Ce qui est inclus / non inclus */}
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                          <div className="text-sm font-semibold text-emerald-800 mb-2">{t('mesDevis.quote.included')}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-emerald-700">
                            <div className="flex items-center gap-1">
                              <Check size={14} className="text-emerald-500" />
                              {t('mesDevis.quote.professionalDriver')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Check size={14} className="text-emerald-500" />
                              {t('mesDevis.quote.fuelIncluded')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Check size={14} className="text-emerald-500" />
                              {t('mesDevis.quote.insuranceRC')}
                            </div>
                            {/* Péages - n'afficher que si explicitement défini */}
                            {(devis.options_details as any)?.peages?.status === 'non_inclus' ? (
                              <div className="flex items-center gap-1 text-amber-600">
                                <X size={14} className="text-amber-500" />
                                {t('mesDevis.quote.tollsNotIncluded')}
                              </div>
                            ) : (devis.options_details as any)?.peages?.status === 'inclus' && (
                              <div className="flex items-center gap-1">
                                <Check size={14} className="text-emerald-500" />
                                {t('mesDevis.quote.tollsIncluded')}
                              </div>
                            )}
                            {/* Repas chauffeur - n'afficher que si explicitement défini */}
                            {(devis.options_details as any)?.repas_chauffeur?.status === 'non_inclus' ? (
                              <div className="flex items-center gap-1 text-amber-600">
                                <X size={14} className="text-amber-500" />
                                {t('mesDevis.quote.mealsNotIncluded')}
                              </div>
                            ) : (devis.options_details as any)?.repas_chauffeur?.status === 'inclus' && (
                              <div className="flex items-center gap-1">
                                <Check size={14} className="text-emerald-500" />
                                {t('mesDevis.quote.mealsIncluded')}
                              </div>
                            )}
                            {/* Parking - non inclus par défaut, n'afficher que si explicitement inclus */}
                            {(devis.options_details as any)?.parking?.status === 'inclus' && (
                              <div className="flex items-center gap-1">
                                <Check size={14} className="text-emerald-500" />
                                {t('mesDevis.quote.parkingIncluded')}
                              </div>
                            )}
                            {/* Hébergement - non inclus par défaut, n'afficher que si explicitement inclus */}
                            {(devis.options_details as any)?.hebergement?.status === 'inclus' && (
                              <div className="flex items-center gap-1">
                                <Check size={14} className="text-emerald-500" />
                                {t('mesDevis.quote.accommodationIncluded')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Options et notes visibles pour le client */}
                        {devis.options && (
                          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                            <div className="text-sm font-semibold text-blue-800 mb-1">{t('mesDevis.quote.additionalOptions')}</div>
                            <p className="text-sm text-blue-700">{devis.options}</p>
                          </div>
                        )}

                        {/* Notes visibles client (filtrer les notes internes) */}
                        {devis.client_notes && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <div className="text-sm font-semibold text-amber-800 mb-1">{t('mesDevis.quote.importantNote')}</div>
                            <p className="text-sm text-amber-700">{devis.client_notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Colonne droite - Prix et CTA */}
                      <div className="lg:w-1/4">
                        {/* Badge Offre Flash si promo active */}
                        {(devis as any).promo_expires_at && new Date((devis as any).promo_expires_at) > new Date() && (
                          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-2 px-3 rounded-t-2xl -mb-2">
                            <div className="flex items-center justify-center gap-2 text-sm font-bold">
                              <Zap size={16} className="animate-pulse" />
                              {t('mesDevis.quote.flashOffer')}
                            </div>
                            <div className="mt-1">
                              <CountdownTimer expiresAt={(devis as any).promo_expires_at} />
                            </div>
                          </div>
                        )}
                        {/* Calcul du prix à afficher : si promo expirée, revenir au prix original */}
                        {(() => {
                          const promoExpiresAt = (devis as any).promo_expires_at
                          const promoOriginalPrice = (devis as any).promo_original_price
                          const isPromoActive = promoExpiresAt && new Date(promoExpiresAt) > new Date()
                          // Le devis a été accepté pendant l'offre flash ?
                          const wasAcceptedDuringPromo = devis.accepted_at && promoExpiresAt &&
                            new Date(devis.accepted_at) <= new Date(promoExpiresAt)
                          // Promo expirée uniquement si pas accepté pendant la promo
                          const isPromoExpired = promoExpiresAt && promoOriginalPrice &&
                            new Date(promoExpiresAt) <= new Date() && !wasAcceptedDuringPromo
                          // Si promo expirée (et non accepté pendant promo), le prix affiché est le prix original
                          const displayPrice = isPromoExpired ? promoOriginalPrice : devis.price_ttc
                          const displayPricePerPerson = Math.round(displayPrice / Number(passengers))
                          const effectiveAcomptePercent = getEffectiveAcomptePercent(data?.dossier?.departure_date)
                          const displayAcompte = Math.round(displayPrice * (effectiveAcomptePercent / 100))

                          return (
                            <div className={cn(
                              "bg-gradient-to-br from-purple/5 to-magenta/10 p-5 text-center",
                              isPromoActive
                                ? "rounded-b-2xl border-2 border-orange-400"
                                : "rounded-2xl"
                            )}>
                              {/* Prix principal */}
                              <div className="mb-4">
                                {/* Prix barré si promo active */}
                                {isPromoActive && promoOriginalPrice ? (
                                  <>
                                    <div className="text-lg text-gray-400 line-through mb-1">
                                      {formatPrice(promoOriginalPrice)}
                                    </div>
                                    <div className="font-display text-4xl font-bold text-red-600">
                                      {formatPrice(devis.price_ttc)} <span className="text-lg text-gray-600 font-medium">TTC</span>
                                    </div>
                                    <div className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full mt-1">
                                      <Zap size={12} />
                                      -{formatPrice(promoOriginalPrice - devis.price_ttc)} {t('mesDevis.quote.reduction')}
                                    </div>
                                  </>
                                ) : isPromoExpired ? (
                                  <>
                                    <div className="font-display text-4xl font-bold text-purple-dark">
                                      {formatPrice(promoOriginalPrice)} <span className="text-lg text-gray-600 font-medium">TTC</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      ({t('mesDevis.quote.offerExpired')})
                                    </div>
                                  </>
                                ) : (
                                  <div className="font-display text-4xl font-bold text-purple-dark">
                                    {formatPrice(devis.price_ttc)} <span className="text-lg text-gray-600 font-medium">TTC</span>
                                  </div>
                                )}
                                <div className="text-xs text-gray-500 mt-1">({formatPrice(devis.price_ht)} HT)</div>
                              </div>

                              {/* Prix par personne */}
                              <div className="bg-white/80 rounded-xl p-3 mb-4">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">{t('mesDevis.quote.perPerson')}</div>
                                <div className="font-display text-xl font-bold text-magenta">
                                  {formatPrice(displayPricePerPerson)}
                                </div>
                              </div>

                              {/* Conditions de paiement */}
                              <div className="text-left space-y-2 mb-4 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    {effectiveAcomptePercent === 100 ? t('mesDevis.quote.totalPayment') : `${t('mesDevis.quote.deposit')} (${effectiveAcomptePercent}%)`}
                                  </span>
                                  <span className="font-semibold text-purple-dark">{formatPrice(displayAcompte)}</span>
                                </div>
                                {effectiveAcomptePercent < 100 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-600">{t('mesDevis.quote.balanceBefore')}</span>
                                    <span className="font-semibold text-purple-dark">{formatPrice(displayPrice - displayAcompte)}</span>
                                  </div>
                                )}
                              </div>

                              {/* Validité */}
                              <div className="text-xs text-gray-500 mb-4 flex items-center justify-center gap-1">
                                <Clock size={12} />
                                {isPromoActive
                                  ? t('mesDevis.quote.limitedOffer')
                                  : `${t('mesDevis.quote.validFor')} ${devis.validity_days} ${t('mesDevis.quote.days')}`}
                              </div>

                              {/* Bouton action */}
                              {isConfirmed ? (
                                <button className="btn btn-success w-full" disabled>
                                  <Check size={18} />
                                  {t('mesDevis.quote.confirmed')}
                                </button>
                              ) : isPending ? (
                                <button className="btn btn-warning w-full" disabled>
                                  <Clock size={18} />
                                  {t('mesDevis.quote.waiting')}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSelectQuote(devis, supplierNum)}
                                  className="btn btn-primary w-full text-base py-3"
                                  disabled={!!acceptedDevis || !!clientValidatedDevis}
                                >
                                  {t('mesDevis.quote.chooseQuote')}
                                </button>
                              )}
                            </div>
                          )
                        })()}

                        {/* Voir détails complets + Télécharger PDF */}
                        <div className="flex gap-2 mt-2">
                          <button
                            className="flex-1 btn btn-secondary btn-sm flex items-center justify-center gap-1"
                            onClick={() => setSelectedDevis({ devis, supplierNum })}
                          >
                            <Info size={14} />
                            {t('mesDevis.quote.seeDetails')}
                          </button>
                          <button
                            className="flex-1 btn btn-secondary btn-sm flex items-center justify-center gap-1"
                            onClick={() => {
                              if (data?.dossier) {
                                generateDevisPDF({
                                  ...devis,
                                  options_details: devis.options_details as any || undefined,
                                  dossier: {
                                    ...data.dossier,
                                    departure_time: data.dossier.departure_time || undefined,
                                    return_time: data.dossier.return_time || undefined,
                                  },
                                  commentaires: devis.client_notes || devis.options || undefined,
                                }, (data.dossier.country_code || 'FR').toLowerCase())
                              }
                            }}
                          >
                            <Download size={14} />
                            PDF
                          </button>
                        </div>

                        {/* Bouton Chatter avec ce transporteur */}
                        <button
                          onClick={() => openChatWithSupplier(devis.id, supplierNum)}
                          className="w-full btn btn-secondary btn-sm mt-2 flex items-center justify-center gap-2"
                        >
                          <MessageCircle size={16} />
                          {t('mesDevis.quote.chatWithSupplier')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          )
        })()}

        {/* Contact Box */}
        <div className="gradient-bg rounded-2xl p-8 text-center text-white">
          <h3 className="font-display text-xl font-semibold mb-2">{t('mesDevis.contactBox.title')}</h3>
          <p className="text-white/80 mb-4">{t('mesDevis.contactBox.subtitle')}</p>
          <a
            href={`tel:${country?.phone || '+33176311283'}`}
            className="inline-flex items-center gap-2 text-white font-semibold text-lg hover:opacity-80"
          >
            <Phone size={20} />
            {country?.phoneDisplay || '01 76 31 12 83'}
          </a>
        </div>
      </div>

      {/* Chat Widget */}
      {data.type === 'dossier' && data.dossier && (() => {
        // Vérifier si un contrat est signé (dossier validé avec un fournisseur)
        const hasSignedContract = !!data.dossier?.contract_signed_at
        const acceptedDevisData = data.devis.find(d => d.status === 'accepted')
        const acceptedSupplierIndex = acceptedDevisData ? data.devis.findIndex(d => d.id === acceptedDevisData.id) : -1

        // Si contrat signé, on force le mode single supplier avec le fournisseur validé
        if (hasSignedContract && acceptedDevisData) {
          const validatedSupplier = {
            devisId: acceptedDevisData.id,
            supplierNum: acceptedSupplierIndex + 1,
          }
          return (
            <ChatWidget
              dossierId={data.dossier!.id}
              isClient={true}
              countryCode={data.dossier?.country_code}
              suppliers={[validatedSupplier]}
              externalOpen={chatOpen}
              onOpenChange={(open) => {
                setChatOpen(open)
                if (!open) setChatSupplier(null)
              }}
              preSelectedSupplier={validatedSupplier}
              singleSupplierMode={true}
            />
          )
        }

        // Sinon, mode normal avec tous les fournisseurs
        return (
          <ChatWidget
            dossierId={data.dossier!.id}
            isClient={true}
            countryCode={data.dossier?.country_code}
            suppliers={data.devis.map((d, index) => ({
              devisId: d.id,
              supplierNum: index + 1,
            }))}
            externalOpen={chatOpen}
            onOpenChange={(open) => {
              setChatOpen(open)
              if (!open) setChatSupplier(null)
            }}
            preSelectedSupplier={chatSupplier}
          />
        )
      })()}

      {/* Modal Détails Devis */}
      <Modal
        isOpen={!!selectedDevis}
        onClose={() => setSelectedDevis(null)}
        title={selectedDevis?.devis?.transporteur?.number || `${t('mesDevis.quote.supplier')}${selectedDevis?.supplierNum}`}
        size="lg"
        footer={
          selectedDevis && selectedDevis.devis.status !== 'accepted' && selectedDevis.devis.status !== 'client_validated' && !acceptedDevis && !clientValidatedDevis ? (
            <>
              <button className="btn btn-secondary" onClick={() => setSelectedDevis(null)}>
                {t('mesDevis.modal.close')}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleSelectQuote(selectedDevis.devis, selectedDevis.supplierNum)
                  setSelectedDevis(null)
                }}
              >
                <Check size={18} />
                {t('mesDevis.modal.chooseSupplier')}
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setSelectedDevis(null)}>
              {t('mesDevis.modal.close')}
            </button>
          )
        }
      >
        {selectedDevis && (
          <div className="space-y-6">
            {/* En-tête avec statut */}
            {selectedDevis.devis.status === 'accepted' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                <Check size={24} className="text-emerald-500" />
                <div>
                  <h3 className="font-semibold text-emerald-800">{t('mesDevis.modal.supplierConfirmed')}</h3>
                  <p className="text-sm text-emerald-600">{t('mesDevis.modal.confirmedForTrip')}</p>
                </div>
              </div>
            )}
            {selectedDevis.devis.status === 'client_validated' && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
                <Clock size={24} className="text-orange-500" />
                <div>
                  <h3 className="font-semibold text-orange-800">{t('mesDevis.modal.waitingConfirmation')}</h3>
                  <p className="text-sm text-orange-600">{t('mesDevis.modal.verifyingAvailability')}</p>
                </div>
              </div>
            )}

            {/* Prix principal */}
            <div className="bg-gradient-to-br from-magenta/5 to-purple/5 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                #{selectedDevis.supplierNum}
              </div>
              <div className="font-display text-4xl font-bold text-purple-dark mb-1">
                {formatPrice(selectedDevis.devis.price_ttc)}
              </div>
              <div className="text-gray-500">TTC</div>
              <div className="text-sm text-gray-400">({formatPrice(selectedDevis.devis.price_ht)} HT)</div>
            </div>

            {/* Détails tarification */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
                <Euro size={18} />
                {t('mesDevis.modal.pricingDetails')}
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">{t('mesDevis.modal.priceHT')}</span>
                  <span className="font-semibold text-purple-dark">{formatPrice(selectedDevis.devis.price_ht)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">{t('mesDevis.modal.vat')} (10%)</span>
                  <span className="font-medium">{formatPrice(selectedDevis.devis.price_ttc - selectedDevis.devis.price_ht)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">{t('mesDevis.modal.priceTTC')}</span>
                  <span className="font-bold text-purple-dark">{formatPrice(selectedDevis.devis.price_ttc)}</span>
                </div>
                {(() => {
                  const passengers = data?.dossier?.passengers || data?.demande?.passengers
                  if (passengers && Number(passengers) > 0) {
                    return (
                      <div className="flex justify-between py-2 bg-magenta/10 rounded-lg px-3 -mx-3">
                        <span className="text-magenta font-medium flex items-center gap-2">
                          <Users size={16} />
                          {t('mesDevis.modal.pricePerPerson')}
                        </span>
                        <span className="font-bold text-magenta">
                          {formatPrice(Math.round(selectedDevis.devis.price_ttc / Number(passengers)))}
                        </span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            {/* Véhicule */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
                <Bus size={18} />
                {t('mesDevis.modal.proposedVehicle')}
              </h4>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-magenta/20 to-purple/20 rounded-xl flex items-center justify-center">
                  <Bus size={32} className="text-purple" />
                </div>
                <div>
                  <div className="font-semibold text-purple-dark text-lg">
                    {getVehicleTypeLabel(selectedDevis.devis.vehicle_type)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('mesDevis.modal.adaptedCapacity')}
                  </div>
                </div>
              </div>
            </div>

            {/* Options et commentaires */}
            {selectedDevis.devis.options && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
                  <Info size={18} />
                  {t('mesDevis.modal.includedOptions')}
                </h4>
                <p className="text-gray-700">{selectedDevis.devis.options}</p>
              </div>
            )}

            {/* Notes client (informations commerciales) */}
            {selectedDevis.devis.client_notes && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <MessageCircle size={18} />
                  {t('mesDevis.modal.additionalInfo')}
                </h4>
                <p className="text-blue-700 text-sm">{selectedDevis.devis.client_notes}</p>
              </div>
            )}

            {/* Validité */}
            <div className="text-center text-sm text-gray-500">
              <Clock size={14} className="inline mr-1" />
              {t('mesDevis.modal.quoteValidity')} {selectedDevis.devis.validity_days} {t('mesDevis.quote.days')}
            </div>

            {/* Télécharger le PDF */}
            <button
              onClick={() => {
                if (data?.dossier) {
                  generateDevisPDF({
                    ...selectedDevis.devis,
                    options_details: selectedDevis.devis.options_details as any || undefined,
                    dossier: {
                      ...data.dossier,
                      departure_time: data.dossier.departure_time || undefined,
                      return_time: data.dossier.return_time || undefined,
                    },
                    commentaires: selectedDevis.devis.client_notes || selectedDevis.devis.options || undefined,
                  }, (data.dossier.country_code || 'FR').toLowerCase())
                }
              }}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <Download size={18} />
              {t('mesDevis.modal.downloadPdf')}
            </button>
          </div>
        )}
      </Modal>

      {/* Contract Modal */}
      <Modal
        isOpen={contractModalOpen}
        onClose={() => {
          setContractModalOpen(false)
          setSelectedDevis(null)
          setSelectedOptions({ peages: false, repas_chauffeur: false, parking: false, hebergement: false })
        }}
        title={`📄 ${t('mesDevis.contract.title')}`}
        size="lg"
        footer={null}
      >
        {data.dossier && selectedDevis && (() => {
          // Calcul du total avec options
          const optionsDetails = selectedDevis.devis.options_details as any || {}
          const nbChauffeurs = selectedDevis.devis.nombre_chauffeurs || 1
          const nbNuits = optionsDetails.hebergement?.nuits || 0

          // Calculer le nombre de jours pour les repas
          const dureeJours = selectedDevis.devis.duree_jours || (() => {
            // Fallback: calculer depuis les dates du dossier
            if (data?.dossier?.return_date && data?.dossier?.departure_date) {
              const depDate = new Date(data.dossier.departure_date)
              const retDate = new Date(data.dossier.return_date)
              return Math.max(1, Math.ceil((retDate.getTime() - depDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)
            }
            return 1
          })()
          const nbRepas = dureeJours * 2 // 2 repas par jour

          let optionsTotal = 0
          if (selectedOptions.peages && optionsDetails.peages?.status === 'non_inclus') {
            optionsTotal += optionsDetails.peages.montant || 0
          }
          if (selectedOptions.repas_chauffeur && optionsDetails.repas_chauffeur?.status === 'non_inclus') {
            // Calcul: jours × 2 repas × prix unitaire × nb chauffeurs
            optionsTotal += (optionsDetails.repas_chauffeur.montant || 0) * nbRepas * nbChauffeurs
          }
          if (selectedOptions.parking && optionsDetails.parking?.status === 'non_inclus') {
            optionsTotal += optionsDetails.parking.montant || 0
          }
          if (selectedOptions.hebergement && optionsDetails.hebergement?.status === 'non_inclus') {
            optionsTotal += (optionsDetails.hebergement.montant || 0) * nbNuits * nbChauffeurs
          }

          const totalTTC = selectedDevis.devis.price_ttc + optionsTotal
          const modalAcomptePercent = getEffectiveAcomptePercent(data?.dossier?.departure_date)
          const acompte = Math.round(totalTTC * (modalAcomptePercent / 100))
          const solde = totalTTC - acompte

          return (
            <>
              {/* 1. SIGNATURE ÉLECTRONIQUE EN HAUT */}
              <div className="border-2 border-purple-200 bg-purple-50 rounded-xl p-6 mb-6">
                <h3 className="text-center font-semibold text-purple-dark mb-4">{t('mesDevis.contract.electronicSignature')}</h3>

                {/* Identité du signataire */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label text-sm">{t('mesDevis.contract.firstName')} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={cn('input', !signataire.firstName && 'border-red-300')}
                      placeholder={t('mesDevis.contract.firstNamePlaceholder')}
                      value={signataire.firstName}
                      onChange={(e) => setSignataire({ ...signataire, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-sm">{t('mesDevis.contract.lastName')} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={cn('input', !signataire.lastName && 'border-red-300')}
                      placeholder={t('mesDevis.contract.lastNamePlaceholder')}
                      value={signataire.lastName}
                      onChange={(e) => setSignataire({ ...signataire, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Info signature */}
                <div className="bg-white rounded-lg p-3 text-xs text-gray-500">
                  <p className="flex justify-between mb-1">
                    <span>{t('mesDevis.contract.signatureDate')} :</span>
                    <span className="font-mono">{new Date().toLocaleString(dateLocale)}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>{t('mesDevis.contract.ipAddress')} :</span>
                    <span className="font-mono">{clientIp || t('mesDevis.contract.fetching')}</span>
                  </p>
                </div>
              </div>

              {/* 2. ADRESSE DE FACTURATION */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-purple-dark mb-4">
                  {t('mesDevis.contract.billingAddress')} <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label text-sm">{t('mesDevis.contract.address')} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={cn('input', !billingInfo.address && 'border-red-300')}
                      placeholder={t('mesDevis.contract.addressPlaceholder')}
                      value={billingInfo.address}
                      onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-sm">{t('mesDevis.contract.zipCode')} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={cn('input', !billingInfo.zip && 'border-red-300')}
                      placeholder={t('mesDevis.contract.zipPlaceholder')}
                      value={billingInfo.zip}
                      onChange={(e) => setBillingInfo({ ...billingInfo, zip: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-sm">{t('mesDevis.contract.city')} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className={cn('input', !billingInfo.city && 'border-red-300')}
                      placeholder={t('mesDevis.contract.cityPlaceholder')}
                      value={billingInfo.city}
                      onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-sm">{t('mesDevis.contract.country')}</label>
                    <input
                      type="text"
                      className="input"
                      value={billingInfo.country}
                      onChange={(e) => setBillingInfo({ ...billingInfo, country: e.target.value })}
                    />
                  </div>
                </div>

                {/* Section Facturation électronique (optionnel) */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      const section = document.getElementById('e-invoice-section')
                      if (section) section.classList.toggle('hidden')
                    }}
                    className="text-sm text-purple hover:text-magenta flex items-center gap-2"
                  >
                    <FileText size={16} />
                    {t('mesDevis.contract.eInvoiceSection', 'Facturation électronique (B2B / B2G)')}
                    <ChevronDown size={16} />
                  </button>
                  <div id="e-invoice-section" className="hidden mt-3 space-y-3 bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 mb-3">
                      {t('mesDevis.contract.eInvoiceHelp', 'Renseignez ces informations si vous êtes une entreprise ou une administration.')}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label text-sm">{t('mesDevis.contract.vatNumber', 'N° TVA (optionnel)')}</label>
                        <input
                          type="text"
                          className="input"
                          placeholder={data?.dossier?.country_code === 'FR' ? 'FR12 345678901' : data?.dossier?.country_code === 'ES' ? 'ESB12345678' : data?.dossier?.country_code === 'GB' ? 'GB123456789' : 'DE123456789'}
                          value={billingInfo.vatNumber}
                          onChange={(e) => setBillingInfo({ ...billingInfo, vatNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="label text-sm">{t('mesDevis.contract.orderReference', 'Réf. commande')}</label>
                        <input
                          type="text"
                          className="input"
                          placeholder={t('mesDevis.contract.orderReferencePlaceholder', 'BC-2024-XXX')}
                          value={billingInfo.orderReference}
                          onChange={(e) => setBillingInfo({ ...billingInfo, orderReference: e.target.value })}
                        />
                      </div>
                    </div>
                    {/* Leitweg-ID pour Allemagne */}
                    {data?.dossier?.country_code === 'DE' && (
                      <div>
                        <label className="label text-sm">{t('mesDevis.contract.leitwegId', 'Leitweg-ID (facturation publique DE)')}</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="04011000-1234567890-12"
                          value={billingInfo.leitwegId}
                          onChange={(e) => setBillingInfo({ ...billingInfo, leitwegId: e.target.value })}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {t('mesDevis.contract.leitwegIdHelp', 'Requis pour la facturation aux administrations allemandes (XRechnung)')}
                        </p>
                      </div>
                    )}
                    {/* Code DIR3 pour Espagne */}
                    {data?.dossier?.country_code === 'ES' && (
                      <div>
                        <label className="label text-sm">{t('mesDevis.contract.dir3Code', 'Code DIR3 (facturation publique ES)')}</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="L01234567"
                          value={billingInfo.dir3Code}
                          onChange={(e) => setBillingInfo({ ...billingInfo, dir3Code: e.target.value })}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {t('mesDevis.contract.dir3CodeHelp', 'Requis pour la facturation aux administrations espagnoles (FACe)')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. OPTIONS SUPPLÉMENTAIRES (cliquables) */}
              {(optionsDetails.peages?.status === 'non_inclus' ||
                optionsDetails.repas_chauffeur?.status === 'non_inclus' ||
                optionsDetails.parking?.status === 'non_inclus' ||
                optionsDetails.hebergement?.status === 'non_inclus') && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-amber-800 mb-4">{t('mesDevis.contract.additionalOptions')}</h3>
                  <p className="text-sm text-amber-700 mb-4">{t('mesDevis.contract.selectOptions')}</p>

                  <div className="space-y-3">
                    {/* Péages */}
                    {optionsDetails.peages?.status === 'non_inclus' && optionsDetails.peages?.montant > 0 && (
                      <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 cursor-pointer hover:border-amber-400 transition">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedOptions.peages}
                            onChange={(e) => setSelectedOptions({ ...selectedOptions, peages: e.target.checked })}
                            className="w-5 h-5 accent-amber-500"
                          />
                          <span className="font-medium">{t('mesDevis.contract.tolls')}</span>
                        </div>
                        <span className="font-semibold text-amber-700">+{formatPrice(optionsDetails.peages.montant)}</span>
                      </label>
                    )}

                    {/* Repas chauffeur */}
                    {optionsDetails.repas_chauffeur?.status === 'non_inclus' && optionsDetails.repas_chauffeur?.montant > 0 && (
                      <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 cursor-pointer hover:border-amber-400 transition">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedOptions.repas_chauffeur}
                            onChange={(e) => setSelectedOptions({ ...selectedOptions, repas_chauffeur: e.target.checked })}
                            className="w-5 h-5 accent-amber-500"
                          />
                          <div>
                            <span className="font-medium">{t('mesDevis.contract.driverMeals')}</span>
                            <span className="text-xs text-gray-500 ml-2">({formatPrice(optionsDetails.repas_chauffeur.montant)}/{t('mesDevis.contract.meal')} × {nbRepas} {t('mesDevis.contract.meals')} × {nbChauffeurs} {t('mesDevis.contract.driver')}{nbChauffeurs > 1 ? 's' : ''})</span>
                          </div>
                        </div>
                        <span className="font-semibold text-amber-700">+{formatPrice(optionsDetails.repas_chauffeur.montant * nbRepas * nbChauffeurs)}</span>
                      </label>
                    )}

                    {/* Parking */}
                    {optionsDetails.parking?.status === 'non_inclus' && optionsDetails.parking?.montant > 0 && (
                      <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 cursor-pointer hover:border-amber-400 transition">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedOptions.parking}
                            onChange={(e) => setSelectedOptions({ ...selectedOptions, parking: e.target.checked })}
                            className="w-5 h-5 accent-amber-500"
                          />
                          <span className="font-medium">{t('mesDevis.contract.parking')}</span>
                        </div>
                        <span className="font-semibold text-amber-700">+{formatPrice(optionsDetails.parking.montant)}</span>
                      </label>
                    )}

                    {/* Hébergement */}
                    {optionsDetails.hebergement?.status === 'non_inclus' && optionsDetails.hebergement?.montant > 0 && nbNuits > 0 && (
                      <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 cursor-pointer hover:border-amber-400 transition">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedOptions.hebergement}
                            onChange={(e) => setSelectedOptions({ ...selectedOptions, hebergement: e.target.checked })}
                            className="w-5 h-5 accent-amber-500"
                          />
                          <div>
                            <span className="font-medium">{t('mesDevis.contract.driverAccommodation')}</span>
                            <span className="text-xs text-gray-500 ml-2">({formatPrice(optionsDetails.hebergement.montant)}/{t('mesDevis.contract.night')} x {nbNuits} {t('mesDevis.contract.nights')} x {nbChauffeurs} {t('mesDevis.contract.driver')}{nbChauffeurs > 1 ? 's' : ''})</span>
                          </div>
                        </div>
                        <span className="font-semibold text-amber-700">+{formatPrice(optionsDetails.hebergement.montant * nbNuits * nbChauffeurs)}</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* 4. MOYEN DE PAIEMENT */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-purple-dark mb-4">
                  {t('mesDevis.contract.paymentMethod')} <span className="text-red-500">*</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cb')}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      paymentMethod === 'cb'
                        ? 'border-magenta bg-magenta/5 ring-2 ring-magenta/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">💳</span>
                      <span className="font-semibold text-purple-dark">{t('mesDevis.contract.creditCard')}</span>
                    </div>
                    <p className="text-sm text-gray-500">{t('mesDevis.contract.securePayment')}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('virement')}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all',
                      paymentMethod === 'virement'
                        ? 'border-magenta bg-magenta/5 ring-2 ring-magenta/20'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🏦</span>
                      <span className="font-semibold text-purple-dark">{t('mesDevis.contract.bankTransfer')}</span>
                    </div>
                    <p className="text-sm text-gray-500">{t('mesDevis.contract.ribOnProforma')}</p>
                  </button>
                </div>

                {/* Afficher le RIB si virement sélectionné */}
                {paymentMethod === 'virement' && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-semibold text-blue-800 mb-2">{t('mesDevis.contract.bankDetails')} :</p>
                    <div className="text-sm text-blue-700 font-mono">
                      <p>IBAN: {country?.bankIban || 'FR76 3000 4015 9600 0101 0820 195'}</p>
                      <p>BIC: {country?.bankBic || 'BNPAFRPPXXX'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. RÉCAPITULATIF PRIX ET VALIDATION EN BAS */}
              <div className="bg-gradient-to-r from-purple/10 to-magenta/10 rounded-xl p-6">
                {/* Résumé du prix */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('mesDevis.contract.basePriceTTC')}</span>
                    <span className="font-medium">{formatPrice(selectedDevis.devis.price_ttc)}</span>
                  </div>
                  {optionsTotal > 0 && (
                    <div className="flex justify-between text-sm text-amber-700">
                      <span>{t('mesDevis.contract.selectedOptions')}</span>
                      <span className="font-medium">+{formatPrice(optionsTotal)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 flex justify-between">
                    <span className="font-semibold text-lg text-purple-dark">{t('mesDevis.contract.totalTTC')}</span>
                    <span className="font-bold text-2xl text-purple-dark">{formatPrice(totalTTC)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{modalAcomptePercent === 100 ? t('mesDevis.contract.fullPayment') : `${t('mesDevis.contract.deposit')} (${modalAcomptePercent}%)`}</span>
                    <span className="font-semibold">{formatPrice(acompte)}</span>
                  </div>
                  {modalAcomptePercent < 100 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{t('mesDevis.contract.balanceBeforeDeparture')}</span>
                      <span>{formatPrice(solde)}</span>
                    </div>
                  )}
                </div>

                {/* Checkbox acceptation */}
                <label className="flex items-start gap-3 cursor-pointer mb-4 p-3 bg-white rounded-lg">
                  <input
                    type="checkbox"
                    checked={contractAccepted}
                    onChange={(e) => setContractAccepted(e.target.checked)}
                    className="w-5 h-5 accent-magenta mt-0.5"
                  />
                  <span className="text-sm">
                    {t('mesDevis.contract.acceptTerms')} <a href="/cgv" target="_blank" className="text-magenta underline">{t('mesDevis.contract.termsLink')}</a>
                  </span>
                </label>

                {/* Boutons */}
                <div className="flex gap-3">
                  <button
                    className="btn btn-secondary flex-1"
                    onClick={() => {
                      setContractModalOpen(false)
                      setSelectedDevis(null)
                      setSelectedOptions({ peages: false, repas_chauffeur: false, parking: false, hebergement: false })
                    }}
                  >
                    {t('mesDevis.contract.cancel')}
                  </button>
                  <button
                    className="btn btn-success flex-1 text-lg py-3"
                    onClick={handleSignContract}
                    disabled={!isSignatureFormValid()}
                  >
                    <Check size={20} />
                    {t('mesDevis.contract.signContract')}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-3">
                  {t('mesDevis.contract.signatureDisclaimer')}
                </p>
              </div>
            </>
          )
        })()}
      </Modal>
    </div>
  )
}
