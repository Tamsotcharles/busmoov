// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

// Interface pour les pièces jointes
interface Attachment {
  filename: string
  content: string // Base64 encoded
  contentType: string
}

// Interface pour la réponse Resend
interface ResendResponse {
  id?: string
  error?: {
    message: string
    name: string
  }
}

// Fonction pour envoyer un email via Resend API
async function sendEmailViaResend(
  to: string | string[],
  subject: string,
  htmlContent: string,
  attachments?: Attachment[]
): Promise<ResendResponse> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!resendApiKey) {
    throw new Error('RESEND_API_KEY not configured')
  }

  const fromEmail = Deno.env.get('EMAIL_FROM') || 'Busmoov <infos@busmoov.com>'

  // Préparer les pièces jointes pour Resend
  const resendAttachments = attachments?.map(att => ({
    filename: att.filename,
    content: att.content, // Resend accepte le base64 directement
  }))

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: htmlContent,
      attachments: resendAttachments,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Resend API error:', data)
    throw new Error(data.error?.message || `Resend API error: ${response.status}`)
  }

  return data
}

// Fonction pour charger un template depuis la base de données
async function loadTemplate(supabase: any, templateKey: string): Promise<{ subject: string; body: string } | null> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('subject, body, html_content')
    .eq('key', templateKey)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    console.error('Template not found:', templateKey, error)
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

  // Remplacer les variables simples {{variable}}
  for (const [key, value] of Object.entries(variables)) {
    const safeValue = value ?? ''
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), safeValue)
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), safeValue)
  }

  // Gérer les conditions Handlebars simples {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
    const value = variables[varName]
    if (value && value !== '' && value !== 'false' && value !== 'null' && value !== 'undefined') {
      return content
    }
    return ''
  })

  // Gérer {{#if variable}}...{{else}}...{{/if}}
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, ifContent, elseContent) => {
    const value = variables[varName]
    if (value && value !== '' && value !== 'false' && value !== 'null' && value !== 'undefined') {
      return ifContent
    }
    return elseContent
  })

  return result
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
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

      // Remplacer les variables même pour les emails custom
      if (data) {
        finalSubject = replaceVariables(finalSubject, data)
        finalBody = replaceVariables(finalBody, data)
      }
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

    // Envoyer l'email via Resend
    const result = await sendEmailViaResend(to, finalSubject, finalBody, attachments)

    console.log(`Email sent successfully to ${to} via Resend (id: ${result.id})`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        id: result.id
      }),
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
