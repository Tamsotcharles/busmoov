import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { user } = await signIn(email, password)

      // Vérifier si l'utilisateur est admin
      const { data: adminData } = await import('@/lib/supabase').then(m =>
        m.supabase.from('admin_users').select('id').eq('user_id', user.id).eq('is_active', true).single()
      )

      if (!adminData) {
        // Déconnexion si pas admin
        await import('@/lib/supabase').then(m => m.supabase.auth.signOut())
        setError('Accès refusé. Vous n\'êtes pas administrateur.')
        return
      }

      navigate('/admin')
    } catch (err: any) {
      setError(err.message || 'Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8">
          <img src="/logo-icon.svg" alt="Busmoov" className="w-12 h-12" />
          <span className="font-display text-2xl font-bold gradient-text">Busmoov</span>
        </Link>

        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={28} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-purple-dark">
              Espace Administration
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Connectez-vous pour accéder au back-office
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@busmoov.com"
                  className="input pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Mot de passe</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-12"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-magenta">
              ← Retour au site
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Pour créer un compte admin, utilisez la console Supabase
        </p>
      </div>
    </div>
  )
}
