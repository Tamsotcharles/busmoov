import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Check, Shield, MapPin, Calendar, Users, Info, User, Briefcase } from 'lucide-react'
import { useCreateDemande, useCompanySettings } from '@/hooks/useSupabase'
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete'
import { cn } from '@/lib/utils'

type TripType = 'round-trip' | 'one-way' | 'circuit'

const tripTypeLabels: Record<TripType, string> = {
  'round-trip': 'Aller-retour',
  'one-way': 'Aller simple',
  'circuit': 'Circuit',
}

const steps = [
  { id: 1, title: 'Trajets, dates, passagers', icon: MapPin },
  { id: 2, title: 'Infos complémentaires', icon: Info },
  { id: 3, title: 'Coordonnées et compte', icon: User },
]

export function MultiStepQuoteForm() {
  const navigate = useNavigate()
  const createDemande = useCreateDemande()
  const { data: companySettings } = useCompanySettings()
  const formRef = useRef<HTMLDivElement>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [tripType, setTripType] = useState<TripType>('round-trip')
  const [formData, setFormData] = useState({
    // Step 1 - Trajet
    departure: '',
    arrival: '',
    departureDate: '',
    departureTime: '08:00',
    returnDate: '',
    returnTime: '18:00',
    passengers: '',
    circuitDetails: '', // Détails de la mise à disposition pour les circuits

    // Step 2 - Infos complémentaires
    needVehicleAtDestination: false,
    etapes: '',
    luggageType: '',
    equipements: [] as string[],

    // Step 3 - Contact
    voyageType: '',
    name: '',
    phone: '',
    email: '',
    company: '',
  })
  const [success, setSuccess] = useState<{ reference: string; email: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCheckboxArray = (name: 'equipements', value: string) => {
    setFormData(prev => {
      const arr = prev[name]
      if (arr.includes(value)) {
        return { ...prev, [name]: arr.filter(v => v !== value) }
      } else {
        return { ...prev, [name]: [...arr, value] }
      }
    })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Pour les circuits, le détail de mise à disposition est obligatoire
        const baseValidation = !!(formData.departure && formData.arrival && formData.departureDate && formData.passengers)
        if (tripType === 'circuit') {
          return baseValidation && !!formData.circuitDetails.trim()
        }
        return baseValidation
      case 2:
        return true // Optional step
      case 3:
        return !!(formData.name && formData.email && formData.phone && formData.voyageType)
      default:
        return false
    }
  }

  const scrollToForm = () => {
    // Scroll vers le haut du formulaire
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      // Fallback: scroll en haut de la page
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
      scrollToForm()
    } else {
      setError('Veuillez remplir tous les champs obligatoires')
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    scrollToForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateStep(3)) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }

    try {
      // Build notes with additional info (sans les horaires et la société qui sont maintenant des champs séparés)
      const notes = [
        (tripType === 'circuit' || formData.needVehicleAtDestination) && formData.circuitDetails ? `=== DÉTAIL MISE À DISPOSITION ===\n${formData.circuitDetails}\n==============================` : '',
        formData.etapes ? `Étapes: ${formData.etapes}` : '',
        formData.equipements.length > 0 ? `Équipements: ${formData.equipements.join(', ')}` : '',
      ].filter(Boolean).join('\n')

      // Déterminer le trip_mode en fonction des choix
      let tripMode: string
      if (formData.needVehicleAtDestination || tripType === 'circuit') {
        // Mise à disposition (véhicule reste sur place)
        tripMode = 'Aller-Retour avec mise à disposition'
      } else if (tripType === 'one-way') {
        tripMode = 'Aller simple'
      } else {
        // Aller-retour SANS mise à disposition (véhicule repart)
        const isSameDay = formData.departureDate === formData.returnDate
        tripMode = isSameDay ? 'Aller-Retour 1 jour' : 'Aller-Retour sans mise à disposition'
      }

      const result = await createDemande.mutateAsync({
        client_name: formData.name,
        client_email: formData.email,
        client_phone: formData.phone,
        client_company: formData.company || null,
        trip_type: tripType,
        trip_mode: tripMode,
        departure_city: formData.departure,
        arrival_city: formData.arrival,
        departure_date: `${formData.departureDate}T${formData.departureTime}`,
        departure_time: formData.departureTime,
        return_date: tripType !== 'one-way' && formData.returnDate ? `${formData.returnDate}T${formData.returnTime}` : null,
        return_time: tripType !== 'one-way' && formData.returnTime ? formData.returnTime : null,
        passengers: formData.passengers,
        voyage_type: formData.voyageType,
        luggage_type: formData.luggageType || null,
        special_requests: notes || null,
      } as any)

      // Redirection directe vers l'espace client
      navigate(`/mes-devis?ref=${result.reference}&email=${encodeURIComponent(result.client_email)}`)
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      console.error(err)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="text-center py-8 animate-fadeIn">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
          <Check size={40} className="text-white" />
        </div>
        <h3 className="font-display text-2xl font-bold text-purple-dark mb-2">
          Demande envoyée !
        </h3>
        <p className="text-gray-500 mb-4">
          Vous recevrez vos devis personnalisés sous 24h par email.
        </p>

        {/* Estimation prix indicatif */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 mb-6">
          <p className="text-sm text-orange-600 mb-2">Prix moyen estimé</p>
          <p className="text-4xl font-bold text-orange-500 mb-1">
            À partir de 350 €
          </p>
          <p className="text-xs text-orange-400">
            (soit 6.1 € par personne)
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-yellow-500">{'★★★★☆'}</span>
            <span className="text-sm text-gray-500">Indice de confiance</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-700 flex items-center justify-center gap-2">
            <Info size={16} />
            Gagnez du temps et économisez !
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Profitez de notre réseau de +1000 transporteurs pour recevoir rapidement jusqu'à 6 devis
          </p>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Votre numéro de demande : <strong className="text-purple">{success.reference}</strong>
        </p>
        <button
          onClick={() => navigate(`/mes-devis?ref=${success.reference}&email=${encodeURIComponent(success.email)}`)}
          className="btn btn-primary"
        >
          Suivre ma demande
          <ArrowRight size={18} />
        </button>
      </div>
    )
  }

  return (
    <div ref={formRef}>
      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                    isActive
                      ? 'bg-gradient-to-br from-magenta to-purple text-white'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {isCompleted ? <Check size={18} /> : <StepIcon size={18} />}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 text-center max-w-20',
                    isActive ? 'text-purple font-medium' : 'text-gray-400'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 rounded',
                    isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Trajets, dates, passagers */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-display text-lg font-bold text-purple-dark mb-4">
              Votre voyage
            </h3>

            {/* Trip Type Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(Object.keys(tripTypeLabels) as TripType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTripType(type)}
                  className={cn(
                    'flex-1 py-3 rounded-lg text-sm font-medium transition-all',
                    tripType === type
                      ? 'bg-white text-purple shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tripTypeLabels[type]}
                </button>
              ))}
            </div>

            {/* Departure */}
            <div>
              <label className="label">Ville de départ *</label>
              <AddressAutocomplete
                value={formData.departure}
                onChange={(value) => setFormData(prev => ({ ...prev, departure: value }))}
                placeholder="Ex: Paris, Lyon, Marseille..."
              />
            </div>

            {/* Arrival */}
            <div>
              <label className="label">Ville d'arrivée *</label>
              <AddressAutocomplete
                value={formData.arrival}
                onChange={(value) => setFormData(prev => ({ ...prev, arrival: value }))}
                placeholder="Ex: Bordeaux, Nice, Strasbourg..."
              />
            </div>

            {/* Dates & Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date de départ *</label>
                <input
                  type="date"
                  name="departureDate"
                  value={formData.departureDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Heure de départ</label>
                <input
                  type="time"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            {tripType !== 'one-way' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date de retour</label>
                  <input
                    type="date"
                    name="returnDate"
                    value={formData.returnDate}
                    onChange={handleChange}
                    min={formData.departureDate || new Date().toISOString().split('T')[0]}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Heure de retour</label>
                  <input
                    type="time"
                    name="returnTime"
                    value={formData.returnTime}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>
            )}

            {/* Circuit Details - only shown when circuit is selected */}
            {tripType === 'circuit' && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <label className="label text-purple-dark">
                  Détail de la mise à disposition *
                </label>
                <textarea
                  name="circuitDetails"
                  value={formData.circuitDetails}
                  onChange={handleChange}
                  placeholder="Décrivez le programme jour par jour, les étapes, les horaires approximatifs...&#10;&#10;Exemple:&#10;Jour 1: Départ Paris 8h → Visite Château de Chambord → Nuit à Tours&#10;Jour 2: Tours → Bordeaux avec arrêt à Cognac&#10;Jour 3: Bordeaux → Retour Paris"
                  className="input min-h-[140px] text-sm"
                  rows={6}
                />
                <p className="text-xs text-purple-600 mt-2">
                  Plus vous détaillez votre programme, plus les devis seront précis.
                </p>
              </div>
            )}

            {/* Passengers */}
            <div>
              <label className="label">Nombre de passagers *</label>
              <input
                type="number"
                name="passengers"
                value={formData.passengers}
                onChange={handleChange}
                placeholder="Ex: 45"
                min="1"
                max="500"
                className="input"
                required
              />
            </div>
          </div>
        )}

        {/* Step 2: Infos complémentaires */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="font-display text-lg font-bold text-purple-dark mb-4">
              Infos complémentaires
            </h3>

            {/* Need vehicle at destination */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-purple-dark mb-3">
                Une fois arrivé à destination, avez-vous besoin d'utiliser le véhicule ?
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, needVehicleAtDestination: false }))}
                  className={cn(
                    'px-6 py-2 rounded-lg border-2 font-medium transition-all',
                    !formData.needVehicleAtDestination
                      ? 'border-purple bg-purple/5 text-purple'
                      : 'border-gray-200 text-gray-500'
                  )}
                >
                  Non
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, needVehicleAtDestination: true }))}
                  className={cn(
                    'px-6 py-2 rounded-lg border-2 font-medium transition-all',
                    formData.needVehicleAtDestination
                      ? 'border-purple bg-purple/5 text-purple'
                      : 'border-gray-200 text-gray-500'
                  )}
                >
                  Oui
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Le chauffeur vous déposera à destination et reviendra vous chercher pour vous ramener à votre adresse de départ. Le véhicule non immobilisé.
              </p>
            </div>

            {/* Étapes */}
            <div>
              <label className="label">Étapes, arrêts, précisions sur votre voyage</label>
              <p className="text-xs text-gray-500 mb-2">
                Si votre voyage est composé, indiquez les étapes que vous souhaitez, le temps d'arrêts, les pauses repas, les kilométrages... Plus les détails seront précis, plus les devis seront justes.
              </p>
              <textarea
                name="etapes"
                value={formData.etapes}
                onChange={handleChange}
                placeholder="Ne pas indiquer de coordonnées personnelles (email, téléphone, nom, prénom...)"
                className="input min-h-24"
              />
            </div>

            {/* Type de bagages */}
            <div>
              <label className="label">Volume des bagages</label>
              <select
                name="luggageType"
                value={formData.luggageType}
                onChange={handleChange}
                className="input"
              >
                <option value="">Sélectionner</option>
                <option value="aucun">Aucun bagage</option>
                <option value="leger">Léger (sacs à main, petits sacs)</option>
                <option value="moyen">Moyen (valises cabine, sacs de sport)</option>
                <option value="volumineux">Volumineux (grosses valises, équipements)</option>
              </select>
            </div>

            {/* Équipements souhaités */}
            <div>
              <label className="label">Équipements souhaités</label>
              <div className="flex flex-wrap gap-2">
                {['WiFi', 'Prises USB', 'Toilettes', 'Climatisation', 'Écrans', 'Micro'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleCheckboxArray('equipements', item)}
                    className={cn(
                      'px-4 py-2 rounded-lg border text-sm transition-all',
                      formData.equipements.includes(item)
                        ? 'border-purple bg-purple/5 text-purple'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Coordonnées */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <h3 className="font-display text-lg font-bold text-purple-dark mb-4">
              Vos coordonnées
            </h3>

            {/* Type de voyage */}
            <div>
              <label className="label">Type de voyage *</label>
              <select
                name="voyageType"
                value={formData.voyageType}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">Sélectionner</option>
                <option value="scolaire">Sortie scolaire</option>
                <option value="entreprise">Séminaire entreprise</option>
                <option value="mariage">Mariage / Événement</option>
                <option value="sportif">Déplacement sportif</option>
                <option value="touristique">Voyage touristique</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Votre nom *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nom complet"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Société (optionnel)</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Nom de votre société"
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Téléphone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="06 XX XX XX XX"
                className="input"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">
                    Nos conseillers sont disponibles par téléphone
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Pour vous aider à planifier votre voyage et à finaliser votre réservation.
                  </p>
                  <p className="text-sm font-semibold text-blue-700 mt-2">
                    {companySettings?.phone || '01 76 31 12 83'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-secondary flex-1"
            >
              <ArrowLeft size={18} />
              Retour
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary flex-1"
            >
              Étape suivante
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={createDemande.isPending}
              className="btn btn-primary flex-1"
            >
              {createDemande.isPending ? (
                'Envoi en cours...'
              ) : (
                <>
                  Recevoir mes devis gratuits
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-4">
          <Shield size={16} className="text-emerald-500" />
          Gratuit et sans engagement
        </div>
      </form>
    </div>
  )
}
