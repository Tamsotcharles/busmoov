import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Shield } from 'lucide-react'
import { useCreateDemande } from '@/hooks/useSupabase'
import { cn } from '@/lib/utils'

type TripType = 'round-trip' | 'one-way' | 'circuit'

const tripTypeLabels: Record<TripType, string> = {
  'round-trip': 'Aller-retour',
  'one-way': 'Aller simple',
  'circuit': 'Circuit',
}

export function QuoteForm() {
  const navigate = useNavigate()
  const createDemande = useCreateDemande()

  const [tripType, setTripType] = useState<TripType>('round-trip')
  const [formData, setFormData] = useState({
    departure: '',
    arrival: '',
    departureDate: '',
    returnDate: '',
    passengers: '',
    voyageType: '',
    name: '',
    phone: '',
    email: '',
    circuitDetails: '',
  })
  const [success, setSuccess] = useState<{ reference: string; email: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      // Build special_requests with circuit details if applicable
      const specialRequests = tripType === 'circuit' && formData.circuitDetails
        ? `=== DÉTAIL MISE À DISPOSITION ===\n${formData.circuitDetails}\n==============================`
        : null

      const result = await createDemande.mutateAsync({
        client_name: formData.name,
        client_email: formData.email,
        client_phone: formData.phone,
        trip_type: tripType,
        departure_city: formData.departure,
        arrival_city: formData.arrival,
        departure_date: formData.departureDate,
        return_date: tripType !== 'one-way' ? formData.returnDate : null,
        passengers: formData.passengers,
        voyage_type: formData.voyageType,
        special_requests: specialRequests,
      })

      setSuccess({
        reference: result.reference,
        email: result.client_email,
      })
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      console.error(err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

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
        <p className="text-sm text-gray-400 mb-6">
          Votre numéro de demande : <strong className="text-purple">{success.reference}</strong>
        </p>
        <button
          onClick={() => navigate(`/mes-devis?ref=${success.reference}&email=${encodeURIComponent(success.email)}`)}
          className="btn btn-secondary"
        >
          Suivre ma demande
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="font-display text-xl font-bold text-purple-dark mb-1">
          Recevez vos devis gratuits
        </h2>
        <p className="text-gray-500 text-sm">Réponse sous 24h garantie</p>
      </div>

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

      {/* Location Fields */}
      <div>
        <label className="label">Ville de départ</label>
        <input
          type="text"
          name="departure"
          value={formData.departure}
          onChange={handleChange}
          placeholder="Ex: Paris, Lyon, Marseille..."
          className="input"
          required
        />
      </div>

      <div>
        <label className="label">Ville d'arrivée</label>
        <input
          type="text"
          name="arrival"
          value={formData.arrival}
          onChange={handleChange}
          placeholder="Ex: Bordeaux, Nice, Strasbourg..."
          className="input"
          required
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Date de départ</label>
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
        {tripType !== 'one-way' && (
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
        )}
      </div>

      {/* Circuit Details - only shown when circuit is selected */}
      {tripType === 'circuit' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <label className="label text-purple-dark">Détail de la mise à disposition *</label>
          <textarea
            name="circuitDetails"
            value={formData.circuitDetails}
            onChange={handleChange}
            placeholder="Décrivez le programme jour par jour, les étapes, les horaires..."
            className="input min-h-[100px] text-sm"
            rows={4}
            required
          />
          <p className="text-xs text-purple-600 mt-1">
            Plus vous détaillez, plus les devis seront précis.
          </p>
        </div>
      )}

      {/* Passengers & Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre de passagers</label>
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
        <div>
          <label className="label">Type de voyage</label>
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
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Votre nom</label>
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
          <label className="label">Téléphone</label>
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
      </div>

      <div>
        <label className="label">Email</label>
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

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={createDemande.isPending}
        className="btn btn-primary w-full btn-lg"
      >
        {createDemande.isPending ? (
          'Envoi en cours...'
        ) : (
          <>
            Recevoir mes 3 devis gratuits
            <ArrowRight size={20} />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Shield size={16} className="text-emerald-500" />
        Gratuit et sans engagement • Données sécurisées
      </div>
    </form>
  )
}
