// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Domaines autorisés pour CORS
const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'http://localhost:5173',
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

// Interface pour les pièces jointes
interface Attachment {
  filename: string
  content: string // Base64 encoded
  contentType: string
}

// Fonction pour créer un JWT pour l'authentification Google
async function createJWT(serviceAccountEmail: string, privateKey: string): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: serviceAccountEmail,
    sub: Deno.env.get('GMAIL_SENDER_EMAIL') || 'infos@busmoov.com',
    scope: 'https://www.googleapis.com/auth/gmail.send',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const encoder = new TextEncoder()
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const signatureInput = `${headerB64}.${payloadB64}`

  // Décoder la clé privée PEM
  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'
  let pemContents = privateKey.replace(pemHeader, '').replace(pemFooter, '').replace(/\s/g, '')

  // Convertir de base64 en ArrayBuffer
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))

  // Importer la clé privée
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  )

  // Signer
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signatureInput)
  )

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${signatureInput}.${signatureB64}`
}

// Fonction pour obtenir un access token Google
async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
  const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n')

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Google credentials not configured')
  }

  const jwt = await createJWT(serviceAccountEmail, privateKey)

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const data = await response.json()
  return data.access_token
}

// Fonction pour créer un email MIME avec pièces jointes
function createMimeMessage(
  to: string,
  subject: string,
  htmlContent: string,
  from: string,
  attachments?: Attachment[]
): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  let message = ''
  message += `From: Busmoov <${from}>\r\n`
  message += `To: ${to}\r\n`
  message += `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=\r\n`
  message += 'MIME-Version: 1.0\r\n'

  if (attachments && attachments.length > 0) {
    // Email multipart avec pièces jointes
    message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`

    // Partie HTML
    message += `--${boundary}\r\n`
    message += 'Content-Type: text/html; charset=UTF-8\r\n'
    message += 'Content-Transfer-Encoding: base64\r\n\r\n'
    message += btoa(unescape(encodeURIComponent(htmlContent))) + '\r\n'

    // Pièces jointes
    for (const attachment of attachments) {
      message += `--${boundary}\r\n`
      message += `Content-Type: ${attachment.contentType}; name="${attachment.filename}"\r\n`
      message += 'Content-Transfer-Encoding: base64\r\n'
      message += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n\r\n`
      message += attachment.content + '\r\n'
    }

    message += `--${boundary}--\r\n`
  } else {
    // Email simple sans pièce jointe
    message += 'Content-Type: text/html; charset=UTF-8\r\n'
    message += 'Content-Transfer-Encoding: base64\r\n\r\n'
    message += btoa(unescape(encodeURIComponent(htmlContent)))
  }

  return message
}

// Fonction pour envoyer un email via Gmail API
async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: Attachment[]
): Promise<void> {
  const accessToken = await getGoogleAccessToken()
  const senderEmail = Deno.env.get('GMAIL_SENDER_EMAIL') || 'infos@busmoov.com'

  const mimeMessage = createMimeMessage(to, subject, htmlContent, senderEmail, attachments)

  // Encoder en base64 URL-safe
  const encodedMessage = btoa(unescape(encodeURIComponent(mimeMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to send email: ${error}`)
  }
}

// Fonction pour charger un template depuis la base de données
async function loadTemplate(supabase: any, templateKey: string): Promise<{ subject: string; body: string } | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('subject, body, html_content')
    .eq('key', templateKey)
    .single()

  if (error || !data) {
    console.error('Template not found:', templateKey)
    return null
  }

  return {
    subject: data.subject,
    body: data.html_content || data.body,
  }
}

// Fonction pour remplacer les variables dans un template
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
    result = result.replace(new RegExp(`{${key}}`, 'g'), value || '')
  }
  return result
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, to, subject, html_content, data, attachments } = await req.json()

    if (!to) {
      throw new Error('Email recipient (to) is required')
    }

    let finalSubject = subject
    let finalBody = html_content

    // Si c'est un email custom, utiliser directement subject et html_content
    if (type === 'custom') {
      if (!subject || !html_content) {
        throw new Error('Subject and html_content are required for custom emails')
      }
      finalSubject = subject
      finalBody = html_content
    } else {
      // Charger le template depuis la base
      const template = await loadTemplate(supabaseClient, type)
      if (!template) {
        throw new Error(`Template not found: ${type}`)
      }

      // Remplacer les variables
      finalSubject = replaceVariables(template.subject, data || {})
      finalBody = replaceVariables(template.body, data || {})
    }

    // Envoyer l'email avec pièces jointes si présentes
    await sendEmail(to, finalSubject, finalBody, attachments)

    console.log(`Email sent successfully to ${to}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
