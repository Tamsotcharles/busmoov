// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Domaines autorisés pour CORS
const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'https://busmoov.fr',
  'https://www.busmoov.fr',
  'http://localhost:5173',
  'http://localhost:3000',
]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}

interface ResendEmail {
  id: string
  object: string
  to: string[]
  from: string
  subject: string
  html: string
  text: string
  created_at: string
  last_event: string
}

interface ResendListResponse {
  data: ResendEmail[]
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured')
    }

    // Parse query params
    const url = new URL(req.url)
    const limit = url.searchParams.get('limit') || '50'

    // Fetch emails from Resend API
    const response = await fetch(`https://api.resend.com/emails?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Resend API error:', errorText)
      throw new Error(`Resend API error: ${response.status}`)
    }

    const data: ResendListResponse = await response.json()

    // Fetch detailed info for each email to get status
    const emailsWithDetails = await Promise.all(
      data.data.map(async (email) => {
        try {
          const detailResponse = await fetch(`https://api.resend.com/emails/${email.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
          })

          if (detailResponse.ok) {
            const detail = await detailResponse.json()
            return {
              id: email.id,
              to: email.to,
              from: email.from,
              subject: email.subject,
              created_at: email.created_at,
              last_event: detail.last_event || 'sent',
            }
          }
          return {
            id: email.id,
            to: email.to,
            from: email.from,
            subject: email.subject,
            created_at: email.created_at,
            last_event: 'unknown',
          }
        } catch {
          return {
            id: email.id,
            to: email.to,
            from: email.from,
            subject: email.subject,
            created_at: email.created_at,
            last_event: 'unknown',
          }
        }
      })
    )

    return new Response(
      JSON.stringify({
        success: true,
        emails: emailsWithDetails,
        total: emailsWithDetails.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error fetching emails:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch emails',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
