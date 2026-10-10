/**
 * Garde d'authentification des Edge Functions appelées par pg_cron ou par
 * l'admin, déployées avec --no-verify-jwt (la passerelle ne filtre plus :
 * c'est ici que l'on décide).
 *
 * Appelants acceptés :
 *  - la clé service_role (appels internes edge→edge, comparée directement :
 *    elle n'est pas forcément un JWT, format sb_secret_…) ;
 *  - un JWT Supabase de rôle service_role ou authenticated (équipe admin
 *    connectée, ex. boutons « Lancer » des pages Automatisations) ;
 *  - le jeton CRON_TOKEN (pg_cron, stocké dans vault sous `cron_token`).
 *
 * Refusés : pas d'en-tête, clé anon (publique), JWT anon.
 */
export function isCronOrAdminCaller(req: Request): boolean {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return false
  const token = auth.slice(7)
  if (!token) return false
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (serviceKey && token === serviceKey) return true
  const cronToken = Deno.env.get('CRON_TOKEN')
  if (cronToken && cronToken.length >= 32 && token === cronToken) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'service_role' || payload.role === 'authenticated'
  } catch {
    return false
  }
}

export function unauthorizedResponse(headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify({ error: 'Appelant non autorisé (cron, service_role ou session admin requis)' }), {
    status: 401,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
