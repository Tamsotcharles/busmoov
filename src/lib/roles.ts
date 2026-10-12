/**
 * Rôles de l'équipe Busmoov (table `admin_users.role`).
 *
 * - `super_admin` : compte générique historique, mêmes droits qu'un admin,
 *   ne peut être modifié que par un super_admin ;
 * - `admin` : tout, y compris la gestion des utilisateurs ;
 * - `manager` : tout sauf Paramètres, Workflow, Templates, Statistiques, SEO.
 */
export type AdminRole = 'super_admin' | 'admin' | 'manager'

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  manager: 'Manager',
}

/** Pages de l'admin interdites aux managers. */
export const MANAGER_HIDDEN_PAGES = ['settings', 'workflow', 'templates', 'stats', 'seo'] as const

export function isFullAdminRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function canAccessPage(role: string | null | undefined, page: string): boolean {
  if (isFullAdminRole(role)) return true
  return !(MANAGER_HIDDEN_PAGES as readonly string[]).includes(page)
}

/** Initiales par défaut à partir d'un nom (« Adrien Valentin » → « AV »). */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
