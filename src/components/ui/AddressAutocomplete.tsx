import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { useGeoapifyKey } from '@/hooks/useSupabase'
import { useTranslation } from 'react-i18next'

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

interface GeoapifySuggestion {
  formatted: string
  city?: string
  country?: string
  lat: number
  lon: number
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Rechercher une adresse...',
  className = '',
}: AddressAutocompleteProps) {
  const { i18n } = useTranslation()
  const { data: apiKeyFromDb } = useGeoapifyKey()

  // Fallback direct sur la variable d'environnement si la DB ne retourne rien
  const apiKey = apiKeyFromDb || import.meta.env.VITE_GEOAPIFY_API_KEY || ''
  // Valider la langue - Geoapify n'accepte que les codes ISO valides (fr, en, es, de, etc.)
  const validLangs = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'zh']
  const rawLang = i18n.language?.split('-')[0] || 'fr' // Extraire "fr" de "fr-FR"
  const currentLang = validLangs.includes(rawLang) ? rawLang : 'fr'

  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<GeoapifySuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync with external value
  useEffect(() => {
    setQuery(value)
  }, [value])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchAddresses = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 3) {
      setSuggestions([])
      return
    }

    // If no API key, don't search
    if (!apiKey) {
      console.warn('Geoapify API key not configured')
      return
    }

    setIsLoading(true)
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(searchQuery)}&lang=${currentLang}&limit=5&apiKey=${apiKey}`
      const response = await fetch(url)
      const data = await response.json()

      if (data.features) {
        const results: GeoapifySuggestion[] = data.features.map((feature: any) => ({
          formatted: feature.properties.formatted,
          city: feature.properties.city,
          country: feature.properties.country,
          lat: feature.properties.lat,
          lon: feature.properties.lon,
        }))
        setSuggestions(results)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setQuery(newValue)
    onChange(newValue)

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue)
    }, 300)
  }

  const handleSelectSuggestion = (suggestion: GeoapifySuggestion) => {
    // Toujours utiliser l'adresse complète (formatted) pour les infos voyage
    const selectedValue = suggestion.formatted
    setQuery(selectedValue)
    onChange(selectedValue)
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          className={`input pr-10 ${className}`}
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 size={16} className="text-gray-400 animate-spin" />
          ) : (
            <MapPin size={16} className="text-gray-400" />
          )}
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <MapPin size={16} className="text-magenta mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {suggestion.city || suggestion.formatted.split(',')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {suggestion.formatted}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
