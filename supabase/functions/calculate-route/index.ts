import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEOAPIFY_API_KEY = '03be9bc49c6c46a5843e5a27a4f4399b'

interface GeoCoords {
  lat: number
  lon: number
}

async function geocodeCity(city: string): Promise<GeoCoords | null> {
  if (!city) return null
  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)}&lang=fr&limit=1&apiKey=${GEOAPIFY_API_KEY}`
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { departure, arrival } = await req.json()

    if (!departure || !arrival) {
      return new Response(
        JSON.stringify({ error: 'departure et arrival sont requis' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Geocoder les deux villes
    const [depCoords, arrCoords] = await Promise.all([
      geocodeCity(departure),
      geocodeCity(arrival),
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
