import { useCallback, useEffect, useState } from 'react'
import { KeyRound, Plus, RefreshCw, ShieldCheck, UserRound, UserX } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn, formatDate } from '@/lib/utils'
import { ROLE_LABELS, initialsFromName, type AdminRole } from '@/lib/roles'

interface TeamUser {
  id: string
  user_id: string | null
  email: string
  name: string | null
  role: AdminRole | null
  initials: string | null
  is_active: boolean | null
  created_at: string | null
}

type ManageAction =
  | { action: 'list' }
  | { action: 'create'; email: string; password: string; name: string; initials: string; role: AdminRole }
  | { action: 'update'; id: string; name?: string; initials?: string; role?: AdminRole; is_active?: boolean }
  | { action: 'set_password'; id: string; password: string }

async function manageUsers<T>(body: ManageAction): Promise<T> {
  const { data, error } = await supabase.functions.invoke('manage-users', { body })
  if (error) {
    // L'erreur métier (400/403) est dans le corps de la réponse.
    let message = error.message
    try {
      const ctx = (error as { context?: Response }).context
      if (ctx) {
        const json = await ctx.json()
        if (json?.error) message = json.error
      }
    } catch {
      // corps illisible : on garde le message générique
    }
    throw new Error(message)
  }
  if (data?.error) throw new Error(data.error)
  return data as T
}

const EMPTY_FORM = { email: '', name: '', initials: '', role: 'manager' as AdminRole, password: '' }

/**
 * Gestion des comptes de l'équipe : création (email + mot de passe saisis par
 * l'admin, aucun email envoyé), rôle, initiales, désactivation.
 */
export function UsersPage() {
  const { user, isFullAdmin, role: myRole } = useAuth()
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await manageUsers<{ users: TeamUser[] }>({ action: 'list' })
      setUsers(res.users || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const flash = (msg: string) => {
    setNotice(msg)
    setTimeout(() => setNotice(null), 4000)
  }

  const run = async (fn: () => Promise<void>, success: string) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      flash(success)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = () =>
    run(async () => {
      await manageUsers({
        action: 'create',
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        initials: (form.initials || initialsFromName(form.name)).toUpperCase(),
        role: form.role,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
    }, 'Compte créé. Communiquez l\'email et le mot de passe à la personne.')

  const handleRole = (u: TeamUser, role: AdminRole) =>
    run(() => manageUsers({ action: 'update', id: u.id, role }).then(() => undefined), `Rôle de ${u.name || u.email} : ${ROLE_LABELS[role]}`)

  const handleToggleActive = (u: TeamUser) => {
    const next = !u.is_active
    if (!next && !confirm(`Désactiver le compte de ${u.name || u.email} ? La personne ne pourra plus se connecter.`)) return
    run(() => manageUsers({ action: 'update', id: u.id, is_active: next }).then(() => undefined), next ? 'Compte réactivé' : 'Compte désactivé')
  }

  const handleInitials = (u: TeamUser) => {
    const value = prompt(`Initiales de ${u.name || u.email} (2 à 4 lettres) :`, u.initials || initialsFromName(u.name || u.email))
    if (value === null) return
    run(() => manageUsers({ action: 'update', id: u.id, initials: value }).then(() => undefined), 'Initiales mises à jour')
  }

  const handleName = (u: TeamUser) => {
    const value = prompt('Nom affiché :', u.name || '')
    if (value === null || !value.trim()) return
    run(() => manageUsers({ action: 'update', id: u.id, name: value }).then(() => undefined), 'Nom mis à jour')
  }

  const handlePassword = (u: TeamUser) => {
    const value = prompt(`Nouveau mot de passe pour ${u.name || u.email} (8 caractères minimum) :`)
    if (value === null) return
    run(() => manageUsers({ action: 'set_password', id: u.id, password: value }).then(() => undefined), 'Mot de passe modifié')
  }

  if (!isFullAdmin) {
    return <div className="card p-6 text-sm text-gray-500">Réservé aux administrateurs.</div>
  }

  const canEdit = (u: TeamUser) => u.role !== 'super_admin' || myRole === 'super_admin'
  const isSelf = (u: TeamUser) => u.user_id === user?.id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-purple-dark">Utilisateurs</h3>
          <p className="text-sm text-gray-500">
            Admin : tout, y compris cette page. Manager : tout sauf Paramètres, Workflow, Templates, Statistiques et SEO.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            <Plus size={16} />
            Nouveau compte
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>}
      {notice && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3">{notice}</div>}

      {showForm && (
        <div className="card p-4 space-y-4 border-2 border-purple/20">
          <p className="text-sm text-gray-600">
            Le compte est actif immédiatement avec ce mot de passe. Aucun email n'est envoyé : transmettez les identifiants vous-même.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="prenom@busmoov.com" />
            </div>
            <div>
              <label className="label">Nom affiché *</label>
              <input type="text" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, initials: form.initials || '' })} placeholder="Prénom Nom" />
            </div>
            <div>
              <label className="label">Initiales (timeline)</label>
              <input
                type="text"
                className="input uppercase"
                maxLength={4}
                value={form.initials}
                onChange={(e) => setForm({ ...form, initials: e.target.value.toUpperCase() })}
                placeholder={initialsFromName(form.name) || 'AB'}
              />
            </div>
            <div>
              <label className="label">Rôle *</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                {myRole === 'super_admin' && <option value="super_admin">Super admin</option>}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Mot de passe * (8 caractères minimum)</label>
              <input type="text" className="input font-mono" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="off" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn btn-secondary" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>Annuler</button>
            <button
              className="btn btn-primary"
              disabled={busy || !form.email || !form.name || form.password.length < 8}
              onClick={handleCreate}
            >
              {busy ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personne</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Initiales</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé le</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-400">Chargement…</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className={cn(!u.is_active && 'opacity-60')}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple text-white text-xs font-bold flex items-center justify-center">
                      {u.initials || initialsFromName(u.name || u.email)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {u.name || '—'}
                        {isSelf(u) && <span className="text-xs text-gray-400">(vous)</span>}
                      </div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button className="text-sm font-mono hover:underline" onClick={() => handleInitials(u)} disabled={busy || !canEdit(u)} title="Modifier les initiales">
                    {u.initials || '—'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {canEdit(u) && !isSelf(u) ? (
                    <select
                      className="input py-1 text-sm w-auto"
                      value={u.role || 'manager'}
                      disabled={busy}
                      onChange={(e) => handleRole(u, e.target.value as AdminRole)}
                    >
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      {myRole === 'super_admin' && <option value="super_admin">Super admin</option>}
                    </select>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm">
                      <ShieldCheck size={14} className="text-purple" />
                      {u.role ? ROLE_LABELS[u.role] : '—'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600')}>
                    {u.is_active ? 'Actif' : 'Désactivé'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{u.created_at ? formatDate(u.created_at) : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button className="btn btn-secondary btn-sm" title="Modifier le nom" onClick={() => handleName(u)} disabled={busy || !canEdit(u)}>
                      <UserRound size={14} />
                    </button>
                    <button className="btn btn-secondary btn-sm" title="Changer le mot de passe" onClick={() => handlePassword(u)} disabled={busy || !canEdit(u)}>
                      <KeyRound size={14} />
                    </button>
                    {!isSelf(u) && (
                      <button
                        className={cn('btn btn-sm', u.is_active ? 'border-red-300 text-red-600 hover:bg-red-50' : 'btn-secondary')}
                        title={u.is_active ? 'Désactiver le compte' : 'Réactiver le compte'}
                        onClick={() => handleToggleActive(u)}
                        disabled={busy || !canEdit(u)}
                      >
                        <UserX size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
