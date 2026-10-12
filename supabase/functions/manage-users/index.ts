// Gestion des comptes de l'équipe (table admin_users + auth.users).
// Réservée aux rôles admin / super_admin, authentifiés par leur JWT.
// Actions : list, create, update, set_password.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://busmoov.com',
  'https://www.busmoov.com',
  'https://busmoov.fr',
  'https://www.busmoov.fr',
  'https://busmoov.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
}

const ROLES = ['super_admin', 'admin', 'manager'] as const
type Role = typeof ROLES[number]

interface AdminUser {
  id: string
  user_id: string | null
  email: string
  name: string | null
  role: Role | null
  initials: string | null
  is_active: boolean | null
  created_at: string | null
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function cleanInitials(value: unknown, fallbackName: string): string {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : ''
  const initials = raw || initialsFromName(fallbackName)
  return initials.slice(0, 4)
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('origin'))
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return reply(401, { error: 'Non autorisé' })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const asCaller = createClient(supabaseUrl, serviceKey, { global: { headers: { Authorization: authHeader } } })
    const admin = createClient(supabaseUrl, serviceKey)

    const { data: { user }, error: userError } = await asCaller.auth.getUser()
    if (userError || !user) return reply(401, { error: 'Utilisateur non authentifié' })

    const { data: caller } = await admin
      .from('admin_users')
      .select('id, user_id, email, name, role, initials, is_active')
      .eq('user_id', user.id)
      .single()
    if (!caller || !caller.is_active || !['admin', 'super_admin'].includes(caller.role)) {
      return reply(403, { error: 'Réservé aux administrateurs' })
    }
    const callerIsSuper = caller.role === 'super_admin'

    const body = await req.json().catch(() => ({}))
    const action = body.action as string

    // ---------------------------------------------------------------- list
    if (action === 'list') {
      const { data, error } = await admin
        .from('admin_users')
        .select('id, user_id, email, name, role, initials, is_active, created_at')
        .order('created_at', { ascending: true })
      if (error) throw error
      return reply(200, { users: data })
    }

    // -------------------------------------------------------------- create
    if (action === 'create') {
      const email = String(body.email || '').trim().toLowerCase()
      const password = String(body.password || '')
      const name = String(body.name || '').trim()
      const role = body.role as Role
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(400, { error: 'Email invalide' })
      if (password.length < 8) return reply(400, { error: 'Mot de passe : 8 caractères minimum' })
      if (!name) return reply(400, { error: 'Nom requis' })
      if (!ROLES.includes(role)) return reply(400, { error: 'Rôle invalide' })
      if (role === 'super_admin' && !callerIsSuper) return reply(403, { error: 'Seul un super admin peut créer un super admin' })
      const initials = cleanInitials(body.initials, name)
      if (initials.length < 2) return reply(400, { error: 'Initiales : 2 à 4 caractères' })

      const { data: existing } = await admin.from('admin_users').select('id').eq('email', email).maybeSingle()
      if (existing) return reply(409, { error: 'Un compte existe déjà avec cet email' })

      // Compte auth : email confirmé d'office, aucun email envoyé à l'utilisateur.
      let userId: string | null = null
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      })
      if (createError) {
        // Email déjà présent dans auth.users (ex. ancien compte) : on le rattache.
        const { data: page } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
        const found = page?.users.find((u) => u.email?.toLowerCase() === email)
        if (!found) return reply(400, { error: createError.message })
        userId = found.id
        await admin.auth.admin.updateUserById(userId, { password, ban_duration: 'none' })
      } else {
        userId = created.user.id
      }

      const { data: row, error: insertError } = await admin
        .from('admin_users')
        .insert({ user_id: userId, email, name, role, initials, is_active: true, created_by: user.id })
        .select('id, user_id, email, name, role, initials, is_active, created_at')
        .single()
      if (insertError) throw insertError
      return reply(200, { user: row })
    }

    // ------------------------------------------------- update / set_password
    if (action === 'update' || action === 'set_password') {
      const id = String(body.id || '')
      const { data: target } = await admin
        .from('admin_users')
        .select('id, user_id, email, name, role, initials, is_active')
        .eq('id', id)
        .single()
      if (!target) return reply(404, { error: 'Compte introuvable' })
      const isSelf = target.user_id === user.id
      if (target.role === 'super_admin' && !callerIsSuper) {
        return reply(403, { error: 'Compte super admin : modifiable par un super admin uniquement' })
      }

      if (action === 'set_password') {
        const password = String(body.password || '')
        if (password.length < 8) return reply(400, { error: 'Mot de passe : 8 caractères minimum' })
        if (!target.user_id) return reply(400, { error: 'Compte sans utilisateur auth' })
        const { error } = await admin.auth.admin.updateUserById(target.user_id, { password })
        if (error) throw error
        return reply(200, { ok: true })
      }

      const patch: Partial<AdminUser> = {}
      if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim()
      if (body.initials !== undefined) {
        const initials = cleanInitials(body.initials, patch.name || target.name || target.email)
        if (initials.length < 2) return reply(400, { error: 'Initiales : 2 à 4 caractères' })
        patch.initials = initials
      }
      if (body.role !== undefined) {
        const role = body.role as Role
        if (!ROLES.includes(role)) return reply(400, { error: 'Rôle invalide' })
        if (isSelf && role !== target.role) return reply(400, { error: 'Vous ne pouvez pas changer votre propre rôle' })
        if (role === 'super_admin' && !callerIsSuper) return reply(403, { error: 'Seul un super admin peut attribuer super admin' })
        patch.role = role
      }
      if (body.is_active !== undefined) {
        const active = !!body.is_active
        if (isSelf && !active) return reply(400, { error: 'Vous ne pouvez pas désactiver votre propre compte' })
        patch.is_active = active
      }
      if (Object.keys(patch).length === 0) return reply(400, { error: 'Rien à modifier' })

      const { data: row, error } = await admin
        .from('admin_users')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, user_id, email, name, role, initials, is_active, created_at')
        .single()
      if (error) throw error

      // Un compte désactivé ne peut plus se connecter du tout.
      if (patch.is_active !== undefined && target.user_id) {
        await admin.auth.admin.updateUserById(target.user_id, {
          ban_duration: patch.is_active ? 'none' : '876000h',
        })
      }
      return reply(200, { user: row })
    }

    return reply(400, { error: `Action inconnue : ${action}` })
  } catch (error) {
    console.error('manage-users:', error)
    return reply(500, { error: error instanceof Error ? error.message : 'Erreur interne' })
  }
})
