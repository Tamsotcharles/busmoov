import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Mail, RefreshCw, CheckCircle, Clock, AlertCircle, Send, Eye, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface EmailRecord {
  id: string
  to: string[]
  from: string
  subject: string
  created_at: string
  last_event: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  sent: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800', icon: Send },
  delivered: { label: 'Délivré', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  opened: { label: 'Ouvert', color: 'bg-purple-100 text-purple-800', icon: Eye },
  clicked: { label: 'Cliqué', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
  bounced: { label: 'Rebondi', color: 'bg-red-100 text-red-800', icon: XCircle },
  complained: { label: 'Spam', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  delivery_delayed: { label: 'Retardé', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  unknown: { label: 'Inconnu', color: 'bg-gray-100 text-gray-800', icon: Clock },
}

export function EmailHistoryPage() {
  const [emails, setEmails] = useState<EmailRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const loadEmails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-emails', {
        body: null,
      })

      if (fnError) throw fnError
      if (!data.success) throw new Error(data.error)

      setEmails(data.emails || [])
    } catch (err) {
      console.error('Erreur chargement emails:', err)
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadEmails()
  }, [])

  const filteredEmails = emails.filter(email => {
    if (filter === 'all') return true
    return email.last_event === filter
  })

  const stats = {
    total: emails.length,
    delivered: emails.filter(e => e.last_event === 'delivered').length,
    opened: emails.filter(e => e.last_event === 'opened').length,
    bounced: emails.filter(e => e.last_event === 'bounced').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-magenta/10 rounded-lg">
            <Mail className="h-6 w-6 text-magenta" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historique des emails</h1>
            <p className="text-gray-500">Emails envoyés via Resend</p>
          </div>
        </div>
        <button
          onClick={loadEmails}
          disabled={isLoading}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total envoyés</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              <p className="text-sm text-gray-500">Délivrés</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.opened}</p>
              <p className="text-sm text-gray-500">Ouverts</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.bounced}</p>
              <p className="text-sm text-gray-500">Rebonds</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'sent', 'delivered', 'opened', 'bounced'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-magenta text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Tous' : STATUS_CONFIG[status]?.label || status}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Chargement des emails...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun email trouvé</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destinataire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sujet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmails.map((email) => {
                const statusConfig = STATUS_CONFIG[email.last_event] || STATUS_CONFIG.unknown
                const StatusIcon = statusConfig.icon

                return (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(email.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {email.to.join(', ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 line-clamp-1">
                        {email.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusConfig.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
