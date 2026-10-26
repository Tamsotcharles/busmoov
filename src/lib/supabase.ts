import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Valeurs par defaut hardcodees pour eviter les problemes de variables d'environnement
const DEFAULT_SUPABASE_URL = 'https://rsxfmokwmwujercgpnfu.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzeGZtb2t3bXd1amVyY2dwbmZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NjU5NTIsImV4cCI6MjA4MjA0MTk1Mn0.OTUBLLy1l92HURVsnk_j6EEb_8UQuH3lSSE3xUGHM1g'

// Utiliser les variables d'environnement si definies et non vides, sinon fallback
const envUrl = import.meta.env.VITE_SUPABASE_URL
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabaseUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : DEFAULT_SUPABASE_URL
const supabaseAnonKey = (envKey && envKey.length > 50) ? envKey : DEFAULT_SUPABASE_ANON_KEY

/**
 * Accès client / fournisseur sans compte : les pages publiques s'identifient
 * par des en-têtes (référence + email du dossier, ou jeton fournisseur) que
 * les policies RLS lisent via current_setting('request.headers'). Sans ces
 * en-têtes, un visiteur anonyme ne voit aucun dossier.
 */
const clientAccessHeaders: Record<string, string> = {}
const isHeaderSafe = (v: string) => /^[\x20-\x7e]*$/.test(v)

export function setClientAccess(access: { reference?: string | null; email?: string | null; token?: string | null }) {
  for (const k of Object.keys(clientAccessHeaders)) delete clientAccessHeaders[k]
  const ref = access.reference?.trim().toUpperCase()
  const email = access.email?.trim().toLowerCase()
  const token = access.token?.trim()
  if (ref && isHeaderSafe(ref)) clientAccessHeaders['x-client-ref'] = ref
  if (email && isHeaderSafe(email)) clientAccessHeaders['x-client-email'] = email
  if (token && isHeaderSafe(token)) clientAccessHeaders['x-validation-token'] = token
}
export const clearClientAccess = () => setClientAccess({})

// Les en-têtes d'accès ne servent qu'aux policies RLS de PostgREST. Les
// Edge Functions (sign-contract, get-client-data, calculate-price…) ont une
// liste CORS fermée : leur envoyer x-client-ref/x-client-email fait échouer
// le preflight du navigateur (« Failed to send a request to the Edge
// Function ») — plus aucune signature possible du 12 au 26 oct. 2026.
const isRestRequest = (input: RequestInfo | URL) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  return url.includes('/rest/v1/')
}

const fetchWithClientAccess: typeof fetch = (input, init) => {
  if (Object.keys(clientAccessHeaders).length === 0 || !isRestRequest(input)) return fetch(input, init)
  const headers = new Headers(init?.headers)
  for (const [k, v] of Object.entries(clientAccessHeaders)) headers.set(k, v)
  return fetch(input, { ...init, headers })
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithClientAccess },
})

/**
 * Client anonyme qui envoie un jeton dans l'en-tête `x-validation-token`.
 * Les policies RLS des pages fournisseur (validation BPA) lisent ce jeton
 * via `current_setting('request.headers')` : sans lui, la demande est invisible.
 */
export const createTokenClient = (token: string) =>
  createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'x-validation-token': token } },
  })

// Helper pour obtenir la session actuelle
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export interface AdminProfile {
  id: string
  email: string
  name: string | null
  role: string | null
  initials: string | null
}

// Profil équipe du compte connecté (null si pas membre actif de admin_users).
// `select('*')` : les colonnes initials/role peuvent manquer tant que la
// migration des rôles n'est pas appliquée, on lit ce qui existe.
export const getAdminProfile = async (): Promise<AdminProfile | null> => {
  const session = await getCurrentSession()
  if (!session) return null

  const { data } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single()
  if (!data) return null
  const row = data as Record<string, unknown>
  return {
    id: String(row.id),
    email: String(row.email || session.user.email || ''),
    name: (row.name as string | null) ?? null,
    role: (row.role as string | null) ?? null,
    initials: (row.initials as string | null) ?? null,
  }
}

// Helper pour vérifier si l'utilisateur est admin
export const checkIsAdmin = async (): Promise<boolean> => {
  return !!(await getAdminProfile())
}
