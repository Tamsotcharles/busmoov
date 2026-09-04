import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { generateChauffeurToken } from '@/hooks/useSupabase'
import {
  Phone,
  Mail,
  Send,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  Search,
  Settings,
  Play,
  Bookmark,
  BookmarkCheck,
  Eye,
  MessageSquare,
  Euro,
  MapPin,
  X,
  Truck,
  Paperclip,
} from 'lucide-react'
import { formatDate, formatPrice, cn, generateInfosVoyageUrl, generatePaymentUrl, generateClientAccessUrl, getLanguageFromCountry, getSiteBaseUrl, getStatutEffectif, etatFournisseur, labelEtatFournisseur } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'

// Types
interface DossierRelance {
  id: string
  reference: string
  client_name: string
  client_email: string
  client_phone: string | null
  departure: string
  arrival: string
  departure_date: string
  return_date: string | null
  passengers: number
  price_ttc: number | null
  status: string
  contract_signed_at: string | null
  created_at: string
  transporteur_id: string | null
  transporteur_name?: string | null
  etat_frs?: 'confirme' | 'attente_bpa' | 'attente_validate'
  country_code: string | null
  // Computed fields
  jours_avant_depart: number
  total_paye: number
  solde_restant: number
  derniere_relance: string | null
  nb_relances: number
  // Chauffeur fields
  bpa_received: boolean
  voyage_info_validated: boolean
  chauffeur_info_received: boolean
  demande_chauffeur_pending: boolean
}

interface RequetePredefinie {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
  filter: (dossier: DossierRelance, aujourdhui: Date) => boolean
  priority: 'high' | 'medium' | 'low'
  actionType: 'infos_voyage' | 'solde' | 'acompte' | 'confirmation' | 'demande_chauffeur' | 'custom'
}

// Requêtes prédéfinies
const REQUETES_PREDEFINIES: RequetePredefinie[] = [
  {
    id: 'infos_voyage_urgentes',
    name: 'Infos voyage urgentes',
    description: 'Dossiers en attente d\'infos voyage, départ dans moins de 7 jours',
    icon: <AlertTriangle size={18} />,
    color: 'red',
    priority: 'high',
    actionType: 'infos_voyage',
    filter: (d, today) => {
      const joursAvant = d.jours_avant_depart
      return d.status === 'pending-info' && joursAvant >= 0 && joursAvant <= 7
    },
  },
  {
    id: 'infos_voyage_semaine',
    name: 'Infos voyage cette semaine',
    description: 'Dossiers en attente d\'infos voyage, départ dans 7-14 jours',
    icon: <FileText size={18} />,
    color: 'orange',
    priority: 'medium',
    actionType: 'infos_voyage',
    filter: (d, today) => {
      const joursAvant = d.jours_avant_depart
      return d.status === 'pending-info' && joursAvant > 7 && joursAvant <= 14
    },
  },
  {
    id: 'solde_urgent',
    name: 'Solde à régler urgent',
    description: 'Solde dû, départ dans moins de 45 jours',
    icon: <Euro size={18} />,
    color: 'red',
    priority: 'high',
    actionType: 'solde',
    filter: (d) => {
      // Solde = acompte déjà encaissé (total_paye > 0) et il reste le solde.
      const joursAvant = d.jours_avant_depart
      return d.total_paye > 0 && d.solde_restant > 0 && joursAvant >= 0 && joursAvant <= 45
    },
  },
  {
    id: 'solde_rappel',
    name: 'Rappel solde',
    description: 'Solde dû, départ dans 45-60 jours',
    icon: <Euro size={18} />,
    color: 'orange',
    priority: 'medium',
    actionType: 'solde',
    filter: (d) => {
      // Idem solde urgent, fenêtre 45-60 j.
      const joursAvant = d.jours_avant_depart
      return d.total_paye > 0 && d.solde_restant > 0 && joursAvant > 45 && joursAvant <= 60
    },
  },
  {
    id: 'acompte_attente',
    name: 'Paiement en attente',
    description: 'Contrat signé, aucun paiement reçu (acompte ou totalité)',
    icon: <Clock size={18} />,
    color: 'orange',
    priority: 'medium',
    actionType: 'acompte',
    filter: (d) => {
      // Basé sur le paiement réel, pas sur le statut brut (souvent figé).
      // Signé + rien encaissé + reste à payer = stade « paiement en attente ».
      return !!d.contract_signed_at && d.total_paye === 0 && d.solde_restant > 0
    },
  },
  {
    id: 'confirmation_fournisseur',
    name: 'Confirmation fournisseur',
    description: 'Dossiers en attente de confirmation fournisseur depuis plus de 2 jours',
    icon: <Users size={18} />,
    color: 'blue',
    priority: 'medium',
    actionType: 'confirmation',
    filter: (d, today) => {
      return d.status === 'pending-reservation'
    },
  },
  {
    id: 'demande_chauffeur_j3',
    name: 'Demande chauffeur J-3',
    description: 'Dossiers éligibles pour demande chauffeur (BPA reçu, infos voyage envoyées, départ J-3)',
    icon: <Truck size={18} />,
    color: 'indigo',
    priority: 'high',
    actionType: 'demande_chauffeur',
    filter: (d, today) => {
      const joursAvant = d.jours_avant_depart
      // Conditions: départ dans 3 jours, BPA reçu, infos voyage validées, pas déjà d'infos chauffeur, pas de demande pending
      return joursAvant >= 0 && joursAvant <= 3 &&
             d.bpa_received &&
             d.voyage_info_validated &&
             !d.chauffeur_info_received &&
             !d.demande_chauffeur_pending &&
             d.transporteur_id !== null
    },
  },
  {
    id: 'departs_semaine',
    name: 'Départs cette semaine',
    description: 'Tous les dossiers avec départ dans les 7 prochains jours',
    icon: <Calendar size={18} />,
    color: 'purple',
    priority: 'high',
    actionType: 'custom',
    filter: (d, today) => {
      const joursAvant = d.jours_avant_depart
      return joursAvant >= 0 && joursAvant <= 7 && d.status !== 'completed' && d.status !== 'cancelled'
    },
  },
  {
    id: 'departs_mois',
    name: 'Départs ce mois',
    description: 'Tous les dossiers avec départ dans les 30 prochains jours',
    icon: <Calendar size={18} />,
    color: 'indigo',
    priority: 'low',
    actionType: 'custom',
    filter: (d, today) => {
      const joursAvant = d.jours_avant_depart
      return joursAvant >= 0 && joursAvant <= 30 && d.status !== 'completed' && d.status !== 'cancelled'
    },
  },
]

// Templates de messages de relance
const TEMPLATES_RELANCE: Record<string, { subject: string; body: string }> = {
  infos_voyage: {
    subject: 'Rappel : Informations voyage à compléter - {reference}',
    body: `Bonjour {client_name},

Votre voyage {departure} → {arrival} est prévu le {departure_date}.

Afin de finaliser votre réservation, nous avons besoin de vos informations de voyage (adresses exactes, horaires, contact sur place).

👉 Complétez vos informations : {lien_infos_voyage}

Notre équipe reste à votre disposition pour toute question.

Cordialement,
L'équipe Busmoov`,
  },
  demande_chauffeur: {
    subject: 'Demande d\'informations chauffeur - {reference}',
    body: `Bonjour,

Nous vous contactons concernant le dossier {reference}.

Voyage prévu : {departure} → {arrival}
Date de départ : {departure_date}
Passagers : {passengers}

Merci de nous communiquer les informations du/des chauffeur(s) affecté(s) à cette mission :
- Nom et prénom du chauffeur
- Numéro de téléphone
- Immatriculation du véhicule (optionnel)

👉 Remplir les informations : {lien_chauffeur}

Cordialement,
L'équipe Busmoov`,
  },
  solde: {
    subject: 'Rappel : Solde à régler - {reference}',
    body: `Bonjour {client_name},

Votre voyage {departure} → {arrival} est prévu le {departure_date}.

Nous vous rappelons que le solde de {solde_restant} € reste à régler avant le départ.

👉 Réglez votre solde : {lien_paiement}

Merci de votre confiance.

Cordialement,
L'équipe Busmoov`,
  },
  acompte: {
    subject: 'Rappel : Acompte en attente - {reference}',
    body: `Bonjour {client_name},

Vous avez signé votre contrat pour le voyage {departure} → {arrival} prévu le {departure_date}.

L'acompte de {acompte} € est en attente de règlement pour confirmer définitivement votre réservation.

👉 Réglez votre acompte : {lien_paiement}

Sans règlement sous 48h, votre réservation pourra être annulée.

Cordialement,
L'équipe Busmoov`,
  },
  confirmation: {
    subject: 'Votre réservation - {reference}',
    body: `Bonjour {client_name},

Nous revenons vers vous concernant votre voyage {departure} → {arrival} prévu le {departure_date}.

Nous sommes en cours de finalisation avec notre partenaire transporteur et reviendrons vers vous très prochainement.

N'hésitez pas à nous contacter si vous avez des questions.

Cordialement,
L'équipe Busmoov`,
  },
}

// Interface pour les filtres manuels
interface FiltresPersonnalises {
  statuts: string[]
  joursAvantDepartMin: number | null
  joursAvantDepartMax: number | null
  soldeMinimum: number | null
  villeDepart: string
  villeArrivee: string
  sansRelanceDepuis: number | null // jours
}

const FILTRES_VIDES: FiltresPersonnalises = {
  statuts: [],
  joursAvantDepartMin: null,
  joursAvantDepartMax: null,
  soldeMinimum: null,
  villeDepart: '',
  villeArrivee: '',
  sansRelanceDepuis: null,
}

const STATUTS_OPTIONS = [
  { value: 'pending-payment', label: 'Attente acompte' },
  { value: 'pending-reservation', label: 'Attente réservation' },
  { value: 'bpa-received', label: 'BPA reçu' },
  { value: 'pending-info', label: 'Attente infos voyage' },
  { value: 'pending-driver', label: 'Attente chauffeur' },
  { value: 'confirmed', label: 'Confirmé' },
]

interface ServiceClientelePageProps {
  onNavigateToDossier?: (dossierId: string) => void
}

export function ServiceClientelePage({ onNavigateToDossier }: ServiceClientelePageProps) {
  const queryClient = useQueryClient()
  const [dossiers, setDossiers] = useState<DossierRelance[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequete, setSelectedRequete] = useState<string | null>(null)
  const [selectedDossiers, setSelectedDossiers] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [showRelanceModal, setShowRelanceModal] = useState(false)
  const [relanceType, setRelanceType] = useState<'email' | 'sms'>('email')
  const [relanceSubject, setRelanceSubject] = useState('')

  // Filtres personnalisés
  const [showFiltresPanel, setShowFiltresPanel] = useState(false)
  const [filtresPersonnalises, setFiltresPersonnalises] = useState<FiltresPersonnalises>(FILTRES_VIDES)
  const [filtresActifs, setFiltresActifs] = useState(false)
  const [relanceBody, setRelanceBody] = useState('')
  const [sending, setSending] = useState(false)
  const [expandedDossier, setExpandedDossier] = useState<string | null>(null)
  const [showDossierModal, setShowDossierModal] = useState(false)
  const [selectedDossierDetail, setSelectedDossierDetail] = useState<DossierRelance | null>(null)
  const [generatedChauffeurLink, setGeneratedChauffeurLink] = useState<string | null>(null)
  const [creatingDemandeChauffeur, setCreatingDemandeChauffeur] = useState(false)

  const aujourdhui = useMemo(() => new Date(), [])

  // Charger les dossiers avec leurs paiements et relances
  const loadDossiers = async () => {
    setLoading(true)
    try {
      // Charger tous les dossiers validés (avec contrat signé)
      const { data: dossiersData, error } = await supabase
        .from('dossiers')
        .select('*, transporteur:transporteurs(name)')
        .not('contract_signed_at', 'is', null)
        .not('status', 'eq', 'completed')
        .not('status', 'eq', 'cancelled')
        .order('departure_date', { ascending: true })

      if (error) throw error

      // Charger les paiements pour chaque dossier
      const { data: paiementsData } = await supabase
        .from('paiements')
        .select('dossier_id, amount')

      // Charger les dernières relances (depuis timeline)
      const { data: relancesData } = await supabase
        .from('timeline')
        .select('dossier_id, created_at, content')
        .eq('type', 'relance')
        .order('created_at', { ascending: false })

      // Charger les voyage_infos pour vérifier validated_at et chauffeur_info_recue_at
      const { data: voyageInfosData } = await supabase
        .from('voyage_infos')
        .select('dossier_id, validated_at, chauffeur_info_recue_at')

      // Charger les demandes_fournisseurs pour vérifier bpa_received_at ou status = 'bpa_received'
      const { data: demandesFournisseursData } = await supabase
        .from('demandes_fournisseurs')
        .select('dossier_id, bpa_received_at, status')

      // Charger les demandes_chauffeur pending
      const { data: demandesChauffeurData } = await supabase
        .from('demandes_chauffeur')
        .select('dossier_id, status')
        .eq('status', 'pending')

      // Mapper les données
      const paiementsMap = new Map<string, number>()
      const relancesMap = new Map<string, { date: string; count: number }>()
      const voyageInfosMap = new Map<string, { validated: boolean; chauffeurReceived: boolean }>()
      const bpaReceivedMap = new Set<string>()
      const demandeChauffeurPendingMap = new Set<string>()

      paiementsData?.forEach(p => {
        if (!p.dossier_id) return
        const current = paiementsMap.get(p.dossier_id) || 0
        paiementsMap.set(p.dossier_id, current + (p.amount || 0))
      })

      relancesData?.forEach(r => {
        if (!r.dossier_id || !r.created_at) return
        if (!relancesMap.has(r.dossier_id)) {
          relancesMap.set(r.dossier_id, { date: r.created_at, count: 1 })
        } else {
          const current = relancesMap.get(r.dossier_id)!
          current.count++
        }
      })

      // Mapper voyage_infos
      voyageInfosData?.forEach(vi => {
        if (!vi.dossier_id) return
        voyageInfosMap.set(vi.dossier_id, {
          validated: !!vi.validated_at,
          chauffeurReceived: !!vi.chauffeur_info_recue_at
        })
      })

      // Mapper BPA received (vérifie bpa_received_at OU status = 'bpa_received')
      demandesFournisseursData?.forEach(df => {
        if (df.dossier_id && (df.bpa_received_at || df.status === 'bpa_received')) {
          bpaReceivedMap.add(df.dossier_id)
        }
      })

      // Etat fournisseur a 3 temps par dossier (attente_validate / attente_bpa
      // / confirme), a partir de toutes ses demandes.
      const demandesParDossier = new Map<string, { status?: string | null; bpa_received_at?: string | null }[]>()
      demandesFournisseursData?.forEach(df => {
        if (!df.dossier_id) return
        const arr = demandesParDossier.get(df.dossier_id) || []
        arr.push(df)
        demandesParDossier.set(df.dossier_id, arr)
      })

      // Mapper demandes chauffeur pending
      demandesChauffeurData?.forEach(dc => {
        if (dc.dossier_id) {
          demandeChauffeurPendingMap.add(dc.dossier_id)
        }
      })

      const enrichedDossiers: DossierRelance[] = (dossiersData || [])
        .filter(d => d.status) // Filter out dossiers without status
        .map(d => {
          const departureDate = new Date(d.departure_date)
          const joursAvant = Math.ceil((departureDate.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24))
          const totalPaye = paiementsMap.get(d.id) || 0
          const soldeRestant = (d.price_ttc || 0) - totalPaye
          const relanceInfo = relancesMap.get(d.id)
          const voyageInfo = voyageInfosMap.get(d.id)

          return {
            id: d.id,
            reference: d.reference,
            client_name: d.client_name,
            client_email: d.client_email,
            client_phone: d.client_phone,
            departure: d.departure,
            arrival: d.arrival,
            departure_date: d.departure_date,
            return_date: d.return_date,
            passengers: d.passengers,
            price_ttc: d.price_ttc,
            status: d.status!, // We filtered above
            contract_signed_at: d.contract_signed_at,
            created_at: d.created_at || new Date().toISOString(),
            transporteur_id: d.transporteur_id,
            transporteur_name: (d as any).transporteur?.name || null,
            etat_frs: etatFournisseur(demandesParDossier.get(d.id) || []),
            country_code: d.country_code || null,
            jours_avant_depart: joursAvant,
            total_paye: totalPaye,
            solde_restant: soldeRestant,
            derniere_relance: relanceInfo?.date || null,
            nb_relances: relanceInfo?.count || 0,
            // Chauffeur fields
            bpa_received: bpaReceivedMap.has(d.id),
            voyage_info_validated: voyageInfo?.validated || false,
            chauffeur_info_received: voyageInfo?.chauffeurReceived || false,
            demande_chauffeur_pending: demandeChauffeurPendingMap.has(d.id),
          }
        })

      setDossiers(enrichedDossiers)
    } catch (error) {
      console.error('Erreur chargement dossiers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDossiers()
  }, [])

  // Filtrer les dossiers selon la requête sélectionnée
  const dossiersFiltres = useMemo(() => {
    let filtered = dossiers

    // Appliquer le filtre de la requête prédéfinie (seulement si pas de filtres personnalisés actifs)
    if (selectedRequete && !filtresActifs) {
      const requete = REQUETES_PREDEFINIES.find(r => r.id === selectedRequete)
      if (requete) {
        filtered = filtered.filter(d => requete.filter(d, aujourdhui))
      }
    }

    // Appliquer les filtres personnalisés
    if (filtresActifs) {
      const f = filtresPersonnalises

      // Filtre par statuts
      if (f.statuts.length > 0) {
        filtered = filtered.filter(d => f.statuts.includes(d.status))
      }

      // Filtre par jours avant départ (min)
      if (f.joursAvantDepartMin !== null) {
        filtered = filtered.filter(d => d.jours_avant_depart >= f.joursAvantDepartMin!)
      }

      // Filtre par jours avant départ (max)
      if (f.joursAvantDepartMax !== null) {
        filtered = filtered.filter(d => d.jours_avant_depart <= f.joursAvantDepartMax!)
      }

      // Filtre par solde minimum
      if (f.soldeMinimum !== null) {
        filtered = filtered.filter(d => d.solde_restant >= f.soldeMinimum!)
      }

      // Filtre par ville de départ
      if (f.villeDepart.trim()) {
        const term = f.villeDepart.toLowerCase().trim()
        filtered = filtered.filter(d => d.departure.toLowerCase().includes(term))
      }

      // Filtre par ville d'arrivée
      if (f.villeArrivee.trim()) {
        const term = f.villeArrivee.toLowerCase().trim()
        filtered = filtered.filter(d => d.arrival.toLowerCase().includes(term))
      }

      // Filtre par dernière relance (sans relance depuis X jours)
      if (f.sansRelanceDepuis !== null) {
        const limitDate = new Date()
        limitDate.setDate(limitDate.getDate() - f.sansRelanceDepuis)
        filtered = filtered.filter(d => {
          if (!d.derniere_relance) return true // Jamais relancé
          return new Date(d.derniere_relance) < limitDate
        })
      }
    }

    // Appliquer la recherche textuelle
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(d =>
        d.reference.toLowerCase().includes(term) ||
        d.client_name.toLowerCase().includes(term) ||
        d.client_email.toLowerCase().includes(term) ||
        d.departure.toLowerCase().includes(term) ||
        d.arrival.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [dossiers, selectedRequete, searchTerm, aujourdhui, filtresActifs, filtresPersonnalises])

  // Compter les dossiers par requête
  const compteurRequetes = useMemo(() => {
    const counts: Record<string, number> = {}
    REQUETES_PREDEFINIES.forEach(requete => {
      counts[requete.id] = dossiers.filter(d => requete.filter(d, aujourdhui)).length
    })
    return counts
  }, [dossiers, aujourdhui])

  // Sélectionner/désélectionner tous les dossiers filtrés
  const toggleSelectAll = () => {
    if (selectedDossiers.size === dossiersFiltres.length) {
      setSelectedDossiers(new Set())
    } else {
      setSelectedDossiers(new Set(dossiersFiltres.map(d => d.id)))
    }
  }

  // Ouvrir la modal de relance
  const openRelanceModal = (actionType?: string, chauffeurLink?: string) => {
    const template = actionType ? TEMPLATES_RELANCE[actionType] : TEMPLATES_RELANCE.infos_voyage
    if (template) {
      let body = template.body
      // Si on a un lien chauffeur généré, le remplacer dans le template
      if (chauffeurLink && actionType === 'demande_chauffeur') {
        body = body.replace('{lien_chauffeur}', chauffeurLink)
      }
      setRelanceSubject(template.subject)
      setRelanceBody(body)
    }
    setShowRelanceModal(true)
  }

  // Créer une demande chauffeur et ouvrir le modal email avec le vrai lien
  const handleDemandeChauffeur = async (dossier: DossierRelance) => {
    setCreatingDemandeChauffeur(true)
    try {
      // Générer le token
      const token = generateChauffeurToken()
      // Jamais window.location.origin dans un lien d'email : en dev cela
      // enverrait http://localhost:5173 au destinataire.
      const baseUrl = getSiteBaseUrl()
      const link = `${baseUrl}/fournisseur/chauffeur?token=${token}`

      // Récupérer le transporteur_id
      const { data: dossierData } = await supabase
        .from('dossiers')
        .select('transporteur_id')
        .eq('id', dossier.id)
        .single()

      if (!dossierData?.transporteur_id) {
        alert('Aucun transporteur assigné à ce dossier.')
        return
      }

      // Déterminer le type (aller, retour, aller_retour)
      const hasRetour = !!dossier.return_date
      const type = hasRetour ? 'aller_retour' : 'aller'

      // Créer la demande dans la base de données
      const { error } = await supabase
        .from('demandes_chauffeur')
        .insert({
          dossier_id: dossier.id,
          transporteur_id: dossierData.transporteur_id,
          type: type,
          mode: 'individuel',
          token: token,
          status: 'pending',
          sent_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
        })

      if (error) throw error

      // Stocker le lien généré
      setGeneratedChauffeurLink(link)

      // Sélectionner ce dossier
      setSelectedDossiers(new Set([dossier.id]))

      // Ouvrir le modal avec le template demande_chauffeur et le lien réel
      openRelanceModal('demande_chauffeur', link)

      // Recharger les données pour voir le nouveau statut
      loadDossiers()

    } catch (error) {
      console.error('Erreur création demande chauffeur:', error)
      alert('Erreur lors de la création de la demande chauffeur.')
    } finally {
      setCreatingDemandeChauffeur(false)
    }
  }

  // Envoyer les relances
  const handleSendRelances = async () => {
    if (selectedDossiers.size === 0) {
      alert('Sélectionnez au moins un dossier')
      return
    }

    setSending(true)
    try {
      const dossiersToRelance = dossiersFiltres.filter(d => selectedDossiers.has(d.id))

      for (const dossier of dossiersToRelance) {
        // Personnaliser le message
        const acompte = dossier.price_ttc ? Math.round(dossier.price_ttc * 0.3) : 0
        const subject = relanceSubject
          .replace('{reference}', dossier.reference)
          .replace('{client_name}', dossier.client_name)

        const body = relanceBody
          .replace(/{client_name}/g, dossier.client_name)
          .replace(/{reference}/g, dossier.reference)
          .replace(/{departure}/g, dossier.departure)
          .replace(/{arrival}/g, dossier.arrival)
          .replace(/{departure_date}/g, formatDate(dossier.departure_date))
          .replace(/{passengers}/g, String(dossier.passengers))
          .replace(/{solde_restant}/g, formatPrice(dossier.solde_restant))
          .replace(/{acompte}/g, formatPrice(acompte))
          .replace(/{lien_infos_voyage}/g, generateInfosVoyageUrl(dossier.reference, dossier.client_email, dossier.country_code))
          .replace(/{lien_paiement}/g, generatePaymentUrl(dossier.reference, dossier.client_email, dossier.country_code))
          .replace(/{lien_chauffeur}/g, `${getSiteBaseUrl()}/fournisseur/chauffeur?token=LIEN_A_GENERER`)

        // Déterminer la langue à partir du pays
        const emailLanguage = getLanguageFromCountry(dossier.country_code)

        // Envoyer l'email via Edge Function
        const { error: emailError } = await supabase.functions.invoke('send-email', {
          body: {
            type: 'custom',
            to: dossier.client_email,
            subject: subject,
            html_content: body.replace(/\n/g, '<br>'),
            data: {
              client_name: dossier.client_name,
              reference: dossier.reference,
              departure: dossier.departure,
              arrival: dossier.arrival,
              departure_date: formatDate(dossier.departure_date),
              lien_espace_client: generateClientAccessUrl(dossier.reference, dossier.client_email, dossier.country_code),
              lien_paiement: generatePaymentUrl(dossier.reference, dossier.client_email, dossier.country_code),
              lien_infos_voyage: generateInfosVoyageUrl(dossier.reference, dossier.client_email, dossier.country_code),
              dossier_id: dossier.id,
              language: emailLanguage,
            },
          },
        })

        if (emailError) {
          console.error('Erreur envoi email:', emailError)
          throw emailError
        }

        // Enregistrer la relance dans la timeline
        await supabase.from('timeline').insert({
          dossier_id: dossier.id,
          type: 'relance',
          content: `📧 Relance envoyée: "${subject.substring(0, 50)}..."`,
        })

        console.log('Relance envoyée à:', dossier.client_email)
      }

      // Recharger les données
      await loadDossiers()
      queryClient.invalidateQueries({ queryKey: ['timeline'] })

      setShowRelanceModal(false)
      setSelectedDossiers(new Set())
      alert(`${dossiersToRelance.length} relance(s) envoyée(s) avec succès !`)
    } catch (error) {
      console.error('Erreur envoi relances:', error)
      alert('Erreur lors de l\'envoi des relances')
    } finally {
      setSending(false)
    }
  }

  // Obtenir le label du statut
  const getStatusLabel = (dossier: DossierRelance) => {
    const labels: Record<string, { label: string; color: string }> = {
      'new': { label: 'Nouveau', color: 'blue' },
      'pending-client': { label: 'Att. client', color: 'orange' },
      'quotes_sent': { label: 'Devisé', color: 'purple' },
      'pending-payment': { label: 'Attente acompte', color: 'orange' },
      'pending-reservation': { label: 'Attente résa', color: 'blue' },
      'bpa-received': { label: 'BPA reçu', color: 'green' },
      'pending-info': { label: 'Attente infos', color: 'purple' },
      'pending-info-received': { label: 'Infos à valider', color: 'teal' },
      'pending-driver': { label: 'Attente chauffeur', color: 'indigo' },
      'confirmed': { label: 'Confirmé', color: 'green' },
      'completed': { label: 'Terminé', color: 'green' },
    }
    // Statut effectif : le badge reflète le prochain jalon reel, pas le
    // champ status parfois fige (un dossier signe restait « Att. client »).
    const eff = getStatutEffectif({
      status: dossier.status,
      contractSignedAt: dossier.contract_signed_at,
      montantPaye: dossier.total_paye || 0,
      // Pas d'acompte_amount ici : approximation a 30% (le badge reste juste
      // pour distinguer paye / non paye).
      acompteRequis: Math.round((dossier.price_ttc || 0) * 0.3),
      hasBpaConfirme: dossier.bpa_received,
      hasInfosClient: dossier.voyage_info_validated,
      infosValidees: dossier.voyage_info_validated,
      chauffeurRecu: dossier.chauffeur_info_received,
    })
    return labels[eff] || { label: eff, color: 'gray' }
  }

  // Obtenir la couleur de priorité pour les jours avant départ
  const getJoursColor = (jours: number) => {
    if (jours < 0) return 'text-gray-400'
    if (jours <= 3) return 'text-red-600 font-bold'
    if (jours <= 7) return 'text-orange-600 font-semibold'
    if (jours <= 14) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold text-purple-dark">Service Clientèle</h2>
          <p className="text-gray-500">Gérez vos relances et suivez vos dossiers en cours</p>
        </div>
        <button
          onClick={loadDossiers}
          className="btn btn-secondary flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* Statistiques rapides - cliquables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => {
            setSelectedRequete(null)
            setFiltresPersonnalises({
              ...FILTRES_VIDES,
              joursAvantDepartMin: 0,
              joursAvantDepartMax: 7,
            })
            setFiltresActifs(true)
            setShowFiltresPanel(true)
          }}
          className="card p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg hover:scale-[1.02] transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">
                {dossiers.filter(d => d.jours_avant_depart >= 0 && d.jours_avant_depart <= 7 && d.status !== 'completed').length}
              </p>
              <p className="text-xs text-red-600">Départs &lt; 7 jours</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedRequete(null)
            setFiltresPersonnalises({
              ...FILTRES_VIDES,
              statuts: ['pending-info'],
            })
            setFiltresActifs(true)
            setShowFiltresPanel(true)
          }}
          className="card p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg hover:scale-[1.02] transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">
                {dossiers.filter(d => d.status === 'pending-info').length}
              </p>
              <p className="text-xs text-orange-600">Attente infos</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedRequete(null)
            setFiltresPersonnalises({
              ...FILTRES_VIDES,
              soldeMinimum: 1,
            })
            setFiltresActifs(true)
            setShowFiltresPanel(true)
          }}
          className="card p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg hover:scale-[1.02] transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
              <Euro size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {dossiers.filter(d => d.solde_restant > 0).length}
              </p>
              <p className="text-xs text-blue-600">Soldes en attente</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setSelectedRequete(null)
            setFiltresPersonnalises(FILTRES_VIDES)
            setFiltresActifs(false)
            // Pour "prêts à partir", on utilise une recherche personnalisée
            // On ne peut pas facilement combiner solde <= 0 ET statut != pending-info
            // Donc on affiche tous et on laisse l'utilisateur voir
            alert('Cette vue affiche les dossiers soldés et sans infos manquantes. Utilisez les filtres personnalisés pour affiner.')
          }}
          className="card p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg hover:scale-[1.02] transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">
                {dossiers.filter(d => d.solde_restant <= 0 && d.status !== 'pending-info').length}
              </p>
              <p className="text-xs text-green-600">Prêts à partir</p>
            </div>
          </div>
        </button>
      </div>

      {/* Requêtes prédéfinies */}
      <div className="card p-4">
        <h3 className="font-semibold text-purple-dark mb-4 flex items-center gap-2">
          <Bookmark size={18} />
          Requêtes prédéfinies
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {REQUETES_PREDEFINIES.map(requete => {
            const count = compteurRequetes[requete.id] || 0
            const isSelected = selectedRequete === requete.id
            const colorClasses: Record<string, string> = {
              red: 'border-red-300 bg-red-50 hover:bg-red-100',
              orange: 'border-orange-300 bg-orange-50 hover:bg-orange-100',
              blue: 'border-blue-300 bg-blue-50 hover:bg-blue-100',
              purple: 'border-purple-300 bg-purple-50 hover:bg-purple-100',
              indigo: 'border-indigo-300 bg-indigo-50 hover:bg-indigo-100',
              green: 'border-green-300 bg-green-50 hover:bg-green-100',
            }
            const iconColorClasses: Record<string, string> = {
              red: 'text-red-600',
              orange: 'text-orange-600',
              blue: 'text-blue-600',
              purple: 'text-purple-600',
              indigo: 'text-indigo-600',
              green: 'text-green-600',
            }

            return (
              <button
                key={requete.id}
                onClick={() => setSelectedRequete(isSelected ? null : requete.id)}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-all',
                  isSelected
                    ? 'ring-2 ring-magenta ring-offset-2'
                    : colorClasses[requete.color]
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={iconColorClasses[requete.color]}>{requete.icon}</span>
                  <span className={cn(
                    'text-lg font-bold',
                    count > 0 ? iconColorClasses[requete.color] : 'text-gray-400'
                  )}>
                    {count}
                  </span>
                </div>
                <p className="font-medium text-sm text-gray-800">{requete.name}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{requete.description}</p>
              </button>
            )
          })}
        </div>
        {selectedRequete && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Filtre actif : <span className="font-medium text-purple-dark">
                {REQUETES_PREDEFINIES.find(r => r.id === selectedRequete)?.name}
              </span>
            </span>
            <button
              onClick={() => setSelectedRequete(null)}
              className="text-xs text-magenta hover:underline"
            >
              Effacer le filtre
            </button>
          </div>
        )}
      </div>

      {/* Filtres personnalisés */}
      <div className="card p-4">
        <button
          onClick={() => setShowFiltresPanel(!showFiltresPanel)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="font-semibold text-purple-dark flex items-center gap-2">
            <Filter size={18} />
            Filtres personnalisés
            {filtresActifs && (
              <span className="ml-2 px-2 py-0.5 bg-magenta text-white text-xs rounded-full">
                Actifs
              </span>
            )}
          </h3>
          {showFiltresPanel ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showFiltresPanel && (
          <div className="mt-4 space-y-4">
            {/* Ligne 1 : Statuts */}
            <div>
              <label className="label mb-2">Statuts</label>
              <div className="flex flex-wrap gap-2">
                {STATUTS_OPTIONS.map(opt => (
                  <label
                    key={opt.value}
                    className={cn(
                      'px-3 py-1.5 rounded-full border cursor-pointer transition-colors text-sm',
                      filtresPersonnalises.statuts.includes(opt.value)
                        ? 'bg-magenta text-white border-magenta'
                        : 'bg-white border-gray-300 hover:border-magenta'
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={filtresPersonnalises.statuts.includes(opt.value)}
                      onChange={(e) => {
                        const newStatuts = e.target.checked
                          ? [...filtresPersonnalises.statuts, opt.value]
                          : filtresPersonnalises.statuts.filter(s => s !== opt.value)
                        setFiltresPersonnalises({ ...filtresPersonnalises, statuts: newStatuts })
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Ligne 2 : Jours avant départ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">J-Départ minimum</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Ex: 0"
                  value={filtresPersonnalises.joursAvantDepartMin ?? ''}
                  onChange={(e) => setFiltresPersonnalises({
                    ...filtresPersonnalises,
                    joursAvantDepartMin: e.target.value ? parseInt(e.target.value) : null
                  })}
                />
              </div>
              <div>
                <label className="label">J-Départ maximum</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Ex: 30"
                  value={filtresPersonnalises.joursAvantDepartMax ?? ''}
                  onChange={(e) => setFiltresPersonnalises({
                    ...filtresPersonnalises,
                    joursAvantDepartMax: e.target.value ? parseInt(e.target.value) : null
                  })}
                />
              </div>
              <div>
                <label className="label">Solde min. (€)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Ex: 100"
                  value={filtresPersonnalises.soldeMinimum ?? ''}
                  onChange={(e) => setFiltresPersonnalises({
                    ...filtresPersonnalises,
                    soldeMinimum: e.target.value ? parseFloat(e.target.value) : null
                  })}
                />
              </div>
              <div>
                <label className="label">Sans relance depuis (jours)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Ex: 7"
                  value={filtresPersonnalises.sansRelanceDepuis ?? ''}
                  onChange={(e) => setFiltresPersonnalises({
                    ...filtresPersonnalises,
                    sansRelanceDepuis: e.target.value ? parseInt(e.target.value) : null
                  })}
                />
              </div>
            </div>

            {/* Ligne 3 : Villes */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ville de départ (contient)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Paris"
                  value={filtresPersonnalises.villeDepart}
                  onChange={(e) => setFiltresPersonnalises({
                    ...filtresPersonnalises,
                    villeDepart: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="label">Ville d'arrivée (contient)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Lyon"
                  value={filtresPersonnalises.villeArrivee}
                  onChange={(e) => setFiltresPersonnalises({
                    ...filtresPersonnalises,
                    villeArrivee: e.target.value
                  })}
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <button
                onClick={() => {
                  setFiltresActifs(true)
                  setSelectedRequete(null) // Désactiver la requête prédéfinie
                }}
                className="btn btn-primary btn-sm flex items-center gap-2"
              >
                <Play size={16} />
                Appliquer les filtres
              </button>
              <button
                onClick={() => {
                  setFiltresPersonnalises(FILTRES_VIDES)
                  setFiltresActifs(false)
                }}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <X size={16} />
                Réinitialiser
              </button>
              {filtresActifs && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} />
                  {dossiersFiltres.length} dossier(s) trouvé(s)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barre d'actions */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Recherche */}
          <div className="flex-1 min-w-64 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par référence, client, trajet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Actions de masse */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="btn btn-secondary btn-sm"
            >
              {selectedDossiers.size === dossiersFiltres.length && dossiersFiltres.length > 0
                ? 'Tout désélectionner'
                : `Tout sélectionner (${dossiersFiltres.length})`}
            </button>

            {selectedDossiers.size > 0 && (
              <>
                <span className="text-sm text-gray-500">
                  {selectedDossiers.size} sélectionné(s)
                </span>
                <button
                  onClick={() => {
                    const requete = REQUETES_PREDEFINIES.find(r => r.id === selectedRequete)
                    openRelanceModal(requete?.actionType)
                  }}
                  className="btn btn-primary btn-sm flex items-center gap-2"
                >
                  <Send size={16} />
                  Envoyer relance
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Liste des dossiers */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw size={32} className="animate-spin mx-auto text-magenta mb-4" />
            <p className="text-gray-500">Chargement des dossiers...</p>
          </div>
        ) : dossiersFiltres.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
            <p className="text-gray-500">
              {selectedRequete
                ? 'Aucun dossier ne correspond à cette requête'
                : 'Aucun dossier à relancer'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedDossiers.size === dossiersFiltres.length && dossiersFiltres.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Dossier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Trajet
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    J-Départ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Transporteur
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Total dossier
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Reste à régler
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Relances
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dossiersFiltres.map(dossier => {
                  const statusInfo = getStatusLabel(dossier)
                  const isSelected = selectedDossiers.has(dossier.id)

                  return (
                    <tr
                      key={dossier.id}
                      onClick={() => {
                        if (onNavigateToDossier) {
                          onNavigateToDossier(dossier.id)
                        } else {
                          setSelectedDossierDetail(dossier)
                          setShowDossierModal(true)
                        }
                      }}
                      className={cn(
                        'hover:bg-gray-50 transition-colors cursor-pointer',
                        isSelected && 'bg-magenta/5'
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const newSelected = new Set(selectedDossiers)
                            if (isSelected) {
                              newSelected.delete(dossier.id)
                            } else {
                              newSelected.add(dossier.id)
                            }
                            setSelectedDossiers(newSelected)
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-medium text-purple-dark hover:underline">
                          {dossier.reference}
                        </span>
                        <p className="text-xs text-gray-400">
                          {formatDate(dossier.departure_date)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{dossier.client_name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail size={12} />
                          {dossier.client_email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin size={14} className="text-gray-400" />
                          <span className="text-gray-700">{dossier.departure}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-gray-700">{dossier.arrival}</span>
                        </div>
                        <p className="text-xs text-gray-400">{dossier.passengers} passagers</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-lg font-mono', getJoursColor(dossier.jours_avant_depart))}>
                          {dossier.jours_avant_depart < 0 ? 'Passé' : `J-${dossier.jours_avant_depart}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          statusInfo.color === 'orange' && 'bg-orange-100 text-orange-700',
                          statusInfo.color === 'blue' && 'bg-blue-100 text-blue-700',
                          statusInfo.color === 'purple' && 'bg-purple-100 text-purple-700',
                          statusInfo.color === 'indigo' && 'bg-indigo-100 text-indigo-700',
                          statusInfo.color === 'green' && 'bg-green-100 text-green-700',
                          statusInfo.color === 'gray' && 'bg-gray-100 text-gray-700',
                        )}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {/* Transporteur seulement si BPA confirmé, sinon le vrai etat */}
                        {dossier.etat_frs === 'confirme' && dossier.transporteur_name ? (
                          <span className="text-sm font-medium text-gray-700">{dossier.transporteur_name}</span>
                        ) : (
                          <span className="text-xs text-gray-400">{labelEtatFournisseur(dossier.etat_frs || 'attente_validate')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-700">
                          {dossier.price_ttc != null ? formatPrice(dossier.price_ttc) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {dossier.solde_restant > 0 ? (
                          <span className="font-semibold text-orange-600">
                            {formatPrice(dossier.solde_restant)}
                          </span>
                        ) : (
                          <span className="text-green-600 flex items-center justify-end gap-1">
                            <CheckCircle size={14} />
                            Soldé
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {dossier.nb_relances > 0 ? (
                          <div className="text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600">
                              <MessageSquare size={12} />
                              {dossier.nb_relances}
                            </span>
                            {dossier.derniere_relance && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {formatDate(dossier.derniere_relance)}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedDossierDetail(dossier)
                              setShowDossierModal(true)
                            }}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-purple-dark"
                            title="Voir détails"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDossiers(new Set([dossier.id]))
                              openRelanceModal()
                            }}
                            className="p-1.5 rounded hover:bg-magenta/10 text-gray-500 hover:text-magenta"
                            title="Envoyer relance"
                          >
                            <Send size={16} />
                          </button>
                          {/* Bouton demande chauffeur - visible si conditions remplies */}
                          {dossier.transporteur_id && (
                            <div className="relative group">
                              <button
                                onClick={() => {
                                  if (dossier.bpa_received && dossier.voyage_info_validated && !dossier.chauffeur_info_received && !dossier.demande_chauffeur_pending) {
                                    handleDemandeChauffeur(dossier)
                                  }
                                }}
                                disabled={!dossier.bpa_received || !dossier.voyage_info_validated || dossier.chauffeur_info_received || creatingDemandeChauffeur}
                                className={`p-1.5 rounded ${
                                  dossier.demande_chauffeur_pending
                                    ? 'text-orange-500 cursor-default'
                                    : dossier.chauffeur_info_received
                                    ? 'text-green-500 cursor-default'
                                    : dossier.bpa_received && dossier.voyage_info_validated
                                    ? 'hover:bg-indigo-100 text-indigo-500 hover:text-indigo-700'
                                    : 'text-gray-300 cursor-not-allowed'
                                }`}
                                title={
                                  !dossier.bpa_received ? 'BPA non reçu' :
                                  !dossier.voyage_info_validated ? 'Infos voyage non envoyées' :
                                  dossier.chauffeur_info_received ? 'Infos chauffeur reçues' :
                                  dossier.demande_chauffeur_pending ? 'Demande en attente' :
                                  'Demander contact chauffeur'
                                }
                              >
                                <Truck size={16} />
                              </button>
                            </div>
                          )}
                          {dossier.client_phone && (
                            <a
                              href={`tel:${dossier.client_phone}`}
                              className="p-1.5 rounded hover:bg-green-100 text-gray-500 hover:text-green-600"
                              title="Appeler"
                            >
                              <Phone size={16} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de relance */}
      <Modal
        isOpen={showRelanceModal}
        onClose={() => {
          setShowRelanceModal(false)
          setGeneratedChauffeurLink(null)
        }}
        title={`Envoyer une relance (${selectedDossiers.size} dossier${selectedDossiers.size > 1 ? 's' : ''})`}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => {
              setShowRelanceModal(false)
              setGeneratedChauffeurLink(null)
            }}>
              Annuler
            </button>
            <button
              className="btn btn-primary flex items-center gap-2"
              onClick={handleSendRelances}
              disabled={sending}
            >
              {sending ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Envoyer les relances
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Aperçu des destinataires */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-500 mb-2">Destinataires :</p>
            <div className="flex flex-wrap gap-2">
              {dossiersFiltres
                .filter(d => selectedDossiers.has(d.id))
                .slice(0, 5)
                .map(d => (
                  <span key={d.id} className="px-2 py-1 bg-white rounded border text-xs">
                    {d.client_name} ({d.reference})
                  </span>
                ))}
              {selectedDossiers.size > 5 && (
                <span className="px-2 py-1 bg-gray-200 rounded text-xs">
                  +{selectedDossiers.size - 5} autres
                </span>
              )}
            </div>
          </div>

          {/* Pièces jointes - affiché si demande chauffeur */}
          {generatedChauffeurLink && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
              <p className="text-sm font-medium text-indigo-800 mb-2 flex items-center gap-2">
                <Paperclip size={16} />
                Pièces jointes
              </p>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-white border border-indigo-200 rounded text-sm text-indigo-700 flex items-center gap-2">
                  <FileText size={14} />
                  Infos voyage validées (PDF)
                </span>
              </div>
              <p className="text-xs text-indigo-600 mt-2">
                Le PDF des informations voyage validées sera joint automatiquement à l'email.
              </p>
            </div>
          )}

          {/* Type de relance */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="relanceType"
                checked={relanceType === 'email'}
                onChange={() => setRelanceType('email')}
                className="accent-magenta"
              />
              <Mail size={16} />
              Email
            </label>
            <label className="flex items-center gap-2 cursor-pointer opacity-50" title="Bientôt disponible">
              <input
                type="radio"
                name="relanceType"
                checked={relanceType === 'sms'}
                onChange={() => setRelanceType('sms')}
                disabled
                className="accent-magenta"
              />
              <Phone size={16} />
              SMS (bientôt)
            </label>
          </div>

          {/* Templates rapides */}
          <div>
            <label className="label">Template rapide</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(TEMPLATES_RELANCE).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => {
                    setRelanceSubject(template.subject)
                    setRelanceBody(template.body)
                  }}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {key === 'infos_voyage' && 'Infos voyage'}
                  {key === 'demande_chauffeur' && 'Demande chauffeur'}
                  {key === 'solde' && 'Rappel solde'}
                  {key === 'acompte' && 'Rappel acompte'}
                  {key === 'confirmation' && 'Confirmation'}
                </button>
              ))}
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="label">Sujet</label>
            <input
              type="text"
              className="input"
              value={relanceSubject}
              onChange={(e) => setRelanceSubject(e.target.value)}
              placeholder="Sujet de l'email"
            />
          </div>

          {/* Corps du message */}
          <div>
            <label className="label">Message</label>
            <textarea
              className="input min-h-[250px] font-mono text-sm"
              value={relanceBody}
              onChange={(e) => setRelanceBody(e.target.value)}
              placeholder="Corps du message"
            />
            <p className="text-xs text-gray-400 mt-1">
              Variables disponibles : {'{client_name}'}, {'{reference}'}, {'{departure}'}, {'{arrival}'}, {'{departure_date}'}, {'{solde_restant}'}, {'{acompte}'}, {'{lien_infos_voyage}'}, {'{lien_paiement}'}
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal détail dossier */}
      <Modal
        isOpen={showDossierModal}
        onClose={() => {
          setShowDossierModal(false)
          setSelectedDossierDetail(null)
        }}
        title={selectedDossierDetail ? `Dossier ${selectedDossierDetail.reference}` : 'Détail dossier'}
        size="lg"
      >
        {selectedDossierDetail && (
          <div className="space-y-6">
            {/* Infos client */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-purple-dark mb-3">Informations client</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Nom</p>
                  <p className="font-medium">{selectedDossierDetail.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium">{selectedDossierDetail.client_email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Téléphone</p>
                  <p className="font-medium">{selectedDossierDetail.client_phone || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Statut</p>
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    getStatusLabel(selectedDossierDetail).color === 'orange' && 'bg-orange-100 text-orange-700',
                    getStatusLabel(selectedDossierDetail).color === 'blue' && 'bg-blue-100 text-blue-700',
                    getStatusLabel(selectedDossierDetail).color === 'purple' && 'bg-purple-100 text-purple-700',
                  )}>
                    {getStatusLabel(selectedDossierDetail).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Infos voyage */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-purple-dark mb-3">Voyage</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Trajet</p>
                  <p className="font-medium">{selectedDossierDetail.departure} → {selectedDossierDetail.arrival}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium">
                    {formatDate(selectedDossierDetail.departure_date)}
                    {selectedDossierDetail.return_date && ` - ${formatDate(selectedDossierDetail.return_date)}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Passagers</p>
                  <p className="font-medium">{selectedDossierDetail.passengers} personnes</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">J-Départ</p>
                  <p className={cn('font-bold', getJoursColor(selectedDossierDetail.jours_avant_depart))}>
                    {selectedDossierDetail.jours_avant_depart < 0 ? 'Passé' : `${selectedDossierDetail.jours_avant_depart} jours`}
                  </p>
                </div>
              </div>
            </div>

            {/* Infos financières */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-purple-dark mb-3">Finances</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Total TTC</p>
                  <p className="font-bold text-lg">{formatPrice(selectedDossierDetail.price_ttc || 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total payé</p>
                  <p className="font-bold text-lg text-green-600">{formatPrice(selectedDossierDetail.total_paye)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Solde restant</p>
                  <p className={cn(
                    'font-bold text-lg',
                    selectedDossierDetail.solde_restant > 0 ? 'text-orange-600' : 'text-green-600'
                  )}>
                    {selectedDossierDetail.solde_restant > 0
                      ? formatPrice(selectedDossierDetail.solde_restant)
                      : 'Soldé ✓'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setSelectedDossiers(new Set([selectedDossierDetail.id]))
                  setShowDossierModal(false)
                  openRelanceModal('infos_voyage')
                }}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <FileText size={14} />
                Relance infos voyage
              </button>
              <button
                onClick={() => {
                  setSelectedDossiers(new Set([selectedDossierDetail.id]))
                  setShowDossierModal(false)
                  openRelanceModal('solde')
                }}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <Euro size={14} />
                Relance solde
              </button>
              {/* Demande chauffeur - toujours visible avec état selon conditions */}
              {(() => {
                const canRequest = selectedDossierDetail.bpa_received &&
                  selectedDossierDetail.voyage_info_validated &&
                  !selectedDossierDetail.chauffeur_info_received &&
                  !selectedDossierDetail.demande_chauffeur_pending &&
                  selectedDossierDetail.transporteur_id

                const getDisabledReason = () => {
                  if (!selectedDossierDetail.transporteur_id) return 'Pas de transporteur assigné'
                  if (!selectedDossierDetail.bpa_received) return 'BPA non reçu du transporteur'
                  if (!selectedDossierDetail.voyage_info_validated) return 'Infos voyage non envoyées au client'
                  if (selectedDossierDetail.chauffeur_info_received) return 'Infos chauffeur déjà reçues'
                  if (selectedDossierDetail.demande_chauffeur_pending) return 'Demande déjà en cours'
                  return ''
                }

                const getButtonStyle = () => {
                  if (selectedDossierDetail.chauffeur_info_received) return 'bg-green-100 text-green-700 cursor-not-allowed'
                  if (selectedDossierDetail.demande_chauffeur_pending) return 'bg-orange-100 text-orange-700 cursor-not-allowed'
                  if (canRequest) return 'btn-primary'
                  return 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }

                const getButtonLabel = () => {
                  if (selectedDossierDetail.chauffeur_info_received) return 'Infos reçues'
                  if (selectedDossierDetail.demande_chauffeur_pending) return 'Demande en attente'
                  return 'Demande chauffeur'
                }

                return (
                  <div className="relative group">
                    <button
                      onClick={() => {
                        if (!canRequest) return
                        setShowDossierModal(false)
                        handleDemandeChauffeur(selectedDossierDetail)
                      }}
                      disabled={!canRequest || creatingDemandeChauffeur}
                      className={`btn btn-sm flex items-center gap-2 ${getButtonStyle()}`}
                    >
                      <Truck size={14} />
                      {creatingDemandeChauffeur ? 'Création...' : getButtonLabel()}
                    </button>
                    {!canRequest && !selectedDossierDetail.chauffeur_info_received && !selectedDossierDetail.demande_chauffeur_pending && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {getDisabledReason()}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    )}
                  </div>
                )
              })()}
              <a
                href={`mailto:${selectedDossierDetail.client_email}`}
                className="btn btn-secondary btn-sm flex items-center gap-2"
              >
                <Mail size={14} />
                Email direct
              </a>
              {selectedDossierDetail.client_phone && (
                <a
                  href={`tel:${selectedDossierDetail.client_phone}`}
                  className="btn btn-secondary btn-sm flex items-center gap-2"
                >
                  <Phone size={14} />
                  Appeler
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
