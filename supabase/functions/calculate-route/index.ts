import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Domaines autorisés pour CORS
const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'http://localhost:5173', // Dev local
  'http://localhost:3000',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

// Clé API depuis les secrets Supabase
const GEOAPIFY_API_KEY = Deno.env.get('GEOAPIFY_API_KEY') || ''

interface GeoCoords {
  lat: number
  lon: number
}

async function geocodeCity(city: string, countryCode: string = 'fr', lang: string = 'fr'): Promise<GeoCoords | null> {
  if (!city) return null
  try {
    // Construire l'URL avec filtre de pays si spécifié
    const filterParam = countryCode ? `&filter=countrycode:${countryCode}` : ''
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)}&lang=${lang}&limit=1${filterParam}&apiKey=${GEOAPIFY_API_KEY}`
    )
    const data = await response.json()
    if (data.features && data.features.length > 0) {
      const coords = data.features[0].geometry.coordinates
      return { lat: coords[1], lon: coords[0] }
    }
    return null
  } catch (error) {
    console.error('Erreur geocodage:', error)
    return null
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérifier que la clé API est configurée
    if (!GEOAPIFY_API_KEY) {
      console.error('GEOAPIFY_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Service non configuré' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const { departure, arrival, countryCode = 'fr' } = await req.json()

    if (!departure || !arrival) {
      return new Response(
        JSON.stringify({ error: 'departure et arrival sont requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Geocoder les deux villes avec le code pays
    const [depCoords, arrCoords] = await Promise.all([
      geocodeCity(departure, countryCode, countryCode),
      geocodeCity(arrival, countryCode, countryCode),
    ])

    if (!depCoords || !arrCoords) {
      return new Response(
        JSON.stringify({ error: 'Impossible de geocoder les villes', departure, arrival }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Appel API Routing avec mode bus (autocar)
    const response = await fetch(
      `https://api.geoapify.com/v1/routing?waypoints=${depCoords.lat},${depCoords.lon}|${arrCoords.lat},${arrCoords.lon}&mode=bus&apiKey=${GEOAPIFY_API_KEY}`
    )
    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const route = data.features[0]
      const distanceKm = Math.round(route.properties.distance / 1000)
      const tempsConduiteMinutes = Math.round(route.properties.time / 60)

      return new Response(
        JSON.stringify({
          success: true,
          distanceKm,
          tempsConduiteMinutes,
          tempsConduiteHeures: tempsConduiteMinutes / 60,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Aucune route trouvee' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Erreur calculate-route:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
