import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, FileText, ArrowRight, Bus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function EspaceClientPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Chercher le dossier par référence et email
      const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .select('id, reference, client_email, status')
        .eq('reference', reference.toUpperCase())
        .eq('client_email', email.toLowerCase())
        .single()

      if (dossierError || !dossier) {
        setError('Aucun dossier trouvé avec ces informations. Vérifiez votre email et référence.')
        return
      }

      // Stocker les infos en session storage pour l'accès client
      sessionStorage.setItem('client_dossier', JSON.stringify({
        id: dossier.id,
        reference: dossier.reference,
        email: dossier.client_email
      }))

      // Rediriger directement vers la page des devis
      navigate(`/mes-devis?ref=${dossier.reference}&email=${encodeURIComponent(dossier.client_email)}`)
    } catch (err: any) {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-magenta-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="Busmoov" className="w-10 h-10" />
            <span className="font-display text-xl font-bold gradient-text">Busmoov</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 gradient-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <Bus size={40} className="text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-purple-dark mb-2">
              Espace Client
            </h1>
            <p className="text-gray-600">
              Accédez à votre dossier pour suivre vos devis et gérer votre voyage
            </p>
          </div>

          {/* Login form */}
          <div className="card p-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Adresse email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="input pl-12"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  L'email utilisé lors de votre demande de devis
                </p>
              </div>

              <div>
                <label className="label">Référence dossier</label>
                <div className="relative">
                  <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value.toUpperCase())}
                    placeholder="DOS-XXXXXX"
                    className="input pl-12 uppercase"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Référence reçue par email (ex: DOS-ABC123)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full group"
              >
                {loading ? (
                  'Connexion...'
                ) : (
                  <>
                    Accéder à mon dossier
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-500">
                Vous n'avez pas encore de dossier ?
              </p>
              <Link
                to="/"
                className="block text-center text-magenta font-medium mt-2 hover:underline"
              >
                Demander un devis gratuit
              </Link>
            </div>
          </div>

          {/* Help section */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Besoin d'aide ? Contactez-nous à{' '}
              <a href="mailto:infos@busmoov.com" className="text-magenta hover:underline">
                infos@busmoov.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
