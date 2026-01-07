import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  User,
  Truck,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Filter,
  List,
  CalendarDays,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface DepartData {
  id: string
  reference: string
  status: string
  // Trajet
  departure: string
  arrival: string
  departure_date: string
  departure_time: string | null
  return_date: string | null
  passengers: number
  // Client
  client_name: string
  client_email: string
  client_phone: string | null
  // Chauffeur (depuis dossiers)
  chauffeur_name: string | null
  chauffeur_phone: string | null
  chauffeur_vehicle: string | null
  // Transporteur
  transporteur_id: string | null
  transporteur_name: string | null
  transporteur_phone: string | null
  transporteur_email: string | null
  astreinte_tel: string | null
  // Voyage infos
  voyage_info: {
    contact_nom: string | null
    contact_prenom: string | null
    contact_tel: string | null
    contact_email: string | null
    aller_heure: string | null
    aller_adresse_depart: string | null
    aller_adresse_arrivee: string | null
    chauffeur_aller_nom: string | null
    chauffeur_aller_tel: string | null
    chauffeur_aller_immatriculation: string | null
    validated_at: string | null
    chauffeur_info_recue_at: string | null
    feuille_route_envoyee_at: string | null
  } | null
}

type ViewMode = 'calendar' | 'list'

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'pending-payment': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Attente paiement' },
  'pending-reservation': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Attente résa' },
  'bpa-received': { bg: 'bg-green-100', text: 'text-green-800', label: 'BPA reçu' },
  'pending-info': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Attente infos' },
  'pending-driver': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Attente chauffeur' },
  'confirmed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmé' },
  'completed': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Terminé' },
  'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Annulé' },
}

export function DepartsPage({ onViewDossier }: { onViewDossier: (id: string) => void }) {
  const [departs, setDeparts] = useState<DepartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month')
  const [selectedDepart, setSelectedDepart] = useState<DepartData | null>(null)

  useEffect(() => {
    loadDeparts()
  }, [currentMonth, dateRange])

  const loadDeparts = async () => {
    setIsLoading(true)
    try {
      // Calculer les dates de filtrage
      let startDate: string
      let endDate: string

      if (dateRange === 'week') {
        const today = new Date()
        const nextWeek = new Date(today)
        nextWeek.setDate(nextWeek.getDate() + 7)
        startDate = today.toISOString().split('T')[0]
        endDate = nextWeek.toISOString().split('T')[0]
      } else if (dateRange === 'month') {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        startDate = new Date(year, month, 1).toISOString().split('T')[0]
        endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
      } else {
        // All - prendre les 3 prochains mois
        const today = new Date()
        const future = new Date(today)
        future.setMonth(future.getMonth() + 3)
        startDate = today.toISOString().split('T')[0]
        endDate = future.toISOString().split('T')[0]
      }

      // Charger les dossiers avec leurs voyage_infos pour avoir les vraies dates de départ
      // On charge d'abord les voyage_infos qui ont une date dans la plage
      const { data: voyageInfosInRange } = await supabase
        .from('voyage_infos')
        .select('dossier_id, aller_date')
        .gte('aller_date', startDate)
        .lte('aller_date', endDate + 'T23:59:59')

      const dossierIdsFromVoyageInfos = (voyageInfosInRange?.map(vi => vi.dossier_id).filter((id): id is string => id !== null) || []) as string[]

      // Charger les dossiers SIGNÉS uniquement - deux requêtes séparées puis fusionner
      // 1. Dossiers avec departure_date dans la plage (avec contrat signé)
      const { data: dossiersByDate, error: error1 } = await supabase
        .from('dossiers')
        .select('*, contrats!inner(signed_at)')
        .gte('departure_date', startDate)
        .lte('departure_date', endDate)
        .not('status', 'eq', 'cancelled')
        .not('contrats.signed_at', 'is', null)

      if (error1) throw error1

      // 2. Dossiers qui ont un voyage_info avec aller_date dans la plage (avec contrat signé)
      let dossiersByVoyageInfo: any[] = []
      if (dossierIdsFromVoyageInfos.length > 0) {
        const { data, error: error2 } = await supabase
          .from('dossiers')
          .select('*, contrats!inner(signed_at)')
          .in('id', dossierIdsFromVoyageInfos)
          .not('status', 'eq', 'cancelled')
          .not('contrats.signed_at', 'is', null)

        if (error2) throw error2
        dossiersByVoyageInfo = data || []
      }

      // Fusionner et dédupliquer
      const allDossierIds = new Set<string>()
      const dossiers: any[] = []

      for (const d of [...(dossiersByDate || []), ...dossiersByVoyageInfo]) {
        if (!allDossierIds.has(d.id)) {
          allDossierIds.add(d.id)
          dossiers.push(d)
        }
      }

      // Trier par date de départ
      dossiers.sort((a, b) => {
        const dateA = new Date(a.departure_date || '2099-12-31').getTime()
        const dateB = new Date(b.departure_date || '2099-12-31').getTime()
        return dateA - dateB
      })

      if (!dossiers || dossiers.length === 0) {
        setDeparts([])
        setIsLoading(false)
        return
      }

      // Charger les transporteurs
      const transporteurIds = [...new Set(dossiers.filter(d => d.transporteur_id).map(d => d.transporteur_id))] as string[]
      let transporteursMap: Record<string, any> = {}

      if (transporteurIds.length > 0) {
        const { data: transporteurs } = await supabase
          .from('transporteurs')
          .select('*')
          .in('id', transporteurIds)

        if (transporteurs) {
          transporteursMap = transporteurs.reduce((acc, t) => ({ ...acc, [t.id]: t }), {})
        }
      }

      // Charger les voyage_infos
      const dossierIds = dossiers.map(d => d.id)
      const { data: voyageInfos } = await supabase
        .from('voyage_infos')
        .select('*')
        .in('dossier_id', dossierIds)

      const voyageInfosMap: Record<string, any> = {}
      if (voyageInfos) {
        voyageInfos.forEach(vi => {
          if (vi.dossier_id) {
            voyageInfosMap[vi.dossier_id] = vi
          }
        })
      }

      // Construire les données de départ
      const departsData: DepartData[] = dossiers.map(d => {
        const transporteur = d.transporteur_id ? transporteursMap[d.transporteur_id] : null
        const voyageInfo = voyageInfosMap[d.id] || null

        return {
          id: d.id,
          reference: d.reference,
          status: d.status || 'pending',
          departure: d.departure,
          arrival: d.arrival,
          departure_date: d.departure_date,
          departure_time: d.departure_time,
          return_date: d.return_date,
          passengers: d.passengers,
          client_name: d.client_name,
          client_email: d.client_email,
          client_phone: d.client_phone,
          chauffeur_name: d.chauffeur_name,
          chauffeur_phone: d.chauffeur_phone,
          chauffeur_vehicle: d.chauffeur_vehicle,
          transporteur_id: d.transporteur_id,
          transporteur_name: transporteur?.name || null,
          transporteur_phone: transporteur?.phone || null,
          transporteur_email: transporteur?.email || null,
          astreinte_tel: transporteur?.astreinte_tel || null,
          voyage_info: voyageInfo ? {
            contact_nom: voyageInfo.contact_nom,
            contact_prenom: voyageInfo.contact_prenom,
            contact_tel: voyageInfo.contact_tel,
            contact_email: voyageInfo.contact_email,
            aller_heure: voyageInfo.aller_heure,
            aller_adresse_depart: voyageInfo.aller_adresse_depart,
            aller_adresse_arrivee: voyageInfo.aller_adresse_arrivee,
            chauffeur_aller_nom: voyageInfo.chauffeur_aller_nom,
            chauffeur_aller_tel: voyageInfo.chauffeur_aller_tel,
            chauffeur_aller_immatriculation: voyageInfo.chauffeur_aller_immatriculation,
            validated_at: voyageInfo.validated_at,
            chauffeur_info_recue_at: voyageInfo.chauffeur_info_recue_at,
            feuille_route_envoyee_at: voyageInfo.feuille_route_envoyee_at,
          } : null,
        }
      })

      setDeparts(departsData)
    } catch (error) {
      console.error('Erreur chargement départs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrer les départs
  const filteredDeparts = useMemo(() => {
    return departs.filter(d => {
      // Filtre de recherche
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        if (
          !d.reference.toLowerCase().includes(search) &&
          !d.client_name.toLowerCase().includes(search) &&
          !d.departure.toLowerCase().includes(search) &&
          !d.arrival.toLowerCase().includes(search) &&
          !(d.chauffeur_name?.toLowerCase().includes(search)) &&
          !(d.transporteur_name?.toLowerCase().includes(search))
        ) {
          return false
        }
      }

      // Filtre de statut
      if (statusFilter !== 'all' && d.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [departs, searchTerm, statusFilter])

  // Grouper par date pour la vue liste
  const departsByDate = useMemo(() => {
    const grouped: Record<string, DepartData[]> = {}
    filteredDeparts.forEach(d => {
      if (!grouped[d.departure_date]) {
        grouped[d.departure_date] = []
      }
      grouped[d.departure_date].push(d)
    })
    return grouped
  }, [filteredDeparts])

  // Navigation mois
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Copier dans le presse-papier
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Calculer les jours avant départ
  const getDaysBefore = (date: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const departDate = new Date(date)
    departDate.setHours(0, 0, 0, 0)
    return Math.ceil((departDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Générer le calendrier
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1 // Lundi = 0

    const days: { date: Date; isCurrentMonth: boolean; departs: DepartData[] }[] = []

    // Jours du mois précédent
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false, departs: [] })
    }

    // Jours du mois courant
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      const dateStr = date.toISOString().split('T')[0]
      const departsForDay = filteredDeparts.filter(d => d.departure_date === dateStr)
      days.push({ date, isCurrentMonth: true, departs: departsForDay })
    }

    // Jours du mois suivant pour compléter la grille
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false, departs: [] })
    }

    return days
  }, [currentMonth, filteredDeparts])

  const formatDateFr = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Départs</h2>
          <p className="text-gray-500 mt-1">Vue d'ensemble des départs (dossiers signés uniquement)</p>
        </div>
        <button
          onClick={loadDeparts}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher (référence, client, chauffeur, ville...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Filtre statut */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending-payment">Attente paiement</option>
            <option value="pending-reservation">Attente résa</option>
            <option value="bpa-received">BPA reçu</option>
            <option value="pending-info">Attente infos</option>
            <option value="pending-driver">Attente chauffeur</option>
            <option value="confirmed">Confirmé</option>
          </select>

          {/* Période */}
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as any)}
            className="input"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="all">3 prochains mois</option>
          </select>

          {/* Vue */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list' ? 'bg-magenta text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
              title="Vue liste"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'calendar' ? 'bg-magenta text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
              title="Vue calendrier"
            >
              <CalendarDays className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation mois (pour vue calendrier) */}
        {viewMode === 'calendar' && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium text-lg min-w-[200px] text-center">
              {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{filteredDeparts.length}</p>
              <p className="text-sm text-gray-500">Départs</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {filteredDeparts.filter(d => d.voyage_info?.chauffeur_info_recue_at).length}
              </p>
              <p className="text-sm text-gray-500">Chauffeur reçu</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {filteredDeparts.filter(d => !d.voyage_info?.chauffeur_info_recue_at && getDaysBefore(d.departure_date) <= 7).length}
              </p>
              <p className="text-sm text-gray-500">Sans chauffeur (J-7)</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {filteredDeparts.reduce((sum, d) => sum + d.passengers, 0)}
              </p>
              <p className="text-sm text-gray-500">Passagers total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {isLoading ? (
        <div className="card p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
          <p className="text-gray-500 mt-2">Chargement des départs...</p>
        </div>
      ) : viewMode === 'list' ? (
        /* Vue Liste */
        <div className="space-y-6">
          {Object.keys(departsByDate).length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun départ trouvé pour cette période</p>
            </div>
          ) : (
            Object.entries(departsByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, departsForDate]) => {
                const daysBefore = getDaysBefore(date)
                const isToday = daysBefore === 0
                const isPast = daysBefore < 0
                const isUrgent = daysBefore >= 0 && daysBefore <= 3

                return (
                  <div key={date} className="space-y-3">
                    {/* En-tête de date */}
                    <div className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-lg',
                      isToday ? 'bg-magenta/10 border border-magenta/30' :
                      isPast ? 'bg-gray-100' :
                      isUrgent ? 'bg-orange-50 border border-orange-200' :
                      'bg-gray-50'
                    )}>
                      <Calendar className={cn(
                        'w-5 h-5',
                        isToday ? 'text-magenta' :
                        isPast ? 'text-gray-400' :
                        isUrgent ? 'text-orange-600' :
                        'text-gray-600'
                      )} />
                      <span className={cn(
                        'font-medium capitalize',
                        isToday ? 'text-magenta' :
                        isPast ? 'text-gray-500' :
                        isUrgent ? 'text-orange-700' :
                        'text-gray-900'
                      )}>
                        {formatDateFr(date)}
                      </span>
                      {isToday && <span className="px-2 py-0.5 bg-magenta text-white text-xs rounded-full">Aujourd'hui</span>}
                      {!isPast && daysBefore > 0 && (
                        <span className={cn(
                          'px-2 py-0.5 text-xs rounded-full',
                          isUrgent ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-600'
                        )}>
                          J-{daysBefore}
                        </span>
                      )}
                      <span className="text-sm text-gray-500 ml-auto">{departsForDate.length} départ(s)</span>
                    </div>

                    {/* Liste des départs */}
                    <div className="grid gap-3">
                      {departsForDate.map(depart => (
                        <DepartCard
                          key={depart.id}
                          depart={depart}
                          onView={() => onViewDossier(depart.id)}
                          onCopy={copyToClipboard}
                          onSelect={() => setSelectedDepart(depart)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })
          )}
        </div>
      ) : (
        /* Vue Calendrier */
        <div className="card overflow-hidden">
          {/* En-têtes jours */}
          <div className="grid grid-cols-7 bg-gray-50 border-b">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Grille calendrier */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const isToday = day.date.toDateString() === new Date().toDateString()
              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[100px] p-1 border-b border-r',
                    !day.isCurrentMonth && 'bg-gray-50',
                    isToday && 'bg-magenta/5'
                  )}
                >
                  <div className={cn(
                    'text-sm font-medium mb-1 p-1',
                    !day.isCurrentMonth && 'text-gray-400',
                    isToday && 'text-magenta'
                  )}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {day.departs.slice(0, 3).map(d => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDepart(d)}
                        className={cn(
                          'w-full text-left text-xs p-1 rounded truncate',
                          STATUS_COLORS[d.status]?.bg || 'bg-gray-100',
                          STATUS_COLORS[d.status]?.text || 'text-gray-700'
                        )}
                        title={`${d.reference} - ${d.client_name}`}
                      >
                        {d.departure_time ? `${d.departure_time} ` : ''}{d.reference}
                      </button>
                    ))}
                    {day.departs.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.departs.length - 3} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal détail départ */}
      {selectedDepart && (
        <DepartDetailModal
          depart={selectedDepart}
          onClose={() => setSelectedDepart(null)}
          onView={() => {
            onViewDossier(selectedDepart.id)
            setSelectedDepart(null)
          }}
          onCopy={copyToClipboard}
        />
      )}
    </div>
  )
}

// Composant Card départ
function DepartCard({
  depart,
  onView,
  onCopy,
  onSelect,
}: {
  depart: DepartData
  onView: () => void
  onCopy: (text: string) => void
  onSelect: () => void
}) {
  const hasChauffeur = depart.voyage_info?.chauffeur_aller_nom || depart.chauffeur_name
  const chauffeurName = depart.voyage_info?.chauffeur_aller_nom || depart.chauffeur_name
  const chauffeurPhone = depart.voyage_info?.chauffeur_aller_tel || depart.chauffeur_phone

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Info principale */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={onView}
              className="font-medium text-magenta hover:underline"
            >
              {depart.reference}
            </button>
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              STATUS_COLORS[depart.status]?.bg,
              STATUS_COLORS[depart.status]?.text
            )}>
              {STATUS_COLORS[depart.status]?.label || depart.status}
            </span>
            {hasChauffeur && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                <Truck className="w-3 h-3" />
                Chauffeur OK
              </span>
            )}
          </div>

          {/* Trajet */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span>{depart.departure}</span>
            <span className="text-gray-400">→</span>
            <span>{depart.arrival}</span>
            {depart.departure_time && (
              <>
                <Clock className="w-4 h-4 text-gray-400 ml-2" />
                <span>{depart.departure_time}</span>
              </>
            )}
            <Users className="w-4 h-4 text-gray-400 ml-2" />
            <span>{depart.passengers} pax</span>
          </div>
        </div>

        {/* Contacts rapides */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSelect}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            title="Voir les détails"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contacts en ligne */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t">
        {/* Client */}
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-gray-700 truncate">{depart.client_name}</span>
          {depart.client_phone && (
            <button
              onClick={() => onCopy(depart.client_phone!)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
              title="Copier"
            >
              <Phone className="w-3 h-3" />
              <span className="text-xs">{depart.client_phone}</span>
            </button>
          )}
        </div>

        {/* Chauffeur */}
        <div className="flex items-center gap-2 text-sm">
          <Truck className="w-4 h-4 text-green-500" />
          {hasChauffeur ? (
            <>
              <span className="font-medium text-gray-700 truncate">{chauffeurName}</span>
              {chauffeurPhone && (
                <button
                  onClick={() => onCopy(chauffeurPhone)}
                  className="text-green-600 hover:text-green-800 flex items-center gap-1"
                  title="Copier"
                >
                  <Phone className="w-3 h-3" />
                  <span className="text-xs">{chauffeurPhone}</span>
                </button>
              )}
            </>
          ) : (
            <span className="text-gray-400 italic">Pas de chauffeur</span>
          )}
        </div>

        {/* Transporteur */}
        <div className="flex items-center gap-2 text-sm">
          <Building className="w-4 h-4 text-purple-500" />
          {depart.transporteur_name ? (
            <>
              <span className="font-medium text-gray-700 truncate">{depart.transporteur_name}</span>
              {depart.transporteur_phone && (
                <button
                  onClick={() => onCopy(depart.transporteur_phone!)}
                  className="text-purple-600 hover:text-purple-800 flex items-center gap-1"
                  title="Copier"
                >
                  <Phone className="w-3 h-3" />
                  <span className="text-xs">{depart.transporteur_phone}</span>
                </button>
              )}
            </>
          ) : (
            <span className="text-gray-400 italic">Pas de transporteur</span>
          )}
        </div>
      </div>
    </div>
  )
}

// Import manquant
import { Building } from 'lucide-react'

// Modal détail
function DepartDetailModal({
  depart,
  onClose,
  onView,
  onCopy,
}: {
  depart: DepartData
  onClose: () => void
  onView: () => void
  onCopy: (text: string) => void
}) {
  const hasChauffeur = depart.voyage_info?.chauffeur_aller_nom || depart.chauffeur_name

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h3 className="text-lg font-semibold">{depart.reference}</h3>
            <p className="text-sm text-gray-500">
              {formatDate(depart.departure_date)} {depart.departure_time && `à ${depart.departure_time}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu */}
        <div className="p-4 space-y-6">
          {/* Trajet */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-magenta" />
              Trajet
            </h4>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Départ</span>
                <span className="font-medium">{depart.voyage_info?.aller_adresse_depart || depart.departure}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Arrivée</span>
                <span className="font-medium">{depart.voyage_info?.aller_adresse_arrivee || depart.arrival}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Heure</span>
                <span className="font-medium">{depart.voyage_info?.aller_heure || depart.departure_time || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Passagers</span>
                <span className="font-medium">{depart.passengers}</span>
              </div>
            </div>
          </div>

          {/* Contact Client */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              Contact Client
            </h4>
            <div className="bg-blue-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Nom</span>
                <span className="font-medium">{depart.client_name}</span>
              </div>
              {depart.client_phone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Téléphone</span>
                  <button
                    onClick={() => onCopy(depart.client_phone!)}
                    className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {depart.client_phone}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
              {depart.client_email && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Email</span>
                  <button
                    onClick={() => onCopy(depart.client_email)}
                    className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {depart.client_email}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
              {/* Contact sur place si différent */}
              {depart.voyage_info?.contact_tel && depart.voyage_info.contact_tel !== depart.client_phone && (
                <>
                  <div className="border-t pt-2 mt-2">
                    <span className="text-xs text-gray-500">Contact sur place</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Nom</span>
                    <span className="font-medium">
                      {depart.voyage_info.contact_prenom} {depart.voyage_info.contact_nom}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Téléphone</span>
                    <button
                      onClick={() => onCopy(depart.voyage_info!.contact_tel!)}
                      className="font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {depart.voyage_info.contact_tel}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact Chauffeur */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-green-500" />
              Contact Chauffeur
            </h4>
            {hasChauffeur ? (
              <div className="bg-green-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Nom</span>
                  <span className="font-medium">
                    {depart.voyage_info?.chauffeur_aller_nom || depart.chauffeur_name}
                  </span>
                </div>
                {(depart.voyage_info?.chauffeur_aller_tel || depart.chauffeur_phone) && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Téléphone</span>
                    <button
                      onClick={() => onCopy(depart.voyage_info?.chauffeur_aller_tel || depart.chauffeur_phone!)}
                      className="font-medium text-green-600 hover:text-green-800 flex items-center gap-1"
                    >
                      {depart.voyage_info?.chauffeur_aller_tel || depart.chauffeur_phone}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {depart.voyage_info?.chauffeur_aller_immatriculation && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Immatriculation</span>
                    <span className="font-medium">{depart.voyage_info.chauffeur_aller_immatriculation}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <AlertCircle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                <p className="text-orange-700">Informations chauffeur non reçues</p>
              </div>
            )}
          </div>

          {/* Transporteur */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Building className="w-4 h-4 text-purple-500" />
              Transporteur
            </h4>
            {depart.transporteur_name ? (
              <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Société</span>
                  <span className="font-medium">{depart.transporteur_name}</span>
                </div>
                {depart.transporteur_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Téléphone</span>
                    <button
                      onClick={() => onCopy(depart.transporteur_phone!)}
                      className="font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      {depart.transporteur_phone}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {depart.transporteur_email && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email</span>
                    <button
                      onClick={() => onCopy(depart.transporteur_email!)}
                      className="font-medium text-purple-600 hover:text-purple-800 flex items-center gap-1"
                    >
                      {depart.transporteur_email}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {depart.astreinte_tel && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Astreinte</span>
                    <button
                      onClick={() => onCopy(depart.astreinte_tel!)}
                      className="font-medium text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      {depart.astreinte_tel}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-500">
                Pas de transporteur assigné
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">
            Fermer
          </button>
          <button onClick={onView} className="btn btn-primary flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Voir le dossier
          </button>
        </div>
      </div>
    </div>
  )
}
