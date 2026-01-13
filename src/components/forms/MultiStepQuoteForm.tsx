import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ArrowLeft, Check, Shield, MapPin, Calendar, Users, Info, User, Briefcase } from 'lucide-react'
import { useCreateDemande } from '@/hooks/useSupabase'
import { useCurrentCountry } from '@/hooks/useCountrySettings'
import { AddressAutocomplete } from '@/components/ui/AddressAutocomplete'
import { cn } from '@/lib/utils'

type TripType = 'round-trip' | 'one-way' | 'circuit'

export function MultiStepQuoteForm() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const createDemande = useCreateDemande()
  const { data: country } = useCurrentCountry()
  const formRef = useRef<HTMLDivElement>(null)

  // Translated labels
  const tripTypeLabels: Record<TripType, string> = {
    'round-trip': t('quoteForm.roundTrip'),
    'one-way': t('quoteForm.oneWay'),
    'circuit': t('quoteForm.circuit'),
  }

  const steps = [
    { id: 1, title: t('quoteForm.step1'), icon: MapPin },
    { id: 2, title: t('quoteForm.step2'), icon: Info },
    { id: 3, title: t('quoteForm.step3'), icon: User },
  ]

  const equipementLabels: Record<string, string> = {
    'WiFi': t('quoteForm.wifi'),
    'Prises USB': t('quoteForm.prises'),
    'Toilettes': t('quoteForm.wc'),
    'Climatisation': t('quoteForm.clim'),
    'Écrans': t('quoteForm.ecrans'),
    'Micro': t('quoteForm.micro'),
  }

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
      setError(t('validation.required'))
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
      setError(t('validation.required'))
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

      // Déterminer le country_code à partir de la langue
      const langToCountry: Record<string, string> = { fr: 'FR', es: 'ES', de: 'DE', en: 'GB' }
      const countryCode = langToCountry[i18n.language] || 'FR'

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
        country_code: countryCode,
      } as any)

      // Redirection directe vers l'espace client avec le préfixe de langue
      const langPrefix = i18n.language || 'fr'
      navigate(`/${langPrefix}/mes-devis?ref=${result.reference}&email=${encodeURIComponent(result.client_email)}`)
    } catch (err) {
      setError(t('common.error'))
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
          {t('quoteForm.success.title')}
        </h3>
        <p className="text-gray-500 mb-4">
          {t('quoteForm.success.subtitle')}
        </p>

        {/* Estimation prix indicatif */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 mb-6">
          <p className="text-sm text-orange-600 mb-2">{t('quoteForm.success.estimatedPrice')}</p>
          <p className="text-4xl font-bold text-orange-500 mb-1">
            {t('quoteForm.success.from')} 350 €
          </p>
          <p className="text-xs text-orange-400">
            (6.1 € {t('quoteForm.success.perPerson')})
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-yellow-500">{'★★★★☆'}</span>
            <span className="text-sm text-gray-500">{t('quoteForm.success.confidenceIndex')}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-700 flex items-center justify-center gap-2">
            <Info size={16} />
            {t('quoteForm.success.tip')}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {t('quoteForm.success.tipDetails')}
          </p>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          {t('quoteForm.success.reference')} : <strong className="text-purple">{success.reference}</strong>
        </p>
        <button
          onClick={() => navigate(`/${i18n.language || 'fr'}/mes-devis?ref=${success.reference}&email=${encodeURIComponent(success.email)}`)}
          className="btn btn-primary"
        >
          {t('quoteForm.success.trackRequest')}
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
              {t('quoteForm.title')}
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
              <label className="label">{t('quoteForm.departure')} *</label>
              <AddressAutocomplete
                value={formData.departure}
                onChange={(value) => setFormData(prev => ({ ...prev, departure: value }))}
                placeholder={t('quoteForm.departurePlaceholder')}
              />
            </div>

            {/* Arrival */}
            <div>
              <label className="label">{t('quoteForm.arrival')} *</label>
              <AddressAutocomplete
                value={formData.arrival}
                onChange={(value) => setFormData(prev => ({ ...prev, arrival: value }))}
                placeholder={t('quoteForm.arrivalPlaceholder')}
              />
            </div>

            {/* Dates & Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('quoteForm.departureDate')} *</label>
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
                <label className="label">{t('quoteForm.departureTime')}</label>
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
                  <label className="label">{t('quoteForm.returnDate')}</label>
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
                  <label className="label">{t('quoteForm.returnTime')}</label>
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
                  {t('quoteForm.circuitDetails')} *
                </label>
                <textarea
                  name="circuitDetails"
                  value={formData.circuitDetails}
                  onChange={handleChange}
                  placeholder={t('quoteForm.circuitDetailsPlaceholder')}
                  className="input min-h-[140px] text-sm"
                  rows={6}
                />
                <p className="text-xs text-purple-600 mt-2">
                  {t('quoteForm.circuitDetailsHelp')}
                </p>
              </div>
            )}

            {/* Passengers */}
            <div>
              <label className="label">{t('quoteForm.passengers')} *</label>
              <input
                type="number"
                name="passengers"
                value={formData.passengers}
                onChange={handleChange}
                placeholder={t('quoteForm.passengersPlaceholder')}
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
              {t('quoteForm.step2')}
            </h3>

            {/* Need vehicle at destination */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="font-medium text-purple-dark mb-3">
                {t('quoteForm.needVehicle')}
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
                  {t('quoteForm.no')}
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
                  {t('quoteForm.yes')}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t('quoteForm.needVehicleHelp')}
              </p>
            </div>

            {/* Étapes */}
            <div>
              <label className="label">{t('quoteForm.etapes')}</label>
              <p className="text-xs text-gray-500 mb-2">
                {t('quoteForm.etapesHelp')}
              </p>
              <textarea
                name="etapes"
                value={formData.etapes}
                onChange={handleChange}
                placeholder={t('quoteForm.etapesPlaceholder')}
                className="input min-h-24"
              />
            </div>

            {/* Type de bagages */}
            <div>
              <label className="label">{t('quoteForm.luggage')}</label>
              <select
                name="luggageType"
                value={formData.luggageType}
                onChange={handleChange}
                className="input"
              >
                <option value="">{t('quoteForm.select')}</option>
                <option value="aucun">{t('quoteForm.luggageNone')}</option>
                <option value="leger">{t('quoteForm.luggageLight')}</option>
                <option value="moyen">{t('quoteForm.luggageMedium')}</option>
                <option value="volumineux">{t('quoteForm.luggageHeavy')}</option>
              </select>
            </div>

            {/* Équipements souhaités */}
            <div>
              <label className="label">{t('quoteForm.equipements')}</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(equipementLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleCheckboxArray('equipements', key)}
                    className={cn(
                      'px-4 py-2 rounded-lg border text-sm transition-all',
                      formData.equipements.includes(key)
                        ? 'border-purple bg-purple/5 text-purple'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {label}
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
              {t('quoteForm.step3')}
            </h3>

            {/* Type de voyage */}
            <div>
              <label className="label">{t('quoteForm.voyageType')} *</label>
              <select
                name="voyageType"
                value={formData.voyageType}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="">{t('quoteForm.select')}</option>
                <option value="scolaire">{t('quoteForm.voyageTypeScolaire')}</option>
                <option value="entreprise">{t('quoteForm.voyageTypeEntreprise')}</option>
                <option value="mariage">{t('quoteForm.voyageTypeMariage')}</option>
                <option value="sportif">{t('quoteForm.voyageTypeSportif')}</option>
                <option value="touristique">{t('quoteForm.voyageTypeTouristique')}</option>
                <option value="autre">{t('quoteForm.voyageTypeAutre')}</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('quoteForm.name')} *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('quoteForm.namePlaceholder')}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">{t('quoteForm.company')}</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder={t('quoteForm.companyPlaceholder')}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">{t('quoteForm.email')} *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('quoteForm.emailPlaceholder')}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">{t('quoteForm.phone')} *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t('quoteForm.phonePlaceholder')}
                className="input"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-700 font-medium">
                    {t('quoteForm.advisorsAvailable')}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    {t('quoteForm.advisorsHelp')}
                  </p>
                  <p className="text-sm font-semibold text-blue-700 mt-2">
                    {country?.phoneDisplay || '01 76 31 12 83'}
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
              {t('quoteForm.previous')}
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary flex-1"
            >
              {t('quoteForm.next')}
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={createDemande.isPending}
              className="btn btn-primary flex-1"
            >
              {createDemande.isPending ? (
                t('quoteForm.submitting')
              ) : (
                <>
                  {t('quoteForm.submit')}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-4">
          <Shield size={16} className="text-emerald-500" />
          {t('quoteForm.freeNoCommitment')}
        </div>
      </form>
    </div>
  )
}
